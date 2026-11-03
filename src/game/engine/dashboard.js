// @ts-check
// Read models for the UI (next action, summary) and small UI-state actions.
import { GUILD_TOURNAMENT_DEFINITIONS, INDIVIDUAL_TOURNAMENT_DEFINITIONS } from '../../data/universe.js';
import { TIERS } from '../../data/content.js';
import { LOCATIONS, LOCATION_BY_ID, travelDays } from '../../data/world.js';
import { ROOM_BY_ID } from '../../data/rooms.js';
import { tournamentRequirements } from './tournaments.js';
import { WEEKS_PER_MONTH, campaignDaySerial, campaignWeekSerial, dateFromDaySerial, dateFromWeekSerial, dateWeekSerial, hashString } from './core.js';
import {
  activeHeroCount,
  clone,
  dateLabel,
  finalize,
  getCurrentLocation,
  getReport,
  bedCount,
  isGuildDefunct,
  partyCapacity,
  tierIndexByName,
} from './core.js';
import { getGuildRankSummary } from './rankings.js';
import { getGoalMetric, promotionRequirement } from './goals.js';
import { getPatronLoanOffer, monthlyUpkeep } from './economy.js';
import { getPlayerRanks, getRankMovement, getStatusTitle } from './rankings.js';
import { getTournamentAccess } from './tournaments.js';
import { FAMILY_PERKS, getReputationSummary, specializationTitle } from './reputation.js';
import { nemesisIds } from './rivalry.js';
import { festivalFor } from './townLife.js';
import { getStoryView } from './story.js';

/** Read model for fog-of-war presentation; it does not restrict strategic travel. */
export function getWorldKnowledge(state) {
  const explicit = state.world?.knowledge?.locations || {};
  const visited = new Set(state.world?.visitedLocationIds || []);
  return Object.fromEntries(
    LOCATIONS.map((location) => {
      if (explicit[location.id] === 'fullyExplored') return [location.id, 'fullyExplored'];
      return [location.id, visited.has(location.id) ? 'visited' : explicit[location.id] || 'unknown'];
    }),
  );
}

function knowsTournament(state, tournament) {
  const known = state.world?.knowledge?.events || {};
  if (known[tournament.definitionId] || known[tournament.id]) return true;
  const fame = state.guild?.fame || 0;
  const circuit = tournament.circuit || tournament.division;
  return (circuit === 'Regional' && fame >= 75) || (circuit === 'National' && fame >= 180) || (circuit === 'Global' && fame >= 420);
}

/**
 * A presentation-only digest of consequences already recorded by the
 * simulation. Towns and the journal use it to make history feel present
 * without adding a second source of truth or new simulation state.
 */
