// Turns a town (src/data/towns) or wild area (src/data/wilds) layout into the
// map format WalkableScene / walkGame.js use: a tile grid, blocked rectangles,
// drawn props and interactive targets. Coordinates in the data are tiles; the
// map is in world pixels.
import { TILE_BY_CHAR, TILE_SIZE as T } from '../data/tiles.js';
import { areaGroups } from '../data/wilds/index.js';
import { EXIT, ROOM } from '../data/interiors.js';
import { shortLabels } from '../game/engine.js';

const BUILDING = { w: 5, h: 5 }; // tiles; the bottom row of the building sits just above its door tile

const tileCenter = ([col, row]) => ({ x: (col + 0.5) * T, y: (row + 0.5) * T });
const rect = (col, row, w, h) => ({ x: col * T, y: row * T, w: w * T, h: h * T });

function tileGrid(place) {
  const data = place.tiles.map((line) => [...line].map((char) => (TILE_BY_CHAR[char] || TILE_BY_CHAR['.']).index));
  // Blocked tiles, merged into horizontal runs per row.
  const blocks = [];
  place.tiles.forEach((line, row) => {
    let start = -1;
    [...line, '.'].forEach((char, col) => {
      const blocked = TILE_BY_CHAR[char]?.block;
      if (blocked && start < 0) start = col;
      if (!blocked && start >= 0) {
        blocks.push(rect(start, row, col - start, 1));
        start = -1;
      }
    });
  });
  return { data, blocks };
}

function propPieces(props = []) {
  const drawn = [];
  const blocks = [];
  const targets = [];
  props.forEach((prop) => {
    const [col, row] = prop.at;
    const [w, h] = prop.size;
    // Props are drawn one tile taller than their footprint, overlapping upward.
    drawn.push({ asset: prop.asset, x: col * T, y: (row - 1) * T, w: w * T, h: (h + 1) * T });
    if (!prop.walkable) blocks.push(rect(col, row, w, h));
    if (prop.poi) {
      const cx = (col + w / 2) * T;
      targets.push({
        id: `poi:${prop.id}`,
        kind: prop.poi.building ? 'door' : 'poi',
        name: prop.poi.name,
        verb: prop.poi.verb || 'Inspect',
        dialogue: prop.poi.dialogue || null,
        building: prop.poi.building || null,
        x: cx,
        y: (row + h) * T,
        hit: rect(col, row - 1, w, h + 1),
        approach: { x: cx, y: (row + h) * T + 18 },
        labelAt: { x: cx, y: (row - 1) * T - 24 },
        reach: 40,
      });
    }
  });
  return { drawn, blocks, targets };
}

function exitTarget(exit, extra = {}) {
  const [col, row] = exit.at;
  const [w, h] = exit.size || [1, 1];
  const point = { x: (col + w / 2) * T, y: (row + h / 2) * T };
  return {
    id: exit.id || 'exit',
    kind: 'exit',
    name: exit.name,
    verb: 'Travel',
    x: point.x,
    y: point.y + T / 2,
    hit: rect(col, row, w, h),
    approach: point,
    labelAt: { x: point.x, y: point.y - 44 },
    reach: 30,
    auto: true,
    beacon: true,
    ...extra,
  };
}

function base(place) {
  const { data, blocks } = tileGrid(place);
  return {
    id: place.id,
    size: { width: place.width * T, height: place.height * T },
    background: '#16191c',
    tiles: { asset: 'tiles.ground', size: T, data },
    player: { asset: 'char.founder', w: 26, h: 36 },
    pad: 9,
    blocks,
  };
}

// What a door is for, at a glance: coin = shop, sword = arena, bed = rest (hall and inns), crown = rankings.
const DOOR_ICONS = { shop: 'coin', arena: 'sword', guildHall: 'moon', tavern: 'moon', herald: 'crown', noticeBoard: 'scroll' };

/**
 * Walkable map for a town. `hall` ({ asset, label }) swaps the main Guild Hall
 * building's art and name for the guild's current hall stage.
 */
