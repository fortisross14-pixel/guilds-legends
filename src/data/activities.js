export const MONTHLY_ACTIVITIES = [
  {
    id: 'Training',
    label: 'Train',
    icon: '⚔',
    description: 'Build experience and long-term ability. Training focus determines the emphasis.',
  },
  {
    id: 'Rest',
    label: 'Rest',
    icon: '☾',
    description: 'Recover fatigue and health with almost no development.',
  },
  {
    id: 'Infirmary',
    label: 'Infirmary',
    icon: '✚',
    description: 'Prioritize recovery. Injured heroes heal fastest and healthy heroes can rehabilitate.',
  },
  {
    id: 'Scouting',
    label: 'Scout',
    icon: '⌖',
    description: 'Search the local region for contracts and talent while gaining light field experience.',
  },
  {
    id: 'Public Exhibition',
    label: 'Exhibit',
    icon: '✦',
    description: 'Build fame and renown at the cost of some fatigue and occasional embarrassment.',
  },
  {
    id: 'Guild Duty',
    label: 'Guild duty',
    icon: '♜',
    description: 'Work an institutional appointment, improve loyalty and strengthen the organization.',
  },
];

export const TRAINING_FOCI = ['Fundamentals', 'Role Drills', 'Sparring', 'Mentorship', 'Study'];

export const ACTIVITY_BY_ID = Object.fromEntries(MONTHLY_ACTIVITIES.map((activity) => [activity.id, activity]));

// Guild Hall rooms. Activity rooms map 1:1 onto monthly activities; the
// others are management rooms.
export const HALL_ROOMS = [
  { id: 'training', name: 'Training Grounds', icon: '⚔', activity: 'Training', bulk: true, description: 'Heroes train each month. Pick a focus per hero.' },
  { id: 'infirmary', name: 'Infirmary', icon: '✚', activity: 'Infirmary', bulk: true, description: 'Injured heroes heal twice as fast here; healthy heroes recover health.' },
  { id: 'barracks', name: 'Barracks', icon: '☾', activity: 'Rest', bulk: true, description: 'Resting heroes shed fatigue.' },
  { id: 'scouts', name: "Scouts' Table", icon: '⌖', activity: 'Scouting', description: 'Scouts find contracts and talent.' },
  { id: 'courtyard', name: 'Courtyard', icon: '✦', activity: 'Public Exhibition', description: 'Public exhibitions build fame.' },
  { id: 'council', name: 'Council Chamber', icon: '♜', activity: 'Guild Duty', description: 'Guild duty and appointments.' },
  { id: 'war', name: 'War Room', icon: '⚑', description: 'Pick the main party (up to 4) and review saved formations.' },
  { id: 'treasury', name: 'Treasury', icon: '◈', description: 'Income and upkeep, loans and debt, the last council report.' },
  { id: 'armory', name: 'Armory', icon: '⚒', description: 'Equipment and items.' },
  { id: 'facilities', name: 'Facilities', icon: '⌂', description: 'Headquarters upgrades, appointments and doctrine.' },
];

export const ROOM_BY_ACTIVITY = Object.fromEntries(HALL_ROOMS.filter((room) => room.activity).map((room) => [room.activity, room]));
