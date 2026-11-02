// @ts-check
// Mission resolution: grades, injuries, relationships, rewards, reports, sagas.
import { ONBOARDING_STEPS } from '../../data/content.js';
import { formationForMission } from '../../data/formations.js';
import { LOCATION_BY_ID } from '../../data/world.js';
import { artifactEffectFromPrestige } from '../legacy.js';
import {
  MAX_MISSION_HISTORY,
  addChronicle,
  addHeroHistory,
  appointmentHolder,
  clamp,
  clearHeroAppointmentInPlace,
  clone,
  commitRng,
  completeTutorialTargetInPlace,
  dateLabel,
  finalize,
  getHero,
  rngFor,
  tierIndexByName,
  uid,
} from './core.js';
import { adjustRelationshipInPlace, applyXpInPlace, partyEstimate, roleRating } from './heroes.js';
import { offerInheritedAmbitionsInPlace, transferArtifactsFromHeroInPlace } from './institution.js';
import { evaluateStateInPlace } from './goals.js';
import { queueDueCombatMissionInPlace, queueDueMissionGameInPlace } from './missions.js';

function gradeFromMargin(margin, roll, chance) {
  if (roll < 0.04 && chance >= 25) return 'Legendary';
  if (margin >= 35) return 'Legendary';
  if (margin >= 18) return 'Great Success';
  if (margin >= 0) return 'Success';
  if (margin >= -14) return 'Partial';
  if (margin >= -30) return 'Defeat';
  return 'Catastrophic';
}

function gradeMultiplier(grade) {
  return (
    {
      Legendary: 1.65,
      'Great Success': 1.3,
      Success: 1,
      Partial: 0.58,
      Defeat: 0.12,
      Catastrophic: 0,
    }[grade] ?? 0
  );
}

function injureHero(state, hero, mission, grade, rng, extraRisk = 0) {
  const supportPresent = mission.assignments.some((assignment) => ['Combat Support', 'Field Support', 'Advocate'].includes(assignment.role));
  const infirmary = (state.guild.facilities.infirmary || 0) + (appointmentHolder(state, 'Master Healer') ? 1 : 0);
  const gradeRisk = { Legendary: 0.01, 'Great Success': 0.02, Success: 0.04, Partial: 0.1, Defeat: 0.2, Catastrophic: 0.34 }[grade];
  const baseRisk = gradeRisk + mission.risk * 0.018 + extraRisk - (supportPresent ? 0.025 : 0) - infirmary * 0.012 + (hero.flaw === 'Injury-prone' ? 0.07 : 0);
  if (!rng.chance(clamp(baseRisk, 0.005, 0.7))) return { injured: false, died: false };

  const fatalBase = grade === 'Catastrophic' ? 0.025 + mission.risk * 0.009 : grade === 'Defeat' && mission.risk >= 4 ? 0.008 : 0.001;
  const policyFatalityFactor = 1 + clamp(extraRisk * 4, -0.3, 0.5);
  const fatality = fatalBase * (1 - infirmary * 0.13) * (supportPresent ? 0.72 : 1) * (hero.health < 65 ? 1.4 : 1) * policyFatalityFactor;
  if (rng.chance(clamp(fatality, 0, 0.12))) {
    hero.status = 'dead';
    clearHeroAppointmentInPlace(state, hero);
    hero.deathYear = state.date.year;
    hero.health = 0;
    hero.legacy += 20 + mission.risk * 6;
    state.guild.deaths += 1;
    state.stats.deaths += 1;
    transferArtifactsFromHeroInPlace(state, hero);
    offerInheritedAmbitionsInPlace(state, hero);
    addHeroHistory(hero, state, {
      type: 'death',
      title: `Died during ${mission.title}`,
      text: `The guild recovered ${hero.name}’s name, but not their future.`,
    });
    addChronicle(state, {
      type: 'death',
      importance: 5,
      title: `${hero.name} dies beneath the banner`,
      text: `${hero.name} is killed during ${mission.title}. The guild’s history will divide into before and after this day.`,
      heroIds: [hero.id],
      tags: ['death', mission.family],
    });
    return { injured: true, died: true };
  }

  const injuries = ['Broken ribs', 'Deep blade wound', 'Crushed shoulder', 'Fevered wound', 'Shattered ankle', 'Arcane burn', 'Severe concussion'];
  hero.status = 'injured';
  hero.monthlyActivity = 'Infirmary';
  hero.injury = rng.pick(injuries);
  hero.injuryMonths = rng.int(1, 2 + mission.risk);
  hero.health = clamp(hero.health - rng.int(14, 30), 20, 95);
  hero.career.injuries += 1;
  addHeroHistory(hero, state, {
    type: 'injury',
    title: hero.injury,
    text: `Suffered during ${mission.title}; expected recovery ${hero.injuryMonths} month${hero.injuryMonths === 1 ? '' : 's'}.`,
  });
  return { injured: true, died: false };
}

