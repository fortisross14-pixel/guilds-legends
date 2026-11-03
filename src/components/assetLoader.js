// Resolves asset ids (src/data/assets.js) to something drawable, for both React
// and Phaser: the real file if it loads, else the borrowed file, else a
// labelled placeholder canvas. Results are cached per id for the session.
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

/**
 * Draws a placeholder: the group's color, diagonal hatching, a border, the id
 * and the pixel size. Small sprites are painted at a higher scale so the
 * label stays legible when shown at their logical size.
 */
export function paintPlaceholder(asset) {
  const group = ASSET_GROUPS[asset.group] || ASSET_GROUPS.missing;
  const scale = Math.max(1, Math.min(4, Math.ceil(160 / Math.max(asset.w, asset.h))));
  const width = Math.round(asset.w * scale);
  const height = Math.round(asset.h * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  context.fillStyle = group.fill;
  context.fillRect(0, 0, width, height);
  context.strokeStyle = 'rgba(0,0,0,.18)';
  context.lineWidth = Math.max(2, Math.min(width, height) / 40);
  const step = Math.max(12, Math.min(width, height) / 6);
  for (let x = -height; x < width; x += step) {
    context.beginPath();
    context.moveTo(x, height);
    context.lineTo(x + height, 0);
    context.stroke();
  }
  const border = Math.max(2, Math.round(Math.min(width, height) / 60));
  context.strokeStyle = group.ink;
  context.globalAlpha = 0.7;
  context.lineWidth = border;
  context.strokeRect(border / 2, border / 2, width - border, height - border);
  context.globalAlpha = 1;
  const family = 'Manrope, system-ui, sans-serif';
  const pad = Math.max(4, width * 0.06);
  const idSize = fitFont(context, asset.id, width - pad * 2, Math.max(10, Math.min(48, Math.round(height / 5))), family);
  if (idSize > 6) {
    context.fillStyle = group.ink;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.shadowColor = 'rgba(0,0,0,.55)';
    context.shadowBlur = 4;
    context.fillText(asset.id, width / 2, height / 2 - (height > 60 ? idSize * 0.5 : 0));
    if (height > 60) {
      const meta = `${group.label} · ${asset.w}×${asset.h}`;
      fitFont(context, meta, width - pad * 2, Math.round(idSize * 0.6), family);
      context.globalAlpha = 0.8;
      context.fillText(meta, width / 2, height / 2 + idSize * 0.75);
      context.globalAlpha = 1;
    }
  }
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
