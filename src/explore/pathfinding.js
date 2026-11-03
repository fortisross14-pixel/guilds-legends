// Grid pathfinding for walkable scenes. Blocks are axis-aligned rectangles
// ({ x, y, w, h }, top-left) in world pixels. The walker is a point (its feet)
// kept `pad` pixels away from every block and from the map edge.

export function buildGrid(size, blocks, { cell = 16, pad = 10, edge = 0 } = {}) {
  const cols = Math.ceil(size.width / cell);
  const rows = Math.ceil(size.height / cell);
  const grid = { cell, cols, rows, pad, edge, width: size.width, height: size.height, blocks, blocked: new Uint8Array(cols * rows) };
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      grid.blocked[row * cols + col] = isFree(grid, (col + 0.5) * cell, (row + 0.5) * cell) ? 0 : 1;
    }
  }
  return grid;
}

/** True when the walker's feet may stand at (x, y). */
export function isFree(grid, x, y) {
  const { pad, edge } = grid;
  if (x < edge + pad || y < edge + pad || x > grid.width - edge - pad || y > grid.height - edge - pad) return false;
  for (const block of grid.blocks) {
    if (x > block.x - pad && x < block.x + block.w + pad && y > block.y - pad && y < block.y + block.h + pad) return false;
  }
  return true;
}

/** True when a straight walk from a to b stays free (sampled every few pixels). */
export function lineFree(grid, a, b) {
  const distance = Math.hypot(b.x - a.x, b.y - a.y);
  const steps = Math.max(1, Math.ceil(distance / 4));
  for (let i = 1; i <= steps; i += 1) {
    if (!isFree(grid, a.x + ((b.x - a.x) * i) / steps, a.y + ((b.y - a.y) * i) / steps)) return false;
  }
  return true;
}

const cellOf = (grid, point) => ({
  col: Math.max(0, Math.min(grid.cols - 1, Math.floor(point.x / grid.cell))),
  row: Math.max(0, Math.min(grid.rows - 1, Math.floor(point.y / grid.cell))),
});
const centerOf = (grid, index) => ({ x: ((index % grid.cols) + 0.5) * grid.cell, y: (Math.floor(index / grid.cols) + 0.5) * grid.cell });

/** The free point closest to `point` (itself when already free). */
export function nearestFree(grid, point) {
  if (isFree(grid, point.x, point.y)) return { x: point.x, y: point.y };
  const start = cellOf(grid, point);
  let best = null;
  let bestDistance = Infinity;
  for (let radius = 1; radius < Math.max(grid.cols, grid.rows); radius += 1) {
    for (let row = start.row - radius; row <= start.row + radius; row += 1) {
      for (let col = start.col - radius; col <= start.col + radius; col += 1) {
        if (row < 0 || col < 0 || row >= grid.rows || col >= grid.cols) continue;
        if (Math.max(Math.abs(row - start.row), Math.abs(col - start.col)) !== radius) continue;
        const index = row * grid.cols + col;
        if (grid.blocked[index]) continue;
        const center = centerOf(grid, index);
        const distance = Math.hypot(center.x - point.x, center.y - point.y);
        if (distance < bestDistance) {
          best = center;
          bestDistance = distance;
        }
      }
    }
    if (best) return best;
  }
  return null;
}

/**
 * A* over the grid (8 directions, no corner cutting), then string-pulled so
 * the walker heads straight for the furthest visible waypoint.
 * Returns a list of points ending at `to` (or the nearest free point to it), or [] if unreachable.
 */
export function findPath(grid, from, to) {
  const goalPoint = nearestFree(grid, to);
  const startPoint = nearestFree(grid, from) || from;
  if (!goalPoint) return [];
  if (lineFree(grid, startPoint, goalPoint)) return [goalPoint];
  const startCell = cellOf(grid, startPoint);
  const goalCell = cellOf(grid, goalPoint);
  const start = startCell.row * grid.cols + startCell.col;
  const goal = goalCell.row * grid.cols + goalCell.col;
  const total = grid.cols * grid.rows;
  const g = new Float32Array(total).fill(Infinity);
  const came = new Int32Array(total).fill(-1);
  const closed = new Uint8Array(total);
  const open = [start];
  const f = new Float32Array(total).fill(Infinity);
  const h = (index) => {
    const dx = Math.abs((index % grid.cols) - goalCell.col);
    const dy = Math.abs(Math.floor(index / grid.cols) - goalCell.row);
    return Math.max(dx, dy) + 0.414 * Math.min(dx, dy);
  };
  g[start] = 0;
  f[start] = h(start);
  while (open.length) {
    let bestAt = 0;
    for (let i = 1; i < open.length; i += 1) if (f[open[i]] < f[open[bestAt]]) bestAt = i;
    const current = open[bestAt];
    open[bestAt] = open[open.length - 1];
    open.pop();
    if (current === goal) break;
    if (closed[current]) continue;
    closed[current] = 1;
    const col = current % grid.cols;
    const row = Math.floor(current / grid.cols);
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (!dx && !dy) continue;
        const nc = col + dx;
        const nr = row + dy;
        if (nc < 0 || nr < 0 || nc >= grid.cols || nr >= grid.rows) continue;
        const next = nr * grid.cols + nc;
        if (grid.blocked[next] || closed[next]) continue;
        if (dx && dy && (grid.blocked[row * grid.cols + nc] || grid.blocked[nr * grid.cols + col])) continue;
        const cost = g[current] + (dx && dy ? 1.414 : 1);
        if (cost < g[next]) {
          g[next] = cost;
          f[next] = cost + h(next);
          came[next] = current;
          open.push(next);
        }
      }
    }
  }
  if (came[goal] === -1 && goal !== start) return [];
  const cells = [];
  for (let at = goal; at !== -1 && at !== start; at = came[at]) cells.unshift(centerOf(grid, at));
  const raw = [...cells.slice(0, -1), goalPoint];
  const path = [];
  let anchor = startPoint;
  let index = 0;
  while (index < raw.length) {
    let furthest = index;
    for (let j = raw.length - 1; j > index; j -= 1) {
      if (lineFree(grid, anchor, raw[j])) {
        furthest = j;
        break;
      }
    }
    path.push(raw[furthest]);
    anchor = raw[furthest];
    index = furthest + 1;
  }
  return path;
}
