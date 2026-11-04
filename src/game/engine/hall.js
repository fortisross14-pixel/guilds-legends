// @ts-check
// The guild's home (Phase 7D): the founder's house, then a lot (src/data/lots.js).
// Story mission 1 rents the Dunmere lot: a small cabin (one bedroom, two beds)
// stands in the middle and the other slots are empty. A rented lot can be bought
// outright (years of saving; ends the rent), and an owned lot can be expanded by
// buying the land next door, step by step. Each built room takes one slot.
// Also: building rooms, weekly construction, the "Construction complete"
// moment and the next-upgrade suggestion. Rooms: src/data/rooms.js.
import { HOUSE, ROOMS, ROOM_BY_ID, roomInterior } from '../../data/rooms.js';
import { HOME_LOT_ID, LOT_BY_ID } from '../../data/lots.js';
import { TIERS } from '../../data/content.js';
import { unlockedLocations } from '../../data/world.js';
import {
  activeHeroCount,
  addChronicle,
  bedCount,
  campaignWeekSerial,
  clone,
  finalize,
  freeBeds,
  hallStage,
  hqLot,
  pushMoment,
  roomLevel,
  tallySpend,
  trophyCount,
} from './core.js';
import { charterEffect } from './charter.js';
import { evaluateStateInPlace } from './goals.js';
import { hallUpkeep, propertyGoal } from './economy.js';
import { makeCandidate } from './candidates.js';

const FAILED = ['Defeat', 'Catastrophic'];

/** What a room level costs this guild (the Scholars' Lodge pays half for its Scout table). */
function roomCost(state, roomId, plan) {
  return roomId === 'scouts' ? Math.round(plan.cost * charterEffect(state, 'scoutTableCost')) : plan.cost;
}

function completedContracts(state) {
  return (state.missionHistory || []).filter((mission) => !FAILED.includes(mission.grade)).length;
}

/** Which parts of a requirement hold, in words the player can act on. */
export function requirementStatus(state, requires = {}) {
  const missing = [];
  if (requires.fame && state.guild.fame < requires.fame) missing.push(`${requires.fame} fame (you have ${state.guild.fame})`);
  if (requires.tier && state.guild.tierIndex < requires.tier) missing.push(`${TIERS[requires.tier]?.id || 'Higher'} status`);
  if (requires.contracts && completedContracts(state) < requires.contracts) missing.push(`${requires.contracts} contracts completed (${completedContracts(state)} so far)`);
  if (requires.trophies && trophyCount(state) < requires.trophies) missing.push(`${requires.trophies} trophy (a title, artifact or boss)`);
  Object.entries(requires.rooms || {}).forEach(([id, level]) => {
    if (roomLevel(state, id) < level) missing.push(`${ROOM_BY_ID[id]?.name || id}${level > 1 ? ` level ${level}` : ''}`);
  });
  return { met: missing.length === 0, missing };
}

/** The headquarters lot's slots: how many, how many hold a room (or one being built). */
function slots(state) {
  const lot = hqLot(state);
  if (!lot) return { total: 0, used: 0, free: 0 };
  const built = Object.values(lot.rooms || {}).filter((level) => level > 0).length;
  const building = lot.construction && !roomLevel(state, lot.construction.roomId) ? 1 : 0;
  return { total: lot.slots, used: built + building, free: lot.slots - built - building };
}

function roomPlan(state, room) {
  const level = roomLevel(state, room.id);
  const max = room.levels.length;
  const next = level < max ? room.levels[level] : null;
  return {
    id: room.id,
    name: room.name,
    icon: room.icon,
    description: room.description,
    activity: room.activity || null,
    level,
    max,
    built: level > 0,
    effect: level ? room.effect(level) : null,
    interior: level ? roomInterior(room.id, level) : null,
    upkeep: level ? room.levels[level - 1].upkeep : 0,
    next: next ? { level: level + 1, cost: roomCost(state, room.id, next), weeks: next.weeks, upkeep: next.upkeep, effect: room.effect(level + 1), ...requirementStatus(state, next.requires) } : null,
  };
}

