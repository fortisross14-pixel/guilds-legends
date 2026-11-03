// Ironford conversations. Format: src/data/dialogue/index.js.
const P = (id) => `portrait.ironford.${id}`;

export default {
  'ironford.foreman': {
    speaker: 'Dagna Hale',
    portrait: P('foreman'),
    variants: [
      {
        if: { tierAtLeast: 1 },
        lines: ['A promoted guild. The Smiths’ Guild will want to talk to you about armour contracts. Bring your own tea.'],
      },
      {
        lines: ['Foundry Row. Everything here is hot, heavy or both. Stay on the cobbles and you will keep your eyebrows.'],
        choices: [{ text: 'Who runs Ironford?', reply: ['The Smiths’ Guild sets prices, the toll-keeper sets the bridge, and the river sets everything else.'] }],
      },
    ],
  },
  'ironford.tollkeeper': {
    speaker: 'Ansel Brook',
    portrait: P('tollkeeper'),
    variants: [
      {
        if: { notFlag: 'paidToll' },
        lines: ['Bridge toll is two crowns. Guild members on business cross free, if they are polite about it.'],
        choices: [
          { text: 'Pay the toll', if: { goldAtLeast: 2 }, effects: [{ gold: -2 }, { flag: 'paidToll' }, { relationship: 1 }], reply: ['Much obliged. Not many pay when they do not have to.'] },
          { text: 'We are on business.', effects: [{ flag: 'paidToll' }], reply: ['And polite about it. Go on.'] },
        ],
      },
      { lines: ['The river is high this week. Keep to the middle of the bridge.'] },
    ],
  },
  'ironford.smith': {
    speaker: 'Corr Anvilson',
    portrait: P('smith'),
    variants: [
      {
        lines: ['Blades, mail, a mallet if you are the subtle type. The Forge-Mart sells what I make.'],
        choices: [{ text: 'Show me', effects: [{ open: 'shop' }] }],
      },
    ],
  },
  'ironford.guard': {
    speaker: 'Ysolde Marr',
    portrait: P('guard'),
    variants: [
      {
        if: { candidateHere: true },
        lines: ['Caravan work is drying up. I am a good shield and a worse cook. If your guild is hiring, I know a few people like me.'],
        choices: [
          { text: 'Introduce me', effects: [{ recruit: true }] },
          { text: 'Maybe later.' },
        ],
      },
      { lines: ['Bandits on the south road again. Somebody should be paid to deal with that. Ideally me.'] },
    ],
  },
  'ironford.scholar': {
    speaker: 'Venn Ashby',
    portrait: P('scholar'),
    variants: [
      {
        if: { storyStarted: true },
        lines: ['Lantern light without lanterns? There is a word for it in the old assay books. The word is “trouble”.'],
      },
      {
        lines: ['I study the old roads. Did you know the Blackwood used to be called the Lantern Wood? Someone renamed it on every map in a single year.'],
        choices: [{ text: 'Who would do that?', effects: [{ flag: 'heardRenaming' }], reply: ['Someone with a lot of maps. And a reason.'] }],
      },
    ],
  },
  'ironford.barkeep': {
    speaker: 'Mags',
    portrait: P('barkeep'),
    variants: [
      {
        lines: ['The Quenched Anvil. We quench anvils, smiths and the occasional argument. Sit.'],
        choices: [
          { text: 'Anyone looking for work?', if: { candidateHere: true }, effects: [{ recruit: true }] },
          { text: 'Go inside', effects: [{ open: 'tavern' }] },
        ],
      },
    ],
  },

  'ironford.forge': {
    speaker: 'The Great Forge',
    portrait: 'portrait.poi',
    variants: [{ lines: ['The heat reaches you three steps away. Six smiths work the same fire without speaking; they have done it for years.'] }],
  },
  'ironford.plaque': {
    speaker: 'Bridge plaque',
    portrait: 'portrait.poi',
    variants: [{ lines: ['“Raised by the Smiths’ Guild, paid for in sweat. Cross gently.” Below it, smaller: “Toll two crowns.”'] }],
  },
  'ironford.statue': {
    speaker: 'Statue of the First Smith',
    portrait: 'portrait.poi',
    variants: [{ lines: ['An iron figure with a hammer raised, worn smooth where children touch its boot for luck.'] }],
  },
};
