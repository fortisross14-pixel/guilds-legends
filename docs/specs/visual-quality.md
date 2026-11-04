# Spec: visual quality (card template, design-first menus, interior staging)

From the author's playtest 2 (2026-11-04): "Still too much text. Menus are still AI slop, not just because of the text. The tavern characters' size and position should never have passed."

Root cause: screens were built from text descriptions and checked by the same agent that built them. This spec adds:
- a fixed card template (so text can't creep back)
- a design-first process (mockup → UI kit → build to match → independent review)
- measurable rules for staging characters in painted interiors

## 1. The card template (all actionable screens)
Every screen where the player decides something (sign up, accept a contract, hire, build, buy) uses one card:

```
[ illustrated header: banner/art for the thing (asset id; placeholder = mood gradient + big icon) ]
  Title                          (display font, one line)
  ◆ Prize 260 G    (gold chip)
  ◆ Fee 35 G       (red chip)
  ◆ Starts in 7 wk (blue chip)
  ◆ Team up to 2   (neutral chip)
  [        SIGN UP        ]      (one big primary button)
  Details ›                      (everything else, on tap)
```

- **At most 4 fact chips:** icon plus value plus a short label, color-coded by meaning everywhere in the game (gold = money in, red = cost, blue = time, green = gain/heal, purple = rarity/fame).
- **One primary button.** Secondary actions go in Details.
- **No sentences on the card.** A single quote line from a person is allowed only in dialogue, not on cards.
- **Details** opens a bottom panel with the full rules, history and requirements.
- **Lists of other options go in another tab**, not below the card. For example, the arena has a tab per thing (Sign up / Other tournaments / History). Never a long scroll mixing them.

Apply it to: the arena sign-up, contract offers and the notice board, the recruit offer, building a room, shop items, travel (world map card), and the victory, mission and defeat results (playtest-1-feedback §4). **Target: under 20 words on any card's first view.**

## 2. Design first: mockups, a UI kit, then build
1. **Mockups:** the author generates (or approves) mockups for 4 key screens in the approved HD-2D art style: arena sign-up, contract card, victory screen, Party. They go in `docs/design/mockups/` and are the reference. **No screen in this list is rebuilt before its mockup is approved.**
2. **UI kit:** from the approved mockups, produce reusable raster assets (use the `impeccable-asset-producer` agent, or the author's art tool) and save them in `public/ui/kit/`:
   - panel frames (9-slice)
   - card header frames
   - primary and secondary button skins
   - chip backgrounds
   - dividers and corner ornaments
   - tab skins
   - a parchment texture and a dark wood/metal texture
   
   Add each as an asset id in docs/ASSETS.md.
3. **Build to match:** rebuild the menus with the kit (CSS `border-image` for 9-slice frames, background textures, the card template). Replace the placeholder "person blobs" with portraits or silhouettes, and give every card an illustrated header (asset id; a mood gradient plus a large icon until art exists).
4. **Independent review:** after building, run the `impeccable-finish-reviewer` agent (or a fresh agent that didn't build it) on phone and desktop screenshots against the mockups. Fix its findings before marking done.

## 3. Staging characters in painted interiors
Rules (measurable, and checked in screenshots):
- **Scale:** characters use the large sprite set (battle/portrait-quality sprites, not the 26×36 walking sprites). A standing adult is **14–18% of the painting's height** (about the height of a door frame's upper half); seated or behind-counter characters show proportionally.
- **Feet on the floor:** each spot's y is where the feet touch the floor, the sprite anchors bottom-center, and a soft shadow sits under the feet.
- **Depth:** tables, the bar and counters have a foreground mask (a cut-out layer or a per-spot clip line), so someone behind the bar shows only from the waist up, and nobody floats in front of furniture they should be behind. Characters lower on the screen are drawn in front of those higher up.
- **Placement:** spots sit where a person would plausibly be (behind the bar, on a chair, at the desk, by the hearth), never in the middle of a wall, a shelf or the air. Each painting has its own hand-placed spots in `src/data/interiors.js` (percent coordinates).
- **Labels:** name and offer badges float just above the head, never overlapping another character or a hotspot. They hide while a dialogue is open.
- **Hotspots** (shelves, boards, door) are invisible tap areas with a subtle glow on hover and focus, plus a small icon chip.

### Layout editor (developer setting)
Add System → Settings → Developer → "Edit interior layout" (off by default). In an interior it shows every spot and hotspot as a draggable handle over the painting, with its id. The author drags them into place, and "Copy layout" puts the updated coordinates for that interior on the clipboard as JSON, ready to paste into `src/data/interiors.js`. This lets the author fix placement directly.

## 4. Acceptance
- Card screens: every card is under 20 words on first view, with one primary button, chips color-coded consistently, and other options in tabs.
- Interiors: for every painted interior, a phone and a desktop screenshot showing each character at the right scale, feet on the floor and none floating, reviewed independently.
- Menus in the mockup list match their mockups, as judged by the independent reviewer, with its findings fixed.
