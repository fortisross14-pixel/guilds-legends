# Guilds of Legend — Game Vision (Waves 2–7)

This replaces waves 2–6 of `docs/AUDIT_v1.9.md`. Waves 0–1 (stabilize, code split) are done; see the audit and `CHANGELOG.md`.

| Wave | Status |
| --- | --- |
| Wave 2 — The world is the game (map, towns, time) | ✅ Done (2026-11-02) |
| Wave 3 — Real combat (per-hero commands, skills, items, gear, rewards) | ✅ Done (2026-11-02) |
| Wave 4 — Rankings as the hook, and the scripted opening | ✅ Done (2026-11-02) |
| Wave 5 — Your team, your time (party bar, rooms, status screen, weeks, calendar) | ✅ Done (2026-11-02) |
| Wave 6 — Recruitment depth | ✅ Done (2026-11-02) |
| Wave 7 — Specialization, rivalries and fixes | ✅ Done (2026-11-02) |
| Wave 8 — Content and pacing | ✅ Done (2026-11-02) |

## The goal: turn a stack of menus into a game

Today Guilds of Legend plays like a succession of dashboards. The target feel is an old-school 2D JRPG (Final Fantasy III / early Dragon Quest), combined with guild management and a rankings ladder. The core idea: **menus become places.**

- The **world map is the main screen.** The player always sees where the guild is, and clicks a town to travel there. Travel takes time, and things can happen on the road.
- **Inside a town, buildings replace menus:**
  - Guild Hall: team status, training, assignments
  - Tavern: hiring and firing
  - Notice Board: missions
  - Arena: tournaments
  - Shop: items and equipment
  - Herald: rankings and guild directory

  Not every town has every building. Small villages might only have a Tavern and a Notice Board.
- **One menu button** for non-places: Settings/Save, Chronicle, Codex.
- **Time moves when you act** (travel, missions, training, resting), not through "+1 month / +1 year" buttons. A calendar shows upcoming events.
- **Combat is per-hero, turn-based:** each hero picks a command (Attack, Skill, Item, Defend) and a target, the enemies are visible on screen, and auto-battle is available for routine fights.
- **Rewards are moments:** victory screens, level-up screens, loot, rank-change fanfares and recruit introductions.
- **Rankings are the hook:** three clear ladders (Strength, Legacy, Official tournament points) with movement arrows and a status title from "Unknown" to "Global Power".
- **The first 10 minutes are scripted** to teach the game, not the menus.

## How to work

- **Do only the wave named in the request.** When it's done, stop and summarize. Do not start the next wave.
- Work on main. Follow the ground rules and the **prototype-mode testing policy** in `CLAUDE.md`: no new tests, no full suite, no balance/performance/e2e runs. Only a quick sanity check (`npm run build`, plus `npm run test:fast` if engine logic changed). Stop after 2 failed attempts at the same check.
- **Graphics are placeholders.** A separate design pass (with the Impeccable skill) comes later. Keep layout clean and functional. Reuse the existing CSS tokens and the art in `public/art` (portraits, sprites, enemies, effects, scenes). Don't spend time on polish, animations or new art. Do use semantic class names and keep visual styling in CSS, so the later redesign is easy.
- Keep the engine pure and deterministic. This is an early prototype: old saves may break, so no save migrations or compatibility work.
- Prefer reusing existing systems (missions, recruitment, tournaments, rivals, combat.js) over rewriting them. Remove code that a wave makes obsolete instead of leaving dead paths.
- If a design detail here is unclear or conflicts with the code, make the simplest reasonable choice and list it in the summary.

## Wave 2 — The world is the game (map, towns, time) (done)

1. **World map as the home screen.**
   - Show all locations as nodes connected by real routes, built from location coordinates.
   - Show a clear "You are here" guild marker.
   - Show locked regions (by tier) greyed out.
   - Clicking a town shows a small card: name, primal, buildings, travel time and cost, and a "Travel" or "Enter town" button.
   - Show travel progress on the map.
