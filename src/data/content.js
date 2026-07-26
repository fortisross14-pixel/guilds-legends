export const MONTHS = [
  'Deepwinter', 'Thawrise', 'Rainmoot', 'Greengale', 'Highsun', 'Brightwane',
  'Harvestcall', 'Amberfall', 'Mistmarch', 'Redleaf', 'Frostwane', 'Longnight',
];

export const TIERS = [
  { id: 'Local', fame: 40, contracts: 8, rank: 5, minYears: 0, color: '#8ca2b8', scope: 'Dunmere and its neighboring districts' },
  { id: 'Regional', fame: 180, contracts: 22, rank: 4, minYears: 1, color: '#7fbc9b', scope: 'The counties of western Valedorn' },
  { id: 'National', fame: 650, contracts: 55, rank: 3, minYears: 8, color: '#d2ad5d', scope: 'The Kingdom of Valedorn' },
  { id: 'Continental', fame: 1800, contracts: 110, rank: 2, minYears: 20, color: '#ca755d', scope: 'The Crownlands and neighboring realms' },
  { id: 'World', fame: 5000, contracts: 190, rank: 1, minYears: 40, color: '#9b78c8', scope: 'The known world and its hidden frontiers' },
  { id: 'Mythic Legacy', fame: 10000, contracts: 300, rank: 1, minYears: 75, color: '#e3c77e', scope: 'History itself' },
];

export const CLASSES = {
  Guardian: { glyph: '◆', primary: 'Might', secondary: 'Endurance', role: 'Vanguard', description: 'Protection, control and endurance.' },
  Duelist: { glyph: '✦', primary: 'Finesse', secondary: 'Presence', role: 'Striker', description: 'Single-target mastery and tournament brilliance.' },
  Ranger: { glyph: '➶', primary: 'Finesse', secondary: 'Mind', role: 'Scout', description: 'Tracking, range and wilderness survival.' },
  Rogue: { glyph: '◈', primary: 'Finesse', secondary: 'Mind', role: 'Specialist', description: 'Stealth, traps and infiltration.' },
  Cleric: { glyph: '✚', primary: 'Spirit', secondary: 'Presence', role: 'Support', description: 'Healing, wards and morale.' },
  Mage: { glyph: '✧', primary: 'Mind', secondary: 'Spirit', role: 'Specialist', description: 'Area magic, lore and supernatural utility.' },
  Berserker: { glyph: '▲', primary: 'Might', secondary: 'Spirit', role: 'Striker', description: 'Burst force, fear and monster killing.' },
  Bard: { glyph: '♫', primary: 'Presence', secondary: 'Mind', role: 'Captain', description: 'Fame, morale, negotiation and memory.' },
  Artificer: { glyph: '⚙', primary: 'Mind', secondary: 'Endurance', role: 'Specialist', description: 'Devices, sieges, repairs and artifacts.' },
  Beastmaster: { glyph: '♞', primary: 'Spirit', secondary: 'Finesse', role: 'Scout', description: 'Pets, pursuit, travel and terrain.' },
};

export const PARTY_ROLES = [
  { id: 'Captain', label: 'Captain', description: 'Makes key decisions and holds the party together.', key: 'Presence' },
  { id: 'Vanguard', label: 'Vanguard', description: 'Absorbs pressure and protects vulnerable allies.', key: 'Endurance' },
  { id: 'Striker', label: 'Striker', description: 'Finishes priority targets before they escape.', key: 'Might' },
  { id: 'Support', label: 'Support', description: 'Sustains the group through healing and supplies.', key: 'Spirit' },
  { id: 'Scout', label: 'Scout', description: 'Reveals hazards, routes and enemy composition.', key: 'Finesse' },
  { id: 'Specialist', label: 'Specialist', description: 'Solves mission-specific magical, technical or political problems.', key: 'Mind' },
];

export const REGIONS = [
  { id: 'Crownlands', icon: '♜', color: '#b7985b', identity: 'Feudal heartlands, knightly orders and old castles', emphasis: 'Tournaments, patronage and succession politics', unlock: 'Local' },
  { id: 'Verdant Marches', icon: '♣', color: '#4f8a68', identity: 'Deep forests and ruined elder roads', emphasis: 'Tracking, beasts, exploration and curses', unlock: 'Local' },
  { id: 'Ember Coast', icon: '≈', color: '#b55e50', identity: 'Merchant cities and pirate principalities', emphasis: 'Trade, naval contracts, smuggling and duels', unlock: 'Regional' },
  { id: 'Sun Kingdoms', icon: '☀', color: '#c79b4c', identity: 'Deserts, caravan empires and sacred cities', emphasis: 'Long expeditions, diplomacy and relic hunts', unlock: 'National' },
  { id: 'Storm Isles', icon: '⚡', color: '#557da8', identity: 'Independent islands and warrior clans', emphasis: 'Rival crews, sea routes and raid defense', unlock: 'National' },
  { id: 'Frost Frontier', icon: '❄', color: '#8ba9b8', identity: 'Sparse settlements beyond royal control', emphasis: 'Survival, giant hunts and colony defense', unlock: 'Continental' },
  { id: 'The Far Veil', icon: '◌', color: '#8d6ba6', identity: 'Mythic lands once treated as legend', emphasis: 'World-tier mysteries and final sagas', unlock: 'World' },
];

export const FACILITIES = [
  { id: 'training-yard', name: 'Training Yard', icon: '⚔', max: 4, baseCost: 420, effect: '+6% hero growth per level', description: 'Drills, sparring circles and veteran instruction.' },
  { id: 'infirmary', name: 'Infirmary', icon: '✚', max: 4, baseCost: 500, effect: '-10% recovery time and fatality risk per level', description: 'Clean beds, herb stores and trained healers.' },
  { id: 'archive', name: 'Hall of Records', icon: '▤', max: 4, baseCost: 360, effect: '+8% legacy and fame conversion per level', description: 'A living archive of deeds, titles and rivalries.' },
  { id: 'armory', name: 'Armory', icon: '♜', max: 4, baseCost: 600, effect: '+3 party power per level', description: 'Reliable equipment, maintained between expeditions.' },
  { id: 'scout-office', name: 'Scout Office', icon: '⌖', max: 4, baseCost: 480, effect: 'Better recruits and mission intelligence', description: 'Maps, informants and distant talent reports.' },
  { id: 'great-hall', name: 'Great Hall', icon: '♛', max: 4, baseCost: 750, effect: '+2 active hero capacity per level', description: 'The public heart of the institution.' },
  { id: 'workshop', name: 'Artificer Workshop', icon: '⚙', max: 4, baseCost: 680, effect: 'Improves artifact recovery and specialist missions', description: 'Tools, alchemy benches and controlled hazards.' },
  { id: 'academy', name: 'Guild Academy', icon: '✦', max: 4, baseCost: 950, effect: 'Generates high-potential youth each year', description: 'A long investment in the next generation.', unlock: 'Regional' },
];

