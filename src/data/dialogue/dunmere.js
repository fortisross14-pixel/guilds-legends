// Dunmere conversations. Format: src/data/dialogue/index.js.
const P = (id) => `portrait.dunmere.${id}`;

export default {
  'dunmere.innkeeper': {
    speaker: 'Sella Rowan',
    portrait: P('innkeeper'),
    variants: [
      {
        if: { talked: true },
        lines: ['The Wayfarer keeps a chair open for {guild}. You are becoming the sort of name people save a seat for.'],
        choices: [
          { text: 'Who is looking for work?', if: { candidateHere: true }, effects: [{ recruit: true }] },
          { text: 'Go inside', effects: [{ open: 'tavern' }] },
        ],
      },
      {
        lines: [
          'A new banner is a promise, not a company. The right person might be inside — listen before you hire.',
          'The rooms are yours. Come in when you are ready to meet Dunmere’s strays and strivers.',
        ],
        choices: [
          { text: 'Introduce me to someone', if: { candidateHere: true }, effects: [{ recruit: true }] },
          { text: 'Go inside', effects: [{ open: 'tavern' }] },
        ],
      },
    ],
  },
  'dunmere.merchant': {
    speaker: 'Bram Hallow',
    portrait: P('merchant'),
    variants: [
      {
        if: { oldRoadCleared: true },
        lines: ['You cleared the Old Road. My wagons made the run at dawn, and every driver knew whose work made it possible.', 'I will send business your way, {guild}.'],
        choices: [
          {
            text: 'Business is welcome.',
            if: { notFlag: 'bramThanks' },
            effects: [{ gold: 40 }, { reputation: { region: 'Crownlands', amount: 5 } }, { relationship: 2 }, { flag: 'bramThanks' }],
            reply: ['Forty crowns, and my name on your door if anyone asks. Fair?'],
          },
        ],
      },
      {
        effects: [{ flag: 'oldRoadIntroduced' }],
        lines: [
          'The Old Road is wrong lately. Wolves are bold enough to take a mule in daylight, and someone is driving them closer.',
          'I posted the contract at the Notice Board. I need people who will see it through.',
        ],
        choices: [
          { text: 'Show me the contract', effects: [{ open: 'noticeBoard' }] },
          { text: 'Where is the road?', reply: ['West, over the river bridge. Walk past the last kiln and keep going. You will hear them before you see them.'] },
        ],
      },
    ],
  },
  'dunmere.fighter': {
    speaker: 'Nia Voss',
    portrait: P('fighter'),
    variants: [
      {
        if: { oldRoadCleared: true },
        effects: [{ flag: 'harvestMeleeIntroduced' }, { event: { id: 'dunmere-harvest-melee', note: 'The Dunmere Harvest Melee is held at the local arena.' } }],
        lines: ['So the stories are true. The road is open and {guild} did it. The Harvest Melee will be more interesting now.'],
        choices: [{ text: 'Show me the arena', effects: [{ open: 'arena' }] }],
      },
      {
        lines: ['I like a company that starts small. I like it better if it survives. Come back when Dunmere has a reason to remember your name.'],
        choices: [{ text: 'Any advice?', reply: ['Wolves circle. Do not chase the one in front of you; watch the two beside it.'] }],
      },
    ],
  },
  'dunmere.traveler': {
    speaker: 'Iven Quill',
    portrait: P('traveler'),
    variants: [
      {
        effects: [{ rumor: { location: 'ironford', note: 'Follow the river east. You can hear the foundries before you see the walls.' } }],
        lines: ['Ironford? Follow the river east. You can hear the foundries before you see the walls.', 'A world feels larger when you learn it from someone who has walked it.'],
        choices: [
          {
            text: 'And Greenhollow?',
            effects: [{ rumor: { location: 'greenhollow', note: 'North-east through the herb fields. Ask for the Elder Oak.' } }],
            reply: ['North-east, through the herb fields. Ask anyone for the Elder Oak; they will point you to it like it is family.'],
          },
        ],
      },
    ],
  },
  'dunmere.herald': {
    speaker: 'Orren Pike',
    portrait: P('herald'),
    variants: [
      {
        if: { tierAtLeast: 1 },
        lines: ['{guild}, promoted. I have written it on three boards and shouted it from the fountain. Twice.'],
      },
      {
        lines: ['Names are my trade. When {guild} has earned one, I will make certain Dunmere hears it.'],
        choices: [{ text: 'How do we earn one?', effects: [{ open: 'herald' }], reply: ['Contracts finished, tournaments won, rivals beaten. Come inside; the ladders are on the wall.'] }],
      },
    ],
  },
  'dunmere.kilnmaster': {
    speaker: 'Hesta Coal',
    portrait: P('kilnmaster'),
    variants: [
      {
        if: { season: 'autumn' },
        lines: ['Harvest firing. Every kiln in Dunmere burns for the festival plates. Mind your sleeves.'],
      },
      {
        if: { talked: true },
        lines: ['Back again? Ironford smiths buy my firebrick. If you are heading east, they owe me a favour.'],
      },
      {
        lines: ['You smell that? Good clay, wet wood and somebody’s ambition. Dunmere runs on all three.'],
        choices: [
          {
            text: 'Need anything carried?',
            if: { notFlag: 'hestaParcel' },
            effects: [{ item: { potion: 1 } }, { relationship: 1 }, { flag: 'hestaParcel' }],
            reply: ['Not today. Take this tonic for the road — burns going down, which is how you know it works.'],
          },
        ],
      },
    ],
  },
  'dunmere.lamplighter': {
    speaker: 'Pip',
    portrait: P('lamplighter'),
    variants: [
      {
        if: { storyStarted: true },
        lines: ['People say lanterns went out in the Blackwood all at once. I keep mine lit extra long now. Just in case.'],
      },
      {
        lines: ['Are you the new banner? I light the plaza lamps. If you need to find someone, I know who walks where after dark.'],
        choices: [{ text: 'Who should I meet?', reply: ['Bram by the Notice Board has a job. Sella at the Wayfarer knows everyone looking for one.'] }],
      },
    ],
  },

  // Points of interest.
  'dunmere.fountain': {
    speaker: 'The Banner Fountain',
    portrait: 'portrait.poi',
    variants: [
      {
        lines: [
          'Bronze banners ring the basin, one for every guild Dunmere has raised. One pole stands empty.',
          'Coins glint under the water. Someone has scratched “for the Lantern” on the rim.',
        ],
        choices: [{ text: 'Toss a crown for luck', if: { goldAtLeast: 1, notFlag: 'fountainCoin' }, effects: [{ gold: -1 }, { flag: 'fountainCoin' }], reply: ['The coin sinks next to a hundred others. It feels like joining something.'] }],
      },
    ],
  },
  'dunmere.well': {
    speaker: 'Old well',
    portrait: 'portrait.poi',
    variants: [{ lines: ['The water is cold and tastes of iron. Ironford is upstream, they say.'] }],
  },
  'dunmere.kiln': {
    speaker: 'Hesta’s kiln',
    portrait: 'portrait.poi',
    variants: [{ lines: ['A beehive kiln, still warm. Stamped plates cool on the racks: a banner, a lantern, a wolf.'] }],
  },
};
