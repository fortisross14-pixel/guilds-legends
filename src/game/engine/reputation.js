// @ts-check
// Reputation per mission family (Combat/Diplomacy/Expedition/Intrigue) and per
// region, the perks it unlocks, and the guild's specialization title.
import { formationForMission } from '../../data/formations.js';
import { REGIONS } from '../../data/content.js';
import { charterEffect } from './charter.js';

export const REPUTATION_FAMILIES = ['Combat', 'Diplomacy', 'Expedition', 'Intrigue'];
export const REPUTATION_LEVELS = [
  { name: 'Unknown', min: 0 },
  { name: 'Known', min: 100 },
  { name: 'Respected', min: 300 },
  { name: 'Renowned', min: 700 },
  { name: 'Legendary', min: 1500 },
];
/** Gain per point of contract difficulty, by grade. Failures lose a little. */
export const REPUTATION_GRADE = { Legendary: 2, 'Great Success': 1.5, Success: 1, Partial: 0.3, Defeat: -0.3, Catastrophic: -0.5 };
export const DECLINE_PENALTY = 5;
export const EXPIRE_PENALTY = 10;

export const SPECIALIZATION_TITLES = { Combat: 'Monster Hunters', Diplomacy: 'Envoys', Expedition: 'Pathfinders', Intrigue: 'Shadow Hand' };

/** Perks per family level (cumulative). Shown in the Herald's Reputation view. */
export const FAMILY_PERKS = [
  'No perks yet.',
  'Known: +5% pay and fame per level on these contracts.',
  'Respected: one extra contract of this kind on notice boards.',
  'Renowned: next-tier contracts of this kind appear a tier early.',
  'Legendary: +6% success estimate; Combat also faces 10% weaker enemies.',
];

export function missionFamily(mission) {
  return mission?.approach || formationForMission(mission);
}

export function reputationLevel(points = 0) {
  let index = 0;
  REPUTATION_LEVELS.forEach((level, levelIndex) => {
    if (points >= level.min) index = levelIndex;
  });
  const next = REPUTATION_LEVELS[index + 1] || null;
  return { index, name: REPUTATION_LEVELS[index].name, points, next: next ? next.min : null, nextName: next?.name || null };
}

function reputation(state) {
  return state.reputation || { families: {}, regions: {} };
}

export function familyLevel(state, family) {
  return reputationLevel(reputation(state).families[family] || 0).index;
}

export function regionLevel(state, region) {
  return reputationLevel(reputation(state).regions[region] || 0).index;
}

/** Pay multiplier for a contract: +5% per family level and +5% per regional level. */
export function contractPayBonus(state, mission) {
  return 1 + 0.05 * familyLevel(state, missionFamily(mission)) + 0.05 * regionLevel(state, mission.region);
}

/** Fame multiplier for a contract: +5% per family level. */
export function contractFameBonus(state, mission) {
  return 1 + 0.05 * familyLevel(state, missionFamily(mission));
}

/** Signing-fee multiplier for recruits in a region: −5% per regional level. */
export function recruitFeeFactor(state, region) {
  return (1 - 0.05 * regionLevel(state, region)) * charterEffect(state, 'recruitFee');
}

/** Bonus to the success estimate at Legendary family reputation. */
export function estimateBonus(state, mission) {
  return familyLevel(state, missionFamily(mission)) >= 4 ? 6 : 0;
}

function addPoints(bucket, key, delta) {
  bucket[key] = Math.max(0, Math.round((bucket[key] || 0) + delta));
}

/** Reputation from a resolved contract (difficulty × grade). Returns the change. */
export function addContractReputationInPlace(state, mission, grade) {
  state.reputation ||= { families: {}, regions: {} };
  const raw = (mission.difficulty || 0) * (REPUTATION_GRADE[grade] ?? 0);
  // Shield of the People: the people remember good work faster.
  const delta = Math.round(raw > 0 ? raw * charterEffect(state, 'reputationGain') : raw);
  if (!delta) return 0;
  const family = missionFamily(mission);
  const before = familyLevel(state, family);
  addPoints(state.reputation.families, family, delta);
  if (mission.region) addPoints(state.reputation.regions, mission.region, delta);
  const after = familyLevel(state, family);
  if (after > before) {
    state.notifications.push({
      id: `rep-${family}-${after}`,
      tone: 'gold',
      title: `${family} reputation: ${REPUTATION_LEVELS[after].name}`,
      text: FAMILY_PERKS[after],
    });
  }
  return delta;
}

export function adjustRegionReputationInPlace(state, region, delta) {
  if (!region) return;
  state.reputation ||= { families: {}, regions: {} };
  addPoints(state.reputation.regions, region, delta > 0 ? delta * charterEffect(state, 'reputationGain') : delta);
}

/** Short title from the top family once it reaches Known; otherwise null. */
export function specializationTitle(state) {
  const families = reputation(state).families;
  const top = [...REPUTATION_FAMILIES].sort((a, b) => (families[b] || 0) - (families[a] || 0))[0];
  return reputationLevel(families[top] || 0).index >= 1 ? SPECIALIZATION_TITLES[top] : null;
}

/** Everything the Reputation view needs. */
export function getReputationSummary(state) {
  const data = reputation(state);
  return {
    title: specializationTitle(state),
    families: REPUTATION_FAMILIES.map((family) => {
      const level = reputationLevel(data.families[family] || 0);
      return { family, ...level, perk: FAMILY_PERKS[level.index], title: SPECIALIZATION_TITLES[family] };
    }),
    regions: REGIONS.map((region) => ({ region: region.id, label: region.name || region.id, ...reputationLevel(data.regions[region.id] || 0) })),
  };
}

/** Levels at or above which a family gets extra / early contracts. */
export function boardPerks(state) {
  return {
    extra: REPUTATION_FAMILIES.filter((family) => familyLevel(state, family) >= 2),
    early: REPUTATION_FAMILIES.filter((family) => familyLevel(state, family) >= 3),
  };
}