export const APPOINTMENTS = [
  { id: 'Guild Captain', effect: 'Improves principal-party cohesion', tradeoff: 'Burnout and political pressure' },
  { id: 'Vice-Captain', effect: 'Reduces cohesion loss and succession risk', tradeoff: 'May develop ambition' },
  { id: 'Training Master', effect: 'Improves targeted growth and mentorship', tradeoff: 'Less mission availability' },
  { id: 'Questmaster', effect: 'Reveals better mission information', tradeoff: 'Administrative salary' },
  { id: 'Quartermaster', effect: 'Reduces travel and equipment costs', tradeoff: 'Favoritism events' },
  { id: 'Master Healer', effect: 'Improves recovery and survival', tradeoff: 'Requires Infirmary level 2' },
  { id: 'Spymaster', effect: 'Reveals rival plans and defectors', tradeoff: 'Scandal risk' },
  { id: 'Chronicler', effect: 'Preserves obscure deeds and legacy', tradeoff: 'May exaggerate controversies' },
];

export const MISSION_TEMPLATES = [
  {
    id: 'wolves-old-road', title: 'Wolves on the Old Road', family: 'Monster Hunt', tier: 'Local', region: 'Verdant Marches', risk: 1,
    duration: 1, difficulty: 49, reward: [180, 260], fame: [5, 9], roles: ['Scout', 'Vanguard'],
    brief: 'Carters refuse the north road after a pack began attacking in daylight. The tracks are too organized for ordinary wolves.',
    stakes: 'Reopen Dunmere’s main trade road before food prices rise.',
    choice: {
      prompt: 'Torren finds human bootprints among the tracks. The pack is being driven toward the road.',
      options: [
        { id: 'hunt', label: 'Follow the handlers', note: 'Harder, but may reveal the real threat.', power: -3, fame: 4, reward: 80, tag: 'truth' },
        { id: 'protect', label: 'Fortify the caravan route', note: 'Safer and protects civilians.', power: 4, fame: 1, reward: 0, tag: 'mercy' },
        { id: 'bait', label: 'Set a dangerous night ambush', note: 'High reward, greater injury risk.', power: 1, fame: 3, reward: 40, injury: 0.05, tag: 'bold' },
      ],
    },
  },
  {
    id: 'missing-apothecary', title: 'The Missing Apothecary', family: 'Investigation', tier: 'Local', region: 'Crownlands', risk: 1,
    duration: 1, difficulty: 46, reward: [150, 230], fame: [4, 8], roles: ['Specialist', 'Support'],
    brief: 'A healer vanished after purchasing grave-moss and silver thread. The temple wants discretion; the watch wants an arrest.',
    stakes: 'Find the apothecary before a spreading fever reaches the market quarter.',
    choice: {
      prompt: 'The apothecary is alive, but admits testing a forbidden treatment on plague victims.',
      options: [
        { id: 'temple', label: 'Turn them over to the temple', note: 'Political safety and a measured reward.', power: 3, fame: 1, relation: 'Temple' },
        { id: 'cure', label: 'Help complete the cure', note: 'Risk scandal for a larger public benefit.', power: -3, fame: 5, reward: 100, tag: 'mercy' },
        { id: 'watch', label: 'Let the town watch judge', note: 'Lawful, but the medicine may be lost.', power: 1, fame: 0, relation: 'Council' },
      ],
    },
  },
  {
    id: 'millers-daughter', title: 'The Miller’s Daughter', family: 'Rescue', tier: 'Local', region: 'Crownlands', risk: 1,
    duration: 1, difficulty: 43, reward: [120, 210], fame: [5, 10], roles: ['Scout', 'Captain'],
    brief: 'A child disappeared near the flooded mill. The search party found tiny footprints and a ribbon beneath the sluice gate.',
    stakes: 'A rescue where speed matters more than treasure.',
    choice: {
      prompt: 'The lower tunnel is collapsing. A second voice calls from deeper inside.',
      options: [
        { id: 'both', label: 'Attempt both rescues', note: 'The heroic route; significant danger.', power: -6, fame: 7, injury: 0.04, tag: 'heroic' },
        { id: 'child', label: 'Secure the child first', note: 'The safest promise you can keep.', power: 5, fame: 2, tag: 'mercy' },
        { id: 'split', label: 'Split the party', note: 'Requires reliable leadership.', power: 0, fame: 4, roleCheck: 'Captain' },
      ],
    },
  },
  {
    id: 'blackwood-lanterns', title: 'Lanterns in the Blackwood', family: 'Saga', tier: 'Local', region: 'Verdant Marches', risk: 3,
    duration: 2, difficulty: 62, reward: [420, 620], fame: [14, 24], roles: ['Scout', 'Support', 'Captain'], saga: 'The Blackwood Disappearances',
    brief: 'Blue lights have appeared where the old guild vanished. One lantern bears the founder’s broken crest.',
    stakes: 'The first true lead in Dunmere’s oldest wound.',
    choice: {
      prompt: 'A wounded veteran of the old guild begs the party to extinguish the lanterns and leave the forest sealed.',
      options: [
        { id: 'listen', label: 'Hear the veteran’s full warning', note: 'Learn more, but the quarry may escape.', power: 2, fame: 2, clue: 2 },
        { id: 'press', label: 'Press toward the ruined shrine', note: 'Confront the mystery now.', power: -5, fame: 8, reward: 100, clue: 1 },
        { id: 'withdraw', label: 'Mark the site and withdraw', note: 'Preserve the party for a later expedition.', power: 7, fame: -1, clue: 1 },
      ],
    },
  },
  {
    id: 'barons-tithe', title: 'The Baron’s Tithe', family: 'Political', tier: 'Local', region: 'Crownlands', risk: 2,
    duration: 1, difficulty: 55, reward: [260, 390], fame: [6, 12], roles: ['Captain', 'Specialist'],
    brief: 'The border baron claims bandits stole his tax convoy. Villagers insist the “bandits” were hungry tenant farmers.',
    stakes: 'Choose which version of justice the guild will enforce.',
    choice: {
      prompt: 'The stolen grain is feeding three villages after a failed harvest.',
      options: [
        { id: 'baron', label: 'Recover the full tithe', note: 'Gain noble favor and lose local trust.', power: 4, reward: 120, fame: -1, alignment: 'Baron' },
        { id: 'council', label: 'Broker a reduced payment', note: 'A difficult compromise.', power: -2, fame: 5, alignment: 'Council' },
        { id: 'independent', label: 'Refuse to enforce hunger', note: 'Lose pay, gain a reputation for independence.', power: 1, reward: -160, fame: 8, alignment: 'Independent' },
      ],
    },
  },
  {
    id: 'harvest-melee-prep', title: 'Road to the Harvest Melee', family: 'Tournament', tier: 'Local', region: 'Crownlands', risk: 1,
    duration: 1, difficulty: 54, reward: [180, 340], fame: [8, 16], roles: ['Striker', 'Captain'], tournament: true,
    brief: 'Dunmere’s annual melee is the fastest route to public recognition. Rival guilds have begun scouting Mara Veyne.',
    stakes: 'Place among the final four to complete a first-year objective.',
    choice: {
      prompt: 'A rival offers to arrange an easier quarterfinal draw in exchange for a future favor.',
      options: [
        { id: 'refuse', label: 'Refuse and fight openly', note: 'No advantage, but the crowd respects it.', power: 0, fame: 4, tag: 'honor' },
        { id: 'accept', label: 'Accept the arrangement', note: 'Better odds with a future obligation.', power: 7, fame: -2, obligation: 'Iron Hart favor' },
        { id: 'expose', label: 'Expose the offer publicly', note: 'Creates a permanent rivalry.', power: -2, fame: 7, rivalry: 'Iron Hart Company' },
      ],
    },
  },
  {
    id: 'ash-tower', title: 'The Ash Tower Bell', family: 'Dungeon', tier: 'Regional', region: 'Crownlands', risk: 3,
    duration: 2, difficulty: 70, reward: [620, 880], fame: [18, 30], roles: ['Vanguard', 'Specialist', 'Support'], artifact: 'Bell of Ash',
    brief: 'A ruined watchtower rings at midnight despite having no bell. Every ring erases one name from the parish rolls.',
    stakes: 'Break a curse before an entire village is forgotten.',
    choice: {
      prompt: 'The invisible bell can be silenced by destroying it—or claimed by someone willing to carry its curse.',
      options: [
        { id: 'destroy', label: 'Destroy the bell', note: 'Safest for the region; no artifact remains.', power: 4, fame: 5 },
        { id: 'claim', label: 'Claim the Bell of Ash', note: 'Gain a rare artifact and a persistent curse.', power: -5, fame: 8, artifact: 'Bell of Ash' },
        { id: 'study', label: 'Attempt a controlled binding', note: 'Requires exceptional specialist skill.', power: -2, fame: 6, roleCheck: 'Specialist', artifact: 'Bound Ash Chime' },
      ],
    },
  },
  {
    id: 'river-leviathan', title: 'The River Leviathan', family: 'Monster Hunt', tier: 'Regional', region: 'Verdant Marches', risk: 4,
    duration: 2, difficulty: 76, reward: [780, 1100], fame: [24, 38], roles: ['Scout', 'Vanguard', 'Striker'],
    brief: 'Something vast has dammed the River Serein with uprooted oaks. Two villages are already flooding.',
    stakes: 'A major rescue that can qualify the guild for National recognition.',
    choice: {
      prompt: 'The creature is nesting around a clutch of eggs. Killing it will free the river immediately.',
      options: [
        { id: 'slay', label: 'Slay the leviathan', note: 'Direct, dangerous and spectacular.', power: -2, fame: 10, reward: 180 },
        { id: 'divert', label: 'Divert the river around the nest', note: 'Hard technical solution with fewer casualties.', power: -4, fame: 12, roleCheck: 'Specialist' },
        { id: 'lure', label: 'Lure it into the deep marsh', note: 'Safer, but the threat may return years later.', power: 5, fame: 3, tag: 'unfinished' },
      ],
    },
  },
  {
    id: 'dukes-hostage', title: 'The Duke’s Hostage', family: 'Political', tier: 'Regional', region: 'Crownlands', risk: 3,
    duration: 2, difficulty: 72, reward: [700, 980], fame: [16, 30], roles: ['Captain', 'Scout', 'Specialist'], saga: 'War of Three Heirs',
    brief: 'One claimant to Valedorn’s western duchy has taken another’s son “for safekeeping.” Three patrons ask for three different outcomes.',
    stakes: 'The guild’s decision may decide a succession war.',
    choice: {
      prompt: 'The hostage refuses rescue and claims his father intends to use him as a symbol for war.',
      options: [
        { id: 'extract', label: 'Extract him anyway', note: 'Fulfill the contract and worsen the war.', power: -1, reward: 200, fame: 3 },
        { id: 'negotiate', label: 'Arrange a public truce', note: 'Very difficult, with major political upside.', power: -7, fame: 14, tag: 'political-feat' },
        { id: 'hide', label: 'Stage his death and hide him', note: 'A secret solution with long-term risk.', power: -3, fame: 2, clue: 2 },
      ],
    },
  },
  {
    id: 'pirate-ledger', title: 'The Red Ledger', family: 'Infiltration', tier: 'National', region: 'Ember Coast', risk: 3,
    duration: 2, difficulty: 78, reward: [950, 1350], fame: [22, 36], roles: ['Scout', 'Specialist', 'Captain'],
    brief: 'A merchant prince wants a ledger stolen from a pirate republic. Half the names inside belong to respectable nobles.',
    stakes: 'Acquire leverage that can reshape the coast’s politics.',
    choice: {
      prompt: 'The ledger proves your employer financed the same pirates he hired you to expose.',
      options: [
        { id: 'deliver', label: 'Deliver it as contracted', note: 'Excellent pay; dangerous complicity.', power: 4, reward: 350, fame: -2 },
        { id: 'publish', label: 'Publish every name', note: 'Chaos, fame and many new enemies.', power: -5, fame: 15, rivalry: 'Ember Syndicate' },
        { id: 'copy', label: 'Keep a hidden copy', note: 'Balanced leverage with scandal risk.', power: 0, fame: 5, clue: 2 },
      ],
    },
  },
  {
    id: 'giants-causeway', title: 'The Giant’s Causeway', family: 'Exploration', tier: 'Continental', region: 'Frost Frontier', risk: 5,
    duration: 3, difficulty: 86, reward: [1600, 2300], fame: [45, 70], roles: ['Scout', 'Support', 'Vanguard', 'Specialist'], artifact: 'Sky-Iron Compass',
    brief: 'A road of impossible stones appears only beneath the winter aurora. No expedition has returned from its far end.',
    stakes: 'Open a route into the unmapped north and claim a continental feat.',
    choice: {
      prompt: 'At the final arch, the party finds a wounded giant guarding a sky-iron compass.',
      options: [
        { id: 'aid', label: 'Aid the guardian', note: 'Lose time and supplies for a possible alliance.', power: -4, fame: 13, artifact: 'Sky-Iron Compass', tag: 'mercy' },
        { id: 'take', label: 'Take the compass by force', note: 'The quickest path to the artifact.', power: -7, fame: 10, reward: 300, artifact: 'Sky-Iron Compass' },
        { id: 'return', label: 'Map the route and return', note: 'Complete the exploration without provoking the giants.', power: 5, fame: 8, tag: 'exploration-feat' },
      ],
    },
  },
  {
    id: 'storm-wall', title: 'Beyond the Storm Wall', family: 'Legend Quest', tier: 'World', region: 'The Far Veil', risk: 5,
    duration: 4, difficulty: 94, reward: [2600, 4000], fame: [80, 130], roles: ['Captain', 'Scout', 'Support', 'Specialist', 'Vanguard'], saga: 'Voyage Beyond the Storm Wall', artifact: 'Crown of the Last Horizon',
    brief: 'The oldest maps end at a wall of permanent lightning. A dead captain’s journal claims there is a calm sea beyond it.',
    stakes: 'A world-defining saga and the road to Mythic Legacy.',
    choice: {
      prompt: 'The storm opens for one ship only. A rival guild’s vessel is sinking beside yours.',
      options: [
        { id: 'save', label: 'Turn back to save the rivals', note: 'Sacrifice the opening; inherit their unfinished dream.', power: 2, fame: 18, tag: 'inherited-will' },
        { id: 'race', label: 'Take the opening', note: 'Reach the unknown at the cost of your rivals.', power: -6, fame: 25, artifact: 'Crown of the Last Horizon' },
        { id: 'tow', label: 'Attempt to tow both ships through', note: 'Nearly impossible—and potentially legendary.', power: -12, fame: 45, injury: 0.08, artifact: 'Crown of the Last Horizon', tag: 'mythic-feat' },
      ],
    },
  },
  {
    id: 'fog-ferry', title: 'The Ferry Beneath the Fog', family: 'Investigation', tier: 'Local', region: 'Crownlands', risk: 2,
    duration: 1, difficulty: 54, reward: [220, 340], fame: [6, 11], roles: ['Scout', 'Specialist'],
    brief: 'The river ferry returns each dawn without its passengers. Wet footprints lead away from an empty deck.',
    stakes: 'Restore the safest crossing into Dunmere before merchants abandon the route.',
    choice: { prompt: 'The ferryman is smuggling refugees from a baronial purge, but something in the river has begun following the boat.', options: [
      { id: 'refugees', label: 'Protect the refugees and hunt the creature', note: 'A difficult promise with strong public meaning.', power: -4, fame: 6, tag: 'heroic-feat' },
      { id: 'baron', label: 'Report the ferryman to the baron', note: 'Political safety and immediate payment.', power: 4, fame: -1, reward: 100, obligation: 'Baronial favor' },
      { id: 'passage', label: 'Create a secret night passage', note: 'Requires stealth and permanently changes the route.', power: 0, fame: 3, roleCheck: 'Specialist' },
    ] },
  },
  {
    id: 'hollow-bell', title: 'The Chapel of the Hollow Bell', family: 'Dungeon', tier: 'Local', region: 'Verdant Marches', risk: 2,
    duration: 2, difficulty: 57, reward: [260, 390], fame: [7, 13], roles: ['Support', 'Vanguard'], artifact: 'The Hollow Bell Clapper',
    brief: 'A ruined roadside chapel rings at midnight although its bell was stolen generations ago.',
    stakes: 'End a curse that is drawing travelers from the road in their sleep.',
    choice: { prompt: 'The spirit offers to release the sleepers if one hero carries its bell-clapper back to Dunmere.', options: [
      { id: 'carry', label: 'Accept the burden', note: 'Safe now, but the artifact may create future trouble.', power: 3, fame: 3, artifact: 'The Hollow Bell Clapper' },
      { id: 'break', label: 'Break the haunting by force', note: 'A direct confrontation with the chapel dead.', power: -5, fame: 5, tag: 'bold' },
      { id: 'rite', label: 'Perform Aldren’s forbidden rite', note: 'Best with a capable Support hero.', power: 1, fame: 4, roleCheck: 'Support' },
    ] },
  },
  {
    id: 'salt-road', title: 'Ambush on the Salt Road', family: 'Escort', tier: 'Regional', region: 'Ember Coast', risk: 2,
    duration: 2, difficulty: 61, reward: [420, 620], fame: [10, 18], roles: ['Captain', 'Vanguard', 'Scout'],
    brief: 'Three guilds have failed to bring a salt caravan through the western gorge. The attackers know every formation.',
    stakes: 'Secure a trade route and learn which rival is selling caravan plans.',
    choice: { prompt: 'Pip recognizes the ambush signals as those used by the Velvet Knives.', options: [
      { id: 'expose', label: 'Expose the Velvet Knives publicly', note: 'Creates a lasting enemy and a famous scandal.', power: -2, fame: 8, rivalry: 'The Velvet Knives', tag: 'political-feat' },
      { id: 'deal', label: 'Buy safe passage', note: 'Protect the caravan but empower the criminal network.', power: 6, fame: -2, reward: -80 },
      { id: 'counter', label: 'Turn the ambush on its planners', note: 'High tactical upside and injury risk.', power: -3, fame: 5, injury: 0.03 },
    ] },
  },
  {
    id: 'mire-crown', title: 'The Mire King’s Crown', family: 'Monster Hunt', tier: 'Regional', region: 'Verdant Marches', risk: 3,
    duration: 2, difficulty: 67, reward: [560, 780], fame: [14, 23], roles: ['Scout', 'Support', 'Striker'], artifact: 'Crown of Woven Reeds',
    brief: 'A colossal antlered beast has united the marsh predators and driven three villages onto the old causeway.',
    stakes: 'Break the siege without poisoning the wetland that feeds half the county.',
    choice: { prompt: 'The beast guards a clutch of eggs beneath an ancient crown of woven reeds.', options: [
      { id: 'slay', label: 'Slay the Mire King', note: 'The clearest victory; the marsh may become unstable.', power: 2, fame: 5, artifact: 'Crown of Woven Reeds' },
      { id: 'move', label: 'Drive the brood deeper into the wild', note: 'Harder, merciful and better for the region.', power: -5, fame: 8, tag: 'heroic-feat' },
      { id: 'bind', label: 'Bind the beast to the guild', note: 'A Beastmaster or Specialist can create an unusual legacy.', power: -7, fame: 10, roleCheck: 'Specialist' },
    ] },
  },
  {
    id: 'seven-champions', title: 'The First of Seven Champions', family: 'Tournament', tier: 'Regional', region: 'Crownlands', risk: 2,
    duration: 1, difficulty: 69, reward: [500, 760], fame: [18, 28], roles: ['Striker', 'Captain'], saga: 'The Seven Arena Champions', tournament: true,
    brief: 'The undefeated Gate Champion accepts one challenger from a guild without a royal patron.',
    stakes: 'Begin a multi-year challenge against the seven most celebrated fighters of the age.',
    choice: { prompt: 'The champion offers Mara a private deal: lose with dignity now and receive a place in the national circuit.', options: [
      { id: 'refuse', label: 'Fight without compromise', note: 'Harder, honest and worthy of the saga.', power: -4, fame: 8, clue: 1, tag: 'competitive-feat' },
      { id: 'deal', label: 'Accept the arranged defeat', note: 'Gain access while damaging internal trust.', power: 7, fame: -4, obligation: 'Arena debt' },
      { id: 'expose', label: 'Expose the offer before the crowd', note: 'Turn the match into a political spectacle.', power: -1, fame: 10, rivalry: 'Iron Hart Company' },
    ] },
  },
  {
    id: 'red-ford', title: 'The Banner at Red Ford', family: 'War Operation', tier: 'Regional', region: 'Crownlands', risk: 3,
    duration: 2, difficulty: 70, reward: [620, 900], fame: [15, 26], roles: ['Captain', 'Vanguard', 'Support'], saga: 'War of Three Heirs',
    brief: 'Two heirs claim the same bridge while civilians are trapped between levies. Both sides demand the guild’s banner.',
    stakes: 'Decide whether the guild is a weapon, a shield or an independent power.',
    choice: { prompt: 'The northern heir orders the bridge burned with refugees still crossing.', options: [
      { id: 'defy', label: 'Defy both armies and hold the bridge', note: 'Difficult, independent and publicly heroic.', power: -7, fame: 11, clue: 2, alignment: 'Independent' },
      { id: 'north', label: 'Serve the northern heir', note: 'Secure patronage at a severe moral cost.', power: 5, fame: 1, obligation: 'Northern heir service' },
      { id: 'south', label: 'Smuggle the refugees south', note: 'A stealthier intervention with uncertain politics.', power: -1, fame: 6, roleCheck: 'Scout' },
    ] },
  },
  {
    id: 'three-heirs', title: 'The War of Three Heirs', family: 'Political Mission', tier: 'National', region: 'Crownlands', risk: 4,
    duration: 3, difficulty: 77, reward: [1100, 1700], fame: [28, 46], roles: ['Captain', 'Specialist', 'Support', 'Vanguard'], saga: 'War of Three Heirs',
    brief: 'Valedorn has three crowned claimants, two capitals and one exhausted army. Every guild is choosing a future.',
    stakes: 'End a succession war or become permanently tied to its victor.',
    choice: { prompt: 'Proof emerges that none of the three heirs is legitimate under the old succession compact.', options: [
      { id: 'truth', label: 'Publish the proof and force a council', note: 'The political route to a new settlement.', power: -8, fame: 16, clue: 3, tag: 'political-feat' },
      { id: 'choose', label: 'Crown the strongest claimant', note: 'A decisive ending with a powerful patron.', power: 2, fame: 8, obligation: 'Royal service' },
      { id: 'destroy', label: 'Destroy the proof', note: 'Stability now; a dangerous secret forever.', power: 6, fame: -3, reward: 300 },
    ] },
  },
  {
    id: 'library-chains', title: 'The Library of Chains', family: 'Dungeon', tier: 'National', region: 'Sun Kingdoms', risk: 3,
    duration: 3, difficulty: 75, reward: [980, 1450], fame: [22, 38], roles: ['Specialist', 'Support', 'Scout'], artifact: 'The Unburned Atlas',
    brief: 'A buried library seals each book to the memory of its last reader. Scholars who enter return without their names.',
    stakes: 'Recover a map to the Far Veil without sacrificing a hero’s identity.',
    choice: { prompt: 'The atlas will open only if someone surrenders the memory of their greatest victory.', options: [
      { id: 'memory', label: 'Pay the memory price', note: 'Gain the atlas but wound a hero’s personal history.', power: 3, fame: 2, artifact: 'The Unburned Atlas' },
      { id: 'solve', label: 'Break the chain-script', note: 'A demanding Specialist test with a clean outcome.', power: -6, fame: 10, roleCheck: 'Specialist', artifact: 'The Unburned Atlas' },
      { id: 'leave', label: 'Seal the library again', note: 'Protect the party and preserve the mystery.', power: 8, fame: -1 },
    ] },
  },
  {
    id: 'crownless-general', title: 'The Crownless General', family: 'War Operation', tier: 'National', region: 'Crownlands', risk: 4,
    duration: 3, difficulty: 80, reward: [1250, 1850], fame: [30, 48], roles: ['Captain', 'Vanguard', 'Striker', 'Support'],
    brief: 'A beloved general has refused the king’s order to abandon a frontier city. The crown calls it treason; the city calls it survival.',
    stakes: 'Rescue a city, enforce royal authority or create a rival center of power.',
    choice: { prompt: 'The general offers to join the guild if you help break the royal siege.', options: [
      { id: 'general', label: 'Break the siege and shelter the general', note: 'A major heroic feat and a royal enemy.', power: -9, fame: 18, tag: 'heroic-feat' },
      { id: 'crown', label: 'Negotiate the general’s surrender', note: 'A safer political success with lasting obligation.', power: 4, fame: 6, obligation: 'Royal enforcement' },
      { id: 'evacuate', label: 'Evacuate the city through old mines', note: 'Save lives while denying both factions victory.', power: -3, fame: 12, roleCheck: 'Scout' },
    ] },
  },
  {
    id: 'sea-knives', title: 'The Sea of Knives', family: 'Exploration', tier: 'National', region: 'Storm Isles', risk: 4,
    duration: 3, difficulty: 79, reward: [1150, 1750], fame: [27, 45], roles: ['Captain', 'Scout', 'Support', 'Specialist'], artifact: 'Compass of Nine Winds',
    brief: 'A maze of black reefs opens only during a three-day tide. Redwake Crew has challenged the guild to reach the inner island first.',
    stakes: 'Win a public race, discover a sea route and create a permanent maritime rival.',
    choice: { prompt: 'Redwake’s ship strikes a reef as the safe channel begins to close.', options: [
      { id: 'rescue', label: 'Rescue Redwake Crew', note: 'Lose the lead but gain a story the islands will remember.', power: 2, fame: 14, tag: 'heroic-feat' },
      { id: 'race', label: 'Take the channel', note: 'Win the race and claim the route.', power: -2, fame: 10, artifact: 'Compass of Nine Winds' },
      { id: 'split', label: 'Send a rescue boat and keep racing', note: 'A nearly impossible command decision.', power: -10, fame: 20, injury: 0.05, artifact: 'Compass of Nine Winds' },
    ] },
  },
  {
    id: 'glass-citadel', title: 'Siege of the Glass Citadel', family: 'War Operation', tier: 'Continental', region: 'Sun Kingdoms', risk: 4,
    duration: 4, difficulty: 85, reward: [1900, 2800], fame: [45, 72], roles: ['Captain', 'Vanguard', 'Specialist', 'Support', 'Striker'], artifact: 'Shard of the Noon Gate',
    brief: 'An invulnerable desert fortress reflects every siege engine and spell used against it.',
    stakes: 'End a continental war without reducing a sacred city to rubble.',
    choice: { prompt: 'The artificers discover the walls can be broken only by reflecting the citadel’s own sun-fire through the occupied city.', options: [
      { id: 'fire', label: 'Use the sun-fire', note: 'A decisive victory with devastating civilian risk.', power: 7, fame: -6, artifact: 'Shard of the Noon Gate' },
      { id: 'infiltrate', label: 'Open the Noon Gate from within', note: 'Extremely difficult and dependent on Specialists.', power: -9, fame: 18, roleCheck: 'Specialist', tag: 'continental-feat' },
      { id: 'truce', label: 'Force a truce through public challenge', note: 'Turn the siege into a champion’s duel.', power: -4, fame: 15, roleCheck: 'Striker' },
    ] },
  },
  {
    id: 'white-giant', title: 'The White Giant’s Wake', family: 'Monster Hunt', tier: 'Continental', region: 'Frost Frontier', risk: 5,
    duration: 4, difficulty: 88, reward: [2200, 3200], fame: [55, 85], roles: ['Vanguard', 'Scout', 'Support', 'Striker'], artifact: 'Heart-Ice Spear',
    brief: 'A giant believed dead for three centuries is walking south, followed by an avalanche that never settles.',
    stakes: 'Save the frontier colonies and decide whether the last giant should be killed or understood.',
    choice: { prompt: 'The giant carries a frozen human city on its back. Thousands may still be alive inside.', options: [
      { id: 'kill', label: 'Bring down the giant before the pass', note: 'The safest answer for the living settlements.', power: 3, fame: 12, artifact: 'Heart-Ice Spear' },
      { id: 'city', label: 'Climb onto the moving city', note: 'A legendary rescue with extreme exposure.', power: -12, fame: 28, injury: 0.08, tag: 'continental-feat' },
      { id: 'turn', label: 'Turn the giant toward the empty north', note: 'Requires insight, endurance and mercy.', power: -7, fame: 22, roleCheck: 'Support' },
    ] },
  },
  {
    id: 'sunken-embassy', title: 'The Sunken Embassy', family: 'Diplomatic Mission', tier: 'Continental', region: 'Ember Coast', risk: 4,
    duration: 4, difficulty: 84, reward: [1800, 2700], fame: [42, 68], roles: ['Captain', 'Specialist', 'Scout', 'Support'], artifact: 'Seal of the Drowned Prince',
    brief: 'An embassy sank intact beneath a magically still harbor. Its treaty could prevent three kingdoms from entering war.',
    stakes: 'Recover the treaty before rival divers replace it with a forgery.',
    choice: { prompt: 'The original treaty grants the drowned prince’s descendants a claim to the entire coast.', options: [
      { id: 'publish', label: 'Publish the true treaty', note: 'Prevent one war and begin a succession crisis.', power: -5, fame: 18, artifact: 'Seal of the Drowned Prince', tag: 'political-feat' },
      { id: 'rewrite', label: 'Negotiate a modern replacement', note: 'A difficult diplomatic compromise.', power: -2, fame: 14, roleCheck: 'Captain' },
      { id: 'bury', label: 'Leave the treaty beneath the harbor', note: 'Preserve the current peace through silence.', power: 7, fame: 2 },
    ] },
  },
  {
    id: 'moon-city', title: 'The City Behind the Moon', family: 'Legend Quest', tier: 'World', region: 'The Far Veil', risk: 5,
    duration: 5, difficulty: 95, reward: [3000, 4700], fame: [90, 145], roles: ['Captain', 'Scout', 'Support', 'Specialist', 'Vanguard'], artifact: 'Moonless Key',
    brief: 'At each new moon, towers appear on the horizon where no land exists. Every expedition returns one day older and ten years late.',
    stakes: 'Find a civilization outside ordinary time without losing an entire generation.',
    choice: { prompt: 'The city offers to preserve one hero forever as its ambassador while the rest return home.', options: [
      { id: 'ambassador', label: 'Let a hero remain', note: 'A sacrifice that creates an eternal institutional bond.', power: 4, fame: 25, artifact: 'Moonless Key', tag: 'mythic-feat' },
      { id: 'refuse', label: 'Refuse and steal the route home', note: 'A dangerous escape with no political protection.', power: -10, fame: 30, artifact: 'Moonless Key' },
      { id: 'change', label: 'Demand the city rejoin the world', note: 'Nearly impossible and world-defining.', power: -15, fame: 48, injury: 0.1, tag: 'mythic-feat' },
    ] },
  },
  {
    id: 'last-dragon', title: 'The Last Dragon’s Oath', family: 'Legend Quest', tier: 'World', region: 'Frost Frontier', risk: 5,
    duration: 5, difficulty: 96, reward: [3300, 5000], fame: [95, 155], roles: ['Captain', 'Vanguard', 'Striker', 'Support', 'Specialist'], artifact: 'Scale of the First Flame',
    brief: 'The last dragon wakes beneath the polar mountain and calls in an oath sworn by the first kings.',
    stakes: 'Decide whether the age of dragons ends in battle, alliance or succession.',
    choice: { prompt: 'The dragon demands one kingdom and one guild hero as guarantors of the ancient oath.', options: [
      { id: 'battle', label: 'Reject the oath and fight', note: 'The ultimate monster hunt.', power: -12, fame: 36, artifact: 'Scale of the First Flame', tag: 'mythic-feat' },
      { id: 'renew', label: 'Renew the oath under new terms', note: 'A world-scale diplomatic solution.', power: -7, fame: 32, roleCheck: 'Captain', tag: 'mythic-feat' },
      { id: 'heir', label: 'Find the dragon a mortal heir', note: 'A strange cultural ending that changes the next era.', power: -9, fame: 40, roleCheck: 'Specialist', tag: 'inherited-will' },
    ] },
  },
  {
    id: 'conclave-banners', title: 'The Conclave of Banners', family: 'Tournament', tier: 'World', region: 'Crownlands', risk: 4,
    duration: 3, difficulty: 93, reward: [2800, 4300], fame: [85, 135], roles: ['Captain', 'Vanguard', 'Striker', 'Support', 'Specialist'], tournament: true,
    brief: 'Once every four years, the world’s great guilds compete across duels, rescues, monster arenas and command trials.',
    stakes: 'Be recognized as the greatest living institution rather than merely the strongest party.',
    choice: { prompt: 'The final event is sabotaged, and winning now may kill the rival team trapped inside the arena.', options: [
      { id: 'rescue', label: 'Abandon the title and rescue the rivals', note: 'Lose the contest but possibly win history.', power: 5, fame: 30, tag: 'inherited-will' },
      { id: 'win', label: 'Complete the final event', note: 'Claim the world title under a shadow.', power: -3, fame: 28, reward: 700 },
      { id: 'both', label: 'Win while staging the rescue', note: 'A near-impossible defining feat.', power: -16, fame: 55, injury: 0.1, tag: 'mythic-feat' },
    ] },
  },
];

