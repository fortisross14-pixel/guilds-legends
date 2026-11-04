// @ts-check
// Succession, mentors, branches, artifacts, ambitions, retirement and release.
import { LOCATION_BY_ID } from '../../data/world.js';
import { BRANCH_RULES, ambitionMetric, artifactEffectFromPrestige, branchName, defaultAmbitionForHero } from '../legacy.js';
import {
  addChronicle,
  addHeroHistory,
  branchCapacity,
  clamp,
  clearHeroAppointmentInPlace,
  clone,
  commitRng,
  ensureTournamentCareer,
  finalize,
  getHero,
  rngFor,
  uid,
} from './core.js';
import { relationshipEntry } from './heroes.js';
import { refreshCandidatesForLocationInPlace } from './candidates.js';
import { ARTIFACT_PREFIX, artifactAccessoryStats } from '../../data/items.js';
import { addItemsInPlace } from './inventory.js';

export function designateSuccessor(state, heroId) {
  const next = clone(state);
  if ((next.guild?.tierIndex || 0) < 1) return { state, error: 'Formal succession planning unlocks at Champion status.' };
  const hero = getHero(next, heroId);
  if (!hero || ['dead', 'retired'].includes(hero.status)) return { state, error: 'Choose an active hero as successor.' };
  if (hero.id === next.guild.currentGuildmasterHeroId) return { state, error: 'The current guildmaster cannot succeed themselves.' };
  if ((hero.age || 0) < 20) return { state, error: 'A successor must be at least 20 years old.' };
  if ((hero.loyalty || 0) < 45) return { state, error: 'This hero is not loyal enough to accept the succession pact.' };
  const prior = next.guild.successorHeroId ? getHero(next, next.guild.successorHeroId) : null;
  next.guild.successorHeroId = hero.id;
  hero.loyalty = clamp(hero.loyalty + 3, 0, 100);
  if (prior && prior.id !== hero.id) prior.loyalty = clamp(prior.loyalty - 3, 0, 100);
  addHeroHistory(hero, next, { type: 'succession', title: 'Named guildmaster successor', text: `${hero.name} is formally designated to inherit the banner.` });
  addChronicle(next, {
    type: 'succession',
    importance: 3,
    title: `${hero.name} named heir to the guild`,
    text: `${next.guild.name} makes its line of institutional succession public.`,
    heroIds: [hero.id],
    tags: ['succession', 'institution'],
  });
  return { state: finalize(next), error: null };
}

export function assignMentor(state, mentorId, apprenticeId) {
  const next = clone(state);
  const mentor = getHero(next, mentorId);
  const apprentice = getHero(next, apprenticeId);
  if (!mentor || !apprentice || mentor.id === apprentice.id) return { state, error: 'Choose two different active heroes.' };
  if (['dead', 'retired'].includes(mentor.status) || ['dead', 'retired'].includes(apprentice.status))
    return { state, error: 'Mentorship requires active heroes.' };
  if ((mentor.level || 1) < (apprentice.level || 1) + 3 && (mentor.age || 0) < (apprentice.age || 0) + 7)
    return { state, error: 'The mentor needs a meaningful level or experience advantage.' };
  if (apprentice.mentorId) {
    const old = getHero(next, apprentice.mentorId);
    if (old) old.apprenticeIds = (old.apprenticeIds || []).filter((id) => id !== apprentice.id);
  }
  apprentice.mentorId = mentor.id;
  mentor.apprenticeIds ||= [];
  if (!mentor.apprenticeIds.includes(apprentice.id)) mentor.apprenticeIds.push(apprentice.id);
  const aRel = relationshipEntry(apprentice, mentor.id);
  aRel.value = clamp((aRel.value || 0) + 8, -100, 100);
  aRel.label = 'Mentor';
  const mRel = relationshipEntry(mentor, apprentice.id);
  mRel.value = clamp((mRel.value || 0) + 6, -100, 100);
  mRel.label = 'Apprentice';
  addHeroHistory(apprentice, next, { type: 'mentorship', title: `Began studying under ${mentor.name}`, text: `${mentor.name} becomes a formal mentor.` });
  addChronicle(next, {
    type: 'relationship',
    importance: 2,
    title: `${mentor.name} takes ${apprentice.name} as an apprentice`,
    text: 'A new line of institutional knowledge begins inside the guild.',
    heroIds: [mentor.id, apprentice.id],
    tags: ['mentorship'],
  });
  return { state: finalize(next), error: null };
}

