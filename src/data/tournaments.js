// Tournaments (tournaments-circuits spec): every tournament is a guild event in
// one of three circuits. A guild enters the circuits of its status tier or
// lower, with a team of up to the circuit's size (fewer is allowed). Bouts are
// team battles. The calendar runs through the year so an Initiation event is
// never far off; the World Conclave is yearly. Numbers are first guesses
// (fees, purses and fame scale by circuit; tuned in Phase 8).

/** The circuits, in status order. `tierIndex` is the guild status tier (internal ids Regional/National/Global). */
export const CIRCUITS = {
  Initiation: { id: 'Initiation', tierIndex: 0, teamSize: 2, label: 'Initiation tournaments' },
  Champion: { id: 'Champion', tierIndex: 1, teamSize: 4, label: 'Champion tournaments' },
  Elite: { id: 'Elite', tierIndex: 2, teamSize: 5, label: 'Elite tournaments' },
};
export const CIRCUIT_LIST = Object.values(CIRCUITS);
export const CIRCUIT_BY_TIER = Object.fromEntries(CIRCUIT_LIST.map((circuit) => [circuit.tierIndex, circuit]));

/** What the player sees for a guild status tier (internal ids stay Regional/National/Global). */
export const STATUS_NAMES = { Regional: 'Initiation', National: 'Champion', Global: 'Elite' };
export const statusName = (tier) => STATUS_NAMES[tier] || tier;

const event = (id, name, circuit, locationId, month, week, extra) => ({
  id,
  name,
  circuit,
  tierIndex: CIRCUITS[circuit].tierIndex,
  teamSize: CIRCUITS[circuit].teamSize,
  locationId,
  month,
  week: week - 1,
  size: 8,
  ...extra,
});