/** Everything the Guild Hall screen shows. */
export function getHallView(state) {
  const lot = hqLot(state);
  const data = lot ? LOT_BY_ID[lot.lotId] : LOT_BY_ID[HOME_LOT_ID];
  const construction = lot?.construction ? { ...lot.construction, name: ROOM_BY_ID[lot.construction.roomId]?.name || lot.construction.roomId } : null;
  return {
    stage: hallStage(state),
    // `owned` = the guild has a hall to build in (rented or bought); `bought` = the deed is the guild's.
    owned: Boolean(lot),
    bought: lot?.status === 'owned',
    rented: lot?.status === 'rented',
    lot: lot ? { ...data, ...lot } : null,
    lotName: data?.name || '',
    rent: lot?.status === 'rented' ? data.rent : 0,
    beds: bedCount(state),
    used: activeHeroCount(state),
    free: freeBeds(state),
    houseBeds: state.guild.houseBeds ?? HOUSE.beds,
    slots: slots(state),
    expansion: lot?.expansion || null,
    goal: propertyGoal(state),
    construction,
    rooms: ROOMS.map((room) => roomPlan(state, room)),
    upkeep: hallUpkeep(state),
    trophies: trophyCount(state),
    suggestion: nextUpgrade(state),
  };
}

/** Why a room cannot be built right now (null when it can). */
function buildBlocker(state, roomId) {
  const lot = hqLot(state);
  const room = ROOM_BY_ID[roomId];
  if (!room) return 'Unknown room.';
  if (!lot) return 'Rent the old stable yard on Banner Plaza first (story mission 1).';
  if (lot.construction) return `The builders are busy with the ${ROOM_BY_ID[lot.construction.roomId]?.name}.`;
  const level = roomLevel(state, roomId);
  const next = room.levels[level];
  if (!next) return `${room.name} is fully built.`;
  const status = requirementStatus(state, next.requires);
  if (!status.met) return `${room.name} needs: ${status.missing.join(', ')}.`;
  if (!level && slots(state).free <= 0) return lot.status === 'owned' ? 'No empty slot left. Expand the lot to make room.' : 'No empty slot left. Buy the lot, then expand it.';
  if (state.guild.crowns < roomCost(state, roomId, next)) return `${room.name} costs ${roomCost(state, roomId, next)} gold.`;
  return null;
}

/**
 * Rents a lot in place (mission 1's scene, or a skipped tutorial). `deposit` is
 * what the owner takes up front (0 when the work is done instead). The lot's
 * starter rooms (the cabin) are already standing. The first lot becomes headquarters.
 */
export function rentLotInPlace(state, lotId = HOME_LOT_ID, deposit = LOT_BY_ID[lotId]?.deposit || 0) {
  const data = LOT_BY_ID[lotId];
  state.guild.lots ||= {};
  if (!data || state.guild.lots[lotId]) return false;
  if (deposit > 0) {
    state.guild.crowns -= deposit;
    tallySpend(state, 'hall', deposit);
  }
  state.guild.lots[lotId] = { lotId, status: 'rented', slots: data.slots, rooms: { ...data.starter }, construction: null, expansion: null, expansions: 0 };
  if (!state.guild.hqLotId) state.guild.hqLotId = lotId;
  state.guild.legacy += 5;
  const empty = data.slots - Object.keys(data.starter).length;
  pushMoment(state, {
    type: 'construction',
    roomId: 'hall',
    heading: 'A home for the banner',
    title: `${data.name}: yours to build on`,
    effect: `A small cabin with one bedroom (2 beds) and ${empty} empty slots to build rooms in. Rent is ${data.rent} gold a month.`,
    unlocked: ['Hiring', 'Room building', 'Guild duty (Office)', `${bedCount(state)} beds in total`],
    stage: null,
    interior: 'town.dunmere.guildhall.stage1',
  });
  addChronicle(state, { type: 'facility', importance: 3, title: `${state.guild.name} rents ${data.name}`, text: 'An empty yard, a cabin in the middle and a drafty fence. The banner goes up over the gate on Banner Plaza.', tags: ['hall'] });
  return true;
}

