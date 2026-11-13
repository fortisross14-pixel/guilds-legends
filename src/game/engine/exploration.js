// @ts-check
// Walkable towns and wild areas: dialogue (conditions and effects), saved
// positions per scene, wild-area entry, gathering, resting at camp and
// starting battles with enemy groups standing on the map.
// Walking itself is presentation; only facts and positions are recorded here.
// Conditions are shared with the story (checkCondition, story.js).
import { MONTHS } from '../../data/content.js';
import { DIALOGUES, TOP_LEVEL_FLAGS } from '../../data/dialogue/index.js';
import { TOWNS } from '../../data/towns/index.js';
import { TILE_SIZE } from '../../data/tiles.js';
import { WILD_AREAS, WILD_RESPAWN, areaGroups, areaLinks, findWildGroup } from '../../data/wilds/index.js';
import { roadForArea } from '../../data/roads.js';
import { ENEMY_TYPES } from '../../data/enemies.js';
import { createPartyEncounter } from '../combat.js';
import { addChronicle, campaignMonthSerial, campaignWeekSerial, clamp, clone, commitRng, earnGoldInPlace, finalize, hashString, rngFor, tallySpend } from './core.js';
import { adjustPatronInPlace } from './charter.js';
import { PATRON_DELTAS } from '../../data/patrons.js';
import { grantPatronRewardsInPlace } from './connections.js';
import { addItemsInPlace, battleItems, settleBattleItemsInPlace } from './inventory.js';
import { concludeActiveCombat } from './encounters.js';
import { adjustRegionReputationInPlace, adjustStandingInPlace } from './reputation.js';
import {
  addEvidenceInPlace,
  checkCondition,
  storyChoiceInPlace,
  storyConversationFor,
  storyRecruitInPlace,
  storyRouteInPlace,
  storySceneChoiceInPlace,
  unlockCodexInPlace,
  askAroundHere, askAroundReply, askedAroundInPlace } from './story.js';
import { rentLotInPlace } from './hall.js';
import { HOME_LOT_ID } from '../../data/lots.js';
import { advanceDays } from './time.js';
import { introduceInPlace } from './people.js';


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
export function getDialogueView(state, requestedId) {
  const conversationId = storyConversationFor(state, requestedId);
  const conversation = DIALOGUES[conversationId];
  if (!conversation) return null;
  const context = { conversationId };
  const variantIndex = conversation.variants.findIndex((variant) => checkCondition(state, variant.if, context));
  if (variantIndex < 0) return null;
  const variant = conversation.variants[variantIndex];
  const asked = explorationOf(state).asked?.[conversationId] || {};
  // The hub: topics the player can ask about, in any order. Several entries can
  // share an id (versions for different situations): the first one that holds is used.
  const seen = new Set();
  const topics = topicsOf(state, conversationId)
    .filter((topic) => checkCondition(state, topic.if, context))
    .filter((topic) => (seen.has(topic.id) ? false : seen.add(topic.id)))
    .map((topic) => ({ id: topic.id, text: fillText(state, topic.text), asked: Boolean(asked[topic.id]) }));
  return {
    id: conversationId,
    variantIndex,
    speaker: conversation.speaker,
    portrait: conversation.portrait,
    lines: resolveLines(state, conversation, variant.lines),
    // Small talk (or, in a story scene, the decision) after the opener.
    choices: (variant.choices || [])
      .map((choice, index) => ({ index, text: fillText(state, choice.text), if: choice.if }))
      .filter((choice) => checkCondition(state, choice.if, context))
      .map(({ index, text }) => ({ index, text })),
    hub: conversation.topics ? topics : null,
    // A decision scene: the topics sit beside the choices (ask, then decide), not after them.
    decide: Boolean(conversation.decide),
    bye: conversation.bye ? { text: fillText(state, conversation.bye.text), lines: resolveLines(state, conversation, conversation.bye.lines || []) } : null,
    // Story scenes and objects: what the way out says (false: no way out but the choices).
    leave: conversation.leave === undefined ? 'Leave' : conversation.leave,
  };
}

function explorationOf(state) {
  return state.world?.exploration || {};
}

// "Ask around" (src/data/dialogue/askAround.js): while such a story step is current, every
// town conversation with a hub gets the question; not story scenes, and not the one who knows.
function askTopicFor(state, conversationId) {
  const conversation = DIALOGUES[conversationId];
  if (!conversation?.topics || conversation.decide || conversationId.startsWith('story.')) return null;
  const entry = askAroundHere(state, conversationId);
  return entry ? { id: 'ask-around', text: entry.text, lines: askAroundReply(state, entry, conversationId), askAround: entry } : null;
}

function topicsOf(state, conversationId) {
  const ask = askTopicFor(state, conversationId);
  return [...(ask ? [ask] : []), ...(DIALOGUES[conversationId]?.topics || [])];
}

