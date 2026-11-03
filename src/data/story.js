// The Last Banner (docs/STORY.md): the main story as data. Engine: src/game/engine/story.js.
//
// A mission opens when its `gate` or any of its `alternatives` holds (conditions:
// src/data/dialogue/index.js). It then walks its `steps` in order:
//   scene     a conversation (src/data/dialogue/story.js). `npc` = play it when the
//             player talks to that town NPC; otherwise it plays on arrival at `at`
//             ('hall' = at home in Dunmere). Picking a choice completes the step,
//             unless the choice has the { wait: true } effect.
//   contract  a story contract on the notice board at the step's place. `contracts`
//             is keyed by route (set by a scene choice: { route: 'force' }); a route
//             with `skip: true` completes the step without a contract.
//   check     done when `if` holds (a tournament played, a sign-up, a hall…).
//   duel      a one-on-one story duel, started from the quest log or the arena.
// Any step can have `skipIf`. Steps carry `text` (the objective) and, for the
// tutorial (Act I), a `hint` and a `screen` for the Go button.
// `rewards`: gold, fame, legacy, items, patron { id, amount }, region { id, amount },
// codex [ids], evidence id. Missions 9–12 are Chapter 2 stubs.

export const STORY_TITLE = 'The Last Banner';

export const CHAPTERS = {
  1: { title: 'Chapter 1: The Names They Erased', acts: [1, 2] },
  2: { title: 'Chapter 2: The Crown Must Fall', acts: [3], teaser: 'Garrick Thorne knows you have the banner, and maybe the confession. The Blackwood is waiting, and so is the Crownfall.' },
};

export const ACTS = {
  1: { title: 'Act I: A Guild of Nobodies', tutorial: true },
  2: { title: 'Act II: The Names They Erased' },
  3: { title: 'Act III: The Crown Must Fall' },
};

/** Evidence against Garrick Thorne (mission 11 and the endings weigh it). */
export const EVIDENCE = [
  { id: 'confession', name: 'Rook’s confession', text: 'An unfinished letter in Cassian Rook’s hand, sealed with his signet.', from: 'Prologue (search his belongings)' },
  { id: 'herbalist', name: 'The herbalist’s testimony', text: 'Maren Bell will swear the Broken Lantern were followed into the Blackwood.', from: 'Mission 5' },
  { id: 'ledger', name: 'The Ironford ledger', text: 'Argent Crown payments for “road work, Blackwood”.', from: 'Mission 6' },
  { id: 'champion', name: 'The champion’s testimony', text: 'Halden Marsh will swear the 1183 Crownfall final was won fairly.', from: 'Mission 7' },
  { id: 'wren', name: 'Wren’s testimony', text: 'The last scout’s account of the ambush and the Warden.', from: 'Mission 8' },
  { id: 'remains', name: 'The Blackwood remains', text: 'What lies in the deep wood.', from: 'Chapter 2', chapter: 2 },
];

/** Heroes who join only through the story (src/game/engine/story.js storyRecruitInPlace). */
export const STORY_HEROES = {
  nessa: {
    id: 'story-nessa',
    name: 'Nessa Thornfield',
    classId: 'Ranger',
    primal: 'Plant',
    rarity: 'Rare',
    level: 2,
    age: 19,
    personality: 'Restless',
    flaw: 'Recklessness',
    dream: 'Avenge family',
    origin: 'Hunter',
    loyalty: 72,
    potential: 90,
    salary: 14,
    hook: 'A hunter and guide no reputable guild would hire. She wants adventure, and she is looking for someone she does not name yet.',
  },
  bram: {
    id: 'story-bram',
    name: 'Bram Calder',
    classId: 'Duelist',
    primal: 'Fire',
    rarity: 'Rare',
    level: 5,
    age: 24,
    personality: 'Vain',
    flaw: 'Pride',
    dream: 'Become champion',
    origin: 'Artisan',
    loyalty: 60,
    potential: 88,
    salary: 30,
    hook: 'Dunmere’s loudest Duelist, who once called your guild a joke. Better than he looks, and he knows it.',
  },
  wren: {
    id: 'story-wren',
    name: 'Wren',
    classId: 'Rogue',
    primal: 'Air',
    rarity: 'Epic',
    level: 7,
    age: 23,
    personality: 'Cautious',
    flaw: 'Melancholy',
    dream: 'Never lose a companion',
    origin: 'Refugee',
    loyalty: 58,
    potential: 94,
    salary: 34,
    hook: 'The Broken Lantern’s last scout. She came back from the Blackwood alone and has not stopped running since.',
  },
};

