// @ts-check
// Read models for the UI (next action, summary) and small UI-state actions.
import { MONTHS, ONBOARDING_STEPS, TIERS } from '../../data/content.js';
import { LOCATION_BY_ID } from '../../data/world.js';
import { tournamentRequirements } from './tournaments.js';
import { campaignMonthSerial } from './core.js';
import {
  activeHeroCount,
  clone,
  completeTutorialTargetInPlace,
  dateLabel,
  finalize,
  getCurrentLocation,
  getReport,
  heroCapacity,
  isGuildDefunct,
  partyCapacity,
  tierIndexByName,
} from './core.js';
import { getGuildRankSummary } from './rankings.js';
import { getGoalMetric, promotionRequirement } from './goals.js';
import { getPatronLoanOffer, monthlyUpkeep } from './economy.js';
import { getPlayerRanks, getRankMovement, getStatusTitle } from './rankings.js';

export function acknowledgeWelcome(state) {
  const next = clone(state);
  next.tutorial.acknowledged = true;
  completeTutorialTargetInPlace(next, 'acknowledgeWelcome');
  return finalize(next);
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
  completeTutorialTargetInPlace(next, 'inspectGoals');
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
  if (!state.tutorial.completed) {
    const step = ONBOARDING_STEPS[state.tutorial.step];
    let body = step?.body;
    if (step?.target === 'finishTutorial') {
      const melee = (state.tournaments || []).find((event) => event.definitionId === 'dunmere-harvest-melee' && event.status !== 'completed');
      const months = melee ? melee.year * 12 + melee.month - (state.date.year * 12 + state.date.month) : null;
      body =
        months !== null && months >= 0
          ? `Enter the Dunmere Harvest Melee in ${months} month${months === 1 ? '' : 's'}. The calendar strip keeps count. Finish the tutorial when you are ready.`
          : step.body;
    }
    return { kind: 'tutorial', ...step, body, step: state.tutorial.step + 1, total: ONBOARDING_STEPS.length };
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
        body: `You have ${state.guild.crowns} crowns and heroes are losing loyalty. A patron will advance ${loanOffer.amount} crowns (repay ${loanOffer.installment}/month).`,
        screen: 'hall',
        action: 'patron-loan',
      };
    }
    return {
      kind: 'warning',
      title: 'Treasury under pressure',
      body: `You have ${state.guild.crowns} crowns. Monthly upkeep is ${monthlyUpkeep(state)}. Take a contract before expanding.`,
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
      alignmentChosen: 'headquarters',
      tierIndex: 'goals',
      greatHallLevel: 'headquarters',
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
      alignmentChosen: 'Open Headquarters and decide who the guild will serve.',
      tierIndex: 'Review the promotion checklist and complete its next missing condition.',
      greatHallLevel: 'Save enough crowns to upgrade the Great Hall.',
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
    crowns: state.guild.crowns,
    fame: state.guild.fame,
    legacy: state.guild.legacy,
    upkeep: monthlyUpkeep(state),
    loan: state.guild.loan || null,
    unpaidMonths: state.guild.unpaidMonths || 0,
    activeHeroes: activeHeroCount(state),
    capacity: heroCapacity(state),
    activeMissions: state.activeMissions.length,
    partyCapacity: partyCapacity(state),
    decisions: state.pendingDecisions.length,
    combatActive: Boolean(state.activeEncounter),
    missionGameActive: Boolean(state.activeMissionGame),
    location: getCurrentLocation(state).name,
    locationId: getCurrentLocation(state).id,
    locationPrimal: getCurrentLocation(state).primal,
    travel: state.world?.activeTravel || null,
  };
}

/**
 * Calendar strip: upcoming tournaments (with entry requirements), deployed
 * companies, the current journey and promise deadlines, soonest first.
 */
export function getUpcomingEvents(state, limit = 8) {
  const now = campaignMonthSerial(state);
  const items = [];
  [...(state.tournaments || []), ...(state.guildTournaments || [])]
    .filter((tournament) => tournament.status !== 'completed' && tournament.year * 12 + tournament.month >= now)
    .forEach((tournament) => {
      const req = tournamentRequirements(tournament);
      const needs = [
        req.tierIndex ? `${TIERS[req.tierIndex]?.id} tier` : null,
        req.level ? `Lv ${req.level}+` : null,
        req.fame ? `${req.fame} fame` : null,
        req.combatWins ? `${req.combatWins} combat wins` : null,
      ].filter(Boolean);
      items.push({
        kind: 'tournament',
        id: tournament.id,
        title: tournament.name,
        monthsAway: tournament.year * 12 + tournament.month - now,
        date: `${MONTHS[tournament.month]} ${tournament.year}`,
        detail: `${LOCATION_BY_ID[tournament.locationId]?.name || tournament.location || ''} · ${needs.length ? needs.join(', ') : 'open entry'}`,
        active: tournament.status === 'active',
      });
    });
  (state.activeMissions || []).forEach((mission) => {
    items.push({
      kind: 'mission',
      id: mission.id,
      title: mission.title,
      monthsAway: Math.max(0, mission.remaining),
      detail: `Company returns in ${mission.remaining} month${mission.remaining === 1 ? '' : 's'}`,
    });
  });
  const travel = state.world?.activeTravel;
  if (travel) {
    items.push({
      kind: 'travel',
      id: 'travel',
      title: `Journey to ${LOCATION_BY_ID[travel.toId]?.name || travel.toId}`,
      monthsAway: travel.monthsRemaining,
      detail: `${travel.monthsRemaining} month${travel.monthsRemaining === 1 ? '' : 's'} on the road`,
    });
  }
  state.heroes
    .filter((hero) => !['dead', 'retired'].includes(hero.status))
    .forEach((hero) =>
      (hero.promises || [])
        .filter((promise) => promise.status === 'active')
        .forEach((promise) => {
          items.push({
            kind: 'promise',
            id: promise.id,
            title: `Promise to ${hero.name}`,
            monthsAway: Math.max(0, (promise.dueSerial ?? now) - now),
            detail: `${promise.label} · due ${promise.dueLabel}`,
          });
        }),
    );
  return items.sort((a, b) => a.monthsAway - b.monthsAway).slice(0, limit);
}

/** Dismiss the oldest reward moment (victory, level-up, recruit card). */
export function acknowledgeMoment(state) {
  const next = clone(state);
  next.moments = (next.moments || []).slice(1);
  return finalize(next);
}

const UI_TUTORIAL_TARGETS = ['visitHerald', 'finishTutorial'];

/** Completes a tutorial step that is triggered from the UI (visiting the Herald, finishing). */
export function noteTutorialStep(state, target) {
  if (state.tutorial.completed || !UI_TUTORIAL_TARGETS.includes(target)) return state;
  const next = clone(state);
  completeTutorialTargetInPlace(next, target);
  return finalize(next);
}

/** For returning players: skip the scripted opening entirely. */
export function skipTutorial(state) {
  const next = clone(state);
  next.tutorial.completed = true;
  next.tutorial.acknowledged = true;
  next.tutorial.step = ONBOARDING_STEPS.length;
  next.flags.openingPeddler = true;
  return finalize(next);
}
