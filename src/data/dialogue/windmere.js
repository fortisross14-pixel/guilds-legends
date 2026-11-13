// Windmere conversations. Format: src/data/dialogue/index.js; style and voices: docs/DIALOGUE.md.
const P = (id) => `portrait.windmere.${id}`;

export default {
  'windmere.bell': {
    speaker: 'The wind bell',
    portrait: 'portrait.poi',
    leave: 'Move on',
    variants: [{ lines: ['A bronze bell on an iron frame. The wind rings it before every bout at the Cliff Ring.', 'It rings whether anyone is fighting or not.'] }],
  },

  // Sela Wick: fast-talking courier, always half-leaving; trades in news.
  'windmere.courier': {
    speaker: 'Sela Wick',
    portrait: P('courier'),
    variants: [
      // How they feel about the guild (its standing: fear, respect, disgust, warmth).
      { if: { talked: true, quadrant: 'fear' }, lines: ['I’ll take your letters. Fast. And I won’t read them, I promise.'] },
      { if: { talked: true, quadrant: 'respect' }, lines: ['The couriers say the roads are safer behind your banner. I like that rumour.'] },
      { if: { talked: true, quadrant: 'disgust' }, lines: ['I carry for anyone who pays. Some days I wish I didn’t.'] },
      { if: { talked: true, quadrant: 'compassion' }, lines: ['You’re the ones who stop for people on the road. Everybody knows. Come in.'] },
      { if: { talked: true }, lines: ['You again! Quick, I’ve a parcel going cold. What do you need?'] },
      {
        lines: ['Mind out! Oh, sorry. Delivery. You’re not a delivery, are you?'],
        choices: [
          { text: 'Not unless someone’s paying.', reply: ['Ha! Everyone’s paying for something. Sela Wick, courier.'] },
          { text: 'No. Just new in town.', effects: [{ codex: 'windmere' }], reply: ['New faces come up the hill for the duels or the monastery. Sela Wick. Courier.'] },
        ],
      },
    ],
    topics: [
      { id: 'duels', text: 'Tell me about the duels.', lines: ['Sign up at the Cliff Ring. Halden Marsh has never lost there. People still try.'] },
      { id: 'work', text: 'What do couriers carry?', lines: ['Letters, parcels, gossip. All three, but only the first two for money.'] },
    ],
    bye: { text: 'I won’t keep you.', lines: ['Nobody does! That’s the job.'] },
  },

  // Brother Hale: calm monk, slow and kind, speaks in short sayings.
  'windmere.monk': {
    speaker: 'Brother Hale',
    portrait: P('monk'),
    variants: [
      { if: { talked: true }, lines: ['Welcome back. The hill is no shorter the second time.'] },
      {
        lines: ['You climbed the hill. Sit, if your legs ask you to.'],
        choices: [
          { text: 'They’re asking.', reply: ['Then listen to them. I am Brother Hale. I keep the monastery’s records.'] },
          { text: 'I’m fine, thank you.', reply: ['Pride is lighter going up than coming down. I am Brother Hale.'] },
        ],
      },
    ],
    topics: [
      { id: 'records', text: 'What records do you keep?', lines: ['Quiet ones. Quiet is not the same as empty.'] },
      { id: 'fighters', text: 'Why do old fighters come here?', lines: ['To rest. Most of them go back down to fight again.'] },
    ],
    bye: { text: 'Thank you, Brother.', lines: ['Go gently. The wind does not.'] },
  },
};
