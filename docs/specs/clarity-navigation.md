# Spec: clarity and navigation

From docs/AUDIT_CH1.md, sections 2 and 3. Follow docs/UX.md. Don't change balance numbers here (that's handled separately). Removing the leftover objective is a bug fix.

## 1. Bugs
- **The leftover objective:** "Seek a Counter-Primal" and every other old chapter goal in `src/data/content.js` complete on their own and pay gold (260 gold at the start). Remove the old chapter goals and achievements that story and guild tasks have replaced, along with their toasts. Keep anything still used by the story or guild tasks.
- **Prologue Skip:** on the first line ("THUD. THUD. THUD."), Skip does nothing. Make Skip behave consistently in every dialogue: the first tap finishes the current line; then Skip jumps to the next choice, or to the end of the scene if there is none. In authored story scenes, Skip never skips a choice.
- **Empty speaker name tag:** narration lines show an empty dark pill. Hide the tag when there's no speaker.
- **Toasts overlapping content:** route every toast and notice through the one interruption queue in docs/UX.md. Toasts appear in one place (top, under the place tag, never over the scene's center or a panel's content), at most one at a time, and auto-dismiss.

## 2. Navigation
- **Guild orb:**
  - **Party:** heroes and the main party. "Retired & fallen" only appears once someone is in it.
  - **Items.**
  - **Guild Hall.**
  - **Guild (new):** charter, specialization, reputation, patrons and connections, path scores, finances (moved out of Records and the Treasury where duplicated).
  - **Contacts.**
- **World orb:**
  - **Map.**
  - **Journal** (replaces Quests and Calendar), with tabs:
    - **Now:** heroes away and when they return, injured heroes, construction, the active tournament.
    - **Quests:** main, side and guild tasks, plus evidence.
    - **Contracts:** accepted and unlocked; the same list as the notice board.
    - **Calendar.**
  - **Records** (rankings and history only):
    - **Rankings:** the three ladders, guilds and heroes; opens on the guild's ranks.
    - **Seasons.**
    - **Record book.**
    - **Hall of fame.**
    - **Mission log.**
    - **Codex:** almanac, lore, bestiary and guild directory, as one tab.
  - **System:** save, load, settings, credits, return to title. "Show the main quest marker" moves here.
- **Remove the Goals tab.**
- **Max 2 levels:** a section has tabs; tabs don't have their own button rows. Records → Rankings becomes a Guilds/Heroes toggle plus the ladder selector.
- **The ledger stays a short summary:** gold, fame, the three ranks with arrows, status title and specialization. One line each, each linking to its screen, under about 40 words when open.

## 3. Cut the text
- No explanatory paragraphs on menus. Explain rules once, as a long-press detail or a first-time hint.
- One line per list item; details on tap or long-press.
- At most about 80 words on any screen's first view (dialogue and story scenes excepted).
- Short noun or verb labels, icons on numbers, no repeated sentences.

Specific screens:
- **Party:** filters behind one icon, shown only at 6+ heroes. No explanatory paragraph. Rows show portrait, name, level, class icon, HP bar and status icon.
- **Journal → Quests:** each mission shows title, a one-line goal, the current step (one line), and Go / Show on map. Other steps are collapsed. "How this mission opened" sits behind a tap. Evidence gets its own small block.
- **Records:** under 80 words; the ranks are the focus.
- **Map:** names and icons only; details on tap.
- **System:** short labelled rows.
- **New game:** name, class, Begin, and at most one line of premise.
- **Save slots:** empty slots say "New game"; filled slots show guild name, year and crest.
- **Field HUD:** the place tag, goal chip and toasts together never take more than the top ~15% of the screen. The goal chip is one line.
