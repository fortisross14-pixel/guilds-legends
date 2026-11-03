// Dunmere's exploration-facing content. These records contain no simulation
// state: the engine records only interactions and persistent position.
export const DUNMERE_SIZE = { width: 1400, height: 840 };
export const DUNMERE_SPAWN = { x: 210, y: 660 };

export const DUNMERE_DOORS = [
  { id: 'house', label: 'Your rooms', x: 210, y: 596, building: 'guildHall', asset: 'town.dunmere.rooms' },
  { id: 'tavern', label: 'The Wayfarer', x: 695, y: 330, building: 'tavern', asset: 'town.dunmere.tavern' },
  { id: 'guildHall', label: 'Guild Hall', x: 1102, y: 292, building: 'guildHall', asset: 'town.dunmere.guildhall.stage1' },
  { id: 'shop', label: 'Mira’s Supply', x: 1182, y: 640, building: 'shop', asset: 'town.dunmere.shop' },
  { id: 'arena', label: 'Dunmere Arena', x: 770, y: 698, building: 'arena', asset: 'town.dunmere.arena' },
  { id: 'herald', label: 'Herald’s Office', x: 346, y: 207, building: 'herald', asset: 'town.dunmere.herald' },
  { id: 'noticeBoard', label: 'Notice Board', x: 880, y: 430, building: 'noticeBoard', asset: 'town.dunmere.noticeboard' },
];

export const DUNMERE_NPCS = [
  { id: 'innkeeper', name: 'Sella Rowan', role: 'Innkeeper', x: 560, y: 430, building: 'tavern' },
  { id: 'merchant', name: 'Bram Hallow', role: 'Road merchant', x: 840, y: 500, building: 'noticeBoard' },
  { id: 'fighter', name: 'Nia Voss', role: 'Local fighter', x: 970, y: 572, building: 'arena' },
  { id: 'traveler', name: 'Iven Quill', role: 'Traveler', x: 450, y: 415, building: null },
  { id: 'herald', name: 'Orren Pike', role: 'Herald', x: 390, y: 296, building: 'herald' },
];

const BUILDING = { w: 188, h: 180 };
const TREES = [
  [160, 150], [520, 118], [850, 132], [950, 118], [1330, 150], [1340, 470], [150, 780], [1000, 780], [470, 700],
];

/**
 * The walkable map for WalkableScene (src/explore). Doors and NPCs are targets:
 * tap one to walk there and interact. `x, y` of a door is the bottom of its doorway.
 */
export const DUNMERE_MAP = {
  id: 'dunmere',
  size: DUNMERE_SIZE,
  spawn: DUNMERE_SPAWN,
  background: '#24333a',
  ground: 'town.dunmere.ground',
  player: { asset: 'char.founder', w: 26, h: 36 },
  blocks: [
    { x: 0, y: 0, w: 106, h: 840 }, // river bank (west)
    { x: 0, y: 0, w: 1400, h: 56 },
    { x: 0, y: 800, w: 1400, h: 40 },
    { x: 1372, y: 0, w: 28, h: 840 },
    { x: 632, y: 372, w: 136, h: 104 }, // fountain
    ...DUNMERE_DOORS.map((door) =>
      door.id === 'noticeBoard' ? { x: door.x - 24, y: door.y - 56, w: 48, h: 50 } : { x: door.x - 86, y: door.y - 150, w: 172, h: 137 },
    ),
    ...TREES.map(([x, y]) => ({ x: x - 12, y: y - 16, w: 24, h: 14 })),
  ],
  props: [
    { asset: 'prop.fountain', x: 620, y: 344, w: 160, h: 140 },
    ...TREES.map(([x, y]) => ({ asset: 'prop.tree', x: x - 30, y: y - 76, w: 60, h: 76 })),
    ...DUNMERE_DOORS.filter((door) => door.id !== 'noticeBoard').map((door) => ({ asset: door.asset, x: door.x - BUILDING.w / 2, y: door.y - 13 - BUILDING.h, ...BUILDING })),
  ],
  targets: [
    ...DUNMERE_DOORS.map((door) => {
      const board = door.id === 'noticeBoard';
      return {
        id: door.id,
        kind: 'door',
        name: door.label,
        verb: board ? 'Inspect' : 'Enter',
        building: door.building,
        x: door.x,
        y: board ? door.y : door.y - 13,
        ...(board ? { asset: door.asset, w: 56, h: 100 } : {}),
        hit: board ? { x: door.x - 28, y: door.y - 100, w: 56, h: 100 } : { x: door.x - BUILDING.w / 2, y: door.y - 13 - BUILDING.h, ...BUILDING },
        approach: { x: door.x, y: door.y + 18 },
        labelAt: { x: door.x, y: board ? door.y - 122 : door.y - 13 - BUILDING.h - 22 },
        reach: 40,
      };
    }),
    ...DUNMERE_NPCS.map((npc) => ({
      id: npc.id,
      kind: 'npc',
      name: npc.name,
      labelText: npc.name.split(' ')[0],
      verb: 'Talk',
      x: npc.x,
      y: npc.y + 18,
      asset: `npc.dunmere.${npc.id}`,
      w: 26,
      h: 36,
      bob: true,
      approach: { x: npc.x, y: npc.y + 38 },
      labelAt: { x: npc.x, y: npc.y - 40 },
      reach: 40,
    })),
  ],
};

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
