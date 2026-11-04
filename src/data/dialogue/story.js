// Story scenes for The Last Banner (docs/STORY.md; missions in src/data/story.js).
// Format: src/data/dialogue/index.js. A scene step completes when a choice is
// picked (unless the choice has { wait: true }). Dialogue stays short: the
// history lives in the Lore codex (src/data/lore.js).
import { OFFICIAL_STORY } from '../lore.js';

const S = (id) => `portrait.story.${id}`;
const NARRATION = { speaker: '', portrait: 'portrait.poi' };
const narrate = (text) => ({ ...NARRATION, text });
const you = (text) => ({ speaker: 'You', portrait: 'portrait.story.founder', text });

// Mara noticed what you did with the body (the prologue's 'hide' choice).
const maraLines = (noticed) => [
  'So you’re the one who opened the door to a dying man. Dunmere talks, love. I’m Mara. I run the Wayfarer.',
  ...(noticed ? ['You kept your head that night, and your mouth shut. I noticed. That’s worth something in this town.'] : []),
  'Every guild starts in a tavern. Heroes drink here, brag here, and look for work here.',
  you('What do people say about the Broken Lantern?'),
  `The official story? ${OFFICIAL_STORY} That’s what the heralds say, anyway.`,
  'I was married to an adventurer once. He never came back either. So I listen when people tell stories about the woods.',
  'Want a first companion? There’s a girl by the door. Hunter, good with a bow. No guild will touch her.',
];
const MARA_CHOICES = [{ text: 'Introduce me', effects: [{ codex: ['official-story', 'mara-fen'] }], reply: ['“Nessa! Somebody wants to meet you.” She waves you toward the door.'] }];

