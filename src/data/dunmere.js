// Dunmere's exploration-facing content. These records contain no simulation
// state: the engine records only interactions and persistent position.
export const DUNMERE_SIZE = { width: 1400, height: 840 };

export const DUNMERE_DOORS = [
  { id: 'house', label: 'Your rooms', x: 210, y: 596, building: 'guildHall', color: 0x6e4a36 },
  { id: 'tavern', label: 'The Wayfarer', x: 695, y: 330, building: 'tavern', color: 0x9a663a },
  { id: 'guildHall', label: 'Guild Hall', x: 1102, y: 292, building: 'guildHall', color: 0x7d6947 },
  { id: 'shop', label: 'Mira’s Supply', x: 1182, y: 640, building: 'shop', color: 0x8a5d42 },
  { id: 'arena', label: 'Dunmere Arena', x: 770, y: 698, building: 'arena', color: 0x795149 },
  { id: 'herald', label: 'Herald’s Office', x: 346, y: 207, building: 'herald', color: 0x725f82 },
  { id: 'noticeBoard', label: 'Notice Board', x: 662, y: 506, building: 'noticeBoard', color: 0x896f45 },
];

export const DUNMERE_NPCS = [
  { id: 'innkeeper', name: 'Sella Rowan', role: 'Innkeeper', x: 630, y: 430, color: 0xc9894e, building: 'tavern' },
  { id: 'merchant', name: 'Bram Hallow', role: 'Road merchant', x: 825, y: 490, color: 0x7494ae, building: 'noticeBoard' },
  { id: 'fighter', name: 'Nia Voss', role: 'Local fighter', x: 970, y: 572, color: 0xbc6c5d, building: 'arena' },
  { id: 'traveler', name: 'Iven Quill', role: 'Traveler', x: 474, y: 415, color: 0x9f87bd, building: null },
  { id: 'herald', name: 'Orren Pike', role: 'Herald', x: 390, y: 296, color: 0xd1ad5b, building: 'herald' },
];

export function dialogueForDunmereNpc(npcId, state) {
  const opening = state.world?.exploration?.dunmere?.conversations || {};
  const guild = state.guild.name;
  const completedOldRoad = state.missionHistory?.some((mission) => mission.templateId === 'wolves-old-road');
  if (npcId === 'innkeeper') return {
    speaker: 'Sella Rowan',
    lines: opening.innkeeper
      ? [`The Wayfarer keeps a chair open for ${guild}. You are becoming the sort of name people save a seat for.`]
      : [`A new banner is a promise, not a company. The right person might be inside — listen before you hire.`, `The rooms are yours. Come in when you are ready to meet Dunmere’s strays and strivers.`],
    door: 'tavern',
  };
  if (npcId === 'merchant') return {
    speaker: 'Bram Hallow',
    lines: completedOldRoad
      ? [`You cleared the Old Road. My wagons made the run at dawn, and every driver knew whose work made it possible.`, `I will send business your way, ${guild}.`]
      : [`The Old Road is wrong lately. Wolves are bold enough to take a mule in daylight, and someone is driving them closer.`, `I posted the contract at the Notice Board. I need people who will see it through.`],
    door: 'noticeBoard',
  };
  if (npcId === 'fighter') return {
    speaker: 'Nia Voss',
    lines: completedOldRoad
      ? [`So the stories are true. The road is open and ${guild} did it. The Harvest Melee will be more interesting now.`]
      : [`I like a company that starts small. I like it better if it survives. Come back when Dunmere has a reason to remember your name.`],
    door: 'arena',
  };
  if (npcId === 'traveler') return { speaker: 'Iven Quill', lines: [`Ironford? Follow the river east. You can hear the foundries before you see the walls.`, `A world feels larger when you learn it from someone who has walked it.`], door: null };
  return { speaker: 'Orren Pike', lines: [`Names are my trade. When ${guild} has earned one, I will make certain Dunmere hears it.`], door: 'herald' };
}
