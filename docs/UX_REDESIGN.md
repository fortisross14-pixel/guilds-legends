# Premium UX transformation

## Architecture decision

The product now uses a **world-first place architecture**. The World is the opening view; Guild takes the player to the current town and its destination buildings; Chronicle contains memory and long-horizon administration. This replaces an app-like collection of feature pages while preserving the existing route API and every game action.

The primary loop is supported directly:

`Discover (World) → Prepare (Guild) → Commit (mission/tournament launch) → Experience (battle/mission game) → Celebrate or Regret (moments/reports) → Progress (Guild) → Remember (Chronicle)`

## Validation plan

The implementation is a presentation-layer change only. Validate production build, then manually check a narrow phone, tablet landscape, and desktop view; launch a mission; inspect a hero; enter a battle; and verify keyboard focus plus reduced motion. Engine tests are not required unless engine code changes.

## Remaining visual QA

Automated screenshot capture depends on the local browser runtime. If available, capture World, Guild, Heroes, Missions, Rankings, and an active battle at 390px, 1024px, and desktop widths after the build passes.
