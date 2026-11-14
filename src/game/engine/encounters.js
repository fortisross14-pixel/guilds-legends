// @ts-check
// Active combat actions, and concluding a battle (wild areas, roads, contract sites, tournaments, duels).
import { WILD_AREAS, WILD_RESPAWN, findWildGroup } from '../../data/wilds/index.js';
import { defeatInPlace } from './hall.js';
import { VITALS } from '../../data/activities.js';
import { attemptFlee, autoResolveEncounter, performCombatRound } from '../combat.js';
import { addChronicle, campaignWeekSerial, clone, commitRng, earnGoldInPlace, finalize, getHero, pushMoment, rngFor } from './core.js';
import { charterEffect } from './charter.js';
import { afterBattleInPlace } from './seasons.js';
import { storyDuelResultInPlace } from './story.js';
import { applyXpInPlace, battleGold, battleXp, enemyStrength, xpForNextLevel } from './heroes.js';

/** Gives XP and returns the entry the result screen animates (bar from → to, level-ups). */
/** The fight's strength for the party (heroes.js enemyStrength): every foe's level, shared by the fighters. */
function strengthOf(encounter) {
  return enemyStrength((encounter.enemies || []).map((unit) => unit.level), (encounter.party || []).length);
}

function xpEntryInPlace(hero, encounter, state, source, kind = 'wild', share = 1) {
  const amount = Math.max(1, Math.round(battleXp(hero, strengthOf(encounter), kind) * share));
  const fill = () => (xpForNextLevel(hero.level) ? (hero.xp || 0) / xpForNextLevel(hero.level) : 1);
  const levelBefore = hero.level;
  const from = fill();
  // Battle XP: the Free Company learns more from a fight.
  applyXpInPlace(hero, Math.round(amount * charterEffect(state, 'combatXp')), state, source);
  return { heroId: hero.id, name: hero.name, xp: amount, levelBefore, levelAfter: hero.level, from, to: fill() };
}
import { addItemsInPlace, lootList, rollDrops, rollLoot, settleBattleItemsInPlace } from './inventory.js';
import { evaluateStateInPlace } from './goals.js';
import { completeGuildTournamentInPlace, resolveGuildRoundInPlace } from './guildTournaments.js';
import { siteFightConcludedInPlace } from './sites.js';
import { recordRivalryInPlace, settleChallengeInPlace } from './rivalry.js';
import { personBoutResultInPlace } from './people.js';
import { adjustStandingInPlace } from './reputation.js';

/** Plays one battle round. commands: { [partyUnitId]: { action, skillId?, itemId?, targetId? } }. */
export function performActiveCombatAction(state, commands = {}) {
  if (!state.activeEncounter) return { state, error: 'There is no active combat.' };
  if (state.activeEncounter.status !== 'active') return { state, error: 'The combat is over. Conclude the result before issuing another order.' };
  const next = clone(state);
  next.activeEncounter = performCombatRound(next.activeEncounter, commands && typeof commands === 'object' ? commands : {});
  return { state: finalize(next), error: null, encounter: next.activeEncounter };
}

export function fleeActiveCombat(state) {
  if (!state.activeEncounter || state.activeEncounter.status !== 'active') return { state, error: 'There is no battle to flee.' };
  if (!state.activeEncounter.canFlee) return { state, error: 'There is no running from this fight.' };
  const next = clone(state);
  // A dreaded guild walks away: once the band sees whose banner it is, it lets them go (not a boss).
  const dreaded = next.guild.standing?.dreadBand === 'dreaded' && !next.activeEncounter.sourceMeta?.boss;
  if (dreaded) next.activeEncounter.dreadEscape = true;
  next.activeEncounter = attemptFlee(next.activeEncounter);
  return { state: finalize(next), error: null, encounter: next.activeEncounter };
}

