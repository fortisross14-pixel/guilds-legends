import { rows } from '../tiles.js';

// Lays out a walked road (Chapter 2 on: the Iron Road, the cliff road, the coast road) from a
// short spec, deterministically: woods everywhere ('T'), a winding dirt road along `path`
// (two tiles wide), open verges beside it (where bands jump anyone off the road), clearings
// joined to the road by trails (for standing bands, gathering spots, the camp), water (a
// river crossed by a bridge, or the sea along an edge), undergrowth, lone trees and
// scattered dressing. Places on it are named clearings: `spots[id]` is a clearing's centre.

const hash = (x, y, salt = 0) => {
  let h = (x * 374761393 + y * 668265263 + salt * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

/** Points of a line from a to b (inclusive), one per step. */
function line([x0, y0], [x1, y1]) {
  const points = [];
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= steps; i += 1) points.push([Math.round(x0 + ((x1 - x0) * i) / steps), Math.round(y0 + ((y1 - y0) * i) / steps)]);
  return points;
}

/**
 * spec: { width, height, salt, path: [[x, y], …] (from the west edge to the east edge),
 *   clearings: [{ id, x, y, rx, ry }], river?: { x, width }, sea?: { y } (the sea below row y),
 *   verge: tiles of open ground each side of the road, dressing: [asset ids], rocky: 0..1 }
 * Returns { tiles, spots, props, ends: { west: [x, y], east: [x, y] }, anchors }.
 */
export function layRoad(spec) {
  const { width: W, height: H, salt = 1, verge = 3 } = spec;
  const grid = Array.from({ length: H }, () => Array(W).fill('T'));
  const set = (x, y, char) => {
    if (x >= 0 && y >= 0 && x < W && y < H) grid[y][x] = char;
  };
  const get = (x, y) => (x >= 0 && y >= 0 && x < W && y < H ? grid[y][x] : 'T');

  // The road's tiles, and its verges.
  const road = [];
  spec.path.slice(1).forEach((point, index) => road.push(...line(spec.path[index], point)));
  road.forEach(([x, y]) => {
    for (let dy = -verge; dy <= verge + 1; dy += 1) for (let dx = -verge; dx <= verge; dx += 1) {
      // A ragged verge: wider in places.
      if (Math.abs(dy) + Math.abs(dx) * 0.5 <= verge + hash(x + dx, y + dy, salt) * 1.5) set(x + dx, y + dy, '.');
    }
  });
  // Clearings, and a trail from each to the nearest road tile.
  const spots = {};
  (spec.clearings || []).forEach((clearing) => {
    for (let y = clearing.y - clearing.ry - 1; y <= clearing.y + clearing.ry + 1; y += 1)
      for (let x = clearing.x - clearing.rx - 1; x <= clearing.x + clearing.rx + 1; x += 1) {
        const d = ((x - clearing.x) / clearing.rx) ** 2 + ((y - clearing.y) / clearing.ry) ** 2;
        if (d <= 1 + hash(x, y, salt + 3) * 0.35) set(x, y, hash(x, y, salt + 5) < 0.25 ? ',' : '.');
      }
    spots[clearing.id] = [clearing.x, clearing.y];
  });
  // Undergrowth and lone trees on the open ground (never on the road or by the clearings' centres).
  for (let y = 1; y < H - 1; y += 1)
    for (let x = 1; x < W - 1; x += 1) {
      if (grid[y][x] !== '.') continue;
      const r = hash(x, y, salt + 7);
      const nearSpot = Object.values(spots).some(([sx, sy]) => Math.abs(sx - x) <= 2 && Math.abs(sy - y) <= 2);
      if (r < 0.08) grid[y][x] = '"';
      else if (r > 0.975 && !nearSpot) grid[y][x] = 'T';
    }
  // Trails from each clearing to the nearest road tile, two wide, after the trees (so nothing grows on them).
  const trail = new Set();
  (spec.clearings || []).forEach((clearing) => {
    const near = road.reduce((best, point) => (Math.hypot(point[0] - clearing.x, point[1] - clearing.y) < Math.hypot(best[0] - clearing.x, best[1] - clearing.y) ? point : best), road[0]);
    line([clearing.x, clearing.y], near).forEach(([x, y]) => {
      [[0, 0], [1, 0], [0, 1]].forEach(([dx, dy]) => {
        if (['T', '"'].includes(get(x + dx, y + dy))) set(x + dx, y + dy, '.');
        trail.add(`${x + dx},${y + dy}`);
      });
    });
  });
  // The road itself, two tiles wide (over everything).
  road.forEach(([x, y]) => {
    set(x, y, ':');
    set(x, y + 1, ':');
  });
  // Water: a river (bridged where the road crosses), or the sea below a ragged shoreline.
  if (spec.river) {
    for (let y = 0; y < H; y += 1) {
      const bend = Math.round(Math.sin(y / 4 + salt) * 1.5);
      for (let k = 0; k < spec.river.width; k += 1) {
        const x = spec.river.x + bend + k;
        set(x, y, get(x, y) === ':' ? 'b' : '~');
      }
    }
  }
  if (spec.sea) {
    for (let x = 0; x < W; x += 1) {
      const shore = spec.sea.y + Math.round(Math.sin(x / 6 + salt) * 1.5 + hash(x, 0, salt + 9) * 1.2);
      for (let y = shore; y < H; y += 1) if (get(x, y) !== ':') set(x, y, '~');
      // A beach above the waterline (the coast road): open meadow, no woods.
      for (let y = shore - (spec.sea.beach || 0); y < shore; y += 1) if (get(x, y) === 'T') set(x, y, hash(x, y, salt + 19) < 0.4 ? ',' : '.');
    }
  }
  // The edges: woods, except where the road leaves.
  const ends = { west: spec.path[0], east: spec.path[spec.path.length - 1] };
  for (let x = 0; x < W; x += 1) {
    if (grid[0][x] !== '~') grid[0][x] = 'T';
    if (grid[H - 1][x] !== '~') grid[H - 1][x] = 'T';
  }
  for (let y = 0; y < H; y += 1) {
    const roadRow = (end) => y === end[1] || y === end[1] + 1;
    if (!roadRow(ends.west) && grid[y][0] !== '~') grid[y][0] = 'T';
    if (!roadRow(ends.east) && grid[y][W - 1] !== '~') grid[y][W - 1] = 'T';
  }
  // Dressing: small things on open ground (walkable), a few rocks (solid), away from the road and spots.
  const props = [];
  const dressing = spec.dressing || ['deco.flowers-white', 'deco.fern', 'deco.pebbles', 'deco.flowers-pink', 'deco.bush'];
  const solid = spec.rocks || ['deco.rock-big', 'deco.rocks', 'deco.stump', 'deco.log'];
  for (let y = 2; y < H - 2; y += 1)
    for (let x = 2; x < W - 2; x += 1) {
      if (grid[y][x] !== '.' && grid[y][x] !== ',') continue;
      const nearSpot = Object.values(spots).some(([sx, sy]) => Math.abs(sx - x) <= 3 && Math.abs(sy - y) <= 3);
      const nearRoad = [-1, 0, 1, 2].some((dy) => [-1, 0, 1].some((dx) => grid[y + dy]?.[x + dx] === ':' || grid[y + dy]?.[x + dx] === 'b'));
      if (nearSpot || nearRoad || trail.has(`${x},${y}`)) continue;
      const r = hash(x, y, salt + 11);
      if (r < 0.035) props.push({ id: `d-${x}-${y}`, asset: dressing[Math.floor(hash(x, y, salt + 13) * dressing.length)], at: [x, y], size: [1, 1], walkable: true });
      else if (r > 1 - (spec.rocky ?? 0.012)) props.push({ id: `r-${x}-${y}`, asset: solid[Math.floor(hash(x, y, salt + 17) * solid.length)], at: [x, y], size: [1, 1] });
    }
  // Anchors for contract objectives: open tiles in the clearings, spread out.
  const anchors = (spec.clearings || []).flatMap((clearing) => [
    [clearing.x - 1, clearing.y],
    [clearing.x + 2, clearing.y + 1],
  ]);
  return { tiles: rows(W, ...grid.map((row) => row.join(''))), spots, props, ends, anchors };
}
