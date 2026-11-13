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

export const SPECIALIZATION_TITLES = { Combat: 'Bounty Hunters', Diplomacy: 'Envoys', Expedition: 'Pathfinders', Intrigue: 'Shadow Hand' };

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

// ---------------------------------------------------------------- standing: honor and dread (docs/design/PILLARS.md)

/** Honor runs −100 (wicked) … +100 (honourable); dread 0 … 100. Both fade toward the middle each month. */
export const STANDING = { honorLine: 34, dreadLines: [34, 67], margin: 6, fadePerMonth: 2, logSize: 12 };

function standingInPlace(state) {
  state.guild.standing ||= { honor: 0, dread: 0, honorBand: 'neutral', dreadBand: 'none', log: [] };
  return state.guild.standing;
}

/** The guild's standing (read only). */
export function getStanding(state) {
  return state.guild?.standing || { honor: 0, dread: 0, honorBand: 'neutral', dreadBand: 'none', log: [] };
}

// A band changes only once the value is clearly past the line (the margin), so the epithet never flickers.
function honorBandFor(value, current) {
  const { honorLine, margin } = STANDING;
  const pull = (band) => (band === current ? 0 : margin);
  if (value >= honorLine + pull('honourable')) return 'honourable';
  if (value <= -(honorLine + pull('wicked'))) return 'wicked';
  if (current === 'honourable' && value >= honorLine - margin) return 'honourable';
  if (current === 'wicked' && value <= -(honorLine - margin)) return 'wicked';
  return 'neutral';
}
function dreadBandFor(value, current) {
  const [feared, dreaded] = STANDING.dreadLines;
  const { margin } = STANDING;
  const rank = { none: 0, feared: 1, dreaded: 2 }[current] || 0;
  const target = value >= dreaded + (rank >= 2 ? -margin : margin) ? 'dreaded' : value >= feared + (rank >= 1 ? -margin : margin) ? 'feared' : 'none';
  // Stay in the current band until clearly out of it.
  if (target === current) return current;
  if (current === 'dreaded' && value >= dreaded - margin) return 'dreaded';
  if (current === 'feared' && value >= feared - margin && value < dreaded + margin) return 'feared';
  return target;
}

/** Moves honor and dread after a deed; `text` goes in the standing log. */
export function adjustStandingInPlace(state, { honor = 0, dread = 0 } = {}, text = '') {
  if (!honor && !dread) return;
  const standing = standingInPlace(state);
  standing.honor = Math.max(-100, Math.min(100, standing.honor + honor));
  standing.dread = Math.max(0, Math.min(100, standing.dread + dread));
  standing.honorBand = honorBandFor(standing.honor, standing.honorBand);
  standing.dreadBand = dreadBandFor(standing.dread, standing.dreadBand);
  if (text) standing.log = [{ day: (state.date.year * 12 + state.date.month) * 28 + (state.date.week || 0) * 7 + (state.date.day || 0), text, honor, dread }, ...(standing.log || [])].slice(0, STANDING.logSize);
}

/** Monthly: honor and dread fade a little toward the middle (a guild is what it has done lately). */
export function fadeStandingInPlace(state) {
  const standing = standingInPlace(state);
  const step = STANDING.fadePerMonth;
  standing.honor = standing.honor > 0 ? Math.max(0, standing.honor - step) : Math.min(0, standing.honor + step);
  standing.dread = Math.max(0, standing.dread - step);
  standing.honorBand = honorBandFor(standing.honor, standing.honorBand);
  standing.dreadBand = dreadBandFor(standing.dread, standing.dreadBand);
}

/**
 * How people feel about the guild, by its standing (docs/design/PILLARS.md): feared and wicked
 * guilds are met with fear, feared and honourable ones with respect, wicked ones nobody fears
 * with disgust, honourable ones nobody fears with warmth. Null in between.
 */
export function standingQuadrant(state) {
  const { honorBand, dreadBand } = getStanding(state);
  const feared = dreadBand === 'feared' || dreadBand === 'dreaded';
  if (honorBand === 'wicked') return feared ? 'fear' : 'disgust';
  if (honorBand === 'honourable') return feared ? 'respect' : 'compassion';
  return null;
}

// What people call the guild: [the word in "the … guild of X", the prefix in "… X"], by honor and dread.
const EPITHETS = {
  honourable: { none: ['honourable', 'Honourable'], feared: ['respected', 'Respected'], dreaded: ['very respectable', 'Venerable'] },
  neutral: { none: null, feared: ['hard', 'Hard'], dreaded: ['grim', 'Grim'] },
  wicked: { none: ['shameless', 'Shameless'], feared: ['feared', 'Feared'], dreaded: ['dreaded', 'Dreaded'] },
};

/**
 * The epithet the guild has earned: words ('very respectable'), the long form
 * ('the very respectable guild of the New Lantern') and the short one ('Venerable New Lantern').
 * A guild that is neither has none.
 */
export function standingEpithet(state) {
  const standing = getStanding(state);
  const pair = EPITHETS[standing.honorBand || 'neutral']?.[standing.dreadBand || 'none'] || null;
  const name = state.guild?.name || 'the guild';
  const bare = name.replace(/^the\s+/i, '');
  if (!pair) return { words: '', long: name, short: name };
  return { words: pair[0], long: `the ${pair[0]} guild of the ${bare}`, short: `${pair[1]} ${bare}` };
}
