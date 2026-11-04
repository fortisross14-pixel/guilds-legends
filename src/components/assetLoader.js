// Resolves asset ids (src/data/assets.js) to something drawable, for both React
// and Phaser: the real file if it loads, else the borrowed file, else a
// placeholder canvas (a silhouette, soft shape or mood gradient). Results are cached per id for the session.
import { ASSET_GROUPS, assetFor } from '../data/assets.js';

const cache = new Map();
const settled = new Map();

/** Absolute URL of a public file, safe under the GitHub Pages subpath. */
export function publicUrl(path) {
  const relative = `${import.meta.env.BASE_URL}${path}`;
  return typeof document === 'undefined' ? relative : new URL(relative, document.baseURI).href;
}

function probe(path) {
  if (!path || typeof Image === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image.naturalWidth > 0 ? image : null);
    image.onerror = () => resolve(null);
    image.src = publicUrl(path);
  });
}

function fitFont(context, text, maxWidth, start, family) {
  let size = start;
  context.font = `600 ${size}px ${family}`;
  while (size > 6 && context.measureText(text).width > maxWidth) {
    size -= 1;
    context.font = `600 ${size}px ${family}`;
  }
  return size;
}

// Placeholders that look intentional (DESIGN.md, Placeholders): people are
// silhouettes in their role or class colour, props and buildings are soft
// shapes, backdrops are mood gradients. The asset id is painted on top only
// when the "Show asset ids" developer setting is on.
let showIds = false;

/** Turns the asset-id labels on placeholders on or off (Settings → Developer). Repaints them. */
export function setShowAssetIds(on) {
  if (showIds === Boolean(on)) return;
  showIds = Boolean(on);
  [...settled.entries()].forEach(([id, result]) => {
    if (result.placeholder) {
      settled.delete(id);
      cache.delete(id);
    }
  });
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('gol:assets'));
}

function hashHue(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(hash);
}

// Muted role and class colours for silhouettes (an asset can set its own `tint`).
const TINTS = ['#8a6a3c', '#5f7d8f', '#7a5a86', '#6f8a5a', '#8f5d4f', '#5c6f9c', '#9a7f4a', '#6a7a72'];
const ROLE_TINTS = [
  [/innkeep|tavern|bar/i, '#a0703a'],
  [/merchant|shop|supply|trader/i, '#b08a3e'],
  [/clerk|herald|registrar|archiv|scholar|monk|keeper/i, '#5f78a8'],
  [/referee|champion|duelist|fighter|guard|captain|warrior/i, '#a4553f'],
  [/hunter|ranger|warden|scout/i, '#5f8a4f'],
  [/cleric|healer|herbal/i, '#8fae8a'],
  [/mage|spark|psychic/i, '#8a63b0'],
  [/courier|traveler|traveller|visitor|stranger/i, '#7d8a92'],
];
function tintFor(asset) {
  if (asset.tint) return asset.tint;
  const text = `${asset.id} ${asset.use || ''}`;
  const role = ROLE_TINTS.find(([pattern]) => pattern.test(text));
  return role ? role[1] : TINTS[hashHue(asset.id) % TINTS.length];
}

// Mood gradients per backdrop group: [top, bottom, glow].
const MOODS = {
  bg: ['#1b2436', '#0d0f16', 'rgba(246, 210, 140, .16)'],
  interior: ['#3a2618', '#120c0a', 'rgba(255, 190, 110, .22)'],
  battle: ['#3a1e22', '#0e0a0d', 'rgba(230, 120, 90, .18)'],
  room: ['#2c2030', '#0f0b12', 'rgba(255, 200, 150, .18)'],
  town: ['#22352a', '#0b120e', 'rgba(220, 230, 160, .14)'],
};

