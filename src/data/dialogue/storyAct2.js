// Act II scenes for The Last Banner (docs/STORY.md: missions 5–8 and the end of
// Chapter 1). Format: src/data/dialogue/index.js; missions in src/data/story.js.

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
  'story.m5.maren': {
    speaker: 'Maren Bell',
    portrait: S('herbalist'),
    variants: withNessa(
      [
        'The Broken Lantern? I swore I would never say that name again. People who say it out loud don’t sleep well.',
        'I’ve a sick village up the valley and no nightcap. The Thornwood edge is full of it, and full of things that bite.',
        'Bring me a basket and I’ll tell you what I saw. That’s the price.',
      ],
      'Please. It matters more than you know.',
      1,
    ).map((variant) => ({
      ...variant,
      choices: [
        { text: 'We’ll bring your nightcap.', reply: ['“Mind the stalkers. They like healers’ messengers.”'] },
        { text: 'Show her the seven names from the banner', if: { flag: 'knowsSeven' }, effects: [{ route: 'patients' }], reply: ['Her hands shake. “Tobin. Ilse. I stitched them both.” She sits down. “Ask.”'] },
        {
          text: 'Ask the families you helped to speak for you',
          if: { charter: 'shield' },
          effects: [{ route: 'patients' }],
          reply: ['Three of her patients vouch for your guild before she can refuse. Maren sighs. “Fine. Sit.”'],
        },
      ],
    })),
  },
  'story.m5.testimony': {
    speaker: 'Maren Bell',
    portrait: S('herbalist'),
    variants: [
      {
        lines: [
          'Three of them came to me, two weeks after the Crownfall. Ilse Calloway, the healer, and two of the young ones. Bruised, cut, scared.',
          'They’d been followed since Mooncourt. Men in plain cloaks with good boots, the kind a rich guild buys.',
          'They were going into the Blackwood to lose them. I told them nobody loses anything in the Blackwood. It keeps it.',
        ],
        choices: [{ text: 'Will you say this in front of a magistrate?', reply: ['“If it comes to that. I’m old. They can’t take much more from me.”'] }],
      },
    ],
  },
  'story.m5.nessa': {
    speaker: 'Nessa Thornfield',
    portrait: S('nessa'),
    variants: [
      {
        lines: [
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
  'story.m6.keeper': {
    speaker: 'Oswin Tull',
    portrait: S('quartermaster'),
    variants: [
      {
        if: { flag: 'sawEnforcer' },
        lines: [
          'I keep the archive. Forty years of contracts, receipts and lies, all filed by date.',
          you('A man with a scar through one eyebrow came to my door the night Rook died.'),
          'Vesk. Thorne’s dog. Then you know they’ll come for me too, and you know I’m not lying.',
          'Yes, I was the Argent Crown’s quartermaster. I kept a ledger they didn’t know about. Insurance.',
          'It’s in the vault. The council watches it, and so do Thorne’s people. Getting it out won’t be quiet.',
        ],
      },
      {
        lines: [
          'I keep the archive. Forty years of contracts, receipts and lies, all filed by date.',
          'Yes, I was the Argent Crown’s quartermaster. I kept a ledger they didn’t know about. Insurance.',
          'It’s in the vault. The council watches it, and so do Thorne’s people. Getting it out won’t be quiet.',
        ],
      },
    ].map((variant) => ({
      ...variant,
      choices: [
        { text: 'Slip into the vault after hours (Intrigue contract)', reply: ['“Tuesday. The night clerk drinks.”'] },
        { text: 'Win over the archive council (Diplomacy contract)', effects: [{ route: 'negotiate' }], reply: ['“They like flattery and paperwork. Bring both.”'] },
        { text: 'Buy it outright: 300 gold', if: { charter: 'merchant', goldAtLeast: 300 }, effects: [{ gold: -300 }, { route: 'buy' }], reply: ['He counts it slowly. “Insurance pays out at last.” The ledger is under the floorboard.'] },
        { text: 'Go through the guards (Combat contract)', if: { charter: 'free' }, effects: [{ route: 'force' }], reply: ['“Subtle. I’ll be somewhere else.”'] },
        { text: 'Work out the cipher from the public copy (Expedition contract)', if: { charter: 'scholars' }, effects: [{ route: 'decipher' }], reply: ['“You read quartermaster’s cipher? Then the copy upstairs is all you need.”'] },
      ],
    })),
  },
  'story.m6.read': {
    speaker: 'Oswin Tull',
    portrait: S('quartermaster'),
    variants: withNessa(
      [
        narrate('Columns of small, careful numbers. Dates. Names.'),
        'There. “Road work, Blackwood. Four hundred crowns.” Signed off by the Crown’s treasury, spring of ’83.',
        'And there: “Special services, G.T.” Three times. Garrick Thorne paid someone out of his own purse.',
      ],
      '“Seven heads, Thornfield included.” They wrote my brother’s name in a ledger. Like a mule.',
      3,
    ).map((variant) => ({ ...variant, choices: [{ text: 'This comes with us.', effects: [{ codex: 'ironford-ledger' }] }] })),
  },
  // ---------------------------------------------------------------- 7. The Fighter Who Never Lost
  'story.m7.halden': {
    speaker: 'Halden Marsh',
    portrait: S('champion'),
    variants: [
      {
        lines: [
          narrate('On the cliff ring above Windmere, an old man is sparring with the wind.'),
          'You carry that banner like it’s heavy. Good. It should be.',
          'I fought Aldric Vane at the Crownfall. Semifinal, 1183. He beat me fair. People say otherwise now.',
          'I don’t talk to strangers about it. I talk to fighters. Fight in the Cliff Duels, then fight me.',
        ],
        choices: [
          { text: 'We’ll fight in the Cliff Duels.', reply: ['“Sign up at the arena here. I’ll be watching.”'] },
          { text: 'Why wait? Fight me now.', if: { charter: 'free' }, effects: [{ choice: { m7: 'challenge' } }], reply: ['He laughs. “A Free Company. Fine. The ring, when you’re ready.”'] },
          {
            text: 'Read him Rook’s confession',
            if: { evidence: 'confession' },
            effects: [{ choice: { m7: 'confession' } }],
            reply: ['He reads it twice. “Rook. The old fool finally said it.” He hands it back. “Sit. I’ll tell you about the final.”'],
          },
        ],
      },
    ],
  },
  'story.m7.testimony': {
    speaker: 'Halden Marsh',
    portrait: S('champion'),
    variants: [
      {
        if: { choice: { bram: 'respect' }, notStoryHero: 'bram' },
        lines: [
          'The final against the Argent Crown was clean. I watched every bout. Aldric’s people were faster, braver, better.',
          'The Crown didn’t lose to a curse. They lost to seven nobodies, and Rook couldn’t stand it.',
          'I’ll swear to it, in front of anyone. Here.',
          narrate('He presses a gull feather into your hand: the old Cliff Duels token.'),
          bram('Lost to the old man too. You’re going after the Crown, aren’t you? Then you’ll need a Duelist who doesn’t lose twice.'),
        ],
        choices: [
          { text: 'Welcome aboard, Bram.', if: { freeBed: true }, effects: [{ storyRecruit: 'bram' }, { choice: { bram: 'joined' } }], reply: [bram('Don’t make me regret it. I’m expensive to regret.')] },
          { text: 'Stay a rival. We’ll meet in the ring.', effects: [{ choice: { bram: 'rival' } }], reply: [bram('Suits me. Try to keep up.')] },
        ],
      },
      {
        lines: [
          'The final against the Argent Crown was clean. I watched every bout. Aldric’s people were faster, braver, better.',
          'The Crown didn’t lose to a curse. They lost to seven nobodies, and Rook couldn’t stand it.',
          'I’ll swear to it, in front of anyone. Here.',
          narrate('He presses a gull feather into your hand: the old Cliff Duels token. In the crowd, Bram Calder watches with his arms crossed, then leaves without a word.'),
        ],
        choices: [{ text: 'Thank you, Halden.' }],
      },
    ],
  },
  // ---------------------------------------------------------------- 8. The Last Scout
  'story.m8.linnet': {
    speaker: 'Linnet',
    portrait: S('wren'),
    variants: [
      {
        lines: [
          narrate('A trapper called Linnet sells furs at the edge of Greenhollow market. She sees the lantern on your banner pin and goes white.'),
          'Don’t. Not here. They’re already in town.',
          'Two men asking for a girl who came out of the Blackwood four years ago. Argent Crown boots.',
          you('We’re not with them. We carry the banner because a dying man asked us to.'),
          '…Then help me live through the next three days. After that, we’ll talk.',
        ],
        choices: [
          { text: 'Stand and fight them (Combat contract)', reply: ['“Thornwood edge, my hut. They’ll come at night.”'] },
          { text: 'Get her out of town quietly (Intrigue contract)', effects: [{ route: 'spirit' }], reply: ['“The herb carts leave at dawn. I can hide under a lot of nightcap.”'] },
          { text: 'Ask the families you helped to hide her (Diplomacy contract)', if: { charter: 'shield' }, effects: [{ route: 'doors' }], reply: ['“You know people who’d do that? For me?”'] },
        ],
      },
    ],
  },
  'story.m8.account': {
    speaker: 'Wren',
    portrait: S('wren'),
    variants: withNessa(
      [
        'My name is Wren. I was the Broken Lantern’s scout.',
        'The Argent Crown sent mercenaries to kill us on the forest road. We fought. Dunstan held the road. Ilse kept us breathing until she couldn’t.',
        'But Garrick Thorne hired an occultist too, to bind the Hollow Warden. Anyone who ran from the ambush ran into it.',
        'It took Pell. It took Tobin.',
        'Aldric led the rest of us deeper, away from the mercenaries. He sent me back for help. I never found the way back in.',
        'The story about Aldric selling us to the Warden? Thorne made it up to hide what he did.',
      ],
      'Tobin. My brother. Is he… could he still be in there?',
      4,
    ).map((variant) => ({
      ...variant,
      choices: [
        { text: 'Come back with us. A hall, a guild, people who stand with you.', effects: [{ choice: { wren: 'return' } }, { codex: ['wren', 'blackwood-ambush'] }], reply: [wren('…I’ll come and see this hall of yours. That’s all I’m promising.')] },
        { text: 'Stay hidden. We’ll keep your secret, and carry your testimony.', effects: [{ choice: { wren: 'hidden' } }, { codex: ['wren', 'blackwood-ambush'] }], reply: [wren('Thank you. I’ll come to your hall once. I want to see something first.')] },
      ],
    })),
  },
  'story.m8.banner': {
    speaker: 'Wren',
    portrait: S('wren'),
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