/** A battle with a group standing in a wild area: rewards, injuries, and the group stays away for a while. */
function concludeWildCombatInPlace(next, encounter, combatResult) {
  const { areaId, groupId } = encounter.sourceMeta || {};
  const area = WILD_AREAS[areaId];
  const group = findWildGroup(area, groupId);
  if (!area || !group) return;
  const fighters = encounter.party.map((unit) => getHero(next, unit.heroId)).filter(Boolean);
  const rng = rngFor(next, `wild-combat:${encounter.id}`);
  next.world.exploration ||= {};
  next.world.exploration.wild ||= {};
  const wild = (next.world.exploration.wild[areaId] ||= { cleared: {}, gathered: {}, visited: true, bosses: 0 });
  if (combatResult.playerWon) {
    const reward = group.reward || {};
    const gold = battleGold(rng, encounter.enemies);
    earnGoldInPlace(next, gold);
    const xp = fighters.map((hero) => xpEntryInPlace(hero, encounter, next, area.name));
    const loot = { ...(reward.items || {}) };
    // What the beaten foes leave behind (wolf pelts off Wolfskins, …).
    Object.entries(rollDrops(rng, encounter.enemies)).forEach(([id, count]) => (loot[id] = (loot[id] || 0) + count));
    if (group.isBoss) Object.entries(rollLoot(rng, next.guild.tierIndex, 1)).forEach(([id, count]) => (loot[id] = (loot[id] || 0) + count));
    addItemsInPlace(next, loot);
    if (!group.ambush) wild.cleared[groupId] = campaignWeekSerial(next) + (group.respawnWeeks || WILD_RESPAWN.enemies);
    if (group.isBoss) wild.bosses = (wild.bosses || 0) + 1;
    wild.beaten = { ...(wild.beaten || {}), [groupId]: true };
    pushMoment(next, { type: 'victory', title: group.ambush ? `${encounter.title} driven off` : `${encounter.title} defeated`, gold, xp, loot: lootList(loot) });
    addChronicle(next, {
      type: 'combat-victory',
      importance: group.isBoss ? 3 : 1,
      title: group.isBoss ? `${encounter.title} falls` : `${encounter.title} driven off`,
      text: `${fighters.map((hero) => hero.name).join(', ')} win in ${area.name} and take ${gold} gold.`,
      heroIds: fighters.map((hero) => hero.id),
      tags: ['combat', 'explore'],
    });
  } else {
    // The defeat rule: the party wakes in the infirmary at home (hall.js).
    defeatInPlace(next, fighters.map((hero) => hero.id), area.hub);
  }
  commitRng(next, rng);
}

/**
 * A fight a conversation started (a dialogue { battle } effect: threatening Sergeant Hobb).
 * Won: XP, what the foes drop, and `onWin` ({ giveItem, standing, flag, gold }). Lost: the defeat rule.
 */
function concludeTalkBattleInPlace(next, encounter, combatResult) {
  const fighters = encounter.party.map((unit) => getHero(next, unit.heroId)).filter(Boolean);
  const done = encounter.sourceMeta?.onDone;
  if (done?.flag) {
    next.flags.dialogue ||= {};
    next.flags.dialogue[done.flag] = true;
  }
  if (!combatResult.playerWon) {
    // A practice bout: they help you up. Nobody goes to the infirmary.
    if (encounter.sourceMeta?.practice) {
      fighters.forEach((hero) => (hero.health = Math.max(hero.health || 0, 30)));
      next.notifications.push({ id: `practice-${encounter.id}`, tone: 'blue', title: `${encounter.title}: beaten`, text: 'A practice bout: they help you up. Train and try them in the ring.' });
      return;
    }
    defeatInPlace(next, fighters.map((hero) => hero.id), next.world?.currentLocationId);
    return;
  }
  const rng = rngFor(next, `talk-combat:${encounter.id}`);
  const xp = fighters.map((hero) => xpEntryInPlace(hero, encounter, next, encounter.title));
  const loot = rollDrops(rng, encounter.enemies);
  const win = encounter.sourceMeta?.onWin || {};
  if (win.giveItem) Object.entries(win.giveItem).forEach(([id, count]) => (loot[id] = (loot[id] || 0) + count));
  addItemsInPlace(next, loot);
  if (win.gold) earnGoldInPlace(next, win.gold);
  if (win.standing) adjustStandingInPlace(next, win.standing, win.standing.text || '');
  if (win.flag) {
    next.flags.dialogue ||= {};
    next.flags.dialogue[win.flag] = true;
  }
  pushMoment(next, { type: 'victory', title: encounter.title, gold: win.gold || 0, xp, loot: lootList(loot) });
  commitRng(next, rng);
}

