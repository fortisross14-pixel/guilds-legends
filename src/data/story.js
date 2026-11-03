// The Blackwood arc: what happened to the old Broken Lantern guild.
// Beats unlock in order, a few months apart (roughly years 1–4).
// kind 'event' = a story card; kind 'contract' = a special contract on a notice board.

export const STORY_TITLE = 'The Lantern in the Blackwood';

export const STORY_BEATS = [
  {
    id: 'journal',
    kind: 'event',
    title: 'A survivor’s journal',
    text: 'A peddler sells you a water-stained journal. The cover bears the old Broken Lantern crest. The last page reads: “The herbalist in Greenhollow saw us leave. Ask her what she saw.”',
    options: [
      {
        id: 'read',
        label: 'Keep the journal',
        note: 'The trail leads to Greenhollow.',
        effects: { legacy: 3 },
        result: 'You read it by candlelight. The old guild was afraid of something in the woods.',
      },
    ],
    pin: 'greenhollow',
  },
  {
    id: 'herbalist',
    kind: 'contract',
    approach: 'Diplomacy',
    locationId: 'greenhollow',
    title: 'The Herbalist’s Testimony',
    stakes: 'Win the trust of an old herbalist who swore never to speak of the Lantern again.',
    difficulty: 50,
    risk: 2,
    reward: 220,
    fame: 10,
    resultText: 'She remembers: their captain, Aldric Vane, paid for maps of the Blackwood in gold that “smelled of ash”. His ledger went to Ironford.',
  },
  {
    id: 'rival-hunt',
    kind: 'event',
    title: 'Someone else is looking',
    text: 'In the Ironford archives a clerk smirks: “{rival} was here last week, asking about the same ledger.” They want the Lantern’s secret too.',
    options: [
      {
        id: 'race',
        label: 'Race them to it',
        note: 'The rivalry with {rival} heats up (+15).',
        effects: { rivalry: 15, fame: 2 },
        result: 'You leave the archive at a run.',
      },
      {
        id: 'warn',
        label: 'Send them a warning',
        note: '+15 rivalry, +2 legacy.',
        effects: { rivalry: 15, legacy: 2 },
        result: 'Your message is short and not friendly.',
      },
    ],
    pin: 'ironford',
  },
  {
    id: 'ledger',
    kind: 'contract',
    approach: 'Intrigue',
    locationId: 'ironford',
    title: 'Ledger of the Lost Company',
    stakes: 'Steal back Aldric Vane’s ledger from a vault before the rival guild does.',
    difficulty: 56,
    risk: 3,
    reward: 280,
    fame: 12,
    resultText: 'The ledger names one survivor: a scout called Wren, hiding near Windmere.',
  },
  {
    id: 'survivor',
    kind: 'contract',
    approach: 'Combat',
    locationId: 'windmere',
    title: 'The Last Survivor',
    stakes: 'Wren the scout is hunted by whatever followed her out of the Blackwood. Reach her first.',
    difficulty: 60,
    risk: 3,
    reward: 320,
    fame: 14,
    resultText: 'Wren is alive, thin and shaking. “It wasn’t the woods,” she says. “It was the Warden. And Aldric made a deal with it.”',
  },
  {
    id: 'truth',
    kind: 'event',
    title: 'What happened in the Blackwood',
    text: 'Wren tells it all. Aldric Vane traded the guild’s light — its luck, its oaths — to the Hollow Warden for one great victory. The Warden took them all. Some may still be bound there. What will your guild do with this truth?',
    options: [
      {
        id: 'restore',
        label: 'Restore the Lantern’s name',
        note: 'Honor the lost. +10% fame on every contract from now on.',
        effects: { legacy: 15, familyRep: ['Diplomacy', 60] },
        result: 'You will carry their name, not their shame.',
      },
      {
        id: 'revenge',
        label: 'Take revenge on the Warden',
        note: 'Steel for steel. +10% pay on Combat contracts from now on.',
        effects: { fame: 10, familyRep: ['Combat', 60] },
        result: 'Your heroes sharpen their blades in silence.',
      },
      {
        id: 'bury',
        label: 'Bury the past',
        note: 'Some debts should stay buried. −10% monthly upkeep from now on.',
        effects: { gold: 300, familyRep: ['Intrigue', 60] },
        result: 'You burn the ledger. Only you will know.',
      },
    ],
    pin: 'dunmere',
  },
  {
    id: 'finale',
    kind: 'contract',
    approach: 'Combat',
    locationId: 'dunmere',
    boss: true,
    title: 'Into the Blackwood',
    stakes: 'March into the Blackwood and face the Hollow Warden. Free whatever is left of the old guild.',
    difficulty: 68,
    risk: 5,
    reward: 900,
    fame: 40,
    resultText: 'The Warden breaks like old glass. In the silence, a small lantern still burns among the roots. You take it home.',
  },
];

/** Lasting effects of the final choice: a guild title and a permanent perk. */
export const STORY_CHOICES = {
  restore: { title: 'Keepers of the Lantern', perk: '+10% fame on every contract' },
  revenge: { title: 'Wardbreakers', perk: '+10% pay on Combat contracts' },
  bury: { title: 'The Quiet Lantern', perk: '−10% monthly upkeep' },
};

/** Where the Blackwood is drawn on the world map once the finale is posted. */
export const BLACKWOOD_MAP = { x: 8, y: 30, name: 'The Blackwood' };

/** Months between beats, and what starts the arc. */
export const STORY_PACING = { firstAfterContracts: 3, firstAfterFame: 60, firstAfterMonths: 6, minMonthsBetween: 3, maxMonthsBetween: 5, retryMonths: 1 };
