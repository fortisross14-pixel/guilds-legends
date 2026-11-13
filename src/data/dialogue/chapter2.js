// Chapter 2 scenes and people added by the four-chapter plan (docs/design/STORY_DRAFT.md):
// Magister Venn (2.3), Sister Oriel and the dyes (2.4), Sela Wick and the wreckers (2.5),
// Overseer Dace and Cass Vey (2.6, the standing dead end), and the Chapter 2 errands.
// Style: docs/DIALOGUE.md.

const P = (town, id) => `portrait.${town}.${id}`;
const ORIEL = 'portrait.role.temple-acolyte';
const DACE = 'portrait.role.council-steward';
const CASS = 'portrait.role.traveller';
const narrate = (text) => ({ speaker: '', portrait: 'portrait.poi', text });

export default {
  // ---------------------------------------------------------------- 2.3 Magister Venn Ashby
  // A visiting scholar: dry, vain about his learning, honest about what he doesn't know.
  'story.c2.venn': {
    speaker: 'Venn Ashby',
    portrait: P('ironford', 'scholar'),
    decide: true,
    leave: 'Another time.',
    variants: [
      {
        lines: ['Magister Ashby, if you please. I don’t read for every banner that walks up the street.', 'Old scripts are dangerous. I read them for champions, who can protect what they learn. Win something, and come back.'],
        choices: [{ text: 'Then we’ll win something.', reply: ['Any Initiation title will do. I’m not unreasonable. Just busy.'] }],
      },
    ],
    topics: [{ id: 'why', text: 'Why only champions?', lines: ['The last scrap I read for a nobody got him killed. I prefer my readers to survive me.'] }],
  },
  'story.c2.venn2': {
    speaker: 'Venn Ashby',
    portrait: P('ironford', 'scholar'),
    decide: true,
    leave: false,
    variants: [
      {
        lines: ['A champion now. Fine. Show me.', narrate('He holds the scrap to the light for a long time.'), 'Temple script. The Dawnwatch kind. Faded past reading.', 'Their scribes could bring it back, if anyone still knows how.'],
        choices: [{ text: 'Then we go back to Dawnwatch.', effects: [{ rumor: { location: 'dunmere', note: 'Sister Oriel at Dawnwatch can restore temple script.' } }], reply: ['Bring it to me afterwards. I’m curious, and curiosity is my only vice. Nearly.'] }],
      },
    ],
  },

  // ---------------------------------------------------------------- 2.4 Sister Oriel
  // The priests' scribe: precise, patient, faintly amused by everything.
  'dunmere.oriel': {
    speaker: 'Sister Oriel',
    portrait: ORIEL,
    variants: [
      { if: { talked: true }, lines: ['Back again. Mind the ink; it’s older than you.'] },
      { lines: ['Sister Oriel. I copy the temple’s books, and I mend the ones Malric let rot.'] },
    ],
    topics: [{ id: 'books', text: 'What do you copy?', lines: ['Prayers, mostly. Names. A few recipes for dye, which are holier than people think.'] }],
    bye: { text: 'Thank you, Sister.', lines: ['Go gently. Carry your scrolls flat.'] },
  },
  'story.c2.oriel': {
    speaker: 'Sister Oriel',
    portrait: ORIEL,
    decide: true,
    leave: 'I’ll come back.',
    variants: [
      {
        lines: ['Temple script, and badly faded. Someone wrote this in a hurry, in poor ink.', 'I can bring it back. I need three dyes I don’t have: ochre, woad and sea purple.'],
        choices: [{ text: 'Where do I find them?', reply: ['Ochre on the Iron Road heights. Woad on the ledges of the cliff road. Sea purple from the shells on the coast road.', 'Other people want them too. Mind yourselves.'] }],
      },
    ],
  },
  'story.c2.oriel2': {
    speaker: 'Sister Oriel',
    portrait: ORIEL,
    decide: true,
    leave: false,
    variants: [
      {
        if: { hasItem: { ochre: 1, woad: 1, 'sea-purple': 1 } },
        lines: ['All three. Give me an hour.', narrate('She works by the hearth. The letters come up out of the paper, one by one.'), '“The seven did not die in the fire. Ask the cliff champion who paid him to lose.”'],
        choices: [
          {
            text: 'The cliff champion. Windmere.',
            effects: [{ takeItem: { ochre: 1, woad: 1, 'sea-purple': 1, 'old-scrap': 1 } }, { giveItem: { 'restored-papyrus': 1 } }, { rumor: { location: 'windmere', note: 'The restored scrap: ask the cliff champion who paid him to lose.' } }],
            reply: ['Windmere has had one champion worth the name. Halden Marsh. He’ll be old now.'],
          },
        ],
      },
      { lines: ['Ochre, woad and sea purple. All three, or the letters stay asleep.'], choices: [{ text: 'We’re working on it.', effects: [{ wait: true }] }] },
    ],
  },

  // ---------------------------------------------------------------- 2.5 Sela Wick (Windmere courier)
  'story.c2.sela': {
    speaker: 'Sela Wick',
    portrait: P('windmere', 'courier'),
    decide: true,
    leave: 'Later.',
    variants: [
      {
        lines: ['Halden Marsh? Everyone knows where he lives. Nobody tells strangers.', 'Wreckers have been looting carts on the coast road all season. Get rid of them, and Windmere might start liking you.'],
        choices: [{ text: 'We’ll clear the coast road.', reply: ['North of the road, near the cliffs. They’re not small.'] }],
      },
    ],
  },
  'story.c2.sela2': {
    speaker: 'Sela Wick',
    portrait: P('windmere', 'courier'),
    decide: true,
    leave: false,
    variants: [
      {
        lines: ['The carts came in whole this morning. Windmere noticed.', 'For Marsh, talk to Overseer Dace at the docks. He’s known Marsh forty years. He’s particular about who he talks to.'],
        choices: [{ text: 'Dace, then.' }],
      },
    ],
  },
  'story.c2.sela3': {
    speaker: 'Sela Wick',
    portrait: P('windmere', 'courier'),
    decide: true,
    leave: false,
    variants: [
      {
        lines: ['Dace shut his door on you? He does that to anyone he thinks is crooked.', 'Then try Cass Vey. She fences half of what the wreckers stole, and she likes your sort better.'],
        choices: [{ text: 'Cass Vey. Thanks.' }],
      },
    ],
  },

  // ---------------------------------------------------------------- 2.6 Two Doors
  // Overseer Dace: upright, stiff, decent; judges by reputation.
  'windmere.dace': {
    speaker: 'Overseer Dace',
    portrait: DACE,
    variants: [
      { if: { talked: true }, lines: ['The docks don’t run themselves. What is it?'] },
      { lines: ['Overseer Dace. I keep these docks honest, which is harder than keeping them busy.'] },
    ],
    topics: [{ id: 'docks', text: 'Busy season?', lines: ['Busy, honest and short-handed. Pick two.'] }],
    bye: { text: 'Good day, Overseer.', lines: ['Mind the ropes.'] },
  },
  'story.c2.dace': {
    speaker: 'Overseer Dace',
    portrait: DACE,
    decide: true,
    leave: false,
    variants: [
      {
        if: { honorBand: 'honourable' },
        lines: ['Marsh? I know your guild’s name. People say it with respect, which is rare.', 'He never misses a final in his old ring. Reach one, and he’ll come down to the sand.'],
        choices: [{ text: 'Thank you, Overseer.', effects: [{ flag: 'marshFound' }] }],
      },
      {
        if: { honorBand: 'neutral' },
        lines: ['Marsh doesn’t want visitors, and I don’t know you.', 'The dock widows’ fund could use a donation. People who give to it tend to be people I talk to.'],
        choices: [
          { text: 'For the widows. (100 gold)', if: { goldAtLeast: 100 }, effects: [{ gold: -100 }, { flag: 'marshFound' }, { standing: { honor: 2, text: 'Gave to Windmere’s dock widows' } }], reply: ['Generous. He never misses a final in his old ring. Reach one, and he’ll find you.'] },
          { text: 'Not today.', reply: ['Then neither is Marsh.'] },
        ],
      },
      {
        lines: ['I know what your guild has been doing. I won’t send people like you to Halden Marsh.'],
        choices: [{ text: 'Then we’ll find another way.', reply: ['I’m sure you will. You people always do.'] }],
      },
    ],
  },
  // Cass Vey: a fence; amused, mercenary, quick.
  'windmere.cass': {
    speaker: 'Cass Vey',
    portrait: CASS,
    variants: [
      { if: { talked: true }, lines: ['Buying or selling?'] },
      { lines: ['Cass. I buy what people would rather not keep. And I sell it to people who wouldn’t ask where it came from.'] },
    ],
    topics: [{ id: 'trade', text: 'Good business?', lines: ['The wreckers kept me in silk. Somebody ran them off, rude of them.'] }],
    bye: { text: 'Goodbye, Cass.', lines: ['Come back with something shiny.'] },
  },
  'story.c2.cass': {
    speaker: 'Cass Vey',
    portrait: CASS,
    decide: true,
    leave: false,
    variants: [
      {
        if: { honorBand: 'wicked' },
        lines: ['Dace sent you packing? Then you’re my kind of guild.', 'Marsh never misses a final in Windmere’s ring. Make one, and the old man walks right up to you. Free of charge, for a friend.'],
        choices: [{ text: 'Good to know, Cass.', effects: [{ flag: 'marshFound' }] }],
      },
      {
        if: { honorBand: 'neutral' },
        lines: ['Information costs. Marsh costs a little more than most.'],
        choices: [
          { text: 'Here. (100 gold)', if: { goldAtLeast: 100 }, effects: [{ gold: -100 }, { flag: 'marshFound' }], reply: ['He never misses a final in Windmere’s ring. Make one.'] },
          { text: 'Too rich for us.', reply: ['Then you’ll have to be nicer to Dace.'] },
        ],
      },
      {
        lines: ['A guild with a reputation for kindness? I don’t deal with saints. Bad for business.'],
        choices: [{ text: 'Fine.', reply: ['Try Dace. He likes your sort.'] }],
      },
    ],
  },

  // ---------------------------------------------------------------- Chapter 2 errands
  'story.e7.smith': {
    speaker: 'Corr Anvilson',
    portrait: P('ironford', 'smith'),
    decide: true,
    leave: 'Not now.',
    variants: [
      {
        lines: ['No ore since the toll gang sat on the bridge. My forge is going cold.', 'Six lumps from the Iron Road and I’ll pay you like a guild, not like a carter.'],
        choices: [{ text: 'Six lumps. Done.', reply: ['South of the road, near Greenhollow. Bring a strong back.'] }],
      },
    ],
  },
  'story.e7.smith.done': {
    speaker: 'Corr Anvilson',
    portrait: P('ironford', 'smith'),
    decide: true,
    leave: false,
    variants: [
      {
        if: { hasItem: { 'iron-ore': 6 } },
        lines: ['Good, honest ore. My forge thanks you.'],
        choices: [{ text: 'Here it is. (90 gold)', effects: [{ takeItem: { 'iron-ore': 6 } }, { gold: 90 }, { relationship: 2 }], reply: ['If you ever need a blade mended, come to me first.'] }],
      },
      { lines: ['Six lumps, I said.'], choices: [{ text: 'Coming.', effects: [{ wait: true }] }] },
    ],
  },
  'story.e9.sela': {
    speaker: 'Sela Wick',
    portrait: P('windmere', 'courier'),
    decide: true,
    leave: 'Not now.',
    variants: [
      {
        lines: ['A letter for Dagna Hale, the foundry foreman in Ironford. Sealed, and it stays sealed.', 'Nobody will take the cliff road this season. You will. I pay on delivery.'],
        choices: [{ text: 'Sealed it stays.', effects: [{ giveItem: { 'sealed-letter': 1 } }], reply: ['Good. Dagna pays better than I do, anyway.'] }],
      },
    ],
  },
  'story.e9.dagna': {
    speaker: 'Dagna Hale',
    portrait: P('ironford', 'foreman'),
    decide: true,
    leave: false,
    variants: [
      {
        if: { hasItem: { 'sealed-letter': 1 } },
        lines: ['A letter from Sela? Through the cliff road? You’re braver than my carters.'],
        choices: [
          { text: 'Sealed, as promised. (70 gold)', effects: [{ takeItem: { 'sealed-letter': 1 } }, { gold: 70 }, { standing: { honor: 2, text: 'Carried Sela’s letter to Ironford unopened' } }], reply: ['Seal’s whole. Good. You’ll do.'] },
        ],
      },
      { lines: ['Nothing for me today?'], choices: [{ text: 'Not yet.', effects: [{ wait: true }] }] },
    ],
  },
  'wild.coast.wreck': {
    speaker: 'A wrecked wagon',
    portrait: 'portrait.poi',
    leave: 'Move on',
    variants: [
      {
        if: { notFlag: 'wreckDone' },
        lines: ['A merchant’s wagon on its side, half sunk in the sand. Most of it was looted. A strongbox is still lashed under the seat, with a Windmere merchant’s mark.'],
        choices: [
          { text: 'Keep what’s inside.', effects: [{ flag: 'wreckDone' }, { gold: 90 }, { standing: { honor: -4, text: 'Kept a wrecked merchant’s strongbox' } }], reply: ['Silver and a few rings. Nobody will know. Probably.'] },
          { text: 'Carry it to Windmere for its owner.', effects: [{ flag: 'wreckDone' }, { gold: 40 }, { standing: { honor: 6, text: 'Returned a wrecked merchant’s strongbox to Windmere' } }, { reputation: { region: 'Crownlands', amount: 6 } }], reply: ['The merchant’s widow cries, and pays you a reward she can’t afford. You take some of it.'] },
        ],
      },
      { lines: ['A wrecked wagon, picked clean.'] },
    ],
  },

  // ---------------------------------------------------------------- Errands for one standing only
  'story.g2.dace': {
    speaker: 'Overseer Dace',
    portrait: DACE,
    decide: true,
    leave: 'Not now.',
    variants: [
      {
        lines: ['A press-gang has been taking fishermen off the coast road and selling them to ships. The law is slow.', 'You aren’t. Free them, and Windmere will remember your name kindly.'],
        choices: [{ text: 'We’ll free them.', reply: ['They camp in the dunes at the east end, by the water.'] }],
      },
    ],
  },
  'story.w2.cass': {
    speaker: 'Cass Vey',
    portrait: CASS,
    decide: true,
    leave: 'Not now.',
    variants: [
      {
        lines: ['The lighthouse keeper owes me for six months of oil. His sons think that makes them clever.', 'Go and explain arithmetic to them. Keep a fifth.'],
        choices: [
          {
            text: 'Arithmetic it is.',
            effects: [
              { standing: { honor: -6, dread: 6, text: 'Collected a debt for Cass Vey with fists' } },
              { battle: { id: 'keeper-sons', name: 'The lighthouse keeper’s sons', types: ['harbor-brute', 'shell-guard', 'harbor-brute'], names: ['Big Tam', 'Little Tam', 'Rolf'], count: 3, level: 17, objective: 'Teach them arithmetic.', onWin: { flag: 'keeperCollected' } } },
            ],
            reply: ['Don’t break the lamp. I sell the oil.'],
          },
        ],
      },
    ],
  },
};
