// @ts-check
// The day, week, month and year loop: council activities, aging, advanceDays.
import { normalizeClassId } from '../../data/content.js';
import { VITALS } from '../../data/activities.js';
import { LOCATIONS, unlockedLocations } from '../../data/world.js';
import {
  MAX_HEROES,
  activeHeroCount,
  activityAvailable,
  roomLevel,
  tallySpend,
  addChronicle,
  addHeroHistory,
  appointmentHolder,
  clamp,
  clone,
  commitRng,
  compactHero,
  ensureTournamentCareer,
  finalize,
  getCurrentLocation,
  getHero,
  rngFor,
  atHome,
  campaignDaySerial,
  campaignWeekSerial,
  dateDaySerial,
  dateLabel,
  travellingPartyIds,
  DAYS_PER_WEEK,
  WEEKS_PER_MONTH,
} from './core.js';
import { applyXpInPlace, calculatePower, generateHero } from './heroes.js';
import { makeCandidate, refreshCandidatesForLocationInPlace, updatePromiseDeadlinesInPlace } from './candidates.js';
import { refreshMissionsInPlace } from './universe.js';
import { ensureGuildmasterInPlace, evaluateHeroAmbitionsInPlace, retireHeroInPlace, simulateBranchesInPlace } from './institution.js';
import { evaluateStateInPlace } from './goals.js';
import { applyDebtInPlace, monthlyUpkeep, progressTravelInPlace, upkeepBreakdown } from './economy.js';
import { closeSeasonInPlace, seasonsMonthlyInPlace } from './seasons.js';
import { monthlyHallInPlace, progressConstructionInPlace } from './hall.js';
import { monthlyConnectionsInPlace } from './connections.js';
import { adjustPatronInPlace, patronAtLeast } from './charter.js';
import { PATRON_DELTAS } from '../../data/patrons.js';
import { createTournamentsInPlace, simulateScheduledCompetitionsInPlace } from './guildTournaments.js';
import { queueDueCombatMissionInPlace, queueDueMissionGameInPlace } from './missions.js';
import { startScheduledTournamentsInPlace } from './tournamentEntry.js';
import { runAiTransferMarketInPlace, simulateRivalInstitutionsInPlace, simulateRivals } from './rivals.js';
import { pushRankingsMomentInPlace, recordRankSnapshotInPlace } from './rankings.js';
import { processContractsInPlace, processPoachingInPlace, scoutCandidatesInPlace } from './contracts.js';
import { EXPIRE_PENALTY, adjustRegionReputationInPlace } from './reputation.js';
import { expireChallengeInPlace, maybeIssueChallengeInPlace, nemesisBidsInPlace, rivalTakesContractInPlace, updateNemesesInPlace } from './rivalry.js';
import { checkBossesInPlace } from './stories.js';
import { rotateVisitorsInPlace } from './people.js';
import {
  expireWagerInPlace,
  maybeFriendlyChallengeInPlace,
  progressSideJobsInPlace,
  refreshSideJobsInPlace,
  rollWeeklyEventInPlace,
} from './townLife.js';