export const SAGA_DEFINITIONS = [
  { id: 'The Blackwood Disappearances', tier: 'Local', stages: 4, description: 'Discover what happened to Dunmere’s previous guild and why blue lanterns still burn beneath the trees.' },
  { id: 'War of Three Heirs', tier: 'Regional', stages: 5, description: 'Influence a succession struggle that can unite or divide western Valedorn.' },
  { id: 'The Seven Arena Champions', tier: 'National', stages: 5, description: 'Challenge a generation of undefeated champions across seven disciplines.' },
  { id: 'Voyage Beyond the Storm Wall', tier: 'World', stages: 4, description: 'Cross the edge of every accepted map and decide what history should remember.' },
];

export const RIVAL_ARCHETYPES = [
  { name: 'Iron Hart Company', archetype: 'Mercenary Company', motto: 'Victory has a price.', color: '#9e3e43', strategy: 'spend', risk: 0.64, specialty: 'Duelist' },
  { name: 'Order of the White Mantle', archetype: 'Noble Order', motto: 'Honor before applause.', color: '#c7c0a6', strategy: 'prestige', risk: 0.42, specialty: 'Guardian' },
  { name: 'Mosswood Fellowship', archetype: 'Frontier Brotherhood', motto: 'No road is truly lost.', color: '#4f7956', strategy: 'loyal', risk: 0.48, specialty: 'Ranger' },
  { name: 'The Gilded Quill', archetype: 'Scholastic Circle', motto: 'Knowledge wins the second battle.', color: '#6e5f91', strategy: 'research', risk: 0.35, specialty: 'Mage' },
  { name: 'Redwake Crew', archetype: 'Popular Crew', motto: 'Make the crowd remember.', color: '#b45d42', strategy: 'fame', risk: 0.76, specialty: 'Bard' },
  { name: 'Saint Orra’s Vigil', archetype: 'Religious Order', motto: 'Stand where darkness gathers.', color: '#56789b', strategy: 'discipline', risk: 0.39, specialty: 'Cleric' },
  { name: 'The Velvet Knives', archetype: 'Criminal Guild', motto: 'The unseen hand decides.', color: '#57435f', strategy: 'secrets', risk: 0.58, specialty: 'Rogue' },
  { name: 'Ashen Banner', archetype: 'Veteran Company', motto: 'We have survived worse.', color: '#6e6c67', strategy: 'veterans', risk: 0.46, specialty: 'Berserker' },
];

