// Weekly town/world events, side-job templates and seasonal festivals.
// Text placeholders: {hero}, {hero2}, {town}, {rival}.
//
// Event: { id, category, title, text, weight, hero?, hero2?, needsRival?, when?, options[] }
//   when: { minTier, season (0–3), heroClass[], heroPersonality[], heroFlaw[], heroDream[], minHeroes, minFame }
//   option: { id, label, note, effects, chance?, fail?, result?, failResult? }
//   effects: gold, fame, legacy, loyalty, xp, fatigue, health, injuryWeeks, relationship, item {id: n},
//            sideJob, regionRep, familyRep [family, n], localPay, sponsor, rest
// News (category 'news') has no options; its effects apply at once and it goes to the News feed.

export const TOWN_EVENTS = [
  // ---------------- Opportunities
  {
    id: 'caravan-escort',
    category: 'opportunity',
    title: 'A caravan needs guards',
    text: 'A merchant caravan leaving {town} lost its guards to fever. They will pay well for one escort run.',
    weight: 3,
    hero: true,
    options: [
      {
        id: 'escort',
        label: 'Send {hero}',
        note: 'A quick escort run. Gold and experience, small risk.',
        chance: 0.75,
        effects: { gold: 90, xp: 40, fatigue: 10 },
        fail: { gold: 30, injuryWeeks: 2 },
        result: '{hero} brings the caravan through. +90 gold.',
        failResult: 'Bandits hit the caravan. {hero} is wounded but paid a little.',
      },
      { id: 'pass', label: 'Pass', note: 'Nothing happens.', effects: {} },
    ],
  },
  {
    id: 'noble-sponsor',
    category: 'opportunity',
    title: 'A noble sponsor',
    text: 'Lady Verel of {town} likes the look of your banner. She offers to sponsor your next tournament entry.',
    weight: 2,
    when: { minFame: 20 },
    options: [
      { id: 'accept', label: 'Accept her colours', note: '+120 gold now; her house expects a good showing.', effects: { gold: 120, fame: 3 } },
      { id: 'decline', label: 'Stay independent', note: '+2 legacy.', effects: { legacy: 2 } },
    ],
  },
  {
    id: 'wandering-master',
    category: 'opportunity',
    title: 'A wandering master',
    text: 'An old swordmaster passing through {town} offers a week of lessons to one hero, for a fee.',
    weight: 2,
    hero: true,
    options: [
      { id: 'train', label: 'Pay for {hero} to train', note: '−60 gold, +120 XP for {hero}.', effects: { gold: -60, xp: 120 } },
      { id: 'decline', label: 'Not now', note: 'Nothing happens.', effects: {} },
    ],
  },
  {
    id: 'lost-heirloom',
    category: 'opportunity',
    title: 'A lost heirloom',
    text: 'A widow begs someone to find her late husband’s ring, lost in the old well.',
    weight: 2,
    hero: true,
    options: [
      {
        id: 'search',
        label: '{hero} goes down the well',
        note: 'Kindness pays in reputation.',
        chance: 0.7,
        effects: { regionRep: 8, fame: 2, fatigue: 10 },
        fail: { fatigue: 15 },
        result: '{hero} finds the ring. The town talks about it for days.',
        failResult: 'Only mud and frogs down there.',
      },
      { id: 'refuse', label: 'Wish her luck', note: 'Nothing happens.', effects: {} },
    ],
  },
  {
    id: 'apothecary-sale',
    category: 'opportunity',
    title: 'Apothecary closing sale',
    text: 'The apothecary in {town} is closing. Potions at half price!',
    weight: 2,
    options: [
      { id: 'buy', label: 'Buy three potions', note: '−30 gold, +3 potions.', effects: { gold: -30, item: { potion: 3 } } },
      { id: 'ether', label: 'Buy an ether', note: '−20 gold, +1 ether.', effects: { gold: -20, item: { ether: 1 } } },
      { id: 'pass', label: 'Pass', note: 'Nothing happens.', effects: {} },
    ],
  },
  {
    id: 'map-seller',
    category: 'opportunity',
    title: 'An old map',
    text: 'A sailor sells a map of forgotten roads. It might point to work nobody else knows about.',
    weight: 1,
    options: [
      { id: 'buy', label: 'Buy the map', note: '−40 gold; a new side job appears on the board.', effects: { gold: -40, sideJob: true } },
      { id: 'pass', label: 'Pass', note: 'Nothing happens.', effects: {} },
    ],
  },
  {
    id: 'temple-blessing',
    category: 'opportunity',
    title: 'Temple blessing',
    text: 'The priests of {town} offer to bless the guild before its next contract.',
    weight: 1,
    options: [
      { id: 'donate', label: 'Donate 50 gold', note: 'Everyone recovers a little.', effects: { gold: -50, rest: true, regionRep: 3 } },
      { id: 'thank', label: 'Thank them', note: 'Nothing happens.', effects: {} },
    ],
  },
  {
    id: 'bounty-poster',
    category: 'opportunity',
    title: 'Bounty on the wall',
    text: 'A fresh bounty poster: a smuggler hides somewhere in {town}.',
    weight: 2,
    hero: true,
    when: { heroClass: ['Rogue', 'Ranger', 'Scholar'] },
    options: [
      {
        id: 'hunt',
        label: '{hero} tracks him down',
        note: 'Their class suits it.',
        chance: 0.8,
        effects: { gold: 110, xp: 50, familyRep: ['Intrigue', 10] },
        fail: { fatigue: 15 },
        result: '{hero} drags the smuggler to the watch. +110 gold.',
        failResult: 'The smuggler slips away by boat.',
      },
      { id: 'ignore', label: 'Leave it to the watch', note: 'Nothing happens.', effects: {} },
    ],
  },

  // ---------------- Trouble
  {
    id: 'tavern-brawl',
    category: 'trouble',
    title: 'Tavern brawl',
    text: '{hero} got into a fight at the tavern. The owner wants damages paid.',
    weight: 3,
    hero: true,
    options: [
      { id: 'pay', label: 'Pay the damages', note: '−50 gold. {hero} is grateful.', effects: { gold: -50, loyalty: 5 } },
      { id: 'scold', label: 'Make {hero} pay it back', note: '{hero} is annoyed.', effects: { loyalty: -6 } },
    ],
  },
  {
    id: 'debt-collector',
    category: 'trouble',
    title: 'A debt collector',
    text: 'A man with a ledger says the old Broken Lantern owed his master money. He wants it from you.',
    weight: 2,
    options: [
      { id: 'pay', label: 'Pay something', note: '−80 gold, +3 legacy for honoring the old name.', effects: { gold: -80, legacy: 3 } },
      { id: 'refuse', label: 'Show him the door', note: 'Rumors spread: −3 fame.', effects: { fame: -3 } },
    ],
  },
  {
    id: 'rival-rumors',
    category: 'trouble',
    title: 'Rumors in the market',
    text: '{rival} has been telling everyone in {town} that your guild is all talk.',
    weight: 2,
    needsRival: true,
    options: [
      { id: 'answer', label: 'Answer in public', note: '+3 fame, the rivalry heats up.', effects: { fame: 3, rivalry: 4 } },
      { id: 'ignore', label: 'Let your work speak', note: '−2 fame.', effects: { fame: -2 } },
    ],
  },
  {
    id: 'hall-fire',
    category: 'trouble',
    title: 'Fire at the guild hall',
    text: 'A lamp tipped over in the night. The storeroom is smoking.',
    weight: 1,
    options: [
      { id: 'repair', label: 'Repair it properly', note: '−90 gold.', effects: { gold: -90 } },
      { id: 'patch', label: 'Patch it up', note: '−25 gold, the heroes sleep badly.', effects: { gold: -25, fatigueAll: 10 } },
    ],
  },
  {
    id: 'thief-in-hall',
    category: 'trouble',
    title: 'A thief in the hall',
    text: 'Someone broke into the guild storeroom.',
    weight: 1,
    options: [
      {
        id: 'chase',
        label: 'Chase them',
        note: 'You might get it all back.',
        chance: 0.5,
        effects: { fame: 2 },
        fail: { gold: -60 },
        result: 'Caught red-handed in the alley.',
        failResult: 'They got away with 60 gold.',
      },
      { id: 'report', label: 'Report it to the watch', note: '−30 gold lost.', effects: { gold: -30 } },
    ],
  },
  {
    id: 'sick-hero',
    category: 'trouble',
    title: 'Fever',
    text: '{hero} woke up with a fever.',
    weight: 2,
    hero: true,
    options: [
      { id: 'healer', label: 'Pay a healer', note: '−40 gold, quick recovery.', effects: { gold: -40, health: 10 } },
      { id: 'rest', label: 'Let it pass', note: '{hero} loses health and is tired.', effects: { health: -20, fatigue: 20 } },
    ],
  },
  {
    id: 'gambling-debt',
    category: 'trouble',
    title: 'Gambling debts',
    text: '{hero} lost big at the dice tables.',
    weight: 2,
    hero: true,
    when: { heroFlaw: ['Greed', 'Addiction', 'Recklessness'] },
    options: [
      { id: 'cover', label: 'Cover the debt', note: '−70 gold, +loyalty.', effects: { gold: -70, loyalty: 8 } },
      { id: 'refuse', label: 'Their problem', note: '−loyalty.', effects: { loyalty: -10 } },
    ],
  },

  // ---------------- Hero moments
  {
    id: 'asks-leave',
    category: 'hero',
    title: 'A request for leave',
    text: '{hero} asks for a week off to visit family.',
    weight: 2,
    hero: true,
    options: [
      { id: 'grant', label: 'Grant leave', note: '{hero} rests and returns happier.', effects: { loyalty: 8, fatigue: -30 } },
      { id: 'deny', label: 'We need you here', note: '−loyalty.', effects: { loyalty: -6 } },
    ],
  },
  {
    id: 'heroes-argue',
    category: 'hero',
    title: 'An argument',
    text: '{hero} and {hero2} are shouting at each other over the last contract.',
    weight: 3,
    hero: true,
    hero2: true,
    options: [
      { id: 'mediate', label: 'Sit them down', note: 'They make peace.', effects: { relationship: 12, loyalty: 2 } },
      { id: 'side', label: 'Side with {hero}', note: '{hero} is pleased, {hero2} is not.', effects: { loyalty: 6, relationship: -10 } },
    ],
  },
  {
    id: 'wants-tournament',
    category: 'hero',
    title: 'A dream of glory',
    text: '{hero} dreams of becoming a champion and wants to enter the next tournament.',
    weight: 2,
    hero: true,
    when: { heroDream: ['Become champion', 'Surpass a famous parent'] },
    options: [
      { id: 'promise', label: 'Promise a chance', note: '+loyalty now.', effects: { loyalty: 8 } },
      { id: 'later', label: 'Not this year', note: '−loyalty.', effects: { loyalty: -5 } },
    ],
  },
  {
    id: 'homesick',
    category: 'hero',
    title: 'Homesick',
    text: '{hero} has been quiet lately and talks about home.',
    weight: 2,
    hero: true,
    when: { heroFlaw: ['Melancholy', 'Divided loyalty'] },
    options: [
      { id: 'letter', label: 'Pay for a letter home', note: '−10 gold, +loyalty.', effects: { gold: -10, loyalty: 6 } },
      { id: 'drill', label: 'Keep them busy', note: '+XP, −loyalty.', effects: { xp: 40, loyalty: -4 } },
    ],
  },
  {
    id: 'show-off',
    category: 'hero',
    title: 'Showing off',
    text: '{hero} wants to put on a public display of skill in the square.',
    weight: 2,
    hero: true,
    when: { heroPersonality: ['Vain', 'Witty', 'Brave'] },
    options: [
      { id: 'allow', label: 'Let them shine', note: '+fame, a bit tiring.', effects: { fame: 4, fatigue: 10, loyalty: 3 } },
      { id: 'forbid', label: 'Stay humble', note: '−loyalty.', effects: { loyalty: -4 } },
    ],
  },
  {
    id: 'night-practice',
    category: 'hero',
    title: 'Practicing at night',
    text: '{hero} has been training alone every night.',
    weight: 2,
    hero: true,
    when: { heroPersonality: ['Obsessive', 'Patient', 'Honorable'] },
    options: [
      { id: 'encourage', label: 'Encourage it', note: '+XP, more fatigue.', effects: { xp: 60, fatigue: 15 } },
      { id: 'rest', label: 'Order rest', note: 'Fatigue drops.', effects: { fatigue: -20 } },
    ],
  },
  {
    id: 'cowardice',
    category: 'hero',
    title: 'Cold feet',
    text: '{hero} says the next job sounds too dangerous.',
    weight: 1,
    hero: true,
    when: { heroFlaw: ['Cowardice'] },
    options: [
      { id: 'reassure', label: 'Reassure them', note: '+loyalty.', effects: { loyalty: 5 } },
      { id: 'shame', label: 'Call it out', note: 'Loyalty drops, but they toughen up.', effects: { loyalty: -6, xp: 30 } },
    ],
  },
  {
    id: 'mentor-moment',
    category: 'hero',
    title: 'A lesson shared',
    text: '{hero} spent the evening teaching {hero2} old tricks.',
    weight: 2,
    hero: true,
    hero2: true,
    options: [
      { id: 'praise', label: 'Praise them both', note: 'Their bond grows.', effects: { relationship: 10, xp: 25 } },
      { id: 'nothing', label: 'Say nothing', note: 'A small bond forms anyway.', effects: { relationship: 4 } },
    ],
  },

  // ---------------- World news (no choices)
  {
    id: 'news-rival-title',
    category: 'news',
    title: '{rival} wins a title',
    text: 'Criers in {town} sing about {rival}’s latest victory.',
    weight: 2,
    needsRival: true,
    effects: {},
  },
  {
    id: 'news-monster',
    category: 'news',
    title: 'Monster sighting',
    text: 'Something big was seen near {town}. Local contracts pay 15% more.',
    weight: 2,
    effects: { localPay: 0.15 },
  },
  {
    id: 'news-festival-talk',
    category: 'news',
    title: 'Festival preparations',
    text: 'Banners go up in {town}. Exhibitions draw bigger crowds: +2 fame.',
    weight: 1,
    effects: { fame: 2 },
  },
  {
    id: 'news-good-harvest',
    category: 'news',
    title: 'A good harvest',
    text: 'Food is cheap in {town} this week. The heroes eat well.',
    weight: 2,
    effects: { fatigueAll: -5 },
  },
  {
    id: 'news-storm',
    category: 'news',
    title: 'Storm warning',
    text: 'Storms roll over the region. Travel will be slower for a while.',
    weight: 1,
    effects: {},
  },
  {
    id: 'news-new-recruits',
    category: 'news',
    title: 'New faces in town',
    text: 'Adventurers arrive in {town} looking for work. Check the Tavern.',
    weight: 1,
    effects: { recruit: true },
  },
];

