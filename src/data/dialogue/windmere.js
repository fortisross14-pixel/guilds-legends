// Windmere conversations. Format: src/data/dialogue/index.js.
const P = (id) => `portrait.windmere.${id}`;

export default {
  'windmere.bell': {
    speaker: 'The wind bell',
    portrait: 'portrait.poi',
    variants: [{ lines: ['A bronze bell hangs from an iron frame. The wind rings it before every bout at the Cliff Ring, whether anyone is fighting or not.'] }],
  },
  'windmere.courier': {
    speaker: 'Sela Wick',
    portrait: P('courier'),
    variants: [
      { if: { talked: true }, lines: ['Letters, parcels, gossip. I carry all three, but only the first two for money.'] },
      {
        lines: ['New faces in Windmere usually come for the duels or the monastery.', 'If it’s the duels, sign up at the Ring. Halden Marsh has never lost there. People still try.'],
        effects: [{ codex: 'windmere' }],
      },
    ],
  },
  'windmere.monk': {
    speaker: 'Brother Hale',
    portrait: P('monk'),
    variants: [
      { lines: ['The monastery keeps quiet records. Quiet is not the same as empty.', 'Old fighters come up the hill to rest. Most of them go back down to fight again.'] },
    ],
  },
};
