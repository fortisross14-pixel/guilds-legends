// Contracts as places and things to do there (missions-in-world spec). Each
// contract template (src/data/content.js MISSION_TEMPLATES) and each Chapter 1
// story contract has a site: where it happens (`place`, see places.js) and its
// objectives, in order. Objectives are things in the world:
//   fight   enemy group (`enemies` type ids from data/enemies.js, `count`, `level`, `boss`)
//   talk    a person with a line and choices; a choice may test a hero stat
//           (`check: { stat, dc }`), shown as "Presence 52: likely"; `rough` marks a
//           choice that works but costs the grade; `fight` turns the talk into a fight
//   inspect a clue, tracks, a lock; `needs` ({ classId } or { stat, min }) gates it,
//           `check` makes it a test (a failed sneak raises the alarm: `alarm`)
//   collect herbs, ore, evidence (`count` taps)
//   escort  a person who follows the party to `to` (an objective id or 'exit')
// `optional: true` marks an extra (a hidden cache, a side path); `after` hides an
// objective until another is done. `par` is the days a clean job takes, `deadline`
// the days before it fails (none = no deadline). Numbers are first guesses.
import { TOWN_PAINTED, TOWN_WILD } from './places.js';

export { WILD_ANCHORS, TOWN_ANCHORS, PAINTED_SITES } from './places.js';

const fight = (id, name, enemies, extra = {}) => ({ id, kind: 'fight', name, enemies, count: 3, level: 2, power: 40, ...extra });
const inspect = (id, name, text, extra = {}) => ({ id, kind: 'inspect', name, text, ...extra });
const collect = (id, name, count, extra = {}) => ({ id, kind: 'collect', name, count, ...extra });
const talk = (id, name, role, line, choices, extra = {}) => ({ id, kind: 'talk', name, role, line, choices, ...extra });
const escort = (id, name, role, line, to, extra = {}) => ({ id, kind: 'escort', name, role, line, to, ...extra });
const cache = (id = 'cache', name = 'A hidden cache') => ({ id, kind: 'collect', name, count: 1, optional: true, loot: true });