function topicOf(state, conversationId, topicId) {
  return topicsOf(state, conversationId).find((topic) => topic.id === topicId && checkCondition(state, topic.if, { conversationId })) || null;
}

/** A hub topic's answer, filled in. */
export function getTopicReply(state, conversationId, topicId) {
  const topic = topicOf(state, conversationId, topicId);
  return topic ? resolveLines(state, DIALOGUES[conversationId], topic.lines || []) : [];
}

/** Asks a hub topic: applies its effects and remembers it was asked. Returns UI follow-ups ({ open, recruit }). */
export function askDialogueTopic(state, conversationId, topicId) {
  const conversation = DIALOGUES[conversationId];
  const topic = topicOf(state, conversationId, topicId);
  if (!topic) return { state, error: 'They have nothing to say about that.' };
  const next = clone(state);
  if (topic.askAround) askedAroundInPlace(next, topic.askAround, conversationId);
  const ui = applyEffectsInPlace(next, topic.effects, { conversationId, speaker: conversation.speaker });
  const exploration = explorationInPlace(next);
  exploration.asked ||= {};
  exploration.asked[conversationId] = { ...(exploration.asked[conversationId] || {}), [topicId]: true };
  return { state: finalize(next), error: null, ui };
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
  // Story effects first: a route or choice can matter to the effects after it.
  effects.forEach((effect) => {
    if (effect.route) storyRouteInPlace(state, context.conversationId, effect.route);
    if (effect.choice) storyChoiceInPlace(state, effect.choice);
    if (effect.codex) (Array.isArray(effect.codex) ? effect.codex : [effect.codex]).forEach((id) => unlockCodexInPlace(state, id));
    if (effect.evidence) addEvidenceInPlace(state, effect.evidence);
    if (effect.storyRecruit) storyRecruitInPlace(state, effect.storyRecruit);
    if (typeof effect.rentLot === 'number') rentLotInPlace(state, HOME_LOT_ID, effect.rentLot);
    if (typeof effect.fame === 'number') state.guild.fame = Math.max(0, state.guild.fame + effect.fame);
    if (typeof effect.legacy === 'number') state.guild.legacy += effect.legacy;
    if (effect.heroLoyalty) {
      const hero = state.heroes.find((item) => item.storyId === effect.heroLoyalty.id);
      if (hero) hero.loyalty = clamp(hero.loyalty + effect.heroLoyalty.amount, 0, 100);
    }
  });
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
    // Items handed over or received: { giveItem: { 'wolf-pelt': 3 } } gives them to the guild, takeItem takes them.
    if (effect.giveItem) addItemsInPlace(state, effect.giveItem);
    if (effect.takeItem) addItemsInPlace(state, Object.fromEntries(Object.entries(effect.takeItem).map(([id, count]) => [id, -count])));
    // Honor and dread (docs/design/PILLARS.md): { standing: { honor: 8, dread: 4, text: 'Handed the thief to the watch' } }.
    if (effect.standing) adjustStandingInPlace(state, effect.standing, effect.standing.text || '');
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
    // A keeper's introduction: everyone looking for work in the tavern becomes known, and the tavern opens.
    if (effect.recruit) {
      introduceInPlace(state, state.world?.currentLocationId || 'dunmere');
      ui.open = 'tavern';
    }
  });
  if (effects.some((effect) => effect.patron || effect.patronGift)) grantPatronRewardsInPlace(state);
  return ui;
}

/**
 * Starts a conversation: counts it and applies the shown variant's own effects.
 * `visit` ({ sceneId, targetId, position }) also records who was talked to and where.
 */
