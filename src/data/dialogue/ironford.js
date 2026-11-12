// Ironford conversations. Format: src/data/dialogue/index.js; style and voices: docs/DIALOGUE.md.
import { patronTopics } from './patronTalk.js';
const P = (id) => `portrait.ironford.${id}`;

// Dagna speaks for the Ironford Smiths' Guild (src/data/patrons.js).
const SMITHS = patronTopics('smiths', 'the Smiths’ Guild', {
  ally: ['Allies. We forged you a blade. Don’t make us regret it.'],
  partner: ['Partners. Our steel is cheaper for you, and your chest got bigger.'],
  contact: ['Customers we trust. Our smiths will sharpen your gear even without an armory of your own.'],
  stranger: ['Strangers. Take a bounty contract with our seal, and we’ll talk.'],
  gift: ['She pockets the purse. “The furnace thanks you.”'],
});

export default {
  // Oswin Tull: dry, precise, frightened under it; talks like a filing clerk.
  'ironford.archivist': {
    speaker: 'Oswin Tull',
    portrait: 'portrait.story.quartermaster',
    variants: [
      { if: { storyDone: 'm6' }, lines: ['You. Keep that ledger somewhere dry. Insurance is worth nothing if it rots.'] },
      { if: { talked: true }, lines: ['The archive is still closed. You are still not the public. Hm.'] },
      {
        lines: ['The archive is closed to the public.', 'You’re not the public? Then what are you?'],
        choices: [
          { text: 'A guild, looking for old records.', reply: ['Everyone is looking for old records. Few deserve to find them. Oswin Tull, keeper.'] },
          { text: 'Curious.', reply: ['Curiosity is the public’s favourite excuse. Oswin Tull. Keeper. Busy.'] },
        ],
      },
    ],
    topics: [
      { id: 'archive', text: 'What’s kept in the archive?', lines: ['Forty years of contracts, receipts and lies. All filed by date.'] },
      { id: 'public', text: 'Why keep it closed?', lines: ['Because the public never asks the right questions. And the wrong people do.'] },
    ],
    bye: { text: 'I’ll leave you to it.', lines: ['Kindly close the door. Quietly.'] },
  },

  // Dagna Hale: gruff, practical, proud of her craft; short sentences, no flattery.
  'ironford.foreman': {
    speaker: 'Dagna Hale',
    portrait: P('foreman'),
    variants: [
      { if: { patronRival: 'smiths' }, lines: ['The Guild has you down as people who undercut good smiths. Talk fast.'] },
      { if: { tierAtLeast: 1 }, lines: ['A promoted guild. The Smiths will want to talk armour contracts. Bring your own tea.'] },
      { if: { talked: true }, lines: ['Back on Foundry Row. Still got your eyebrows? Good.'] },
      {
        lines: ['Mind the sparks. Foundry Row burns visitors first.', 'Dagna Hale. I speak for the Smiths’ Guild. What brings a banner this far east?'],
        choices: [
          { text: 'We’re a Free Company. We pay in coin.', if: { charter: 'free' }, effects: [{ relationship: 1 }], reply: ['Good. Smiths like coin and carcasses. Not favours.'] },
          { text: 'Work, if you have any.', reply: ['Always. Bounty hunts, deep work. People who burn or bite.'] },
          { text: 'Just looking around.', reply: ['Look with your hands in your pockets, then.'] },
        ],
      },
    ],
    topics: [
      { id: 'work', text: 'What work does the Smiths’ Guild pay for?', lines: ['Bounty hunts and deep work. Bring us outlaws and ore; we bring you steel.'] },
      { id: 'town', text: 'Who runs Ironford?', lines: ['The Smiths set prices. The toll-keeper sets the bridge. The river sets everything else.'] },
      ...SMITHS,
    ],
    bye: { text: 'Good forging, Dagna.', lines: ['Good hunting. Bring the hides back whole.'] },
  },

  // Ansel Brook: fussy, polite, a stickler for small rules.
  'ironford.tollkeeper': {
    speaker: 'Ansel Brook',
    portrait: P('tollkeeper'),
    variants: [
      { if: { flag: 'paidToll' }, lines: ['Ah, the polite guild. Keep to the middle of the bridge; the river is high this week.'] },
      {
        lines: ['Good day! Crossing the bridge? There is a toll. Two gold.'],
        choices: [
          { text: 'Here you go.', if: { goldAtLeast: 2 }, effects: [{ gold: -2 }, { flag: 'paidToll' }, { relationship: 1 }], reply: ['Much obliged. Not many pay when they don’t have to.'] },
          { text: 'We’re a guild, on business.', effects: [{ flag: 'paidToll' }], reply: ['Guilds on business cross free, if they’re polite. You were. Go on.'] },
        ],
      },
    ],
    topics: [
      { id: 'river', text: 'How’s the river?', lines: ['High this week. It took a cart last spring. Keep to the middle.'] },
      { id: 'bridge', text: 'Who built the bridge?', lines: ['The Smiths’ Guild, paid in sweat. The plaque says so. I polish it.'] },
    ],
    bye: { text: 'Good day, Ansel.', lines: ['Good day! Cross gently.'] },
  },

  // Corr Anvilson: quiet, proud, few words; lets the steel talk.
  'ironford.smith': {
    speaker: 'Corr Anvilson',
    portrait: P('smith'),
    variants: [
      { if: { talked: true }, lines: ['Back. Blade holding up?'] },
      {
        lines: ['…You’re staring at my anvil.', 'Corr. I make what the Forge-Mart sells.'],
        choices: [
          { text: 'It’s fine work.', effects: [{ relationship: 1 }], reply: ['…It is. Thank you.'] },
          { text: 'What do you make?', reply: ['Blades. Mail. A mallet, if you’re the subtle type.'] },
        ],
      },
    ],
    topics: [
      { id: 'buy', text: 'Can I see what’s for sale?', effects: [{ open: 'shop' }], lines: ['Forge-Mart, up the row. Tell them Corr sent you. They won’t care, but tell them.'] },
      { id: 'craft', text: 'How long have you been a smith?', lines: ['Since I could lift a hammer. The hammer got lighter. I didn’t.'] },
    ],
    bye: { text: 'Thanks, Corr.', lines: ['Mm.'] },
  },

  // Ysolde Marr: blunt caravan guard, self-mocking, always looking for work.
  'ironford.guard': {
    speaker: 'Ysolde Marr',
    portrait: P('guard'),
    variants: [
      { if: { talked: true }, lines: ['Still hiring? Still not me? Shame. I’d be wasted on you anyway.'] },
      {
        lines: ['You’ve got a banner and no escort. Brave. Or new.', 'Ysolde Marr. Caravan guard. Good shield, worse cook.'],
        choices: [
          { text: 'New. Is it that obvious?', reply: ['You checked your purse twice crossing the bridge. Yes.'] },
          { text: 'Brave, obviously.', reply: ['Ha. That’s what new people say.'] },
        ],
      },
    ],
    topics: [
      { id: 'work', text: 'Know anyone looking for work?', if: { candidateHere: true }, effects: [{ recruit: true }], lines: ['A few people like me drink at the Quenched Anvil. I’ll point them out.'] },
      { id: 'work', text: 'Know anyone looking for work?', lines: ['Not this month. Caravans took everyone with a pulse.'] },
      { id: 'roads', text: 'How are the roads?', lines: ['Bandits on the south road again. Somebody should be paid to deal with that. Ideally me.'] },
    ],
    bye: { text: 'Safe travels, Ysolde.', lines: ['Safe’s boring. Profitable travels.'] },
  },

  // Venn Ashby: excitable scholar; tangents, footnotes, "did you know".
  'ironford.scholar': {
    speaker: 'Venn Ashby',
    portrait: P('scholar'),
    variants: [
      { if: { storyDone: 'm4' }, lines: ['You! Lantern light without lanterns in the Blackwood, they say. The old books have a word for that.'] },
      { if: { talked: true }, lines: ['Ah, my listener! Did you know the bridge was built twice? No? Sit, sit.'] },
      {
        lines: ['Oh, a traveller! Do you know anything about old roads? Anything at all?'],
        choices: [
          { text: 'Only that they’re long.', reply: ['Ha! True, and underrated. I’m Venn Ashby. I study the old roads.'] },
          { text: 'Why do you ask?', reply: ['Because maps lie, and roads don’t. Venn Ashby. Scholar. Occasionally right.'] },
        ],
      },
    ],
    topics: [
      { id: 'roads', text: 'What have you found?', lines: ['The Blackwood used to be called the Lantern Wood.', 'Someone renamed it on every map in a single year.'] },
      { id: 'who', text: 'Who would rename a forest?', effects: [{ flag: 'heardRenaming' }], lines: ['Someone with a lot of maps. And a reason.'] },
      { id: 'word', text: 'What’s the word for lantern light without lanterns?', if: { storyDone: 'm4' }, lines: ['“Trouble.” The assayers weren’t poets.'] },
    ],
    bye: { text: 'Good luck with your maps.', lines: ['Luck has nothing to do with it. Footnotes do.'] },
  },

  // Places and things.
  'ironford.forge': {
    speaker: 'The Great Forge',
    portrait: 'portrait.poi',
    leave: 'Move on',
    variants: [{ lines: ['The heat reaches you three steps away.', 'Six smiths work the same fire without speaking. They have done it for years.'] }],
  },
  'ironford.plaque': {
    speaker: 'Bridge plaque',
    portrait: 'portrait.poi',
    leave: 'Move on',
    variants: [{ lines: ['“Raised by the Smiths’ Guild, paid for in sweat. Cross gently.”', 'Below it, smaller: “Toll two gold.”'] }],
  },
  'ironford.statue': {
    speaker: 'Statue of the First Smith',
    portrait: 'portrait.poi',
    leave: 'Move on',
    variants: [{ lines: ['An iron figure with a hammer raised, worn smooth where children touch its boot for luck.'] }],
  },
};
