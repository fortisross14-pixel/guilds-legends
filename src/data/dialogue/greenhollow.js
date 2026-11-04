// Greenhollow conversations. Format: src/data/dialogue/index.js.
import { OFFICIAL_STORY } from '../lore.js';
import { patronChoices } from './patronTalk.js';
const P = (id) => `portrait.greenhollow.${id}`;

// Brother Alder speaks for the Temple of the Dawn (src/data/patrons.js).
const TEMPLE = patronChoices('temple', 'Temple', {
  ally: 'As family. The Dawn will pay you more for every life you bring back.',
  partner: 'As friends. Our healers count you as their own, and Sister Maelle has asked to walk with you.',
  contact: 'Kindly. Our healing comes cheaper to friends, and the hurt mend sooner.',
  stranger: 'As strangers still. Take a rescue contract and we will learn your faces.',
  gift: 'Alder accepts the coin for the infirmary. “The Dawn sees.”',
});

export default {
  'greenhollow.herbalist': {
    speaker: 'Maren Bell',
    portrait: P('herbalist'),
    variants: [
      {
        if: { season: 'spring' },
        lines: ['Spring cuttings! Everything wants to grow and nothing wants to be picked. Mind the nettles.'],
      },
      {
        lines: ['Silverleaf grows at the Thornwood edge, past the ward stones. My knees will not take me there any more.'],
        choices: [
          {
            text: 'I could bring some back.',
            if: { notFlag: 'marenErrand' },
            effects: [{ flag: 'marenErrand' }, { relationship: 1 }, { item: { potion: 1 } }],
            reply: ['Bless you. Here, for the walk. Silverleaf has a silver underside; do not bring me nettles.'],
          },
          { text: 'Show me your herbs', effects: [{ open: 'shop' }] },
        ],
      },
    ],
  },
  'greenhollow.warden': {
    speaker: 'Warden Tamsin',
    portrait: P('warden'),
    variants: [
      {
        if: { storyDone: 'm4' },
        lines: ['Lantern light in the Blackwood again. The wardens will not go near it. If your guild does, go together.'],
      },
      {
        lines: ['North of here is the Thornwood edge. Stalkers in the brush, and a bandit crew in the meadow that thinks it is clever.', 'Their captain, Vask, keeps to the north thicket behind a wall of shields. When the shield drops, run or finish it.'],
        choices: [{ text: 'Thanks for the warning.', effects: [{ relationship: 1 }] }],
      },
    ],
  },
  'greenhollow.storyteller': {
    speaker: 'Old Fen',
    portrait: P('storyteller'),
    variants: [
      {
        if: { talked: true },
        lines: ['Back for another? Seven of them, the Broken Lantern. Nobody in Dunmere says their names out loud. Ask yourself why.'],
      },
      {
        lines: [
          'Sit, sit. You carry a banner like the Broken Lantern did. They came through here after the Crownfall.',
          `Everyone knows the tale. ${OFFICIAL_STORY}`,
          'A good tale. Too good, if you ask me. Tales that tidy are usually paid for.',
        ],
        choices: [{ text: 'Who paid for it?', effects: [{ flag: 'heardFenTale' }, { codex: 'official-story' }], reply: ['Nobody knows. That is what makes it a story and not a funeral.'] }],
      },
    ],
  },
  'greenhollow.stablehand': {
    speaker: 'Kit',
    portrait: P('stablehand'),
    variants: [
      {
        lines: ['You came from Dunmere? On foot? The caravans to Ironford leave from the south lane, if you ever want a ride.'],
        choices: [
          {
            text: 'Any news on the roads?',
            effects: [{ rumor: { location: 'ironford', note: 'Caravans run from Greenhollow’s south lane to Ironford.' } }],
            reply: ['Ironford smiths pay double for anything with a bit of Thornwood iron-bark in it. Just saying.'],
          },
        ],
      },
    ],
  },
  'greenhollow.cleric': {
    speaker: 'Brother Alder',
    portrait: P('cleric'),
    variants: [
      {
        if: { patronRival: 'temple' },
        lines: ['The Dawn still rises for you, {guild}. It simply does not wait for you any more.'],
        choices: [...TEMPLE],
      },
      {
        if: { notFlag: 'alderBlessing', charter: 'shield' },
        lines: ['A Shield of the People. The Temple of the Dawn has prayed for a guild like yours.'],
        choices: [
          {
            text: 'Then bless us.',
            effects: [{ flag: 'alderBlessing' }, { reputation: { region: 'Verdant Marches', amount: 4 } }, { relationship: 1 }, { patron: { id: 'temple', amount: 8 } }],
            reply: ['Walk gently, and the forest will remember it. So will the Temple.'],
          },
          ...TEMPLE,
        ],
      },
      {
        if: { notFlag: 'alderBlessing' },
        lines: ['The grove blesses travellers who ask. Most do not ask.', 'I speak for the Temple of the Dawn here. We tend the hurt, and we pay those who rescue them.'],
        choices: [
          {
            text: 'I am asking.',
            effects: [{ flag: 'alderBlessing' }, { reputation: { region: 'Verdant Marches', amount: 4 } }, { relationship: 1 }, { patron: { id: 'temple', amount: 4 } }],
            reply: ['Then walk gently, and the forest will remember it. So will Greenhollow.'],
          },
          ...TEMPLE,
        ],
      },
      { lines: ['The grove remembers you. Walk gently.'], choices: [...TEMPLE] },
    ],
  },

  'greenhollow.oak': {
    speaker: 'The Elder Oak',
    portrait: 'portrait.poi',
    variants: [{ lines: ['The oak is wider than a house. Ribbons hang from its lower branches, each tied for someone who went into the Thornwood.'] }],
  },
  'greenhollow.wardstone': {
    speaker: 'Ward stone',
    portrait: 'portrait.poi',
    variants: [{ lines: ['A standing stone carved with thorns. It hums faintly, like a bee in a jar.'] }],
  },
  'greenhollow.well': {
    speaker: 'Stream well',
    portrait: 'portrait.poi',
    variants: [{ lines: ['Clear water, mint growing in the cracks. A bucket hangs ready.'] }],
  },
};