export function getLivingHistory(state) {
  const highlights = [];
  const chronicle = state.chronicle || [];
  const add = (kind, title, text, tone = 'neutral') => highlights.push({ kind, title, text, tone });
  const latestMission = state.missionHistory?.[0];
  if (latestMission) {
    const failed = ['Defeat', 'Catastrophic'].includes(latestMission.grade);
    const major = latestMission.story || latestMission.bossId || latestMission.risk >= 4;
    add(
      failed ? 'defeat' : 'victory',
      failed ? `The cost of ${latestMission.title}` : `${latestMission.title} is being remembered`,
      failed
        ? `${state.guild.name} returned from ${latestMission.locationName || latestMission.region} carrying a hard lesson.`
        : `${latestMission.grade || 'Success'} on ${major ? 'a major contract: ' : ''}${latestMission.title}.`,
      failed ? 'red' : 'green',
    );
  }
  const playerTournament = (state.tournamentHistory || []).find((record) => record.playerResult);
  if (playerTournament) {
    const finish = playerTournament.playerResult.finish;
    add(
      'tournament',
      `${playerTournament.title}: ${finish === 1 ? 'champions' : `top ${finish}`}`,
      playerTournament.narrative,
      finish === 1 ? 'gold' : 'blue',
    );
  }
  const publicEvent = chronicle.find((event) => ['death', 'retirement', 'succession', 'story'].includes(event.type));
  if (publicEvent) add(publicEvent.type, publicEvent.title, publicEvent.text, publicEvent.type === 'death' ? 'red' : publicEvent.type === 'story' ? 'purple' : 'gold');

  const reputation = getReputationSummary(state);
  const leadingReputation = reputation.families.slice().sort((a, b) => b.points - a.points)[0];
  if (leadingReputation?.points > 0) {
    add(
      'reputation',
      `${reputation.title || state.guild.name} is known for ${leadingReputation.family.toLowerCase()}`,
      `${leadingReputation.points} ${leadingReputation.family} reputation in the wider world.`,
      'blue',
    );
  }
  const rival = nemesisIds(state)
    .map((id) => ({ rival: state.rivals.find((item) => item.id === id), record: state.rivalries?.[id] || {} }))
    .find(({ rival }) => rival);
  if (rival) {
    const score = rival.record.score || 0;
    add('rivalry', `Eyes on ${rival.rival.name}`, score >= 0 ? `The feud currently favors ${state.guild.name}, but the next meeting will matter.` : `${rival.rival.name} has the advantage in the current feud.`, 'red');
  }
  const story = getStoryView(state);
  if (story.active && story.active.act > 1) add('story', `Story: ${story.active.title}`, story.active.current?.text || story.active.summary, 'purple');
  return { spotlight: highlights[0] || null, highlights: highlights.slice(0, 6) };
}

export function acknowledgeCouncilReport(state) {
  const next = clone(state);
  next.council ||= { lastReport: null, unread: false };
  next.council.unread = false;
  return finalize(next);
}

export function inspectGoals(state) {
  const next = clone(state);
  next.flags.goalsInspected = true;
  return finalize(next);
}

export function dismissNotification(state, notificationId) {
  const next = clone(state);
  next.notifications = next.notifications.filter((notification) => notification.id !== notificationId);
  return finalize(next);
}

export function clearNotifications(state) {
  const next = clone(state);
  next.notifications = [];
  return finalize(next);
}

export function updateSettings(state, patch) {
  const next = clone(state);
  next.settings = { ...next.settings, ...patch };
  return finalize(next);
}