2. **Town view.** Entering a town shows its buildings as large clickable tiles. Each building opens the existing functionality, re-homed:
   - Guild Hall: roster, assignments, training, headquarters facilities, appointments
   - Tavern: recruitment candidates, hire, release
   - Notice Board: local missions, plus the party builder
   - Arena: local tournaments
   - Shop: placeholder, filled in Wave 3
   - Herald: rankings, guild directory, almanac

   Define which buildings each location has in `src/data/world.js`.
3. **Navigation.** Replace the 11-item sidebar and mobile nav with:
   - Map
   - the current Town
   - a Menu (Settings/Save, Chronicle, Codex with the current Legacy/Goals content folded in)

   Remove the old screens once their content lives in a building. Move "Goals" into an Objectives panel in the Guild Hall. Keep the top bar to: date, location, gold, and the guild's 3 ranks.
4. **Time moves with actions.**
   - Remove "+1 month", "+Season" and "+1 year".
   - Time advances when you travel (existing travel durations), when a mission runs, or with "Wait / Rest at the Guild Hall" (choose 1–3 months, which runs the existing monthly council resolution).
   - Add a calendar or "upcoming" strip: next tournaments with dates and entry requirements, active missions with time remaining, promise deadlines.
5. **Road events.** Each journey has a seeded chance of 0–2 short events: ambush (an auto-resolved fight for now), merchant (cheap item, once items exist, or gold trade), wandering recruit, shortcut or delay. Use the existing decision-modal pattern.

### Wave 2 notes (choices where the brief was open)

- The Guild Hall is the guild's own headquarters, so it is in whichever town the guild is based. Other buildings come from `LOCATION_BUILDINGS` in `src/data/world.js`. Arenas are in the tournament host towns; Windmere, Thornwatch, Beaststeppe and the Far Veil are villages (Tavern and Notice Board only).
- Missions move time like this: launching a company that uses your last free field company lets time run until the next company returns. With spare companies, you can keep launching. A "Wait for the company" button in the calendar strip does the same on demand.
- While travelling, the Town view shows only the Guild Hall. Recruiting and new deployments were already blocked on the road.
- Road events fire on a seeded month of the journey. Shortcuts only appear with 2+ months left, delays with 1+. Merchants trade gold (items come in Wave 3).
- The Codex holds the full Goals/promotion/achievements list and the Legacy office; the Guild Hall overview shows the Objectives panels (current goal and next threshold).
- The old screen components now live inside buildings (`src/places/TownScreen.jsx`); they were not renamed.

## Wave 3 — Real combat (per-hero commands, skills, items, gear, rewards) (done)

1. **Per-hero battle model** in combat.js (replace the shared party HP pool):
   - Each hero and each enemy has its own HP, MP, attack, defense, speed and status effects (e.g. guard, poison, stun, buff).
   - Turn order comes from speed.
   - Each round, the player picks one command per living hero (Attack, Skill, Item, Defend), then a target (an enemy for attacks; an ally for heals/buffs; all enemies or all allies for area skills).
   - Enemies pick actions with simple AI.
   - Keep the existing "enemy tell" idea as a twist: show what the strongest enemy intends next turn, so Defend and interrupts matter.
   - Primal advantages still apply.
2. **Battle screen** (front view, Dragon Quest style):
   - enemies in the middle, using `public/art/enemies`
   - party status windows along the bottom (name, HP, MP)
   - a command menu for the active hero
   - target selection by clicking an enemy or ally
   - a short battle log

   Buttons: Auto-battle (AI picks for the party), and Flee where allowed. Fallen heroes are knocked out in battle. Injury and death risk afterwards uses the existing post-mission rules.
3. **Skills per class.**
   - Each class gets 4–6 skills unlocked by level (e.g. Cleric: Cure → Cura → Raise; Mage: elemental spells by primal; Guardian: Cover/Taunt; Rogue: Steal/Backstab; Bard: party buffs).
   - Put the skill data in `src/data/skills.js`.
   - Level-ups that unlock a skill say so.
