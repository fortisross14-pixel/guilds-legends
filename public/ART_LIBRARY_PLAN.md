# Guilds of Legend — PUBLIC/ ART PLAN

## Scope of this update
The `public/` directory in this ZIP is a complete replacement for the supplied `public.zip` folder, preserving `crest.svg` and the existing core asset filenames.

Production image library:
- `art/portraits/`: 8 matched-class portraits + 3 legacy aliases
- `art/sprites/`: 8 matched-class full-body sprites + 3 legacy aliases
- `art/enemies/`: 16 independent enemy sprites
- `art/effects/`: 14 transparent primal/combat effects
- `art/scenes/`: 12 detailed opaque environment backgrounds
- `art/primals/`: 7 subtle compositing backgrounds
- `art/manifest.json`: asset inventory, dimensions, roles and mapping

## Design architecture (do not bake this into a single image)
**Class = portrait + matching combat character.** The same class picture works for any primal and rarity.
**Rarity = interface/CSS frame.** Common neutral, Uncommon green, Rare blue, Epic purple, Legend gold.
**Primal = background + VFX.** Fire, Water, Air, Plant, Animal, Psychic, Iron.
**Name/level/personality = text and data only.** Do not draw names or levels in the art.

## What you are seeing
The source art is high-detail HD-2D fantasy pixel art, not actual game-engine sprites with frame-by-frame animation. Characters remain static and effects are single-frame PNGs.
The portrait drawings are intentionally preserved as illustrated medallions, which contain some decorative gold edging; for a strict rarity-only frame, use a cropped artwork mask or a separate future unframed portrait pass.
For true interactive combat animation, use CSS transforms/opacity and later replace with multi-frame animations.

## Integration with the current repo
1. Save/commit the existing `public/` folder as a backup.
2. Merge the top-level `public/` directory from this ZIP over the project `public/` directory.
3. Keep the exact `scene_XX.png`, `enemy_XX.png`, and `effect_XX.png` references used in existing code.
4. Read `art/manifest.json` to map the eight classes to file names.
5. Use `art/primals/<primal>.png` as a background layer, CSS rarity frames as overlays, and `art/portraits/<class>.png` above them.
6. Render HD-2D scene backgrounds with `background-size: cover` and an explicit focal position. Use `object-fit: contain` for sprites/effects.
7. Avoid `image-rendering: pixelated` when reducing high-resolution HD-2D artwork to tiny avatars; compare `auto` at final display size.
8. Verify paths respect the Vite `base` setting when deployed under GitHub Pages; prefer `import.meta.env.BASE_URL` for public asset URLs.
9. Smoke test recruitment, formation, battle, enemy targeting, skill effects and scenes. This ZIP contains assets only: no app source code is edited.

## Quality constraints and future work
- All portrait/sprite/enemy/effect files are RGBA with transparent pixels.
- All scene images are opaque and scene ratios preserve the old 640×288 aspect.
- This is a curated high-quality **static art foundation**. It is not a complete animation sheet or unique artwork for every procedural hero.
- Character portraits and full-body sprite representations are matched by class archetype, not yet by individual hair/face variants.
- Effects are large single-frame VFX and may need motion/position tuning in combat.
- The numbered enemy IDs don't yet encode bestiary categories; assign art in combat based on enemy types when integrating.
- Future production: unique elite/boss variants; 2–4 portraits per class; item/equipment icons; scene region palette variants; alternate frame sets; dynamic UI motion.