function concludeRoadCombatInPlace(next, encounter, combatResult) {
  const fighters = encounter.party.map((unit) => getHero(next, unit.heroId)).filter(Boolean);
  const tier = next.guild.tierIndex + 1;
  const rng = rngFor(next, `road-combat:${encounter.id}`);
  if (combatResult.playerWon) {
    const gold = battleGold(rng, encounter.enemies);
    earnGoldInPlace(next, gold);
    const xp = fighters.map((hero) => xpEntryInPlace(hero, encounter, next, 'a road ambush'));
    const loot = rollLoot(rng, next.guild.tierIndex, 0);
    Object.entries(rollDrops(rng, encounter.enemies)).forEach(([id, count]) => (loot[id] = (loot[id] || 0) + count));
    addItemsInPlace(next, loot);
    pushMoment(next, { type: 'victory', title: 'Ambush repelled', gold, xp, loot: lootList(loot) });
    addChronicle(next, {
      type: 'travel',
      importance: 1,
      title: 'Bandits driven off',
      text: `The travellers win the skirmish and take ${gold} gold.`,
      tags: ['travel', 'road-event', 'combat'],
    });
  } else {
    const lost = Math.min(Math.max(0, next.guild.crowns), rng.int(40, 100) * tier);
    next.guild.crowns -= lost;
    defeatInPlace(next, fighters.map((hero) => hero.id), next.world?.activeTravel?.fromId || next.world?.currentLocationId);
    addChronicle(next, {
      type: 'travel',
      importance: 1,
      title: 'Robbed on the road',
      text: `The bandits win and take ${lost} gold.`,
      tags: ['travel', 'road-event', 'combat'],
    });
    next.notifications.push({ id: `road-loss-${encounter.id}`, tone: 'red', title: 'Robbed on the road', text: `The bandits take ${lost} gold.` });
  }
  commitRng(next, rng);
}

export function autoResolveActiveCombat(state, mutate = false) {
  if (!state.activeEncounter) return { state, error: 'There is no active combat.' };
  const next = mutate ? state : clone(state);
  next.activeEncounter = autoResolveEncounter(next.activeEncounter);
  return { state: finalize(next), error: null, encounter: next.activeEncounter };
}

/** Fights that spend heroes but never injure them: training matches, bouts and tournaments. */
const NO_INJURY = new Set(['training', 'person-bout', 'tournament', 'challenge']);

/** HP and MP carry over (battle-hiring spec). Knocked out in a won fight: 1 HP, injured for a week (not in training or tournaments). */
function carryVitalsInPlace(state, encounter, combatResult) {
  encounter.party.forEach((unit) => {
    const hero = unit.heroId ? getHero(state, unit.heroId) : null;
    if (!hero) return;
    hero.mana = Math.round((100 * Math.max(0, unit.mp)) / Math.max(1, unit.maxMp));
    if (!unit.ko) {
      hero.health = Math.max(1, Math.round((100 * unit.hp) / Math.max(1, unit.maxHp)));
      return;
    }
    hero.health = 1;
    if (NO_INJURY.has(encounter.sourceType) || encounter.sourceMeta?.practice) {
      // Spent, not hurt: low HP and no MP, but free to keep going.
      hero.health = 10;
      hero.mana = 0;
      return;
    }
    if (combatResult.playerWon && hero.status === 'available') {
      hero.status = 'injured';
      hero.injury = 'Knocked out';
      hero.injuryWeeks = Math.max(hero.injuryWeeks || 0, VITALS.knockoutWeeks);
    }
  });
}

/**
 * One screen per fight (playtest-1-feedback): when a fight queues a victory
 * moment, the level-ups it caused fold into it (its XP bars show "Level up!"),
 * and it carries each hero's HP and injury and the battle log for "Details".
 */
function mergeBattleMomentsInPlace(next, encounter, since) {
  const fresh = (next.moments || []).slice(since);
  const victory = fresh.find((moment) => moment.type === 'victory');
  if (!victory) return;
  next.moments = [...next.moments.slice(0, since), ...fresh.filter((moment) => moment.type !== 'levelUp')];
  victory.party = encounter.party
    .map((unit) => getHero(next, unit.heroId))
    .filter(Boolean)
    .map((hero) => ({ heroId: hero.id, hp: hero.health ?? 100, injured: hero.status === 'injured' }));
  victory.details = (encounter.log || []).slice(-40).map((line) => line.text);
}

export function concludeActiveCombat(state, mutate = false) {
  const since = state.moments?.length || 0;
  const encounter = state.activeEncounter;
  const concluded = concludeCombatInner(state, mutate);
  if (!concluded.error && encounter) mergeBattleMomentsInPlace(concluded.state, encounter, since);
  return concluded;
}

