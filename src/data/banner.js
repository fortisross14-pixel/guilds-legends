// The guild's banner (made when the guild is founded, Prologue → Found your guild):
// a field pattern in one or two colours, and an emblem in its own colour. Shown on
// the Guild orb, in the Guild Hall and on the Guild screen (src/components/GuildBanner.jsx).

/** Field patterns; `colors` is how many field colours each takes. */
export const BANNER_PATTERNS = [
  { id: 'solid', name: 'Solid', colors: 1 },
  { id: 'pale', name: 'Pale (vertical stripe)', colors: 2 },
  { id: 'fess', name: 'Fess (horizontal stripe)', colors: 2 },
  { id: 'per-pale', name: 'Halves, side by side', colors: 2 },
  { id: 'per-fess', name: 'Halves, top and bottom', colors: 2 },
  { id: 'bend', name: 'Diagonal band', colors: 2 },
  { id: 'quarterly', name: 'Quarters', colors: 2 },
  { id: 'chevron', name: 'Chevron', colors: 2 },
];

/** Heraldic colours (tinctures). */
export const BANNER_COLORS = [
  { id: 'gules', name: 'Red', hex: '#a3242b' },
  { id: 'azure', name: 'Blue', hex: '#244c8f' },
  { id: 'vert', name: 'Green', hex: '#2f6b3a' },
  { id: 'purpure', name: 'Purple', hex: '#5d3477' },
  { id: 'sable', name: 'Black', hex: '#1f1b1a' },
  { id: 'or', name: 'Gold', hex: '#d9a93a' },
  { id: 'argent', name: 'Silver', hex: '#e4e1d8' },
  { id: 'tenne', name: 'Orange', hex: '#c0652a' },
  { id: 'murrey', name: 'Wine', hex: '#7a2342' },
  { id: 'brunatre', name: 'Brown', hex: '#6b4a2b' },
];

/** Emblems (icon names from src/components/iconPaths.js). */
export const BANNER_EMBLEMS = [
  { id: 'sword', name: 'Sword' },
  { id: 'swords', name: 'Crossed swords' },
  { id: 'lion', name: 'Lion' },
  { id: 'eagle', name: 'Eagle' },
  { id: 'animal', name: 'Wolf' },
  { id: 'fire', name: 'Flames' },
  { id: 'crown', name: 'Crown' },
  { id: 'star', name: 'Star' },
  { id: 'moon', name: 'Moon' },
  { id: 'tree', name: 'Oak' },
  { id: 'castle', name: 'Tower' },
  { id: 'anvil', name: 'Anvil' },
];

export const DEFAULT_BANNER = { pattern: 'per-pale', colors: ['gules', 'or'], emblem: 'lion', emblemColor: 'argent' };

export const colorHex = (id) => BANNER_COLORS.find((color) => color.id === id)?.hex || '#777';

/** A banner with every field valid (unknown values fall back to the default). */
export function cleanBanner(banner = {}) {
  const pattern = BANNER_PATTERNS.some((item) => item.id === banner.pattern) ? banner.pattern : DEFAULT_BANNER.pattern;
  const ok = (id) => BANNER_COLORS.some((item) => item.id === id);
  const colors = [ok(banner.colors?.[0]) ? banner.colors[0] : DEFAULT_BANNER.colors[0], ok(banner.colors?.[1]) ? banner.colors[1] : DEFAULT_BANNER.colors[1]];
  const emblem = BANNER_EMBLEMS.some((item) => item.id === banner.emblem) ? banner.emblem : DEFAULT_BANNER.emblem;
  const emblemColor = ok(banner.emblemColor) ? banner.emblemColor : DEFAULT_BANNER.emblemColor;
  return { pattern, colors, emblem, emblemColor };
}
