# Items: equipment and inventory — design

Two tabs, one chest.

- **Equipment** (Party → Equipment): what heroes wear. Weapons, armour and accessories. Each hero has
  three slots; tap an item to see who can wear it and the change; drag onto a hero (or tap
  "Give to…").
- **Inventory** (Party → Inventory): everything else, in three groups:
  - **Supplies**: potions, ethers, bombs (usable in battle and at the hall).
  - **Goods**: things to sell or hand in: wolf pelts, bandit daggers, herbs, liquor, dyes, ore.
  - **Keepsakes**: story and quest items: the Lantern's medal, the watch's token of trust, the
    faded papyrus, evidence. They can't be sold or dropped; a line says what each is for.

**Today:** one chest (`state.inventory`: item id → count), shops that buy and sell (selling returns half),
consumables and gear in `src/data/items.js`, random loot by tier. There are no goods or keepsakes,
and foes drop nothing of their own.

## Item kinds (data: `src/data/items.js`)

| kind | Where | Sell | Examples |
|---|---|---|---|
| `consumable` | Inventory → Supplies | half price | potion, ether, fire bomb |
| `weapon`, `armor`, `accessory` | Equipment | half price | rusty sword, wolfskin vest |
| `good` | Inventory → Goods | its `price` (full, it's what goods are for) | wolf pelt 6, bandit dagger 10, feverfew 4, liquor 8, ochre 15 |
| `keepsake` | Inventory → Keepsakes | never | watch's token, Lantern medal, papyrus |

Goods carry a `use` line ("Corwin pays for these. Tanners buy them."). Keepsakes carry `for`
("Show it to Prior Aubrey.").

## Gear levels (built)

Every piece of gear has a **level**, the hero level needed to wear it (1 to 50): basic gear 1–5,
steel 15–20, mithril 30–35, legendary 45–50. A shop stocks gear up to its town's level
(`SHOP_GEAR_LEVEL`: Dunmere and Greenhollow 5, Ironford and Windmere 20, the far towns 35 and 50)
plus a **showpiece** above it to save for (`SHOWPIECES`: Dunmere's level-20 Plate Armor, 1,200 gold).
The Armory's upgrade also needs the next piece's level.

Gold from fights follows the foes' levels, like XP: about 8 + 3 per level for each foe beaten
(`battleGold` in heroes.js). Three level-5 bandits pay about 70, three level-30 wraiths about 300.

## Where items come from

- **Foes drop goods by who they are**: each foe type has a `drops` list in `src/data/enemies.js`
  (`{ item, chance }`): Wolfskins drop wolf pelts (often), raiders drop a dagger or a rusty blade
  (sometimes), camps hold liquor and sacks. So "bring three wolf pelts" means "beat Wolfskins
  until you have three"; the Journal says who drops them.
- **The ground**: gathering spots in wild areas (herbs, dyes, ore) give goods.
- **Camps and chests**: a band's camp, searched after the fight.
- **People**: a token for gold, a favour, a threat.
- **Shops**: supplies and gear (as now).

## Items in missions (conditions and effects)

- Condition `hasItem: { id, count }` (a story step, a dialogue choice, a contract objective).
- Effects `giveItem: { id, count }` and `takeItem: { id, count }` in dialogue and story choices.
- Contract objective `deliver: { item, count }`: hand in goods to the giver.
- A keepsake given in a story step stays until the step that uses it.

## The token of trust (the example)

Prior Aubrey shows the Lantern's prayer book only to someone the Dunmere watch trusts. Sergeant Hobb has the watch's token:

| You | What it costs | Standing |
|---|---|---|
| Pay him | 80 gold | none |
| Bring him three bottles of liquor from the Wolfskin den (beat the den) | a fight (level 7) | dread +, honor + |
| Threaten him | a fight with the watch (level 6); the watch is cold to you afterwards | honor −, dread + |
