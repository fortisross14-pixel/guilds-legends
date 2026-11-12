// @ts-check
// The guild's home (docs/specs/guild-hall-rooms.md): the founder's house, then a
// lot (src/data/lots.js). Story mission 1 rents the Dunmere lot: a small cabin
// (one bedroom) stands on it and the other slots are empty. A rented lot can be
// bought outright (ends the rent), and an owned lot can be expanded step by step.
// Each room takes one slot and has three tiers (Basic → Advanced → State of the
// art); a training room's tier is its equipment's. Rooms hold heroes: one in each
// training room, one patient in each infirmary. Also: construction (build,
// upgrade, clear; one job at a time), weekly training and recovery, the monthly
// room effects, the defeat rule (the party wakes in the infirmary; no deaths
// from battles) and the next-upgrade suggestion. Data: src/data/rooms.js.
import { CLEARING, CROWN, DEFEAT, EQUIPMENT, EQUIPMENT_BY_ID, HOUSE, ROOMS, ROOM_BY_ID, TIER_NAMES, TRAINING, roomTileArt } from '../../data/rooms.js';
import { HOME_LOT_ID, LOT_BY_ID } from '../../data/lots.js';
import { LOCATION_BY_ID, travelDays, unlockedLocations } from '../../data/world.js';
import {
  HOME_LOCATION_ID,
  activeHeroCount,
  addChronicle,
  bedCount,
  campaignWeekSerial,
  clamp,
  clone,
  finalize,
  freeBeds,
  getHero,
  hallRooms,
  hasHall,
  hqLot,
  pushMoment,
  roomCount,
  roomLevel,
  tallySpend,
  travellingPartyIds,
} from './core.js';
import { charterEffect } from './charter.js';
import { applyXpInPlace } from './heroes.js';
import { evaluateStateInPlace } from './goals.js';
import { hallUpkeep, propertyGoal } from './economy.js';
import { makeCandidate } from './candidates.js';

const tierOf = (room) => Math.max(1, room?.tier || 1);
const tierPlan = (type, tier) => ROOM_BY_ID[type]?.tiers[tier - 1] || null;

/** What building or upgrading a room to a tier costs this guild (the Scholars' Lodge pays half for its Scout table). */
function roomCost(state, type, tier) {
  const plan = tierPlan(type, tier);
  if (!plan) return 0;
  return type === 'scouts' ? Math.round(plan.cost * charterEffect(state, 'scoutTableCost')) : plan.cost;
}

/** The headquarters lot's slots: how many, how many hold a room (or one being built). */
function slots(state) {
  const lot = hqLot(state);
  if (!lot) return { total: 0, used: 0, free: 0 };
  const building = lot.construction?.kind === 'build' ? 1 : 0;
  const used = hallRooms(state).length + building;
  return { total: lot.slots, used, free: lot.slots - used };
}

/** Trophies the guild holds (src/data/universe.js tournaments), with how many times each was won. */
export function trophyList(state) {
  return Object.entries(state.guild.trophies || {}).map(([id, trophy]) => ({ id, ...trophy }));
}

/** A tournament win: the trophy is counted (it waits in storage until there is a Crown Room). */
export function awardTrophyInPlace(state, id, name) {
  state.guild.trophies ||= {};
  const trophy = (state.guild.trophies[id] ||= { name, count: 0, firstYear: state.date.year });
  trophy.count += 1;
  trophy.lastYear = state.date.year;
  if (!roomLevel(state, 'crown')) state.notifications.push({ id: `trophy-stored-${id}-${trophy.count}`, tone: 'gold', title: `${name} won`, text: 'The trophy waits in storage. Build a Crown Room to show it and earn fame each month.' });
}

/** Monthly fame from the Crown Room: each trophy gives some, each repeat a little more, up to a cap. */
export function crownFame(state) {
  const tier = roomLevel(state, 'crown');
  if (!tier) return 0;
  const base = trophyList(state).reduce((sum, trophy) => sum + Math.min(CROWN.maxPerTrophy, CROWN.fameFirst + CROWN.fameRepeat * Math.max(0, (trophy.count || 1) - 1) * 0.5), 0);
  return Math.round(base * (tier >= 2 ? 1 + CROWN.advancedBonus : 1));
}