4. **Items and equipment.**
   - Consumables (potions, ethers, antidotes, phoenix-down-style revive, bombs) usable in battle and in the Guild Hall.
   - Gear slots per hero: weapon, armor, accessory, with stat bonuses and some class restrictions.
   - A guild inventory.
   - Shops in towns, with stock varying by town and tier.
   - Missions and tournaments can drop loot.
   - Existing artifacts become special accessories.
5. **Reward moments:**
   - a victory screen (XP per hero, gold, loot)
   - a level-up screen (stat gains, new skills)
   - a recruit introduction card when someone joins (portrait, class, personality, a one-line hook)
6. **Where combat is used:**
   - combat missions
   - player tournament bouts (duels become 1v1 with the same system; remove the old tactic-dropdown fight path)
   - road ambushes

   Non-combat missions (diplomacy, expedition, intrigue) keep their existing mini-games.

### Wave 3 notes (choices where the brief was open)

- The tell shows the strongest enemy's planned move each round. All enemies plan at the start of the round and follow the plan honestly. A stun landed before they act cancels it ("interrupt"), and Defend halves damage for the round.
- The game has 8 classes (Guardian, Duelist, Ranger, Rogue, Cleric, Mage, Scholar, Artificer), each with 5–6 skills. The brief's Bard example has no class in the game. The Scholar fills the party-buff role.
- Mage spells take the caster's primal ("Fire Bolt"), so primal advantage decides elemental matchups.
- Battle items are a snapshot of the guild's consumables when a battle starts, and usage is written back when it ends. Rogues' Steal can add potions.
- Mission objectives (protect, hold, capture…) no longer change combat. Every battle is won by defeating the enemies, or by HP when time runs out (20 rounds; 15 in duels). The objective is still shown as flavour.
- Knocked-out heroes add +8% injury risk in the existing post-mission injury roll. A party wipe is still a Catastrophic grade.
- Enemy strength now scales with mission risk (risk 1 contracts are easy, risk 5 ones hard). Enemy level follows contract difficulty.
- Artifacts are worn in the accessory slot and give combat stats from their prestige. A hero wears one artifact at a time.
- Guild Hall item use: potions restore health and fatigue, ethers restore morale. Other consumables are battle-only.
- Tournament prizes: the champion gets a better loot roll, the runner-up a normal one. Victory moments appear after combat missions (after the aftermath choice, so XP and gold are final), road ambushes and tournament bouts.
- Removed: the old tactic-dropdown round path, the shared party HP pool, stances (guard/feint/recover/objective/signature), and their tests.

## Wave 4 — Rankings as the hook, and the scripted opening (done)

1. **Three ladders**, for guilds and for heroes, in rankings.js:
   - **Strength:** current power (guild = average of its top 5 heroes). Moves fast.
   - **Legacy:** all-time points from completed missions (weighted by difficulty and grade) and titles. Never decays.
   - **Official:** tennis-style points from tournaments, counting only the last 12 months. The points table scales with tier and round reached (e.g. Regional winner 250, National 1000, Global 2000, World Conclave 4000).

   Replace the old composite score, and update rival guilds and rival heroes with the same rules.
2. **Status titles** from the Official rank: Unknown → Contender → Regional Power → National Power → Global Power. Tier promotion uses the Official ladder (plus the existing contract/fame requirements where they still make sense).
3. **Make it visible:**
   - Store a monthly snapshot of rank numbers (small).
   - Show movement arrows (▲3 / ▼1), a small rank-history sparkline, and "312 points to pass <guild> (#7)".
   - The Herald building is the rankings hub (3 ladders × guild/hero, guild directory, records).
   - The top bar always shows your 3 ranks plus your status title.
