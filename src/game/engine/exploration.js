// @ts-check
// Walkable towns and wild areas: dialogue (conditions and effects), saved
// positions per scene, wild-area entry, gathering, resting at camp and
// starting battles with enemy groups standing on the map.
// Walking itself is presentation; only facts and positions are recorded here.
import { DIALOGUES, SEASON_MONTHS, TOP_LEVEL_FLAGS } from '../../data/dialogue/index.js';
import { TOWNS } from '../../data/towns/index.js';
import { TILE_SIZE } from '../../data/tiles.js';
import { WILD_AREAS, WILD_RESPAWN, areaGroups } from '../../data/wilds/index.js';
import { ENEMY_TYPES } from '../../data/enemies.js';
import { createPartyEncounter } from '../combat.js';
import { addChronicle, campaignMonthSerial, campaignWeekSerial, clamp, clone, commitRng, earnGoldInPlace, finalize, hashString, rngFor, tallySpend } from './core.js';
import { adjustPatronInPlace, patronAtLeast, patronLevel } from './charter.js';
import { PATRON_DELTAS } from '../../data/patrons.js';
import { grantPatronRewardsInPlace } from './connections.js';
import { addItemsInPlace, battleItems, settleBattleItemsInPlace } from './inventory.js';
import { concludeActiveCombat } from './encounters.js';
import { adjustRegionReputationInPlace } from './reputation.js';
import { getStoryView } from './stories.js';
import { advanceWeeks } from './time.js';


/** Pixel centre of a tile, for saved positions. */
export function tilePoint([col, row]) {
  return { x: Math.round((col + 0.5) * TILE_SIZE), y: Math.round((row + 0.5) * TILE_SIZE) };
}

function explorationInPlace(state) {
  state.world.exploration ||= {};
  const exploration = state.world.exploration;
  exploration.positions ||= {};
  exploration.discovered ||= {};
  exploration.talked ||= {};
  exploration.npcs ||= {};
  exploration.wild ||= {};
  return exploration;
}

function wildStateInPlace(state, areaId) {
  const exploration = explorationInPlace(state);
  exploration.wild[areaId] ||= { cleared: {}, gathered: {}, visited: false, bosses: 0 };
  return exploration.wild[areaId];
}

function knowledgeInPlace(state) {
  state.world.knowledge ||= { locations: {}, events: {}, sources: {} };
  state.world.knowledge.locations ||= {};
  state.world.knowledge.events ||= {};
  state.world.knowledge.sources ||= {};
  return state.world.knowledge;
}

const oldRoadCleared = (state) => (state.missionHistory || []).some((mission) => mission.templateId === 'wolves-old-road');

// ---------------------------------------------------------------------------
// Conditions

/**
 * True when every key of `condition` holds. Shared by dialogue, wild-area
 * unlocks and enemy groups (see src/data/dialogue/index.js for the keys).
 */