export function foundBranch(state, locationId, commanderHeroId) {
  const next = clone(state);
  if (branchCapacity(next) <= 0) return { state, error: 'Branches unlock when the guild reaches Champion status.' };
  next.guild.branches ||= [];
  if (next.guild.branches.filter((branch) => branch.active !== false).length >= branchCapacity(next))
    return { state, error: `Your current status supports only ${branchCapacity(next)} branch${branchCapacity(next) === 1 ? '' : 'es'}.` };
  if (next.guild.branches.some((branch) => branch.locationId === locationId && branch.active !== false))
    return { state, error: 'A branch already operates there.' };
  if (!(next.world?.visitedLocationIds || []).includes(locationId)) return { state, error: 'Visit a settlement before founding a permanent branch there.' };
  if ((next.world?.currentLocationId || 'dunmere') === locationId) return { state, error: 'That settlement already hosts the guild headquarters.' };
  const location = LOCATION_BY_ID[locationId];
  if (!location) return { state, error: 'Unknown branch location.' };
  const commander = getHero(next, commanderHeroId);
  const minLevel = next.guild.tierIndex >= 2 ? BRANCH_RULES.Global.minLevel : BRANCH_RULES.National.minLevel;
  if (!commander || ['dead', 'retired', 'mission', 'tournament'].includes(commander.status))
    return { state, error: 'Choose an available active hero to command the branch.' };
  if ((commander.level || 1) < minLevel) return { state, error: `A branch commander must be at least level ${minLevel}.` };
  const cost = next.guild.tierIndex >= 2 ? BRANCH_RULES.Global.cost : BRANCH_RULES.National.cost;
  if (next.guild.crowns < cost) return { state, error: `Founding a branch requires ${cost} gold.` };
  next.guild.crowns -= cost;
  const rng = rngFor(next, `branch-${locationId}-${commander.id}`);
  const branch = {
    id: uid('branch', rng),
    name: branchName(locationId, next.guild.name),
    locationId,
    commanderHeroId: commander.id,
    foundedYear: next.date.year,
    level: 1,
    fame: 10,
    active: true,
    incomeLastMonth: 0,
  };
  next.guild.branches.push(branch);
  commander.branchId = branch.id;
  commander.monthlyActivity = 'Guild Duty';
  commander.loyalty = clamp(commander.loyalty + 5, 0, 100);
  next.stats.branchesFounded += 1;
  addHeroHistory(commander, next, {
    type: 'branch',
    title: `Founded the ${location.name} branch`,
    text: `${commander.name} becomes the first branch commander.`,
  });
  addChronicle(next, {
    type: 'branch',
    importance: 4,
    title: `${next.guild.name} opens a branch in ${location.name}`,
    text: `${commander.name} takes command of a permanent chapter. Contracts and recruits in ${location.name} can now be handled without relocating headquarters.`,
    heroIds: [commander.id],
    tags: ['branch', location.primal, next.guild.tier],
  });
  refreshCandidatesForLocationInPlace(next, rng, locationId);
  commitRng(next, rng);
  return { state: finalize(next), error: null };
}

export function assignBranchCommander(state, branchId, heroId) {
  const next = clone(state);
  const branch = (next.guild.branches || []).find((item) => item.id === branchId);
  if (!branch) return { state, error: 'Branch not found.' };
  const hero = getHero(next, heroId);
  const minLevel = next.guild.tierIndex >= 2 ? BRANCH_RULES.Global.minLevel : BRANCH_RULES.National.minLevel;
  if (!hero || ['dead', 'retired', 'mission', 'tournament'].includes(hero.status)) return { state, error: 'Choose an available active hero.' };
  if ((hero.level || 1) < minLevel) return { state, error: `A branch commander must be at least level ${minLevel}.` };
  const previous = getHero(next, branch.commanderHeroId);
  if (previous) previous.branchId = null;
  branch.commanderHeroId = hero.id;
  branch.active = true;
  hero.branchId = branch.id;
  hero.monthlyActivity = 'Guild Duty';
  hero.loyalty = clamp(hero.loyalty + 3, 0, 100);
  addHeroHistory(hero, next, { type: 'branch', title: `Took command of ${branch.name}`, text: 'Assigned as permanent branch commander.' });
  addChronicle(next, {
    type: 'branch',
    importance: 2,
    title: `${hero.name} takes command of ${branch.name}`,
    text: 'The chapter resumes full operations beneath a new commander.',
    heroIds: [hero.id],
    tags: ['branch', 'command'],
  });
  return { state: finalize(next), error: null };
}

