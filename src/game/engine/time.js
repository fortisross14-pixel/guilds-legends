// @ts-check
// The monthly and annual loop: council activities, aging, advanceMonths.
import { normalizeClassId, MONTHS, ONBOARDING_STEPS } from '../../data/content.js';
import { LOCATIONS, unlockedLocations } from '../../data/world.js';
import {
  MAX_HEROES,
  activeHeroCount,
  addChronicle,
  addHeroHistory,
  appointmentHolder,
  clamp,
  clone,
  commitRng,
  compactHero,
  completeTutorialTargetInPlace,
  ensureTournamentCareer,
  finalize,
  getCurrentLocation,
  getHero,
  rngFor,
} from './core.js';
import { applyXpInPlace, calculatePower, generateHero } from './heroes.js';
import { makeCandidate, refreshCandidatesForLocationInPlace, updatePromiseDeadlinesInPlace } from './candidates.js';
import { refreshMissionsInPlace } from './universe.js';
import { ensureGuildmasterInPlace, evaluateHeroAmbitionsInPlace, retireHeroInPlace, simulateBranchesInPlace } from './institution.js';
import { evaluateStateInPlace } from './goals.js';
import { applyDebtInPlace, monthlyUpkeep, progressTravelInPlace } from './economy.js';
import { createTournamentsInPlace, simulateScheduledCompetitionsInPlace } from './guildTournaments.js';
import { queueDueCombatMissionInPlace, queueDueMissionGameInPlace } from './missions.js';
import { runAiTransferMarketInPlace, simulateRivalInstitutionsInPlace, simulateRivals } from './rivals.js';