function heroBrief(state, heroId) {
  const hero = heroId ? getHero(state, heroId) : null;
  return hero ? { id: hero.id, name: hero.name, classId: hero.classId, status: hero.status, health: hero.health ?? 100, injuryWeeks: hero.injuryWeeks || 0, portrait: hero.portrait } : null;
}

/** One room as the Guild Hall screen shows it. */
function roomView(state, room) {
  const data = ROOM_BY_ID[room.type];
  const tier = tierOf(room);
  const next = tier < 3 ? { tier: tier + 1, name: TIER_NAMES[tier], cost: roomCost(state, room.type, tier + 1), weeks: tierPlan(room.type, tier + 1).weeks, upkeep: tierPlan(room.type, tier + 1).upkeep, gives: data.gives[tier], blocker: upgradeBlocker(state, room.id) } : null;
  const equipment = room.type === 'training' ? EQUIPMENT_BY_ID[room.equipment || 'dummy'] : null;
  const busy = hqLot(state)?.construction?.roomId === room.id ? hqLot(state).construction : null;
  return {
    id: room.id,
    type: room.type,
    name: data?.name || room.type,
    icon: data?.icon || 'castle',
    tier,
    tierName: TIER_NAMES[tier - 1],
    gives: data?.gives[tier - 1] || '',
    upkeep: tierPlan(room.type, tier)?.upkeep || 0,
    art: roomTileArt(room.type, tier),
    equipment: equipment ? { id: equipment.id, name: equipment.name, stat: equipment.stat, icon: equipment.icon, gain: TRAINING.gain[tier - 1], swapCost: TRAINING.swapCost[tier - 1], refund: Math.round(TRAINING.swapCost[tier - 1] * TRAINING.swapRefund) } : null,
    holdsHero: ['training', 'infirmary'].includes(room.type),
    hero: heroBrief(state, room.heroId),
    next,
    refund: Math.round(totalSpent(state, room) * CLEARING.refund),
    busy: busy ? { kind: busy.kind, weeksLeft: busy.weeksLeft, totalWeeks: busy.totalWeeks } : null,
  };
}

/** Gold spent on a room so far (its tiers), for the clearing refund. */
function totalSpent(state, room) {
  let sum = 0;
  for (let tier = 1; tier <= tierOf(room); tier += 1) sum += roomCost(state, room.type, tier);
  return sum;
}

/** Everything the Guild Hall screen shows. */
export function getHallView(state) {
  const lot = hqLot(state);
  const data = lot ? LOT_BY_ID[lot.lotId] : LOT_BY_ID[HOME_LOT_ID];
  const work = lot?.construction || null;
  const construction = work ? { ...work, name: ROOM_BY_ID[work.type || hallRooms(state).find((room) => room.id === work.roomId)?.type]?.name || 'Room' } : null;
  return {
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
    rooms: hallRooms(state).map((room) => roomView(state, room)),
    catalog: ROOMS.map((room) => ({ id: room.id, name: room.name, icon: room.icon, line: room.line, cost: roomCost(state, room.id, 1), weeks: room.tiers[0].weeks, upkeep: room.tiers[0].upkeep, gives: room.gives[0], blocker: buildBlocker(state, room.id) })),
    equipment: EQUIPMENT,
    upkeep: hallUpkeep(state),
    trophies: trophyList(state),
    titles: state.guild.specialTitles || [],
    crownFame: crownFame(state),
    suggestion: nextUpgrade(state),
  };
}

