// @ts-check
// The guild's home: the founder's house, leasing the old stable (story mission 1)
// or buying it outright, building rooms in its empty wings, construction over
// weeks, the "Construction complete" moment and the next-upgrade suggestion. Data: src/data/rooms.js.
import { HALL_PURCHASE, HOUSE, ROOMS, ROOM_BY_ID, roomInterior } from '../../data/rooms.js';
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
  tallySpend,
  trophyCount,
} from './core.js';
import { charterEffect } from './charter.js';
import { evaluateStateInPlace } from './goals.js';
import { hallUpkeep } from './economy.js';
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
    next: next ? { level: level + 1, cost: roomCost(state, room.id, next), weeks: next.weeks, upkeep: next.upkeep, effect: room.effect(level + 1), ...requirementStatus(state, next.requires) } : null,
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
    houseBeds: hall.houseBeds ?? HOUSE.beds,
    // Buying the leased stable outright ends the rent.
    purchase: hall.owned && hall.lease ? { buy: HALL_PURCHASE.buy.cost, leaseRent: HALL_PURCHASE.lease.rent } : null,
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
  if (!hall.owned) return 'Rent the old stable on Banner Plaza first (story mission 1).';
  if (hall.construction) return `The builders are busy with the ${ROOM_BY_ID[hall.construction.roomId]?.name}.`;
  const level = roomLevel(state, roomId);
  const next = room.levels[level];
  if (!next) return `${room.name} is fully built.`;
  const status = requirementStatus(state, next.requires);
  if (!status.met) return `${room.name} needs: ${status.missing.join(', ')}.`;
  if (!level && wings(state).free <= 0) return 'No empty wing left. Raise the hall’s renown to open more.';
  if (state.guild.crowns < roomCost(state, roomId, next)) return `${room.name} costs ${roomCost(state, roomId, next)} gold.`;
  return null;
}

/**
 * Leases the hall in place (mission 1's scene, or a skipped tutorial). `deposit` is
 * what the owner takes up front (0 when the work is done instead).
 */
export function leaseHallInPlace(state, deposit = HALL_PURCHASE.lease.cost) {
  const hall = state.guild.hall;
  if (hall.owned) return false;
  if (deposit > 0) {
    state.guild.crowns -= deposit;
    tallySpend(state, 'hall', deposit);
  }
  hall.owned = true;
  hall.lease = true;
  state.guild.legacy += 5;
  pushMoment(state, {
    type: 'construction',
    roomId: 'hall',
    title: `${HALL_PURCHASE.name}: yours to build in`,
    effect: `${HALL_PURCHASE.wings} empty wings to build rooms in, and ${HALL_PURCHASE.beds} beds to start. Rent is ${HALL_PURCHASE.lease.rent} gold a month.`,
    unlocked: ['Room building', 'Guild duty (Office)', `${bedCount(state)} beds in total`],
    stage: hallStage(state).name,
    interior: hallStage(state).interior,
  });
  addChronicle(state, { type: 'facility', importance: 3, title: `${state.guild.name} rents ${HALL_PURCHASE.name}`, text: 'Dusty, drafty and theirs. The banner goes up over the door on Banner Plaza.', tags: ['hall'] });
  return true;
}

/** Buys the leased stable outright from Gideon Rusk: no more rent. */
export function buyHall(state) {
  const hall = state.guild.hall || {};
  if (!hall.owned) return { state, error: 'Rent the old stable first (story mission 1).' };
  if (!hall.lease) return { state, error: 'The hall is already yours outright.' };
  const cost = HALL_PURCHASE.buy.cost;
  if (state.guild.crowns < cost) return { state, error: `Gideon wants ${cost} gold for it.` };
  const next = clone(state);
  next.guild.crowns -= cost;
  tallySpend(next, 'hall', cost);
  next.guild.hall.lease = false;
  next.guild.legacy += 5;
  addChronicle(next, { type: 'facility', importance: 3, title: `${next.guild.name} buys the old stable`, text: 'Gideon Rusk signs the deed over. No more rent, and nobody can take the hall away.', tags: ['hall'] });
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
  next.guild.crowns -= roomCost(state, roomId, plan);
  tallySpend(next, 'hall', roomCost(state, roomId, plan));
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
 * { text, label, action: { kind: 'story' | 'build' | 'view', roomId? } } or null.
 */
export function nextUpgrade(state) {
  const hall = state.guild.hall || {};
  const free = freeBeds(state);
  if (hall.construction) return null;
  const canBuild = (roomId) => !buildBlocker(state, roomId);
  const build = (roomId, text) => ({ text, label: `Build ${ROOM_BY_ID[roomId].name}${roomLevel(state, roomId) ? ` lv ${roomLevel(state, roomId) + 1}` : ''}`, action: { kind: 'build', roomId } });
  if (!hall.owned) return { text: 'Your house has one bed. The old stable on Banner Plaza stands empty.', label: 'Story: rent it', action: { kind: 'story' } };
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