export function checkCondition(state, condition, context = {}) {
  if (!condition) return true;
  const exploration = state.world?.exploration || {};
  const flags = { ...(state.flags?.dialogue || {}), ...Object.fromEntries(TOP_LEVEL_FLAGS.map((name) => [name, state.flags?.[name]])) };
  const story = () => getStoryView(state);
  return Object.entries(condition).every(([key, value]) => {
    switch (key) {
      case 'talked':
        return Boolean(exploration.talked?.[context.conversationId]) === value;
      case 'oldRoadCleared':
        return oldRoadCleared(state) === value;
      case 'tierAtLeast':
        return (state.guild?.tierIndex || 0) >= value;
      case 'fameAtLeast':
        return (state.guild?.fame || 0) >= value;
      case 'goldAtLeast':
        return (state.guild?.crowns || 0) >= value;
      case 'storyStarted':
        return story().started === value;
      case 'storyStepAtLeast':
        return story().step >= value;
      case 'storyDone':
        return Boolean(story().done) === value;
      case 'storyOpen':
        return Boolean(story().blackwoodOpen) === value;
      case 'season': {
        const seasons = Array.isArray(value) ? value : [value];
        return seasons.some((season) => (SEASON_MONTHS[season] || []).includes(state.date.month));
      }
      case 'flag':
        return Boolean(flags[value]);
      case 'notFlag':
        return !flags[value];
      case 'candidateHere':
        return (state.candidates || []).some((candidate) => (candidate.locationId || 'dunmere') === (state.world?.currentLocationId || 'dunmere')) === value;
      case 'visitedArea':
        return Boolean(exploration.wild?.[value]?.visited);
      case 'bossDefeated':
        return (exploration.wild?.[value]?.bosses || 0) > 0;
      case 'charter':
        return (Array.isArray(value) ? value : [value]).includes(state.guild?.charter);
      case 'patronAtLeast':
        return Object.entries(value).every(([id, level]) => patronAtLeast(state, id, level));
      case 'patronBelow':
        return Object.entries(value).every(([id, level]) => !patronAtLeast(state, id, level));
      case 'patronRival':
        return patronLevel(state, value).index < 0;
      case 'patronGiftReady':
        return state.patrons?.[value]?.lastGift !== campaignMonthSerial(state) && (state.guild?.crowns || 0) >= PATRON_DELTAS.giftCost;
      default:
        return false;
    }
  });
}

// ---------------------------------------------------------------------------
// Dialogue

function fillText(state, text) {
  const founder = state.heroes?.find((hero) => hero.id === state.guild.founderHeroId)?.name || state.guild.founder || 'the founder';
  return String(text).replaceAll('{guild}', state.guild.name).replaceAll('{founder}', founder);
}

function resolveLines(state, conversation, lines = []) {
  return lines.map((line) =>
    typeof line === 'string'
      ? { speaker: conversation.speaker, portrait: conversation.portrait, text: fillText(state, line) }
      : { speaker: line.speaker || conversation.speaker, portrait: line.portrait || conversation.portrait, text: fillText(state, line.text) },
  );
}

/**
 * What a conversation shows right now: speaker, portrait, lines and the
 * choices whose conditions pass (each keeps its index in the data).
 */
export function getDialogueView(state, conversationId) {
  const conversation = DIALOGUES[conversationId];
  if (!conversation) return null;
  const context = { conversationId };
  const variantIndex = conversation.variants.findIndex((variant) => checkCondition(state, variant.if, context));
  if (variantIndex < 0) return null;
  const variant = conversation.variants[variantIndex];
  return {
    id: conversationId,
    variantIndex,
    speaker: conversation.speaker,
    portrait: conversation.portrait,
    lines: resolveLines(state, conversation, variant.lines),
    choices: (variant.choices || [])
      .map((choice, index) => ({ index, text: fillText(state, choice.text), if: choice.if }))
      .filter((choice) => checkCondition(state, choice.if, context))
      .map(({ index, text }) => ({ index, text })),
  };
}

/** The reply lines of a choice, filled in. */
export function getDialogueReply(state, conversationId, variantIndex, choiceIndex) {
  const conversation = DIALOGUES[conversationId];
  const choice = conversation?.variants[variantIndex]?.choices?.[choiceIndex];
  return choice ? resolveLines(state, conversation, choice.reply || []) : [];
}