/** Sites for the contract templates, by template id. */
export const SITES = {
  'wolves-old-road': {
    place: 'wild',
    par: 3,
    objectives: [
      inspect('tracks', 'Wolf tracks', 'Paw prints, and boot prints beside them. Someone drives this pack.'),
      fight('pack', 'The pack', ['grey-wolf', 'grey-wolf', 'road-bandit'], { count: 3, level: 1, power: 36, after: 'tracks' }),
      fight('handler', 'The handler', ['road-bandit', 'grey-wolf'], { count: 2, level: 2, power: 40, boss: true, after: 'pack' }),
      cache(),
    ],
  },
  'missing-apothecary': {
    place: 'town',
    par: 4,
    deadline: 14,
    objectives: [
      talk('apprentice', 'Pell Wick', 'Apprentice', 'She went out for moonleaf and never came back.', [
        { text: 'Where did she go?', check: { stat: 'Presence', dc: 45 }, success: 'East, past the mill. She was frightened of someone.', fail: 'He clams up. You find her ledger yourself.', rough: false },
      ]),
      inspect('shop', 'The locked shop', 'Torn pages, and a smell of lamp oil. The back door was forced.', { needs: { stat: 'Finesse', min: 45 }, alt: 'The lock holds. A Rogue, or steadier hands, could open it.' }),
      talk('watchman', 'Old Bern', 'Watchman', 'I saw her with two strangers. Heading for the old granary.', [
        { text: 'Thank him', success: 'He nods. "Bring her back."' },
      ], { after: 'apprentice' }),
      fight('kidnappers', 'Kidnappers', ['road-bandit', 'shield-thug'], { count: 2, level: 2, power: 40, after: 'watchman' }),
      inspect('herbs', 'Her herb basket', 'Moonleaf, neatly bundled. A rare find to return to her.', { optional: true }),
    ],
  },
  'millers-daughter': {
    place: 'wild',
    par: 3,
    deadline: 10,
    objectives: [
      inspect('ribbon', 'A torn ribbon', 'Blue silk on a thorn. The miller’s daughter came this way.'),
      fight('captors', 'Her captors', ['road-bandit', 'shield-thug', 'road-bandit'], { count: 3, level: 2, power: 40, after: 'ribbon' }),
      escort('daughter', 'Elsa', 'Miller’s daughter', 'You came! Please, get me home.', 'exit', { after: 'captors' }),
      cache(),
    ],
  },
  'blackwood-lanterns': {
    place: { wild: 'blackwood' },
    par: 4,
    objectives: [
      inspect('lantern', 'A cold lantern', 'Its glass is cracked from the inside. The light went somewhere.'),
      fight('hollow', 'The hollow guard', ['hollow-knight', 'veil-shade'], { count: 2, level: 5, power: 56, after: 'lantern' }),
      collect('wicks', 'Lantern wicks', 2, { after: 'hollow' }),
      cache(),
    ],
  },
  'barons-tithe': {
    place: 'town',
    par: 3,
    objectives: [
      talk('collector', 'Hask', 'Tithe collector', 'The baron’s due is the baron’s due. Pay or step aside.', [
        { text: 'Read him the town charter', check: { stat: 'Mind', dc: 50 }, success: 'He squints at the seal and backs down.', fail: 'He laughs at the old parchment.' },
        { text: 'Stand between him and the stalls', check: { stat: 'Presence', dc: 50 }, success: 'His men look at you, then at him, and leave.', fail: 'He shoves past.' },
        { text: 'Show him the door', fight: true, success: 'Steel comes out.' },
      ]),
      talk('elder', 'Mother Ama', 'Market elder', 'If you stand for us, the stalls will stand with you.', [{ text: 'We will', success: 'She gathers the stallholders.' }], { after: 'collector' }),
      inspect('ledger', 'The tithe ledger', 'Double entries. The baron has been taking twice.', { optional: true }),
    ],
  },
  'harvest-melee-prep': {
    place: 'wild',
    par: 3,
    objectives: [
      talk('sparring', 'Dagny', 'Sparring master', 'Want to be ready for the Melee? Beat my two best.', [{ text: 'Bring them on', fight: true, success: 'She whistles them over.' }]),
      fight('practice', 'Practice bout', ['shield-thug', 'road-bandit'], { count: 2, level: 1, power: 34, after: 'sparring' }),
      collect('banners', 'Melee banners', 2, { optional: true }),
    ],
  },
  'fog-ferry': {
    place: 'town',
    par: 3,
    objectives: [
      talk('ferryman', 'Corin', 'Ferryman', 'Three crossings, three fares gone. The fog takes them, they say.', [
        { text: 'Who says?', check: { stat: 'Mind', dc: 48 }, success: 'The new dock warden. Always the warden.', fail: 'He shrugs and spits.' },
        { text: 'Pay for his time (20 gold)', cost: 20, success: 'The warden. Always the warden.', rough: true },
      ]),
      inspect('dock', 'The dock warden’s hut', 'Fares in a tin box. And a map of the fog banks.', { after: 'ferryman', check: { stat: 'Finesse', dc: 50 }, alarm: 'The warden hears you and calls his men.' }),
      fight('warden', 'The warden’s men', ['road-bandit', 'shield-thug'], { count: 2, level: 2, power: 40, after: 'dock' }),
    ],
  },
  'hollow-bell': {
    place: 'wild',
    par: 4,
    objectives: [
      inspect('bell', 'The cracked bell', 'It rings by itself at dusk. Something lives under it.'),
      collect('bones', 'Old bones', 2, { after: 'bell' }),
      fight('keeper', 'What lives below', ['hedge-witch', 'shield-thug', 'field-priest'], { count: 3, level: 3, power: 44, boss: true, after: 'bones' }),
      cache(),
    ],
  },
};