function assignmentForLegacyCheck(assignments, roleCheck) {
  const equivalents = {
    Captain: ['Commander', 'Negotiation Lead', 'Expedition Lead', 'Mastermind'],
    Vanguard: ['Fighter', 'Delegation Guard', 'Field Support', 'Extraction'],
    Striker: ['Fighter', 'Infiltrator'],
    Support: ['Combat Support', 'Field Support', 'Advocate'],
    Scout: ['Searcher', 'Lookout', 'Infiltrator'],
    Specialist: ['Curator', 'Strategist', 'Mastermind', 'Infiltrator'],
  };
  return assignments.find((assignment) => assignment.role === roleCheck || equivalents[roleCheck]?.includes(assignment.role));
}

function personalityReactionFor(hero, mission, option, grade) {
  const text = `${option.label || ''} ${option.note || ''} ${option.tag || ''}`.toLowerCase();
  let morale = 0;
  let loyalty = 0;
  const reasons = [];
  const likes = (condition, m, l, reason) => {
    if (condition) {
      morale += m;
      loyalty += l;
      reasons.push(reason);
    }
  };
  if (hero.personality === 'Brave')
    likes(
      /heroic|bold|fight|pursu|pressure|ambush/.test(text) || (mission.formationType === 'Combat' && mission.risk >= 3),
      2,
      1,
      'approved of the bold course',
    );
  if (hero.personality === 'Merciful') {
    likes(/mercy|protect|rescue|cure|civilian|spare/.test(text), 3, 1, 'approved of the humane choice');
    likes(/execute|kill|sacrifice|abandon/.test(text), -4, -2, 'was disturbed by the lack of mercy');
  }
  if (hero.personality === 'Honorable') {
    likes(/law|council|temple|evidence|truth|promise|protect/.test(text), 2, 2, 'saw the decision as honorable');
    likes(/steal|blackmail|lie|smuggl|assassin/.test(text), -3, -2, 'disliked the dishonorable method');
  }
  if (hero.personality === 'Obsessive')
    likes(/truth|artifact|clue|evidence|recover|investigat/.test(text) || mission.artifact, 2, 1, 'felt the decision served the deeper objective');
  if (hero.personality === 'Cautious') {
    likes(/protect|fortif|safe|careful|withdraw/.test(text), 2, 1, 'approved of the controlled risk');
    likes(/bait|reckless|dangerous|both rescues/.test(text), -2, -1, 'thought the guild took needless risk');
  }
  if (hero.personality === 'Vain') likes((option.fame || 0) >= 3 || grade === 'Legendary', 2, 1, 'enjoyed the public glory');
  if (hero.personality === 'Patient')
    likes(
      ['Diplomacy', 'Expedition'].includes(mission.formationType) && ['Success', 'Great Success', 'Legendary'].includes(grade),
      1,
      1,
      'valued the patient preparation',
    );
  if (hero.personality === 'Witty')
    likes(mission.formationType === 'Diplomacy' && ['Success', 'Great Success', 'Legendary'].includes(grade), 2, 1, 'thrived in the social contest');
  if (hero.personality === 'Restless') likes(/pursu|push|split|chase|follow/.test(text), 2, 0, 'preferred decisive movement');
  if (hero.flaw === 'Greed') likes((option.reward || 0) >= 60, 2, 0, 'approved of the richer outcome');
  if (hero.flaw === 'Pride') likes(/concede|submit|apolog|surrender/.test(text), -3, -2, 'resented the concession');
  if (hero.flaw === 'Recklessness') likes(/bold|bait|dangerous|pursu/.test(text), 1, 0, 'was energized by the danger');
  if (hero.flaw === 'Cowardice') likes(mission.risk >= 4 && /bold|bait|both|pursu/.test(text), -3, -1, 'was shaken by the risk');
  return { morale, loyalty, text: reasons.join('; ') };
}

