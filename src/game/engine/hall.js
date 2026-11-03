// @ts-check
// The guild's home: the rented room, buying or leasing the old hall, building
// rooms in its empty wings, construction over weeks, the "Construction
// complete" moment, and the next-upgrade suggestion. Data: src/data/rooms.js.
import { HALL_PURCHASE, RENTED_ROOM, ROOMS, ROOM_BY_ID, roomInterior } from '../../data/rooms.js';
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
  pushMoment,
  roomLevel,
  trophyCount,
} from './core.js';
import { getStoryView } from './stories.js';
import { evaluateStateInPlace } from './goals.js';
import { hallUpkeep } from './economy.js';
import { makeCandidate } from './candidates.js';

const FAILED = ['Defeat', 'Catastrophic'];

function completedContracts(state) {
  return (state.missionHistory || []).filter((mission) => !FAILED.includes(mission.grade)).length;
}

/** Which parts of a requirement hold, in words the player can act on. */
export function requirementStatus(state, requires = {}) {
  const missing = [];
  if (requires.fame && state.guild.fame < requires.fame) missing.push(`${requires.fame} fame (you have ${state.guild.fame})`);
  if (requires.tier && state.guild.tierIndex < requires.tier) missing.push(`${TIERS[requires.tier]?.id || 'Higher'} status`);
  if (requires.contracts && completedContracts(state) < requires.contracts) missing.push(`${requires.contracts} contracts completed (${completedContracts(state)} so far)`);
  if (requires.storyStep && getStoryView(state).step < requires.storyStep) missing.push(`Blackwood story, step ${requires.storyStep}`);
  if (requires.trophies && trophyCount(state) < requires.trophies) missing.push(`${requires.trophies} trophy (a title, artifact or boss)`);
  Object.entries(requires.rooms || {}).forEach(([id, level]) => {
    if (roomLevel(state, id) < level) missing.push(`${ROOM_BY_ID[id]?.name || id}${level > 1 ? ` level ${level}` : ''}`);
  });
  return { met: missing.length === 0, missing };
}

function wings(state) {
  const hall = state.guild.hall;
  if (!hall?.owned) return { total: 0, used: 0, free: 0 };
  const total = HALL_PURCHASE.wings + (hallStage(state).key === 'renowned' ? HALL_PURCHASE.renownedWings : 0);
  const built = Object.values(hall.rooms || {}).filter((level) => level > 0).length;
  const building = hall.construction && !roomLevel(state, hall.construction.roomId) ? 1 : 0;
  return { total, used: built + building, free: total - built - building };
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
    next: next ? { level: level + 1, cost: next.cost, weeks: next.weeks, upkeep: next.upkeep, effect: room.effect(level + 1), ...requirementStatus(state, next.requires) } : null,
  };
}

/** Everything the Guild Hall screen shows. */
export function getHallView(state) {
  const hall = state.guild.hall || {};
  const construction = hall.construction
    ? { ...hall.construction, name: ROOM_BY_ID[hall.construction.roomId]?.name || hall.construction.roomId }
    : null;
  return {
    stage: hallStage(state),
    owned: Boolean(hall.owned),
    lease: Boolean(hall.lease),
    beds: bedCount(state),
    used: activeHeroCount(state),
    free: freeBeds(state),
    rentedBeds: hall.rentedBeds || 0,
    canRentBed: (hall.rentedBeds || 0) > 0 && hall.rentedBeds < RENTED_ROOM.maxBeds,
    bedCost: RENTED_ROOM.bedCost,
    bedRent: RENTED_ROOM.bedRent,
    purchase: hall.owned
      ? null
      : { ...requirementStatus(state, HALL_PURCHASE.requires), buy: HALL_PURCHASE.buy.cost, lease: HALL_PURCHASE.lease.cost, leaseRent: HALL_PURCHASE.lease.rent },
    wings: wings(state),
    construction,
    rooms: ROOMS.map((room) => roomPlan(state, room)),
    upkeep: hallUpkeep(state),
    trophies: trophyCount(state),
    suggestion: nextUpgrade(state),
  };
}

/** Why a room cannot be built right now (null when it can). */
function buildBlocker(state, roomId) {
  const hall = state.guild.hall || {};
  const room = ROOM_BY_ID[roomId];
  if (!room) return 'Unknown room.';
  if (!hall.owned) return 'Buy or lease the old hall first.';
  if (hall.construction) return `The builders are busy with the ${ROOM_BY_ID[hall.construction.roomId]?.name}.`;
  const level = roomLevel(state, roomId);
  const next = room.levels[level];
  if (!next) return `${room.name} is fully built.`;
  const status = requirementStatus(state, next.requires);
  if (!status.met) return `${room.name} needs: ${status.missing.join(', ')}.`;
  if (!level && wings(state).free <= 0) return 'No empty wing left. Raise the hall’s renown to open more.';
  if (state.guild.crowns < next.cost) return `${room.name} costs ${next.cost} crowns.`;
  return null;
}