/** Applies dialogue effects; returns what the UI should do next ({ open, recruit }). */
function applyEffectsInPlace(state, effects = [], context = {}) {
  const ui = {};
  const knowledge = knowledgeInPlace(state);
  const exploration = explorationInPlace(state);
  effects.forEach((effect) => {
    if (typeof effect.gold === 'number') {
      if (effect.gold > 0) earnGoldInPlace(state, effect.gold);
      else state.guild.crowns = Math.max(0, state.guild.crowns + effect.gold);
    }
    if (effect.patron) adjustPatronInPlace(state, effect.patron.id, effect.patron.amount);
    if (effect.patronGift && state.patrons?.[effect.patronGift]?.lastGift !== campaignMonthSerial(state)) {
      state.guild.crowns -= PATRON_DELTAS.giftCost;
      tallySpend(state, 'patrons', PATRON_DELTAS.giftCost);
      state.patrons[effect.patronGift].lastGift = campaignMonthSerial(state);
      adjustPatronInPlace(state, effect.patronGift, PATRON_DELTAS.gift);
    }
    if (effect.item) addItemsInPlace(state, effect.item);
    if (effect.reputation) adjustRegionReputationInPlace(state, effect.reputation.region, effect.reputation.amount);
    if (typeof effect.relationship === 'number' && context.conversationId) {
      exploration.npcs[context.conversationId] = clamp((exploration.npcs[context.conversationId] || 0) + effect.relationship, -10, 10);
    }
    if (effect.flag) {
      if (TOP_LEVEL_FLAGS.includes(effect.flag)) state.flags[effect.flag] = true;
      else {
        state.flags.dialogue ||= {};
        state.flags.dialogue[effect.flag] = true;
      }
    }
    if (effect.rumor) {
      const current = knowledge.locations[effect.rumor.location];
      if (!current || current === 'unknown') knowledge.locations[effect.rumor.location] = 'rumored';
      knowledge.sources[effect.rumor.location] ||= { source: context.speaker || 'A traveller', note: effect.rumor.note };
    }
    if (effect.event) knowledge.events[effect.event.id] = { source: context.speaker || 'Town talk', note: effect.event.note };
    if (effect.open) ui.open = effect.open;
    if (effect.recruit) ui.recruit = true;
  });
  if (effects.some((effect) => effect.patron || effect.patronGift)) grantPatronRewardsInPlace(state);
  return ui;
}

/**
 * Starts a conversation: counts it and applies the shown variant's own effects.
 * `visit` ({ sceneId, targetId, position }) also records who was talked to and where.
 */
export function talkTo(state, conversationId, visit = null) {
  const conversation = DIALOGUES[conversationId];
  const view = getDialogueView(state, conversationId);
  if (!conversation || !view) return { state, error: 'Nobody answers.' };
  const next = visit ? recordSceneVisit(state, visit.sceneId, visit.targetId, visit.position) : clone(state);
  const exploration = explorationInPlace(next);
  const ui = applyEffectsInPlace(next, conversation.variants[view.variantIndex].effects, { conversationId, speaker: conversation.speaker });
  exploration.talked[conversationId] = (exploration.talked[conversationId] || 0) + 1;
  return { state: finalize(next), error: null, ui };
}

/** Picks a dialogue choice and applies its effects. Returns UI follow-ups ({ open, recruit }). */
export function chooseDialogueOption(state, conversationId, variantIndex, choiceIndex) {
  const conversation = DIALOGUES[conversationId];
  const choice = conversation?.variants[variantIndex]?.choices?.[choiceIndex];
  if (!choice) return { state, error: 'That choice is no longer open.' };
  if (!checkCondition(state, choice.if, { conversationId })) return { state, error: 'That choice is no longer open.' };
  const next = clone(state);
  const ui = applyEffectsInPlace(next, choice.effects, { conversationId, speaker: conversation.speaker });
  return { state: finalize(next), error: null, ui };
}

// ---------------------------------------------------------------------------
// Positions and discovery

/** Saves where the founder stands in a scene, so leaving and returning puts them back there. */
export function saveScenePosition(state, sceneId, position) {
  if (!position || !Number.isFinite(position.x) || !Number.isFinite(position.y)) return state;
  const saved = state.world?.exploration?.positions?.[sceneId];
  if (saved && saved.x === Math.round(position.x) && saved.y === Math.round(position.y)) return state;
  const next = clone(state);
  explorationInPlace(next).positions[sceneId] = { x: Math.round(position.x), y: Math.round(position.y) };
  return finalize(next);
}

/**
 * Records an interaction in a scene (a door, a person, a landmark) and the
 * position it happened at. A town whose every door, person and landmark has
 * been visited becomes "fully explored" on the world map.
 */