function resolveMonthlyHeroActivities(state, rng) {
  const trainingLevel = state.guild.facilities['training-yard'] || 0;
  const trainingMaster = appointmentHolder(state, 'Training Master');
  const infirmaryLevel = (state.guild.facilities.infirmary || 0) + (appointmentHolder(state, 'Master Healer') ? 1 : 0);
  const results = [];
  let scouts = 0;
  let exhibitionFame = 0;

  state.heroes.forEach((hero) => {
    if (['dead', 'retired'].includes(hero.status)) return;
    if (hero.status === 'mission') {
      results.push({ heroId: hero.id, name: hero.name, activity: 'Mission', icon: '⌖', summary: 'Deployed on an active mission.' });
      return;
    }
    if (hero.status === 'tournament') {
      results.push({ heroId: hero.id, name: hero.name, activity: 'Tournament', icon: '♛', summary: 'Committed to an active tournament.' });
      return;
    }

    const requested = hero.monthlyActivity || (hero.status === 'injured' ? 'Infirmary' : 'Training');
    const activity = hero.status === 'injured' && !['Infirmary', 'Rest'].includes(requested) ? 'Infirmary' : requested;
    const before = {
      level: hero.level,
      xp: hero.xp || 0,
      careerXp: hero.career.xpEarned || 0,
      health: hero.health,
      fatigue: hero.fatigue,
      renown: hero.renown,
      loyalty: hero.loyalty,
    };
    let summary = '';

    if (hero.status === 'injured') {
      const treatmentBonus = activity === 'Infirmary' ? 1 + Math.floor(infirmaryLevel / 2) : 0;
      hero.injuryMonths -= 1 + treatmentBonus + (infirmaryLevel >= 3 && rng.chance(0.25) ? 1 : 0);
      hero.health = clamp(hero.health + 5 + infirmaryLevel * 3 + (activity === 'Infirmary' ? 5 : 0), 0, 100);
      hero.fatigue = clamp(hero.fatigue - (activity === 'Rest' ? 18 : 14), 0, 100);
      if (hero.injuryMonths <= 0) {
        hero.status = 'available';
        hero.injury = null;
        hero.health = Math.max(hero.health, 72);
        state.notifications.push({
          id: `recover-${hero.id}-${state.date.year}-${state.date.month}`,
          tone: 'green',
          title: `${hero.name} returns`,
          text: 'Recovery is complete and the hero is available again.',
        });
        addHeroHistory(hero, state, { type: 'recovery', title: 'Returned from injury', text: 'Cleared by the guild infirmary.' });
        summary = 'Cleared from injury and returned to active duty.';
      } else {
        summary = `${activity === 'Infirmary' ? 'Treated in the infirmary' : 'Rested'}; ${Math.max(1, hero.injuryMonths)} month${hero.injuryMonths === 1 ? '' : 's'} of recovery remain.`;
      }
    } else if (activity === 'Rest') {
      hero.fatigue = clamp(hero.fatigue - (24 + infirmaryLevel * 2), 0, 100);
      hero.health = clamp(hero.health + 7 + infirmaryLevel, 0, 100);
      hero.form = clamp(hero.form + 1, 35, 92);
      summary = 'Recovered health and fatigue.';
    } else if (activity === 'Infirmary') {
      hero.fatigue = clamp(hero.fatigue - (18 + infirmaryLevel * 2), 0, 100);
      hero.health = clamp(hero.health + 11 + infirmaryLevel * 3, 0, 100);
      const xp = Math.max(1, 2 + infirmaryLevel);
      applyXpInPlace(hero, xp, state, 'rehabilitation');
      hero.career.xpEarned = (hero.career.xpEarned || 0) + xp;
      summary = `Rehabilitated under medical supervision and gained ${xp} XP.`;
    } else if (activity === 'Scouting') {
      scouts += 1 + (['Ranger', 'Rogue'].includes(hero.classId) ? 1 : 0);
      const xp = 4 + (state.guild.facilities['scout-office'] || 0) * 2;
      applyXpInPlace(hero, xp, state, 'field scouting');
      hero.career.xpEarned = (hero.career.xpEarned || 0) + xp;
      hero.fatigue = clamp(hero.fatigue + 3, 0, 100);
      hero.roleExperience.Scout = (hero.roleExperience.Scout || 0) + 1;
      summary = `Searched the local region and gained ${xp} XP.`;
    } else if (activity === 'Public Exhibition') {
      const fame = rng.int(1, 3) + (normalizeClassId(hero.classId) === 'Scholar' ? 1 : 0);
      state.guild.fame += fame;
      exhibitionFame += fame;
      hero.renown += rng.int(1, 2);
      hero.fatigue = clamp(hero.fatigue + 4, 0, 100);
      const xp = 3;
      applyXpInPlace(hero, xp, state, 'public exhibition');
      hero.career.xpEarned = (hero.career.xpEarned || 0) + xp;
      summary = `Earned ${fame} guild fame and increased personal renown.`;
    } else if (activity === 'Guild Duty') {
      const appointed = Boolean(hero.appointment);
      hero.loyalty = clamp(hero.loyalty + (appointed ? 2 : 1), 0, 100);
      const xp = appointed ? 4 : 2;
      applyXpInPlace(hero, xp, state, 'guild duty');
      hero.career.xpEarned = (hero.career.xpEarned || 0) + xp;
      if (appointed && rng.chance(0.22)) state.guild.legacy += 1;
      summary = appointed
        ? `Worked as ${hero.appointment}; loyalty and institutional experience improved.`
        : 'Handled routine guild work and strengthened loyalty.';
    } else {
      hero.fatigue = clamp(hero.fatigue - (7 + infirmaryLevel), 0, 100);
      hero.health = clamp(hero.health + 2 + infirmaryLevel, 0, 100);
      hero.form = clamp(hero.form + rng.int(-2, 2), 35, 92);
      const focusBonus = { Fundamentals: 1, 'Role Drills': 2, Sparring: 3, Mentorship: 2, Study: 2 }[hero.training] || 1;
      const fatiguePenalty = hero.training === 'Sparring' ? 5 : hero.training === 'Role Drills' ? 2 : 1;
      const mentor = hero.mentorId ? getHero(state, hero.mentorId) : null;
      const mentorBonus =
        mentor && !['dead', 'retired', 'mission', 'tournament'].includes(mentor.status)
          ? Math.max(1, Math.min(4, Math.floor(((mentor.level || 1) - (hero.level || 1)) / 3) + 1))
          : 0;
      const xp = Math.max(
        2,
        5 + trainingLevel * 2 + focusBonus + (trainingMaster && trainingMaster.id !== hero.id ? 2 : 0) + mentorBonus - Math.floor(hero.level / 8),
      );
      applyXpInPlace(hero, xp, state, `${hero.training.toLowerCase()} training`);
      hero.career.xpEarned = (hero.career.xpEarned || 0) + xp;
      hero.fatigue = clamp(hero.fatigue + fatiguePenalty, 0, 100);
      summary = `${hero.training} training produced ${xp} XP${mentorBonus ? `, including ${mentorBonus} from ${mentor.name}'s mentorship` : ''}.`;
    }

    results.push({
      heroId: hero.id,
      name: hero.name,
      activity,
      icon: { Training: '⚔', Rest: '☾', Infirmary: '✚', Scouting: '⌖', 'Public Exhibition': '✦', 'Guild Duty': '♜' }[activity] || '◆',
      summary,
      levelBefore: before.level,
      levelAfter: hero.level,
      xpDelta: Math.max(0, (hero.career.xpEarned || 0) - before.careerXp),
      healthDelta: hero.health - before.health,
      fatigueDelta: hero.fatigue - before.fatigue,
      renownDelta: hero.renown - before.renown,
      loyaltyDelta: hero.loyalty - before.loyalty,
    });
  });

  if (scouts > 0) {
    const locationId = state.world?.currentLocationId || 'dunmere';
    const extraCandidateChance = clamp(0.2 + scouts * 0.12 + (state.guild.facilities['scout-office'] || 0) * 0.08, 0, 0.85);
    if (rng.chance(extraCandidateChance)) {
      const candidate = makeCandidate(state, rng, scouts >= 3 ? 'veteran' : null, locationId);
      candidate.expiresYear = state.date.year + 1;
      state.candidates.push(candidate);
      state.notifications.push({
        id: `scout-recruit-${candidate.id}`,
        tone: 'blue',
        title: 'Scouts found new talent',
        text: `${candidate.name}, a ${candidate.rarity} ${candidate.classId}, has appeared in the local market.`,
      });
    }
  }

  return { results, scouts, exhibitionFame };
}

