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
  'wild.blackwood.lantern': {
    speaker: 'Broken lantern',
    portrait: 'portrait.poi',
    variants: [{ lines: ['A guild lantern, glass cracked, the Broken Lantern’s mark on the brass. The wick is still warm.'] }],
  },
};