/** Why a lot cannot be bought right now (null when it can). */
function buyBlocker(state, lotId) {
  const lot = state.guild.lots?.[lotId];
  const data = LOT_BY_ID[lotId];
  if (!lot || !data) return 'Rent the lot first (story mission 1).';
  if (lot.status === 'owned') return 'The lot is already yours outright.';
  if (state.guild.crowns < data.price) return `${data.owner} wants ${data.price.toLocaleString()} gold for the deed.`;
  return null;
}

/** Buys a rented lot outright: the rent ends, the lot can now be expanded. A milestone. */
export function buyLot(state, lotId = state.guild.hqLotId) {
  const blocker = buyBlocker(state, lotId);
  if (blocker) return { state, error: blocker };
  const data = LOT_BY_ID[lotId];
  const next = clone(state);
  next.guild.crowns -= data.price;
  tallySpend(next, 'hall', data.price);
  next.guild.lots[lotId].status = 'owned';
  next.guild.lots[lotId].boughtYear = next.guild.lots[lotId].boughtYear || next.date.year;
  next.guild.legacy += 12;
  next.stats.lotsBought = (next.stats.lotsBought || 0) + 1;
  pushMoment(next, {
    type: 'construction',
    roomId: 'hall',
    heading: 'Milestone',
    title: 'The deed is yours',
    effect: `${data.owner} signs ${data.name} over to ${next.guild.name}. No more rent, and nobody can take the hall away.`,
    unlocked: ['No more rent', data.expansions.length ? `Expansion: ${data.expansions[0].land}` : 'The lot is complete'],
    stage: null,
    interior: hallStage(next).interior,
  });
  addChronicle(next, { type: 'facility', importance: 4, title: `${next.guild.name} buys ${data.name}`, text: `Years of saving, ${data.price.toLocaleString()} gold, one signature. The hall belongs to the guild now.`, tags: ['hall', 'milestone'] });
  evaluateStateInPlace(next);
  return { state: finalize(next), error: null };
}

/** The lot's next expansion step (null when there is none left). */
export function nextExpansion(state, lotId = state.guild.hqLotId) {
  const lot = state.guild.lots?.[lotId];
  const data = LOT_BY_ID[lotId];
  if (!lot || !data) return null;
  const step = data.expansions[lot.expansions || 0];
  return step ? { ...step, step: (lot.expansions || 0) + 1, from: lot.slots } : null;
}

function expandBlocker(state, lotId) {
  const lot = state.guild.lots?.[lotId];
  if (!lot) return 'Rent the lot first (story mission 1).';
  if (lot.status !== 'owned') return 'A rented lot cannot be expanded. Buy it first.';
  if (lot.expansion) return 'The land next door is already being cleared.';
  const step = nextExpansion(state, lotId);
  if (!step) return 'There is no more land to buy around this lot.';
  if (state.guild.crowns < step.cost) return `Buying ${step.land} costs ${step.cost.toLocaleString()} gold.`;
  return null;
}

/** Buys the land next door: after the build time, the lot gains slots. Owned lots only. */
export function expandLot(state, lotId = state.guild.hqLotId) {
  const blocker = expandBlocker(state, lotId);
  if (blocker) return { state, error: blocker };
  const step = nextExpansion(state, lotId);
  const next = clone(state);
  next.guild.crowns -= step.cost;
  tallySpend(next, 'hall', step.cost);
  next.guild.lots[lotId].expansion = { step: step.step, toSlots: step.slots, land: step.land, weeksLeft: step.weeks, totalWeeks: step.weeks };
  addChronicle(next, { type: 'facility', importance: 2, title: `${next.guild.name} buys ${step.land}`, text: `${step.weeks} weeks of fences coming down and ground being levelled. The lot grows to ${step.slots} slots.`, tags: ['hall'] });
  return { state: finalize(next), error: null };
}

