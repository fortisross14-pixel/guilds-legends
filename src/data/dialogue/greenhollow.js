// Greenhollow conversations. Format: src/data/dialogue/index.js; style and voices: docs/DIALOGUE.md.
import { patronTopics } from './patronTalk.js';
const P = (id) => `portrait.greenhollow.${id}`;

// Brother Alder speaks for the Temple of the Dawn (src/data/patrons.js).
const TEMPLE = patronTopics('temple', 'the Temple', {
  ally: ['As family. The Dawn pays you more for every life you bring back.'],
  partner: ['As friends. Our healers count you as their own. Sister Maelle has asked to walk with you.'],
  contact: ['Kindly. Our healing comes cheaper to friends, and the hurt mend sooner.'],
  stranger: ['As strangers, still. Take a rescue contract, and we will learn your faces.'],
  gift: ['He accepts the coin for the infirmary. “The Dawn sees.”'],
});

export default {
  // Maren Bell: tired, sharp-tongued, kind underneath; talks about plants and patients.
  'greenhollow.herbalist': {
    speaker: 'Maren Bell',
    portrait: P('herbalist'),
    variants: [
      { if: { storyDone: 'm5' }, lines: ['You again. I said what I saw. I’m not sorry I said it, which surprises me.'] },
      { if: { season: 'spring', talked: true }, lines: ['Spring cuttings! Everything wants to grow and nothing wants to be picked. Mind the nettles.'] },
      { if: { talked: true }, lines: ['Back again? Wipe your boots. That’s three days of drying silverleaf you’re standing on.'] },
      {
        lines: ['Careful, that’s a seedbed, not a doormat. Who are you, and why are you on my thyme?'],
        choices: [
          { text: 'Sorry! {founder}, of {guild}.', reply: ['A guild. Hm. I’m Maren Bell. I stitch up guilds. Try to need me less than most.'] },
          { text: 'Someone who needs herbs.', reply: ['Everyone needs herbs. Few say so. I’m Maren Bell. Ask.'] },
        ],
      },
    ],
    topics: [
      { id: 'silverleaf', text: 'Can I help with anything?', if: { notFlag: 'marenErrand' }, effects: [{ flag: 'marenErrand' }, { relationship: 1 }, { item: { potion: 1 } }], lines: ['Silverleaf grows past the ward stones. My knees won’t take me there anymore.', 'Take this for the walk. Silver underside, mind. Don’t bring me nettles.'] },
      { id: 'herbs', text: 'What do you sell?', effects: [{ open: 'shop' }], lines: ['Remedies that work, at prices that hurt less than the wound. Come and look.'] },
      { id: 'lantern', text: 'Did you ever meet the Broken Lantern?', if: { storyDone: 'c1-thornwood', notStoryDone: 'm5' }, lines: ['…Who sent you to ask me that?', 'Never mind. Not here, not now.'] },
    ],
    bye: { text: 'Thank you, Maren.', lines: ['Go on. And keep your people in one piece; I’m busy enough.'] },
  },

  // Warden Tamsin: terse, watchful, protective of the forest; speaks in warnings.
  'greenhollow.warden': {
    speaker: 'Warden Tamsin',
    portrait: P('warden'),
    variants: [
      { if: { storyDone: 'm4' }, lines: ['You. There’s lantern light in the Blackwood again. Tell me you haven’t been near it.'] },
      { if: { talked: true }, lines: ['Back. Good. The Thornwood hasn’t eaten you yet.'] },
      {
        lines: ['Stop there. Armed and headed north? Then you’re headed into my forest.', 'Warden Tamsin. I keep the ward stones. And count who comes back.'],
        choices: [
          { text: 'Just passing through.', reply: ['Nobody just passes through the Thornwood. It decides.'] },
          { text: 'We’re here to help.', effects: [{ relationship: 1 }], reply: ['Help is welcome. Heroics aren’t. Learn the difference.'] },
        ],
      },
    ],
    topics: [
      { id: 'dangers', text: 'What’s out in the Thornwood?', lines: ['Stalkers in the brush. And a bandit crew in the meadow that thinks it’s clever.'] },
      { id: 'vask', text: 'Who leads the bandits?', lines: ['Captain Vask. Keeps to the north thicket behind a wall of shields.', 'When the shields drop, run or finish it.'] },
      { id: 'blackwood', text: 'What’s wrong with the Blackwood?', if: { storyDone: 'm4' }, lines: ['The wardens won’t go near it. If your guild does, go together, and come back together.'] },
    ],
    bye: { text: 'Thanks for the warning.', lines: ['Don’t thank me. Come back. Then thank me.'] },
  },

  // Old Fen: rambling, wry storyteller; answers questions with questions.
  'greenhollow.storyteller': {
    speaker: 'Old Fen',
    portrait: P('storyteller'),
    variants: [
      { if: { evidenceAtLeast: 3 }, lines: ['You’ve been asking the right questions, haven’t you? I can see it on you. Sit.'] },
      { if: { talked: true }, lines: ['Back for another tale? Good. My knees can’t walk to anyone, so they come to me.'] },
      {
        lines: ['Sit, sit. You’ve got the look of someone carrying a story too heavy to put down.', 'They call me Old Fen. I collect stories. Got any?'],
        choices: [
          { text: 'Not one I can tell yet.', reply: ['Those are the best kind. They keep. Like cheese.'] },
          { text: 'I carry a banner.', reply: ['Do you, now. The last guild to carry one through here came after the Crownfall.'] },
        ],
      },
    ],
    topics: [
      { id: 'lantern', text: 'Tell me about the Broken Lantern.', effects: [{ flag: 'heardFenTale' }, { codex: 'official-story' }], lines: ['Everyone knows the tale. The captain bargained with the Warden and paid for it.', 'A good tale. Too good. Tales that tidy are usually paid for.'] },
      { id: 'who', text: 'Who paid for it?', if: { flag: 'heardFenTale' }, lines: ['Who has the most to gain from a story? Ask that, and you won’t need me.'] },
      { id: 'names', text: 'Do you know their names?', if: { flag: 'heardFenTale' }, lines: ['Seven of them. Nobody in Dunmere says their names out loud. Ask yourself why.'] },
    ],
    bye: { text: 'Thanks for the story.', lines: ['Bring me a better one next time. Yours, ideally.'] },
  },

  // Kit: a chatty stablehand; quick, gossipy, everything is "just saying".
  'greenhollow.stablehand': {
    speaker: 'Kit',
    portrait: P('stablehand'),
    variants: [
      { if: { talked: true }, lines: ['Hey, you’re back! Still walking everywhere? Your feet must hate you.'] },
      {
        lines: ['You came from Dunmere? On foot? Your poor feet.', 'Kit. I mind the horses. And the caravans. And everybody’s business, just saying.'],
        choices: [
          { text: 'On foot. It’s cheaper.', reply: ['Cheaper for your purse. Not for your boots.'] },
          { text: 'What business do you mind?', reply: ['Whatever passes the stable. Which is everything.'] },
        ],
      },
    ],
    topics: [
      { id: 'caravans', text: 'Where do the caravans go?', effects: [{ rumor: { location: 'ironford', note: 'Caravans run from Greenhollow’s south lane to Ironford.' } }], lines: ['Ironford, from the south lane, every few days. If you ever want a ride.'] },
      { id: 'news', text: 'Any news on the roads?', lines: ['Ironford smiths pay double for Thornwood iron-bark. Just saying.'] },
    ],
    bye: { text: 'See you, Kit.', lines: ['Mind the horse on your left. He bites. Just saying.'] },
  },

  // Brother Alder: serene, gentle, a little formal; speaks of the Dawn and the forest.
  'greenhollow.cleric': {
    speaker: 'Brother Alder',
    portrait: P('cleric'),
    variants: [
      { if: { patronRival: 'temple' }, lines: ['{guild}. The Dawn still rises for you. It simply no longer waits.'] },
      { if: { talked: true }, lines: ['Welcome back, friend. The grove remembers you.'] },
      {
        lines: ['Peace on your road, traveller. You stand in the Temple of the Dawn’s grove.', 'I am Brother Alder. We tend the hurt, and we pay those who rescue them.'],
        choices: [
          { text: 'Peace on yours, Brother.', effects: [{ relationship: 1 }], reply: ['Courtesy! The forest notices such things. So do I.'] },
          { text: 'You pay guilds?', reply: ['For rescues, yes. A life returned is worth more than coin, but coin helps.'] },
        ],
      },
    ],
    topics: [
      { id: 'blessing', text: 'Would you bless our guild?', if: { notFlag: 'alderBlessing', charter: 'shield' }, effects: [{ flag: 'alderBlessing' }, { reputation: { region: 'Verdant Marches', amount: 4 } }, { relationship: 1 }, { patron: { id: 'temple', amount: 8 } }], lines: ['A Shield of the People. We have prayed for a guild like yours.', 'Walk gently, and the forest will remember it. So will the Temple.'] },
      { id: 'blessing', text: 'Would you bless our guild?', if: { notFlag: 'alderBlessing' }, effects: [{ flag: 'alderBlessing' }, { reputation: { region: 'Verdant Marches', amount: 4 } }, { relationship: 1 }, { patron: { id: 'temple', amount: 4 } }], lines: ['Most travellers never ask. Then walk gently, and the forest will remember it.'] },
      ...TEMPLE,
    ],
    bye: { text: 'Thank you, Brother.', lines: ['Go with the Dawn. It is earlier than you think.'] },
  },

  // Places and things.
  'greenhollow.oak': {
    speaker: 'The Elder Oak',
    portrait: 'portrait.poi',
    leave: 'Move on',
    variants: [{ lines: ['The oak is wider than a house. Ribbons hang from its lower branches.', 'Each one is tied for someone who went into the Thornwood.'] }],
  },
  'greenhollow.wardstone': {
    speaker: 'Ward stone',
    portrait: 'portrait.poi',
    leave: 'Move on',
    variants: [{ lines: ['A standing stone carved with thorns. It hums faintly, like a bee in a jar.'] }],
  },
  'greenhollow.well': {
    speaker: 'Stream well',
    portrait: 'portrait.poi',
    leave: 'Move on',
    variants: [{ lines: ['Clear water, mint growing in the cracks. A bucket hangs ready.'] }],
  },
};