export function talkTo(state, requestedId, visit = null) {
  const conversationId = storyConversationFor(state, requestedId);
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
  // A story scene's choice completes its step ({ wait: true } keeps it open for tomorrow).
  storySceneChoiceInPlace(next, conversationId, (choice.effects || []).some((effect) => effect.wait));
  const days = (choice.effects || []).reduce((sum, effect) => sum + (effect.passDays || 0), 0);
  if (days > 0) return { ...advanceDays(next, days, true), ui };
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
    // A building held by a boss (`gate`) stays shut until that boss is beaten (Dawnwatch Temple).
    gates: Object.fromEntries((area.buildings || []).filter((building) => building.gate).map((building) => [building.building, !wild.cleared?.[building.gate]])),
    activeTargets: [
      'camp',
      'exit',
      ...areaLinks(area).map((item) => `exit:${item.town}`),
      ...(area.buildings || []).map((building) => `door:${building.building}`),
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
  const from = state.world?.currentLocationId;
  const link = areaLinks(area).find((item) => item.town === from);
  if (!link) return { state, error: `${area.name} is reached from ${areaLinks(area).map((item) => TOWNS[item.town]?.name || item.town).join(' or ')}.` };
  if (!checkCondition(state, area.unlock)) return { state, error: area.lockedText || `${area.name} is closed for now.` };
  // The road's gate (story progress), src/data/roads.js.
  const road = roadForArea(areaId);
  if (road?.gate && !checkCondition(state, road.gate)) return { state, error: road.lockedText || `${road.name} is closed for now.` };
  if (state.activeEncounter) return { state, error: 'Finish what is in front of you first.' };
  const next = clone(state);
  const wild = wildStateInPlace(next, areaId);
  const exploration = explorationInPlace(next);
  if (!wild.visited) {
    wild.visited = true;
    addChronicle(next, { type: 'travel', importance: 1, title: `Into ${area.name}`, text: `${next.guild.name} sets out from ${TOWNS[from]?.name} into ${area.name}.`, tags: ['explore'] });
  }
  // You start at the end of the road you came in by.
  exploration.positions[areaId] = tilePoint(link.arrive);
  if (fromPosition && Number.isFinite(fromPosition.x)) exploration.positions[from] = { x: Math.round(fromPosition.x), y: Math.round(fromPosition.y) };
  next.world.wildAreaId = areaId;
  // The leg from this town to the road (src/data/roads.js) passes while you travel.
  const days = road?.legs?.[from] || 0;
  next.world.trip = { from, areaId, days, legs: [{ to: road?.name || area.name, days }], startedOn: dateText(next.date) };
  if (days > 0) {
    const moved = advanceDays(next, days, true);
    if (moved.error) return { state, error: moved.error };
  }
  return { state: finalize(next), error: null, days };
}

/** "Brightwane week 2, day 3": a date for trip reports. */
function dateText(date) {
  return `${MONTHS[date.month] || `month ${date.month + 1}`} week ${(date.week || 0) + 1}, day ${(date.day || 0) + 1}`;
}

/**
 * Leaves a wild area by one of its ends (`toTown`; by default the town you came
 * from). Walking a road to its far end arrives in the town there, at that town's
 * gate for the road.
 */
export function leaveWildArea(state, position = null, toTown = null) {
  const areaId = state.world?.wildAreaId;
  if (!areaId) return { state, error: null };
  const area = WILD_AREAS[areaId];
  const from = state.world.currentLocationId;
  const to = toTown || from;
  if (!areaLinks(area).some((item) => item.town === to)) return { state, error: 'This way does not lead out.' };
  const next = clone(state);
  const exploration = explorationInPlace(next);
  if (position && Number.isFinite(position.x)) exploration.positions[areaId] = { x: Math.round(position.x), y: Math.round(position.y) };
  next.world.wildAreaId = null;
  if (to === from) {
    // Turning back the way you came costs nothing more.
    next.world.trip = null;
  } else {
    // On to the far town: its leg passes, then the trip is reported.
    const road = roadForArea(areaId);
    const days = road?.legs?.[to] || 0;
    if (days > 0) {
      const moved = advanceDays(next, days, true);
      if (moved.error) return { state, error: moved.error };
    }
    const trip = next.world.trip || { from, days: 0, legs: [], startedOn: null };
    const legs = [...(trip.legs || []), { to: TOWNS[to]?.name || to, days }];
    const total = legs.reduce((sum, leg) => sum + leg.days, 0);
    next.notifications.push({
      id: `arrived-${to}-${dateText(next.date)}`,
      tone: 'gold',
      title: `Arrived in ${TOWNS[to]?.name || to}: ${total} day${total === 1 ? '' : 's'} on the road`,
      text: `${legs.map((leg) => `${leg.days} day${leg.days === 1 ? '' : 's'} to ${leg.to}`).join(', then ')}.${trip.startedOn ? ` Left ${TOWNS[trip.from]?.name || trip.from} on ${trip.startedOn}; today is ${dateText(next.date)}.` : ''}`,
    });
    next.world.trip = null;
    next.world.currentLocationId = to;
    next.world.visitedLocationIds = [...new Set([...(next.world.visitedLocationIds || []), to])];
    next.world.knowledge ||= { locations: {}, events: {}, sources: {} };
    next.world.knowledge.locations ||= {};
    next.world.knowledge.locations[to] = 'visited';
    // Step in through the town's gate for this road.
    const gate = (TOWNS[to]?.exits || []).find((item) => item.area === areaId);
    if (gate) {
      const [col, row] = gate.at;
      const [w, h] = gate.size || [1, 1];
      const inward = { x: col === 0 ? 1.5 : col + w >= (TOWNS[to].width || 40) ? -1 : 0, y: row === 0 ? 1.5 : row + h >= (TOWNS[to].height || 26) ? -1.5 : 0 };
      exploration.positions[to] = { x: Math.round((col + w / 2 + inward.x) * TILE_SIZE), y: Math.round((row + h / 2 + 0.5 + inward.y) * TILE_SIZE) };
    } else delete exploration.positions[to];
    addChronicle(next, { type: 'travel', importance: 1, title: `Arrived in ${TOWNS[to]?.name || to}`, text: `${next.guild.name} walks ${area.name} from ${TOWNS[from]?.name || from} to ${TOWNS[to]?.name || to}.`, tags: ['travel'] });
  }
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
    parts.push(`${gold} gold`);
  }
  if (spot.reward.items) {
    addItemsInPlace(next, spot.reward.items);
    parts.push(Object.entries(spot.reward.items).map(([id, count]) => `${count}× ${id.replace(/-/g, ' ')}`).join(', '));
  }
  commitRng(next, rng);
  wildStateInPlace(next, areaId).gathered[spotId] = campaignWeekSerial(next) + (spot.respawnWeeks || WILD_RESPAWN.gathers);
  return { state: finalize(next), error: null, message: `${spot.name}: ${parts.join(' and ')}.` };
}