4. **Rank-change moments:** a short "Rankings update" screen after every tournament and at each season end. Show a fanfare-style card when the status title changes.
5. **Scripted first 10 minutes** (replace the old 10-step menu tutorial):
   1. Arrive in Dunmere. A short intro card sets the premise (the old guild vanished; the player is a founder with a banner).
   2. Tavern: hire your first companion (free), with the recruit introduction card.
   3. Notice Board: take the first contract, Wolves on the Old Road.
   4. Travel to it on the map. A guaranteed easy road event happens on the way.
   5. First battle, with on-screen hints teaching command, target, a heal or item, and the enemy tell.
   6. Victory screen and level-up screen.
   7. Return to town. The Herald shows the first ranking change ("Unknown → #12 Regional, ▲1").
   8. The calendar points to the first tournament, and the tutorial ends with "Enter the Dunmere Harvest Melee in 3 months".

   Hints are skippable, and there's a "Skip tutorial" option for returning players. Use seeded, guaranteed outcomes for the scripted steps so the first battle can't be lost unfairly.

### Wave 4 notes (choices where the brief was open)

- Official points: the winner's points by circuit (Regional 250, National 1000, Global 2000, World Conclave 4000) × a finish share (champion 100%, runner-up 60%, semifinal 36%, quarterfinal 18%, round of 16 9%). Finishes come from bracket wins. Guild championships use the same table. A guild's Official total is its heroes' points plus its championship points from the last 12 months.
- Legacy: mission difficulty × grade weight (Legendary 2, Great 1.5, Success 1, Partial 0.4) goes to the guild, and half of that to each participant. Titles add 150 (guild), 150 (hero individual title) and 60 (hero guild title). Rivals earn mission Legacy from their own simulated missions, seeded from their earlier career points.
- Status titles: Unknown with 0 Official points, then Contender. Regional, National and Global Power mean the guild is in the top 5 of that tier's Official ladder and has reached that tier.
- Promotion: the old composite-rank requirement is now an Official-ladder rank (the same thresholds: top 8 Regional, top 4 National) plus at least some Official points. Fame, contracts, feats and years still apply.
- The top bar and the Herald show ranks in the guild's current tier. The Herald can switch scope.
- Rankings moments: one every season (each 3 months, compared with 3 months earlier) and one after every tournament the player entered. A fanfare moment plays when the status title changes.
- Scripted opening: the first contract (Wolves on the Old Road) is local to Dunmere, so the "travel to it" step is a march out of town. A guaranteed peddler event (two free potions) fires when the company sets out, then time runs to the battle. In the first battle heroes can't drop below 1 HP, the enemies are weakened, and a timeout counts as a win. The contract's XP is raised so the founder always levels up.
- Known effect for the balance pass: the autoplay governor never enters tournaments, so with Official-based promotion the simulated guild stays Regional (`npm run sim`).
- Removed: the composite guild score and the old 10-step menu tutorial.

## Wave 5 — Your team, your time (done)

The problem: the team is invisible (three clicks deep), assigning heroes to train, rest or recover isn't discoverable, and time has no calendar. Wave 5 makes the team and the calendar always present, and keeps the "menus become places" idea.

1. **Party bar (always visible).**
   - A compact strip on every screen (bottom on desktop, collapsible on mobile) with one card per active hero: portrait, name, level, HP bar, fatigue, a status icon (available, training, resting, infirmary, injured, on mission, in tournament, traveling, branch duty) and a small "main party" marker.
   - Clicking a card opens that hero's status screen.
   - A warning dot when a hero needs attention: injured but not in the Infirmary, high fatigue, low loyalty, or a promise due soon.