function paintSilhouette(context, width, height, color, kind) {
  const cx = width / 2;
  const ground = context.createLinearGradient(0, 0, 0, height);
  ground.addColorStop(0, kind === 'portrait' ? '#24202c' : 'rgba(0,0,0,0)');
  ground.addColorStop(1, kind === 'portrait' ? '#0e0c12' : 'rgba(0,0,0,0)');
  context.fillStyle = ground;
  context.fillRect(0, 0, width, height);
  context.fillStyle = color;
  context.globalAlpha = 0.92;
  if (kind === 'enemy') {
    // A crouched beast: body, head, two ears.
    context.beginPath();
    context.ellipse(cx, height * 0.66, width * 0.36, height * 0.24, 0, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.ellipse(cx + width * 0.26, height * 0.42, width * 0.17, height * 0.17, 0, 0, Math.PI * 2);
    context.fill();
  } else {
    // A person: head and shoulders (bust for portraits, full figure for sprites).
    const portrait = kind === 'portrait';
    const headR = portrait ? width * 0.17 : width * 0.2;
    const headY = portrait ? height * 0.38 : height * 0.2;
    context.beginPath();
    context.arc(cx, headY, headR, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    const top = headY + headR * 1.05;
    const shoulder = portrait ? width * 0.36 : width * 0.32;
    context.moveTo(cx - shoulder, portrait ? height : height * 0.98);
    context.quadraticCurveTo(cx - shoulder, top, cx, top);
    context.quadraticCurveTo(cx + shoulder, top, cx + shoulder, portrait ? height : height * 0.98);
    context.closePath();
    context.fill();
  }
  // Rim light from above.
  context.globalAlpha = 0.35;
  const rim = context.createLinearGradient(0, 0, 0, height);
  rim.addColorStop(0, 'rgba(255, 240, 210, .9)');
  rim.addColorStop(0.5, 'rgba(255, 240, 210, 0)');
  context.globalCompositeOperation = 'source-atop';
  context.fillStyle = rim;
  context.fillRect(0, 0, width, height);
  context.globalCompositeOperation = 'source-over';
  context.globalAlpha = 1;
}

function paintShape(context, width, height, color, kind) {
  const r = Math.min(width, height) * 0.18;
  const pad = Math.max(2, Math.min(width, height) * 0.06);
  context.fillStyle = color;
  context.globalAlpha = 0.85;
  context.beginPath();
  if (kind === 'crest') {
    // A heraldic shield with a brass rim.
    const w = width - pad * 2;
    const h = height - pad * 2;
    context.globalAlpha = 1;
    context.fillStyle = '#c9a05a';
    context.moveTo(pad + w / 2, pad);
    context.lineTo(pad + w, pad + h * 0.14);
    context.lineTo(pad + w, pad + h * 0.5);
    context.quadraticCurveTo(pad + w, pad + h * 0.86, pad + w / 2, pad + h);
    context.quadraticCurveTo(pad, pad + h * 0.86, pad, pad + h * 0.5);
    context.lineTo(pad, pad + h * 0.14);
    context.closePath();
    context.fill();
    context.fillStyle = color;
    context.beginPath();
    const i = Math.max(2, w * 0.08);
    context.moveTo(pad + w / 2, pad + i);
    context.lineTo(pad + w - i, pad + h * 0.17);
    context.lineTo(pad + w - i, pad + h * 0.5);
    context.quadraticCurveTo(pad + w - i, pad + h * 0.82, pad + w / 2, pad + h - i * 1.4);
    context.quadraticCurveTo(pad + i, pad + h * 0.82, pad + i, pad + h * 0.5);
    context.lineTo(pad + i, pad + h * 0.17);
    context.closePath();
    context.fill();
  } else if (kind === 'building') {
    // A house: walls and a pitched roof, a lit door.
    const wallTop = height * 0.42;
    context.moveTo(pad, wallTop);
    context.lineTo(width / 2, pad);
    context.lineTo(width - pad, wallTop);
    context.lineTo(width - pad, height - pad);
    context.lineTo(pad, height - pad);
    context.closePath();
    context.fill();
    context.globalAlpha = 0.9;
    context.fillStyle = 'rgba(255, 210, 140, .55)';
    context.fillRect(width / 2 - width * 0.08, height - pad - height * 0.24, width * 0.16, height * 0.24);
  } else {
    context.roundRect?.(pad, pad + height * 0.12, width - pad * 2, height - pad * 2 - height * 0.12, r);
    if (!context.roundRect) context.rect(pad, pad + height * 0.12, width - pad * 2, height - pad * 2 - height * 0.12);
    context.fill();
  }
  context.globalAlpha = 1;
  const shade = context.createLinearGradient(0, 0, 0, height);
  shade.addColorStop(0, 'rgba(255, 240, 210, .18)');
  shade.addColorStop(1, 'rgba(0, 0, 0, .35)');
  context.globalCompositeOperation = 'source-atop';
  context.fillStyle = shade;
  context.fillRect(0, 0, width, height);
  context.globalCompositeOperation = 'source-over';
}

function paintMood(context, width, height, mood) {
  const [top, bottom, glow] = mood;
  const base = context.createLinearGradient(0, 0, 0, height);
  base.addColorStop(0, top);
  base.addColorStop(1, bottom);
  context.fillStyle = base;
  context.fillRect(0, 0, width, height);
  const light = context.createRadialGradient(width * 0.5, height * 0.38, 0, width * 0.5, height * 0.38, Math.max(width, height) * 0.6);
  light.addColorStop(0, glow);
  light.addColorStop(1, 'rgba(0,0,0,0)');
  context.fillStyle = light;
  context.fillRect(0, 0, width, height);
  // A soft horizon so a backdrop reads as a place.
  context.fillStyle = 'rgba(0, 0, 0, .22)';
  context.fillRect(0, height * 0.72, width, height * 0.28);
}

function paintIdLabel(context, asset, width, height, ink) {
  const family = 'Manrope, system-ui, sans-serif';
  const pad = Math.max(4, width * 0.06);
  const idSize = fitFont(context, asset.id, width - pad * 2, Math.max(10, Math.min(40, Math.round(height / 6))), family);
  if (idSize <= 6) return;
  context.fillStyle = ink;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.shadowColor = 'rgba(0,0,0,.8)';
  context.shadowBlur = 4;
  context.fillText(asset.id, width / 2, height / 2);
  context.shadowBlur = 0;
}

/** Draws a placeholder for an asset that has no file yet. */
export function paintPlaceholder(asset) {
  if (asset.tiles) return paintTileset(asset);
  const group = ASSET_GROUPS[asset.group] || ASSET_GROUPS.missing;
  const scale = Math.max(1, Math.min(4, Math.ceil(160 / Math.max(asset.w, asset.h))));
  const width = Math.round(asset.w * scale);
  const height = Math.round(asset.h * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  const color = tintFor(asset);
  if (MOODS[asset.group]) paintMood(context, width, height, MOODS[asset.group]);
  else if (['char', 'npc', 'battler'].includes(asset.group)) paintSilhouette(context, width, height, color, 'figure');
  else if (asset.group === 'portrait') paintSilhouette(context, width, height, color, 'portrait');
  else if (asset.group === 'enemy') paintSilhouette(context, width, height, '#5a3a32', 'enemy');
  else if (asset.group === 'building') paintShape(context, width, height, color, 'building');
  else if (asset.group === 'crest') paintShape(context, width, height, '#8a2a36', 'crest');
  else paintShape(context, width, height, asset.group === 'missing' ? group.fill : color, 'prop');
  if (showIds || asset.group === 'missing') paintIdLabel(context, asset, width, height, group.ink);
  return canvas;
}

/** A tileset placeholder: one flat-colored tile per entry, exact size, with a little texture and its character. */
function paintTileset(asset) {
  const size = asset.h;
  const canvas = document.createElement('canvas');
  canvas.width = asset.tiles.length * size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  asset.tiles.forEach((tile, index) => {
    const x = index * size;
    context.fillStyle = tile.color;
    context.fillRect(x, 0, size, size);
    // Deterministic speckle so large areas read as ground, not flat paint.
    for (let i = 0; i < 6; i += 1) {
      const sx = x + ((index * 7 + i * 11) % (size - 4)) + 2;
      const sy = ((index * 13 + i * 5) % (size - 4)) + 2;
      context.fillStyle = i % 2 ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.14)';
      context.fillRect(sx, sy, 3, 2);
    }
    if (tile.block) {
      context.strokeStyle = 'rgba(0,0,0,.35)';
      context.lineWidth = 2;
      context.strokeRect(x + 1, 1, size - 2, size - 2);
    }
  });
  return canvas;
}

/**
 * Loads an asset by id. Resolves to { id, asset, url, image, canvas, placeholder }:
 * `image` is a loaded HTMLImageElement for real or borrowed art; otherwise
 * `canvas` holds the placeholder and `url` is its data URL.
 */
export function loadAsset(id) {
  if (cache.has(id)) return cache.get(id);
  const asset = assetFor(id);
  const promise = (async () => {
    const image = (await probe(asset.path)) || (await probe(asset.borrow));
    let result;
    if (image) result = { id, asset, url: image.src, image, canvas: null, placeholder: false, borrowed: !image.src.endsWith(asset.path) };
    else if (typeof document === 'undefined') result = { id, asset, url: null, image: null, canvas: null, placeholder: true };
    else {
      const canvas = paintPlaceholder(asset);
      result = { id, asset, url: canvas.toDataURL('image/png'), image: null, canvas, placeholder: true };
    }
    settled.set(id, result);
    return result;
  })();
  cache.set(id, promise);
  return promise;
}

/** The loaded result for an id, if it has already settled (sync). */
export function peekAsset(id) {
  return settled.get(id) || null;
}