/** Sites for the Chapter 1 story contracts, by `<mission>.<step>` and the route's variant. */
export const STORY_SITES = {
  'm3.contract': { default: SITES['wolves-old-road'] },
  'm5.errand': {
    default: {
      place: 'wild',
      par: 3,
      objectives: [
        collect('nightcap', 'Nightcap', 3),
        inspect('hollow', 'A trapper’s hollow', 'Someone cut nightcap here weeks ago, and left fast.'),
        fight('stalkers', 'Thorn stalkers', ['thorn-stalker', 'bark-brute'], { count: 2, level: 2, power: 42, after: 'nightcap' }),
        cache(),
      ],
    },
  },
  'm6.ledger': {
    default: {
      place: { painted: 'ironford-archive' },
      par: 2,
      objectives: [
        inspect('window', 'The back window', 'You slip in after the bell.', { check: { stat: 'Finesse', dc: 52 }, alarm: 'A guard turns at the sound.' }),
        fight('patrol', 'The night patrol', ['shield-thug', 'road-bandit'], { count: 2, level: 3, power: 44, optional: true }),
        inspect('shelf', 'The quartermaster’s shelf', 'Ledger, third shelf, under the tallies. You copy every page.', { after: 'window' }),
      ],
    },
    negotiate: {
      place: { painted: 'ironford-archive' },
      par: 3,
      objectives: [
        talk('council', 'Councillor Brant', 'Archive council', 'The ledger is the city’s. Why should we open it?', [
          { text: 'For the dead of the Crownfall', check: { stat: 'Presence', dc: 52 }, success: 'He is quiet a long time. "Tull may show you."', fail: '"Sentiment." He turns away.' },
          { text: 'For the Smiths’ Guild', check: { stat: 'Mind', dc: 50 }, success: '"The Smiths? Then it is trade. Fine."', fail: 'He is not convinced.' },
          { text: 'Pay the copying fee (40 gold)', cost: 40, success: 'He signs the order.', rough: true },
        ]),
        talk('tull', 'Oswin Tull', 'Quartermaster', 'Here it is. Read it somewhere I can’t see you.', [{ text: 'Take the ledger', success: 'He hands it over in the open.' }], { after: 'council' }),
      ],
    },
    force: {
      place: { painted: 'ironford-archive' },
      par: 2,
      objectives: [
        fight('enforcers', 'Argent Crown enforcers', ['shield-thug', 'road-bandit', 'field-priest'], { count: 3, level: 3, power: 46 }),
        fight('captain', 'Their captain', ['shield-thug', 'field-priest'], { count: 2, level: 4, power: 50, boss: true, after: 'enforcers' }),
        inspect('vault', 'The vault', 'The ledger, still warm from their hands.', { after: 'captain' }),
      ],
    },
    decipher: {
      place: 'town',
      par: 3,
      objectives: [
        inspect('tallies', 'The foundry tallies', 'Columns of numbers that do not add up the same way twice.', { check: { stat: 'Mind', dc: 48 } }),
        talk('clerk', 'Tamsin Ore', 'Foundry clerk', 'The old quartermaster used a reckoning key. I kept a copy.', [{ text: 'May I see it?', success: 'She slides it across.' }], { after: 'tallies' }),
        inspect('copy', 'The public copy', 'With the key, the payments read plain.', { after: 'clerk' }),
      ],
    },
  },
  'm8.hunters': {
    default: {
      place: 'wild',
      par: 2,
      deadline: 7,
      objectives: [
        inspect('hut', 'The trapper’s hut', 'Snares cut. She heard them coming.'),
        fight('hunters', 'Argent Crown hunters', ['thorn-stalker', 'road-bandit', 'shield-thug'], { count: 3, level: 3, power: 48, after: 'hut' }),
        fight('leader', 'The hunt leader', ['shield-thug', 'thorn-stalker'], { count: 2, level: 4, power: 50, boss: true, after: 'hunters' }),
        escort('wren', 'Linnet', 'Trapper', 'You’re the banner people. Fine. Walk me out.', 'exit', { after: 'leader' }),
      ],
    },
    spirit: {
      place: 'town',
      par: 2,
      deadline: 7,
      objectives: [
        talk('carter', 'Old Ness', 'Carter', 'A cart leaves at dusk. Room for one more under the hay.', [
          { text: 'Ask him to take her', check: { stat: 'Presence', dc: 46 }, success: 'He winks.', fail: 'He wants paying first.' },
          { text: 'Pay him (30 gold)', cost: 30, success: 'Coin talks.', rough: true },
        ]),
        inspect('watch', 'The hunters’ watch', 'You time their rounds.', { after: 'carter', check: { stat: 'Finesse', dc: 50 }, alarm: 'One of them sees you.' }),
        escort('wren', 'Linnet', 'Trapper', 'Under the hay? Fine. Go.', 'carter', { after: 'watch' }),
      ],
    },
    doors: {
      place: 'town',
      par: 3,
      deadline: 7,
      objectives: [
        talk('family-1', 'The Bells', 'Herbalist’s kin', 'Maren said you’d come. She can sleep in the loft.', [{ text: 'Thank you', success: 'One night, then the next door.' }]),
        talk('family-2', 'The Tarrows', 'Farmers', 'Hunters asked about her. We said nothing.', [
          { text: 'Will you hide her?', check: { stat: 'Presence', dc: 44 }, success: 'They nod.', fail: 'They are afraid.' },
          { text: 'Leave them some coin (20 gold)', cost: 20, success: 'They take it.', rough: true },
        ], { after: 'family-1' }),
        escort('wren', 'Linnet', 'Trapper', 'Every door in Greenhollow. You’re mad. Lead on.', 'family-2', { after: 'family-2' }),
      ],
    },
  },
};

