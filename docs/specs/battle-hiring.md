# Spec: battle screen, HP between battles, and the recruit ID card

Found by the player on a real phone (see docs/AUDIT_CH1.md): the heroes are tiny in the bottom-right corner, partly hidden behind item buttons; the big name boxes act as the drag handle; drag from the body doesn't work; labels overlap; a knocked-out hero is back at 100% HP after the battle; and recruits don't show basic facts up front. Follow docs/UX.md.

## 1. Battle layout: the bodies are the interface
- **Placement:** heroes stand on the battlefield (left side, facing right) at the same scale as the enemies (right side, facing left), on the same ground line. Never in a corner, never behind buttons.
- **Under every unit:** name, level, a slim HP bar (plus MP for heroes) and status icons. This is the main readout.
- **The big name boxes go away.** Replace them with a compact party strip at the left edge (portrait, HP/MP numbers, statuses), or remove them entirely if the readouts under each unit are enough. The strip is never the drag handle.
- **Dragging:** the drag starts from the hero's body. A ghost of the sprite follows the finger, with a line to the target and a preview (damage or heal, hit chance, WEAK, ☠). Valid targets glow. The radial menu opens at the drop point and flips away from screen edges.
- **No instruction text in the command panel.** The first-battle tutorial is a ghost-hand animation dragging from Rowan's body to a wolf, shown once.
- **Command panel:** Undo, Auto, Speed and Flee as a small icon row. Items are a small row of icons with counts (×3); remove "+0". Use an item by dragging it onto a hero, or tap it and then tap the hero.
- **No overlaps:**
  - the turn order bar goes top center
  - the tell banner sits directly under it, never covering it
  - enemy intent shows once, as a small icon above the enemy, not as extra labels over the turn order bar
  - buttons never cover units
- **Contrast:** unit names and numbers meet WCAG AA on any background (add a subtle dark plate behind them).

## 2. HP and knockouts between battles
- **HP and MP carry over after a battle.** Wild areas, road events and consecutive fights all use the current values. Heroes recover by resting (camp, inn, Guild Hall), with potions, or over time at home.
- **Knocked out in a battle the party wins:** the hero ends at 1 HP and is injured (1 week to recover), until the Guild Hall rooms spec replaces this with the infirmary rules.
- **Party wipe:** follows the defeat rules in guild-hall-rooms.md (the party wakes in the infirmary).
- **The victory screen** shows each hero's HP after the fight and marks anyone injured. The party bar shows current HP.

## 3. Hiring: show who they are up front
From the first line of a recruit's conversation, show a compact ID card next to the dialogue: portrait, name, age, class (icon and name), rarity, primal and level. Stats show as ranges, narrowed by "What can you do?" and by scouting. The questions then reveal personality, flaw, dream and terms.
