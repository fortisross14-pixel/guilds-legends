// @ts-check
// Chapter goals, achievements, promotion, and evaluateStateInPlace (run after every action).
import { REGIONS, TIERS } from '../../data/content.js';
import { addChronicle, commitRng, dateLabel, rngFor, tierIndexByName } from './core.js';
import { refreshMissionsInPlace } from './universe.js';
import { guildRankings } from './rankings.js';
import { ensureGuildmasterInPlace, evaluateHeroAmbitionsInPlace } from './institution.js';

export function getGoalMetric(state, metric) {
  switch (metric) {
    case 'missionsWon':
      return state.stats.missionsWon;
    case 'missionsCompleted':
      return state.stats.missionsCompleted;
    case 'tournamentBest':
      return state.stats.tournamentBest;
    case 'fame':
      return state.guild.fame;
    case 'alignmentChosen':
      return state.stats.alignmentChosen;
    case 'tierIndex':
      return state.guild.tierIndex;
    case 'greatHallLevel':
      return state.guild.facilities['great-hall'] || 0;
    case 'legendHero':
      return state.heroes.some((hero) => hero.power >= 80 || hero.legacy >= 150) ? 1 : 0;
    case 'highestLevel':
      return Math.max(1, ...state.heroes.map((hero) => hero.level || 1), ...state.historicHeroes.map((hero) => hero.level || 1));
    case 'primalDiversity':
      return new Set(
        state.heroes
          .filter((hero) => !['dead', 'retired'].includes(hero.status))
          .map((hero) => hero.primal)
          .filter(Boolean),
      ).size;
    case 'professionalTournamentWins':
      return state.stats.professionalTournamentWins || 0;
    case 'artifacts':
      return state.artifacts.length;
    case 'years':
      return state.stats.yearsPlayed;
    case 'perfectHardMission':
      return state.stats.perfectHardMission;
    case 'upsets':
      return state.stats.upsets;
    case 'tournamentsWon':
      return state.stats.tournamentsWon;
    case 'longService':
      return Math.max(0, ...state.heroes.map((hero) => hero.career.serviceYears || 0), ...state.historicHeroes.map((hero) => hero.career?.serviceYears || 0));
    case 'inheritedWill':
      return state.stats.inheritedWill;
    case 'rivalries':
      return state.stats.rivalries;
    case 'mythicFeats':
      return state.stats.mythicFeats;
    default:
      return 0;
  }
}

function evaluateGoalsInPlace(state) {
  state.goals.forEach((goal) => {
    if (goal.completed) return;
    const value = getGoalMetric(state, goal.metric);
    const met = goal.comparator === 'lte' ? value <= goal.target : value >= goal.target;
    if (met) {
      goal.completed = true;
      goal.claimed = true;
      state.guild.crowns += goal.reward.crowns;
      state.guild.fame += goal.reward.fame;
      state.notifications.push({
        id: `goal-${goal.id}`,
        tone: 'gold',
        title: `Objective complete: ${goal.title}`,
        text: `Reward: ${goal.reward.crowns} crowns${goal.reward.fame ? ` and ${goal.reward.fame} fame` : ''}.`,
      });
      addChronicle(state, {
        type: 'goal',
        importance: 3,
        title: goal.title,
        text: `${goal.description} The guild receives ${goal.reward.crowns} crowns.`,
        tags: ['goal'],
      });
    }
  });
}

function evaluateAchievementsInPlace(state) {
  state.achievements.forEach((achievement) => {
    if (achievement.unlocked) return;
    const value = getGoalMetric(state, achievement.metric);
    if (value >= achievement.target) {
      achievement.unlocked = true;
      achievement.unlockedDate = dateLabel(state);
      state.guild.legacy += 5;
      state.notifications.push({
        id: `achievement-${achievement.id}`,
        tone: 'purple',
        title: `Achievement: ${achievement.name}`,
        text: achievement.description,
      });
    }
  });
}

export function promotionRequirement(state) {
  const current = state.guild.tierIndex;
  if (current >= TIERS.length - 1) return null;
  const threshold = TIERS[current];
  const target = TIERS[current + 1];
  const rank = state.guild.rank;
  return {
    target,
    fame: { current: state.guild.fame, target: threshold.fame, met: state.guild.fame >= threshold.fame },
    contracts: { current: state.guild.contractsCompleted, target: threshold.contracts, met: state.guild.contractsCompleted >= threshold.contracts },
    rank: { current: rank, target: threshold.rank, met: rank <= threshold.rank },
    feat: { current: state.stats.signatureFeats, target: current + 1, met: state.stats.signatureFeats >= current + 1 },
    time: { current: state.stats.yearsPlayed, target: target.minYears || 0, met: state.stats.yearsPlayed >= (target.minYears || 0) },
  };
}

export function getPromotionRequirement(state) {
  return promotionRequirement(state);
}

function evaluatePromotionInPlace(state) {
  const requirement = promotionRequirement(state);
  if (!requirement) return;
  if (requirement.fame.met && requirement.contracts.met && requirement.rank.met && requirement.feat.met && requirement.time.met) {
    state.guild.tierIndex += 1;
    state.guild.tier = TIERS[state.guild.tierIndex].id;
    state.guild.charter = true;
    state.guild.crowns += 400 * state.guild.tierIndex;
    state.guild.legacy += 25 * state.guild.tierIndex;
    REGIONS.forEach((region) => {
      if (tierIndexByName(region.unlock) <= state.guild.tierIndex) {
        const saga = state.sagas.find((item) => item.tier === region.unlock);
        if (saga) saga.discovered = true;
      }
    });
    addChronicle(state, {
      type: 'promotion',
      importance: 5,
      title: `${state.guild.name} earns ${state.guild.tier} status`,
      text: `The guild’s social scale changes. New routes, obligations and rivals replace the old boundaries of Dunmere.`,
      tags: ['promotion', state.guild.tier],
    });
    state.notifications.push({
      id: `promotion-${state.guild.tierIndex}`,
      tone: 'gold',
      title: `${state.guild.tier} status achieved`,
      text: `${TIERS[state.guild.tierIndex].scope} is now open to the banner.`,
    });
    const rng = rngFor(state, `promotion-${state.guild.tierIndex}`);
    refreshMissionsInPlace(state, rng);
    commitRng(state, rng);
  }
}

export function evaluateStateInPlace(state) {
  const rankings = guildRankings(state, TIERS[state.guild.tierIndex]?.id || 'Regional');
  state.guild.rank = rankings.find((row) => row.id === 'player')?.rank || state.guild.rank;
  evaluateGoalsInPlace(state);
  evaluateAchievementsInPlace(state);
  evaluatePromotionInPlace(state);
  ensureGuildmasterInPlace(state);
  evaluateHeroAmbitionsInPlace(state);
  state.stats.highestPower = Math.max(state.stats.highestPower, ...state.heroes.map((hero) => hero.power));
}
