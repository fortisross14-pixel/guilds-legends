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