2. **Guild Hall as rooms.** Replace the Guild Hall tabs with a room view. Each room is a tile showing how many heroes are inside. Opening a room shows who is there and lets you move heroes in or out. Rooms map onto the existing monthly activities:
   - Training Grounds (training, with a training focus dropdown), Infirmary (injured heroes go here automatically), Barracks (resting), Scouts' Table (scouting), Courtyard (public exhibitions), Council Chamber (guild duty and appointments).
   - War Room (main party, up to 4, and saved formations), Treasury (income vs upkeep, loan and debt, the last council report), Armory (equipment and items), Facilities (headquarters upgrades).
   - Quick actions: "Send all idle heroes here" (Training Grounds, Barracks, Infirmary) and "Auto-assign" (injured to the Infirmary, fatigue over 60 to the Barracks, everyone else to the Training Grounds).
   - Heroes on missions, in tournaments, traveling or on branch duty show as "away" and can't be moved. The old Overview/Roster/Equipment/Facilities tabs go away; the guild summary sits in a slim header.
3. **Hero status screen (JRPG style).** One screen per hero, opened from anywhere (party bar, rooms, rankings, reports). It replaces the hero dossier modal. Sections:
   - portrait, name, class, primal, rarity, level and XP bar
   - HP, MP and core stats
   - equipment slots with equip/unequip
   - skills, unlocked and locked (with unlock level)
   - current room, with a dropdown to move the hero
   - personality, flaw, dream and promises
   - relationships
   - career record and history
   - actions: main party, mentor, appoint, release

   Next/previous buttons flip through the roster.
4. **Weekly time and a calendar.**
   - The time unit becomes weeks: `date = { year, month, week }`, 4 weeks per month.
   - Monthly systems (wages and upkeep, council activity resolution, rival seasons, candidate refresh, the annual cycle) still run once per month, on week 1.
   - Travel and mission durations are in weeks: trips take 1–6 weeks, missions 1–4.
   - Tournaments have a fixed month and week. Injuries count down in weeks. Road events still trigger per journey.
   - Time controls in the top bar: **+1 week**, **+1 month**, and **Wait until…** (opens the calendar). Advancing stops early when a decision, battle, mission game or tournament needs the player. The council report summarizes the whole advance.
   - Calendar page: a month grid with weeks as rows and previous/next month buttons. Entries:
     - enterable tournaments (clearly marked), and locked ones (greyed out)
     - mission returns, travel arrival, promise deadlines
     - wage/upkeep day, loan due dates
     - season end (rankings update)

     Clicking an entry shows its details and "Advance to this date".
   - The Upcoming strip shrinks to the next 3 events the player can act on, links to the calendar, and drops unenterable tournaments.
5. **Main party.**
   - Up to 4 heroes, saved in state, picked in the War Room or from the status screen.
   - Mission party building and tournament entry pre-fill with the main party, filling roles automatically where possible. Injured or away members are flagged, with a suggested substitute.
6. **Quest log** (menu, plus a party-bar shortcut).
   - Lists active contracts (title, location, heroes, weeks remaining), open promises with deadlines, and current objectives.
   - Clicking a contract shows it on the world map with a pin.
7. **Small fixes.**
   - Clear old-tutorial notifications when the opening is skipped or completed.
   - Make the world map the first thing visible, and move its intro text into a "?" tooltip.
   - The Upcoming strip no longer lists tournaments the guild can't enter.

`simulateAutoplay` and `npm run sim` move to weeks, but only enough to keep running.

### Wave 5 notes (choices where the brief was open)

