// Short events that can happen on a journey. Effects live in
// src/game/engine/timeActions.js (resolveRoadEvent).
export const ROAD_EVENTS = {
  ambush: {
    title: 'Ambush on the road',
    text: 'Bandits block the road and demand a toll.',
    options: [
      { id: 'fight', label: 'Fight them off', note: 'An auto-resolved skirmish. Win coin and experience, or lose gold and risk a wound.' },
      { id: 'pay', label: 'Pay the toll', note: 'Lose some gold. Nobody gets hurt.' },
    ],
  },
  merchant: {
    title: 'A travelling merchant',
    text: 'A merchant shares your campfire and offers a trade.',
    options: [
      { id: 'sell', label: 'Sell spare gear', note: 'Gain some gold.' },
      { id: 'provisions', label: 'Buy good provisions', note: 'Spend a little gold. The travellers shake off fatigue.' },
      { id: 'ignore', label: 'Keep moving', note: 'Nothing happens.' },
    ],
  },
  recruit: {
    title: 'A wandering hero',
    text: 'A capable wanderer asks where your banner is headed.',
    options: [
      { id: 'invite', label: 'Invite them to meet you in town', note: 'They join the local recruitment market at half the usual fee.' },
      { id: 'ignore', label: 'Wish them well', note: 'Nothing happens.' },
    ],
  },
  shortcut: {
    title: 'A local knows a shortcut',
    text: 'A shepherd points to a steep trail that saves a month of travel.',
    options: [
      { id: 'take', label: 'Take the shortcut', note: 'Arrive a month sooner. The climb is tiring.' },
      { id: 'safe', label: 'Stay on the road', note: 'Nothing happens.' },
    ],
  },
  delay: {
    title: 'Storm on the road',
    text: 'A storm washes out the road ahead.',
    options: [
      { id: 'wait', label: 'Wait it out', note: 'The journey takes one more month.' },
      { id: 'push', label: 'Push through', note: 'No delay, but heavy fatigue and a chance of injury.' },
    ],
  },
};