export const FIRST_NAMES = [
  'Aela', 'Aldric', 'Anwen', 'Bram', 'Cassia', 'Corin', 'Dara', 'Dorian', 'Elian', 'Elowen',
  'Fara', 'Garrick', 'Hale', 'Ilya', 'Isolde', 'Joren', 'Kael', 'Liora', 'Lucan', 'Maelis',
  'Nerys', 'Orin', 'Petra', 'Quill', 'Rhea', 'Rowan', 'Sable', 'Seren', 'Tamsin', 'Thane',
  'Ulric', 'Vara', 'Wren', 'Yara', 'Zephan',
];

export const LAST_NAMES = [
  'Ashfall', 'Blackmere', 'Briar', 'Crowe', 'Dawn', 'Ember', 'Farrow', 'Grey', 'Hollow', 'Ironwood',
  'Kestrel', 'Lark', 'Marrow', 'North', 'Oakheart', 'Pyre', 'Quickwater', 'Rook', 'Stone', 'Thorn',
  'Vale', 'Veyne', 'Winter', 'Wolfsbane', 'Wyrd',
];

export const ORIGINS = ['Farmer', 'Noble bastard', 'Temple orphan', 'Nomad', 'Ex-soldier', 'Street thief', 'Scholar', 'Refugee', 'Hunter', 'Artisan'];
export const PERSONALITIES = ['Brave', 'Vain', 'Patient', 'Jealous', 'Merciful', 'Obsessive', 'Cautious', 'Witty', 'Honorable', 'Restless'];
export const DREAMS = ['Become champion', 'Map the world', 'Avenge family', 'Found a school', 'Recover a lost artifact', 'Save a kingdom', 'Surpass a famous parent', 'Never lose a companion'];
export const FLAWS = ['Cowardice', 'Greed', 'Injury-prone', 'Arrogance', 'Addiction', 'Divided loyalty', 'Recklessness', 'Pride', 'Superstition', 'Melancholy'];
export const HIDDEN_TRAITS = ['Royal blood', 'Forbidden magic', 'Ancient curse', 'Legendary lineage', 'Prophetic dreams', 'Monster kinship', 'None', 'None', 'None'];