export function townMap(town, hall = null) {
  const map = base(town);
  const props = propPieces(town.props);
  const buildingProps = [];
  const doors = town.buildings.map((source) => {
    const isHall = hall && source.building === 'guildHall' && !source.id;
    const building = isHall ? { ...source, asset: hall.asset, label: hall.label } : source;
    const [col, row] = building.door;
    const left = col - Math.floor(BUILDING.w / 2);
    const top = row - BUILDING.h;
    buildingProps.push({ asset: building.asset, x: left * T, y: top * T, w: BUILDING.w * T, h: BUILDING.h * T });
    map.blocks.push(rect(left, top, BUILDING.w, BUILDING.h));
    const door = tileCenter(building.door);
    return {
      id: `door:${building.id || building.building}`,
      kind: 'door',
      name: building.label,
      verb: 'Enter',
      building: building.building,
      icon: DOOR_ICONS[building.building] || null,
      x: door.x,
      y: row * T,
      hit: rect(left, top, BUILDING.w, BUILDING.h),
      approach: door,
      labelAt: { x: door.x, y: top * T - 22 },
      reach: 34,
    };
  });
  const npcs = town.npcs.map((npc) => npcTarget(town.id, npc));
  map.blocks.push(...props.blocks);
  map.props = [...props.drawn, ...buildingProps];
  map.targets = [...doors, ...props.targets, ...npcs, ...(town.exits || []).map((exit) => exitTarget(exit, { area: exit.area }))];
  map.spawn = tileCenter(town.spawn);
  return map;
}

function npcTarget(placeId, npc) {
  const { x } = tileCenter(npc.at);
  const feet = (npc.at[1] + 1) * T - 2;
  return {
    id: `npc:${npc.id}`,
    kind: 'npc',
    name: npc.name,
    role: npc.role,
    verb: 'Talk',
    dialogue: npc.dialogue,
    icon: 'letter',
    if: npc.if || null,
    hideWhenInactive: Boolean(npc.if),
    x,
    y: feet,
    asset: `npc.${placeId}.${npc.id}`,
    w: 26,
    h: 36,
    bob: true,
    approach: { x, y: feet + 22 },
    labelAt: { x, y: feet - 54 },
    reach: 38,
  };
}

/** Walkable map for a wild area. Every group, gathering spot and the camp is a target. */
export function wildMap(area) {
  const map = base(area);
  const props = propPieces(area.props);
  const [cc, cr] = area.camp.at;
  const [cw, ch] = area.camp.size;
  const campX = (cc + cw / 2) * T;
  map.blocks.push(...props.blocks, rect(cc, cr, cw, ch));
  map.props = [...props.drawn, { asset: 'prop.campfire', x: cc * T, y: cr * T, w: cw * T, h: ch * T }];
  const camp = {
    id: 'camp',
    kind: 'camp',
    name: area.camp.name,
    verb: 'Rest',
    x: campX,
    y: (cr + ch) * T,
    hit: rect(cc, cr, cw, ch),
    approach: { x: campX, y: (cr + ch) * T + 18 },
    labelAt: { x: campX, y: cr * T - 24 },
    reach: 40,
  };
  const groups = areaGroups(area).map((group) => {
    const { x } = tileCenter(group.at);
    const feet = (group.at[1] + 1) * T - 2;
    const size = group.isBoss ? { w: 80, h: 64 } : { w: 56, h: 44 };
    return {
      id: `enemy:${group.id}`,
      kind: 'enemy',
      name: group.isBoss ? group.boss.name : group.name,
      verb: 'Fight',
      group: group.id,
      x,
      y: feet,
      asset: group.asset,
      ...size,
      bob: true,
      approach: { x, y: feet + 20 },
      labelAt: { x, y: feet - size.h - 20 },
      reach: group.isBoss ? 40 : 34,
      auto: true,
      hideWhenInactive: true,
    };
  });
  const gathers = area.gathers.map((spot) => {
    const { x } = tileCenter(spot.at);
    const feet = (spot.at[1] + 1) * T - 4;
    return {
      id: `gather:${spot.id}`,
      kind: 'gather',
      name: spot.name,
      verb: 'Gather',
      spot: spot.id,
      x,
      y: feet,
      asset: `prop.gather.${spot.kind}`,
      w: 28,
      h: 28,
      approach: { x, y: feet + 6 },
      labelAt: { x, y: feet - 48 },
      reach: 34,
      hideWhenInactive: true,
    };
  });
  map.targets = [camp, ...props.targets, ...groups, ...gathers, exitTarget(area.exit, { id: 'exit', hub: area.hub })];
  map.spawn = tileCenter(area.arrive);
  return map;
}