function concludeCombatInner(state, mutate) {
  if (!state.activeEncounter) return { state, error: 'There is no combat to conclude.' };
  if (state.activeEncounter.status === 'active' || !state.activeEncounter.result) return { state, error: 'The combat has not finished yet.' };
  const next = mutate ? state : clone(state);
  const encounter = next.activeEncounter;
  const combatResult = clone(encounter.result);
  let report = null;
  let round = null;
  settleBattleItemsInPlace(next, combatResult.itemsUsed);
  afterBattleInPlace(next, encounter, combatResult);
  carryVitalsInPlace(next, encounter, combatResult);

  if (encounter.sourceType === 'challenge') {
    settleChallengeInPlace(next, encounter.sourceId, combatResult.playerWon);
    next.activeEncounter = null;
    evaluateStateInPlace(next);
    return { state: finalize(next), error: null, result: { kind: 'challenge', combat: combatResult } };
  }

  if (encounter.sourceType === 'training') {
    const fighters = encounter.party.map((unit) => getHero(next, unit.heroId)).filter(Boolean);
    // A training match is worth a fifth less than a wild fight of the same strength (heroes.js battleXp); half if lost.
    const xp = fighters.map((hero) => xpEntryInPlace(hero, encounter, next, 'a training match', 'training', combatResult.playerWon ? 1 : 0.5));
    // A won match against a practice team is remembered (flag practice-<team>-won: errands ask for it).
    if (combatResult.playerWon && encounter.sourceMeta?.team) {
      next.flags.dialogue ||= {};
      next.flags.dialogue[`practice-${encounter.sourceMeta.team}-won`] = true;
    }
    if (combatResult.playerWon) pushMoment(next, { type: 'victory', title: `${encounter.title}: won`, gold: 0, xp, loot: [] });
    else next.notifications.push({ id: `training-lost-${encounter.id}`, tone: 'blue', title: 'Training match lost', text: 'Spent, but nobody hurt. The party learned something anyway.' });
    next.activeEncounter = null;
    evaluateStateInPlace(next);
    return { state: finalize(next), error: null, result: { kind: 'training', combat: combatResult } };
  }

  if (encounter.sourceType === 'person-bout') {
    personBoutResultInPlace(next, encounter.sourceId, combatResult.playerWon);
    next.activeEncounter = null;
    evaluateStateInPlace(next);
    return { state: finalize(next), error: null, result: { kind: 'person-bout', combat: combatResult } };
  }

  if (encounter.sourceType === 'story-duel') {
    storyDuelResultInPlace(next, encounter.sourceId, combatResult.playerWon);
    next.activeEncounter = null;
    evaluateStateInPlace(next);
    return { state: finalize(next), error: null, result: { kind: 'story-duel', combat: combatResult } };
  }

  if (encounter.sourceType === 'road') {
    concludeRoadCombatInPlace(next, encounter, combatResult);
    next.activeEncounter = null;
    evaluateStateInPlace(next);
    return { state: finalize(next), error: null, result: { kind: 'road-combat', combat: combatResult } };
  }

  if (encounter.sourceType === 'talk') {
    concludeTalkBattleInPlace(next, encounter, combatResult);
    next.activeEncounter = null;
    evaluateStateInPlace(next);
    return { state: finalize(next), error: null, result: { kind: 'talk-combat', combat: combatResult } };
  }

  if (encounter.sourceType === 'wild') {
    concludeWildCombatInPlace(next, encounter, combatResult);
    next.activeEncounter = null;
    evaluateStateInPlace(next);
    return { state: finalize(next), error: null, result: { kind: 'wild-combat', combat: combatResult } };
  }

  if (encounter.sourceType === 'site') {
    siteFightConcludedInPlace(next, encounter, combatResult);
    next.activeEncounter = null;
    evaluateStateInPlace(next);
    return { state: finalize(next), error: null, result: { kind: 'site-combat', combat: combatResult } };
  }

  if (encounter.sourceType === 'tournament') {
    // A tournament bout (tournaments-circuits): a team battle; the bracket moves on.
    const tournament = next.tournaments.find((item) => item.id === encounter.sourceId);
    if (!tournament || tournament.status !== 'active') return { state, error: 'The tournament round can no longer be found.' };
    const rng = rngFor(next, `tournament-combat:${tournament.id}:${tournament.currentRoundSize}`);
    round = resolveGuildRoundInPlace(next, tournament, rng, 'Measured', combatResult);
    recordRivalryInPlace(next, encounter.sourceMeta?.opponentGuildId, combatResult.playerWon ? 'guildBoutWon' : 'guildBoutLost');
    if (combatResult.playerWon) pushMoment(next, { type: 'victory', title: `${tournament.name}: bout won`, gold: 0, xp: [], loot: [] });
    if (round.playerLost) report = completeGuildTournamentInPlace(next, tournament, rng, round.roundSize);
    else if (tournament.activeEntrants.length === 1) report = completeGuildTournamentInPlace(next, tournament, rng, 1);
    commitRng(next, rng);
  } else {
    return { state, error: 'Unknown combat source.' };
  }

  next.activeEncounter = null;
  evaluateStateInPlace(next);
  return { state: finalize(next), error: null, result: round, report };
}