export const STARTING_HEROES = [
  { id: 'mara-veyne', name: 'Mara Veyne', classId: 'Duelist', age: 22, power: 58, potential: 88, personality: 'Ambitious', flaw: 'Arrogance', dream: 'Become champion', origin: 'Dispossessed minor nobility', loyalty: 64, hook: 'Exceptional ambition; resents cautious leadership.' },
  { id: 'brother-aldren', name: 'Brother Aldren', classId: 'Cleric', age: 34, power: 55, potential: 72, personality: 'Patient', flaw: 'Divided loyalty', dream: 'Save a kingdom', origin: 'Temple orphan', loyalty: 78, hook: 'Reliable and politically connected to Dunmere’s temple.' },
  { id: 'torren-ash', name: 'Torren Ash', classId: 'Ranger', age: 19, power: 51, potential: 84, personality: 'Restless', flaw: 'Recklessness', dream: 'Map the world', origin: 'Frontier orphan', loyalty: 59, hook: 'Rare tracking talent and almost no instinct for self-preservation.' },
  { id: 'ysra-stoneborn', name: 'Ysra Stoneborn', classId: 'Guardian', age: 29, power: 57, potential: 69, personality: 'Honorable', flaw: 'Pride', dream: 'Never lose a companion', origin: 'Veteran laborer', loyalty: 91, hook: 'Low fame potential, exceptional loyalty and physical courage.' },
  { id: 'pip-quickstep', name: 'Pip Quickstep', classId: 'Rogue', age: 17, power: 43, potential: 78, personality: 'Witty', flaw: 'Greed', dream: 'Recover a lost artifact', origin: 'Street thief', loyalty: 48, hook: 'May relapse into crime—or become Dunmere’s favorite folk hero.' },
];

