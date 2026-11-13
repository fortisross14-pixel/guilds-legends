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
      // How they feel about the guild (its standing: fear, respect, disgust, warmth).
      { if: { talked: true, quadrant: 'fear' }, lines: ['My foundry gives you whatever you want. Just say it and go.'] },
      { if: { talked: true, quadrant: 'respect' }, lines: ['Ironford respects steel, and people who keep their word. You have both.'] },
      { if: { talked: true, quadrant: 'disgust' }, lines: ['Your coin spends. Your name doesn’t, not in my foundry.'] },
      { if: { talked: true, quadrant: 'compassion' }, lines: ['Sit by the fire. You look like you’ve been helping strangers again.'] },
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

  // ---------------------------------------------------------------- the bigger Ironford: places
  'ironford.archive': {
    speaker: 'The Smiths’ Archive',
    portrait: 'portrait.poi',
    leave: 'Move on',
    variants: [
      { if: { storyDone: 'm6' }, lines: ['The archive doors are shut again. Someone has oiled the hinges since you were inside.'] },
      { lines: ['Two white columns, a purple gable and a door with three locks. A brass plate: “Records of the Smiths’ Guild. Not open to the public.”'] },
    ],
  },
  'ironford.orecart': {
    speaker: 'Ore cart',
    portrait: 'portrait.poi',
    leave: 'Move on',
    variants: [{ lines: ['A cart heaped with ore from the Iron Road, still red with the hill’s dust.', 'Chalked on the side: “Hale. Do not touch. Yes, you.”'] }],
  },
  'ironford.docks': {
    speaker: 'The docks',
    portrait: 'portrait.poi',
    leave: 'Move on',
    variants: [{ lines: ['Crates stamped with the hammer of the Smiths’ Guild wait for the river barges.', 'The river runs brown with slag below the pier.'] }],
  },
  'ironford.caravans': {
    speaker: 'The caravan yard',
    portrait: 'portrait.poi',
    leave: 'Move on',
    variants: [{ lines: ['Wagons, oxen and hay. Every caravan for the Moon Road and the far towns leaves from this yard.', 'A board lists departures. Half of them say “when the road is safe”.'] }],
  },

  // ---------------------------------------------------------------- the bigger Ironford: people
  // Tibb: the smith's apprentice; eager, burnt fingers, hero-worships fighters.
  'ironford.apprentice': {
    speaker: 'Tibb',
    portrait: P('apprentice'),
    variants: [
      { if: { talked: true, quadrant: 'fear' }, lines: ['Oh! I mean, hello. I didn’t touch your gear. I swear I didn’t.'] },
      { if: { talked: true, quadrant: 'respect' }, lines: ['It’s you! I told Master Anvilson you’d come back. He said I talk too much.'] },
      { if: { talked: true }, lines: ['Back again? I’m still sweeping. One day it’ll be swords.'] },
      {
        lines: ['Careful, the slag’s still hot there. I’m Tibb. Apprentice. Mostly I sweep.', 'Are you real fighters? With a guild and everything?'],
        choices: [
          { text: 'We are. A guild and everything.', effects: [{ relationship: 1 }], reply: ['I knew it! You walk like fighters. Master Anvilson walks like a door.'] },
          { text: 'We’re working on it.', reply: ['Everybody starts somewhere. I started with a broom.'] },
        ],
      },
    ],
    topics: [
      { id: 'forge', text: 'What’s it like working the forge?', lines: ['Hot. Loud. I love it. My fingers don’t, but my fingers aren’t in charge.'] },
      { id: 'gear', text: 'Where do I buy good gear here?', lines: ['The Forge-Mart, up the street. The good stuff is behind the counter. Ask for it by name.'] },
    ],
    bye: { text: 'Back to your sweeping, then.', lines: ['One day it’ll be swords!'] },
  },

  // Rhoswen Tarr: dock hand; wry, unhurried, has seen every cargo there is.
  'ironford.docker': {
    speaker: 'Rhoswen Tarr',
    portrait: P('docker'),
    variants: [
      { if: { talked: true, quadrant: 'disgust' }, lines: ['Your lot again. Nothing here’s for sale, and nothing here goes missing. Understood?'] },
      { if: { talked: true, quadrant: 'compassion' }, lines: ['The kind ones are back. Sit on a crate. They’re sturdier than they look.'] },
      { if: { talked: true }, lines: ['Still not a barge, I see. Nothing comes in till the river rises.'] },
      {
        lines: ['Mind the edge. The river keeps what falls in.', 'Rhoswen Tarr. I load the barges, when there are barges.'],
        choices: [
          { text: 'Slow day?', reply: ['Slow year. The river’s low and the barge guilds are worse.'] },
          { text: 'What goes out on the barges?', reply: ['Steel downriver. Gold back up. Secrets both ways, but those don’t weigh much.'] },
        ],
      },
    ],
    topics: [
      { id: 'river', text: 'Where does the river go?', lines: ['South to the coast and the salt towns. Three days with the current, nine against.'] },
      { id: 'secrets', text: 'What secrets?', lines: ['The sealed kind. A crate with a Crown seal doesn’t get opened, and it doesn’t get weighed.'] },
    ],
    bye: { text: 'I’ll let you get back to it.', lines: ['To what? Oh, the waiting. Yes.'] },
  },

  // Haskel Dunn: caravan master; a grumbling old road hand, counts everything.
  'ironford.caravan': {
    speaker: 'Haskel Dunn',
    portrait: P('caravan'),
    variants: [
      { if: { talked: true, quadrant: 'fear' }, lines: ['You again. My wagons pay their toll to the road, not to you. Please.'] },
      { if: { talked: true, quadrant: 'respect' }, lines: ['The guild that keeps the roads clear. My drivers drink to you, you know.'] },
      { if: { talked: true }, lines: ['Eleven wagons, nine oxen, one cat. Everyone’s accounted for. What do you need?'] },
      {
        lines: ['Don’t stand behind the oxen. They have opinions.', 'Haskel Dunn, caravan master. If it rolls out of Ironford, I counted it.'],
        choices: [
          { text: 'Where do your caravans go?', reply: ['East, over the Moon Road to Mooncourt. South to the cliffs. Wherever pays.'] },
          { text: 'Need guards?', reply: ['Always. Ysolde takes the hard runs. Ask at the notice board for the rest.'] },
        ],
      },
    ],
    topics: [
      { id: 'moon', text: 'What’s on the Moon Road?', lines: ['Hills, then worse hills, then Mooncourt. The bands up there are no novices.'] },
      { id: 'safe', text: 'Why “when the road is safe”?', lines: ['Because it never is, but you have to write something on the board.'] },
    ],
    bye: { text: 'Safe roads.', lines: ['Ha. Count your heroes before you leave, and when you get back.'] },
  },
};
