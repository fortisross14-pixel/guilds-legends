// The world's history (docs/STORY.md, "The Last Banner"): the Broken Lantern's
// seven, Garrick Thorne's false official story, and the Lore codex. Codex
// entries are 2–4 sentences and unlock through the story, conversations,
// arena history boards and discoveries (engine: stories.js unlockCodexInPlace).

/** The Broken Lantern's seven. `fate` is the truth; `known` is what Chapter 1 can learn. */
export const BROKEN_LANTERN_SEVEN = [
  { id: 'aldric', name: 'Aldric Vane', role: 'Captain', classId: 'Duelist', fate: 'Led the survivors deeper into the Blackwood and died protecting them.', known: 'Led the survivors deeper into the Blackwood. The trail ends there.' },
  { id: 'wren', name: 'Wren', role: 'Scout', classId: 'Rogue', fate: 'Survived the ambush and fled; lives under an assumed name.', known: 'Rumored to have survived.' },
  { id: 'tobin', name: 'Tobin Thornfield', role: 'Ranger', classId: 'Ranger', fate: 'Taken into the forest by the Hollow Warden.', known: 'Nessa Thornfield’s older brother. Taken into the forest.' },
  { id: 'dunstan', name: 'Dunstan Oake', role: 'Shield', classId: 'Guardian', fate: 'Died holding the road against the mercenaries.', known: 'Died fighting the assassins.' },
  { id: 'ilse', name: 'Ilse Calloway', role: 'Healer', classId: 'Cleric', fate: 'Died tending the wounded during the ambush.', known: 'Died fighting the assassins.' },
  { id: 'pell', name: 'Pell Harrow', role: 'Map-maker', classId: 'Scholar', fate: 'Taken into the forest by the Hollow Warden.', known: 'Taken into the forest.' },
  { id: 'sorrel', name: 'Sorrel Quint', role: 'Spark-caller', classId: 'Mage', fate: 'Followed Aldric deeper into the Blackwood.', known: 'Followed Aldric deeper into the Blackwood.' },
];

/** Thorne's official account, repeated by NPCs early on (it is false). */
export const OFFICIAL_STORY =
  'The Broken Lantern’s captain, Aldric Vane, made a pact with the Hollow Warden of the Blackwood: his company’s luck for one great victory. He won the Crownfall, and the Warden came to collect.';

export const LORE_CATEGORIES = ['The Last Banner', 'People', 'Guilds and titles', 'Places', 'Tournaments'];

const lore = (id, category, title, text) => ({ id, category, title, text });