function ageHeroes(state, rng) {
  state.heroes.forEach((hero) => {
    if (['dead', 'retired'].includes(hero.status)) return;
    hero.age += 1;
    hero.career.serviceYears = Math.max(0, state.date.year - hero.joinedYear);
    if (hero.age >= 35) {
      const declineChance = clamp(0.08 + (hero.age - 35) * 0.025, 0.08, 0.6);
      if (rng.chance(declineChance)) {
        const physical = rng.pick(['Might', 'Finesse', 'Endurance']);
        hero.attributes[physical] = clamp(hero.attributes[physical] - rng.int(1, 2), 20, 99);
        hero.power = calculatePower(hero.attributes);
      }
    }
    if (!['available', 'injured'].includes(hero.status)) return;
    const retirementChance = hero.age < 36 ? 0 : clamp(0.03 + (hero.age - 36) * 0.035 + hero.career.injuries * 0.01 - hero.loyalty * 0.0008, 0.01, 0.65);
    if (rng.chance(retirementChance)) retireHeroInPlace(state, hero, rng, 'voluntary');
  });

  const archiveNpc = (hero, guildName) => {
    hero.status = 'retired';
    hero.retiredYear = state.date.year;
    hero.career.serviceYears = Math.max(hero.career.serviceYears || 0, state.date.year - (hero.joinedYear || state.date.year));
    hero.legacy += Math.round((hero.renown || 0) * 0.25 + (hero.career.titles || 0) * 10);
    if ((hero.career.titles || 0) > 0 || hero.legacy >= 90 || hero.renown >= 80) {
      hero.hook = `${hero.name} completed a career with ${guildName}, winning ${hero.career.titles || 0} titles.`;
      state.worldHistoricHeroes.push(compactHero(hero));
    }
  };

  state.rivals.forEach((rival) => {
    const roster = [rival.star, ...(rival.members || [])].filter(Boolean);
    roster.forEach((hero) => {
      hero.age += 1;
      hero.career.serviceYears = (hero.career.serviceYears || 0) + 1;
      if (hero.age >= 36 && rng.chance(clamp(0.025 + (hero.age - 36) * 0.045, 0.02, 0.75))) archiveNpc(hero, rival.name);
    });
    let survivors = roster.filter((hero) => hero.status !== 'retired');
    const desired = rival.tierIndex === 2 ? 7 : rival.tierIndex === 1 ? 6 : 5;
    while (survivors.length < desired) {
      const replacement = ensureTournamentCareer(
        generateHero(state, rng, rival.tierIndex === 2 ? 'elite' : rival.tierIndex === 1 ? 'veteran' : 'normal', {
          guildId: rival.id,
          homeLocationId: rival.homeLocationId,
        }),
      );
      replacement.status = 'active';
      replacement.specializations.tournament = rng.chance(0.22) ? rng.int(4, 9) : rng.int(0, 3);
      survivors.push(replacement);
    }
    survivors.sort(
      (a, b) => b.power + b.renown * 0.08 + (b.specializations?.tournament || 0) - (a.power + a.renown * 0.08 + (a.specializations?.tournament || 0)),
    );
    const formerStar = rival.star;
    rival.star = survivors[0];
    rival.members = survivors.slice(1);
    if (formerStar?.id !== rival.star.id) {
      addChronicle(state, {
        type: 'rival',
        importance: 2,
        title: `${rival.star.name} becomes the face of ${rival.name}`,
        text: `${formerStar?.name || 'The prior captain'} yields the public role after a change of generation.`,
        heroIds: [rival.star.id],
        guildIds: [rival.id],
        tags: ['rival', 'succession'],
      });
    }
  });

  state.freeAgents = (state.freeAgents || []).filter((hero) => {
    hero.age += 1;
    hero.career.serviceYears = (hero.career.serviceYears || 0) + 1;
    if (hero.age > 39 && rng.chance(clamp(0.1 + (hero.age - 39) * 0.1, 0.1, 0.8))) {
      archiveNpc(hero, 'the open circuit');
      return false;
    }
    return true;
  });
  const annualFreeAgents = 2 + state.guild.tierIndex;
  for (let index = 0; index < annualFreeAgents; index += 1) {
    const location = rng.pick(LOCATIONS);
    const hero = ensureTournamentCareer(
      generateHero(state, rng, rng.chance(0.12) ? 'elite' : rng.chance(0.34) ? 'veteran' : 'normal', { guildId: null, homeLocationId: location.id }),
    );
    hero.status = 'free-agent';
    hero.guildId = null;
    hero.specializations.tournament = rng.chance(0.3) ? rng.int(4, 10) : rng.int(0, 3);
    state.freeAgents.push(hero);
  }
  runAiTransferMarketInPlace(state, rng);
  state.freeAgents.sort((a, b) => b.renown + b.power - (a.renown + a.power));
  state.freeAgents = state.freeAgents.slice(0, 40);
  state.worldHistoricHeroes = (state.worldHistoricHeroes || []).sort((a, b) => b.legacy - a.legacy).slice(0, 250);
}

