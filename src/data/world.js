export const PRIMALS = {
  Fire: { id: 'Fire', icon: '🔥', color: '#ef8354', beats: 'Plant', weakTo: 'Water', temperament: 'bold, proud and direct' },
  Air: { id: 'Air', icon: '🜁', color: '#8dc7d9', beats: 'Psychic', weakTo: 'Iron', temperament: 'restless, inventive and free' },
  Water: { id: 'Water', icon: '💧', color: '#5aa9e6', beats: 'Fire', weakTo: 'Plant', temperament: 'adaptive, patient and communal' },
  Plant: { id: 'Plant', icon: '🌿', color: '#70b77e', beats: 'Water', weakTo: 'Fire', temperament: 'rooted, restorative and territorial' },
  Animal: { id: 'Animal', icon: '🐾', color: '#c79a66', beats: 'Iron', weakTo: 'Psychic', temperament: 'instinctive, loyal and physical' },
  Psychic: { id: 'Psychic', icon: '✦', color: '#b185db', beats: 'Animal', weakTo: 'Air', temperament: 'subtle, symbolic and cerebral' },
  Iron: { id: 'Iron', icon: '⚙', color: '#9ba7b4', beats: 'Air', weakTo: 'Animal', temperament: 'disciplined, durable and exact' },
};

export const PRIMAL_IDS = Object.keys(PRIMALS);

export const RARITIES = {
  Common: { id: 'Common', color: '#a8b0b8', maxPotential: 72, salary: 0.85, signing: 0.75, weight: 50 },
  Uncommon: { id: 'Uncommon', color: '#68b984', maxPotential: 80, salary: 1, signing: 1, weight: 28 },
  Rare: { id: 'Rare', color: '#5aa9e6', maxPotential: 88, salary: 1.2, signing: 1.35, weight: 14 },
  Epic: { id: 'Epic', color: '#a879d8', maxPotential: 94, salary: 1.55, signing: 1.9, weight: 6 },
  Legend: { id: 'Legend', color: '#e0b55b', maxPotential: 99, salary: 2.1, signing: 2.9, weight: 2 },
};

export const RARITY_IDS = Object.keys(RARITIES);

