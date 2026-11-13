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

  // ---------------------------------------------------------------- the bigger Windmere: places
  'windmere.monastery': {
    speaker: 'The cliff monastery',
    portrait: 'portrait.poi',
    leave: 'Move on',
    variants: [{ lines: ['Moss on the thatch, salt on the columns. The monks have kept this terrace longer than Windmere has had a ring.', 'Inside, someone is singing very quietly, and very badly.'] }],
  },
  'windmere.graves': {
    speaker: 'The duelists’ graves',
    portrait: 'portrait.poi',
    leave: 'Move on',
    variants: [{ lines: ['Rows of small stones, each with a name and a number: bouts won.', 'The newest stone has no number yet. The monks leave it blank until the town agrees.'] }],
  },
  'windmere.courierpost': {
    speaker: 'The courier post',
    portrait: 'portrait.poi',
    leave: 'Move on',
    variants: [{ lines: ['Letters in pigeonholes, one hole for every town on the coast and the cliffs.', 'A sign: “Couriers paid on delivery. Excuses are not delivery.”'] }],
  },
  'windmere.lookout': {
    speaker: 'The lookout',
    portrait: 'portrait.poi',
    leave: 'Move on',
    variants: [{ lines: ['From the edge you see the whole coast: the docks below, the Salt Road east, the sea grey to the end of the world.', 'The wind pushes you back a step, politely.'] }],
  },
  'windmere.docks': {
    speaker: 'The docks',
    portrait: 'portrait.poi',
    leave: 'Move on',
    variants: [{ lines: ['Crates of salt fish and cliff wool. Some of them have no marks at all.', 'Those ones nobody looks at twice.'] }],
  },

  // ---------------------------------------------------------------- the bigger Windmere: people
  // Sister Anwen: a monastery novice; earnest, curious about the world below.
  'windmere.novice': {
    speaker: 'Sister Anwen',
    portrait: P('novice'),
    variants: [
      { if: { talked: true, quadrant: 'disgust' }, lines: ['Brother Hale says we must pray for everyone. I am still deciding about you.'] },
      { if: { talked: true, quadrant: 'compassion' }, lines: ['The guild with the gentle hands. I lit a candle for your heroes.'] },
      { if: { talked: true }, lines: ['You came back up the steps! Most people only come up once.'] },
      {
        lines: ['Oh, a visitor. Mind the graves, please. I’m Sister Anwen, a novice. Mostly I weed.', 'Do you come from far away?'],
        choices: [
          { text: 'From Dunmere.', reply: ['Dunmere! With the banners on every balcony? I’d love to see that.'] },
          { text: 'From wherever the work is.', reply: ['That sounds tiring. And wonderful.'] },
        ],
      },
    ],
    topics: [
      { id: 'graves', text: 'Who is buried here?', lines: ['Duelists. They come home to Windmere at the end, and the monks keep their count.'] },
      { id: 'blank', text: 'Why is the newest stone blank?', lines: ['Nobody can agree on his number. The ring says one thing and the betting books another.'] },
    ],
    bye: { text: 'I’ll leave you to your weeding.', lines: ['Walk gently on the steps. The wind likes to help people down them.'] },
  },

  // Old Maud: a retired duelist at the lookout; dry, blunt, still sharp.
  'windmere.lookoutnpc': {
    speaker: 'Old Maud',
    portrait: P('lookout'),
    variants: [
      { if: { talked: true, quadrant: 'fear' }, lines: ['Frighten the town all you like. I stopped being frightened forty years ago.'] },
      { if: { talked: true, quadrant: 'respect' }, lines: ['Hm. You fight clean and people know it. Rare. Keep it rare.'] },
      { if: { reachedFinal: ['windmere-cliff-duels', 'gale-games'] }, lines: ['I watched your final. You leaned into the wind. Good. Most fools lean away.'] },
      { if: { talked: true }, lines: ['Still here. Still watching the ring. Still not dead.'] },
      {
        lines: ['Stand there and you block my view of the ring.', 'Maud. Old Maud, they say now. Two hundred bouts on that sand, once.'],
        choices: [
          { text: 'Two hundred? That’s a career.', effects: [{ relationship: 1 }], reply: ['It was a life. The career came after, in the stories.'] },
          { text: 'Sorry about the view.', reply: ['Don’t be sorry. Move.'] },
        ],
      },
    ],
    topics: [
      { id: 'wind', text: 'How do you fight in this wind?', lines: ['You lean into it. Let it push your blade, never your feet.'] },
      { id: 'ring', text: 'Who’s the best in the ring now?', lines: ['Halden Marsh, they say. He wins too easily for my taste. Easy wins are bought or lucky.'] },
    ],
    bye: { text: 'Enjoy the view.', lines: ['I will, now you’re out of it.'] },
  },

  // Jory Pell: a fisher on the pier; slow, cheerful, talks to the fish.
  'windmere.fisher': {
    speaker: 'Jory Pell',
    portrait: P('fisher'),
    variants: [
      { if: { talked: true }, lines: ['Nothing biting. The fish heard you were coming.'] },
      {
        lines: ['Shh. You’ll scare them. They’re very nervous fish.', 'Jory Pell. I fish. They mostly don’t get caught.'],
        choices: [
          { text: 'Caught anything today?', reply: ['A boot and a cold. Good day, by my count.'] },
          { text: 'Nice pier.', reply: ['My grandfather built it. The sea has been taking it back ever since.'] },
        ],
      },
    ],
    topics: [
      { id: 'docks', text: 'What goes on at the docks?', lines: ['Fish goes out, salt comes in. And crates with no marks, at night. I don’t fish at night.'] },
      { id: 'sea', text: 'Where does the Salt Road go?', lines: ['East along the shore to Tidecross. Smells of salt the whole way, hence the name.'] },
    ],
    bye: { text: 'Good luck with the fish.', lines: ['They need it more than me.'] },
  },
};