/** Camps for the night: one day passes, the party heals. */
export function restAtCamp(state, areaId) {
  const area = WILD_AREAS[areaId];
  if (!area || state.world?.wildAreaId !== areaId) return { state, error: 'There is no camp here.' };
  const result = advanceDays(state, 1);
  if (result.error) return result;
  const next = clone(result.state);
  let healed = 0;
  next.heroes.forEach((hero) => {
    if (['dead', 'retired'].includes(hero.status)) return;
    hero.health = clamp((hero.health ?? 100) + 20, 0, 100);
    hero.mana = 100;
    hero.fatigue = clamp((hero.fatigue ?? 0) - 20, 0, 100);
    if (hero.status === 'injured') {
      // The night by the fire counts as a day of rest for the injury.
      hero.injuryWeeks = Math.max(0, Math.round(((hero.injuryWeeks || 0) - 1 / 7) * 1000) / 1000);
      if (hero.injuryWeeks <= 0.001) {
        hero.injuryWeeks = 0;
        hero.status = 'available';
        hero.injury = null;
        healed += 1;
      }
    }
  });
  return { state: finalize(next), error: null, message: `A night by the fire at ${area.camp.name}. Wounds close${healed ? `; ${healed} hero${healed === 1 ? '' : 'es'} fit to fight again` : ''}.` };
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

/**
 * An ambush off the road (the walk engine calls this after enough steps off it):
 * a band from the area's `ambushes` attacks. Picked by the seeded RNG.
 */
export function ambushInWild(state, areaId, position = null) {
  const area = WILD_AREAS[areaId];
  if (!area || state.world?.wildAreaId !== areaId) return { state, error: null };
  if (state.activeEncounter || state.pendingEvent || state.pendingRoadEvent) return { state, error: null };
  const pool = (area.ambushes || []).filter((item) => checkCondition(state, item.if));
  if (!pool.length || !wildFighters(state).length) return { state, error: null };
  const next = clone(state);
  const exploration = explorationInPlace(next);
  exploration.ambushes = (exploration.ambushes || 0) + 1;
  const rng = rngFor(next, `ambush:${areaId}:${exploration.ambushes}`);
  const pick = pool[rng.int(0, pool.length - 1)];
  commitRng(next, rng);
  wildEncounterInPlace(next, area, { ...pick, id: `ambush:${pick.id}`, ambush: true }, exploration.ambushes);
  if (position && Number.isFinite(position.x)) exploration.positions[areaId] = { x: Math.round(position.x), y: Math.round(position.y) };
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
    objective: group.isBoss ? 'Bring down whoever rules this place.' : group.ambush ? 'They jumped you off the road. Fight them off.' : 'Drive them off the road.',
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
  const group = findWildGroup(area, groupId);
  if (!area || !group) return { state, error: 'That fight can no longer be found.' };
  const next = clone(state);
  settleBattleItemsInPlace(next, next.activeEncounter.result.itemsUsed);
  const attempt = (next.activeEncounter.attempt || 1) + 1;
  next.activeEncounter = null;
  wildEncounterInPlace(next, area, group, attempt);
  return { state: finalize(next), error: null };
}

/** After a party wipe in the wild: accept the defeat (the party wakes in the infirmary at home). */
export function acceptDefeat(state) {
  // A wipe in a wild area or on a contract site (missions-in-world).
  const encounter = state.activeEncounter;
  const wiped = encounter && ['wild', 'site'].includes(encounter.sourceType) && encounter.status === 'lost' && encounter.result?.method !== 'withdrew';
  if (!wiped) return { state, error: 'There is no lost battle here.' };
  return concludeActiveCombat(state);
}

export { checkCondition };
