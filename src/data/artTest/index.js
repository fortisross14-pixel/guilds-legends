// The art test town: Dunmere rebuilt from the Arex V "Medieval Fantasy" pack, to
// judge the pack in play before any real place changes. Images and layout come
// from scripts/art-test/compose_arex.py (layout.json); this file turns them into
// maps for the walk engine (src/explore/walkGame.js). Nothing here touches the
// campaign state.
import LAYOUT from './layout.json';

const T = 32; // the walk grid (16 px pack tiles at 2x)
const CHAR = { w: 48, h: 64 }; // 24 x 32 pack characters at 2x

function person(scene, data) {
  const x = (data.at[0] + 0.5) * T;
  const y = (data.at[1] + 1) * T;
  return {
    id: `npc:${scene}:${data.id}`,
    kind: 'npc',
    name: data.name,
    verb: 'Talk',
    line: data.line,
    icon: 'letter',
    x,
    y,
    asset: `arex.char.${data.char}`,
    w: CHAR.w,
    h: CHAR.h,
    faceWalker: true,
    // Someone behind a counter is talked to across it.
    approach: data.approach ? { x: (data.approach[0] + 0.5) * T, y: data.approach[1] * T } : { x, y: y + 26 },
    labelAt: { x, y: y - CHAR.h - 8 },
    reach: data.reach ? data.reach * T : 44,
  };
}

function door(data) {
  return {
    id: data.id,
    kind: 'door',
    name: data.name,
    verb: 'Enter',
    building: data.building,
    x: data.x,
    y: data.y,
    asset: data.asset,
    w: data.w,
    h: data.h,
    depthBias: 2,
    opens: true,
    hit: { x: data.x - 40, y: data.y - 120, w: 80, h: 124 },
    approach: { x: data.x, y: data.y + 22 },
    labelAt: { x: data.x, y: data.y - 150 },
    reach: 38,
  };
}

function exit(data) {
  return {
    id: data.id,
    kind: 'exit',
    name: data.name,
    verb: 'Travel',
    x: data.x,
    y: data.y,
    hit: { x: data.x - 32, y: data.y - 40, w: 64, h: 64 },
    approach: { x: data.x, y: data.y - 8 },
    labelAt: { x: data.x, y: data.y - 50 },
    reach: 36,
    beacon: true,
  };
}

/** The walkable map for 'town' or 'tavern'. */
export function artTestMap(sceneId) {
  const scene = LAYOUT[sceneId];
  return {
    id: `art-test:${sceneId}`,
    size: scene.size,
    ground: scene.ground,
    props: scene.props,
    blocks: scene.blocks,
    pixelArt: true,
    fit: sceneId === 'tavern' ? 'contain' : undefined,
    zoom: 0.85,
    background: sceneId === 'tavern' ? '#1b120c' : '#2e3a1c',
    player: { asset: `arex.char.${LAYOUT.player.char}`, w: CHAR.w, h: CHAR.h },
    targets: [...(scene.doors || []).map(door), ...scene.people.map((data) => person(sceneId, data)), ...(scene.exits || []).map(exit)],
    spawn: scene.spawn,
  };
}

/** Where the founder stands after leaving a building in the test town. */
export function artTestDoorStep(doorId) {
  const found = (LAYOUT.town.doors || []).find((item) => item.id === doorId);
  return found ? { x: found.x, y: found.y + 30 } : LAYOUT.town.spawn;
}
