export const MONTHLY_ACTIVITIES = [
  {
    id: 'Training',
    label: 'Train',
    icon: '⚔',
    description: 'Gain XP. Needs a Training ground; the drill sets the focus.',
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
    description: 'Prioritize recovery. Needs an Infirmary; injured heroes heal twice as fast there.',
  },
  {
    id: 'Scouting',
    label: 'Scout',
    icon: '⌖',
    description: 'Search the local region for contracts and talent. Needs a Scout table.',
  },
  {
    id: 'Public Exhibition',
    label: 'Exhibit',
    icon: '✦',
    description: 'Earn fame and renown; costs some fatigue.',
  },
  {
    id: 'Guild Duty',
    label: 'Guild duty',
    icon: '♜',
    description: 'Hold an appointment and build loyalty. Needs the hall.',
  },
];

// Every drill. Which ones a hero can pick depends on the Training ground level (src/data/rooms.js).
export const TRAINING_FOCI = ['Fundamentals', 'Role Drills', 'Sparring', 'Mentorship', 'Study'];

export const ACTIVITY_BY_ID = Object.fromEntries(MONTHLY_ACTIVITIES.map((activity) => [activity.id, activity]));

// Places in the hall that exist without building anything. Built rooms
// (training ground, infirmary, war room…) come from src/data/rooms.js.
export const HALL_ROOMS = [
  { id: 'quarters', name: 'Quarters', icon: '☾', activity: 'Rest', bulk: true, description: 'Where everyone sleeps. Resting heroes shed fatigue.' },
  { id: 'courtyard', name: 'Town square', icon: '✦', activity: 'Public Exhibition', description: 'Public exhibitions in town build fame.' },
  { id: 'office', name: 'Office', icon: '♜', activity: 'Guild Duty', needsHall: true, description: 'Guild duty, appointments and doctrine.' },
];

/** HP and MP between battles (battle-hiring spec). Heroes start a fight with what they have
 * (hero.health and hero.mana are percents). Every day at home: +dailyHeal health and full MP.
 * Knocked out in a won fight: 1 HP and injured for knockoutWeeks. */
export const VITALS = { dailyHeal: 6, knockoutWeeks: 1 };
