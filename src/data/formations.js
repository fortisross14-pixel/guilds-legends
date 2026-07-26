export const FORMATION_TYPES = {
  Combat: {
    id: 'Combat',
    label: 'Combat Company',
    icon: '⚔',
    description: 'For hunts, rescues, chases, dungeons and team tournaments. A commander coordinates up to three fighters while support keeps the company alive.',
    color: 'red',
    slots: [
      { id: 'combat-command', role: 'Commander', label: 'Commander', required: true, description: 'Controls the field and makes the decisive call.' },
      { id: 'combat-fighter-1', role: 'Fighter', label: 'Fighter I', required: true, description: 'The first reliable source of force.' },
      { id: 'combat-fighter-2', role: 'Fighter', label: 'Fighter II', required: false, description: 'Adds pressure, protection or ranged damage.' },
      { id: 'combat-fighter-3', role: 'Fighter', label: 'Fighter III', required: false, description: 'Creates depth for difficult or prolonged fights.' },
      { id: 'combat-support', role: 'Combat Support', label: 'Support', required: false, description: 'Healing, wards, supplies or tactical devices.' },
    ],
  },
  Diplomacy: {
    id: 'Diplomacy',
    label: 'Diplomatic Delegation',
    icon: '♛',
    description: 'For negotiations, political crises and public disputes. Presence opens the room; preparation determines what can be promised safely.',
    color: 'gold',
    slots: [
      { id: 'diplomacy-lead', role: 'Negotiation Lead', label: 'Negotiation Lead', required: true, description: 'Owns the room and makes the final offer.' },
      { id: 'diplomacy-strategist-1', role: 'Strategist', label: 'Strategist I', required: true, description: 'Reads incentives, precedent and hidden costs.' },
      { id: 'diplomacy-strategist-2', role: 'Strategist', label: 'Strategist II', required: false, description: 'Adds legal, military or economic depth.' },
      { id: 'diplomacy-advocate', role: 'Advocate', label: 'Advocate', required: false, description: 'Builds trust and frames the guild’s moral position.' },
      { id: 'diplomacy-escort', role: 'Delegation Guard', label: 'Escort', required: false, description: 'Protects the delegation and signals resolve.' },
    ],
  },
  Expedition: {
    id: 'Expedition',
    label: 'Expedition Team',
    icon: '⌖',
    description: 'For investigations, searches, ruins and artifacts. Searchers uncover evidence while a curator decides what the discovery actually means.',
    color: 'blue',
    slots: [
      { id: 'expedition-lead', role: 'Expedition Lead', label: 'Expedition Lead', required: true, description: 'Chooses the route, pace and priorities.' },
      { id: 'expedition-searcher-1', role: 'Searcher', label: 'Searcher I', required: true, description: 'Finds tracks, clues, passages and hidden objects.' },
      { id: 'expedition-searcher-2', role: 'Searcher', label: 'Searcher II', required: false, description: 'Covers more ground or checks a second theory.' },
      { id: 'expedition-curator', role: 'Curator', label: 'Curator', required: false, description: 'Authenticates relics, interprets lore and avoids false prizes.' },
      { id: 'expedition-support', role: 'Field Support', label: 'Field Support', required: false, description: 'Keeps the party supplied, healthy and moving.' },
    ],
  },
  Intrigue: {
    id: 'Intrigue',
    label: 'Intrigue Cell',
    icon: '◈',
    description: 'For theft, infiltration, surveillance and covert extraction. A mastermind controls the risk while specialists enter, observe and escape.',
    color: 'purple',
    slots: [
      { id: 'intrigue-lead', role: 'Mastermind', label: 'Mastermind', required: true, description: 'Builds the plan and decides when to abort.' },
      { id: 'intrigue-infiltrator-1', role: 'Infiltrator', label: 'Infiltrator I', required: true, description: 'Crosses the protected boundary.' },
      { id: 'intrigue-infiltrator-2', role: 'Infiltrator', label: 'Infiltrator II', required: false, description: 'Creates redundancy or handles a second objective.' },
      { id: 'intrigue-lookout', role: 'Lookout', label: 'Lookout', required: false, description: 'Tracks patrols, witnesses and escape routes.' },
      { id: 'intrigue-extraction', role: 'Extraction', label: 'Extraction', required: false, description: 'Gets people and evidence out when the plan breaks.' },
    ],
  },
};