const regional = ['dunmere-harvest-melee', 'greenhollow-thorn-cup', 'ironford-hammer-trials', 'windmere-cliff-duels'];

export const STORY_MISSIONS = [
  // ---------------------------------------------------------------- Act I (the tutorial)
  {
    id: 'm1',
    number: 1,
    act: 1,
    chapter: 1,
    title: 'A Banner Without a Hall',
    locationId: 'dunmere',
    summary: 'A banner needs a roof. The old stable on Banner Plaza has stood empty for years, and its owner might rent it to a nobody.',
    gate: { text: 'After the prologue', if: { prologueDone: true } },
    alternatives: [{ text: 'Skipping the tutorial rents it for you', if: { tutorialSkipped: true } }],
    steps: [
      {
        id: 'stable',
        kind: 'scene',
        scene: 'story.m1.stable',
        at: 'dunmere',
        npc: 'dunmere.stablemaster',
        text: 'Talk to Gideon Rusk about the old stable on Banner Plaza.',
        hint: 'Walk to the man by the stable door (tap him), and rent it: pay, haggle or work it off.',
        screen: 'town',
      },
    ],
    rewards: { legacy: 3, codex: ['dunmere'] },
  },
  {
    id: 'm2',
    number: 2,
    act: 1,
    chapter: 1,
    title: 'The Tavern at the Crossroads',
    locationId: 'dunmere',
    summary: 'Every guild starts in a tavern. Mara Fen at the Wayfarer knows everybody in Dunmere, including a hunter nobody will hire.',
    gate: { text: 'Rent the hall (mission 1)', if: { storyDone: 'm1' } },
    alternatives: [{ text: 'Skipping the tutorial hires Nessa for you', if: { tutorialSkipped: true } }],
    steps: [
      { id: 'mara', kind: 'scene', scene: 'story.m2.mara', at: 'dunmere', npc: 'dunmere.innkeeper', text: 'Meet Mara Fen at the Wayfarer.', hint: 'Mara stands outside the Wayfarer tavern. Tap her.', screen: 'town' },
      { id: 'nessa', kind: 'scene', scene: 'story.m2.nessa', at: 'dunmere', npc: 'dunmere.nessa', text: 'Talk to the young hunter Mara pointed out.', hint: 'Nessa waits by the tavern. Ask her to join: she is free, and she needs a bed in your hall.', screen: 'town' },
    ],
    rewards: { codex: ['mara-fen', 'nessa-thornfield'] },
  },
  {
    id: 'm3',
    number: 3,
    act: 1,
    chapter: 1,
    title: 'Wolves on the Old Road',
    locationId: 'dunmere',
    summary: 'A merchant’s wagons keep losing mules to wolves on the Old Road. Protect them, and Dunmere will learn your name.',
    gate: { text: 'Hire your first companion (mission 2)', if: { storyDone: 'm2' } },
    alternatives: [{ text: 'Skipping the tutorial clears the road for you', if: { tutorialSkipped: true } }],
    steps: [
      { id: 'corwin', kind: 'scene', scene: 'story.m3.corwin', at: 'dunmere', npc: 'dunmere.merchant', text: 'Hear out Corwin Pell, the road merchant.', hint: 'Corwin stands by the Notice Board in the plaza.', screen: 'town' },
      {
        id: 'contract',
        kind: 'contract',
        text: 'Take “Wolves on the Old Road” at the Notice Board and win the fight.',
        hint: 'Open the Notice Board, put yourself and Nessa in the party and send it. You go too, so time passes until the fight.',
        screen: 'missions',
        contracts: { default: { templateId: 'wolves-old-road', locationId: 'dunmere' } },
      },
      { id: 'thanks', kind: 'scene', scene: 'story.m3.thanks', at: 'dunmere', npc: 'dunmere.merchant', text: 'Tell Corwin the road is clear.', hint: 'Back in Dunmere, tap Corwin for your thanks (and a first bit of reputation).', screen: 'town' },
    ],
    rewards: { fame: 4, region: { id: 'Crownlands', amount: 10 }, patron: { id: 'trade', amount: 8 } },
  },
  {
    id: 'm4',
    number: 4,
    act: 1,
    chapter: 1,
    title: 'The Dunmere Harvest Melee',
    locationId: 'dunmere',
    summary: 'A local Duelist thinks your guild is a joke and dares you into the Harvest Melee. Here you will see how strong the real guilds are.',
    gate: { text: 'Clear the Old Road (mission 3)', if: { storyDone: 'm3' } },
    alternatives: [{ text: 'Any regional tournament counts if you miss the Melee', if: { storyDone: 'm3' } }],
    steps: [
      { id: 'bram', kind: 'scene', scene: 'story.m4.bram', at: 'dunmere', npc: 'dunmere.fighter', text: 'Answer Bram Calder’s challenge.', hint: 'Bram is by the arena on Arena Lane. Tap him.', screen: 'town' },
      {
        id: 'signup',
        kind: 'check',
        if: { any: [{ signedUp: 'dunmere-harvest-melee' }, { tournamentPlayed: 'any' }] },
        text: 'Sign up for the Dunmere Harvest Melee at the arena.',
        hint: 'Open the arena, tap the sign-up desk and pick your entrant.',
        screen: 'tournaments',
      },
      {
        id: 'fight',
        kind: 'check',
        if: { tournamentPlayed: 'any' },
        text: 'Be in Dunmere when the Melee starts, and fight.',
        hint: 'Rest at the Guild Hall (Rest and pass time…) until the Melee starts, then tap the fighting ground in the arena.',
        screen: 'hall',
      },
      { id: 'warning', kind: 'scene', scene: 'story.m4.warning', at: 'dunmere', text: 'Someone is waiting for you outside the arena.', hint: 'Stay in Dunmere after the tournament.', screen: 'town' },
    ],
    rewards: { fame: 5, legacy: 4, codex: ['garrick-thorne', 'argent-crown', 'crownfall', 'bram-calder'] },
  },
  // ---------------------------------------------------------------- Act II
  {
    id: 'm5',
    number: 5,
    act: 2,
    chapter: 1,
    title: 'The Herbalist’s Witness',
    locationId: 'greenhollow',
    summary: 'A retired herbalist in Greenhollow treated wounded Broken Lantern heroes after the Crownfall. She has not spoken of it since.',
    gate: { text: 'Win 3 contracts after the Melee', if: { storyDone: 'm4', contractsWon: 3 } },
    alternatives: [
      { text: 'or reach Contact with the Temple of the Dawn', if: { storyDone: 'm4', patronAtLeast: { temple: 'contact' } } },
      { text: 'or become Known in the Verdant Marches', if: { storyDone: 'm4', regionLevel: { 'Verdant Marches': 1 } } },
    ],
    steps: [
      { id: 'maren', kind: 'scene', scene: 'story.m5.maren', at: 'greenhollow', npc: 'greenhollow.herbalist', text: 'Find Maren Bell, the herbalist, in Greenhollow.' },
      {
        id: 'errand',
        kind: 'contract',
        text: 'Do Maren’s errand: bring back nightcap from the Thornwood edge.',
        contracts: {
          default: { approach: 'Expedition', locationId: 'greenhollow', title: 'The Herbalist’s Errand', stakes: 'Maren Bell needs nightcap from the Thornwood edge before she will talk.', difficulty: 46, risk: 2, reward: 160, fame: 6, duration: 1 },
          patients: { skip: true },
        },
      },
      { id: 'testimony', kind: 'scene', scene: 'story.m5.testimony', at: 'greenhollow', npc: 'greenhollow.herbalist', text: 'Hear what Maren saw.' },
      { id: 'nessa', kind: 'scene', scene: 'story.m5.nessa', at: 'greenhollow', text: 'Nessa has something to tell you.', skipIf: { notStoryHero: 'nessa' } },
    ],
    rewards: { evidence: 'herbalist', legacy: 6, items: { 'marens-satchel': 1 }, patron: { id: 'temple', amount: 6 }, codex: ['herbalist-account', 'the-seven'] },
  },
  {
    id: 'm6',
    number: 6,
    act: 2,
    chapter: 1,
    title: 'The Ledger of Ironford',
    locationId: 'ironford',
    summary: 'A former Argent Crown quartermaster hid records of payments to mercenaries in Ironford’s archive.',
    gate: { text: 'Win 6 contracts in all', if: { storyDone: 'm5', contractsWon: 6 } },
    alternatives: [
      { text: 'or reach Contact with the Smiths’ Guild', if: { storyDone: 'm5', patronAtLeast: { smiths: 'contact' } } },
      { text: 'or become Known in the Crownlands', if: { storyDone: 'm5', regionLevel: { Crownlands: 1 } } },
    ],
    steps: [
      { id: 'keeper', kind: 'scene', scene: 'story.m6.keeper', at: 'ironford', npc: 'ironford.archivist', text: 'Find the old quartermaster in Ironford’s archive.' },
      {
        id: 'ledger',
        kind: 'contract',
        text: 'Get the ledger out of the archive.',
        contracts: {
          default: { approach: 'Intrigue', locationId: 'ironford', title: 'The Ledger of Ironford', stakes: 'Slip into the archive vault after hours and copy the quartermaster’s ledger.', difficulty: 54, risk: 3, reward: 220, fame: 10, duration: 1 },
          negotiate: { approach: 'Diplomacy', locationId: 'ironford', title: 'The Keeper’s Price', stakes: 'Win over the archive council so Oswin Tull can hand the ledger over in the open.', difficulty: 52, risk: 2, reward: 180, fame: 10, duration: 2 },
          force: { approach: 'Combat', locationId: 'ironford', title: 'Ledger by Force', stakes: 'Argent Crown enforcers guard the vault. Go through them.', difficulty: 56, risk: 3, reward: 240, fame: 12, duration: 1 },
          decipher: { approach: 'Expedition', locationId: 'ironford', title: 'The Cipher Copy', stakes: 'The archive’s public copy is written in a quartermaster’s cipher. Work it out from the foundry tallies.', difficulty: 48, risk: 1, reward: 160, fame: 10, duration: 1 },
          buy: { skip: true },
        },
      },
      { id: 'read', kind: 'scene', scene: 'story.m6.read', at: 'ironford', text: 'Read the ledger.' },
    ],
    rewards: { evidence: 'ledger', legacy: 6, patron: { id: 'smiths', amount: 6 }, codex: ['ironford-ledger'] },
  },
  {
    id: 'm7',
    number: 7,
    act: 2,
    chapter: 1,
    title: 'The Fighter Who Never Lost',
    locationId: 'windmere',
    summary: 'An aging champion in Windmere fought Aldric Vane at the 1183 Crownfall. He knows what really happened in the final, if you can earn his respect.',
    gate: { text: 'Reach 60 fame', if: { storyDone: 'm6', fameAtLeast: 60 } },
    alternatives: [
      { text: 'or fight in any Windmere Cliff Duels', if: { storyDone: 'm6', tournamentPlayed: 'windmere-cliff-duels' } },
      { text: 'or have a level 5 Duelist in the guild', if: { storyDone: 'm6', heroClass: { classId: 'Duelist', level: 5 } } },
    ],
    steps: [
      { id: 'halden', kind: 'scene', scene: 'story.m7.halden', at: 'windmere', text: 'Find Halden Marsh in Windmere.' },
      {
        id: 'duels',
        kind: 'check',
        if: { tournamentPlayed: 'windmere-cliff-duels' },
        skipIf: { any: [{ choice: { m7: 'challenge' } }, { choice: { m7: 'confession' } }] },
        text: 'Fight in the Windmere Cliff Duels (sign up at the Windmere arena; any result).',
      },
      {
        id: 'duel',
        kind: 'duel',
        at: 'windmere',
        skipIf: { choice: { m7: 'confession' } },
        opponent: { id: 'story-halden', name: 'Halden Marsh', classId: 'Duelist', primal: 'Air', rarity: 'Epic', level: 8, age: 61 },
        text: 'Duel Halden Marsh at the Windmere arena.',
      },
      { id: 'testimony', kind: 'scene', scene: 'story.m7.testimony', at: 'windmere', text: 'Hear Halden’s story of the 1183 final.' },
    ],
    rewards: { evidence: 'champion', legacy: 8, fame: 6, items: { 'gull-feather': 1 }, codex: ['fair-final', 'cliff-duels'] },
  },
  {
    id: 'm8',
    number: 8,
    act: 2,
    chapter: 1,
    title: 'The Last Scout',
    locationId: 'greenhollow',
    summary: 'Wren, the Broken Lantern’s scout, lives under another name near the Thornwood. People are hunting her.',
    gate: { text: 'Hold 3 pieces of evidence', if: { storyDone: 'm7', evidenceAtLeast: 3 } },
    alternatives: [
      { text: 'or have Nessa in the guild at 70+ loyalty', if: { storyDone: 'm7', storyHeroLoyalty: { id: 'nessa', at: 70 } } },
      { text: 'or reach Partner with the Temple of the Dawn', if: { storyDone: 'm7', patronAtLeast: { temple: 'partner' } } },
    ],
    steps: [
      { id: 'linnet', kind: 'scene', scene: 'story.m8.linnet', at: 'greenhollow', text: 'Find the trapper called Linnet in Greenhollow.' },
      {
        id: 'hunters',
        kind: 'contract',
        text: 'Protect her from the hunters.',
        contracts: {
          default: { approach: 'Combat', locationId: 'greenhollow', title: 'The Last Scout', stakes: 'Argent Crown hunters are closing on the trapper’s hut at the Thornwood edge. Get there first.', difficulty: 58, risk: 3, reward: 260, fame: 14, duration: 1 },
          spirit: { approach: 'Intrigue', locationId: 'greenhollow', title: 'Out of Sight', stakes: 'Spirit her out of Greenhollow under the hunters’ noses.', difficulty: 56, risk: 2, reward: 200, fame: 10, duration: 1 },
          doors: { approach: 'Diplomacy', locationId: 'greenhollow', title: 'Every Door in Greenhollow', stakes: 'Ask the families you helped to hide her, one house at a time.', difficulty: 46, risk: 1, reward: 160, fame: 12, duration: 1 },
        },
      },
      { id: 'account', kind: 'scene', scene: 'story.m8.account', at: 'greenhollow', text: 'Hear Wren’s account of the Blackwood.' },
      { id: 'banner', kind: 'scene', scene: 'story.m8.banner', at: 'hall', text: 'Go home to the Guild Hall in Dunmere. Wren wants to see the banner.' },
    ],
    rewards: { evidence: 'wren', legacy: 12, fame: 8, codex: ['wren', 'blackwood-ambush', 'aldric-deeper', 'hollow-warden'] },
    endsChapter: 1,
  },
  // ---------------------------------------------------------------- Act III (Chapter 2 stubs)
  ...[
    [9, 'The Price of Silence', 'Thorne offers a lucrative sponsorship if the guild drops its investigation and retires the old banner.', 'mooncourt'],
    [10, 'The Blackwood Expedition', 'An expedition past the Hollow Warden, to find what is left of the lost heroes.', 'dunmere'],
    [11, 'The Crown’s Secret', 'With the evidence in hand, challenge Thorne’s public account before the guild authorities in Mooncourt.', 'mooncourt'],
    [12, 'The Crownfall Tournament', 'The kingdom’s premier championship, where the tragedy began. Qualify and fight through the real brackets.', 'mooncourt'],
  ].map(([number, title, summary, locationId]) => ({
    id: `m${number}`,
    number,
    act: 3,
    chapter: 2,
    title,
    locationId,
    summary,
    gate: { text: 'Chapter 2', if: { chapterAtLeast: 2 } },
    alternatives: [],
    steps: [],
    rewards: {},
    locked: true,
  })),
];

