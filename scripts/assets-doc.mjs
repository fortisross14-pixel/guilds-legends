// Writes docs/ASSETS.md from the asset registry (src/data/assets.js).
// Run: node scripts/assets-doc.mjs
import fs from 'node:fs';
import { ASSETS, ASSET_GROUPS } from '../src/data/assets.js';

let md = `# Asset list

Every visual asset the game asks for, registered by id in [src/data/assets.js](../src/data/assets.js). Paths are relative to \`public/\`. This file is generated: run \`node scripts/assets-doc.mjs\` after changing the registry.

How it works: the loader uses the file at **Path** if it exists; otherwise **Borrows** (older shared art standing in); otherwise it draws a placeholder that looks intentional: a silhouette for people and enemies, a soft shape for props and buildings, a shield for crests, a mood gradient for backdrops (Settings → Developer → Show asset ids writes the id on it). Drop a file at the path and it is picked up with no code change. Status: *placeholder* = no file yet, *borrowed* = using older shared art, *ready* = dedicated file exists.

Walkable art (towns, wild areas) is generated from the place data in \`src/data/towns/\` and \`src/data/wilds/\`: every building, person, portrait, prop and enemy group placed there gets an entry. Building fronts are 5×5 tiles (160×160) with the door at the bottom centre; props are drawn one tile taller than their footprint. The ground tileset is one row of 32 px tiles in the order of \`src/data/tiles.js\`.

Phase 7 will add style notes and generation prompts for each entry.
`;
const groups = {};
Object.values(ASSETS).forEach((asset) => (groups[asset.group] ||= []).push(asset));
Object.entries(groups).forEach(([group, list]) => {
  md += `\n## ${ASSET_GROUPS[group].label} (\`${group}\`, placeholder ${ASSET_GROUPS[group].fill})\n\n| Id | Path | Size | Borrows | Status | Used for |\n|---|---|---|---|---|---|\n`;
  list.forEach((asset) => {
    const status = fs.existsSync(`public/${asset.path}`) ? 'ready' : asset.borrow ? 'borrowed' : 'placeholder';
    md += `| \`${asset.id}\` | \`${asset.path}\` | ${asset.w}×${asset.h} | ${asset.borrow ? `\`${asset.borrow}\`` : '—'} | ${status} | ${asset.use} |\n`;
  });
});
md += `\n## Not yet routed through the registry\n\nHero portraits and battle sprites (\`art/portraits\`, \`art/sprites\`), enemy battle sprites (\`art/enemies\`), effects (\`art/effects\`) and primal grounds (\`art/primals\`) still load by path. They move into the registry in later phases.\n`;
fs.writeFileSync('docs/ASSETS.md', md);
console.log(`${Object.keys(ASSETS).length} assets written to docs/ASSETS.md`);