export const ONBOARDING_STEPS = [
  { id: 'welcome', title: 'Read the council order', body: 'Your guild is only a banner, a rented room and you. Dunmere needs proof that the Broken Lantern can stand again.', screen: 'hall', target: 'acknowledgeWelcome', reward: 30 },
  { id: 'first-companion', title: 'Hire your first companion', body: 'Open Recruitment and choose the person who will stand beside you. Their class will shape which missions feel possible first.', screen: 'heroes', target: 'recruitCompanion', reward: 60 },
  { id: 'inspect-mission', title: 'Inspect “Wolves on the Old Road”', body: 'Open the Contract Board and read why this is a Combat mission, what the slots require and what failure could cost.', screen: 'missions', target: 'inspectMission', reward: 35 },
  { id: 'select-party', title: 'Build your first Combat Company', body: 'Assign a Commander and at least one Fighter. Place heroes where their class and attributes actually fit.', screen: 'missions', target: 'selectParty', reward: 50 },
  { id: 'launch', title: 'Commit the company', body: 'Launch the mission. The formation is saved with the expedition so its result can be examined later.', screen: 'missions', target: 'launchMission', reward: 60 },
  { id: 'advance', title: 'Advance one month', body: 'Time moves wages, recovery, rival guilds, tournament calendars and expeditions together.', screen: 'hall', target: 'advanceMonth', reward: 45 },
  { id: 'choice', title: 'Resolve the key moment', body: 'Important missions pause for a decision. Choose what your guild values, not only the option with the best percentage.', screen: 'hall', target: 'resolveChoice', reward: 70 },
  { id: 'report', title: 'Read the expedition report', body: 'Study who did what, the final odds, rewards, wounds and consequences. Every completed mission remains available in the Chronicle.', screen: 'chronicle', target: 'viewMissionReport', reward: 45 },
  { id: 'goals', title: 'Choose your first-year path', body: 'The opening orders are over. Your goals now become broader: combat wins, fame, the local circuit and a Regional charter.', screen: 'goals', target: 'inspectGoals', reward: 80 },
];

