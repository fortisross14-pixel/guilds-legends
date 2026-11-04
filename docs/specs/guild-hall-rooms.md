# Spec: Guild Hall rooms, training equipment and the infirmary (Phase 7D Part 2)

Part 1 (lots: renting, buying, expanding) is done; see docs/PROJECT_PLAN.md. Build on it. The numbers below are first guesses; keep them in data files so they're easy to tune.

## 1. Room types (each takes one slot)
Rework `src/data/rooms.js` into these types. Replace the old room list, room levels and any leftover hall stages.

| Room | What it does |
|---|---|
| **Bedroom** | +2 beds. Beds are the only roster limit. The starting cabin is one bedroom. |
| **Training room** | One hero at a time; holds one piece of training equipment (section 2). |
| **Infirmary** | One patient at a time; faster recovery (section 3). |
| **Treasury** | A detailed income vs costs view, a higher patron loan limit, and small monthly interest on savings. |
| **Armory** | More gear storage and a discount at the shop or smith. |
| **Scout table** | Recruit stat ranges narrow faster in conversation, and occasional rumors of rare recruits in other towns. |
| **Trophy hall** | Shows titles, records and the banner relic, with a small monthly fame bonus per trophy. |

Example plans on the 6-slot Dunmere lot:
- 3 bedrooms + 2 training + 1 infirmary
- 2 bedrooms + 2 training + 2 infirmary

**Building and clearing**
- Building costs gold and takes weeks. Construction shows on the slot and in the Journal/calendar, then ends with a short "Construction complete" moment.
- A built room can be cleared (partial refund, 1 week) to free the slot.
- Each room has a monthly upkeep, shown in the ledger and the Treasury.
- The War room is no longer a room type. Saved formations move to Party → Main party.

## 2. Training equipment
- Each training room holds one piece of equipment that raises one stat:
  - dummy → Might
  - targets → Finesse
  - reading desk → Mind
  - shrine → Spirit
  - weights → Endurance
  - podium → Presence
- **Three tiers: Basic → Advanced → State of the art.** Each tier raises the stat more per month and costs more. Show the gain on the room, e.g. "+1 / +2 / +3 Might a month".
- The assigned hero gains that stat every month (pro-rated when resting in weeks or days), plus a little XP.
- Swapping the equipment type costs gold; the old piece sells back for part of its price.
- Heroes not in a training room follow their other assignment.

## 3. Injuries, defeat and the infirmary (replaces death from battles)
- **Normal injuries** (from battles you win, missions, road events): recovery takes 1 week. An injured hero in an infirmary bed ends that week at full HP; elsewhere they end it at reduced HP.
- **Defeat** (losing a battle, contract or wild-area fight):
  - The party wakes in the Guild Hall infirmary.
  - It costs gold: treatment plus transport home, scaled by distance. If the guild can't pay, it becomes debt.
  - Defeated heroes need 1 month to recover. Patients beyond the infirmary's capacity recover in their beds at half speed.
  - A calm moment explains it, e.g. "Carried home to Dunmere. Treatment and transport: 85 gold. Back on their feet in about a month."
  - In wild areas, "Retry battle" stays available before accepting defeat.
  - Before the lot is rented, the party wakes in the founder's house, with the same cost and no infirmary bonus.
- **No deaths from battles or failed missions.** Death only comes from old age or authored story events. Hall of fame, retirements and inherited ambitions keep working.

## 4. The Guild Hall screen (touch-first)
- **Layout:** a diorama of the lot (placeholder shapes and silhouettes), with the cabin and every slot visible on one phone screen.
- **Tap an empty slot:** a bottom panel lists the room types, each with icon, one line, cost, weeks, upkeep and what it gives.
- **Tap a built room:** shows the occupants and what it does, with buttons to upgrade equipment, swap equipment or clear the room.
- **Assigning heroes:** drag a hero portrait from the party strip into a room, and drag out to unassign. Tap fallback: tap the hero, then the room. Heroes appear in their room as silhouettes (sleeping, training, recovering). An Auto-assign button stays.
- **The rest dial stays here** and shows what each room will produce.
- **Next-upgrade suggestion:** one line, e.g. "All beds full: build a bedroom".
- **Docs:** update docs/ASSETS.md (add the lot diorama, a slot tile per room type, each equipment piece in 3 tiers, the infirmary patient pose and the defeat backdrop; remove old room-level and hall-stage ids), docs/UX.md, and the state shape in CLAUDE.md.