// ---------------------------------------------------------------- the lot: rent, buy, expand

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
  const rooms = data.starter.map((room, index) => ({ id: `room-${index + 1}`, type: room.type, tier: room.tier || 1, equipment: null, heroId: null }));
  state.guild.lots[lotId] = { lotId, status: 'rented', slots: data.slots, rooms, nextRoom: rooms.length + 1, construction: null, expansion: null, expansions: 0 };
  if (!state.guild.hqLotId) state.guild.hqLotId = lotId;
  state.guild.legacy += 5;
  pushMoment(state, {
    type: 'construction',
    roomId: 'hall',
    heading: 'A home for the banner',
    title: `${data.name}: yours to build on`,
    effect: `A small cabin with one bedroom (2 beds) and ${data.slots - rooms.length} empty slots to build rooms in. Rent is ${data.rent} gold a month.`,
    unlocked: ['Hiring', 'Room building', 'Guild duty (Office)', `${bedCount(state)} beds in total`],
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
    interior: 'town.dunmere.guildhall.stage1',
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

// ---------------------------------------------------------------- rooms: build, upgrade, clear, equipment

function busyBlocker(lot) {
  if (!lot) return 'Rent the old stable yard on Banner Plaza first (story mission 1).';
  if (lot.construction) return 'The builders are busy. One job at a time.';
  return null;
}

/** Why a new room of this type cannot be built right now (null when it can). */
function buildBlocker(state, type) {
  const lot = hqLot(state);
  const room = ROOM_BY_ID[type];
  if (!room) return 'Unknown room.';
  const busy = busyBlocker(lot);
  if (busy) return busy;
  if (slots(state).free <= 0) return lot.status === 'owned' ? 'No empty slot left. Expand the lot to make room.' : 'No empty slot left. Buy the lot, then expand it.';
  if (state.guild.crowns < roomCost(state, type, 1)) return `${room.name} costs ${roomCost(state, type, 1)} gold.`;
  return null;
}

function upgradeBlocker(state, roomId) {
  const lot = hqLot(state);
  const room = hallRooms(state).find((item) => item.id === roomId);
  if (!room) return 'That room is gone.';
  const busy = busyBlocker(lot);
  if (busy) return busy;
  if (tierOf(room) >= 3) return 'Already State of the art.';
  if (state.guild.crowns < roomCost(state, room.type, tierOf(room) + 1)) return `The upgrade costs ${roomCost(state, room.type, tierOf(room) + 1)} gold.`;
  return null;
}

function startWork(next, work, cost, chronicle) {
  next.guild.crowns -= cost;
  if (cost) tallySpend(next, 'hall', cost);
  const now = campaignWeekSerial(next);
  hqLot(next).construction = { ...work, totalWeeks: work.weeksLeft, startSerial: now, endSerial: now + work.weeksLeft };
  addChronicle(next, { type: 'facility', importance: 1, tags: ['hall'], ...chronicle });
}

/** Builds a new room (Basic) in an empty slot. A training room starts with `equipment` (default: a dummy). */
export function buildRoom(state, type, equipment = 'dummy') {
  const blocker = buildBlocker(state, type);
  if (blocker) return { state, error: blocker };
  const room = ROOM_BY_ID[type];
  const plan = tierPlan(type, 1);
  const next = clone(state);
  startWork(next, { kind: 'build', type, tier: 1, equipment: type === 'training' ? (EQUIPMENT_BY_ID[equipment] ? equipment : 'dummy') : null, weeksLeft: plan.weeks }, roomCost(state, type, 1), {
    title: `Builders start on a ${room.name}`,
    text: `${plan.weeks} week${plan.weeks === 1 ? '' : 's'} of sawdust and shouting. ${room.gives[0]}.`,
  });
  return { state: finalize(next), error: null };
}

/** Upgrades a room one tier, in place (same slot). */
export function upgradeRoom(state, roomId) {
  const blocker = upgradeBlocker(state, roomId);
  if (blocker) return { state, error: blocker };
  const room = hallRooms(state).find((item) => item.id === roomId);
  const tier = tierOf(room) + 1;
  const next = clone(state);
  startWork(next, { kind: 'upgrade', roomId, type: room.type, tier, weeksLeft: tierPlan(room.type, tier).weeks }, roomCost(state, room.type, tier), {
    title: `The ${ROOM_BY_ID[room.type].name} goes ${TIER_NAMES[tier - 1]}`,
    text: `${tierPlan(room.type, tier).weeks} weeks of work. ${ROOM_BY_ID[room.type].gives[tier - 1]}.`,
  });
  return { state: finalize(next), error: null };
}

/** Clears a room to free its slot: a partial refund when the work is done (one week). */
export function clearRoom(state, roomId) {
  const lot = hqLot(state);
  const room = hallRooms(state).find((item) => item.id === roomId);
  if (!room) return { state, error: 'That room is gone.' };
  const busy = busyBlocker(lot);
  if (busy) return { state, error: busy };
  if (room.type === 'bedroom' && roomCount(state, 'bedroom') <= 1) return { state, error: 'The cabin is the last bedroom; the guild needs somewhere to sleep.' };
  if (room.type === 'bedroom' && bedCount(state) - 2 < activeHeroCount(state)) return { state, error: 'Someone sleeps in that bedroom. Free a bed first.' };
  const next = clone(state);
  const nextRoom = hallRooms(next).find((item) => item.id === roomId);
  nextRoom.heroId = null;
  startWork(next, { kind: 'clear', roomId, type: room.type, tier: tierOf(room), refund: Math.round(totalSpent(state, room) * CLEARING.refund), weeksLeft: CLEARING.weeks }, 0, {
    title: `The ${ROOM_BY_ID[room.type].name} comes down`,
    text: 'One week to clear the slot.',
  });
  return { state: finalize(next), error: null };
}

/** Swaps a training room's equipment: the new piece costs gold, the old one sells back for part of its price. */
export function setRoomEquipment(state, roomId, kind) {
  const room = hallRooms(state).find((item) => item.id === roomId);
  if (!room || room.type !== 'training') return { state, error: 'Only a training room holds equipment.' };
  if (!EQUIPMENT_BY_ID[kind]) return { state, error: 'Unknown equipment.' };
  if ((room.equipment || 'dummy') === kind) return { state, error: 'That piece is already in the room.' };
  const cost = TRAINING.swapCost[tierOf(room) - 1];
  const refund = Math.round(cost * TRAINING.swapRefund);
  if (state.guild.crowns + refund < cost) return { state, error: `The new piece costs ${cost} gold (${refund} back for the old one).` };
  const next = clone(state);
  next.guild.crowns += refund - cost;
  tallySpend(next, 'hall', cost - refund);
  hallRooms(next).find((item) => item.id === roomId).equipment = kind;
  return { state: finalize(next), error: null };
}

/**
 * Puts a hero in a room (training: anyone fit; infirmary: the injured), or takes
 * them out (`roomId` null). One hero per room; a newcomer moves the previous one out.
 */
export function assignRoom(state, heroId, roomId) {
  const hero = getHero(state, heroId);
  if (!hero || ['dead', 'retired'].includes(hero.status)) return { state, error: 'That hero is not with the guild.' };
  const next = clone(state);
  hallRooms(next).forEach((room) => {
    if (room.heroId === heroId) room.heroId = null;
  });
  if (roomId) {
    const room = hallRooms(next).find((item) => item.id === roomId);
    if (!room || !['training', 'infirmary'].includes(room.type)) return { state, error: 'Only training rooms and infirmaries hold heroes.' };
    if (room.type === 'infirmary' && hero.status !== 'injured') return { state, error: `${hero.name} is not hurt.` };
    if (room.type === 'training' && !['available', 'injured'].includes(hero.status)) return { state, error: `${hero.name} is away.` };
    if (room.type === 'training' && hero.status === 'injured') return { state, error: `${hero.name} is hurt: the infirmary first.` };
    room.heroId = heroId;
  }
  if (!next.settings.seenHints?.roomDrag) next.settings.seenHints = { ...(next.settings.seenHints || {}), roomDrag: true };
  return { state: finalize(next), error: null };
}

/** Fills empty rooms: the injured into free infirmary beds, fit heroes at home into empty training rooms. */
export function autoAssignRooms(state) {
  const next = clone(state);
  autoAssignInPlace(next, true);
  return { state: finalize(next), error: null };
}

function autoAssignInPlace(state, training = false) {
  const rooms = hallRooms(state);
  const placed = new Set(rooms.map((room) => room.heroId).filter(Boolean));
  const away = new Set(travellingPartyIds(state));
  // Defeated heroes first: they recover at half speed outside the infirmary.
  const injured = state.heroes.filter((hero) => hero.status === 'injured' && !placed.has(hero.id)).sort((a, b) => Number(Boolean(b.defeated)) - Number(Boolean(a.defeated)) || (b.injuryWeeks || 0) - (a.injuryWeeks || 0));
  rooms
    .filter((room) => room.type === 'infirmary' && !room.heroId)
    .forEach((room) => {
      const hero = injured.shift();
      if (hero) {
        room.heroId = hero.id;
        placed.add(hero.id);
      }
    });
  if (!training) return;
  const fit = state.heroes.filter((hero) => hero.status === 'available' && !placed.has(hero.id) && !away.has(hero.id)).sort((a, b) => b.potential - a.potential);
  rooms
    .filter((room) => room.type === 'training' && !room.heroId)
    .forEach((room) => {
      const hero = fit.shift();
      if (hero) room.heroId = hero.id;
    });
}

// ---------------------------------------------------------------- weekly: construction, training, recovery

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
      unlocked: [`${lot.slots - (lot.rooms || []).length} empty slots to build in`],
      interior: null,
    });
    addChronicle(state, { type: 'facility', importance: 3, title: `The hall grounds grow to ${lot.slots} slots`, text: `${work.land[0].toUpperCase()}${work.land.slice(1)} joins the lot.`, tags: ['hall', 'milestone'] });
  });
}