export const CHAPTER_GOALS = [
  { id: 'contracts-3', title: 'A Reliable Banner', description: 'Complete 3 contracts without a hero death.', metric: 'missionsWon', target: 3, reward: { crowns: 250, fame: 8 }, tier: 'Local' },
  { id: 'melee-top4', title: 'Dunmere Harvest Melee', description: 'Reach the final four in the Harvest Melee.', metric: 'tournamentBest', target: 4, comparator: 'lte', reward: { crowns: 180, fame: 12 }, tier: 'Local' },
  { id: 'fame-40', title: 'Known Beyond the Gate', description: 'Reach 40 fame.', metric: 'fame', target: 40, reward: { crowns: 300, fame: 0 }, tier: 'Local' },
  { id: 'alignment', title: 'Choose Who You Serve', description: 'Align with the council, the border baron or remain independent.', metric: 'alignmentChosen', target: 1, reward: { crowns: 120, fame: 6 }, tier: 'Local' },
  { id: 'regional', title: 'A Regional Charter', description: 'Earn promotion from Local to Regional status.', metric: 'tierIndex', target: 1, reward: { crowns: 900, fame: 20 }, tier: 'Local' },
  { id: 'hall-level2', title: 'A Hall Worth Remembering', description: 'Upgrade the Great Hall to level 2.', metric: 'greatHallLevel', target: 2, reward: { crowns: 350, fame: 8 }, tier: 'Regional' },
  { id: 'legend-hero', title: 'The First Legend', description: 'Develop a hero to 80 power or 150 legacy.', metric: 'legendHero', target: 1, reward: { crowns: 650, fame: 20 }, tier: 'Regional' },
  { id: 'national', title: 'The Royal License', description: 'Reach National tier.', metric: 'tierIndex', target: 2, reward: { crowns: 1600, fame: 40 }, tier: 'Regional' },
  { id: 'artifact-3', title: 'Relics of an Age', description: 'Preserve 3 named artifacts.', metric: 'artifacts', target: 3, reward: { crowns: 800, fame: 25 }, tier: 'National' },
  { id: 'century', title: 'A Century Under One Banner', description: 'Survive for 100 in-game years.', metric: 'years', target: 100, reward: { crowns: 3000, fame: 100 }, tier: 'World' },
];

