// Chapter 1 scenes and people added by the four-chapter plan (docs/design/STORY_DRAFT.md):
// Old Ebb (1.1), Sergeant Hobb and the watch's token (1.5), Mother Aveline and the prayer
// book (1.5), the Lantern's waystone in the Thornwood (1.6). Style: docs/DIALOGUE.md.

const EBB = 'portrait.role.traveller';
const HOBB = 'portrait.role.watch-sergeant';
const AVELINE = 'portrait.role.high-priestess';

export default {
  // Old Ebb: a regular at the Wayfarer's corner table. Rambling, warm, sharper than he lets on;
  // remembers every guild that ever bought him a drink.
  'story.c1.ebb': {
    speaker: 'Old Ebb',
    portrait: EBB,
    decide: true,
    leave: 'Not now.',
    variants: [
      {
        lines: ['Asking about the Lantern, are you? Half the room heard you. Sit.', 'Ebb. Old Ebb, they call me. I’m not that old. I just started early.'],
        choices: [
          {
            text: 'A beer for Old Ebb. (2 gold)',
            if: { goldAtLeast: 2 },
            effects: [{ gold: -2 }, { relationship: 2 }],
            reply: [
              'Now that’s a guild that knows how to ask. Their captain drank right there. Aldric. Paid for everyone, never got drunk.',
              'Before every trip west they walked the Old Road to Dawnwatch Temple and wrote their names in the prayer book.',
              'The old priests kept those names. If anyone knows where the seven went, it’s Dawnwatch.',
            ],
          },
          {
            text: 'Tell me what you know, or you’ll be drinking through a split lip.',
            effects: [{ standing: { honor: -6, dread: 6, text: 'Leaned on Old Ebb in the Wayfarer' } }, { relationship: -3 }],
            reply: ['…No need for that. No need. They prayed at Dawnwatch Temple, at the end of the Old Road. Before every trip.', 'The priests kept their names. Go bother them.'],
          },
        ],
      },
    ],
    topics: [
      { id: 'lantern', text: 'You knew the Broken Lantern?', lines: ['Knew them? I drank their health the night they beat the Crown. Loudest night this town ever had.'] },
      { id: 'cursed', text: 'The heralds say they were cursed.', lines: ['Heralds say what they’re paid to say. Curses don’t usually wear good boots.'] },
    ],
  },

  // Old Ebb after the story step: a regular with a hub.
  'dunmere.ebb': {
    speaker: 'Old Ebb',
    portrait: EBB,
    variants: [
      { if: { storyDone: 'm4' }, lines: ['The guild with the Lantern’s banner! Sit, sit. You’re drinking with history.'] },
      { if: { talked: true }, lines: ['My new favourite guild. You’re not buying, are you? No? Still my favourite.'] },
      { lines: ['Evening. Ebb. I’d stand, but the bench and I have an understanding.'] },
    ],
    topics: [
      { id: 'town', text: 'What’s new in Dunmere?', lines: ['Same kilns, same river, new banners. Yours, mostly.'] },
      { id: 'dawnwatch', text: 'Tell me about Dawnwatch again.', if: { storyDone: 'c1-ask' }, lines: ['Old Road, west, all the way to the end. Mind the woods; the road’s safe, the trees aren’t.'] },
    ],
    bye: { text: 'Take care, Ebb.', lines: ['Care’s for young men. I’ll take another drink.'] },
  },

  // Sergeant Hobb: the watch at the west gate. Blunt, tired, honest enough to be bribed openly.
  'dunmere.hobb': {
    speaker: 'Sergeant Hobb',
    portrait: HOBB,
    variants: [
      {
        if: { storyStep: 'c1-prior.token', notItem: 'watch-token' },
        lines: ['The temple wants the watch to vouch for you? Ha. The watch doesn’t know you.', 'I could. A token from me opens doors. Tokens cost something.'],
        choices: [
          {
            text: 'Name your price. (80 gold)',
            if: { goldAtLeast: 80 },
            effects: [{ gold: -80 }, { giveItem: { 'watch-token': 1 } }],
            reply: ['Honest money for honest work. Here. Don’t make me regret it.'],
          },
          {
            text: 'Here: three bottles from the Wolfskin den. Your men will enjoy them.',
            if: { hasItem: { liquor: 3 } },
            effects: [{ takeItem: { liquor: 3 } }, { giveItem: { 'watch-token': 1 } }, { standing: { honor: 4, dread: 4, text: 'Cleared the Wolfskin den and brought the watch its liquor' } }, { relationship: 2 }],
            reply: ['You took those off the Wolfskins? In their own den?', 'Then you’ve done my job for me. Take the token, and tell nobody where the bottles came from.'],
          },
          {
            text: 'You’ll give me that token, Sergeant, or the watch will be one man short.',
            effects: [{ giveItem: { 'watch-token': 1 } }, { standing: { honor: -10, dread: 10, text: 'Threatened Sergeant Hobb of the watch' } }, { flag: 'watchCold' }, { relationship: -5 }],
            reply: ['…Take it. Take it and get off my bridge.', 'The watch will remember your face.'],
          },
        ],
      },
      { if: { flag: 'watchCold' }, lines: ['Keep walking. The watch has nothing for you.'] },
      { if: { talked: true }, lines: ['Back again. The bridge hasn’t moved.'] },
      { lines: ['Hobb, sergeant of the watch. This is the west gate. The Old Road starts across the bridge.'] },
    ],
    topics: [
      { id: 'road', text: 'Is the Old Road safe?', lines: ['On the stones, mostly. Step off them and the Wolfskins will find you before you find them.'] },
      { id: 'liquor', text: 'What does the watch want, then?', if: { storyStep: 'c1-prior.token' }, lines: ['Gold works. So would whatever rotgut the Wolfskins keep in their den. Three bottles, say.', 'The den is deep in the southern woods off the Old Road.'] },
    ],
    bye: { text: 'Good day, Sergeant.', lines: ['Stay out of my reports.'] },
  },

  // Mother Aveline (Dawnwatch Temple): tired, dry, unafraid.
  'dunmere.aveline': {
    speaker: 'Mother Aveline',
    portrait: AVELINE,
    variants: [
      { if: { talked: true }, lines: ['The lamps are lit again. Small mercies.'] },
      { lines: ['You came past Malric, so you are either brave or lost.', 'I am Aveline. This was a house of the Dawn, before.'] },
    ],
    topics: [
      { id: 'what', text: 'What happened here?', lines: ['Malric was one of us. He found that pilgrims pay more to pass than to pray.'] },
    ],
    bye: { text: 'Thank you, Mother.', lines: ['Walk in the light. Or near it, at least.'] },
  },

  'story.c1.aveline': {
    speaker: 'Mother Aveline',
    portrait: AVELINE,
    decide: true,
    leave: 'I’ll come back.',
    variants: [
      {
        lines: ['The Broken Lantern. Yes, they wrote their names in our book, every time they went west.', 'The book holds every pilgrim’s name. I show it only to someone the Dunmere watch will vouch for.'],
        choices: [
          {
            text: 'Then I’ll get the watch’s word.',
            reply: ['Sergeant Hobb keeps the west gate. Bring me his token, and the book is yours to read.'],
          },
        ],
      },
    ],
    topics: [
      { id: 'why', text: 'Why the watch?', lines: ['Because the last stranger who asked for that book burned two pages of it. The watch hanged him. I’d rather not need them again.'] },
      { id: 'seven', text: 'Did you know them?', lines: ['I prayed with them. They were loud, and kind, and in a hurry. Most of the young are.'] },
    ],
  },

  'story.c1.book': {
    speaker: 'Mother Aveline',
    portrait: AVELINE,
    decide: true,
    leave: false,
    variants: [
      {
        if: { hasItem: { 'watch-token': 1 } },
        lines: ['Hobb’s token. He doesn’t give those lightly.', 'Here. The last page they signed, the autumn of 1183.'],
        choices: [
          {
            text: 'Someone circled a name.',
            effects: [{ takeItem: { 'watch-token': 1 } }, { rumor: { location: 'greenhollow', note: 'Maren, an herbalist in Greenhollow, is circled in the Lantern’s prayer book.' } }],
            reply: [
              'Maren. An herbalist in Greenhollow. Their healer must have circled her: she patched them up more than once.',
              'If anyone saw them after the Blackwood, it would be her. The Thornwood road will take you there.',
            ],
          },
        ],
      },
      {
        lines: ['Bring me Hobb’s token, and you can read the book.'],
        choices: [{ text: 'I’ll be back with it.', effects: [{ wait: true }], reply: ['The book will wait. It’s good at that.'] }],
      },
    ],
  },

  // The Lantern's waystone on the Thornwood road (an object card).
  'wild.thornwood.waystone': {
    speaker: 'Old waystone',
    portrait: 'portrait.poi',
    leave: 'Move on',
    variants: [
      {
        if: { notItem: 'waystone-rubbing', storyStep: 'c1-thornwood.waystone' },
        lines: ['A mossy waystone, older than the road. Under the moss someone has carved seven small lanterns, and a date: 1183.'],
        choices: [{ text: 'Copy the marks.', effects: [{ giveItem: { 'waystone-rubbing': 1 } }], reply: ['You press paper to the stone and rub it with charcoal. Seven lanterns, and under them, scratched later and in a hurry: “M. knows.”'] }],
      },
      { lines: ['A mossy waystone. Seven small lanterns are carved under the moss.'] },
    ],
  },

  // Secondary errands (Chapter 1).
  // Hesta Coal: the kiln-master; loud, blunt, generous.
  'story.e1.hesta': {
    speaker: 'Hesta Coal',
    portrait: 'portrait.dunmere.kilnmaster',
    decide: true,
    leave: 'Not today.',
    variants: [
      {
        lines: ['You there, with the banner. My hands are raw from the kiln again.', 'Feverfew from the Old Road fixes them. Three bundles, and I’ll pay you properly.'],
        choices: [{ text: 'Three bundles. We’ll find them.', reply: ['Good. It grows off the road in the western woods. Mind where you step.'] }],
      },
    ],
  },
  'story.e1.hesta.done': {
    speaker: 'Hesta Coal',
    portrait: 'portrait.dunmere.kilnmaster',
    decide: true,
    leave: false,
    variants: [
      {
        if: { hasItem: { feverfew: 3 } },
        lines: ['Feverfew! Bless you. Give it here before I drop another pot.'],
        choices: [{ text: 'Here you are. (30 gold)', effects: [{ takeItem: { feverfew: 3 } }, { gold: 30 }, { relationship: 2 }], reply: ['If your guild ever needs a kiln, you know where I am.'] }],
      },
      { lines: ['Three bundles, mind. Not two.'], choices: [{ text: 'Coming.', effects: [{ wait: true }] }] },
    ],
  },
  // Warden Tamsin: Greenhollow's forest warden; terse, practical.
  'story.e2.tamsin': {
    speaker: 'Warden Tamsin',
    portrait: 'portrait.greenhollow.warden',
    decide: true,
    leave: 'Not now.',
    variants: [
      {
        lines: ['Poachers have strung the Thornwood with snares. Deer, hares, my wardens’ ankles.', 'Bring me three of their snares, and the poachers won’t be stringing more.'],
        choices: [{ text: 'Three snares. Done.', reply: ['The stalkers in the undergrowth set them. They won’t hand them over politely.'] }],
      },
    ],
  },
  'story.e2.tamsin.done': {
    speaker: 'Warden Tamsin',
    portrait: 'portrait.greenhollow.warden',
    decide: true,
    leave: false,
    variants: [
      {
        if: { hasItem: { 'poacher-snare': 3 } },
        lines: ['Three snares. And no poachers behind them, I hope.'],
        choices: [{ text: 'None that will set more. (60 gold)', effects: [{ takeItem: { 'poacher-snare': 3 } }, { gold: 60 }, { standing: { honor: 4, text: 'Cleared the poachers’ snares from the Thornwood' } }], reply: ['The wardens owe you one. We don’t forget.'] }],
      },
      { lines: ['Three, I said.'], choices: [{ text: 'Coming.', effects: [{ wait: true }] }] },
    ],
  },
};
