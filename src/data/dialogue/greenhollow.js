// Greenhollow conversations. Format: src/data/dialogue/index.js.
const P = (id) => `portrait.greenhollow.${id}`;

export default {
  'greenhollow.herbalist': {
    speaker: 'Maren Bell',
    portrait: P('herbalist'),
    variants: [
      {
        if: { season: 'spring' },
        lines: ['Spring cuttings! Everything wants to grow and nothing wants to be picked. Mind the nettles.'],
      },
      {
        lines: ['Silverleaf grows at the Thornwood edge, past the ward stones. My knees will not take me there any more.'],
        choices: [
          {
            text: 'I could bring some back.',
            if: { notFlag: 'marenErrand' },
            effects: [{ flag: 'marenErrand' }, { relationship: 1 }, { item: { potion: 1 } }],
            reply: ['Bless you. Here, for the walk. Silverleaf has a silver underside; do not bring me nettles.'],
          },
          { text: 'Show me your herbs', effects: [{ open: 'shop' }] },
        ],
      },
    ],
  },
  'greenhollow.warden': {
    speaker: 'Warden Tamsin',
    portrait: P('warden'),
    variants: [
      {
        if: { storyStarted: true },
        lines: ['Lantern light in the Blackwood again. The wardens will not go near it. If your guild does, go together.'],
      },
      {
        lines: ['North of here is the Thornwood edge. Stalkers in the brush, and a bandit crew in the meadow that thinks it is clever.', 'The thicket at the top moves. Do not camp near it.'],
        choices: [{ text: 'Thanks for the warning.', effects: [{ relationship: 1 }] }],
      },
    ],
  },
  'greenhollow.storyteller': {
    speaker: 'Old Fen',
    portrait: P('storyteller'),
    variants: [
      {
        if: { talked: true },
        lines: ['Back for another? The Broken Lantern had twelve members. Only eleven names are on the stone in Dunmere. Ask yourself why.'],
      },
      {
        lines: ['Sit, sit. You carry a banner like the Broken Lantern did. They came through here, the year before the Blackwood took them.', 'Their captain paid for maps in gold that smelled of ash. Strange coin for an honest guild.'],
        choices: [{ text: 'What happened to them?', effects: [{ flag: 'heardFenTale' }], reply: ['Nobody knows. That is what makes it a story and not a funeral.'] }],
      },
    ],
  },
  'greenhollow.stablehand': {
    speaker: 'Kit',
    portrait: P('stablehand'),
    variants: [
      {
        lines: ['You came from Dunmere? On foot? The caravans to Ironford leave from the south lane, if you ever want a ride.'],
        choices: [
          {
            text: 'Any news on the roads?',
            effects: [{ rumor: { location: 'ironford', note: 'Caravans run from Greenhollow’s south lane to Ironford.' } }],
            reply: ['Ironford smiths pay double for anything with a bit of Thornwood iron-bark in it. Just saying.'],
          },
        ],
      },
    ],
  },
  'greenhollow.innkeeper': {
    speaker: 'Rowe Fallow',
    portrait: P('innkeeper'),
    variants: [
      {
        lines: ['Welcome to the Mossy Kettle. The tea is mostly moss and the stew is mostly kettle. People stay for the company.'],
        choices: [
          { text: 'Anyone looking for work?', if: { candidateHere: true }, effects: [{ recruit: true }] },
          { text: 'Go inside', effects: [{ open: 'tavern' }] },
        ],
      },
    ],
  },
  'greenhollow.cleric': {
    speaker: 'Brother Alder',
    portrait: P('cleric'),
    variants: [
      {
        if: { notFlag: 'alderBlessing' },
        lines: ['The grove blesses travellers who ask. Most do not ask.'],
        choices: [
          {
            text: 'I am asking.',
            effects: [{ flag: 'alderBlessing' }, { reputation: { region: 'Verdant Marches', amount: 4 } }, { relationship: 1 }],
            reply: ['Then walk gently, and the forest will remember it. So will Greenhollow.'],
          },
        ],
      },
      { lines: ['The grove remembers you. Walk gently.'] },
    ],
  },

  'greenhollow.oak': {
    speaker: 'The Elder Oak',
    portrait: 'portrait.poi',
    variants: [{ lines: ['The oak is wider than a house. Ribbons hang from its lower branches, each tied for someone who went into the Thornwood.'] }],
  },
  'greenhollow.wardstone': {
    speaker: 'Ward stone',
    portrait: 'portrait.poi',
    variants: [{ lines: ['A standing stone carved with thorns. It hums faintly, like a bee in a jar.'] }],
  },
  'greenhollow.well': {
    speaker: 'Stream well',
    portrait: 'portrait.poi',
    variants: [{ lines: ['Clear water, mint growing in the cracks. A bucket hangs ready.'] }],
  },
};