export function upgradeBranch(state, branchId) {
  const next = clone(state);
  const branch = (next.guild.branches || []).find((item) => item.id === branchId && item.active !== false);
  if (!branch) return { state, error: 'Branch not found.' };
  if (branch.level >= 3) return { state, error: 'This branch is already fully developed.' };
  const cost = 900 * branch.level + 500;
  if (next.guild.crowns < cost) return { state, error: `Branch expansion requires ${cost} gold.` };
  next.guild.crowns -= cost;
  branch.level += 1;
  branch.fame += 8;
  addChronicle(next, {
    type: 'branch',
    importance: 2,
    title: `${branch.name} expands`,
    text: `The branch reaches level ${branch.level}, increasing its local income and scouting reach.`,
    tags: ['branch', 'expansion'],
  });
  return { state: finalize(next), error: null };
}

export function assignArtifact(state, artifactId, heroId = null) {
  const next = clone(state);
  const artifact = (next.artifacts || []).find((item) => item.id === artifactId);
  if (!artifact) return { state, error: 'Artifact not found in the guild collection.' };
  if (artifact.ownerId === heroId) return { state, error: null };
  const previous = artifact.ownerId ? getHero(next, artifact.ownerId) : null;
  if (previous) {
    previous.artifactIds = (previous.artifactIds || []).filter((id) => id !== artifact.id);
    previous.artifactPowerBonus = Math.max(0, (previous.artifactPowerBonus || 0) - (artifact.effect?.bonus || 0));
    if (previous.gear?.accessory === ARTIFACT_PREFIX + artifact.id) {
      previous.gear.accessory = null;
      previous.artifactStats = null;
    }
  }
  artifact.ownerHistory ||= [];
  if (!heroId) {
    artifact.ownerId = null;
    artifact.ownerHistory.unshift({ year: next.date.year, month: next.date.month, heroId: null, heroName: 'Guild Vault', action: 'returned' });
    return { state: finalize(next), error: null };
  }
  const hero = getHero(next, heroId);
  if (!hero || ['dead', 'retired'].includes(hero.status)) return { state, error: 'Choose an active hero to carry the artifact.' };
  artifact.effect ||= artifactEffectFromPrestige(artifact.prestige || 0, artifact.name);
  const hasOwnedBefore = artifact.ownerHistory.some((entry) => entry.heroId === hero.id);
  artifact.ownerId = hero.id;
  hero.artifactIds ||= [];
  if (!hero.artifactIds.includes(artifact.id)) hero.artifactIds.push(artifact.id);
  hero.artifactPowerBonus = (hero.artifactPowerBonus || 0) + artifact.effect.bonus;
  // The artifact is worn in the accessory slot; a regular accessory goes back to the inventory.
  hero.gear ||= { weapon: null, armor: null, accessory: null };
  const worn = hero.gear.accessory;
  if (worn && !worn.startsWith(ARTIFACT_PREFIX)) addItemsInPlace(next, { [worn]: 1 });
  hero.gear.accessory = ARTIFACT_PREFIX + artifact.id;
  hero.artifactStats = artifactAccessoryStats(artifact.prestige || 0);
  if (!hasOwnedBefore) {
    hero.career.artifacts = (hero.career.artifacts || 0) + 1;
    hero.career.artifactPrestige = (hero.career.artifactPrestige || 0) + Math.round((artifact.prestige || 0) * 0.1);
  }
  artifact.ownerHistory.unshift({ year: next.date.year, month: next.date.month, heroId: hero.id, heroName: hero.name, action: 'assigned' });
  addChronicle(next, {
    type: 'artifact',
    importance: (artifact.prestige || 0) >= 70 ? 4 : 2,
    title: `${artifact.name} passes to ${hero.name}`,
    text: `${hero.name} is entrusted with the artifact. ${artifact.effect.label}.`,
    heroIds: [hero.id],
    tags: ['artifact', artifact.effect.domain],
  });
  return { state: finalize(next), error: null };
}