/** Weekly: the builders work; a finished job shows its "Construction complete" moment. */
export function progressConstructionInPlace(state) {
  progressExpansionsInPlace(state);
  const lot = hqLot(state);
  const work = lot?.construction;
  if (!work) return;
  work.weeksLeft -= 1;
  if (work.weeksLeft > 0) return;
  lot.construction = null;
  const data = ROOM_BY_ID[work.type];
  if (work.kind === 'build') {
    lot.nextRoom ||= (lot.rooms || []).length + 1;
    lot.rooms.push({ id: `room-${lot.nextRoom}`, type: work.type, tier: 1, equipment: work.equipment || null, heroId: null });
    lot.nextRoom += 1;
  } else if (work.kind === 'upgrade') {
    const room = lot.rooms.find((item) => item.id === work.roomId);
    if (room) room.tier = work.tier;
  } else if (work.kind === 'clear') {
    lot.rooms = lot.rooms.filter((item) => item.id !== work.roomId);
    state.guild.crowns += work.refund || 0;
  }
  state.guild.legacy += work.kind === 'clear' ? 0 : 2;
  const title = work.kind === 'clear' ? `${data.name} cleared` : work.kind === 'upgrade' ? `${data.name}: ${TIER_NAMES[work.tier - 1]}` : `${data.name} built`;
  pushMoment(state, {
    type: 'construction',
    heading: 'Construction complete',
    roomId: work.type,
    level: work.tier,
    title,
    effect: work.kind === 'clear' ? `The slot is free again. ${work.refund || 0} gold back for the materials.` : data.gives[work.tier - 1],
    unlocked: work.kind === 'clear' ? [] : unlocksFor(state, work.type, work.tier),
    interior: work.kind === 'clear' ? null : roomTileArt(work.type, work.tier),
  });
  addChronicle(state, { type: 'facility', importance: 2, title, text: work.kind === 'clear' ? 'The slot stands empty.' : `${data.gives[work.tier - 1]}.`, tags: ['hall'] });
  evaluateStateInPlace(state);
}

