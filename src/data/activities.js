// Monthly tasks for heroes who are not in a Guild Hall room (training rooms and
// the infirmary hold heroes themselves: src/data/rooms.js).
export const MONTHLY_ACTIVITIES = [
  {
    id: 'Rest',
    label: 'Rest',
    icon: '☾',
    description: 'Recover fatigue and health with almost no development.',
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

export const ACTIVITY_BY_ID = Object.fromEntries(MONTHLY_ACTIVITIES.map((activity) => [activity.id, activity]));

/** HP and MP between battles (battle-hiring spec). Heroes start a fight with what they have
 * (hero.health and hero.mana are percents). Every day at home: +dailyHeal health and full MP.
 * Knocked out in a won fight: 1 HP and injured for knockoutWeeks. */
export const VITALS = { dailyHeal: 6, knockoutWeeks: 1 };
