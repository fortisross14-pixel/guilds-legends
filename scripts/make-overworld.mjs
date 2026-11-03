/* global document */
// Paints the pixel overworld behind the World map (public/ui/overworld.png).
// Seeded and deterministic: land grows around the real location coordinates,
// and each area takes the terrain of its nearest settlement's primal.
// Run: node scripts/make-overworld.mjs   (needs the local Chrome used by Playwright)
import fs from 'fs';
import { chromium } from 'playwright';
import { LOCATIONS } from '../src/data/world.js';
import { BLACKWOOD_MAP } from '../src/data/story.js';

const W = 200;
const H = 125;
const sites = [
  ...LOCATIONS.map((l) => ({ x: l.x, y: l.y, biome: l.primal })),
  { x: BLACKWOOD_MAP.x, y: BLACKWOOD_MAP.y, biome: 'Blackwood' },
];

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage();
const dataUrl = await page.evaluate(
  ({ W, H, sites }) => {
    const hash = (x, y, s = 0) => {
      let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
      h = Math.imul(h ^ (h >>> 13), 1274126177);
      return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
    };
    const smooth = (t) => t * t * (3 - 2 * t);
    const noise = (x, y, scale, s) => {
      const gx = x / scale;
      const gy = y / scale;
      const x0 = Math.floor(gx);
      const y0 = Math.floor(gy);
      const fx = smooth(gx - x0);
      const fy = smooth(gy - y0);
      const a = hash(x0, y0, s);
      const b = hash(x0 + 1, y0, s);
      const c = hash(x0, y0 + 1, s);
      const d = hash(x0 + 1, y0 + 1, s);
      return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
    };
    const fbm = (x, y, s) => noise(x, y, 24, s) * 0.55 + noise(x, y, 10, s + 7) * 0.3 + noise(x, y, 4, s + 13) * 0.15;
    const pts = sites.map((site) => ({ ...site, px: (site.x / 100) * W, py: (site.y / 100) * H }));
    const land = [];
    const biome = [];
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        let best = Infinity;
        let near = null;
        let score = 0;
        // Warp the lookup point so region borders wander like real terrain.
        const wx = x + (noise(x, y, 9, 41) - 0.5) * 22;
        const wy = y + (noise(x, y, 9, 59) - 0.5) * 22;
        for (const p of pts) {
          const d = Math.hypot(x - p.px, y - p.py);
          score = Math.max(score, 1 - d / 30);
          const dw = Math.hypot(wx - p.px, wy - p.py);
          if (dw < best) {
            best = dw;
            near = p;
          }
        }
        const n = fbm(x, y, 3);
        land.push(score + (n - 0.5) * 0.75 > 0.34);
        biome.push(near.biome);
      }
    }
    const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? false : land[y * W + x]);
    const PAL = {
      Fire: ['#c98a4b', '#b4703d', '#d9a35e'],
      Plant: ['#3f9a3c', '#348a33', '#1f5f25'],
      Water: ['#76b85a', '#62a24b', '#3f8a3a'],
      Air: ['#8c9cb2', '#a9b9cc', '#e8f0f8'],
      Iron: ['#8a8578', '#77736a', '#5e5b55'],
      Animal: ['#a8ae4c', '#959c3f', '#7a8233'],
      Psychic: ['#8c6aa8', '#7a5a96', '#5d4377'],
      Blackwood: ['#24452a', '#1b3820', '#11261a'],
    };
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d');
    const put = (x, y, color) => {
      g.fillStyle = color;
      g.fillRect(x, y, 1, 1);
    };
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (!land[i]) {
          let shore = 9;
          for (let r = 1; r <= 3 && shore === 9; r++) {
            if (at(x + r, y) || at(x - r, y) || at(x, y + r) || at(x, y - r)) shore = r;
          }
          const wave = hash(x, y, 91) < 0.03 && shore > 2;
          put(x, y, shore === 1 ? '#5f93e0' : shore <= 3 ? '#3a64c4' : wave ? '#5599ff' : (x + y) % 2 && hash(x, y, 5) < 0.5 ? '#203f9a' : '#1c3688');
          continue;
        }
        const b = biome[i];
        const p = PAL[b];
        const coast = !at(x + 1, y) || !at(x - 1, y) || !at(x, y + 1) || !at(x, y - 1);
        if (coast && b !== 'Air' && b !== 'Blackwood') {
          put(x, y, '#e6d59a');
          continue;
        }
        // Patchy tones (low-frequency noise) with a light pixel dither.
        const n = noise(x, y, 4, 17) + (hash(x, y, 17) - 0.5) * 0.18;
        put(x, y, n < 0.45 ? p[0] : n < 0.72 ? p[1] : p[2]);
      }
    }
    // Trees for forests, peaks for mountains, rocks for iron hills.
    for (let y = 2; y < H - 2; y++) {
      for (let x = 2; x < W - 2; x++) {
        const i = y * W + x;
        if (!land[i] || !at(x + 1, y) || !at(x - 1, y) || !at(x, y + 1)) continue;
        const b = biome[i];
        const r = hash(x, y, 33);
        if ((b === 'Plant' || b === 'Blackwood') && r < 0.16 && (x + y) % 2 === 0) {
          put(x, y - 1, b === 'Blackwood' ? '#0b1a10' : '#1d5222');
          put(x, y, b === 'Blackwood' ? '#0b1a10' : '#1d5222');
          put(x - 1, y, b === 'Blackwood' ? '#132b18' : '#2a6e2c');
          put(x + 1, y, b === 'Blackwood' ? '#132b18' : '#2a6e2c');
          put(x, y + 1, '#4a3420');
        } else if ((b === 'Air' || b === 'Iron') && r < 0.05 && (x % 3 === 0)) {
          put(x, y - 1, b === 'Air' ? '#ffffff' : '#c9c4b8');
          put(x - 1, y, '#5b6577');
          put(x, y, '#5b6577');
          put(x + 1, y, '#3e4656');
          put(x - 2, y + 1, '#5b6577');
          put(x + 2, y + 1, '#3e4656');
        } else if (b === 'Fire' && r < 0.04) {
          put(x, y, '#8a3f2a');
          put(x + 1, y, '#a24d30');
        }
      }
    }
    return c.toDataURL('image/png');
  },
  { W, H, sites },
);
await browser.close();
fs.mkdirSync('public/ui', { recursive: true });
fs.writeFileSync('public/ui/overworld.png', Buffer.from(dataUrl.split(',')[1], 'base64'));
console.log('wrote public/ui/overworld.png');