/** What a finished room makes possible, for the moment screen. */
function unlocksFor(state, type, tier) {
  const list = [];
  if (type === 'bedroom') list.push(`${bedCount(state)} beds in total`);
  if (type === 'training') list.push('Drag a hero into it to train');
  if (type === 'infirmary') list.push('The injured recover here');
  if (type === 'crown') list.push(`${trophyList(state).length} trophies on display`);
  if (type === 'scouts' && tier >= 2) list.push('Rumors of rare recruits');
  if (type === 'treasury' && tier >= 2) list.push(`+${tier - 1}% interest a month`);
  if (type === 'armory' && tier >= 2) list.push('Gear upgrades');
  return list;
}

/** Weekly training: the hero in each training room gains a quarter month of its stat, and a little XP. */
function weeklyTrainingInPlace(state) {
  const away = new Set(travellingPartyIds(state));
  hallRooms(state)
    .filter((room) => room.type === 'training' && room.heroId)
    .forEach((room) => {
      const hero = getHero(state, room.heroId);
      if (!hero || hero.status !== 'available' || away.has(hero.id)) {
        if (!hero || ['dead', 'retired', 'injured'].includes(hero?.status)) room.heroId = null;
        return;
      }
      const stat = EQUIPMENT_BY_ID[room.equipment || 'dummy'].stat;
      hero.attributes ||= {};
      hero.attributes[stat] = Math.round(((hero.attributes[stat] || 50) + TRAINING.gain[tierOf(room) - 1] / 4) * 100) / 100;
      applyXpInPlace(hero, TRAINING.xpPerWeek, state, `${stat.toLowerCase()} training`);
      hero.career.xpEarned = (hero.career.xpEarned || 0) + TRAINING.xpPerWeek;
    });
}