function resolveMonthlyHeroActivities(state, rng) {
  const trainingLevel = roomLevel(state, 'training');
  const trainingMaster = appointmentHolder(state, 'Training Master');
  // The Temple of the Dawn at Partner counts as one more Infirmary level.
  const infirmaryLevel = roomLevel(state, 'infirmary') + (appointmentHolder(state, 'Master Healer') ? 1 : 0) + (patronAtLeast(state, 'temple', 'partner') ? 1 : 0);
  const results = [];
  let scouts = 0;
  let exhibitionFame = 0;
  const party = travellingPartyIds(state);

  state.heroes.forEach((hero) => {
    if (['dead', 'retired'].includes(hero.status)) return;
    if (hero.status === 'mission') {
      results.push({ heroId: hero.id, name: hero.name, activity: 'Mission', icon: '⌖', summary: 'Deployed on an active mission.' });
      return;
    }
    if (hero.status === 'sidejob') {
      results.push({ heroId: hero.id, name: hero.name, activity: 'Side job', icon: '✎', summary: 'Out on a side job.' });
      return;
    }
    if (hero.status === 'tournament') {
      results.push({ heroId: hero.id, name: hero.name, activity: 'Tournament', icon: '♛', summary: 'Committed to an active tournament.' });
      return;
    }
    if (party.includes(hero.id)) {
      results.push({ heroId: hero.id, name: hero.name, activity: 'Travelling', icon: '➜', summary: 'On the road with you, away from the hall.' });
      return;
    }

    const requested = hero.monthlyActivity || (hero.status === 'injured' ? 'Infirmary' : 'Training');
    const wanted = hero.status === 'injured' && !['Infirmary', 'Rest'].includes(requested) ? 'Infirmary' : requested;
    // A room's activity only works once the room is built; otherwise the hero rests.
    const activity = activityAvailable(state, wanted) ? wanted : 'Rest';
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
      // Injuries count down weekly (weeklyInjuriesInPlace); the month adds care.
      hero.health = clamp(hero.health + 5 + infirmaryLevel * 3 + (activity === 'Infirmary' ? 5 : 0), 0, 100);
      hero.fatigue = clamp(hero.fatigue - (activity === 'Rest' ? 18 : 14), 0, 100);
      summary = `${activity === 'Infirmary' ? 'Treated in the infirmary' : 'Rested'}; ${Math.max(1, hero.injuryWeeks || 0)} week${hero.injuryWeeks === 1 ? '' : 's'} of recovery remain.`;
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
      const xp = 4 + roomLevel(state, 'scouts') * 2;
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
    const extraCandidateChance = clamp(0.2 + scouts * 0.12 + roomLevel(state, 'scouts') * 0.08, 0, 0.85);
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
  // The season that just ended: awards, records and the review.
  closeSeasonInPlace(state, state.date.year - 1);
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
    const intake = 1 + (location.id === state.world?.currentLocationId ? 1 : 0);
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

function pauseReason(state) {
  if (state.activeEncounter) return 'Conclude the active combat before advancing time.';
  if (state.activeMissionGame) return 'Conclude the active mission challenge before advancing time.';
  if (state.pendingDecisions.length) return 'Resolve the critical decision before advancing time.';
  if (state.pendingRoadEvent) return 'Deal with the event on the road before advancing time.';
  if (state.story?.scene) return 'Someone wants a word with you first.';
  if ([...(state.tournaments || []), ...(state.guildTournaments || [])].some((tournament) => tournament.status === 'active')) {
    return 'Finish the active tournament before advancing time.';
  }
  return null;
}

/** Injuries heal one week at a time; the Infirmary heals twice as fast. */
function weeklyInjuriesInPlace(state) {
  state.heroes
    .filter((hero) => hero.status === 'injured')
    .forEach((hero) => {
      // Temple contacts tend the injured: one extra week of healing at the start of each month.
      const templeCare = patronAtLeast(state, 'temple', 'contact') && state.date.week === 0 ? 1 : 0;
      hero.injuryWeeks = (hero.injuryWeeks || 1) - (hero.monthlyActivity === 'Infirmary' && roomLevel(state, 'infirmary') > 0 ? 2 : 1) - templeCare;
      if (hero.injuryWeeks > 0) return;
      hero.injuryWeeks = 0;
      hero.status = 'available';
      hero.injury = null;
      hero.health = Math.max(hero.health, 72);
      if (hero.monthlyActivity === 'Infirmary') hero.monthlyActivity = activityAvailable(state, 'Training') ? 'Training' : 'Rest';
      state.notifications.push({
        id: `recover-${hero.id}-${campaignWeekSerial(state)}`,
        tone: 'green',
        title: `${hero.name} returns`,
        text: 'Recovery is complete and the hero is available again.',
      });
      addHeroHistory(hero, state, { type: 'recovery', title: 'Returned from injury', text: 'Cleared by the guild infirmary.' });
    });
}

/** Everything that happens once a month (on week 1). */
function runMonthInPlace(next, rng) {
  // The treasury at each month's start: the savings rate (economy.js) reads it.
  next.guild.goldHistory = [...(next.guild.goldHistory || []), next.guild.crowns].slice(-12);
  const upkeep = monthlyUpkeep(next);
  const costs = upkeepBreakdown(next);
  next.guild.crowns -= upkeep;
  tallySpend(next, 'wages', costs.wages);
  tallySpend(next, 'hall', costs.hall.total);
  tallySpend(next, 'other', upkeep - costs.wages - costs.hall.total);
  if (next.guild.crowns < 0) {
    next.stats.bankruptMonths += 1;
    next.guild.fallen = next.guild.crowns < -900 || next.stats.bankruptMonths >= 6;
  } else {
    next.stats.bankruptMonths = Math.max(0, next.stats.bankruptMonths - 1);
    if (next.guild.fallen && next.guild.crowns > 300) next.guild.fallen = false;
  }
  const debt = applyDebtInPlace(next);
  const council = resolveMonthlyHeroActivities(next, rng);
  scoutCandidatesInPlace(next, council.scouts);
  monthlyHallInPlace(next, rng);
  monthlyConnectionsInPlace(next, rng);
  seasonsMonthlyInPlace(next);
  processContractsInPlace(next);
  processPoachingInPlace(next, rng);
  const branches = simulateBranchesInPlace(next, rng);
  simulateRivals(next, rng);
  updatePromiseDeadlinesInPlace(next);
  if (next.date.month === 0) annualCycle(next, rng);
  const expired = refreshMissionsInPlace(next, rng) || [];
  // Unclaimed contracts go to rivals; letting a local one lapse costs reputation.
  expired.forEach((mission) => {
    if (mission.patron) adjustPatronInPlace(next, mission.patron, PATRON_DELTAS.expire, 'you let their contract lapse');
    const rival = rivalTakesContractInPlace(next, mission, 'expired', rng);
    if (rival && mission.locationId === next.world?.currentLocationId) {
      adjustRegionReputationInPlace(next, mission.region, -EXPIRE_PENALTY);
      next.notifications.push({
        id: `expired-${mission.id}`,
        tone: 'blue',
        title: `${rival.name} took “${mission.title}”`,
        text: `It expired unclaimed. ${mission.region} reputation −${EXPIRE_PENALTY}.`,
      });
    }
  });
  // Visitors in the towns' buildings rotate (people.js); regulars stay.
  rotateVisitorsInPlace(next, rng);
  updateNemesesInPlace(next);
  refreshSideJobsInPlace(next, rng);
  checkBossesInPlace(next, rng);
  nemesisBidsInPlace(next, rng);
  if (next.date.month % 3 === 0) maybeIssueChallengeInPlace(next, rng);
  if (!next.tournaments?.length || next.tournaments[0].year < next.date.year) createTournamentsInPlace(next, rng);
  return { upkeep, debt, council, branches };
}

/** Everything that happens once a week, when a new week starts. */
function runWeekInPlace(next, rng, summary) {
  weeklyInjuriesInPlace(next);
  progressConstructionInPlace(next);
  expireChallengeInPlace(next);
  progressSideJobsInPlace(next, rng);
  expireWagerInPlace(next);
  next.date.week = (next.date.week || 0) + 1;
  if (next.date.week >= WEEKS_PER_MONTH) {
    next.date.week = 0;
    next.date.month += 1;
    if (next.date.month >= 12) {
      next.date.month = 0;
      next.date.year += 1;
    }
    const month = runMonthInPlace(next, rng);
    summary.months += 1;
    summary.upkeep += month.upkeep;
    summary.loanPayment += month.debt.loanPayment;
    summary.walkouts.push(...month.debt.walkouts);
    summary.scouts += month.council.scouts || 0;
    summary.exhibitionFame += month.council.exhibitionFame || 0;
    summary.activities = month.council.results;
    summary.branches = month.branches;
  }
  simulateScheduledCompetitionsInPlace(next, rng);
  rollWeeklyEventInPlace(next, rng);
  maybeFriendlyChallengeInPlace(next, rng);
  summary.weeks += 1;
  if (next.date.week === 0 && summary.months > 0) {
    recordRankSnapshotInPlace(next);
    if (next.date.month % 3 === 0) pushRankingsMomentInPlace(next, 'Season rankings', next.rankHistory.at(-4) || null);
  }
}

/** Deployed companies count down to the day they are due. */
function updateMissionClocksInPlace(state) {
  const today = campaignDaySerial(state);
  state.activeMissions.forEach((mission) => {
    if (!Number.isFinite(mission.dueDay)) mission.dueDay = today + Math.max(0, mission.remaining) * DAYS_PER_WEEK;
    mission.remaining = Math.max(0, Math.ceil((mission.dueDay - today) / DAYS_PER_WEEK));
  });
}

/**
 * Advances time day by day. Weekly systems run when a new week starts and
 * monthly ones when a new month starts. Stops early when a decision, battle,
 * mission game, road event or tournament needs the player, or when `until`
 * returns true. A council report summarizes the advance when it crossed a month.
 * Time only moves through player actions (travel, rest, camps, contracts).
 */
/** Every day, heroes at home recover a little HP and all their MP (battle-hiring spec). */
function recoverDailyInPlace(state) {
  const away = new Set(travellingPartyIds(state));
  state.heroes.forEach((hero) => {
    if (!['available', 'injured'].includes(hero.status) || away.has(hero.id)) return;
    hero.health = clamp((hero.health ?? 100) + VITALS.dailyHeal, 1, 100);
    hero.mana = 100;
  });
}

export function advanceDays(state, count = 1, mutate = false, until = null) {
  const blocked = pauseReason(state);
  if (blocked) return { state, error: blocked };
  const next = mutate ? state : clone(state);
  next.date.day ||= 0;
  const start = { crowns: next.guild.crowns, fame: next.guild.fame, legacy: next.guild.legacy, label: dateLabel(next) };
  const summary = { days: 0, weeks: 0, months: 0, upkeep: 0, loanPayment: 0, walkouts: [], scouts: 0, exhibitionFame: 0, activities: [], branches: [] };
  for (let step = 0; step < count; step += 1) {
    if (pauseReason(next)) break;
    const rng = rngFor(next, `day-${step}`);
    progressTravelInPlace(next, rng);
    next.date.day += 1;
    recoverDailyInPlace(next);
    if (next.date.day >= DAYS_PER_WEEK) {
      next.date.day = 0;
      runWeekInPlace(next, rng, summary);
    }
    updateMissionClocksInPlace(next);
    queueDueCombatMissionInPlace(next);
    queueDueMissionGameInPlace(next);
    startScheduledTournamentsInPlace(next);
    summary.days += 1;
    commitRng(next, rng);
    evaluateStateInPlace(next);
    if (until && until(next)) break;
  }
  if (summary.months > 0) {
    next.council ||= { lastReport: null, unread: false };
    next.council.lastReport = {
      id: `council-${campaignDaySerial(next)}`,
      label: `${start.label} → ${dateLabel(next)}`,
      advancedWeeks: summary.weeks,
      advancedMonths: summary.months,
      upkeep: summary.upkeep,
      loanPayment: summary.loanPayment,
      walkouts: summary.walkouts,
      crownsBefore: start.crowns,
      crownsAfter: next.guild.crowns,
      fameDelta: next.guild.fame - start.fame,
      legacyDelta: next.guild.legacy - start.legacy,
      scouts: summary.scouts,
      exhibitionFame: summary.exhibitionFame,
      activities: summary.activities,
      branches: summary.branches,
    };
    next.council.unread = true;
  }
  return { state: finalize(next), error: null };
}

/** N weeks of days (used by simulations and resting). */
export function advanceWeeks(state, count = 1, mutate = false) {
  return advanceDays(state, count * DAYS_PER_WEEK, mutate);
}

/** Waits at the Guild Hall until the start of a given { year, month, week }. */
export function advanceToDate(state, date) {
  if (!atHome(state)) return { state, error: 'Only the Guild Hall lets you wait for a date. Travel home to Dunmere first.' };
  const days = dateDaySerial({ ...date, day: 0 }) - campaignDaySerial(state);
  if (!Number.isFinite(days) || days <= 0) return { state, error: 'Pick a date in the future.' };
  return advanceDays(state, days);
}

/** Lets time pass until a deployed company is back (or something needs the player). */
export function advanceUntilMissionReturns(state, missionId, mutate = false) {
  const mission = state.activeMissions.find((item) => item.id === missionId);
  if (!mission) return { state, error: null };
  const today = campaignDaySerial(state);
  const days = Math.max(1, (Number.isFinite(mission.dueDay) ? mission.dueDay - today : mission.remaining * DAYS_PER_WEEK) + 1);
  return advanceDays(state, days, mutate, (next) => !next.activeMissions.some((item) => item.id === missionId));
}
