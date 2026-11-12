// Paints a walkable place's ground (its rows of tile characters, src/data/tiles.js)
// from the hand-painted tile atlas (asset 'tiles.handpainted', made by
// scripts/art/import_myart.py) into one canvas. Paths, the plaza and water use
// quarter-tile autotiling: each 64 px tile is drawn as four quarters, each picked
// from a 3 x 3 set (corner, edge or middle) by its two neighbours, so roads one
// tile wide get grass edges on both sides.

// Which characters join into one shape (a road runs onto the bridge, the river under it).
// Streets and the plaza are one paved shape; dirt and mud are the same shape, tinted.
const SETS = {
  path: { chars: '=:mb#', tiles: 'plaza' },
  water: { chars: '~b', tiles: 'pool' },
};
const SET_FOR = { '=': 'path', ':': 'path', m: 'path', '#': 'path', '~': 'water' };
const TINT = { ':': 'rgba(120, 80, 40, .22)', m: 'rgba(60, 40, 20, .34)' };

function hash(col, row) {
  let h = (col * 374761393 + row * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return Math.abs(h ^ (h >>> 16));
}

/**
 * Returns a canvas of the whole place at `scale` canvas px per world px (one tile
 * is `tileSize` world px). `image` is the loaded atlas, `atlas` its registry entry.
 */
export function paintGround({ image, atlas, rows, tileSize = 32, tone = null, wild = false }) {
  const height = rows.length;
  const width = Math.max(...rows.map((line) => line.length));
  const S = atlas.tile; // source tile size
  const scale = Math.min(S / tileSize, 4096 / (Math.max(width, height) * tileSize));
  const D = tileSize * scale; // drawn tile size
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(width * D);
  canvas.height = Math.ceil(height * D);
  const context = canvas.getContext('2d');
  context.imageSmoothingQuality = 'high';
  const at = (col, row) => {
    const r = Math.min(height - 1, Math.max(0, row));
    const line = rows[r];
    return line[Math.min(line.length - 1, Math.max(0, col))] || '.';
  };
  const cell = (name) => atlas.cells[name];
  const src = (index) => ({ sx: (index % atlas.cols) * S, sy: Math.floor(index / atlas.cols) * S });
  const draw = (name, col, row, { quarter = null, alpha = 1 } = {}) => {
    const index = cell(name);
    if (index === undefined) return;
    const { sx, sy } = src(index);
    context.globalAlpha = alpha;
    if (quarter) {
      const [qx, qy] = quarter;
      const h = S / 2;
      context.drawImage(image, sx + qx * h, sy + qy * h, h, h, col * D + qx * (D / 2), row * D + qy * (D / 2), D / 2 + 0.5, D / 2 + 0.5);
    } else context.drawImage(image, sx, sy, S, S, col * D, row * D, D + 0.5, D + 0.5);
    context.globalAlpha = 1;
  };

  // 1. Grass everywhere, with a few tufts and flowers (more in meadows).
  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col < width; col += 1) {
      const char = at(col, row);
      const roll = hash(col, row) % 100;
      let name = char === ',' ? (roll < 35 ? 'flowers' : 'grass2') : roll < 4 ? 'flowers' : roll < 30 ? 'grass2' : 'grass';
      if (wild && cell('wgrass') !== undefined) name = char === ',' && roll < 30 ? 'flowers' : roll < 40 ? 'wgrass2' : roll < 60 ? 'wgrass3' : 'wgrass';
      draw(name, col, row);
    }
  }

  // 2. Shapes on the grass: water, paths, the plaza (each autotiled), then the bridge.
  if (wild && cell('road-c0') !== undefined) {
    paintWildShapes();
  } else ['water', 'path'].forEach((setId) => {
    const set = SETS[setId];
    const same = (col, row) => set.chars.includes(at(col, row));
    for (let row = 0; row < height; row += 1) {
      for (let col = 0; col < width; col += 1) {
        const char = at(col, row);
        if (SET_FOR[char] !== setId && !(setId === 'water' && char === 'b')) continue;
        [0, 1].forEach((qy) =>
          [0, 1].forEach((qx) => {
            // A shape one tile wide along an axis fills the tile across it (edges would leave a thin strip).
            const h = same(col + (qx ? 1 : -1), row) || (!same(col - 1, row) && !same(col + 1, row) && setId === 'path');
            const v = same(col, row + (qy ? 1 : -1)) || (!same(col, row - 1) && !same(col, row + 1) && setId === 'path');
            let piece = 4;
            if (h && !v) piece = qy ? 7 : 1;
            else if (!h && v) piece = qx ? 5 : 3;
            else if (!h && !v) piece = qy ? (qx ? 8 : 6) : qx ? 2 : 0;
            draw(`${set.tiles}${piece}`, col, row, { quarter: [qx, qy] });
          }),
        );
        if (TINT[char]) {
          context.fillStyle = TINT[char];
          context.fillRect(col * D, row * D, D + 0.5, D + 0.5);
        }
      }
    }
  });
  // Wild areas: the grassland's dirt road (outer ring and inner corners) and its natural pond.
  function paintWildShapes() {
    const shape = (chars, pieces) => {
      const same = (col, row) => chars.includes(at(col, row));
      for (let row = 0; row < height; row += 1) {
        for (let col = 0; col < width; col += 1) {
          if (!same(col, row)) continue;
          [0, 1].forEach((qy) =>
            [0, 1].forEach((qx) => {
              const sx = qx ? 1 : -1;
              const sy = qy ? 1 : -1;
              const h = same(col + sx, row);
              const v = same(col, row + sy);
              const d = same(col + sx, row + sy);
              draw(pieces({ h, v, d, qx, qy, roll: hash(col, row) }), col, row, { quarter: [qx, qy] });
            }),
          );
          if (TINT[at(col, row)]) {
            context.fillStyle = TINT[at(col, row)];
            context.fillRect(col * D, row * D, D + 0.5, D + 0.5);
          }
        }
      }
    };
    shape('~b', ({ h, v, qx, qy }) => `pond${h && v ? 4 : h ? (qy ? 7 : 1) : v ? (qx ? 5 : 3) : qy ? (qx ? 8 : 6) : qx ? 2 : 0}`);
    shape('=:mb', ({ h, v, d, qx, qy, roll }) => {
      if (h && v && d) return `road-c${roll % 4}`;
      if (h && v) return qy ? (qx ? 'road-in-br' : 'road-in-bl') : qx ? 'road-in-tr' : 'road-in-tl';
      if (h) return qy ? 'road-b' : 'road-t';
      if (v) return qx ? 'road-r' : 'road-l';
      return qy ? (qx ? 'road-br' : 'road-bl') : qx ? 'road-tr' : 'road-tl';
    });
  }

  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col < width; col += 1) {
      const char = at(col, row);
      if (char === 'b') draw(wild && cell('wplanks') !== undefined ? 'wplanks' : 'planks', col, row);
      else if (char === 'W') draw('stone', col, row);
      else if (char === 'T' || char === 'x') {
        // The forest floor under the trees (sceneMap draws the trees).
        context.fillStyle = char === 'x' ? 'rgba(30, 20, 40, .4)' : `rgba(12, 32, 14, ${0.22 + (hash(col, row) % 5) * 0.03})`;
        context.fillRect(col * D, row * D, D + 0.5, D + 0.5);
      } else if (char === '"') {
        // Undergrowth: tufted grass (wild), or a light shade in town.
        if (wild && cell('wgrass3') !== undefined) draw('wgrass3', col, row);
        else {
          context.fillStyle = 'rgba(20, 45, 20, .18)';
          context.fillRect(col * D, row * D, D + 0.5, D + 0.5);
        }
      }
    }
  }
  if (tone) {
    context.fillStyle = tone;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  return canvas;
}