// Months: 0 Deepwinter, 1 Thawrise, 2 Rainmoot, 3 Greengale, 4 Highsun, 5 Brightwane,
// 6 Harvestcall, 7 Amberfall, 8 Mistmarch, 9 Redleaf, 10 Frostwane, 11 Longnight.
export const TOURNAMENTS = [
  event('deepforge-brawl', 'Deepforge Brawl', 'Initiation', 'ironford', 0, 3, {
    entryFee: 50, purse: 340, prestige: 20, minFame: 15, trophy: 'The Ember Anvil',
    description: 'In the dead of winter, pairs brawl in the cooling pits under the Great Forge while the smiths bet their wages.',
    record: { name: 'Brass Wolves', wins: 3, years: [1179, 1182, 1185] },
  }),
  event('gale-games', 'Gale Games', 'Initiation', 'windmere', 1, 2, {
    entryFee: 40, purse: 260, prestige: 17, minFame: 5, trophy: 'The Kite Pennant',
    description: 'A spring contest of speed and balance on the windy cliff paths. Teams that fight the wind lose to it.',
    record: { name: 'Cloudstep School', wins: 3, years: [1177, 1181, 1184] },
  }),
  event('tidecross-open', 'Tidecross Open', 'Champion', 'tidecross', 2, 3, {
    entryFee: 140, purse: 920, prestige: 34, minFame: 70, trophy: 'The Pearl Sabre',
    description: 'Harbour bouts on a floating stage. Champion companies come for the purse and the sea crowds.',
    record: { name: 'Redwake Crew', wins: 4, years: [1169, 1172, 1176, 1179] },
  }),
  event('greenhollow-thorn-cup', 'Greenhollow Thorn Cup', 'Initiation', 'greenhollow', 3, 3, {
    entryFee: 45, purse: 320, prestige: 20, minFame: 10, trophy: 'The Living Thorn',
    description: 'A forest arena where movement, patience and terrain control matter as much as raw force.',
    record: { name: 'Mosswood Fellowship', wins: 3, years: [1173, 1178, 1183] },
  }),
  event('windmere-cliff-duels', 'Windmere Cliff Duels', 'Initiation', 'windmere', 4, 2, {
    entryFee: 40, purse: 240, prestige: 18, minFame: 5, trophy: 'The Gull Feather',
    description: 'Pairs fight on the cliff-top ring above the harbour, where a step too far ends the bout.',
    record: { name: 'Gale Lanterns', wins: 5, years: [1168, 1171, 1175, 1179, 1182] },
  }),
  event('grand-companies', 'Grand Companies Championship', 'Elite', 'cloud-monastery', 4, 4, {
    entryFee: 980, purse: 9200, prestige: 145, minFame: 1000, minCombatWins: 35, trophy: 'Banner of the Open Sky',
    description: 'The world championship for guild companies. Five heroes and no easy bracket.',
    record: { name: 'Ivory Griffins', wins: 5, years: [1170, 1174, 1178, 1181, 1185] },
  }),
  event('sunspire-royal-arena', 'Sunspire Royal Arena', 'Champion', 'sunspire', 5, 1, {
    entryFee: 210, purse: 1450, prestige: 44, minFame: 140, trophy: 'The Solar Laurel',
    description: 'The royal sands of Sunspire, where noble houses sponsor companies and remember who embarrassed them.',
    record: { name: 'Sunblade Company', wins: 6, years: [1159, 1161, 1164, 1167, 1170, 1175] },
  }),
  event('dunmere-harvest-melee', 'Dunmere Harvest Melee', 'Initiation', 'dunmere', 6, 2, {
    entryFee: 35, purse: 260, prestige: 18, minFame: 0, trophy: 'The Amber Blade',
    description: 'The first serious proving ground of western Valedorn. Local pairs become folk heroes; famous ones are expected to win.',
    record: { name: 'Silver Falcons', wins: 4, years: [1166, 1169, 1171, 1174] },
  }),
  event('caldera-crown', 'The Caldera Crown', 'Elite', 'ashen-caldera', 7, 4, {
    entryFee: 520, purse: 4200, prestige: 98, minFame: 500, trophy: 'The Crown of Cinders',
    description: 'Fought on the rim of a living volcano. The heat takes as many companies as their opponents do.',
    record: { name: 'Ember Lions', wins: 5, years: [1157, 1160, 1163, 1168, 1172] },
  }),
  event('crownfall', 'The Crownfall Tournament', 'Champion', 'mooncourt', 8, 2, {
    nickname: 'the King’s Tourney', entryFee: 460, purse: 3600, prestige: 72, minFame: 280, minCombatWins: 12, trophy: 'The Crownfall Crown',
    description: 'The kingdom’s premier guild championship, called the King’s Tourney in every tavern.',
    // Nine straight titles for the Argent Crown; the 1183 title is officially “vacated”.
    record: { name: 'The Argent Crown', wins: 9, years: [1174, 1175, 1176, 1177, 1178, 1179, 1180, 1181, 1182], vacated: { year: 1183, guildName: 'The Broken Lantern' } },
  }),
  event('ironford-hammer-trials', 'Ironford Hammer Trials', 'Initiation', 'ironford', 9, 4, {
    entryFee: 55, purse: 380, prestige: 22, minFame: 20, trophy: 'The Bridge Hammer',
    description: 'Teams fight on the old bridge while the forges roar below. Endurance wins more than flair.',
    record: { name: 'Iron Hart Company', wins: 5, years: [1158, 1160, 1162, 1165, 1168] },
  }),
  event('mooncourt-mindblade', 'Mooncourt Mindblade Invitational', 'Champion', 'mooncourt', 10, 1, {
    entryFee: 260, purse: 1750, prestige: 52, minFame: 210, trophy: 'The Mirror Circlet',
    description: 'An invitational of patience and tricks under the moon court’s mirrors. The quiet companies win here.',
    record: { name: 'The Gilded Quill', wins: 5, years: [1162, 1166, 1171, 1177, 1181] },
  }),
  event('hollow-lights-trial', 'Hollow Lights Trial', 'Initiation', 'greenhollow', 10, 3, {
    entryFee: 45, purse: 300, prestige: 19, minFame: 10, trophy: 'The Hollow Lamp',
    description: 'Night bouts among lantern-hung trees at the Thornwood edge. The crowd follows the lights, and so must the fighters.',
    record: { name: 'Thornwake Wardens', wins: 2, years: [1180, 1184] },
  }),
  event('world-conclave-championship', 'World Conclave Championship', 'Elite', 'coral-crown', 11, 1, {
    entryFee: 850, purse: 7800, prestige: 130, minFame: 900, trophy: 'The Sevenfold Star',
    description: 'Once every four years, now every year: the world’s great companies meet on the coral terraces.',
    record: { name: 'Ivory Griffins', wins: 4, years: [1148, 1152, 1160, 1164] },
  }),
  event('lantern-night-bouts', 'Lantern Night Bouts', 'Initiation', 'dunmere', 11, 3, {
    entryFee: 35, purse: 280, prestige: 18, minFame: 0, trophy: 'The Lantern of Banner Plaza',
    description: 'On the longest night Dunmere lights every lantern on Banner Plaza, and pairs fight until the oil runs out.',
    record: { name: 'Fox & Pike Company', wins: 3, years: [1176, 1180, 1183] },
  }),
];
export const TOURNAMENT_BY_ID = Object.fromEntries(TOURNAMENTS.map((definition) => [definition.id, definition]));

/** Special titles, earned by collections of wins (shown in the Crown Room, Records and the season review). */
export const SPECIAL_TITLES = [
  { id: 'triple-crowned', name: 'Triple Crowned', how: 'Win all 3 Elite tournaments' },
  { id: 'master-of-the-world', name: 'Master of the World', how: 'Win all 15 tournaments' },
  { id: 'initiation-grand-tour', name: 'Initiation Grand Tour', how: 'Win all 8 Initiation tournaments' },
  { id: 'champions-slam', name: 'Champion’s Slam', how: 'Win all 4 Champion tournaments' },
  { id: 'season-sweep', name: 'Season Sweep', how: 'Win every tournament of one circuit in the same year' },
  { id: 'dynasty', name: 'Dynasty', how: 'Win the same tournament 3 years in a row' },
  { id: 'giant-killer', name: 'Giant Killer', how: 'Beat a guild two status tiers above yours in a bout' },
];
export const SPECIAL_TITLE_BY_ID = Object.fromEntries(SPECIAL_TITLES.map((title) => [title.id, title]));
