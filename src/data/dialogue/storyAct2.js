// Act II scenes for The Last Banner (docs/STORY.md: missions 5–8 and the end of
// Chapter 1). Format: src/data/dialogue/index.js; style and voices: docs/DIALOGUE.md.
// Wren's banner scene (BANNER) is authored in docs/STORY.md and kept as written.

const S = (id) => `portrait.story.${id}`;
const narrate = (text) => ({ speaker: '', portrait: 'portrait.poi', text });
const you = (text) => ({ speaker: 'You', portrait: S('founder'), text });
const nessa = (text) => ({ speaker: 'Nessa Thornfield', portrait: S('nessa'), text });
const bram = (text) => ({ speaker: 'Bram Calder', portrait: S('bram'), text });
const wren = (text) => ({ speaker: 'Wren', portrait: S('wren'), text });

/** The same lines, with Nessa's line added when she is in the guild. */
const withNessa = (lines, line, at) => [
  { if: { storyHero: 'nessa' }, lines: [...lines.slice(0, at), nessa(line), ...lines.slice(at)] },
  { lines },
];

const BANNER = [
  narrate('Wren comes to your Guild Hall. The banner hangs on the wall. She freezes.'),
  wren('Where did you get that?'),
  you('A man brought it to me.'),
  wren('Who?'),
  you('Cassian Rook.'),
  narrate('She draws her dagger.'),
  wren('Then burn it.'),
  you('It was your banner.'),
  wren('No. It was ours. And he carried it away while my friends were dying.'),
  narrate('Carrying a heroic symbol doesn’t make you a hero. You will have to earn the right to it.'),
];