export function inheritAmbition(state, legacyAmbitionId, heroId) {
  const next = clone(state);
  next.legacy ||= { inheritedAmbitions: [], successionHistory: [], rivalInstitutionEvents: [] };
  const record = next.legacy.inheritedAmbitions.find((item) => item.id === legacyAmbitionId && item.status === 'unclaimed');
  if (!record) return { state, error: 'That inherited ambition is no longer available.' };
  const hero = getHero(next, heroId);
  if (!hero || ['dead', 'retired'].includes(hero.status)) return { state, error: 'Choose an active hero to inherit the ambition.' };
  hero.ambitions ||= [];
  const inherited = {
    ...record.ambition,
    id: `${record.ambition.id}-inherited-${hero.id}`,
    status: 'active',
    inheritedFromHeroId: record.fromHeroId,
    inheritedFromHeroName: record.fromHeroName,
    rewardLegacy: Math.round((record.ambition.rewardLegacy || 18) * 1.5),
  };
  hero.ambitions.push(inherited);
  record.status = 'claimed';
  record.claimedByHeroId = hero.id;
  record.claimedYear = next.date.year;
  addHeroHistory(hero, next, { type: 'inherited-will', title: `Inherited ${record.fromHeroName}'s unfinished dream`, text: inherited.label });
  addChronicle(next, {
    type: 'legacy',
    importance: 4,
    title: `${hero.name} takes up ${record.fromHeroName}'s unfinished ambition`,
    text: `${inherited.label}. Completing it will carry extra historical weight.`,
    heroIds: [hero.id, record.fromHeroId],
    tags: ['inherited-will', 'ambition'],
  });
  return { state: finalize(next), error: null };
}

export function retireHeroInPlace(state, hero, rng, reason) {
  if (['dead', 'retired'].includes(hero.status)) return;
  hero.status = 'retired';
  clearHeroAppointmentInPlace(state, hero);
  hero.retiredYear = state.date.year;
  hero.retirementReason = reason;
  hero.legacy += Math.round(hero.renown * 0.7 + hero.career.titles * 15 + hero.career.legendary * 10 + hero.career.missions * 0.8);
  state.stats.retirements += 1;
  state.guild.legacy += Math.max(2, Math.round(hero.legacy * 0.1));
  transferArtifactsFromHeroInPlace(state, hero);
  offerInheritedAmbitionsInPlace(state, hero);
  addHeroHistory(hero, state, {
    type: 'retirement',
    title: 'Retired from active service',
    text: `${hero.name} leaves the field after ${hero.career.serviceYears} years beneath the banner.`,
  });
  addChronicle(state, {
    type: 'retirement',
    importance: hero.legacy >= 80 ? 4 : 2,
    title: `${hero.name} retires`,
    text: `${hero.name} ends a career of ${hero.career.missions} missions, ${hero.career.titles} titles and ${hero.legacy} legacy.`,
    heroIds: [hero.id],
    tags: ['retirement'],
  });
  if (hero.dream && hero.career.legendary === 0 && rng.chance(0.45)) {
    state.flags.inheritedDream = { fromHeroId: hero.id, fromHeroName: hero.name, dream: hero.dream, completed: false };
  }
}

