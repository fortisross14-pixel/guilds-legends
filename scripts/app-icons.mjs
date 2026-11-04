// Renders the guild crest into the home-screen icons (public/icons/*.png) used by
// public/manifest.webmanifest and the iOS apple-touch-icon. Run: node scripts/app-icons.mjs
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const crest = (inner) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <defs>
    <radialGradient id="g" cx="50%" cy="35%" r="70%"><stop offset="0" stop-color="#2a2230"/><stop offset="1" stop-color="#0b0c12"/></radialGradient>
    <linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6dc9a"/><stop offset=".55" stop-color="#c9a05a"/><stop offset="1" stop-color="#7d5a26"/></linearGradient>
    <linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a2232"/><stop offset="1" stop-color="#3a0f18"/></linearGradient>
  </defs>
  <rect width="100" height="100" fill="url(#g)"/>
  <g transform="translate(50 50) scale(${inner}) translate(-20 -23)">
    <path d="M20 1.5 37 7v13.5C37 32 29.5 40.5 20 44.5 10.5 40.5 3 32 3 20.5V7z" fill="url(#b)"/>
    <path d="M20 5 33.5 9.6v11c0 9.6-6 16.8-13.5 20.3C12.5 37.4 6.5 30.2 6.5 20.6v-11z" fill="url(#f)"/>
    <path d="M20 10.5l2.3 7.2 7.2 2.3-7.2 2.3L20 29.5l-2.3-7.2-7.2-2.3 7.2-2.3z" fill="#fff1cf"/>
    <circle cx="20" cy="20" r="2.2" fill="#f6dc9a"/>
  </g>
</svg>`;

const icons = [
  ['icon-192.png', 192, 1.55],
  ['icon-512.png', 512, 1.55],
  ['icon-maskable-512.png', 512, 1.15], // the crest inside the maskable safe zone
  ['apple-touch-icon.png', 180, 1.55],
];

mkdirSync('public/icons', { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
for (const [name, size, scale] of icons) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:#0b0c12">${crest(scale)}</body></html>`);
  await page.screenshot({ path: `public/icons/${name}`, omitBackground: false });
  console.log('wrote', name);
}
await browser.close();