export const PARTY_ROLES = [
  { id: 'Commander', label: 'Commander', formation: 'Combat', key: 'Presence', secondaryKey: 'Mind', affinities: ['Bard', 'Guardian', 'Duelist'], description: 'Coordinates a violent encounter and prevents panic.' },
  { id: 'Fighter', label: 'Fighter', formation: 'Combat', key: 'Might', secondaryKey: 'Finesse', affinities: ['Guardian', 'Duelist', 'Berserker', 'Ranger', 'Beastmaster'], description: 'Deals or absorbs direct pressure.' },
  { id: 'Combat Support', label: 'Combat Support', formation: 'Combat', key: 'Spirit', secondaryKey: 'Mind', affinities: ['Cleric', 'Bard', 'Artificer', 'Mage'], description: 'Healing, wards, morale and prepared tools.' },

  { id: 'Negotiation Lead', label: 'Negotiation Lead', formation: 'Diplomacy', key: 'Presence', secondaryKey: 'Spirit', affinities: ['Bard', 'Cleric', 'Duelist'], description: 'Sets the terms and carries public authority.' },
  { id: 'Strategist', label: 'Strategist', formation: 'Diplomacy', key: 'Mind', secondaryKey: 'Presence', affinities: ['Mage', 'Artificer', 'Bard', 'Rogue'], description: 'Anticipates incentives, traps and second-order effects.' },
  { id: 'Advocate', label: 'Advocate', formation: 'Diplomacy', key: 'Spirit', secondaryKey: 'Presence', affinities: ['Cleric', 'Bard', 'Guardian'], description: 'Builds trust and moral legitimacy.' },
  { id: 'Delegation Guard', label: 'Delegation Guard', formation: 'Diplomacy', key: 'Endurance', secondaryKey: 'Presence', affinities: ['Guardian', 'Duelist', 'Berserker'], description: 'Protects the delegation and gives threats weight.' },

  { id: 'Expedition Lead', label: 'Expedition Lead', formation: 'Expedition', key: 'Mind', secondaryKey: 'Presence', affinities: ['Ranger', 'Artificer', 'Mage', 'Beastmaster'], description: 'Chooses route, method and acceptable risk.' },
  { id: 'Searcher', label: 'Searcher', formation: 'Expedition', key: 'Finesse', secondaryKey: 'Mind', affinities: ['Ranger', 'Rogue', 'Beastmaster'], description: 'Finds evidence, tracks, objects and hidden passages.' },
  { id: 'Curator', label: 'Curator', formation: 'Expedition', key: 'Mind', secondaryKey: 'Spirit', affinities: ['Artificer', 'Mage', 'Cleric', 'Bard'], description: 'Authenticates discoveries and interprets their significance.' },
  { id: 'Field Support', label: 'Field Support', formation: 'Expedition', key: 'Endurance', secondaryKey: 'Spirit', affinities: ['Cleric', 'Guardian', 'Beastmaster', 'Artificer'], description: 'Manages supplies, recovery and difficult terrain.' },

  { id: 'Mastermind', label: 'Mastermind', formation: 'Intrigue', key: 'Mind', secondaryKey: 'Presence', affinities: ['Rogue', 'Bard', 'Mage', 'Artificer'], description: 'Builds the covert plan and controls exposure.' },
  { id: 'Infiltrator', label: 'Infiltrator', formation: 'Intrigue', key: 'Finesse', secondaryKey: 'Mind', affinities: ['Rogue', 'Ranger', 'Duelist'], description: 'Enters protected places without permission.' },
  { id: 'Lookout', label: 'Lookout', formation: 'Intrigue', key: 'Finesse', secondaryKey: 'Presence', affinities: ['Ranger', 'Rogue', 'Beastmaster'], description: 'Tracks patrols, witnesses and escape windows.' },
  { id: 'Extraction', label: 'Extraction', formation: 'Intrigue', key: 'Endurance', secondaryKey: 'Finesse', affinities: ['Guardian', 'Ranger', 'Rogue', 'Beastmaster'], description: 'Gets the cell out after success or discovery.' },

  // Legacy role ids remain readable in migrated saves and historical records.
  { id: 'Captain', label: 'Captain', formation: 'Legacy', key: 'Presence', secondaryKey: 'Mind', affinities: ['Bard', 'Guardian', 'Duelist'], description: 'Legacy captain role.' },
  { id: 'Vanguard', label: 'Vanguard', formation: 'Legacy', key: 'Endurance', secondaryKey: 'Might', affinities: ['Guardian', 'Berserker'], description: 'Legacy vanguard role.' },
  { id: 'Striker', label: 'Striker', formation: 'Legacy', key: 'Might', secondaryKey: 'Finesse', affinities: ['Duelist', 'Berserker', 'Ranger'], description: 'Legacy striker role.' },
  { id: 'Support', label: 'Support', formation: 'Legacy', key: 'Spirit', secondaryKey: 'Mind', affinities: ['Cleric', 'Bard', 'Artificer'], description: 'Legacy support role.' },
  { id: 'Scout', label: 'Scout', formation: 'Legacy', key: 'Finesse', secondaryKey: 'Mind', affinities: ['Ranger', 'Rogue', 'Beastmaster'], description: 'Legacy scout role.' },
  { id: 'Specialist', label: 'Specialist', formation: 'Legacy', key: 'Mind', secondaryKey: 'Spirit', affinities: ['Mage', 'Artificer', 'Rogue'], description: 'Legacy specialist role.' },
];