export default {
  // ---------------------------------------------------------------- 5. The Herbalist's Witness
  // Maren Bell: tired, sharp-tongued, kind underneath.
  'story.m5.maren': {
    speaker: 'Maren Bell',
    portrait: S('herbalist'),
    decide: true,
    leave: 'We’ll come back.',
    variants: withNessa(
      [
        'You’re asking about the Broken Lantern. I swore I’d never say that name again.',
        'People who say it out loud don’t sleep well. What do you want from an old herbalist?',
      ],
      'Please. It matters more than you know.',
      2,
    ).map((variant) => ({
      ...variant,
      choices: [
        { text: 'We’ll bring your nightcap.', reply: ['“Mind the stalkers. They like healers’ messengers.”'] },
        { text: 'Tobin. Ilse. Aldric. These names were in our banner. Did you know them?', if: { flag: 'knowsSeven' }, effects: [{ route: 'patients' }], reply: ['Her hands shake. “Tobin. Ilse. I stitched them both.”', 'She sits down. “Ask.”'] },
        {
          text: 'The families we’ve helped will vouch for us.',
          if: { charter: 'shield' },
          effects: [{ route: 'patients' }],
          reply: ['Three of her patients speak for your guild before she can refuse.', 'Maren sighs. “Fine. Sit.”'],
        },
      ],
    })),
    topics: [
      { id: 'price', text: 'What would it take for you to talk?', lines: ['I’ve a sick village up the valley and no nightcap. The Thornwood edge is full of it.', 'Bring me a basket, and I’ll tell you what I saw.'] },
      { id: 'afraid', text: 'Who are you afraid of?', lines: ['People with good boots and plain cloaks. You’ll know them when you see them.'] },
    ],
  },
  'story.m5.testimony': {
    speaker: 'Maren Bell',
    portrait: S('herbalist'),
    leave: false,
    variants: [
      {
        lines: [
          'You kept your end. All right. A deal’s a deal.',
          'Three of them came to me, two weeks after the Crownfall. Ilse Calloway, the healer, and two of the young ones.',
          'They’d been followed since Mooncourt. Men in plain cloaks with good boots, the kind a rich guild buys.',
          'They were going into the Blackwood to lose them. I told them nobody loses anything in the Blackwood.',
          'It keeps it.',
        ],
        choices: [{ text: 'Will you say this in front of a magistrate?', reply: ['“If it comes to that. I’m old. They can’t take much more from me.”'] }],
      },
    ],
  },
  // Nessa Thornfield: eager, guarded about her brother (the guard drops here).
  'story.m5.nessa': {
    speaker: 'Nessa Thornfield',
    portrait: S('nessa'),
    leave: false,
    variants: [
      {
        lines: [
          'Can I… talk to you? Away from the others.',
          'One of the young ones she stitched up. Tobin Thornfield. That’s my brother. He rode with the Broken Lantern.',
          'I didn’t tell you because everyone says they were cursed. Traitors. I didn’t want you to look at me like that.',
          'I joined you because you carry their banner. I want to know what happened to him.',
        ],
        choices: [
          { text: 'Then we find out together.', effects: [{ choice: { nessa: 'together' } }, { heroLoyalty: { id: 'nessa', amount: 10 } }], reply: ['She nods once, and doesn’t trust her voice for a while.'] },
          { text: 'You should have told me.', effects: [{ choice: { nessa: 'hurt' } }, { heroLoyalty: { id: 'nessa', amount: -5 } }], reply: ['“I know. I’m telling you now.”'] },
        ],
      },
    ],
  },
  // ---------------------------------------------------------------- 6. The Ledger of Ironford
  // Oswin Tull: dry, precise, frightened under it.
  'story.m6.keeper': {
    speaker: 'Oswin Tull',
    portrait: S('quartermaster'),
    decide: true,
    leave: 'We’ll think it over.',
    variants: [
      {
        lines: ['You’re asking about the Argent Crown. People who ask about the Crown get visits.', '…Yes. I was their quartermaster. And I kept a ledger they didn’t know about. Insurance.'],
        choices: [
          { text: 'We’ll slip into the vault after hours. (Intrigue contract)', reply: ['“Tuesday. The night clerk drinks.”'] },
          { text: 'We’ll win over the archive council. (Diplomacy contract)', effects: [{ route: 'negotiate' }], reply: ['“They like flattery and paperwork. Bring both.”'] },
          { text: 'Name your price. Three hundred gold? (Buy it)', if: { charter: 'merchant', goldAtLeast: 300 }, effects: [{ gold: -300 }, { route: 'buy' }], reply: ['He counts it slowly. “Insurance pays out at last.”', 'The ledger is under the floorboard.'] },
          { text: 'We’ll go through the guards. (Combat contract)', if: { charter: 'free' }, effects: [{ route: 'force' }], reply: ['“Subtle. I’ll be somewhere else.”'] },
          { text: 'We can read quartermaster’s cipher. Where’s the public copy? (Expedition contract)', if: { charter: 'scholars' }, effects: [{ route: 'decipher' }], reply: ['“You read the cipher? Then the copy upstairs is all you need.”'] },
        ],
      },
    ],
    topics: [
      { id: 'where', text: 'Where is the ledger now?', lines: ['In the vault. The council watches it, and so do Thorne’s people.', 'Getting it out won’t be quiet.'] },
      { id: 'scar', text: 'A man with a scar through one eyebrow came to my door.', if: { flag: 'sawEnforcer' }, lines: ['Vesk. Thorne’s dog.', 'Then you know they’ll come for me too. And you know I’m not lying.'] },
      { id: 'why', text: 'Why help us?', lines: ['Because insurance is only worth anything if someone collects. And I’m tired.'] },
    ],
  },
  'story.m6.read': {
    speaker: 'Oswin Tull',
    portrait: S('quartermaster'),
    leave: false,
    variants: withNessa(
      [
        narrate('Columns of small, careful numbers. Dates. Names.'),
        'There. “Road work, Blackwood. Four hundred gold.” Signed off by the Crown’s treasury, spring of ’83.',
        'And there: “Special services, G.T.” Three times. Garrick Thorne paid someone out of his own purse.',
      ],
      '“Seven heads, Thornfield included.” They wrote my brother’s name in a ledger. Like a mule.',
      3,
    ).map((variant) => ({ ...variant, choices: [{ text: 'This comes with us.', effects: [{ codex: 'ironford-ledger' }] }] })),
  },
  // ---------------------------------------------------------------- 7. The Fighter Who Never Lost
  // Halden Marsh: old, proud, laconic; respects only fighters.
  'story.m7.halden': {
    speaker: 'Halden Marsh',
    portrait: S('champion'),
    decide: true,
    leave: 'Another time.',
    variants: [
      {
        lines: [narrate('On the cliff ring above Windmere, an old man is sparring with the wind.'), 'You carry that banner like it’s heavy. Good. It should be.', 'What do you want with an old fighter?'],
        choices: [
          { text: 'We’ll fight in the Cliff Duels.', reply: ['“Sign up at the arena here. I’ll be watching.”'] },
          { text: 'Why wait? Fight me now.', if: { charter: 'free' }, effects: [{ choice: { m7: 'challenge' } }], reply: ['He laughs. “A Free Company. Fine. The ring, when you’re ready.”'] },
          {
            text: 'Read this. Rook wrote it before he died.',
            if: { evidence: 'confession' },
            effects: [{ choice: { m7: 'confession' } }],
            reply: ['He reads it twice. “Rook. The old fool finally said it.”', 'He hands it back. “Sit. I’ll tell you about the final.”'],
          },
        ],
      },
    ],
    topics: [
      { id: 'aldric', text: 'You fought Aldric Vane?', lines: ['At the Crownfall. Semifinal, 1183. He beat me fair. People say otherwise now.'] },
      { id: 'talk', text: 'Will you tell us about the final?', lines: ['I don’t talk to strangers about it. I talk to fighters.', 'Fight in the Cliff Duels. Then fight me.'] },
    ],
  },
  'story.m7.testimony': {
    speaker: 'Halden Marsh',
    portrait: S('champion'),
    leave: false,
    variants: [
      {
        if: { choice: { bram: 'respect' }, notStoryHero: 'bram' },
        lines: [
          'Sit. You’ve earned the story.',
          'The final against the Argent Crown was clean. I watched every bout. Aldric’s people were faster, braver, better.',
          'The Crown didn’t lose to a curse. They lost to seven nobodies, and Rook couldn’t stand it.',
          'I’ll swear to it, in front of anyone. Here.',
          narrate('He presses a gull feather into your hand: the old Cliff Duels token.'),
          bram('Lost to the old man too. You’re going after the Crown, aren’t you?'),
          bram('Then you’ll need a Duelist who doesn’t lose twice.'),
        ],
        choices: [
          { text: 'Welcome aboard, Bram.', if: { freeBed: true }, effects: [{ storyRecruit: 'bram' }, { choice: { bram: 'joined' } }], reply: [bram('Don’t make me regret it. I’m expensive to regret.')] },
          { text: 'Stay a rival. We’ll meet in the ring.', effects: [{ choice: { bram: 'rival' } }], reply: [bram('Suits me. Try to keep up.')] },
        ],
      },
      {
        lines: [
          'Sit. You’ve earned the story.',
          'The final against the Argent Crown was clean. I watched every bout. Aldric’s people were faster, braver, better.',
          'The Crown didn’t lose to a curse. They lost to seven nobodies, and Rook couldn’t stand it.',
          'I’ll swear to it, in front of anyone. Here.',
          narrate('He presses a gull feather into your hand: the old Cliff Duels token.'),
          narrate('In the crowd, Bram Calder watches with his arms crossed, then leaves without a word.'),
        ],
        choices: [{ text: 'Thank you, Halden.' }],
      },
    ],
  },
  // ---------------------------------------------------------------- 8. The Last Scout
  // Wren (as "Linnet"): wary, sharp; short sentences, watches the exits.
  'story.m8.linnet': {
    speaker: 'Linnet',
    portrait: S('wren'),
    decide: true,
    leave: 'We’ll leave you be. For now.',
    variants: [
      {
        lines: [
          narrate('A trapper called Linnet sells furs at the edge of Greenhollow market. She sees the lantern on your banner pin and goes white.'),
          'Don’t. Not here. They’re already in town.',
        ],
        choices: [
          { text: 'Then we stand and fight them. (Combat contract)', reply: ['“Thornwood edge, my hut. They’ll come at night.”'] },
          { text: 'We’ll get you out of town, quietly. (Intrigue contract)', effects: [{ route: 'spirit' }], reply: ['“The herb carts leave at dawn. I can hide under a lot of nightcap.”'] },
          { text: 'The families we’ve helped will hide you. (Diplomacy contract)', if: { charter: 'shield' }, effects: [{ route: 'doors' }], reply: ['“You know people who’d do that? For me?”'] },
        ],
      },
    ],
    topics: [
      { id: 'who', text: 'Who’s in town?', lines: ['Two men asking for a girl who came out of the Blackwood four years ago.', 'Argent Crown boots.'] },
      { id: 'us', text: 'We’re not with them. A dying man asked us to carry this banner.', lines: ['…Then help me live through the next three days. After that, we’ll talk.'] },
    ],
  },
  'story.m8.account': {
    speaker: 'Wren',
    portrait: S('wren'),
    leave: false,
    variants: withNessa(
      [
        'You kept your word. So I’ll keep mine.',
        'My name is Wren. I was the Broken Lantern’s scout.',
        'The Argent Crown sent mercenaries to kill us on the forest road. We fought.',
        'Dunstan held the road. Ilse kept us breathing until she couldn’t.',
        'But Garrick Thorne hired an occultist too, to bind the Hollow Warden. Anyone who ran from the ambush ran into it.',
        'It took Pell. It took Tobin.',
        'Aldric led the rest of us deeper, away from the mercenaries. He sent me back for help.',
        'I never found the way back in.',
        'The story about Aldric selling us to the Warden? Thorne made it up to hide what he did.',
      ],
      'Tobin. My brother. Is he… could he still be in there?',
      6,
    ).map((variant) => ({
      ...variant,
      choices: [
        { text: 'Come back with us. A hall, a guild, people who stand with you.', effects: [{ choice: { wren: 'return' } }, { codex: ['wren', 'blackwood-ambush'] }], reply: [wren('…I’ll come and see this hall of yours. That’s all I’m promising.')] },
        { text: 'Stay hidden. We’ll keep your secret, and carry your testimony.', effects: [{ choice: { wren: 'hidden' } }, { codex: ['wren', 'blackwood-ambush'] }], reply: [wren('Thank you. I’ll come to your hall once. I want to see something first.')] },
      ],
    })),
  },
  // Wren's banner scene (docs/STORY.md, the emotional centerpiece): authored.
  'story.m8.banner': {
    speaker: 'Wren',
    portrait: S('wren'),
    leave: false,
    variants: [
      {
        if: { choice: { wren: 'return' }, any: [{ storyHero: 'nessa' }, { flag: 'knowsSeven' }] },
        lines: [...BANNER, wren('…You know their names. Every one of them.'), narrate('She lowers the dagger, slowly.'), wren('Then earn it. I’ll be watching. From inside your hall.')],
        choices: [
          { text: 'Welcome home, Wren.', if: { freeBed: true }, effects: [{ storyRecruit: 'wren' }, { choice: { wrenOutcome: 'companion' } }] },
          { text: 'We’ll fight beside you, then. (No free bed for her yet.)', if: { freeBed: false }, effects: [{ choice: { wrenOutcome: 'ally' } }, { flag: 'wrenAlly' }] },
        ],
      },
      {
        if: { choice: { wren: 'return' } },
        lines: [...BANNER, wren('I’ll fight with you. I won’t wear your colors. Not yet.')],
        choices: [{ text: 'That’s enough for now.', effects: [{ choice: { wrenOutcome: 'ally' } }, { flag: 'wrenAlly' }] }],
      },
      {
        lines: [...BANNER, wren('I’ll help you bring them down. Then I disappear again. Don’t look for me.')],
        choices: [{ text: 'We won’t.', effects: [{ choice: { wrenOutcome: 'helper' } }, { flag: 'wrenHelper' }] }],
      },
    ].map((variant) => ({ ...variant, choices: variant.choices.map((choice) => ({ ...choice, effects: [...(choice.effects || []), { codex: ['aldric-deeper', 'hollow-warden'] }] })) })),
  },
};
