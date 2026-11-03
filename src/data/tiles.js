// Ground tiles for walkable towns and wild areas. Layouts in src/data/towns and
// src/data/wilds are rows of these characters. The tileset image
// (asset 'tiles.ground', src/data/assets.js) is one row of 32 px tiles in this order.

export const TILE_SIZE = 32;

/** In tileset order. `block` tiles cannot be walked on. */
export const TILES = [
  { char: '.', id: 'grass', color: '#4f7a45' },
  { char: ',', id: 'meadow', color: '#6f9a4e' },
  { char: '=', id: 'cobbles', color: '#8a7d68' },
  { char: ':', id: 'dirt', color: '#8a6a45' },
  { char: '#', id: 'plaza', color: '#a39274' },
  { char: '~', id: 'water', color: '#2f5f7a', block: true },
  { char: 'b', id: 'bridge', color: '#7a5634' },
  { char: 'T', id: 'trees', color: '#24452c', block: true },
  { char: 'W', id: 'wall', color: '#4a4650', block: true },
  { char: '"', id: 'undergrowth', color: '#3c5e35' },
  { char: 'x', id: 'deadwood', color: '#2c2730', block: true },
  { char: 'm', id: 'mud', color: '#5a4a3a' },
];

export const TILE_BY_CHAR = Object.fromEntries(TILES.map((tile, index) => [tile.char, { ...tile, index }]));

/**
 * Rows are written as chunks of ten characters so columns are easy to count.
 * Each row is padded with grass (or cut) to `width`.
 */
export function rows(width, ...chunks) {
  return chunks.map((row) => {
    const text = Array.isArray(row) ? row.join('') : row;
    return text.length >= width ? text.slice(0, width) : text + '.'.repeat(width - text.length);
  });
}