export function getNextAction(state) {
  if (state.activeEncounter) {
    const finished = state.activeEncounter.status !== 'active';
    return {
      kind: 'critical',
      title: state.activeEncounter.title || 'Combat in progress',
      body: finished
        ? `${state.activeEncounter.result?.playerWon ? 'Victory' : 'Defeat'} · Review the result and conclude the engagement.`
        : `${state.activeEncounter.roundName || 'Engagement'} · Turn ${state.activeEncounter.turn}. Read the opponent and choose your next action.`,
      screen: state.activeEncounter.sourceType?.includes('tournament') ? 'tournaments' : 'missions',
      action: 'combat',
    };
  }
  if (state.activeMissionGame) {
    return {
      kind: 'critical',
      title: `${state.activeMissionGame.type}: ${state.activeMissionGame.title}`,
      body: `Turn ${state.activeMissionGame.turn}. Choose a lead hero and play the decisive mission challenge.`,
      screen: 'missions',
      action: 'mission-game',
    };
  }
  if (state.pendingRoadEvent) {
    return { kind: 'critical', title: 'Something happens on the road', body: 'Choose how the travellers respond.', screen: 'map', action: 'road-event' };
  }
  if (isGuildDefunct(state)) {
    return {
      kind: 'critical',
      title: 'No active heroes remain',
      body: 'Every hero of the guild is dead or retired. Refound the guild with a new founder and one free recruit to continue the chronicle.',
      screen: 'hall',
      action: 'refound',
    };
  }
  // Act I of the story is the tutorial: its current step leads, with a one-line hint.
  const story = getStoryView(state);
  if (story.tutorial === 'active' && story.active?.act === 1 && story.active.current) {
    const step = story.active.current;
    return { kind: 'tutorial', title: `${story.active.number}. ${story.active.title}`, body: `${step.text} ${step.hint || ''}`.trim(), screen: step.screen || 'town', step: story.active.number, total: 4, missionId: story.active.id, canTalk: step.canTalk };
  }
  if (state.pendingDecisions.length) {
    return { kind: 'critical', title: 'A critical decision is waiting', body: state.pendingDecisions[0].prompt, screen: 'hall', action: 'resolve' };
  }
  if (state.pendingReports?.length) {
    const report = getReport(state, state.pendingReports[0]);
    return {
      kind: 'critical',
      title: report ? `Read the report: ${report.title}` : 'An expedition report is waiting',
      body: 'Review the full team, formation, odds, rewards and consequences before continuing.',
      screen: 'chronicle',
      action: 'report',
    };
  }
  if (state.guild.crowns < monthlyUpkeep(state) * 1.5) {
    const loanOffer = getPatronLoanOffer(state);
    if (state.guild.crowns < 0 && loanOffer.available) {
      return {
        kind: 'warning',
        title: 'The guild is in debt',
        body: `You have ${state.guild.crowns} gold and heroes are losing loyalty. A patron will advance ${loanOffer.amount} gold (repay ${loanOffer.installment}/month).`,
        screen: 'hall',
        action: 'patron-loan',
      };
    }
    return {
      kind: 'warning',
      title: 'Treasury under pressure',
      body: `You have ${state.guild.crowns} gold. Monthly upkeep is ${monthlyUpkeep(state)}. Take a contract before expanding.`,
      screen: 'missions',
    };
  }
  const activeGoal = state.goals.find((goal) => !goal.completed && tierIndexByName(goal.tier) <= state.guild.tierIndex);
  if (activeGoal) {
    const current = getGoalMetric(state, activeGoal.metric);
    const screenByMetric = {
      missionsWon: 'missions',
      missionsCompleted: 'missions',
      tournamentBest: 'tournaments',
      fame: 'missions',
      tierIndex: 'goals',
      hallStage: 'hall',
      legendHero: 'heroes',
      highestLevel: 'heroes',
      primalDiversity: 'world',
      professionalTournamentWins: 'tournaments',
      artifacts: 'chronicle',
      years: 'hall',
    };
    const actionByMetric = {
      missionsWon: 'Choose a contract you can cover with the recommended roles.',
      tournamentBest: 'Build a Combat Company, qualify for the next circuit and enter this year’s tournament.',
      fame: 'Favor high-fame contracts, saga choices and public victories.',
      tierIndex: 'Review the promotion checklist and complete its next missing condition.',
      hallStage: 'Buy the old hall, then build rooms in its empty wings.',
      legendHero: 'Give a high-potential hero missions, training and meaningful roles.',
      highestLevel: 'Missions grant much more experience than monthly training. Keep the hero active without exhausting them.',
      primalDiversity: 'Travel to a differently aligned settlement and inspect its local recruitment market.',
      professionalTournamentWins: 'Meet the fame and combat-win thresholds, travel to Tidecross and win the professional circuit.',
      artifacts: 'Pursue missions that display an artifact possibility.',
      years: 'Keep the institution solvent and advance the chronicle.',
    };
    return {
      kind: 'goal',
      title: activeGoal.title,
      body: `${activeGoal.description} ${actionByMetric[activeGoal.metric] || ''}`.trim(),
      screen: screenByMetric[activeGoal.metric] || 'goals',
      progress: current,
      target: activeGoal.target,
    };
  }
  const requirement = promotionRequirement(state);
  if (requirement) {
    /** @type {[string, { current: any, target: any, met: boolean }][]} */
    const checks = [
      ['fame', requirement.fame],
      ['successful contracts', requirement.contracts],
      ['official rank', requirement.rank],
      ['signature achievements', requirement.feat],
      ['campaign years', requirement.time],
    ];
    const [label, missing] = checks.find(([, item]) => !item.met) || checks[0];
    const display = label === 'official rank' ? `rank #${missing.current}; need #${missing.target} or better` : `${missing.current}/${missing.target} ${label}`;
    return {
      kind: 'promotion',
      title: `Path to ${requirement.target.id}`,
      body: `Next threshold: ${display}. Open the full checklist to choose how to achieve it.`,
      screen: 'goals',
    };
  }
  return {
    kind: 'legacy',
    title: 'Write the next chapter',
    body: 'Choose a dangerous contract, develop a successor or pursue a saga that history will remember.',
    screen: 'missions',
  };
}