export function recordSceneVisit(state, sceneId, targetId, position) {
  const next = clone(state);
  const exploration = explorationInPlace(next);
  const seen = new Set(exploration.discovered[sceneId] || []);
  seen.add(targetId);
  exploration.discovered[sceneId] = [...seen];
  if (position && Number.isFinite(position.x)) exploration.positions[sceneId] = { x: Math.round(position.x), y: Math.round(position.y) };
  const town = TOWNS[sceneId];
  if (town) {
    const all = [
      ...town.buildings.map((building) => `door:${building.id || building.building}`),
      ...town.npcs.map((npc) => `npc:${npc.id}`),
      ...town.props.filter((prop) => prop.poi).map((prop) => `poi:${prop.id}`),
    ];
    if (all.every((id) => seen.has(id))) knowledgeInPlace(next).locations[sceneId] = 'fullyExplored';
  }
  return finalize(next);
}

// ---------------------------------------------------------------------------
// Wild areas

/** Read model of a wild area: whether it is open, and which groups and spots are there now. */
export function getWildAreaView(state, areaId) {
  const area = WILD_AREAS[areaId];
  if (!area) return null;
  const serial = campaignWeekSerial(state);
  const wild = state.world?.exploration?.wild?.[areaId] || { cleared: {}, gathered: {} };
  const groups = areaGroups(area).map((group) => {
    const until = wild.cleared?.[group.id] || 0;
    const present = checkCondition(state, group.if);
    return { id: group.id, name: group.isBoss ? group.boss.name : group.name, boss: Boolean(group.isBoss), present, cleared: until > serial, weeksLeft: Math.max(0, until - serial), available: present && until <= serial };
  });
  const gathers = area.gathers.map((spot) => {
    const until = wild.gathered?.[spot.id] || 0;
    return { id: spot.id, name: spot.name, available: until <= serial, weeksLeft: Math.max(0, until - serial) };
  });
  const unlocked = checkCondition(state, area.unlock);
  return {
    area,
    unlocked,
    here: state.world?.wildAreaId === areaId,
    atHub: !state.world?.activeTravel && state.world?.currentLocationId === area.hub,
    visited: Boolean(wild.visited),
    groups,
    gathers,
    activeTargets: [
      'camp',
      'exit',
      ...(area.props || []).filter((prop) => prop.poi).map((prop) => `poi:${prop.id}`),
      ...groups.filter((group) => group.available).map((group) => `enemy:${group.id}`),
      ...gathers.filter((spot) => spot.available).map((spot) => `gather:${spot.id}`),
    ],
  };
}

/** Leaves town for a wild area next to it. `fromPosition` is where the founder stood in town. */
export function enterWildArea(state, areaId, fromPosition = null) {
  const area = WILD_AREAS[areaId];
  if (!area) return { state, error: 'Unknown place.' };
  if (state.world?.activeTravel) return { state, error: 'The guild is on the road.' };
  if (state.world?.currentLocationId !== area.hub) return { state, error: `${area.name} is reached from ${TOWNS[area.hub]?.name || area.hub}.` };
  if (!checkCondition(state, area.unlock)) return { state, error: area.lockedText || `${area.name} is closed for now.` };
  if (state.activeEncounter || state.pendingDecisions.length) return { state, error: 'Finish what is in front of you first.' };
  const next = clone(state);
  const wild = wildStateInPlace(next, areaId);
  const exploration = explorationInPlace(next);
  if (!wild.visited) {
    wild.visited = true;
    addChronicle(next, { type: 'travel', importance: 1, title: `Into ${area.name}`, text: `${next.guild.name} sets out from ${TOWNS[area.hub]?.name} into ${area.name}.`, tags: ['explore'] });
  }
  exploration.positions[areaId] = tilePoint(area.arrive);
  if (fromPosition && Number.isFinite(fromPosition.x)) exploration.positions[area.hub] = { x: Math.round(fromPosition.x), y: Math.round(fromPosition.y) };
  next.world.wildAreaId = areaId;
  return { state: finalize(next), error: null };
}