/** Side jobs: 1 week, 1–2 heroes, a quick roll on the listed attribute. */
export const SIDE_JOBS = [
  { id: 'market-guard', title: 'Guard a market stall', stat: 'Endurance', difficulty: 45, gold: 35, xp: 20 },
  { id: 'sealed-letter', title: 'Deliver a sealed letter', stat: 'Finesse', difficulty: 45, gold: 30, xp: 15, rep: 2 },
  { id: 'cellar-pests', title: 'Hunt pests in the cellar', stat: 'Might', difficulty: 40, gold: 30, xp: 25 },
  { id: 'tutor-noble', title: "Tutor a noble's child", stat: 'Mind', difficulty: 50, gold: 45, xp: 15, rep: 3 },
  { id: 'gather-herbs', title: 'Gather herbs', stat: 'Spirit', difficulty: 40, gold: 20, xp: 15, item: 'potion' },
  { id: 'night-watch', title: 'Stand night watch', stat: 'Endurance', difficulty: 50, gold: 40, xp: 20 },
  { id: 'escort-pilgrim', title: 'Escort a pilgrim', stat: 'Presence', difficulty: 48, gold: 40, xp: 20, rep: 2 },
  { id: 'repair-bridge', title: 'Help repair a bridge', stat: 'Might', difficulty: 46, gold: 35, xp: 20, rep: 2 },
  { id: 'card-sharp', title: 'Win at the card tables', stat: 'Finesse', difficulty: 55, gold: 60, xp: 10 },
  { id: 'copy-scrolls', title: 'Copy temple scrolls', stat: 'Mind', difficulty: 42, gold: 25, xp: 20 },
];

