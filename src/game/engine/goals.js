// @ts-check
// Promotion and evaluateStateInPlace (run after every action). The old chapter goals
// and achievements are gone: the story and the guild tasks replaced them.
import { REGIONS, TIERS } from '../../data/content.js';
import { addChronicle, commitRng, rngFor, tierIndexByName } from './core.js';
import { refreshMissionsInPlace } from './universe.js';
import { getPlayerRanks, updateStatusTitleInPlace } from './rankings.js';
import { ensureGuildmasterInPlace, evaluateHeroAmbitionsInPlace } from './institution.js';

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
    // Promotion needs an Official-ladder rank (tournament points from the last 12 months).
    rank: { current: rank, target: threshold.rank, met: rank <= threshold.rank && (state.guild.officialPoints || 0) > 0 },
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
    state.guild.royalCharter = true;
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
  const official = getPlayerRanks(state).official;
  state.guild.rank = official.rank;
  state.guild.officialPoints = official.value;
  evaluatePromotionInPlace(state);
  updateStatusTitleInPlace(state);
  ensureGuildmasterInPlace(state);
  evaluateHeroAmbitionsInPlace(state);
  state.stats.highestPower = Math.max(state.stats.highestPower, ...state.heroes.map((hero) => hero.power));
}