/** Rents one more bed in the room above the Wayfarer (until the guild has bunks of its own). */
export function rentBed(state) {
  const hall = state.guild.hall || {};
  if (!hall.rentedBeds) return { state, error: 'The rented room is gone; build a Bunk room instead.' };
  if (hall.rentedBeds >= RENTED_ROOM.maxBeds) return { state, error: 'The room above the Wayfarer has no space for another bed. Buy the old hall.' };
  if (state.guild.crowns < RENTED_ROOM.bedCost) return { state, error: `A bed costs ${RENTED_ROOM.bedCost} crowns.` };
  const next = clone(state);
  next.guild.crowns -= RENTED_ROOM.bedCost;
  next.guild.hall.rentedBeds += 1;
  addChronicle(next, { type: 'facility', importance: 1, title: 'Another bed upstairs', text: `Sella squeezes a ${next.guild.hall.rentedBeds}th bed into the rented room. The rent goes up.`, tags: ['hall'] });
  return { state: finalize(next), error: null };
}

/** Buys (or leases) the old hall on Banner Plaza: the guild's first real home. */
export function acquireHall(state, mode = 'buy') {
  const hall = state.guild.hall || {};
  if (hall.owned) return { state, error: 'The hall is already yours.' };
  const status = requirementStatus(state, HALL_PURCHASE.requires);
  if (!status.met) return { state, error: `The council will not sell yet: ${status.missing.join(', ')}.` };
  const cost = mode === 'lease' ? HALL_PURCHASE.lease.cost : HALL_PURCHASE.buy.cost;
  if (state.guild.crowns < cost) return { state, error: `That takes ${cost} crowns.` };
  const next = clone(state);
  next.guild.crowns -= cost;
  next.guild.hall.owned = true;
  next.guild.hall.lease = mode === 'lease';
  next.guild.legacy += 5;
  pushMoment(next, {
    type: 'construction',
    roomId: 'hall',
    title: mode === 'lease' ? 'The old hall is leased' : 'The old hall is yours',
    effect: `${HALL_PURCHASE.wings} empty wings to build in, and ${HALL_PURCHASE.beds} more beds in the old dormitory corner.`,
    unlocked: ['Room building', 'Guild duty (Office)', `${bedCount(next)} beds in total`],
    stage: hallStage(next).name,
    interior: hallStage(next).interior,
  });
  addChronicle(next, {
    type: 'facility',
    importance: 3,
    title: mode === 'lease' ? `${next.guild.name} leases the old hall` : `${next.guild.name} buys the old hall`,
    text: 'Dusty, drafty and theirs. The banner goes up over the door on Banner Plaza.',
    tags: ['hall'],
  });
  evaluateStateInPlace(next);
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
  next.guild.crowns -= plan.cost;
  const now = campaignWeekSerial(next);
  next.guild.hall.construction = { roomId, level, weeksLeft: plan.weeks, totalWeeks: plan.weeks, startSerial: now, endSerial: now + plan.weeks };
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

/** Weekly: builders work; a finished room shows its "Construction complete" moment. */
export function progressConstructionInPlace(state) {
  const hall = state.guild.hall;
  const work = hall?.construction;
  if (!work) return;
  work.weeksLeft -= 1;
  if (work.weeksLeft > 0) return;
  const stageBefore = hallStage(state).id;
  hall.rooms[work.roomId] = work.level;
  hall.construction = null;
  const room = ROOM_BY_ID[work.roomId];
  const unlocked = unlocksFor(state, work.roomId, work.level);
  // The first bunks replace the room above the Wayfarer: no more rent.
  if (work.roomId === 'bunks' && hall.rentedBeds > 0) {
    hall.rentedBeds = 0;
    unlocked.push('The rented room is given up: no more rent');
  }
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
 * guild: no free beds, injuries, no training, unknown recruits… Returns
 * { text, label, action: { kind: 'rentBed' | 'buyHall' | 'build' | 'view', roomId? } } or null.
 */
export function nextUpgrade(state) {
  const hall = state.guild.hall || {};
  const free = freeBeds(state);
  if (hall.construction) return null;
  const canBuild = (roomId) => !buildBlocker(state, roomId);
  const build = (roomId, text) => ({ text, label: `Build ${ROOM_BY_ID[roomId].name}${roomLevel(state, roomId) ? ` lv ${roomLevel(state, roomId) + 1}` : ''}`, action: { kind: 'build', roomId } });
  if (!hall.owned) {
    const purchase = requirementStatus(state, HALL_PURCHASE.requires);
    if (free <= 0 && hall.rentedBeds < RENTED_ROOM.maxBeds) return { text: 'Every bed is taken.', label: `Rent a bed (${RENTED_ROOM.bedCost})`, action: { kind: 'rentBed' } };
    if (purchase.met) return { text: 'The old hall on Banner Plaza is for sale.', label: 'See the hall', action: { kind: 'buyHall' } };
    if (free <= 0) return { text: `The rented room is full. The old hall needs ${purchase.missing.join(', ')}.`, label: 'See the hall', action: { kind: 'buyHall' } };
    return null;
  }
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