/** Returns from a wild area to its hub town. */
export function leaveWildArea(state, position = null) {
  const areaId = state.world?.wildAreaId;
  if (!areaId) return { state, error: null };
  const next = clone(state);
  if (position && Number.isFinite(position.x)) explorationInPlace(next).positions[areaId] = { x: Math.round(position.x), y: Math.round(position.y) };
  next.world.wildAreaId = null;
  return { state: finalize(next), error: null };
}

function areaSpot(state, areaId, spotId) {
  const view = getWildAreaView(state, areaId);
  return { view, spot: view?.area.gathers.find((item) => item.id === spotId), status: view?.gathers.find((item) => item.id === spotId) };
}

/** Gathers herbs, ore or a coin pouch. The spot refills after a few weeks. */
export function gatherAtSpot(state, areaId, spotId) {
  const { view, spot, status } = areaSpot(state, areaId, spotId);
  if (!view?.here || !spot) return { state, error: 'There is nothing to gather here.' };
  if (!status.available) return { state, error: `${spot.name} has been picked clean. Come back in ${status.weeksLeft} week${status.weeksLeft === 1 ? '' : 's'}.` };
  const next = clone(state);
  const rng = rngFor(next, `gather:${areaId}:${spotId}:${campaignWeekSerial(next)}`);
  const parts = [];
  if (spot.reward.gold) {
    const gold = rng.int(spot.reward.gold[0], spot.reward.gold[1]);
    earnGoldInPlace(next, gold);
    parts.push(`${gold} crowns`);
  }
  if (spot.reward.items) {
    addItemsInPlace(next, spot.reward.items);
    parts.push(Object.entries(spot.reward.items).map(([id, count]) => `${count}× ${id.replace(/-/g, ' ')}`).join(', '));
  }
  commitRng(next, rng);
  wildStateInPlace(next, areaId).gathered[spotId] = campaignWeekSerial(next) + (spot.respawnWeeks || WILD_RESPAWN.gathers);
  return { state: finalize(next), error: null, message: `${spot.name}: ${parts.join(' and ')}.` };
}

/** Rests at the area's camp: one week passes, the party heals. */
export function restAtCamp(state, areaId) {
  const area = WILD_AREAS[areaId];
  if (!area || state.world?.wildAreaId !== areaId) return { state, error: 'There is no camp here.' };
  const result = advanceWeeks(state, 1);
  if (result.error) return result;
  const next = clone(result.state);
  let healed = 0;
  next.heroes.forEach((hero) => {
    if (['dead', 'retired'].includes(hero.status)) return;
    hero.health = clamp((hero.health ?? 100) + 30, 0, 100);
    hero.fatigue = clamp((hero.fatigue ?? 0) - 30, 0, 100);
    if (hero.status === 'injured') {
      hero.injuryWeeks = Math.max(0, (hero.injuryWeeks || 0) - 2);
      if (hero.injuryWeeks === 0) {
        hero.status = 'available';
        hero.injury = null;
        healed += 1;
      }
    }
  });
  return { state: finalize(next), error: null, message: `A week by the fire at ${area.camp.name}. Wounds close${healed ? `; ${healed} hero${healed === 1 ? '' : 'es'} fit to fight again` : ''}.` };
}

/** The heroes who fight in the wild: the main party if fit, else the strongest available. */
function wildFighters(state) {
  const fit = (hero) => hero && hero.status === 'available';
  const main = (state.guild.mainParty || []).map((id) => state.heroes.find((hero) => hero.id === id)).filter(fit);
  if (main.length) return main.slice(0, 4);
  return state.heroes.filter(fit).sort((a, b) => b.power - a.power).slice(0, 4);
}