/** One festival per season, in a town picked from the list by year and season. */
export const FESTIVALS = [
  { season: 0, name: 'Lantern Night', towns: ['dunmere', 'ironford', 'greenhollow'] },
  { season: 1, name: 'Blossom Fair', towns: ['greenhollow', 'thornwatch', 'windmere'] },
  { season: 2, name: 'Harvest Revel', towns: ['dunmere', 'windmere', 'ironford'] },
  { season: 3, name: 'Frost Market', towns: ['ironford', 'dunmere', 'greenhollow'] },
];

export const FESTIVAL_EVENT = {
  id: 'festival',
  category: 'opportunity',
  title: 'The {festival}',
  text: '{town} celebrates the {festival}. Music, stalls and a crowd that loves heroes.',
  options: [
    { id: 'perform', label: 'Put on a show', note: '+8 fame, +5 regional reputation.', effects: { fame: 8, regionRep: 5 } },
    {
      id: 'contest',
      label: 'Enter the contests',
      note: 'Prize money if you win.',
      chance: 0.6,
      effects: { gold: 120, fame: 3 },
      fail: { fame: 1 },
      result: 'Your heroes sweep the contests. +120 gold.',
      failResult: 'Close, but no prizes this year.',
    },
    { id: 'rest', label: 'Let everyone enjoy it', note: 'Everyone rests and is happier.', effects: { rest: true, loyaltyAll: 3 } },
  ],
};