export function evaluateHeroAmbitionsInPlace(state) {
  const all = [...(state.heroes || []), ...(state.historicHeroes || [])];
  all.forEach((hero) => {
    hero.ambitions ||= [];
    if (!hero.ambitions.length && !['dead', 'retired'].includes(hero.status)) hero.ambitions.push(defaultAmbitionForHero(hero, 0));
    hero.ambitions.forEach((ambition) => {
      if (ambition.status !== 'active') return;
      const progress = ambitionMetric(hero, ambition);
      if (progress < ambition.target) return;
      ambition.status = 'completed';
      ambition.completedYear = state.date.year;
      ambition.completedMonth = state.date.month;
      hero.legacy += ambition.rewardLegacy || 18;
      state.guild.legacy += Math.max(4, Math.round((ambition.rewardLegacy || 18) * 0.35));
      state.stats.ambitionsCompleted = (state.stats.ambitionsCompleted || 0) + 1;
      if (ambition.inheritedFromHeroId) state.stats.inheritedAmbitionsCompleted = (state.stats.inheritedAmbitionsCompleted || 0) + 1;
      addHeroHistory(hero, state, {
        type: 'ambition',
        title: `Ambition fulfilled: ${ambition.label}`,
        text: ambition.inheritedFromHeroName
          ? `The unfinished will of ${ambition.inheritedFromHeroName} is finally completed.`
          : 'A personal career ambition enters the permanent record.',
      });
      addChronicle(state, {
        type: 'legacy',
        importance: ambition.inheritedFromHeroId ? 5 : 3,
        title: `${hero.name} fulfills ${ambition.label.toLowerCase()}`,
        text: ambition.inheritedFromHeroName
          ? `${hero.name} completes the ambition inherited from ${ambition.inheritedFromHeroName}.`
          : `${hero.name} turns a private ambition into institutional history.`,
        heroIds: [hero.id, ...(ambition.inheritedFromHeroId ? [ambition.inheritedFromHeroId] : [])],
        tags: ['ambition', ambition.inheritedFromHeroId ? 'inherited-will' : 'career'],
      });
    });
  });
}

export function offerInheritedAmbitionsInPlace(state, hero) {
  state.legacy ||= { inheritedAmbitions: [], successionHistory: [], rivalInstitutionEvents: [] };
  const unfinished = (hero.ambitions || []).filter((ambition) => ambition.status === 'active');
  unfinished.forEach((ambition) => {
    if (
      state.legacy.inheritedAmbitions.some(
        (item) => item.fromHeroId === hero.id && item.ambition?.templateId === ambition.templateId && item.status === 'unclaimed',
      )
    )
      return;
    state.legacy.inheritedAmbitions.unshift({
      id: `inherited-${hero.id}-${ambition.templateId}-${state.date.year}`,
      fromHeroId: hero.id,
      fromHeroName: hero.name,
      ambition: { ...ambition },
      status: 'unclaimed',
      createdYear: state.date.year,
    });
  });
  state.legacy.inheritedAmbitions = state.legacy.inheritedAmbitions.slice(0, 30);
}

export function transferArtifactsFromHeroInPlace(state, hero) {
  const owned = (state.artifacts || []).filter((artifact) => artifact.ownerId === hero.id);
  owned.forEach((artifact) => {
    artifact.effect ||= artifactEffectFromPrestige(artifact.prestige || 0, artifact.name);
    artifact.ownerHistory ||= [];
    artifact.ownerHistory.unshift({
      year: state.date.year,
      month: state.date.month,
      heroId: null,
      heroName: 'Guild Vault',
      action: hero.status === 'dead' ? 'recovered after death' : 'returned after retirement',
    });
    artifact.ownerId = null;
  });
  hero.artifactIds = [];
  hero.artifactPowerBonus = 0;
}

export function ensureGuildmasterInPlace(state) {
  state.guild.currentGuildmasterHeroId ||= state.guild.founderHeroId;
  const current = getHero(state, state.guild.currentGuildmasterHeroId);
  if (current && !['dead', 'retired'].includes(current.status)) return current;
  const designated = state.guild.successorHeroId ? getHero(state, state.guild.successorHeroId) : null;
  const candidates = state.heroes.filter((hero) => !['dead', 'retired'].includes(hero.status));
  const chosen =
    designated && !['dead', 'retired'].includes(designated.status)
      ? designated
      : [...candidates].sort(
          (a, b) =>
            (b.attributes?.Presence || 0) +
            b.loyalty * 0.35 +
            b.legacy * 0.12 +
            b.level * 2 -
            ((a.attributes?.Presence || 0) + a.loyalty * 0.35 + a.legacy * 0.12 + a.level * 2),
        )[0];
  if (!chosen) return null;
  const priorName = current?.name || state.guild.founder;
  state.guild.currentGuildmasterHeroId = chosen.id;
  state.guild.successorHeroId = null;
  chosen.loyalty = clamp(chosen.loyalty + 6, 0, 100);
  chosen.career.leadershipYears ||= 0;
  state.stats.successions = (state.stats.successions || 0) + 1;
  state.legacy ||= { inheritedAmbitions: [], successionHistory: [], rivalInstitutionEvents: [] };
  state.legacy.successionHistory.unshift({
    year: state.date.year,
    month: state.date.month,
    fromHeroId: current?.id || null,
    fromName: priorName,
    toHeroId: chosen.id,
    toName: chosen.name,
  });
  addHeroHistory(chosen, state, {
    type: 'succession',
    title: 'Inherited the guildmaster mantle',
    text: `${chosen.name} becomes guildmaster after ${priorName}.`,
  });
  addChronicle(state, {
    type: 'succession',
    importance: 5,
    title: `${chosen.name} becomes guildmaster`,
    text: `${priorName}'s era ends and ${chosen.name} inherits the banner of ${state.guild.name}.`,
    heroIds: [chosen.id, ...(current?.id ? [current.id] : [])],
    tags: ['succession', 'era'],
  });
  return chosen;
}

