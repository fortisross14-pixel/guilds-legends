// Dunmere conversations. Format: src/data/dialogue/index.js.
import { patronChoices } from './patronTalk.js';
const P = (id) => `portrait.dunmere.${id}`;

// Corwin speaks for the Dunmere Trade House (src/data/patrons.js).
const TRADE = patronChoices('trade', 'Trade House', {
  ally: 'Allies. The House opens its books to you, and its warehouses.',
  partner: 'Partners. There is a charter contract on the board each month with your name on it.',
  contact: 'A name in the ledger, and a good one. Keep taking our work and the prices get kinder.',
  stranger: 'Honestly? A guild we have not done business with yet. Our contracts carry our seal on the board.',
  gift: 'Corwin weighs the purse and smiles. “The House notices courtesy.”',
});

export default {
  'dunmere.innkeeper': {
    speaker: 'Mara Fen',
    portrait: P('innkeeper'),
    variants: [
      {
        if: { charter: 'shield', talked: false },
        lines: [
          'Shield of the People? Then half of Dunmere likes you already. The other half will, once you earn it.',
          'The rooms upstairs are yours. Come in when you are ready to meet Dunmere’s strays and strivers.',
        ],
        choices: [
          { text: 'Introduce me to someone', if: { candidateHere: true }, effects: [{ recruit: true }] },
          { text: 'Go inside', effects: [{ open: 'tavern' }] },
        ],
      },
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
    speaker: 'Corwin Pell',
    portrait: P('merchant'),
    variants: [
      {
        if: { patronRival: 'trade' },
        lines: ['The Trade House keeps two lists. You are on the other one now.', 'Bring us profit and an apology, in that order, and we will see.'],
        choices: [...TRADE],
      },
      {
        if: { oldRoadCleared: true },
        lines: ['You cleared the Old Road. My wagons made the run at dawn, and every driver knew whose work made it possible.', 'I will send business your way, {guild}.'],
        choices: [
          {
            text: 'Business is welcome.',
            if: { notFlag: 'bramThanks' },
            effects: [{ gold: 40 }, { reputation: { region: 'Crownlands', amount: 5 } }, { relationship: 2 }, { patron: { id: 'trade', amount: 8 } }, { flag: 'bramThanks' }],
            reply: ['Forty crowns, and my name on your door if anyone asks. The Trade House will hear about this.'],
          },
          ...TRADE,
        ],
      },
      {
        if: { charter: 'merchant' },
        effects: [{ flag: 'oldRoadIntroduced' }],
        lines: [
          'A Merchant House charter! Finally, a guild that reads the ledger before it draws a sword.',
          'The Old Road is eating our mules and our margins. The contract is on the Notice Board, and the Trade House remembers who takes its work.',
        ],
        choices: [{ text: 'Show me the contract', effects: [{ open: 'noticeBoard' }] }, ...TRADE],
      },
      {
        effects: [{ flag: 'oldRoadIntroduced' }],
        lines: [
          'The Old Road is wrong lately. Wolves are bold enough to take a mule in daylight, and someone is driving them closer.',
          'I posted the contract at the Notice Board. The Trade House backs it, and we pay people who see things through.',
        ],
        choices: [
          { text: 'Show me the contract', effects: [{ open: 'noticeBoard' }] },
          { text: 'Where is the road?', reply: ['West, over the river bridge. Walk past the last kiln and keep going. You will hear them before you see them.'] },
          ...TRADE,
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
        if: { charter: 'free' },
        lines: ['A Free Company. No patron to hide behind and no ledger to blame. I respect that. I will be watching.'],
        choices: [{ text: 'Any advice?', reply: ['Wolves circle. Do not chase the one in front of you; watch the two beside it.'] }],
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
        if: { charter: 'scholars' },
        lines: ['The Scholars’ Lodge! I keep a shelf of rumors nobody can prove. Borrow it any time.', 'And when {guild} earns a name, I will make certain Dunmere hears it.'],
        choices: [{ text: 'How do we earn one?', effects: [{ open: 'herald' }], reply: ['Contracts finished, tournaments won, rivals beaten. Come inside; the ladders are on the wall.'] }],
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
        choices: [{ text: 'Who should I meet?', reply: ['Corwin by the Notice Board has a job. Mara at the Wayfarer knows everyone looking for one.'] }],
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