- Weeks are stored 0–3 and shown as weeks 1–4. Monthly systems run when a month starts, so wages are paid on week 1. "+1 month" is 4 weeks, landing on the same week of the next month.
- The council report only opens when an advance crosses a month. A single quiet week doesn't pop a report. It covers the whole advance: the date range, total upkeep and loan payments, net gold, fame and legacy, and that month's room activities.
- Travel weeks come from map distance (1–6). Contract durations are the old month values capped at 4 weeks. Each tournament's week comes from its id, so it's stable every year. Injuries last 2–4 weeks from road wounds, or 2 to 4 + 2×risk from missions. The Infirmary heals 2 weeks per week; anywhere else heals 1.
- Rooms reuse the monthly activities. "Send all idle heroes here" only moves heroes from the three basic rooms (training, barracks, infirmary), so scouts, exhibitors and guild-duty heroes stay put, and injured heroes are never sent to train. "Auto-assign" follows the brief literally for everyone at home.
- "Away" heroes: on a mission, in a tournament, on branch duty, or everyone while the guild travels. Heroes recovering from injury go back to Training automatically.
- The calendar covers the next 12 months. Tournaments for next year are projected from their definitions. Unenterable ones are greyed out ("Unlocks at National"). Wage days and season ends are listed. Loan payments show inside the wage-day entry.
- The Upcoming strip lists the next 3 actionable events: enterable tournaments, company returns, arrival and promise deadlines.
- Main party: the mission builder pre-fills only with available main-party heroes placed by best role fit. If none are available it falls back to the saved formation. A notice names injured or away members and suggests substitutes (the strongest available non-party heroes). Tournament entry defaults to the first available main-party hero.
- The parallel design pass's shell (World / Guild / Chronicle nav, PartyRail) was kept. PartyRail grew into the Wave 5 party bar, and the Calendar and Quest Log were added to the Chronicle menu.
- The old Hall overview (next-step panel, objectives, expeditions) is gone. Objectives live in the Quest Log, and the next-step ribbon now shows on every screen.
- Removed: the Guild Hall Overview/Roster/Equipment/Facilities tabs, HallScreen, CouncilPlanner ("Resolve month" / "Rest 1–3 months"), restAtGuildHall, and the hero dossier modal (replaced by the status screen).

## Wave 6 — Recruitment depth (done)

- Contracts with length and salary, expiry and renewal talks.
- Candidate stats shown as ranges until narrowed by scouting.
- Released or expired heroes become free agents who can join rivals.
- Poaching both ways, driven by loyalty.

### Wave 6 notes (choices where the brief was open)

- **Contracts:** 1, 2 or 3 years, chosen when hiring. Longer deals pay less per month (×1, ×0.93, ×0.87). The founder has no contract. The guildmaster's contract quietly extends a year at a time.
- **Expiry:** a warning 3 months before (notification, party-bar dot, calendar entry). At expiry the hero leaves as a free agent. A hero on a mission or in a tournament leaves when they're back.
- **Renewal talks** open in the last 12 months, from the hero status screen. The asking salary is the hero's current market rate (level, potential, rarity) for the chosen length, ×1.15 below 70 loyalty and ×1.3 below 45. The signing bonus is 2 months' base salary per year. Below 25 loyalty the hero refuses to talk. A renewal adds +5 loyalty and starts when the old deal ends.
- **Candidate fog:** power, potential and attributes show as ranges (±15, ±9, ±4, exact) that always contain the true value. A month with any scouting raises the scouting level of candidates where the guild operates by 1, or by 2 with 3+ scouting effort. A Scout Office adds +1. Founding candidates are fully known; road recruits start at level 1.
- **Rivals poaching your heroes:** heroes below 40 loyalty (not the founder or guildmaster) may get a rival approach each month (chance grows with disloyalty and level). You have one month to make a counter-offer (+20% salary, +15 loyalty). If loyalty is still under 40 next month, the hero joins that rival.
- **You poaching theirs:**
  - Any rival hero or free agent can get an offer from their status screen; free agents in your town are also listed in the Tavern.
  - The fee scales with level, power, renown and rarity: 1.4× for rival heroes, 0.6× for free agents.
  - Acceptance chance: 85% for free agents. For rival heroes it is 10% plus a loyalty factor plus your fame lead over their guild, between 5% and 80%.
  - A refusal locks that hero out for the year and makes them a bit more loyal to their current guild.
  - Signing a rival's star promotes their next-best hero.
- Released and expired heroes already became free agents (Wave 0); rivals' existing transfer market signs them.

## Wave 7 — Specialization, rivalries and fixes (done)

- Reputation per mission family (Combat/Diplomacy/Expedition/Intrigue) and per region, with perks.
- Declined contracts go to rivals.
- 1–2 rival guilds become nemeses, with head-to-head records and challenge matches.