export const LOCATIONS = [
  { id: 'dunmere', name: 'Dunmere', region: 'Crownlands', tier: 'Regional', primal: 'Fire', icon: '♜', x: 18, y: 48, travel: 1, description: 'A market town rebuilt around kilns, old banners and stubborn civic pride.', specialties: ['Guardian', 'Duelist', 'Cleric'], tournamentDivision: 'Local' },
  { id: 'greenhollow', name: 'Greenhollow', region: 'Verdant Marches', tier: 'Regional', primal: 'Plant', icon: '♣', x: 31, y: 28, travel: 1, description: 'Forest wards, herbal schools and villages grown around elder roads.', specialties: ['Ranger', 'Cleric', 'Beastmaster'], tournamentDivision: 'Local' },
  { id: 'ironford', name: 'Ironford', region: 'Crownlands', tier: 'Regional', primal: 'Iron', icon: '⚙', x: 40, y: 56, travel: 1, description: 'A bridge city of foundries, caravan guards and severe craft guilds.', specialties: ['Guardian', 'Artificer', 'Berserker'], tournamentDivision: 'Local' },
  { id: 'windmere', name: 'Windmere', region: 'Crownlands', tier: 'Regional', primal: 'Air', icon: '🜁', x: 27, y: 70, travel: 1, description: 'Hill monasteries, couriers and cliffside dueling schools.', specialties: ['Ranger', 'Duelist', 'Bard'], tournamentDivision: 'Local' },

  { id: 'tidecross', name: 'Tidecross', region: 'Ember Coast', tier: 'National', primal: 'Water', icon: '≈', x: 53, y: 72, travel: 2, description: 'A crowded port where pilots, smugglers and water-priests compete for contracts.', specialties: ['Rogue', 'Cleric', 'Ranger'], tournamentDivision: 'Professional' },
  { id: 'sunspire', name: 'Sunspire', region: 'Sun Kingdoms', tier: 'National', primal: 'Fire', icon: '☀', x: 66, y: 62, travel: 2, description: 'A ceremonial capital of fire courts, arena houses and royal embassies.', specialties: ['Duelist', 'Bard', 'Mage'], tournamentDivision: 'Professional' },
  { id: 'thornwatch', name: 'Thornwatch', region: 'Verdant Marches', tier: 'National', primal: 'Animal', icon: '🐾', x: 44, y: 24, travel: 2, description: 'Frontier lodges built around beast trails and old hunting compacts.', specialties: ['Beastmaster', 'Ranger', 'Berserker'], tournamentDivision: 'Professional' },
  { id: 'skyreach', name: 'Skyreach', region: 'Storm Isles', tier: 'National', primal: 'Air', icon: '⚡', x: 72, y: 36, travel: 2, description: 'A chain of high islands joined by rope bridges and storm-sail routes.', specialties: ['Ranger', 'Mage', 'Bard'], tournamentDivision: 'Professional' },
  { id: 'mooncourt', name: 'Mooncourt', region: 'Crownlands', tier: 'National', primal: 'Psychic', icon: '☾', x: 55, y: 42, travel: 2, description: 'A court city of seers, advocates and dangerous schools of memory.', specialties: ['Mage', 'Bard', 'Rogue'], tournamentDivision: 'Professional' },
  { id: 'brasshaven', name: 'Brasshaven', region: 'Ember Coast', tier: 'National', primal: 'Iron', icon: '◆', x: 62, y: 82, travel: 2, description: 'Shipyards and artificer colleges where contracts are written in brass.', specialties: ['Artificer', 'Guardian', 'Rogue'], tournamentDivision: 'Professional' },

  { id: 'coral-crown', name: 'Coral Crown', region: 'Storm Isles', tier: 'Global', primal: 'Water', icon: '◉', x: 83, y: 72, travel: 3, description: 'A reef metropolis whose guilds travel farther than most kingdoms.', specialties: ['Cleric', 'Rogue', 'Beastmaster'], tournamentDivision: 'Elite' },
  { id: 'beaststeppe', name: 'Beaststeppe', region: 'Frost Frontier', tier: 'Global', primal: 'Animal', icon: '♞', x: 70, y: 16, travel: 3, description: 'Nomad leagues and colossal migrations beyond reliable roads.', specialties: ['Beastmaster', 'Berserker', 'Ranger'], tournamentDivision: 'Elite' },
  { id: 'ashen-caldera', name: 'Ashen Caldera', region: 'Sun Kingdoms', tier: 'Global', primal: 'Fire', icon: '▲', x: 80, y: 48, travel: 3, description: 'A volcanic arena-city where victory is treated as divine proof.', specialties: ['Berserker', 'Duelist', 'Mage'], tournamentDivision: 'Elite' },
  { id: 'verdant-citadel', name: 'Verdant Citadel', region: 'Verdant Marches', tier: 'Global', primal: 'Plant', icon: '✤', x: 51, y: 10, travel: 3, description: 'An immense living fortress where healers and wardens rule by consensus.', specialties: ['Cleric', 'Ranger', 'Beastmaster'], tournamentDivision: 'Elite' },
  { id: 'starfall-archive', name: 'Starfall Archive', region: 'The Far Veil', tier: 'Global', primal: 'Psychic', icon: '✧', x: 91, y: 28, travel: 4, description: 'A half-mythic city whose libraries record futures that may never happen.', specialties: ['Mage', 'Bard', 'Artificer'], tournamentDivision: 'Elite' },
  { id: 'irondeep', name: 'Irondeep', region: 'Frost Frontier', tier: 'Global', primal: 'Iron', icon: '⬢', x: 58, y: 4, travel: 3, description: 'A subterranean nation of engines, oath-halls and siege masters.', specialties: ['Artificer', 'Guardian', 'Berserker'], tournamentDivision: 'Elite' },
  { id: 'cloud-monastery', name: 'Cloud Monastery', region: 'Storm Isles', tier: 'Global', primal: 'Air', icon: '☁', x: 88, y: 52, travel: 4, description: 'A moving sanctuary of gliders, diplomats and impossible dueling terraces.', specialties: ['Duelist', 'Bard', 'Mage'], tournamentDivision: 'Elite' },
  { id: 'far-veil', name: 'The Far Veil', region: 'The Far Veil', tier: 'Global', primal: 'Psychic', icon: '◌', x: 96, y: 12, travel: 4, description: 'A frontier that appears differently to every expedition that survives it.', specialties: ['Mage', 'Rogue', 'Cleric'], tournamentDivision: 'Elite' },
];

export const LOCATION_BY_ID = Object.fromEntries(LOCATIONS.map((location) => [location.id, location]));

export function primalCombatModifier(attacker, defender) {
  if (!attacker || !defender) return 0;
  if (PRIMALS[attacker]?.beats === defender) return 1;
  if (PRIMALS[attacker]?.weakTo === defender) return -1;
  return 0;
}

export function primalDiplomacyModifier(heroPrimal, patronPrimal) {
  if (!heroPrimal || !patronPrimal) return 0;
  if (heroPrimal === patronPrimal) return 1;
  if (PRIMALS[heroPrimal]?.beats === patronPrimal) return -0.25;
  if (PRIMALS[heroPrimal]?.weakTo === patronPrimal) return 0.25;
  return 0;
}

export function unlockedLocations(tierIndex) {
  const allowed = tierIndex <= 0 ? ['Regional'] : tierIndex === 1 ? ['Regional', 'National'] : ['Regional', 'National', 'Global'];
  return LOCATIONS.filter((location) => allowed.includes(location.tier));
}

export function travelDuration(fromId, toId) {
  const from = LOCATION_BY_ID[fromId];
  const to = LOCATION_BY_ID[toId];
  if (!from || !to || fromId === toId) return 0;
  const dx = Math.abs(from.x - to.x);
  const dy = Math.abs(from.y - to.y);
  const distanceBand = Math.ceil((dx + dy) / 34);
  return Math.max(1, Math.min(5, Math.max(from.travel, to.travel, distanceBand)));
}