/** Starts building a room (or its next level) in the hall. One construction at a time. */
export function buildRoom(state, roomId) {
  const blocker = buildBlocker(state, roomId);
  if (blocker) return { state, error: blocker };
  const room = ROOM_BY_ID[roomId];
  const level = roomLevel(state, roomId) + 1;
  const plan = room.levels[level - 1];
  const next = clone(state);
  next.guild.crowns -= roomCost(state, roomId, plan);
  tallySpend(next, 'hall', roomCost(state, roomId, plan));
  const now = campaignWeekSerial(next);
  hqLot(next).construction = { roomId, level, weeksLeft: plan.weeks, totalWeeks: plan.weeks, startSerial: now, endSerial: now + plan.weeks };
  addChronicle(next, {
    type: 'facility',
    importance: 1,
    title: `Builders start on the ${room.name}${level > 1 ? ` (level ${level})` : ''}`,
    text: `${plan.weeks} week${plan.weeks === 1 ? '' : 's'} of sawdust and shouting. ${room.effect(level)}.`,
    tags: ['hall'],
  });
  return { state: finalize(next), error: null };
}

/** What a finished room makes possible, for the moment screen. */
function unlocksFor(state, roomId, level) {
  const room = ROOM_BY_ID[roomId];
  const list = [];
  if (level === 1 && room.activity) list.push(`${room.activity} activity in the hall`);
  if (roomId === 'training') list.push(`Drills: ${(room.drills[level - 1] || []).join(', ')}`);
  if (roomId === 'bunks') list.push(`${bedCount(state)} beds in total`);
  if (roomId === 'war') list.push('Main party', 'Saved formations');
  if (roomId === 'armory') list.push('Bigger chest', 'Shop prices −10%', 'Gear upgrades');
  if (roomId === 'scouts') list.push('Recruit stats clear up faster', 'Rumors of rare recruits');
  if (roomId === 'trophies') list.push(`${trophyCount(state)} trophies on display`);
  if (roomId === 'treasury') list.push(level >= 2 ? 'Larger patron loans' : 'Income vs costs report');
  if (roomId === 'infirmary' && level >= 2) list.push('Lower death risk on bad missions');
  return list;
}

/** Weekly: an expansion's land is cleared; the lot gains its slots. */
function progressExpansionsInPlace(state) {
  Object.values(state.guild.lots || {}).forEach((lot) => {
    const work = lot.expansion;
    if (!work) return;
    work.weeksLeft -= 1;
    if (work.weeksLeft > 0) return;
    lot.slots = work.toSlots;
    lot.expansions = (lot.expansions || 0) + 1;
    lot.expansion = null;
    state.guild.legacy += 4;
    pushMoment(state, {
      type: 'construction',
      roomId: 'hall',
      heading: 'The hall grows',
    title: `The lot now has ${lot.slots} slots`,
      effect: `${work.land[0].toUpperCase()}${work.land.slice(1)} is part of the hall grounds now.`,
      unlocked: [`${lot.slots - Object.values(lot.rooms || {}).filter((level) => level > 0).length} empty slots to build in`],
      stage: null,
      interior: hallStage(state).interior,
    });
    addChronicle(state, { type: 'facility', importance: 3, title: `The hall grounds grow to ${lot.slots} slots`, text: `${work.land[0].toUpperCase()}${work.land.slice(1)} joins the lot.`, tags: ['hall', 'milestone'] });
  });
}

/** Weekly: builders work; a finished room shows its "Construction complete" moment. */
export function progressConstructionInPlace(state) {
  progressExpansionsInPlace(state);
  const lot = hqLot(state);
  const work = lot?.construction;
  if (!work) return;
  work.weeksLeft -= 1;
  if (work.weeksLeft > 0) return;
  const stageBefore = hallStage(state).id;
  lot.rooms[work.roomId] = work.level;
  lot.construction = null;
  const room = ROOM_BY_ID[work.roomId];
  const unlocked = unlocksFor(state, work.roomId, work.level);
  const stage = hallStage(state);
  state.guild.legacy += 2;
  pushMoment(state, {
    type: 'construction',
    roomId: work.roomId,
    level: work.level,
    title: `${room.name}${work.level > 1 ? ` level ${work.level}` : ''} complete`,
    effect: room.effect(work.level),
    unlocked,
    stage: stage.id > stageBefore ? stage.name : null,
    interior: roomInterior(work.roomId, work.level),
  });
  addChronicle(state, {
    type: 'facility',
    importance: stage.id > stageBefore ? 3 : 2,
    title: `${room.name}${work.level > 1 ? ` level ${work.level}` : ''} complete`,
    text: `${room.effect(work.level)}.${stage.id > stageBefore ? ` The guild home is now a ${stage.name.toLowerCase()}.` : ''}`,
    tags: ['hall'],
  });
  evaluateStateInPlace(state);
}