/**
 * Walkable map for a building interior (src/data/interiors.js) with the people
 * in it (engine peopleIn). The room fits one screen (`fit: 'contain'`).
 * People are targets (tap to walk over and talk), `poi` furniture is tapped,
 * and the doorway at the bottom leads back out.
 */
export function interiorMap(room, people, { id, exitName = 'Leave' } = {}) {
  const width = ROOM.w * T;
  const height = ROOM.h * T;
  const blocks = [rect(0, 0, ROOM.w, 1)];
  const props = [];
  const targets = [];
  room.furniture.forEach((piece) => {
    const [col, row] = piece.at;
    const [w, h] = piece.size;
    props.push({ asset: piece.asset, x: col * T, y: (row - 1) * T, w: w * T, h: (h + 1) * T });
    if (!piece.walkable) blocks.push(rect(col, row, w, h));
    if (piece.poi) {
      const cx = (col + w / 2) * T;
      const below = piece.wall ? (row + h) * T + 20 : (row + h) * T + 18;
      // Shelves on the side walls are approached from the room side.
      const side = col === 0 ? 'left' : col + w >= ROOM.w ? 'right' : null;
      targets.push({
        id: `poi:${piece.id}`,
        kind: 'poi',
        name: piece.poi.name,
        verb: piece.poi.verb || 'Inspect',
        poi: piece.poi,
        icon: piece.poi.shelf ? 'bag' : piece.poi.board === 'history' ? 'trophy' : piece.poi.board === 'rankings' ? 'crown' : 'book',
        x: cx,
        y: (row + h) * T,
        hit: rect(col, row - 1, w, h + 1),
        approach: side === 'left' ? { x: (col + w) * T + 18, y: (row + h / 2) * T } : side === 'right' ? { x: col * T - 18, y: (row + h / 2) * T } : { x: cx, y: below },
        labelAt: { x: cx, y: (row - 1) * T - 8 },
        reach: 44,
      });
    }
  });
  const spots = Object.fromEntries(room.spots.map((spot) => [spot.id, spot]));
  const labels = shortLabels(people);
  people.forEach((person) => {
    const spot = spots[person.spot];
    if (!spot) return;
    const { x } = tileCenter(spot.at);
    const feet = (spot.at[1] + 1) * T - 2;
    targets.push({
      id: `person:${person.id}`,
      kind: 'npc',
      name: person.name,
      // First names over heads keep a full room readable; the dialogue shows the full name and role.
      labelText: labels[person.id],
      role: person.role,
      verb: 'Talk',
      person: person.id,
      dialogue: person.dialogue || null,
      unknown: !person.met && !person.dialogue,
      badges: person.met || person.dialogue ? person.offers.map((offer) => (offer.type === 'hire' ? (offer.locked ? 'lock' : 'coin') : offer.type === 'mission' ? 'alert' : 'swords')) : [],
      x,
      y: feet,
      asset: person.sprite,
      w: 26,
      h: 36,
      bob: true,
      approach: { x, y: feet + (spot.behind ? 2 * T : 22) },
      labelAt: { x, y: feet - 50 },
      reach: spot.behind ? 2 * T + 8 : 38,
    });
  });
  const [ec, er] = EXIT.at;
  const door = { x: (ec + 0.5) * T, y: (er + 0.5) * T };
  // The doorway is approached from just inside the room (the walls around it are padded for walking).
  const inside = { x: door.x, y: er * T - 10 };
  targets.push({ id: 'exit', kind: 'exit', name: exitName, verb: 'Leave', x: door.x, y: door.y + T / 2, hit: rect(ec - 1, er - 1, 3, 2), approach: inside, labelAt: { x: door.x, y: door.y - 4 }, reach: 22, auto: true, icon: 'door' });
  return {
    id,
    size: { width, height },
    background: '#0b0c12',
    ground: room.floor,
    player: { asset: 'char.founder', w: 26, h: 36 },
    pad: 8,
    edge: 4,
    blocks: [...blocks, rect(0, 0, 1, ROOM.h), rect(ROOM.w - 1, 0, 1, ROOM.h), rect(0, ROOM.h - 1, ec, 1), rect(ec + 1, ROOM.h - 1, ROOM.w - ec - 1, 1)],
    props,
    targets,
    spawn: { x: door.x, y: door.y - 2 * T },
    fit: 'contain',
  };
}
