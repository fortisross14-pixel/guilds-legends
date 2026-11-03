// @ts-check
// The guild's identity at its simplest: the founding charter's effects and
// patron standing. Kept early in the module order so any module can read it.
// Rewards that come with patron levels are granted in connections.js.
import { CHARTERS } from '../../data/charters.js';
import { PATRONS, PATRON_DELTAS, PATRON_LEVELS } from '../../data/patrons.js';

/** The guild's charter, or null for campaigns without one. */
export function charterOf(state) {
  return CHARTERS[state?.guild?.charter] || null;
}

/** A charter effect: a multiplier (default 1), a flag, a number or an object. */
export function charterEffect(state, key, fallback = 1) {
  const value = charterOf(state)?.effects?.[key];
  return value === undefined ? fallback : value;
}

/** Charter bonus to a contract family's success estimate (points). */
export function charterEstimate(state, family) {
  return charterOf(state)?.effects?.estimate?.[family] || 0;
}

export function patronPoints(state, patronId) {
  return state?.patrons?.[patronId]?.points || 0;
}

/** { id, name, index } — index −1 Rival, 0 Stranger, 1 Contact, 2 Partner, 3 Ally. */
export function patronLevel(state, patronId) {
  const points = patronPoints(state, patronId);
  return PATRON_LEVELS.find((level) => points >= level.min) || PATRON_LEVELS[PATRON_LEVELS.length - 1];
}

/** True when a patron is at or above a level ('contact', 'partner', 'ally'). */
export function patronAtLeast(state, patronId, levelId) {
  const target = PATRON_LEVELS.find((level) => level.id === levelId);
  return Boolean(target) && patronLevel(state, patronId).index >= target.index;
}

/** The patron (if any) whose kind of work a contract family is. */
export function patronForFamily(family, locationId = null) {
  const matches = Object.values(PATRONS).filter((patron) => patron.families.includes(family));
  return matches.find((patron) => patron.home === locationId) || matches[0] || null;
}

/**
 * Changes standing with a patron. Gains are scaled by the charter (Free
 * Company warms slowly). Crossing a level adds a notice. Returns the change.
 */
export function adjustPatronInPlace(state, patronId, delta, reason = '') {
  const patron = PATRONS[patronId];
  if (!patron || !delta) return 0;
  state.patrons ||= {};
  state.patrons[patronId] ||= { points: 0, granted: {} };
  const scaled = Math.round(delta > 0 ? delta * charterEffect(state, 'patronGain') : delta);
  if (!scaled) return 0;
  const before = patronLevel(state, patronId);
  state.patrons[patronId].points = Math.max(-60, Math.min(200, state.patrons[patronId].points + scaled));
  const after = patronLevel(state, patronId);
  if (after.index !== before.index && state.notifications) {
    const up = after.index > before.index;
    state.notifications.push({
      id: `patron-${patronId}-${after.id}-${state.patrons[patronId].points}`,
      tone: up ? 'gold' : 'red',
      title: `${patron.short}: ${after.name}`,
      text: up ? patron.unlocks[after.id] || `${patron.name} now calls you ${after.name.toLowerCase()}.` : `${patron.name} cools toward you${reason ? ` (${reason})` : ''}.`,
    });
  }
  return scaled;
}

/** Standing changes from finishing a contract for a patron, including rivals' reactions. */
export function patronContractResultInPlace(state, patronId, grade) {
  const patron = PATRONS[patronId];
  if (!patron) return;
  const D = PATRON_DELTAS;
  const delta = { Legendary: D.contractGreat, 'Great Success': D.contractGreat, Success: D.contractWin, Partial: D.contractPartial, Defeat: D.contractFail, Catastrophic: D.contractFail }[grade] ?? 0;
  adjustPatronInPlace(state, patronId, delta, 'a failed contract');
  if (delta > 0) Object.entries(patron.opposes || {}).forEach(([other, cost]) => adjustPatronInPlace(state, other, -cost, `you worked for the ${patron.short}`));
}