function applyTeamRelationshipsInPlace(state, heroIds, grade, option) {
  const changes = [];
  const heroes = heroIds.map((id) => getHero(state, id)).filter(Boolean);
  const base = { Legendary: 3, 'Great Success': 2, Success: 1, Partial: 0, Defeat: -1, Catastrophic: -2 }[grade] || 0;
  for (const hero of heroes) {
    for (const other of heroes) {
      if (hero.id === other.id) continue;
      let delta = base;
      if (hero.personality === 'Jealous' && other.renown >= hero.renown + 15 && base > 0) delta -= 2;
      if (
        hero.personality === 'Merciful' &&
        other.personality === 'Merciful' &&
        /mercy|protect|rescue|cure/.test(`${option.label} ${option.tag}`.toLowerCase())
      )
        delta += 1;
      const changed = adjustRelationshipInPlace(hero, other.id, delta, `${grade} during ${option.label}`);
      if (changed?.delta) changes.push(changed);
    }
  }
  return changes;
}

export function resolveDecision(state, decisionId, optionId, mutate = false) {
  const next = mutate ? state : clone(state);
  const decisionIndex = next.pendingDecisions.findIndex((decision) => decision.id === decisionId);
  if (decisionIndex < 0) return { state, error: 'This decision is no longer pending.' };
  const decision = next.pendingDecisions[decisionIndex];
  const missionIndex = next.activeMissions.findIndex((mission) => mission.id === decision.missionId);
  if (missionIndex < 0) return { state, error: 'The expedition could not be found.' };
  const mission = next.activeMissions[missionIndex];
  const option = decision.options.find((item) => item.id === optionId);
  if (!option) return { state, error: 'Choose one of the available responses.' };

  const rng = rngFor(next, `resolve-${mission.id}-${option.id}`);
  const estimate = partyEstimate(next, mission.id, mission.formationType, mission.assignments);
  let adjustedChance = estimate.chance + (option.power || 0);
  if (next.guild.policies.retreat === 'Never retreat') adjustedChance += 4;
  if (next.guild.policies.retreat === 'Protect the wounded') adjustedChance -= 2;
  if (option.roleCheck) {
    const roleAssignment = assignmentForLegacyCheck(mission.assignments, option.roleCheck);
    if (roleAssignment) adjustedChance += Math.round((roleRating(getHero(next, roleAssignment.heroId), roleAssignment.role) - 55) * 0.2);
    else adjustedChance -= 8;
  }
  adjustedChance = clamp(adjustedChance, 3, 97);
  const forcedGrade = decision.forcedGrade || option.forcedGrade || null;
  const roll = forcedGrade ? Math.max(1, Math.min(99, 100 - adjustedChance)) : rng.next() * 100;
  const margin = adjustedChance - roll;
  const grade = forcedGrade || gradeFromMargin(margin, roll / 100, adjustedChance);
  const success = ['Partial', 'Success', 'Great Success', 'Legendary'].includes(grade);
  const cleanSuccess = ['Success', 'Great Success', 'Legendary'].includes(grade);
  const multiplier = gradeMultiplier(grade);
  let rewardMultiplier =
    next.guild.policies.treasure === 'Equal Shares'
      ? 0.9
      : next.guild.policies.treasure === "Captain's Discretion"
        ? 1.04
        : next.guild.policies.treasure === 'Public Trust'
          ? 0.82
          : 1;
  if (decision.missionGameSummary?.rewardModifier) rewardMultiplier *= decision.missionGameSummary.rewardModifier;
  if (next.guild.alignment === 'Baron' && ['Political Mission', 'War Operation'].includes(mission.family)) rewardMultiplier += 0.1;
  const reward = Math.max(0, Math.round((mission.reward + (option.reward || 0)) * multiplier * rewardMultiplier));
  const rawFame = Math.round((mission.fame + (option.fame || 0)) * multiplier);
  let fameMultiplier = 1 + (next.guild.facilities.archive || 0) * 0.04 + (appointmentHolder(next, 'Chronicler') ? 0.08 : 0);
  if (next.guild.policies.treasure === 'Public Trust') fameMultiplier += 0.18;
  if (next.guild.policies.publicity === 'Heroic') fameMultiplier += 0.12;
  if (next.guild.policies.publicity === 'Private') fameMultiplier -= 0.35;
  if (next.guild.policies.publicity === 'Propaganda') fameMultiplier += cleanSuccess ? 0.25 : 0.4;
  if (next.guild.alignment === 'Council' && ['Rescue', 'Investigation', 'Escort'].includes(mission.family)) fameMultiplier += 0.1;
  if (next.guild.alignment === 'Independent' && ['Exploration', 'Monster Hunt', 'Legend Quest'].includes(mission.family)) fameMultiplier += 0.08;
  const fame = Math.max(
    -8,
    rawFame > 0 ? Math.round(rawFame * Math.max(0.4, fameMultiplier)) : Math.round(rawFame * (next.guild.policies.publicity === 'Propaganda' ? 1.4 : 1)),
  );

  const teamSnapshot = mission.assignments
    .map((assignment) => {
      const hero = getHero(next, assignment.heroId);
      return hero
        ? {
            heroId: hero.id,
            name: hero.name,
            classId: hero.classId,
            role: assignment.role,
            slotId: assignment.slotId,
            primal: hero.primal,
            rarity: hero.rarity,
            level: hero.level,
            power: hero.power,
            roleRating: roleRating(hero, assignment.role),
            form: hero.form,
            fatigueAtResolution: hero.fatigue,
          }
        : null;
    })
    .filter(Boolean);

  const injuries = [];
  const deaths = [];
  const heroEffects = [];
  const expeditionHeroes = mission.assignments.map((assignment) => getHero(next, assignment.heroId)).filter(Boolean);
  const protectedStar = [...expeditionHeroes].sort((a, b) => b.renown - a.renown)[0];

  mission.assignments.forEach((assignment) => {
    const hero = getHero(next, assignment.heroId);
    if (!hero || hero.status === 'dead') return;
    const before = { form: hero.form, morale: hero.morale, loyalty: hero.loyalty, renown: hero.renown, legacy: hero.legacy, health: hero.health };
    hero.career.missions += 1;
    hero.career.earnings += Math.round(reward / mission.assignments.length);
    hero.fatigue = clamp(hero.fatigue + 12 + mission.risk * 5, 0, 100);
    hero.form = clamp(hero.form + (cleanSuccess ? rng.int(2, 7) : grade === 'Partial' ? rng.int(-1, 3) : rng.int(-8, -2)), 25, 96);
    hero.morale = clamp(hero.morale + (cleanSuccess ? rng.int(2, 6) : grade === 'Catastrophic' ? -10 : -3), 15, 100);
    if (next.guild.policies.treasure === 'Equal Shares') {
      hero.morale = clamp(hero.morale + 3, 15, 100);
      hero.loyalty = clamp(hero.loyalty + 1, 0, 100);
    }
    if (next.guild.policies.treasure === "Captain's Discretion")
      hero.loyalty = clamp(hero.loyalty + (['Commander', 'Negotiation Lead', 'Expedition Lead', 'Mastermind'].includes(assignment.role) ? 2 : -1), 0, 100);
    if (next.guild.policies.treasure === 'Public Trust') hero.legacy += 1;
    const personalityReaction = personalityReactionFor(hero, mission, option, grade);
    hero.morale = clamp(hero.morale + personalityReaction.morale, 15, 100);
    hero.loyalty = clamp(hero.loyalty + personalityReaction.loyalty, 0, 100);
    hero.renown = Math.max(0, hero.renown + Math.round(fame / mission.assignments.length) + (grade === 'Legendary' ? 6 : 0));
    hero.legacy += Math.max(0, Math.round(fame * 0.35) + (grade === 'Legendary' ? 12 : 0));
    if (cleanSuccess) hero.career.wins += 1;
    else if (grade === 'Partial') hero.career.partials += 1;
    else hero.career.defeats += 1;
    if (grade === 'Legendary') hero.career.legendary += 1;
    hero.career.fame += Math.max(0, Math.round(fame / mission.assignments.length));
    const xpMultiplier = { Legendary: 1.7, 'Great Success': 1.35, Success: 1, Partial: 0.78, Defeat: 0.52, Catastrophic: 0.34 }[grade] || 0.5;
    const xpGain = Math.round((42 + mission.risk * 18 + mission.duration * 8) * xpMultiplier);
    const levelBefore = hero.level;
    applyXpInPlace(hero, xpGain, next, `${mission.title} (${grade.toLowerCase()})`);
    hero.career.xpEarned = (hero.career.xpEarned || 0) + xpGain;
    if (!hero.career.bestMission || gradeMultiplier(grade) > gradeMultiplier(hero.career.bestMission.grade)) {
      hero.career.bestMission = { title: mission.title, grade, year: next.date.year };
    }
    let policyInjuryRisk = next.guild.policies.retreat === 'Never retreat' ? 0.04 : next.guild.policies.retreat === 'Protect the wounded' ? -0.03 : 0;
    if (next.guild.policies.retreat === 'Preserve the stars') policyInjuryRisk += hero.id === protectedStar?.id ? -0.045 : 0.015;
    const injury = injureHero(next, hero, mission, grade, rng, (option.injury || 0) + policyInjuryRisk);
    if (injury.injured) injuries.push(hero.name);
    if (injury.died) deaths.push(hero.name);
    if (!injury.died && hero.status !== 'injured') hero.status = 'available';
    addHeroHistory(hero, next, {
      type: 'mission-result',
      title: `${grade}: ${mission.title}`,
      text: `${option.label}. Served as ${assignment.role}; earned ${Math.max(0, Math.round(fame / mission.assignments.length))} renown.`,
    });
    heroEffects.push({
      heroId: hero.id,
      name: hero.name,
      role: assignment.role,
      status: hero.status,
      injury: hero.injury,
      formChange: hero.form - before.form,
      moraleChange: hero.morale - before.morale,
      loyaltyChange: hero.loyalty - before.loyalty,
      personalityReaction: personalityReaction.text || null,
      renownChange: hero.renown - before.renown,
      legacyChange: hero.legacy - before.legacy,
      healthChange: hero.health - before.health,
      xpGain,
      levelBefore,
      levelAfter: hero.level,
    });
  });

  const relationshipChanges = applyTeamRelationshipsInPlace(
    next,
    mission.assignments.map((assignment) => assignment.heroId),
    grade,
    option,
  );

  next.guild.crowns += reward;
  next.guild.fame = Math.max(0, next.guild.fame + fame);
  next.guild.legacy += Math.max(
    0,
    Math.round(fame * 0.25) + (grade === 'Legendary' ? 8 : 0) + (next.guild.policies.publicity === 'Private' && cleanSuccess ? 3 : 0),
  );
  if (next.guild.policies.publicity === 'Propaganda' && !success) {
    next.guild.legacy = Math.max(0, next.guild.legacy - 3);
    next.notifications.push({
      id: `scandal-${mission.id}`,
      tone: 'red',
      title: 'The heroic account collapses',
      text: 'Witnesses contradict the guild’s public version of the failed expedition.',
    });
  }
  next.stats.missionsCompleted += 1;
  if (cleanSuccess) {
    next.stats.missionsWon += 1;
    next.guild.wins += 1;
    next.guild.contractsCompleted += 1;
    if (mission.formationType === 'Combat') next.stats.combatWins += 1;
  } else {
    next.stats.missionsLost += 1;
    next.guild.losses += 1;
  }
  if (mission.risk >= 3 && cleanSuccess && injuries.length === 0) next.stats.perfectHardMission += 1;
  if (cleanSuccess && mission.estimateAtLaunch < 40) next.stats.upsets += 1;
  if (option.alignment) {
    next.guild.alignment = option.alignment;
    next.stats.alignmentChosen = 1;
  }
  if (option.rivalry && !next.guild.rivalries.includes(option.rivalry)) {
    next.guild.rivalries.push(option.rivalry);
    next.stats.rivalries += 1;
    const rival = next.rivals.find((item) => item.name === option.rivalry);
    if (rival) rival.hostility = clamp(rival.hostility + 35, 0, 100);
  }
  if (option.obligation) next.guild.obligations.push(option.obligation);
  if (option.clue && mission.saga) progressSagaInPlace(next, mission.saga, option.clue);
  if (mission.saga && cleanSuccess) progressSagaInPlace(next, mission.saga, grade === 'Legendary' ? 2 : 1);
  if (option.tag?.includes('feat') || grade === 'Legendary' || (mission.risk >= 4 && cleanSuccess)) next.stats.signatureFeats += 1;
  if (option.tag === 'mythic-feat') next.stats.mythicFeats += 1;
  if (option.tag === 'inherited-will' && next.flags.inheritedDream && !next.flags.inheritedDream.completed) {
    next.flags.inheritedDream.completed = true;
    next.stats.inheritedWill += 1;
  }

  const workshopLevel = next.guild.facilities.workshop || 0;
  const recoveredMissionArtifact = mission.artifact && (grade === 'Legendary' || (grade === 'Great Success' && rng.chance(0.12 + workshopLevel * 0.1)));
  const artifactName = option.artifact || (recoveredMissionArtifact ? mission.artifact : null);
  if (artifactName && cleanSuccess && !next.artifacts.some((artifact) => artifact.name === artifactName)) {
    const owner = mission.assignments
      .map((assignment) => getHero(next, assignment.heroId))
      .filter(Boolean)
      .sort((a, b) => b.renown - a.renown)[0];
    const prestige = mission.risk * 12 + (grade === 'Legendary' ? 20 : 0);
    const artifact = {
      id: uid('artifact', rng),
      name: artifactName,
      discoveredYear: next.date.year,
      originMission: mission.title,
      ownerId: owner?.id || null,
      legend: `${artifactName} entered the guild vault after ${mission.title}.`,
      prestige,
      effect: artifactEffectFromPrestige(prestige, artifactName),
      ownerHistory: [{ year: next.date.year, month: next.date.month, heroId: owner?.id || null, heroName: owner?.name || 'Guild Vault', action: 'claimed' }],
    };
    next.artifacts.push(artifact);
    if (owner) {
      owner.career.artifacts += 1;
      owner.career.artifactPrestige = (owner.career.artifactPrestige || 0) + prestige;
      owner.legacy += 10;
      owner.artifactIds ||= [];
      owner.artifactIds.push(artifact.id);
      owner.artifactPowerBonus = (owner.artifactPowerBonus || 0) + artifact.effect.bonus;
    }
  }

  const narrative = resultNarrative(mission, option, grade, reward, fame, injuries, deaths);
  const record = {
    id: `mission-record-${mission.id}`,
    kind: 'mission',
    missionId: mission.id,
    templateId: mission.templateId,
    title: mission.title,
    family: mission.family,
    region: mission.region,
    locationId: mission.locationId,
    locationName: mission.locationName || LOCATION_BY_ID[mission.locationId]?.name || mission.region,
    enemyPrimal: mission.enemyPrimal,
    patronPrimal: mission.patronPrimal,
    primalEdge: estimate.primalEdge || 0,
    issuer: mission.issuer,
    risk: mission.risk,
    difficulty: mission.difficulty,
    formationType: mission.formationType || formationForMission(mission),
    startedYear: mission.startedYear,
    startedMonth: mission.startedMonth,
    completedYear: next.date.year,
    completedMonth: next.date.month,
    completedDate: dateLabel(next),
    duration: mission.duration,
    grade,
    reward,
    fame,
    supplyCost: mission.supplyCost,
    estimateAtLaunch: mission.estimateAtLaunch,
    finalChance: adjustedChance,
    roll: Math.round(roll),
    decision: { prompt: decision.prompt, optionId: option.id, label: option.label, note: option.note },
    combat: decision.combatSummary || null,
    missionGame: decision.missionGameSummary || null,
    team: teamSnapshot,
    relationshipChanges,
    heroEffects,
    injuries,
    deaths,
    artifact: artifactName && cleanSuccess ? artifactName : null,
    narrative,
    consequences: [
      option.obligation ? `Obligation: ${option.obligation}` : null,
      option.rivalry ? `Rivalry: ${option.rivalry}` : null,
      option.alignment ? `Alignment: ${option.alignment}` : null,
    ].filter(Boolean),
  };
  next.missionHistory.unshift(record);
  if (next.missionHistory.length > MAX_MISSION_HISTORY) next.missionHistory.length = MAX_MISSION_HISTORY;
  next.pendingReports.unshift({ kind: 'mission', id: record.id });

  addChronicle(next, {
    type: cleanSuccess ? 'victory' : grade === 'Partial' ? 'mixed' : 'defeat',
    importance: grade === 'Legendary' || deaths.length ? 5 : mission.risk >= 3 ? 3 : 2,
    title: `${grade}: ${mission.title}`,
    text: narrative,
    heroIds: mission.assignments.map((assignment) => assignment.heroId),
    tags: [mission.family, grade, option.tag, mission.formationType].filter(Boolean),
    facts: { grade, reward, fame, chance: adjustedChance, roll: Math.round(roll), option: option.label },
    missionRecordId: record.id,
  });

  next.notifications.push({
    id: `result-${mission.id}`,
    tone: cleanSuccess ? 'green' : grade === 'Partial' ? 'gold' : 'red',
    title: `${grade}: ${mission.title}`,
    text: `${reward} crowns · ${fame >= 0 ? '+' : ''}${fame} fame${injuries.length ? ` · ${injuries.length} injured` : ''}`,
  });
  next.activeMissions.splice(missionIndex, 1);
  next.pendingDecisions.splice(decisionIndex, 1);
  if (!next.pendingDecisions.length) {
    queueDueCombatMissionInPlace(next);
    queueDueMissionGameInPlace(next);
  }
  if (!next.tutorial.completed && ONBOARDING_STEPS[next.tutorial.step]?.target === 'resolveChoice') completeTutorialTargetInPlace(next, 'resolveChoice');
  commitRng(next, rng);
  evaluateStateInPlace(next);
  return { state: finalize(next), error: null, result: record };
}