export function getDashboardSummary(state) {
  const rankSummary = getGuildRankSummary(state);
  return {
    date: dateLabel(state),
    tier: state.guild.tier,
    rank: state.guild.rank,
    rankSummary,
    ranks: getPlayerRanks(state),
    movement: getRankMovement(state),
    statusTitle: getStatusTitle(state),
    specialization: specializationTitle(state),
    crowns: state.guild.crowns,
    fame: state.guild.fame,
    legacy: state.guild.legacy,
    upkeep: monthlyUpkeep(state),
    loan: state.guild.loan || null,
    unpaidMonths: state.guild.unpaidMonths || 0,
    activeHeroes: activeHeroCount(state),
    capacity: bedCount(state),
    activeMissions: state.activeMissions.length,
    partyCapacity: partyCapacity(state),
    decisions: state.pendingDecisions.length,
    combatActive: Boolean(state.activeEncounter),
    missionGameActive: Boolean(state.activeMissionGame),
    location: getCurrentLocation(state).name,
    locationId: getCurrentLocation(state).id,
    locationPrimal: getCurrentLocation(state).primal,
    travel: state.world?.activeTravel || null,
    week: state.date.week || 0,
  };
}

function tournamentEntry(state, tournament, now) {
  const req = tournamentRequirements(tournament);
  const date = { year: tournament.year, month: tournament.month, week: tournament.week ?? hashString(tournament.definitionId || tournament.id) % 4 };
  const needs = [req.level ? `Lv ${req.level}+` : null, req.fame ? `${req.fame} fame` : null, req.combatWins ? `${req.combatWins} combat wins` : null].filter(
    Boolean,
  );
  const locked = (req.tierIndex || 0) > state.guild.tierIndex;
  const source = state.world?.knowledge?.events?.[tournament.definitionId] || state.world?.knowledge?.events?.[tournament.id] || null;
  // "Almost": the tier is open but no hero meets the other requirements yet.
  const best = [...state.heroes].filter((hero) => !['dead', 'retired'].includes(hero.status)).sort((a, b) => b.level - a.level)[0];
  const missing = locked ? [] : getTournamentAccess(state, tournament, best?.id).checks.filter((check) => !check.met);
  return {
    kind: 'tournament',
    id: tournament.id,
    title: tournament.name,
    date,
    weeksAway: dateWeekSerial(date) - now,
    locationId: tournament.locationId,
    enterable: !locked && !missing.length && tournament.status !== 'completed',
    signedUp: Boolean(tournament.signup),
    almost: !locked && missing.length > 0,
    locked,
    source,
    detail: tournament.signup
      ? `Signed up. Be in ${LOCATION_BY_ID[tournament.locationId]?.name || tournament.location} when it starts, or forfeit.`
      : locked
      ? `Unlocks at ${TIERS[req.tierIndex]?.id}`
      : missing.length
        ? `Missing: ${missing.map((check) => `${check.label} ${check.target} (have ${check.current})`).join(', ')}`
        : `${LOCATION_BY_ID[tournament.locationId]?.name || tournament.location || ''} · ${needs.length ? needs.join(', ') : 'open entry'}`,
  };
}

function projectedTournaments(year) {
  return [...INDIVIDUAL_TOURNAMENT_DEFINITIONS, ...GUILD_TOURNAMENT_DEFINITIONS]
    .filter((definition) => !definition.cadence || year % definition.cadence === 0)
    .map((definition) => ({
      ...definition,
      id: `${definition.id}-${year}`,
      definitionId: definition.id,
      year,
      status: 'registration',
      week: definition.week ?? hashString(definition.id) % 4,
    }));
}