### Wave 7 notes (choices where the brief was open)

- **Reputation families** are the four mission approaches (Combat/Diplomacy/Expedition/Intrigue), not the story families like "Monster Hunt".
  - Points: difficulty × grade weight (Legendary 2, Great 1.5, Success 1, Partial 0.3, Defeat −0.3, Catastrophic −0.5). They go to both the family and the contract's region.
  - Levels: Unknown 0, Known 100, Respected 300, Renowned 700, Legendary 1500.
- **Family perks** (cumulative):
  - +5% pay and fame per level.
  - Respected: one extra contract of that kind on each board.
  - Renowned: next-tier contracts of that kind appear a tier early.
  - Legendary: +6% success estimate, and Combat also faces 10% weaker enemies.
- **Regional perks:** +5% pay and −5% recruit signing fees per level in that region.
- **Specialization title** comes from the top family once it reaches Known: Monster Hunters, Envoys, Pathfinders or Shadow Hand. It shows in the Guild Hall header and the Herald.
- **The Reputation view lives in the Herald,** next to a new Rivals & nemeses tab.
- **Contracts going to rivals.**
  - Declining (Notice Board button, with confirm) or letting a contract expire hands it to a rival. The pick order is a nemesis from that region, then any rival from that region, then a rival near your tier.
  - The rival gains fame, Legacy (difficulty) and Official points (difficulty ÷ 2, as a ledger entry with source "contract").
  - Declining costs 5 regional reputation. Expiry costs 10, but only for contracts in the town where the guild is based; others lapse quietly so the notices don't flood.
- **Rivalry score:** +5 per tournament bout against their hero, +8 per guild-championship bout, +6 per contract they take, +15 per poaching either way, +10 per challenge, and +1 per month while within 2 places on the Official ladder.
  - The top 2 with at least 20 points are nemeses, recomputed monthly. A new nemesis gets a moment screen.
- **Nemeses in the world:** each month there's a 25% chance a nemesis takes a contract from its home region's boards. While you have a nemesis, rival approaches to low-loyalty heroes are 1.5× as likely and come from the nemesis.
- **Challenges.**
  - At each season start, a nemesis issues one with 50% chance. You can also challenge each nemesis once per season from its page.
  - The challenge stays open for 4 weeks. Accept starts a party battle: your main party first, up to 4, against their best heroes; a duel if only one hero is free. Challenges can't be fled.
  - Stakes, × tier: 120 gold, 6 fame, 60 Official points. A win takes the gold, fame and points; a loss pays the gold and gives them the points.
  - Declining or letting it expire costs half the fame stake.