function annualCycle(state, rng) {
  state.stats.yearsPlayed += 1;
  state.universeStats.seasonsSimulated = (state.universeStats.seasonsSimulated || 0) + 1;
  ageHeroes(state, rng);
  const guildmaster = ensureGuildmasterInPlace(state);
  if (guildmaster) guildmaster.career.leadershipYears = (guildmaster.career.leadershipYears || 0) + 1;
  simulateRivalInstitutionsInPlace(state, rng);
  evaluateHeroAmbitionsInPlace(state);
  state.rivals.forEach((rival) => {
    rival.seasonPoints = 0;
  });
  state.candidates = (state.candidates || []).filter((candidate) => candidate.expiresYear >= state.date.year);
  const locations = unlockedLocations(state.guild.tierIndex);
  locations.forEach((location) => {
    const intake = 1 + (location.id === state.world?.currentLocationId ? 1 : 0) + Math.min(1, state.guild.facilities.academy || 0);
    for (let i = 0; i < intake; i += 1) state.candidates.push(makeCandidate(state, rng, null, location.id));
  });
  refreshCandidatesForLocationInPlace(state, rng, state.world?.currentLocationId || 'dunmere');
  createTournamentsInPlace(state, rng);
  archiveOldHeroesInPlace(state);
  addChronicle(state, {
    type: 'year',
    importance: 1,
    title: `Year ${state.date.year} begins in ${getCurrentLocation(state).name}`,
    text: `${state.guild.name} enters the year ranked #${state.guild.rank} in its current ladder, with ${state.guild.fame} fame, ${activeHeroCount(state)} active heroes and ${locations.length} reachable locations.`,
    tags: ['year'],
  });
}

function archiveOldHeroesInPlace(state) {
  if (state.heroes.length <= MAX_HEROES) return;
  const archival = state.heroes
    .filter((hero) => ['retired', 'dead'].includes(hero.status) && state.date.year - (hero.retiredYear || hero.deathYear || state.date.year) > 8)
    .sort((a, b) => b.legacy - a.legacy);
  while (state.heroes.length > MAX_HEROES && archival.length) {
    const hero = archival.pop();
    state.historicHeroes.push(compactHero(hero));
    state.heroes = state.heroes.filter((item) => item.id !== hero.id);
  }
  if (state.historicHeroes.length > 800) {
    state.historicHeroes.sort((a, b) => b.legacy - a.legacy);
    state.historicHeroes.length = 800;
  }
}