/**
 * Everything the calendar knows about, from now on: tournaments (enterable or
 * locked), company returns, travel arrival, promise deadlines, wage day, loan
 * payments and season ends. Each entry has a { year, month, week } date.
 */
export function getCalendarEntries(state, months = 12) {
  const now = campaignWeekSerial(state);
  const end = now + months * WEEKS_PER_MONTH;
  const entries = [];
  // Events in other towns say how far away the guild is (travel days from here).
  const here = state.world?.activeTravel ? state.world.activeTravel.toId : state.world?.currentLocationId || 'dunmere';
  const add = (entry) => {
    const serial = dateWeekSerial(entry.date);
    const awayDays = entry.locationId && entry.locationId !== here ? travelDays(here, entry.locationId) || null : null;
    if (serial >= now && serial <= end) entries.push({ ...entry, weeksAway: serial - now, awayDays });
  };
  const years = [state.date.year, state.date.year + 1];
  years.forEach((year) => {
    const pool = year === state.date.year ? [...(state.tournaments || []), ...(state.guildTournaments || [])] : projectedTournaments(year);
    pool.filter((tournament) => tournament.status !== 'completed' && knowsTournament(state, tournament)).forEach((tournament) => add(tournamentEntry(state, tournament, now)));
  });
  (state.activeMissions || []).forEach((mission) => {
    add({
      kind: 'mission',
      id: mission.id,
      title: `${mission.title} returns`,
      date: dateFromWeekSerial(now + Math.max(0, mission.remaining)),
      locationId: mission.locationId,
      detail: `${mission.locationName || ''} · ${mission.assignments.length} heroes`,
    });
  });
  const travel = state.world?.activeTravel;
  if (travel)
    add({
      kind: 'travel',
      id: 'travel',
      title: `Arrive in ${LOCATION_BY_ID[travel.toId]?.name || travel.toId}`,
      date: dateFromDaySerial(campaignDaySerial(state) + travel.daysRemaining),
      locationId: travel.toId,
      detail: `End of the journey (${travel.daysRemaining} day${travel.daysRemaining === 1 ? '' : 's'})`,
    });
  state.heroes
    .filter((hero) => !['dead', 'retired'].includes(hero.status))
    .forEach((hero) =>
      (hero.promises || [])
        .filter((promise) => promise.status === 'active' && Number.isFinite(promise.dueSerial))
        .forEach((promise) =>
          add({
            kind: 'promise',
            id: promise.id,
            title: `Promise to ${hero.name}`,
            date: { year: Math.floor(promise.dueSerial / 12), month: promise.dueSerial % 12, week: 0 },
            detail: promise.label,
          }),
        ),
    );
  state.heroes
    .filter((hero) => hero.contract && !['dead', 'retired'].includes(hero.status))
    .forEach((hero) =>
      add({
        kind: 'contract',
        id: `contract-${hero.id}`,
        title: `${hero.name}'s contract ends`,
        date: { year: Math.floor(hero.contract.endSerial / 12), month: hero.contract.endSerial % 12, week: 0 },
        detail: 'Renew from the hero status screen',
      }),
    );
  for (let offset = 0; offset < 5; offset += 1) {
    const seasonSerial = Math.floor((state.date.year * 12 + state.date.month) / 3) + offset;
    const festival = festivalFor(Math.floor(seasonSerial / 4), seasonSerial % 4);
    add({
      kind: 'festival',
      id: `festival-${seasonSerial}`,
      title: `${festival.name} in ${LOCATION_BY_ID[festival.townId]?.name}`,
      date: festival.date,
      locationId: festival.townId,
      detail: 'Be in town that week to join the festival',
    });
  }
  state.missions
    .filter((mission) => mission.bossId && !mission.story)
    .forEach((mission) =>
      add({
        kind: 'boss',
        id: `boss-${mission.id}`,
        title: mission.title,
        date: dateFromWeekSerial(now + 1),
        locationId: mission.locationId,
        detail: `Boss contract open in ${mission.locationName}`,
      }),
    );
  if (state.wager)
    add({
      kind: 'challenge',
      id: 'wager',
      title: `Wager with ${state.wager.rivalName} ends`,
      date: dateFromWeekSerial(state.wager.deadlineWeek),
      detail: `Finish a ${state.wager.family} contract first to win ${state.wager.gold} gold`,
    });
  state.missions
    .filter((mission) => mission.story)
    .forEach((mission) =>
      add({
        kind: 'story',
        id: `story-${mission.id}`,
        title: `Story: ${mission.title}`,
        date: dateFromWeekSerial(now + 1),
        locationId: mission.locationId,
        detail: `Story contract in ${mission.locationName}`,
      }),
    );
  if (state.challenge?.status === 'pending') {
    add({
      kind: 'challenge',
      id: 'challenge',
      title: `Answer ${state.challenge.rivalName}'s challenge`,
      date: dateFromWeekSerial(state.challenge.expiresWeek),
      detail: 'Accept or decline from the Herald nemesis page',
    });
  }
  const nemesisNames = nemesisIds(state)
    .map((id) => state.rivals.find((rival) => rival.id === id)?.name)
    .filter(Boolean);
  const reputation = getReputationSummary(state)
    .families.filter((item) => item.next)
    .sort((a, b) => b.points - a.points)[0];
  let milestoneAdded = false;
  for (let serial = now; serial <= end; serial += 1) {
    const date = dateFromWeekSerial(serial);
    if (date.week !== 0 || serial === now) continue;
    if (date.month % 3 === 0 && nemesisNames.length)
      add({
        kind: 'challenge',
        id: `challenge-window-${serial}`,
        title: 'Nemesis challenge window',
        date,
        detail: `${nemesisNames.join(' or ')} may challenge you; you can challenge them once this season`,
      });
    if (!milestoneAdded && reputation) {
      milestoneAdded = true;
      add({
        kind: 'reputation',
        id: 'reputation-goal',
        title: `${reputation.family} reputation: ${reputation.points}/${reputation.next}`,
        date,
        detail: `Next: ${reputation.nextName}. ${FAMILY_PERKS[reputation.index + 1]}`,
      });
    }
  }
  for (let serial = now; serial <= end; serial += 1) {
    const date = dateFromWeekSerial(serial);
    if (date.week !== 0 || serial === now) continue;
    add({
      kind: 'wages',
      id: `wages-${serial}`,
      title: 'Wages and upkeep',
      date,
      detail: `About ${monthlyUpkeep(state)} gold${state.guild.loan ? ` + ${state.guild.loan.installment} loan payment` : ''}`,
    });
    if (date.month % 3 === 0) add({ kind: 'season', id: `season-${serial}`, title: 'Season ends', date, detail: 'Rankings update' });
  }
  const work = state.guild.hall?.construction;
  if (work) {
    add({
      kind: 'construction',
      id: `construction-${work.roomId}`,
      title: `${ROOM_BY_ID[work.roomId]?.name || 'Room'}${work.level > 1 ? ` level ${work.level}` : ''} complete`,
      date: dateFromWeekSerial(now + work.weeksLeft),
      detail: 'Guild Hall construction',
    });
  }
  return entries.sort((x, y) => x.weeksAway - y.weeksAway || x.kind.localeCompare(y.kind));
}

/** The next few events the player can act on (no locked tournaments, no routine wage days). */
export function getUpcomingEvents(state, limit = 3) {
  return getCalendarEntries(state, 6)
    .filter((entry) =>
      entry.kind === 'tournament'
        ? entry.enterable
        : ['mission', 'travel', 'promise', 'contract', 'challenge', 'festival', 'boss', 'story', 'construction'].includes(entry.kind) && entry.id !== 'reputation-goal',
    )
    .slice(0, limit);
}

/** Dismiss the oldest reward moment (victory, level-up, recruit card). */
export function acknowledgeMoment(state) {
  const next = clone(state);
  next.moments = (next.moments || []).slice(1);
  return finalize(next);
}