export const MISSION_APPROACH_BY_FAMILY = {
  'Monster Hunt': 'Combat',
  Rescue: 'Combat',
  Dungeon: 'Combat',
  Escort: 'Combat',
  'War Operation': 'Combat',
  Tournament: 'Combat',
  Political: 'Diplomacy',
  Diplomacy: 'Diplomacy',
  Negotiation: 'Diplomacy',
  Investigation: 'Expedition',
  Exploration: 'Expedition',
  'Legend Quest': 'Expedition',
  'Artifact Hunt': 'Expedition',
  Infiltration: 'Intrigue',
  Espionage: 'Intrigue',
  Theft: 'Intrigue',
};

export function formationForMission(mission) {
  return mission?.approach || MISSION_APPROACH_BY_FAMILY[mission?.family] || 'Combat';
}

export function emptyFormations() {
  return Object.fromEntries(Object.keys(FORMATION_TYPES).map((type) => [type, []]));
}

export const TOURNAMENT_DIVISIONS = [
  {
    id: 'Local', label: 'Local Circuit', icon: '◆',
    description: 'Town melees and county exhibitions. Open to any chartered guild.',
    requirements: { fame: 0, combatWins: 0, localTitles: 0, professionalTitles: 0, tierIndex: 0 },
  },
  {
    id: 'Professional', label: 'Professional Circuit', icon: '♛',
    description: 'Recognized companies fight for purses, sponsors and permanent seeding.',
    requirements: { fame: 60, combatWins: 5, localTitles: 1, professionalTitles: 0, tierIndex: 0 },
  },
  {
    id: 'Elite', label: 'Elite Circuit', icon: '✦',
    description: 'Royal and international events for proven combat institutions.',
    requirements: { fame: 220, combatWins: 15, localTitles: 1, professionalTitles: 2, tierIndex: 1 },
  },
];