- **Calendar additions:**
  - nemesis challenge windows at season starts, plus the pending challenge's deadline
  - the next reputation milestone for your best family
  - tournaments marked "almost" when the tier is open but no hero meets level, fame or win requirements yet (with what's missing)

  Locked tournaments still show "Unlocks at …".
- **Fixes:**
  - The calendar follows the current date unless you browsed to another month (a "Today" button returns).
  - The ribbon is one line, shows only on the World and Guild screens, collapses (remembered per browser), and its empty progress bar is gone. The bar was empty because tutorial steps pass a string target; progress now shows as "x/y" text when it exists.
  - The phone top bar shows the date, +1 week, a "⋯" menu (+1 month, Wait until…) and one rank chip with all three ranks.
- Removed: the ribbon's progress bar and the ribbon on non-place screens.

## Wave 8 — Content and pacing (done)

- More to do between contracts: town events, rival challenges, short side jobs, so "+1 week" usually brings something.
- More enemy types per region, plus one boss contract per region.
- A story arc about the Blackwood, where the old Broken Lantern guild vanished (continuing the opening premise).
- A few sound effects and a victory jingle, with a mute toggle.

### Wave 8 notes (choices where the brief was open)

- **Weekly roll** for the guild's town (and branch towns), skipped while travelling:
  - 45% chance of an event card, at most one a week, and none while another card waits
  - 35% chance of a news item, which goes to the News feed with no pop-up
  - side-job results and story or boss notices also land in News

  A throwaway two-year probe that took a side job every other week saw something happen in 65–71 of 104 weeks.
- **Event cards don't pause time.** A card waits (forced choice, like road events) until answered, and no new card arrives meanwhile, so "+1 month" can't flood you.
- **Events:** 29 in `src/data/events.js`: 8 opportunities, 7 troubles, 8 hero moments (personality, flaw and dream conditions), 6 news items. Chance options roll with the seeded RNG.
- **Festivals:** one per season, on week 2 of the season's first month, in a town chosen by year. Being there gives a festival card; otherwise it's a news item. Festivals are on the calendar.
- **Side jobs:**
  - 3 per board in each operational town, refreshed monthly (the old-map event adds one); tier-scaled rewards.
  - 1 week with 1–2 heroes, who show as "Side job" (away) in the party bar and Quest Log.
  - Roll: the heroes' average stat, plus 6 for a helper, plus a random −12 to +12, against the difficulty.
  - Success pays gold and XP, with a chance of an item or reputation. Failure pays a third of the gold.
- **Friendly rival challenges:** 5% a week, from a same-tier rival (not a nemesis), when nothing else is pending.
  - Kinds: friendly duel (1v1), exhibition (party battle), or wager.
  - Duels and exhibitions use challenge combat with lighter stakes (×tier: 40 gold, 3 fame, 15 Official points).
  - A wager: finish a contract of a given family within 8 weeks to win 80×tier gold; otherwise pay it.
  - All of them feed the rivalry score and head-to-head record.
- **Enemies:**
  - 7 regional rosters (5–6 types each), built from five roles (brute, swift, caster, healer, tank) with stat multipliers and 1–2 abilities, reusing the 16 sprites. Mission battles use the contract region's roster.
  - Bosses: one per region plus the Blackwood finale. Each leads 1–3 roster enemies, has a unique ability, an intro line in the battle log, and 3.2× HP.
- **Boss contracts:** posted when the guild is Known (100+) in a region, at a reachable town there, and shown on the map with ☠. A win records the boss as defeated (Bestiary in the Codex, plus a Chronicle entry) and grants a unique trophy accessory, +150 regional reputation, +100 Combat reputation and +20 legacy. Boss and story contracts can't be declined and don't go to rivals.
- **Blackwood arc:** 7 beats (journal → Greenhollow herbalist → a rival hunting the same ledger → Ironford ledger → Windmere survivor → the truth (choice) → the finale).
  - It starts after 3 contracts, 60 fame or 6 months; later beats come 3–5 months apart, with a retry a month after a failed story contract.
  - The final choice gives a guild honorific and a permanent perk: Keepers of the Lantern (+10% fame), Wardbreakers (+10% Combat pay) or The Quiet Lantern (−10% upkeep). The finale also gives the Lantern of the Lost Company accessory.
  - The Blackwood is a marker on the map once the finale is posted. The finale contract is at Dunmere's Notice Board (no new travel location).
- **Sound:** synthesized in code with the Web Audio API (no files, no CREDITS needed): click, confirm, hit, crit (on a knock-out), heal, level-up, victory, defeat, coin and fanfare. On/off and volume are in Settings, saved with the campaign's settings. Audio starts after the first click.
- **News feed:** Chronicle → News, with an unread badge that clears when opened.

## End of each wave

- Quick sanity check only (`npm run build`, plus `npm run test:fast` if engine logic changed), then push to main.
- Mark the wave done in this file and add a `CHANGELOG.md` entry.
- Summarize:
  - what changed
  - design choices made where this brief was unclear
  - what was removed
  - what to play-test manually

## After the final wave

Turn the safety net back on: restore the full testing policy in `CLAUDE.md`, add tests for the new systems (combat, items, rankings, opening), and run the balance (`npm run sim`), performance and visual (e2e) passes. Then do the Impeccable design pass.
