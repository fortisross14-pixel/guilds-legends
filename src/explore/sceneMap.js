// Turns a town (src/data/towns) or wild area (src/data/wilds) layout into the
// map format WalkableScene / walkGame.js use: a tile grid, blocked rectangles,
// drawn props and interactive targets. Coordinates in the data are tiles; the
// map is in world pixels.
import { TILE_BY_CHAR, TILE_SIZE as T } from '../data/tiles.js';
import { areaGroups } from '../data/wilds/index.js';
import { ASSETS } from '../data/assets.js';

const BUILDING = { w: 5, h: 5 }; // tiles; the bottom row of the building sits just above its door tile

// HeroEditor walkers (scripts/art/characters.py) are drawn larger than the old 26 x 36 sprites.
const WALKER = { w: 44, h: 47 };
/** Draw size for a person's sprite: the walker size for hand-painted walk sheets. */
export function personSize(asset, fallback = { w: 26, h: 36 }) {
  return ASSETS[asset]?.walker ? WALKER : fallback;
}

/**
 * Where a building or prop image goes. New art (`aspect` in the registry) keeps its
 * own proportions: centred on the footprint, standing on its bottom edge, at its
 * `scale` (buildings) or fitted to the footprint's width (props, height capped).
 */
function placed(asset, box, { maxH = Infinity } = {}) {
  const art = ASSETS[asset];
  if (!art?.aspect) return { asset, ...box };
  let w = art.scale && art.group === 'building' ? art.w * BUILDING_SCALE : box.w;
  let h = (w * art.h) / art.w;
  if (h > maxH) {
    w = (w * maxH) / h;
    h = maxH;
  }
  return { asset, x: box.x + (box.w - w) / 2, y: box.y + box.h - h, w, h, depth: box.y + box.h };
}
const BUILDING_SCALE = 0.42; // hand-painted 64 px tiles at the walk grid: doors about a walker high

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
    drawn.push(placed(prop.asset, { x: col * T, y: (row - 1) * T, w: w * T, h: (h + 1) * T }, { maxH: (h + 2) * T }));
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
    beacon: true,
    ...extra,
  };
}

function base(place) {
  const { data, blocks } = tileGrid(place);
  // The hand-painted ground, when imported, is painted from the tile rows (groundPaint.js).
  const painted = ASSETS['tiles.handpainted'];
  return {
    id: place.id,
    size: { width: place.width * T, height: place.height * T },
    background: '#16191c',
    ...(painted
      ? { groundPaint: { asset: 'tiles.handpainted', rows: place.tiles, tileSize: T, tone: place.kind === 'wild' ? 'rgba(20, 30, 40, .18)' : null } }
      : { tiles: { asset: 'tiles.ground', size: T, data } }),
    player: { asset: 'char.founder', ...personSize('char.founder') },
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
    buildingProps.push(placed(building.asset, { x: left * T, y: top * T, w: BUILDING.w * T, h: BUILDING.h * T }));
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
    faceWalker: Boolean(ASSETS[`npc.${placeId}.${npc.id}`]?.walker),
    x,
    y: feet,
    asset: `npc.${placeId}.${npc.id}`,
    ...personSize(`npc.${placeId}.${npc.id}`),
    bob: true,
    approach: { x, y: feet + 22 },
    labelAt: { x, y: feet - personSize(`npc.${placeId}.${npc.id}`).h - 18 },
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


/** The enemy-group art for a site fight, from who is in it. */
function siteGroupAsset(enemies = []) {
  if (enemies.some((id) => /wolf|hound/.test(id))) return 'enemy.group.wolves';
  if (enemies.some((id) => /hollow|veil|void|mind|dream/.test(id))) return 'enemy.group.hollow';
  if (enemies.some((id) => /witch|priest/.test(id))) return 'enemy.group.witch';
  return 'enemy.group.bandits';
}

const SITE_ICONS = { fight: 'swords', talk: 'alert', inspect: 'search', collect: 'plant', escort: 'boot' };

/**
 * Contract objectives standing on a walkable map (missions-in-world): fights are
 * enemy groups (touching one starts it), people stand to be talked to, clues and
 * finds are tapped, and an escort's destination waits for them. Every one is a
 * quest beacon, so it stays in view at the screen's edge. `objects` comes from the
 * engine (siteObjects) with tile slots.
 */
export function siteTargets(objects) {
  return objects
    .filter((object) => object.slot?.tile)
    .map(({ missionId, objective, slot, arrive }) => {
      const { x } = tileCenter(slot.tile);
      const feet = (slot.tile[1] + 1) * T - 2;
      const id = `site:${missionId}:${objective.id}${arrive ? ':arrive' : ''}`;
      const site = { missionId, objectiveId: objective.id, arrive: Boolean(arrive) };
      if (arrive) return { id, kind: 'poi', name: `Bring ${objective.name} here`, verb: 'Arrive', site, icon: 'flag', x, y: feet, w: 28, h: 28, asset: 'site.marker.destination', approach: { x, y: feet + 18 }, labelAt: { x, y: feet - 44 }, reach: 40, beacon: true };
      if (objective.kind === 'fight') {
        const size = objective.boss ? { w: 80, h: 64 } : { w: 56, h: 44 };
        return { id, kind: 'enemy', name: objective.name, verb: 'Fight', site, icon: objective.boss ? 'skull' : 'swords', x, y: feet, asset: siteGroupAsset(objective.enemies), ...size, bob: true, approach: { x, y: feet + 20 }, labelAt: { x, y: feet - size.h - 20 }, reach: objective.boss ? 40 : 34, auto: true, beacon: true };
      }
      if (objective.kind === 'talk' || objective.kind === 'escort')
        return { id, kind: 'npc', name: objective.name, role: objective.role, verb: 'Talk', site, icon: SITE_ICONS[objective.kind], x, y: feet, asset: 'npc.role.traveller', ...personSize('npc.role.traveller'), bob: true, approach: { x, y: feet + 22 }, labelAt: { x, y: feet - personSize('npc.role.traveller').h - 16 }, reach: 38, beacon: true };
      return { id, kind: objective.kind === 'collect' ? 'gather' : 'poi', name: objective.name, verb: objective.kind === 'collect' ? 'Collect' : 'Inspect', site, icon: SITE_ICONS[objective.kind], x, y: feet, asset: objective.kind === 'collect' ? 'site.marker.collect' : 'site.marker.inspect', w: 28, h: 28, approach: { x, y: feet + 8 }, labelAt: { x, y: feet - 46 }, reach: 36, beacon: !objective.optional };
    });
}

/** A painted contract site's door in town (missions-in-world): "Enter The archive vault". */
export function siteDoorTarget(site) {
  const { x } = tileCenter(site.door);
  const feet = (site.door[1] + 1) * T - 2;
  return { id: `sitedoor:${site.id}`, kind: 'door', name: site.name, verb: 'Enter', siteId: site.id, icon: 'door', x, y: feet, asset: 'site.marker.door', w: 32, h: 40, approach: { x, y: feet + 18 }, labelAt: { x, y: feet - 56 }, reach: 36, beacon: true };
}
