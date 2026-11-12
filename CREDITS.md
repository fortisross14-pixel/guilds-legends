# Credits

The same list appears in the game: World orb → System → Credits (`src/hud/CreditsScreen.jsx`).

## Icons

- **game-icons.net** — game-concept icons (swords, crown, scroll, tavern mug, primals and more), licensed under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). Authors:
  - **Lorc** (https://lorcblog.blogspot.com): world, open book, broadsword, scroll, crown, tavern stein, wooden sign, crossed swords, swap bag, hunting horn, quill, star swirl, flying flag, claw hammer, skulls, oak, hourglass, treasure map, trophy, laurel crown, potion, bandage roll, boot prints, anvils, whirlwind, three leaves, wolf head, psychic waves, heart, locked chest, campfire, gem pendant, conversation.
  - **Delapouite** (https://delapouite.com): castle, two coins, bed, village, three friends, book cover, desk, exit door, camping tent.
  - **Sbed**: fire, health cross, shield, water drop.
  - Source: https://github.com/game-icons/icons. Shapes are recoloured (engraved brass) and used unchanged otherwise.
- **Phosphor Icons** — system icons (gear, calendar, envelope, eye, lock, check, carets, close, question, info, save, speaker, list, map pin, hand, arrows), "bold" weight, [MIT License](https://github.com/phosphor-icons/core/blob/main/LICENSE), © Phosphor Icons.

The icon shapes live in `src/components/iconPaths.js` and are drawn by `src/components/Icon.jsx`.

## Fonts

- **Cormorant Garamond** by Christian Thalmann (Catharsis Fonts), [SIL Open Font License 1.1](https://openfontlicense.org).
- **Manrope** by Mikhail Sharanda, [SIL Open Font License 1.1](https://openfontlicense.org).

Both are loaded from Google Fonts.

## Art test pack

- **2D Hand Painted - Town Tileset** and **2D Hand Painted - Interior Tileset** (Unity Asset Store): the ground, buildings, props and rooms in `public/art/packs/myart/`; **2D Hand Painted - Grassland Tileset** and **Extra Objects**: the wild ground, trees, rocks, camps. **GUI PRO Kit - Fantasy RPG** by Layer Lab (Unity Asset Store): buttons, frames, bars, the joystick, the Josefin Sans font (SIL OFL; titles and text use Cinzel and Alegreya Sans from Google Fonts) in `public/art/packs/myart/gui` and `fonts`. **HeroEditor / Fantasy Heroes** by Hippo (Unity Asset Store): the walking characters in `public/art/packs/myart/chars`, assembled from its body parts and equipment. All three under the Unity Asset Store EULA (Standard): used inside this game, not redistributed; the repository is private for that reason. Imported by `scripts/art/import_myart.py` from the private art repository.

## Code

- **React** (MIT), **Vite** (MIT), **Phaser** (MIT).