export function simulateBranchesInPlace(state, rng) {
  const results = [];
  for (const branch of state.guild.branches || []) {
    if (branch.active === false) continue;
    const commander = getHero(state, branch.commanderHeroId);
    if (!commander || ['dead', 'retired'].includes(commander.status)) {
      branch.active = false;
      addChronicle(state, {
        type: 'branch',
        importance: 3,
        title: `${branch.name} loses its commander`,
        text: 'The chapter suspends field operations until the institution can reestablish a command structure.',
        tags: ['branch', 'inactive'],
      });
      continue;
    }
    const baseIncome = 24 + branch.level * 18 + Math.round((commander.attributes?.Presence || 50) * 0.2);
    const variance = rng.int(-8, 14);
    const income = Math.max(8, baseIncome + variance);
    const upkeep = 14 + branch.level * 9;
    const net = income - upkeep;
    state.guild.crowns += net;
    branch.incomeLastMonth = net;
    branch.fame = Math.max(0, branch.fame + (rng.chance(0.2 + branch.level * 0.06) ? 1 : 0));
    if (rng.chance(0.08 * branch.level)) state.guild.fame += 1;
    if (rng.chance(0.12 + branch.level * 0.08)) refreshCandidatesForLocationInPlace(state, rng, branch.locationId);
    results.push({ branchId: branch.id, name: branch.name, net, commanderId: commander.id });
  }
  return results;
}

// Moves a player hero to the free-agent pool. Career and history travel with
// them, so rivals can sign them later. Used by manual release and debt walkouts.
export function releaseHeroInPlace(state, hero, { title, text, chronicleText }) {
  if (hero.branchId) {
    const branch = (state.guild.branches || []).find((item) => item.id === hero.branchId);
    if (branch) branch.active = false;
    hero.branchId = null;
  }
  clearHeroAppointmentInPlace(state, hero);
  if (state.guild.successorHeroId === hero.id) state.guild.successorHeroId = null;
  if (hero.mentorId) {
    const mentor = state.heroes.find((item) => item.id === hero.mentorId);
    if (mentor) mentor.apprenticeIds = (mentor.apprenticeIds || []).filter((id) => id !== hero.id);
    hero.mentorId = null;
  }
  (hero.apprenticeIds || []).forEach((id) => {
    const apprentice = state.heroes.find((item) => item.id === id);
    if (apprentice?.mentorId === hero.id) apprentice.mentorId = null;
  });
  hero.apprenticeIds = [];
  state.stats.retirements += 1;
  transferArtifactsFromHeroInPlace(state, hero);
  offerInheritedAmbitionsInPlace(state, hero);
  addHeroHistory(hero, state, { type: 'departure', title, text });
  addChronicle(state, {
    type: 'departure',
    importance: 1,
    title: `${hero.name} leaves the guild`,
    text: chronicleText,
    heroIds: [hero.id],
    tags: ['departure', 'free-agent'],
  });
  hero.status = 'free-agent';
  hero.guildId = null;
  hero.monthlyActivity = 'Rest';
  ensureTournamentCareer(hero);
  state.heroes = state.heroes.filter((item) => item.id !== hero.id);
  state.freeAgents ||= [];
  state.freeAgents.push(hero);
}