/**
 * Weekly: the injured are put in free infirmary beds. Injuries themselves run down
 * by the day (time.js, recoverDailyInPlace).
 */
export function weeklyRecoveryInPlace(state) {
  autoAssignInPlace(state);
}

/** Weekly hall tick (time.js): construction, training and recovery. */
export function weeklyHallInPlace(state) {
  progressConstructionInPlace(state);
  weeklyTrainingInPlace(state);
  weeklyRecoveryInPlace(state);
}

// ---------------------------------------------------------------- monthly: room effects

/** Monthly: Crown Room fame, bedroom comfort, treasury interest, and scout-table rumors of rare recruits. */
export function monthlyHallInPlace(state, rng) {
  const fame = crownFame(state);
  if (fame) state.guild.fame += fame;
  if (roomLevel(state, 'bedroom') >= 2) state.heroes.filter((hero) => !['dead', 'retired'].includes(hero.status)).forEach((hero) => (hero.loyalty = clamp((hero.loyalty || 50) + 1, 0, 100)));
  const treasury = roomLevel(state, 'treasury');
  if (treasury >= 2 && state.guild.crowns > 0) state.guild.crowns += Math.floor(state.guild.crowns * (treasury - 1) * 0.01);
  if (roomLevel(state, 'scouts') >= 2 && rng.chance(0.3)) {
    const here = state.world?.currentLocationId || HOME_LOCATION_ID;
    const places = unlockedLocations(state.guild.tierIndex).filter((location) => location.id !== here);
    if (!places.length) return;
    const place = rng.pick(places);
    const candidate = makeCandidate(state, rng, 'elite', place.id);
    candidate.expiresYear = state.date.year + 1;
    state.candidates.push(candidate);
    state.world.knowledge ||= { locations: {}, events: {}, sources: {} };
    state.world.knowledge.locations ||= {};
    if (!state.world.knowledge.locations[place.id] || state.world.knowledge.locations[place.id] === 'unknown') state.world.knowledge.locations[place.id] = 'rumored';
    state.notifications.push({ id: `scout-rumor-${candidate.id}`, tone: 'blue', title: 'A rumor from the Scout table', text: `${candidate.name}, a ${candidate.rarity} ${candidate.classId}, is looking for work in ${place.name}.` });
  }
}

// ---------------------------------------------------------------- defeat