export default {
  // ---------------------------------------------------------------- Act I: A Guild of Nobodies
  'story.m1.stable': {
    speaker: 'Gideon Rusk',
    portrait: S('stablemaster'),
    variants: [
      {
        lines: [
          'You’re the one with the banner. Half the plaza saw the mark on your door.',
          'This was a stable, then a guild office, then nothing. The stable came down years ago; what is left is the yard. A cabin in the middle with two bunks, a leaky roof, and room for five more buildings if you ever have the coin.',
          you('I need a hall. A real one.'),
          'Everybody needs something. A season up front and it’s yours to build on. Rent after that is monthly, like honest people. Save long enough and I might even sell.',
        ],
        choices: [
          { text: 'Pay a season up front (160 gold)', if: { goldAtLeast: 160 }, effects: [{ rentLot: 160 }], reply: ['He counts it twice. “Keys. Don’t burn it down.”'] },
          {
            text: 'Haggle: 100 gold, and the Trade House hears you were fair',
            if: { charter: 'merchant', goldAtLeast: 100 },
            effects: [{ rentLot: 100 }, { patron: { id: 'trade', amount: 3 } }],
            reply: ['“A Merchant House man. Fine. Fair’s fair, and the Trade House pays its friends.”'],
          },
          {
            text: 'Run off the squatters in the cellar (1 day)',
            if: { charter: 'free' },
            effects: [{ rentLot: 0 }, { passDays: 1 }],
            reply: ['By evening the cellar is empty and Gideon is impressed despite himself. “Keep it, then. Rent starts next month.”'],
          },
          {
            text: 'Ask the neighbours to help fix the roof (1 day)',
            if: { charter: 'shield' },
            effects: [{ rentLot: 0 }, { passDays: 1 }, { reputation: { region: 'Crownlands', amount: 4 } }],
            reply: ['Half of Kiln Row turns up with ladders. Gideon watches, shaking his head. “Yours. Somehow.”'],
          },
          {
            text: 'Show him the council deed: he owes back taxes',
            if: { charter: 'scholars', goldAtLeast: 80 },
            effects: [{ rentLot: 80 }],
            reply: ['He reads it twice and sighs. “Eighty, then, and you never saw that deed.”'],
          },
          { text: 'Work it off: clear the loft and patch the roof (2 days)', effects: [{ rentLot: 0 }, { passDays: 2 }], reply: ['Two days of hauling and hammering. “Fair’s fair,” Gideon says. “It’s yours.”'] },
        ],
      },
    ],
  },
  'story.m2.mara': {
    speaker: 'Mara Fen',
    portrait: S('mara'),
    variants: [
      { if: { flag: 'maraTrust' }, lines: maraLines(true), choices: MARA_CHOICES },
      { lines: maraLines(false), choices: MARA_CHOICES },
    ],
  },
  'story.m2.nessa': {
    speaker: 'Nessa Thornfield',
    portrait: S('nessa'),
    variants: [
      {
        lines: [
          'Mara says you’ve got a banner and no guild. I’ve got a bow and no guild. Maybe we can fix both.',
          you('Why won’t the guilds hire you?'),
          'Too young, too local, too stubborn. Pick one. I’ve guided caravans through the Thornwood since I was twelve.',
          'I want to see the world past the Old Road. And there’s someone I’m looking for. That can wait.',
        ],
        choices: [
          { text: 'Join us. There’s a bed in the hall for you.', if: { freeBed: true }, effects: [{ storyRecruit: 'nessa' }, { codex: 'nessa-thornfield' }], reply: ['“No fee. Pay me when we win something.”'] },
          { text: 'I’ll make room for you first.', if: { freeBed: false }, effects: [{ wait: true }], reply: ['“I’ll be here. Don’t take too long.”'] },
        ],
      },
    ],
  },
  'story.m3.corwin': {
    speaker: 'Corwin Pell',
    portrait: 'portrait.dunmere.merchant',
    variants: [
      {
        lines: [
          'You’re the new banner. Good. I need someone with nothing to lose and a sword to lose it with.',
          'Wolves on the Old Road. Bold ones. They take a mule in daylight, and somebody is driving them toward my wagons.',
          'The contract is on the Notice Board. Clear the road and the Trade House will remember your name.',
        ],
        choices: [{ text: 'We’ll take it.', effects: [{ flag: 'oldRoadIntroduced' }, { open: 'noticeBoard' }] }],
      },
    ],
  },
  'story.m3.thanks': {
    speaker: 'Corwin Pell',
    portrait: 'portrait.dunmere.merchant',
    variants: [
      {
        lines: ['You cleared the Old Road. My wagons made the run at dawn, and every driver knew whose work made it possible.', 'Here. And my name on your door, if anyone asks.'],
        choices: [{ text: 'Business is welcome.', effects: [{ gold: 40 }], reply: ['“The Trade House will hear about this. So will Dunmere.”'] }],
      },
    ],
  },
  'story.m4.bram': {
    speaker: 'Bram Calder',
    portrait: S('bram'),
    variants: [
      {
        lines: [
          'So you’re the guild everybody’s whispering about. A banner, a hunter and a house. Terrifying.',
          'The Harvest Melee is coming. Real fighters, real guilds. Sign up at the arena and I’ll show you what a Duelist looks like.',
        ],
        choices: [
          {
            text: 'See you in the ring.',
            effects: [{ choice: { bram: 'respect' } }, { flag: 'harvestMeleeIntroduced' }, { event: { id: 'dunmere-harvest-melee', note: 'Bram Calder dared you into the Harvest Melee.' } }, { open: 'arena' }],
            reply: ['“Ha. Good. Don’t embarrass me by losing early.”'],
          },
          {
            text: 'Why wait for the Melee?',
            if: { charter: 'free' },
            effects: [{ choice: { bram: 'respect' } }, { flag: 'harvestMeleeIntroduced' }, { event: { id: 'dunmere-harvest-melee', note: 'Bram Calder dared you into the Harvest Melee.' } }, { open: 'arena' }],
            reply: ['He grins. “Because the Melee has a crowd. Save it for the ring, Free Company.”'],
          },
          {
            text: 'We’re not here to impress you.',
            effects: [{ choice: { bram: 'rival' } }, { flag: 'harvestMeleeIntroduced' }, { event: { id: 'dunmere-harvest-melee', note: 'Bram Calder dared you into the Harvest Melee.' } }, { open: 'arena' }],
            reply: ['“Everyone says that. Then they meet me.”'],
          },
        ],
      },
    ],
  },
  'story.m4.warning': {
    speaker: 'The representative',
    portrait: S('representative'),
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
          { text: '“Tell Lord Thorne the banner stays.”', effects: [{ choice: { warning: 'defiant' } }, { fame: 2 }] },
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
          { text: '“Tell Lord Thorne the banner stays.”', effects: [{ choice: { warning: 'defiant' } }, { fame: 2 }] },
        ],
      },
    ],
  },
};