export const LORE = [
  // The Last Banner
  lore('broken-lantern', 'The Last Banner', 'The Broken Lantern', 'Seven nobodies who beat the Argent Crown in the 1183 Crownfall final. Months later they vanished in the Blackwood, their hall burned, their victory struck from the records.'),
  lore('official-story', 'The Last Banner', 'The official account', `${OFFICIAL_STORY} Every herald in Valedorn tells it the same way. That alone should make you suspicious.`),
  lore('the-banner', 'The Last Banner', 'The last banner', 'A torn, bloodstained banner with a golden lantern. Carried by the Broken Lantern, taken by Cassian Rook, and pressed into your hands the night he died.'),
  lore('rooks-confession', 'The Last Banner', 'Rook’s confession', 'An unfinished letter in Cassian Rook’s hand: “I gave the order. Thorne carried it out, and then kept going.” Unsigned, but the seal is his.'),
  lore('seven-names', 'The Last Banner', 'Seven names in the hem', 'Stitched inside the banner’s hem in seven different hands: Aldric, Wren, Tobin, Dunstan, Ilse, Pell, Sorrel. Somebody wanted them remembered.'),
  lore('door-emblem', 'The Last Banner', 'The mark on the door', 'The night Rook died, someone scratched the Argent Crown’s emblem into your door. A warning, or a signature. Someone knows the banner is here.'),
  lore('herbalist-account', 'The Last Banner', 'Followed into the woods', 'Maren Bell treated three Broken Lantern heroes in Greenhollow after the Crownfall. They were being followed by men in plain cloaks with good boots, the kind a rich guild buys.'),
  lore('ironford-ledger', 'The Last Banner', 'The Ironford ledger', 'A quartermaster’s ledger of payments: “road work, Blackwood, 400 crowns”, signed off by the Argent Crown’s treasury. Mercenaries are cheaper than honour, and they keep receipts.'),
  lore('fair-final', 'The Last Banner', 'The 1183 final', 'Halden Marsh fought Aldric Vane in the 1183 semifinal and lost. He swears the final against the Argent Crown was clean. The Broken Lantern simply fought better.'),
  lore('blackwood-ambush', 'The Last Banner', 'What happened in the Blackwood', 'Argent Crown mercenaries ambushed the Lantern on the forest road. Garrick Thorne had also paid an occultist to bind the Hollow Warden to catch anyone who escaped. The Warden grew beyond the binding.'),
  lore('aldric-deeper', 'The Last Banner', 'The trail ends', 'Aldric Vane led the survivors deeper into the Blackwood, away from the mercenaries. Nobody has followed that trail and come back. Yet.'),
  // People
  lore('cassian-rook', 'People', 'Lord Cassian Rook', 'Guildmaster of the Argent Crown for nine Crownfall titles. He ordered the Broken Lantern destroyed, then tried to expose his lieutenant. He died on your floor.'),
  lore('garrick-thorne', 'People', 'Garrick Thorne', 'Rook’s lieutenant, now guildmaster of the Argent Crown. A strategist, a charmer and a formidable fighter. Publicly, the man who rebuilt the Crown after Rook’s “tragic death”.'),
  lore('argent-enforcer', 'People', 'The face at the door', 'You saw him in the lamplight as you ran: a scar through one eyebrow and an Argent Crown signet. You will know him again.'),
  lore('mara-fen', 'People', 'Mara Fen', 'Keeper of the Wayfarer in Dunmere. Practical, skeptical and funny. She married an adventurer once; he never came back, and she never stopped listening for news.'),
  lore('nessa-thornfield', 'People', 'Nessa Thornfield', 'A young Ranger, hunter and guide who could not get a reputable guild to hire her. Her brother Tobin rode with the Broken Lantern. She does not say so at first.'),
  lore('bram-calder', 'People', 'Bram Calder', 'A promising Duelist from Dunmere who thinks your guild is a joke. Loud, proud and better than he looks. Rivals like him either stay rivals or become friends.'),
  lore('wren', 'People', 'Wren', 'The Broken Lantern’s young scout. She survived the Blackwood and has lived under other names ever since, with people hunting her.'),
  lore('the-seven', 'People', 'The Broken Lantern’s seven', 'Aldric Vane, captain. Wren, scout. Tobin Thornfield, ranger. Dunstan Oake, shield. Ilse Calloway, healer. Pell Harrow, map-maker. Sorrel Quint, spark-caller.'),
  // Guilds and titles
  lore('argent-crown', 'Guilds and titles', 'The Argent Crown', 'The most powerful guild in Valedorn, based in Mooncourt. Nine consecutive Crownfall titles from 1174 to 1182, then one humiliating afternoon in 1183.'),
  lore('crownfall', 'Guilds and titles', 'The Crownfall Tournament', 'The kingdom’s premier guild championship, the “King’s Tourney” to everyone outside Mooncourt. The official list for 1183 reads “Title vacated”.'),
  // Places
  lore('dunmere', 'Places', 'Dunmere', 'A market town rebuilt around kilns, old banners and stubborn civic pride. It notices who carries a new banner.'),
  lore('greenhollow', 'Places', 'Greenhollow', 'Forest wards, herbal schools and villages grown around elder roads. The healers here remember everyone they have stitched up.'),
  lore('ironford', 'Places', 'Ironford', 'A bridge city of foundries, caravan guards and severe craft guilds. Its archives keep every contract ever paid for.'),
  lore('windmere', 'Places', 'Windmere', 'Hill monasteries, couriers and cliffside dueling schools. Old fighters come home to Windmere to die, or to keep fighting.'),
  lore('blackwood', 'Places', 'The Blackwood', 'Dead trees, black mud and lantern light where no one carries a lantern. Something vast stands between the trees a little way in, and it does not let anyone pass.'),
  lore('hollow-warden', 'Places', 'The Hollow Warden', 'A forest spirit of the Blackwood, older than the roads. Somebody bound it once. Now it guards the deep wood, and the trail of the lost heroes runs straight through it.'),
  // Tournaments (unlocked at each arena's history board)
  lore('harvest-melee', 'Tournaments', 'The Dunmere Harvest Melee', 'The first serious proving ground of western Valedorn. Local champions become folk heroes; famous entrants are expected to win.'),
  lore('thorn-cup', 'Tournaments', 'The Greenhollow Thorn Cup', 'A forest arena where movement, patience and terrain matter as much as raw force.'),
  lore('hammer-trials', 'Tournaments', 'The Ironford Hammer Trials', 'A hard, compact tournament known for champions who are difficult to finish.'),
  lore('cliff-duels', 'Tournaments', 'The Windmere Cliff Duels', 'Eight fighters, a ring on the cliffs and a wind that decides as many bouts as the blades. Halden Marsh has never lost here.'),
];

export const LORE_BY_ID = Object.fromEntries(LORE.map((entry) => [entry.id, entry]));

/** Arena history boards unlock their tournament's lore. */
export const TOURNAMENT_LORE = { 'dunmere-harvest-melee': 'harvest-melee', 'greenhollow-thorn-cup': 'thorn-cup', 'ironford-hammer-trials': 'hammer-trials', 'windmere-cliff-duels': 'cliff-duels' };

/** First visits unlock their place's lore. */
export const PLACE_LORE = { dunmere: 'dunmere', greenhollow: 'greenhollow', ironford: 'ironford', windmere: 'windmere', blackwood: 'blackwood' };
