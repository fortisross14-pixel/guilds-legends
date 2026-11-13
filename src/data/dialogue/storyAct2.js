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
  you('He called himself Rook.'),
  narrate('She draws her dagger.'),
  wren('Rook. He gave you that? Then he’s alive. And so is the man who sent us into the Blackwood.'),
  you('It was your banner.'),
  wren('No. It was ours. The last time I saw it, it was in the Crown’s camp while my friends were dying.'),
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
        { text: 'Then I’ll find your son.', reply: ['“Tobin is at the arena most days. Tell him I sent you. He’ll know what to do.”'] },
        {
          text: 'The Lantern’s medal came with this banner. We carry it honestly.',
          if: { honorBand: 'honourable', hasItem: { 'lantern-medal': 1 } },
          effects: [{ flag: 'marenTrusts' }],
          reply: ['She holds the medal a long time. “Aldric wore this.”', '“Your name has reached Greenhollow, and it’s a good one. Sit. I’ll tell you.”'],
        },
        {
          text: 'Talk, or your son gets hurt in that ring.',
          if: { honorBand: 'wicked' },
          effects: [{ flag: 'marenTrusts' }, { standing: { honor: -10, dread: 8, text: 'Threatened Maren’s son to make her talk' } }],
          reply: ['Her face goes grey. “…You’re what they warned me about.”', '“Sit. Ask your questions, and then leave my house.”'],
        },
        { text: 'Tobin. Ilse. Aldric. These names were in our banner. Did you know them?', if: { flag: 'knowsSeven' }, effects: [{ flag: 'marenTrusts' }], reply: ['Her hands shake. “Tobin. Ilse. I stitched them both.”', 'She sits down. “Ask.”'] },
        {
          text: 'The families we’ve helped will vouch for us.',
          if: { charter: 'shield' },
          effects: [{ flag: 'marenTrusts' }],
          reply: ['Three of her patients speak for your guild before she can refuse.', 'Maren sighs. “Fine. Sit.”'],
        },
      ],
    })),
    topics: [
      { id: 'price', text: 'What would it take for you to talk?', lines: ['You carry a dead guild’s banner, and you want me to trust you with what I saw.', 'My son Tobin is a warden. Let him test your arm in the ring. If he says you’re honest steel, I’ll talk.'] },
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
    ).map((variant) => ({
      ...variant,
      lines: [...variant.lines, narrate('Where a page has been torn out, someone has tucked a scrap of paper in an old script. Nobody in the archive can read it.')],
      choices: [{ text: 'This comes with us. The scrap too.', effects: [{ codex: 'ironford-ledger' }, { giveItem: { 'old-scrap': 1 } }] }],
    })),
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
            text: 'Read this. A man called Rook dropped it at my door.',
            if: { evidence: 'confession' },
            effects: [{ choice: { m7: 'confession' } }],
            reply: ['He reads it twice, and his face changes. “Rook. So he’s still alive.”', 'He hands it back. “Sit. I’ll tell you about the final.”'],
          },
          {
            text: 'This medal was tied to the Lantern’s banner. It’s ours to carry now.',
            if: { hasItem: { 'lantern-medal': 1 }, honorBand: 'honourable' },
            effects: [{ choice: { m7: 'medal' } }],
            reply: ['He turns the medal over in his hands. “Aldric’s. He wore it at the final.”', '“Sit. People who carry this deserve the truth.”'],
          },
          {
            text: 'You have grandchildren in Windmere, old man. Talk, and they stay safe.',
            if: { honorBand: 'wicked' },
            effects: [{ choice: { m7: 'threat' } }, { standing: { honor: -10, dread: 10, text: 'Threatened Halden Marsh’s family' } }],
            reply: ['He goes very still. “You’re no better than the ones who paid me.”', '“Sit, then. And when this is over, never come back to my ring.”'],
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
          'The Crown didn’t lose to a curse. They lost to seven nobodies, and someone high in the Crown couldn’t stand it.',
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
          'The Crown didn’t lose to a curse. They lost to seven nobodies, and someone high in the Crown couldn’t stand it.',
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
      { id: 'us', text: 'We’re not with them. A wounded stranger asked us to carry this banner.', lines: ['…Then help me live through the next three days. After that, we’ll talk.'] },
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