export function advanceMonths(state, count = 1, mutate = false) {
  if (state.activeEncounter) return { state, error: 'Conclude the active combat before advancing time.' };
  if (state.activeMissionGame) return { state, error: 'Conclude the active mission challenge before advancing time.' };
  if (state.pendingDecisions.length) return { state, error: 'Resolve the critical decision before advancing time.' };
  if (state.pendingRoadEvent) return { state, error: 'Deal with the event on the road before advancing time.' };
  if ([...(state.tournaments || []), ...(state.guildTournaments || [])].some((tournament) => tournament.status === 'active')) {
    return { state, error: 'Finish the active tournament before advancing time.' };
  }
  let next = mutate ? state : clone(state);
  let advancedCount = 0;
  let latestCouncilMonth = null;
  for (let step = 0; step < count; step += 1) {
    if (next.pendingDecisions.length || next.activeEncounter || next.activeMissionGame || next.pendingRoadEvent) break;
    const rng = rngFor(next, `advance-${step}`);
    const upkeep = monthlyUpkeep(next);
    const monthLabel = `${MONTHS[next.date.month]} ${next.date.year}`;
    const crownsBefore = next.guild.crowns;
    const fameBefore = next.guild.fame;
    const legacyBefore = next.guild.legacy;
    next.guild.crowns -= upkeep;
    if (next.guild.crowns < 0) {
      next.stats.bankruptMonths += 1;
      next.guild.fallen = next.guild.crowns < -900 || next.stats.bankruptMonths >= 6;
    } else {
      next.stats.bankruptMonths = Math.max(0, next.stats.bankruptMonths - 1);
      if (next.guild.fallen && next.guild.crowns > 300) next.guild.fallen = false;
    }
    const debt = applyDebtInPlace(next);
    const councilResolution = resolveMonthlyHeroActivities(next, rng);
    const branchResolution = simulateBranchesInPlace(next, rng);
    simulateRivals(next, rng);
    progressTravelInPlace(next, rng);

    next.activeMissions.forEach((mission) => {
      mission.remaining -= 1;
    });
    queueDueCombatMissionInPlace(next);
    queueDueMissionGameInPlace(next);

    next.date.month += 1;
    if (next.date.month >= 12) {
      next.date.month = 0;
      next.date.year += 1;
    }
    updatePromiseDeadlinesInPlace(next);
    simulateScheduledCompetitionsInPlace(next, rng);
    if (next.date.month === 0) annualCycle(next, rng);
    refreshMissionsInPlace(next, rng);
    if (!next.tournaments?.length || next.tournaments[0].year < next.date.year) createTournamentsInPlace(next, rng);
    latestCouncilMonth = {
      id: `council-${next.date.year}-${next.date.month}-${step}`,
      label: monthLabel,
      upkeep,
      loanPayment: debt.loanPayment,
      walkouts: debt.walkouts,
      crownsBefore,
      crownsAfter: next.guild.crowns,
      fameDelta: next.guild.fame - fameBefore,
      legacyDelta: next.guild.legacy - legacyBefore,
      scouts: councilResolution.scouts,
      exhibitionFame: councilResolution.exhibitionFame,
      activities: councilResolution.results,
      branches: branchResolution,
    };
    advancedCount += 1;
    commitRng(next, rng);
    if (!next.tutorial.completed && ONBOARDING_STEPS[next.tutorial.step]?.target === 'advanceMonth') completeTutorialTargetInPlace(next, 'advanceMonth');
    evaluateStateInPlace(next);
  }
  if (advancedCount > 0 && latestCouncilMonth) {
    next.council ||= { lastReport: null, unread: false };
    next.council.lastReport = { ...latestCouncilMonth, advancedMonths: advancedCount };
    next.council.unread = true;
  }
  return { state: finalize(next), error: null };
}

export function advanceToNextEvent(state) {
  if (state.activeEncounter) return { state, error: 'Conclude the active combat before advancing time.' };
  if (state.activeMissionGame) return { state, error: 'Conclude the active mission challenge before advancing time.' };
  if (state.pendingDecisions.length) return { state, error: 'Resolve the critical decision before advancing time.' };
  if (state.pendingRoadEvent) return { state, error: 'Deal with the event on the road before advancing time.' };
  if (!state.activeMissions.length) return advanceMonths(state, 1);
  const months = Math.max(1, Math.min(...state.activeMissions.map((mission) => mission.remaining)));
  return advanceMonths(state, months);
}