export const ACHIEVEMENTS = [
  { id: 'first-blood', name: 'The Banner Rises', description: 'Complete the guild’s first mission.', icon: '⚔', metric: 'missionsCompleted', target: 1 },
  { id: 'perfect-contract', name: 'No One Left Behind', description: 'Complete a risk 3+ mission with no injury.', icon: '✚', metric: 'perfectHardMission', target: 1 },
  { id: 'upset', name: 'Against the Odds', description: 'Win a mission with an estimated chance below 40%.', icon: '✦', metric: 'upsets', target: 1 },
  { id: 'champion', name: 'The Crowd Knows the Name', description: 'Win any tournament.', icon: '♛', metric: 'tournamentsWon', target: 1 },
  { id: 'veteran', name: 'Twenty Years of Service', description: 'Have a hero serve the guild for 20 years.', icon: '◆', metric: 'longService', target: 20 },
  { id: 'dynasty', name: 'Inherited Will', description: 'Complete a deceased or retired hero’s unfinished dream.', icon: '∞', metric: 'inheritedWill', target: 1 },
  { id: 'rivalry', name: 'A Name Worth Hating', description: 'Create a permanent rivalry with another guild.', icon: '⚑', metric: 'rivalries', target: 1 },
  { id: 'mythic', name: 'History Bends', description: 'Complete a mythic feat.', icon: '☼', metric: 'mythicFeats', target: 1 },
];