/** Any other contract: a site built from its family (play styles, not pop-up games). */
export function familySite(family) {
  const f = String(family || '');
  if (/Political|Diplomatic|Investigation/.test(f))
    return {
      place: 'town',
      par: 3,
      objectives: [
        talk('contact', 'A contact', 'Local', 'You want the truth? It has a price.', [
          { text: 'Persuade them', check: { stat: 'Presence', dc: 50 }, success: 'They tell you everything.', fail: 'They hedge.' },
          { text: 'Pay (25 gold)', cost: 25, success: 'Coin loosens the tongue.', rough: true },
        ]),
        inspect('papers', 'The papers', 'Proof, in someone else’s hand.', { after: 'contact' }),
      ],
    };
  if (/Infiltration|Intrigue/.test(f))
    return {
      place: 'town',
      par: 2,
      objectives: [
        inspect('way-in', 'A way in', 'A loose shutter.', { check: { stat: 'Finesse', dc: 52 }, alarm: 'Someone shouts.' }),
        fight('guards', 'The guards', ['shield-thug', 'road-bandit'], { count: 2, level: 3, power: 44, optional: true }),
        inspect('prize', 'What you came for', 'You have it.', { after: 'way-in' }),
      ],
    };
  if (/Expedition|Exploration|Dungeon/.test(f))
    return { place: 'wild', par: 4, objectives: [collect('finds', 'Finds', 3), fight('guardian', 'The guardian', ['bark-brute', 'moss-golem'], { count: 2, level: 3, power: 46, boss: true, after: 'finds' }), cache()] };
  if (/Escort|Rescue/.test(f))
    return { place: 'wild', par: 3, objectives: [fight('ambush', 'The ambush', ['road-bandit', 'shield-thug'], { count: 3, level: 2, power: 42 }), escort('charge', 'The traveller', 'Traveller', 'Get me through.', 'exit', { after: 'ambush' }), cache()] };
  return { place: 'wild', par: 3, objectives: [inspect('signs', 'Signs of trouble', 'Fresh tracks.'), fight('foe', 'The threat', ['road-bandit', 'grey-wolf', 'shield-thug'], { count: 3, level: 2, power: 42, after: 'signs' }), cache()] };
}

/** A boss contract (engine stories.js): the region's boss in the wild area by the town. */
export function bossSite(bossId) {
  return { place: 'wild', par: 4, objectives: [inspect('lair', 'The lair', 'Bones, and something larger than bones.'), fight('boss', 'The boss', [], { boss: true, bossId, count: 3, level: 6, power: 60, after: 'lair' })] };
}

/** The site of a contract: its own, its story variant's, its boss's or its family's. */
export function siteFor(mission) {
  if (mission.story) {
    const variants = STORY_SITES[mission.story];
    if (variants) return variants[mission.storyVariant || 'default'] || variants.default;
  }
  if (mission.bossId) return bossSite(mission.bossId);
  return SITES[mission.templateId] || familySite(mission.family);
}

/** Where a site's place is for a contract posted in `locationId`: { kind: 'wild'|'town'|'painted', id }. */
export function placeFor(site, locationId) {
  const place = site.place || 'wild';
  if (typeof place === 'object') return place.wild ? { kind: 'wild', id: place.wild } : { kind: 'painted', id: place.painted };
  if (place === 'town') return { kind: 'town', id: locationId };
  if (TOWN_WILD[locationId]) return { kind: 'wild', id: TOWN_WILD[locationId] };
  return { kind: 'painted', id: TOWN_PAINTED[locationId] || 'ironford-slagpits' };
}
