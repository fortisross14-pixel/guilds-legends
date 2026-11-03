// Wild-area points of interest. Format: src/data/dialogue/index.js.
export default {
  'wild.oldroad.milestone': {
    speaker: 'Old milestone',
    portrait: 'portrait.poi',
    variants: [
      { if: { oldRoadCleared: true }, lines: ['“Dunmere 2 · Blackwood 9.” Someone has scratched out the second line and written “don’t”.'] },
      { lines: ['“Dunmere 2.” Claw marks score the stone below the number.'] },
    ],
  },
  'wild.thornwood.marker': {
    speaker: 'Fallen ward marker',
    portrait: 'portrait.poi',
    variants: [{ lines: ['A ward stone knocked flat. The thorn carving on it has been chipped away, deliberately.'] }],
  },
  // Chapter 1 stops here: the Warden bars the deep wood (Chapter 2, mission 10).
  'wild.blackwood.warden': {
    speaker: 'The Hollow Warden',
    portrait: 'portrait.poi',
    variants: [
      {
        if: { storyDone: 'm8' },
        effects: [{ codex: 'hollow-warden' }],
        lines: ['The deep wood breathes. Somewhere past it, Aldric Vane led the survivors. The Warden does not move aside.', 'Not yet. Chapter 2: The Crown Must Fall.'],
      },
      {
        lines: ['The path ends at a wall of dead wood. Something vast stands between the trees and watches you.', 'Lantern light moves where nobody carries a lantern. You cannot go deeper. Not yet.'],
      },
    ],
  },
  'wild.blackwood.lantern': {
    speaker: 'Broken lantern',
    portrait: 'portrait.poi',
    variants: [{ lines: ['A guild lantern, glass cracked, the Broken Lantern’s mark on the brass. The wick is still warm.'] }],
  },
};