/** Monthly: trophy fame, and scout-table rumors of rare recruits in other towns. */
export function monthlyHallInPlace(state, rng) {
  if (roomLevel(state, 'trophies')) {
    const fame = Math.min(trophyCount(state), 5) * 2;
    state.guild.fame += fame;
  }
  if (roomLevel(state, 'scouts') && rng.chance(0.3)) {
    const here = state.world?.currentLocationId || 'dunmere';
    const places = unlockedLocations(state.guild.tierIndex).filter((location) => location.id !== here);
    if (!places.length) return;
    const place = rng.pick(places);
    const candidate = makeCandidate(state, rng, 'elite', place.id);
    candidate.expiresYear = state.date.year + 1;
    state.candidates.push(candidate);
    state.world.knowledge ||= { locations: {}, events: {}, sources: {} };
    state.world.knowledge.locations ||= {};
    if (!state.world.knowledge.locations[place.id] || state.world.knowledge.locations[place.id] === 'unknown') state.world.knowledge.locations[place.id] = 'rumored';
    state.notifications.push({
      id: `scout-rumor-${candidate.id}`,
      tone: 'blue',
      title: 'A rumor from the Scout table',
      text: `${candidate.name}, a ${candidate.rarity} ${candidate.classId}, is looking for work in ${place.name}.`,
    });
  }
}

/**
 * The one upgrade that would help most right now, from what is limiting the
 * guild: no hall, no free beds, injuries, no training, unknown recruits… Returns
 * { text, label, action: { kind: 'story' | 'build' | 'view', roomId? } } or null.
 */
export function nextUpgrade(state) {
  const lot = hqLot(state);
  const free = freeBeds(state);
  if (!lot) return { text: 'Your house has one bed, and it is yours. No hall, no hires. The old stable yard on Banner Plaza stands empty.', label: 'Story: rent it', action: { kind: 'story' } };
  if (lot.construction) return null;
  const canBuild = (roomId) => !buildBlocker(state, roomId);
  const build = (roomId, text) => ({ text, label: `Build ${ROOM_BY_ID[roomId].name}${roomLevel(state, roomId) ? ` lv ${roomLevel(state, roomId) + 1}` : ''}`, action: { kind: 'build', roomId } });
  if (free <= 0 && canBuild('bunks')) return build('bunks', 'Every bed is taken.');
  const injured = state.heroes.filter((hero) => hero.status === 'injured').length;
  if (injured >= 2 && canBuild('infirmary')) return build('infirmary', `${injured} heroes are injured.`);
  if (!roomLevel(state, 'training') && canBuild('training')) return build('training', 'Your heroes cannot train yet.');
  const here = state.world?.currentLocationId || 'dunmere';
  const unknown = (state.candidates || []).filter((candidate) => (candidate.locationId || 'dunmere') === here && (candidate.scoutLevel || 0) < 2).length;
  if (unknown >= 3 && canBuild('scouts')) return build('scouts', `${unknown} recruits here are still a mystery.`);
  if (activeHeroCount(state) >= 3 && canBuild('war')) return build('war', 'Nobody leads the main party yet.');
  if (trophyCount(state) && canBuild('trophies')) return build('trophies', 'Your trophies sit in a sack.');
  const training = roomLevel(state, 'training');
  if (training && canBuild('training')) return build('training', `Training gives +${training * 25}% XP; the next level unlocks ${(ROOM_BY_ID.training.drills[training] || []).join(', ')}.`);
  if (free <= 1 && canBuild('bunks')) return build('bunks', 'Only one bed left.');
  return null;
}