function resultNarrative(mission, option, grade, reward, fame, injuries, deaths) {
  const opening = {
    Legendary: `The decision to “${option.label}” becomes the version sung in halls far beyond ${mission.region}.`,
    'Great Success': `The party executes “${option.label}” with authority and returns in triumph.`,
    Success: `The plan holds. The central objective is achieved without changing the age.`,
    Partial: `The mission succeeds in part, but the guild pays for every compromise.`,
    Defeat: `The party survives a failed attempt and returns with hard questions.`,
    Catastrophic: `The expedition collapses around the choice to “${option.label}.”`,
  }[grade];
  const consequence = deaths.length
    ? ` ${deaths.join(', ')} ${deaths.length === 1 ? 'does' : 'do'} not return.`
    : injuries.length
      ? ` ${injuries.join(', ')} return wounded.`
      : ' Every hero returns alive.';
  return `${opening}${consequence} The guild receives ${reward} crowns and ${fame} fame.`;
}

export function acknowledgeReport(state, reference) {
  const next = clone(state);
  const id = typeof reference === 'string' ? reference : reference?.id;
  next.pendingReports = (next.pendingReports || []).filter((item) => item.id !== id);
  completeTutorialTargetInPlace(next, 'viewMissionReport');
  return finalize(next);
}

function progressSagaInPlace(state, sagaId, amount) {
  const saga = state.sagas.find((item) => item.id === sagaId);
  if (!saga || saga.completed) return;
  saga.discovered = true;
  saga.progress = Math.min(saga.stages, saga.progress + amount);
  if (saga.progress >= saga.stages) {
    saga.completed = true;
    state.stats.signatureFeats += 1;
    state.guild.legacy += 40 + tierIndexByName(saga.tier) * 20;
    addChronicle(state, {
      type: 'saga',
      importance: 5,
      title: `${saga.id} concludes`,
      text: `The guild’s choices become the accepted ending of ${saga.id}.`,
      tags: ['saga', 'signature-feat'],
    });
  }
}