export const STORY_MISSION_BY_ID = Object.fromEntries(STORY_MISSIONS.map((mission) => [mission.id, mission]));

export const REGIONAL_TOURNAMENTS = regional;

/** The prologue (Scene 01, docs/STORY.md). Played by src/components/Prologue.jsx. */
export const PROLOGUE = {
  place: 'Dunmere · Year 1187 · Night',
  title: 'The knock at the door',
  lines: [
    { speaker: 'Narration', text: 'A small, modest house. A fire burns in the hearth. Rain lashes the windows. A sudden knock interrupts the silence.' },
    { speaker: 'Narration', text: 'THUD. THUD. THUD.' },
  ],
  // After the player opens the door.
  door: [
    { speaker: 'Narration', text: 'A man in battered armor stumbles inside. Blood runs down his sleeve. He clutches a wrapped object.' },
    { speaker: 'Stranger', portrait: 'portrait.story.rook', text: 'Close… the door.' },
    { speaker: 'You', text: 'Gods! What happened to you?' },
    { speaker: 'Stranger', portrait: 'portrait.story.rook', text: 'No time. Are you alone?' },
    { speaker: 'You', text: 'Yes. Sit down. I’ll get a physician.' },
    { speaker: 'Stranger', portrait: 'portrait.story.rook', text: 'A physician won’t help me.' },
    { speaker: 'Narration', text: 'He collapses to his knees. A silver guild insignia falls from his cloak.' },
    { speaker: 'You', text: 'Wait. That’s a guild badge.' },
    { speaker: 'Stranger', portrait: 'portrait.story.rook', text: 'It was.' },
    { speaker: 'You', text: 'You’re an adventurer? A real guild adventurer?' },
    { speaker: 'Stranger', portrait: 'portrait.story.rook', text: 'I was a guildmaster.' },
    { speaker: 'You', text: 'A GUILDMASTER? Here? In my house?' },
    { speaker: 'Stranger', portrait: 'portrait.story.rook', text: 'The Argent Crown. I led them.' },
    { speaker: 'You', text: 'The Argent Crown?! You won the King’s Tourney three years in a row! I’ve seen your name on the Herald’s wall!' },
    { speaker: 'Narration', text: 'The man gives a bitter laugh, then coughs blood.' },
    { speaker: 'Cassian Rook', portrait: 'portrait.story.rook', text: 'Nine. We won nine.' },
    { speaker: 'You', text: 'What happened?' },
    { speaker: 'Rook', portrait: 'portrait.story.rook', text: 'We lost.' },
    { speaker: 'Narration', text: 'He unwraps the bundle. Inside is a torn, bloodstained banner bearing a golden lantern.' },
    { speaker: 'Rook', portrait: 'portrait.story.rook', text: 'A little guild. Seven nobodies. They beat us in front of the entire kingdom.' },
    { speaker: 'You', text: 'The Broken Lantern? I thought they vanished in the Blackwood.' },
    { speaker: 'Rook', portrait: 'portrait.story.rook', text: 'They didn’t vanish.' },
    { speaker: 'Narration', text: 'He hesitates.' },
    { speaker: 'Rook', portrait: 'portrait.story.rook', text: 'I had them killed.' },
    { speaker: 'Narration', text: 'Silence.' },
    { speaker: 'You', text: 'What?' },
    { speaker: 'Rook', portrait: 'portrait.story.rook', text: 'I thought losing was the worst thing that could happen to a man. So I made sure they could never beat me again.' },
    { speaker: 'You', text: 'You murdered them?' },
    { speaker: 'Rook', portrait: 'portrait.story.rook', text: 'I gave the order. And the man who carried it out… has come for me.' },
    { speaker: 'Narration', text: 'Footsteps sound outside. Rook’s eyes turn toward the door.' },
    { speaker: 'Rook', portrait: 'portrait.story.rook', text: 'Listen to me. There may be survivors. Find them. Tell them the truth.' },
    { speaker: 'You', text: 'I’m nobody! I have no soldiers, no money. I don’t even have a guild!' },
    { speaker: 'Rook', portrait: 'portrait.story.rook', text: 'Then make one.' },
    { speaker: 'Narration', text: 'He presses the banner into your hands.' },
    { speaker: 'Rook', portrait: 'portrait.story.rook', text: 'Find a hall. Gather heroes. Give them a name. Let the world hear it.' },
    { speaker: 'You', text: 'Why me?' },
    { speaker: 'Rook', portrait: 'portrait.story.rook', text: 'Because you don’t know how powerful you are supposed to be.' },
    { speaker: 'Narration', text: 'He catches his breath.' },
    { speaker: 'Rook', portrait: 'portrait.story.rook', text: 'And whatever you do… don’t trust Garrick Thorne.' },
    { speaker: 'Narration', text: 'Rook dies. Outside, the footsteps stop. Someone tries the door.' },
  ],
  choices: [
    { id: 'hide', label: 'Hide the body', result: 'You drag him behind the woodpile and throw a blanket over the blood. When the watch knocks, you answer calmly. They ask no questions. Across the street, the Wayfarer’s shutters close.' },
    { id: 'banner', label: 'Inspect the banner', result: 'Inside the hem, seven names are stitched in seven different hands: Aldric, Wren, Tobin, Dunstan, Ilse, Pell, Sorrel.' },
    { id: 'search', label: 'Search his belongings', result: 'In an inside pocket, an unfinished letter in his hand, sealed with his signet: “I gave the order. Thorne carried it out, and then kept going.”' },
    { id: 'flee', label: 'Flee through the back', result: 'You slip out the back as the latch gives. In the lamplight you see him: a scar through one eyebrow, an Argent Crown signet on his hand. You will know that face again.' },
  ],
  after: [
    { speaker: 'Narration', text: 'The town watch’s whistles sound at the end of the street. The man outside leaves before they arrive.' },
    { speaker: 'Narration', text: 'In the morning you find it: the Argent Crown’s emblem, scratched deep into your door. Someone knows the banner is here.' },
    { speaker: 'Narration', text: 'The Broken Lantern is gone. But a banner needs someone to carry it, and a guild needs a name.' },
  ],
  // What each choice gives (applied by foundGuild): the first clue.
  rewards: {
    hide: { flag: 'maraTrust', codex: [] },
    banner: { flag: 'knowsSeven', codex: ['seven-names'] },
    search: { evidence: 'confession', codex: ['rooks-confession'] },
    flee: { flag: 'sawEnforcer', codex: ['argent-enforcer'] },
  },
};
