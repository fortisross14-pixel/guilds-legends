// @ts-check
// Patrons beyond their standing: the rewards each level grants, the Trade
// House's exclusive contracts, the Connections page, and the four run paths
// (Richest, Best connected, Strongest, Most legendary) with their scores.
import { PATRONS, PATRON_DELTAS, PATRON_LEVELS, PATRON_LIST, SMITHS_WEAPON, TEMPLE_RECRUIT } from '../../data/patrons.js';
import { PATHS } from '../../data/charters.js';
import { MISSION_TEMPLATES } from '../../data/content.js';
import { LOCATION_BY_ID } from '../../data/world.js';
import { ITEMS } from '../../data/items.js';
import { addChronicle, campaignMonthSerial, clone, commitRng, finalize, pushMoment, rngFor, tallySpend, trophyCount } from './core.js';
import { adjustPatronInPlace, charterOf, patronAtLeast, patronLevel, patronPoints } from './charter.js';
import { addItemsInPlace } from './inventory.js';
import { makeCandidate } from './candidates.js';
import { instantiateMission } from './universe.js';
import { getPlayerRanks } from './rankings.js';
import { getStoryView } from './stories.js';

function patronStateInPlace(state, patronId) {
  state.patrons ||= {};
  state.patrons[patronId] ||= { points: 0, granted: {}, lastGift: null };
  state.patrons[patronId].granted ||= {};
  return state.patrons[patronId];
}

/** One-off rewards: the Temple's cleric at Partner, the Smiths' weapon at Ally. Safe to call often. */
export function grantPatronRewardsInPlace(state) {
  const temple = patronStateInPlace(state, 'temple');
  if (patronAtLeast(state, 'temple', 'partner') && !temple.granted.recruit) {
    const rng = rngFor(state, 'patron-temple-recruit');
    const candidate = makeCandidate(state, rng, 'elite', PATRONS.temple.home, { ...TEMPLE_RECRUIT, homeLocationId: PATRONS.temple.home });
    Object.assign(candidate, { signingFee: 0, buyoutFee: 0, demand: null, objection: null, channel: 'Temple of the Dawn', expiresYear: state.date.year + 2, scoutLevel: 3 });
    state.candidates.push(candidate);
    commitRng(state, rng);
    temple.granted.recruit = true;
    pushMoment(state, { type: 'construction', roomId: 'patron', title: 'The Temple sends a friend', effect: `${candidate.name}, a ${candidate.rarity} Cleric, waits for you in the Greenhollow tavern. No fee.`, unlocked: ['Sister Maelle can join'] });
  }
  const smiths = patronStateInPlace(state, 'smiths');
  if (patronAtLeast(state, 'smiths', 'ally') && !smiths.granted.weapon) {
    addItemsInPlace(state, { [SMITHS_WEAPON]: 1 });
    smiths.granted.weapon = true;
    pushMoment(state, { type: 'construction', roomId: 'patron', title: 'Forged in Ironford', effect: `The Smiths' Guild gives you the ${ITEMS[SMITHS_WEAPON].name}. It waits in your chest.`, unlocked: [ITEMS[SMITHS_WEAPON].name] });
    addChronicle(state, { type: 'facility', importance: 2, title: 'The Oathblade', text: 'Ironford’s smiths forge a blade for the guild, and every foundry hears about it.', tags: ['patron'] });
  }
}

/** Monthly: rewards, the Trade House's exclusive contract, the Temple's blessing, path scores. */
export function monthlyConnectionsInPlace(state, rng) {
  grantPatronRewardsInPlace(state);
  if (patronAtLeast(state, 'trade', 'partner') && !(state.missions || []).some((mission) => mission.exclusive === 'trade')) {
    const pool = MISSION_TEMPLATES.filter((template) => template.tier === 'Regional' && PATRONS.trade.families.includes(template.family) && template.id !== 'wolves-old-road');
    if (pool.length) {
      const mission = instantiateMission(rng.pick(pool), state, rng, LOCATION_BY_ID[PATRONS.trade.home]);
      Object.assign(mission, { exclusive: 'trade', patron: 'trade', issuer: PATRONS.trade.name, title: `Trade House charter: ${mission.title}`, reward: Math.round(mission.reward * 1.6) });
      state.missions.push(mission);
    }
  }
  if (patronAtLeast(state, 'temple', 'ally')) state.guild.fame += 5;
  recordPathScoresInPlace(state);
}