/**
 * The defeat rule (no deaths from battles): the party wakes in the Guild Hall
 * infirmary, or in the founder's house before the lot is rented. Treatment per
 * hero plus transport by distance; what the guild cannot pay becomes debt.
 * Returns what happened (for the moment).
 */
export function defeatInPlace(state, heroIds, where = state.world?.currentLocationId || HOME_LOCATION_ID) {
  const heroes = heroIds.map((id) => getHero(state, id)).filter((hero) => hero && !['dead', 'retired'].includes(hero.status));
  if (!heroes.length) return null;
  const tier = hasHall(state) ? roomLevel(state, 'infirmary') : 0;
  const days = where === HOME_LOCATION_ID ? 0 : travelDays(where, HOME_LOCATION_ID) || 0;
  const cost = Math.round(heroes.length * DEFEAT.treatment * (1 - DEFEAT.discount[tier]) + days * DEFEAT.transportPerDay);
  heroes.forEach((hero) => {
    hero.status = 'injured';
    hero.defeated = true;
    hero.injury = 'Defeated';
    hero.injuryWeeks = DEFEAT.weeks[tier];
    hero.health = DEFEAT.hp;
    hero.mana = 100;
  });
  // Home: the guild wakes where it lives.
  state.world.currentLocationId = HOME_LOCATION_ID;
  state.world.wildAreaId = null;
  state.world.activeTravel = null;
  const paid = Math.max(0, Math.min(cost, state.guild.crowns));
  state.guild.crowns -= paid;
  if (paid) tallySpend(state, 'other', paid);
  const owed = cost - paid;
  if (owed > 0) {
    const loan = state.guild.loan || { remaining: 0, installment: 0, takenYear: state.date.year, takenMonth: state.date.month };
    loan.remaining += owed;
    loan.installment = Math.max(loan.installment || 0, Math.ceil(loan.remaining / 6));
    state.guild.loan = loan;
  }
  autoAssignInPlace(state);
  const placeName = hasHall(state) ? 'the Guild Hall' : 'your house';
  const weeks = DEFEAT.weeks[tier];
  pushMoment(state, {
    type: 'defeat',
    heading: 'Defeat',
    roomId: 'defeat',
    title: `Carried home to ${LOCATION_BY_ID[HOME_LOCATION_ID]?.name || 'Dunmere'}`,
    effect: `They wake in ${placeName}.`,
    cost,
    owed,
    weeks,
    unlocked: [],
    interior: 'scene.defeat',
  });
  addChronicle(state, { type: 'combat-defeat', importance: 2, title: 'Carried home', text: `${heroes.map((hero) => hero.name).join(', ')} are carried home to recover. ${cost} gold for treatment and transport.`, heroIds: heroes.map((hero) => hero.id), tags: ['defeat'] });
  return { cost, owed, weeks };
}

// ---------------------------------------------------------------- the next upgrade

/**
 * The one upgrade that would help most right now, from what is limiting the
 * guild: no hall, no free beds, injuries, no training… Returns
 * { text, label, action: { kind: 'story' | 'build', roomId? } } or null.
 */
export function nextUpgrade(state) {
  const lot = hqLot(state);
  const free = freeBeds(state);
  if (!lot) return { text: 'Your house has one bed, and it is yours. No hall, no hires.', label: 'Rent the old stable yard', action: { kind: 'story' } };
  if (lot.construction) return null;
  const can = (type) => !buildBlocker(state, type);
  const build = (type, text) => ({ text, label: `${text}: build a ${ROOM_BY_ID[type].name.toLowerCase()}`, action: { kind: 'build', roomId: type } });
  if (free <= 0 && can('bedroom')) return build('bedroom', 'All beds full');
  const injured = state.heroes.filter((hero) => hero.status === 'injured').length;
  if (injured && !roomCount(state, 'infirmary') && can('infirmary')) return build('infirmary', `${injured} hurt`);
  if (!roomCount(state, 'training') && can('training')) return build('training', 'Nobody can train');
  if (trophyList(state).length && !roomCount(state, 'crown') && can('crown')) return build('crown', 'Trophies in a sack');
  return null;
}
