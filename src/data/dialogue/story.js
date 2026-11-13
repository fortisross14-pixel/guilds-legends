// Story scenes for The Last Banner (docs/STORY.md; missions in src/data/story.js).
// Format: src/data/dialogue/index.js; style and voices: docs/DIALOGUE.md.
// A scene step completes when a decision is picked (unless it has { wait: true }).
// Decision scenes (`decide: true`) let the player ask questions first; the
// answers never come before the question. Lines authored in docs/STORY.md
// (the prologue, the Act I ending, Wren's banner scene) are kept as written.
// History lives in the Lore codex (src/data/lore.js).

const S = (id) => `portrait.story.${id}`;
const NARRATION = { speaker: '', portrait: 'portrait.poi' };
const narrate = (text) => ({ ...NARRATION, text });
const you = (text) => ({ speaker: 'You', portrait: 'portrait.story.founder', text });

export default {
  // ---------------------------------------------------------------- Act I: A Guild of Nobodies
  // Gideon Rusk: gruff landlord, money-minded, secretly decent.
  'story.m1.stable': {
    speaker: 'Gideon Rusk',
    portrait: S('stablemaster'),
    decide: true,
    leave: 'I need to think about it.',
    variants: [
      {
        lines: ['You’re the one with the banner. Half the plaza saw the mark on your door.', 'And now you’re staring at my yard. Thinking of renting it?'],
        choices: [
          { text: 'I’ll pay the season up front. (160 gold)', if: { goldAtLeast: 160 }, effects: [{ rentLot: 160 }], reply: ['He counts it twice. “Keys. Don’t burn it down.”'] },
          {
            text: 'Make it 100, and the Trade House hears you were fair.',
            if: { charter: 'merchant', goldAtLeast: 100 },
            effects: [{ rentLot: 100 }, { patron: { id: 'trade', amount: 3 } }],
            reply: ['“A Merchant House type. Fine. Fair’s fair, and the Trade House pays its friends.”'],
          },
          {
            text: 'You’ve got squatters in the cellar. Let us clear them out. (1 day)',
            if: { charter: 'free' },
            effects: [{ rentLot: 0 }, { passDays: 1 }],
            reply: ['By evening the cellar is empty, and Gideon is impressed despite himself.', '“Keep it, then. Rent starts next month.”'],
          },
          {
            text: 'The neighbours will help us fix your roof. (1 day)',
            if: { charter: 'shield' },
            effects: [{ rentLot: 0 }, { passDays: 1 }, { reputation: { region: 'Crownlands', amount: 4 } }],
            reply: ['Half of Kiln Row turns up with ladders. Gideon watches, shaking his head.', '“Yours. Somehow.”'],
          },
          {
            text: 'This council deed says you owe back taxes. Shall we talk price?',
            if: { charter: 'scholars', goldAtLeast: 80 },
            effects: [{ rentLot: 80 }],
            reply: ['He reads it twice and sighs. “Eighty, then, and you never saw that deed.”'],
          },
          { text: 'I can’t pay yet. Let me work it off: the loft, the roof. (2 days)', effects: [{ rentLot: 0 }, { passDays: 2 }], reply: ['Two days of hauling and hammering.', '“Fair’s fair,” Gideon says. “It’s yours.”'] },
        ],
      },
    ],
    topics: [
      { id: 'place', text: 'What is this place?', lines: ['A stable, then a guild office, then nothing. The stable came down; the cabin didn’t.', 'Two bunks in there, a leaky roof, and room for five more buildings if you ever have the coin.'] },
      { id: 'terms', text: 'What would it cost me?', lines: ['A season up front and it’s yours to build on.', 'Rent after that is monthly, like honest people.'] },
      { id: 'sell', text: 'Would you ever sell it?', lines: ['Save long enough and I might. Long enough is a long time.'] },
    ],
  },

  // Mara Fen: practical, skeptical, dry humor; calls people "love".
  'story.m2.mara': {
    speaker: 'Mara Fen',
    portrait: S('mara'),
    decide: true,
    leave: 'Maybe later.',
    variants: [
      {
        if: { flag: 'maraTrust' },
        lines: [
          'So you’re the one who opened the door to a dying man. Dunmere talks, love. I’m Mara; I run the Wayfarer.',
          'You kept your head that night, and your mouth shut. I noticed. That’s worth something in this town.',
          'Looking for a first companion? There’s a girl by the door. Good with a bow. No guild will touch her.',
        ],
        choices: [{ text: 'Introduce me.', effects: [{ codex: ['official-story', 'mara-fen'] }], reply: ['“Nessa! Somebody wants to meet you.” She waves you toward the door.'] }],
      },
      {
        lines: [
          'So you’re the one who opened the door to a dying man. Dunmere talks, love. I’m Mara; I run the Wayfarer.',
          'Looking for a first companion? There’s a girl by the door. Good with a bow. No guild will touch her.',
        ],
        choices: [{ text: 'Introduce me.', effects: [{ codex: ['official-story', 'mara-fen'] }], reply: ['“Nessa! Somebody wants to meet you.” She waves you toward the door.'] }],
      },
    ],
    topics: [
      { id: 'lantern', text: 'What do people say about the Broken Lantern?', effects: [{ codex: 'official-story' }], lines: ['The official story? Their captain sold his luck to the Hollow Warden for one great victory.', 'Then the Warden came to collect. That’s what the heralds say, anyway.'] },
      { id: 'doubt', text: 'You don’t sound like you believe it.', lines: ['I was married to an adventurer once. He never came back either.', 'So I listen when people tell stories about the woods. Most of them are wrong.'] },
      { id: 'tavern', text: 'Why does every guild start in a tavern?', lines: ['Heroes drink here, brag here, and look for work here. Mostly the first two.'] },
    ],
  },

  // Nessa Thornfield: eager, guarded about her brother.
  'story.m2.nessa': {
    speaker: 'Nessa Thornfield',
    portrait: S('nessa'),
    decide: true,
    leave: 'Let me think about it.',
    variants: [
      {
        lines: ['Mara says you’ve got a banner and no guild. I’ve got a bow and no guild.', 'Maybe we can fix both?'],
        choices: [
          { text: 'Join us. There’s a bed in the hall for you.', if: { freeBed: true }, effects: [{ storyRecruit: 'nessa' }, { codex: 'nessa-thornfield' }], reply: ['“No fee. Pay me when we win something.”'] },
          { text: 'I’ll make room for you first.', if: { freeBed: false }, effects: [{ wait: true }], reply: ['“I’ll be here. Don’t take too long.”'] },
        ],
      },
    ],
    topics: [
      { id: 'why', text: 'Why won’t the guilds hire you?', lines: ['Too young, too local, too stubborn. Pick one.', 'I’ve guided caravans through the Thornwood since I was twelve.'] },
      { id: 'want', text: 'What do you want out of this?', lines: ['To see the world past the Old Road.', 'And there’s someone I’m looking for. That can wait.'] },
      { id: 'who', text: 'Who are you looking for?', lines: ['…I said it can wait.'] },
    ],
  },

  // Corwin Pell: brisk merchant; counts everything.
  'story.m3.corwin': {
    speaker: 'Corwin Pell',
    portrait: 'portrait.dunmere.merchant',
    decide: true,
    leave: 'Not today.',
    variants: [
      {
        lines: ['You’re the new banner. Good. I need someone with nothing to lose and a sword to lose it with.'],
        choices: [{ text: 'We’ll take it.', effects: [{ flag: 'oldRoadIntroduced' }, { open: 'noticeBoard' }], reply: ['“The contract’s on the Notice Board. My seal’s on it. Don’t make me regret the wax.”'] }],
      },
    ],
    topics: [
      { id: 'job', text: 'What’s the job?', lines: ['The Wolfskins on the Old Road. Raiders in wolf pelts. They take a mule in daylight.', 'And somebody is paying them to hit my wagons.'] },
      { id: 'pay', text: 'What’s in it for us?', lines: ['Coin, and the Trade House’s memory. The second is worth more.'] },
      { id: 'who', text: 'Who would pay raiders to hit wagons?', lines: ['Someone who wants the road closed. I’d love to know who. Find out and I’ll pay extra.'] },
    ],
  },
  'story.m3.thanks': {
    speaker: 'Corwin Pell',
    portrait: 'portrait.dunmere.merchant',
    variants: [
      {
        lines: ['There they are! Three Wolfskin pelts. My drivers will sleep tonight.', 'Here. And my name on your door, if anyone asks. I’ll tell the temple you’re honest folk, too.'],
        choices: [{ text: 'Business is welcome.', effects: [{ takeItem: { 'wolf-pelt': 3 } }, { gold: 40 }], reply: ['“The Trade House will hear about this. So will Dunmere.”'] }],
      },
    ],
    leave: false,
  },

  // Orren Pike, the herald: dry, precise, quietly worried.
  'story.temple.orren': {
    speaker: 'Orren Pike',
    portrait: 'portrait.dunmere.herald',
    decide: true,
    leave: 'Another time.',
    variants: [
      {
        lines: [
          'The Old Road ends at Dawnwatch Temple. It used to be the first stop for pilgrims heading east.',
          'Now a priest called Malric holds its gate and sells passage. The Greenhollow wardens shut the Thornwood road because of him.',
          'He will not be cheap to beat. Get stronger, buy some proper steel, then go.',
        ],
        choices: [{ text: 'We’ll deal with Malric.', reply: ['“Then I’ll start writing your name in the good ledger. In pencil, for now.”'] }],
      },
    ],
    topics: [
      { id: 'who', text: 'Who is Malric?', lines: ['A brother of the Dawn who found that pilgrims pay more to pass than to pray. He calls himself an abbot now.'] },
      { id: 'how', text: 'How do we get stronger?', lines: ['Spar at the arena; the fighters there take anyone. Or walk off the road: the woods are never empty.'] },
    ],
  },
  'story.temple.thanks': {
    speaker: 'Orren Pike',
    portrait: 'portrait.dunmere.herald',
    variants: [
      {
        lines: ['Malric, gone. The wardens are opening the Thornwood road as we speak.', 'Greenhollow is east, past the gate on Arena Lane’s far end. Go and be famous somewhere new.'],
        choices: [{ text: 'We will.', reply: ['“I’ll ink your name. Properly, this time.”'] }],
      },
    ],
    leave: false,
  },

  // Bram Calder: cocky, competitive.
  'story.m4.bram': {
    speaker: 'Bram Calder',
    portrait: S('bram'),
    decide: true,
    leave: 'I’ll think about it.',
    variants: [
      {
        lines: ['So you’re the guild with the dead guild’s banner. A banner, a hunter and a house. Terrifying.', 'A banner like that belongs to real fighters. Duel me at the arena, and we’ll see if you’re one.'],
        choices: [
          {
            text: 'You’re on. First to yield, no tricks.',
            effects: [{ choice: { bram: 'respect' } }, { flag: 'harvestMeleeIntroduced' }, { event: { id: 'dunmere-harvest-melee', note: 'Bram Calder dared you into the Harvest Melee.' } }],
            reply: ['“Ha. Good. Then the Harvest Melee, if you’re still standing.”'],
          },
          {
            text: 'We’re not here to impress you.',
            effects: [{ choice: { bram: 'rival' } }, { flag: 'harvestMeleeIntroduced' }, { event: { id: 'dunmere-harvest-melee', note: 'Bram Calder dared you into the Harvest Melee.' } }],
            reply: ['“Everyone says that. Then they meet me.”'],
          },
          {
            text: 'Whatever wins.',
            effects: [{ choice: { bram: 'dirty' } }, { standing: { honor: -8, text: 'Fought Bram Calder dirty' } }, { flag: 'harvestMeleeIntroduced' }, { event: { id: 'dunmere-harvest-melee', note: 'Bram Calder dared you into the Harvest Melee.' } }],
            reply: ['His grin goes thin. “So that’s the kind of guild you are.”', '“Fine. The whole arena will see it.”'],
          },
        ],
      },
    ],
    topics: [
      { id: 'melee', text: 'What’s the Harvest Melee?', lines: ['Real fighters, real guilds, one crowd. The first proving ground of the west.'] },
      { id: 'why', text: 'Why do you care about us?', lines: ['I don’t. I care about beating someone everybody’s talking about.'] },
    ],
  },

  // The Act I ending (docs/STORY.md): authored; kept as written.
  'story.m4.warning': {
    speaker: 'The representative',
    portrait: S('representative'),
    leave: false,
    variants: [
      {
        if: { flag: 'sawEnforcer' },
        lines: [
          narrate('Outside the arena, a well-dressed man in silver and grey falls into step beside you.'),
          'An interesting banner you’ve been carrying.',
          you('What of it?'),
          'Lord Thorne wishes to congratulate you on your performance. And offer some friendly advice.',
          you('Which is?'),
          'Retire that banner before it brings you the same misfortune it brought its previous owners.',
          narrate('Behind him waits a man with a scar through one eyebrow: the face at your door. They walk away together.'),
          narrate('For the first time, you understand: the dying stranger’s warning was real.'),
        ],
        choices: [
          { text: '(Say nothing.)', effects: [{ choice: { warning: 'silent' } }] },
          { text: 'Tell Lord Thorne the banner stays.', effects: [{ choice: { warning: 'defiant' } }, { fame: 2 }] },
        ],
      },
      {
        lines: [
          narrate('Outside the arena, a well-dressed man in silver and grey falls into step beside you.'),
          'An interesting banner you’ve been carrying.',
          you('What of it?'),
          'Lord Thorne wishes to congratulate you on your performance. And offer some friendly advice.',
          you('Which is?'),
          'Retire that banner before it brings you the same misfortune it brought its previous owners.',
          narrate('He tips his hat and is gone. For the first time, you understand: the dying stranger’s warning was real.'),
        ],
        choices: [
          { text: '(Say nothing.)', effects: [{ choice: { warning: 'silent' } }] },
          { text: 'Tell Lord Thorne the banner stays.', effects: [{ choice: { warning: 'defiant' } }, { fame: 2 }] },
        ],
      },
    ],
  },
};