/** Starts a battle with an enemy group standing in the current wild area. */
export function startWildBattle(state, areaId, groupId, position = null) {
  const area = WILD_AREAS[areaId];
  const view = getWildAreaView(state, areaId);
  const group = areaGroups(area).find((item) => item.id === groupId);
  const status = view?.groups.find((item) => item.id === groupId);
  if (!view?.here || !group) return { state, error: 'Nobody to fight here.' };
  if (!status.available) return { state, error: 'They are gone for now.' };
  if (state.activeEncounter) return { state, error: 'A battle is already under way.' };
  if (!wildFighters(state).length) return { state, error: 'Nobody in the guild is fit to fight. Rest at the camp first.' };
  const next = clone(state);
  wildEncounterInPlace(next, area, group, 1);
  if (position && Number.isFinite(position.x)) explorationInPlace(next).positions[areaId] = { x: Math.round(position.x), y: Math.round(position.y) };
  return { state: finalize(next), error: null };
}

/** Builds the battle against a wild group. `attempt` changes the seed on a retry. */
function wildEncounterInPlace(next, area, group, attempt) {
  const areaId = area.id;
  const groupId = group.id;
  const fighters = wildFighters(next);
  const serial = campaignWeekSerial(next);
  const types = group.types.map((id) => ENEMY_TYPES[id]).filter(Boolean);
  next.activeEncounter = createPartyEncounter({
    id: `wild-${areaId}-${groupId}-${serial}-${attempt}`,
    seed: (next.rngState ^ hashString(`wild:${areaId}:${groupId}:${serial}:${attempt}`)) >>> 0,
    sourceType: 'wild',
    sourceId: groupId,
    title: group.isBoss ? group.boss.name : group.name,
    roundName: area.name,
    objective: group.isBoss ? 'Bring down the beast of this place.' : 'Drive them off the road.',
    playerHeroes: fighters.map((hero) => ({ hero, role: 'Fighter' })),
    opponentName: group.name,
    opponentPrimal: area.primal,
    opponentLevel: group.level,
    opponentPower: group.power,
    enemyCount: clamp(group.count, 1, 5),
    enemyTypes: types,
    boss: group.isBoss ? group.boss : null,
    risk: group.isBoss ? 4 : 2,
    canFlee: true,
    items: battleItems(next),
  });
  next.activeEncounter.sourceMeta = { areaId, groupId, boss: Boolean(group.isBoss) };
  next.activeEncounter.background = area.battle;
  next.activeEncounter.attempt = attempt;
}

function wipedInTheWild(state) {
  const encounter = state.activeEncounter;
  return encounter?.sourceType === 'wild' && encounter.status === 'lost' && encounter.result?.method !== 'withdrew';
}

/** After a party wipe in the wild: fight the same group again from the start (items used stay used). */
export function retryWildBattle(state) {
  if (!wipedInTheWild(state)) return { state, error: 'There is no lost battle to retry.' };
  const { areaId, groupId } = state.activeEncounter.sourceMeta || {};
  const area = WILD_AREAS[areaId];
  const group = areaGroups(area).find((item) => item.id === groupId);
  if (!area || !group) return { state, error: 'That fight can no longer be found.' };
  const next = clone(state);
  settleBattleItemsInPlace(next, next.activeEncounter.result.itemsUsed);
  const attempt = (next.activeEncounter.attempt || 1) + 1;
  next.activeEncounter = null;
  wildEncounterInPlace(next, area, group, attempt);
  return { state: finalize(next), error: null };
}

/** After a party wipe in the wild: the fallen are carried back to the camp (they are injured as usual). */
export function retreatToCamp(state) {
  if (!wipedInTheWild(state)) return { state, error: 'There is no lost battle to retreat from.' };
  const area = WILD_AREAS[state.activeEncounter.sourceMeta?.areaId];
  const result = concludeActiveCombat(state);
  if (result.error || !area) return result;
  const next = clone(result.state);
  const [col, row] = area.camp.at;
  const [w, h] = area.camp.size;
  explorationInPlace(next).positions[area.id] = { x: Math.round((col + w / 2) * TILE_SIZE), y: Math.round((row + h) * TILE_SIZE + 18) };
  return { state: finalize(next), error: null };
}