/** Gifts a patron's representative (once a month): small standing gain for gold. */
export function giftPatron(state, patronId) {
  const patron = PATRONS[patronId];
  if (!patron) return { state, error: 'Unknown patron.' };
  if (state.patrons?.[patronId]?.lastGift === campaignMonthSerial(state)) return { state, error: `${patron.rep.name} already took a gift this month.` };
  if (state.guild.crowns < PATRON_DELTAS.giftCost) return { state, error: `A fitting gift costs ${PATRON_DELTAS.giftCost} crowns.` };
  const next = clone(state);
  next.guild.crowns -= PATRON_DELTAS.giftCost;
  tallySpend(next, 'patrons', PATRON_DELTAS.giftCost);
  patronStateInPlace(next, patronId).lastGift = campaignMonthSerial(next);
  adjustPatronInPlace(next, patronId, PATRON_DELTAS.gift);
  grantPatronRewardsInPlace(next);
  return { state: finalize(next), error: null };
}

/** The Connections page: each patron's standing, what it unlocks and who it angers. */
export function getConnectionsView(state) {
  return PATRON_LIST.map((patron) => {
    const level = patronLevel(state, patron.id);
    const points = patronPoints(state, patron.id);
    const next = [...PATRON_LEVELS].reverse().find((item) => item.index > level.index && Number.isFinite(item.min));
    return {
      ...patron,
      homeName: LOCATION_BY_ID[patron.home]?.name || patron.home,
      points,
      level,
      next: next ? { name: next.name, min: next.min, toGo: next.min - points } : null,
      unlocks: ['contact', 'partner', 'ally'].map((id) => ({ id, name: PATRON_LEVELS.find((item) => item.id === id).name, text: patron.unlocks[id], open: patronAtLeast(state, patron.id, id) })),
      opposes: Object.entries(patron.opposes || {}).map(([id, cost]) => ({ id, name: PATRONS[id].short, cost })),
      giftReady: state.patrons?.[patron.id]?.lastGift !== campaignMonthSerial(state),
      openContracts: (state.missions || []).filter((mission) => mission.patron === patron.id).length,
    };
  });
}

// Chapter 1 targets, used to compare paths measured in different units.
const PATH_TARGETS = { richest: 6000, connected: 450, strongest: 600, legendary: 500 };

/** The four run paths with their scores (the charter's path is marked). */
export function getPathScores(state) {
  const charter = charterOf(state);
  const regions = Object.values(state.reputation?.regions || {}).reduce((sum, points) => sum + points, 0);
  const patronTotal = PATRON_LIST.reduce((sum, patron) => sum + Math.max(0, patronPoints(state, patron.id)), 0);
  const ranks = getPlayerRanks(state);
  const strength = ranks.strength || { rank: 30, total: 30 };
  const anyAlly = PATRON_LIST.some((patron) => patronAtLeast(state, patron.id, 'ally'));
  const titles = (state.stats?.individualTournamentWins || 0) + (state.stats?.guildTournamentWins || 0);
  const rare = [...(state.heroes || []), ...(state.historicHeroes || [])].filter((hero) => ['Epic', 'Legend'].includes(hero.rarity)).length;
  const story = getStoryView(state).step || 0;
  const scores = {
    richest: { score: state.stats?.goldEarned || 0, detail: `${(state.stats?.goldEarned || 0).toLocaleString()} gold earned` },
    connected: { score: patronTotal + Math.round(regions / 10), detail: `${patronTotal} patron standing · ${Math.round(regions / 10)} from regional reputation` },
    strongest: {
      score: (strength.total - strength.rank + 1) * 20 + (state.stats?.combatWins || 0) * 3 + (state.stats?.missionsWon || 0) * 2,
      detail: `Strength #${strength.rank} of ${strength.total} · ${state.stats?.combatWins || 0} battles won${charter?.id === 'free' ? (anyAlly ? ' · a patron is your Ally (not independent)' : ' · independent') : ''}`,
    },
    legendary: {
      score: (state.guild?.legacy || 0) + titles * 25 + (state.artifacts?.length || 0) * 15 + trophyCount(state) * 5 + story * 10 + rare * 10,
      detail: `${state.guild?.legacy || 0} legacy · ${titles} titles · ${state.artifacts?.length || 0} artifacts · story step ${story} · ${rare} rare recruits`,
    },
  };
  return Object.values(PATHS).map((path) => {
    const { score, detail } = scores[path.id];
    return { ...path, score, detail, target: PATH_TARGETS[path.id], progress: Math.min(1, score / PATH_TARGETS[path.id]), charterPath: charter?.path === path.id, signature: charter?.path === path.id ? charter.signature : null };
  });
}

/** Stores this month's path scores (the best one names the Chapter 1 ending, Phase 6). */
export function recordPathScoresInPlace(state) {
  const paths = getPathScores(state);
  const best = [...paths].sort((a, b) => b.progress - a.progress)[0];
  state.paths = { month: campaignMonthSerial(state), best: best?.id || null, scores: Object.fromEntries(paths.map((path) => [path.id, path.score])) };
}
