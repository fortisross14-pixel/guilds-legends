import type { Facility, HeroClass, Mission, RivalGuild } from '../types/game';

export const CLASS_SIGILS: Record<HeroClass, string> = {
  Guardian: 'Shield', Duelist: 'Blade', Ranger: 'Arrow', Rogue: 'Key', Cleric: 'Sun', Mage: 'Star', Berserker: 'Axe', Bard: 'Lyre'
};

export const MISSION_TEMPLATES: Omit<Mission, 'status' | 'assignedHeroIds' | 'remaining'>[] = [
  { id:'m-wolves', title:'Wolves on the Old Road', family:'Contract', issuer:'Dunmere Merchants', description:'Escort two winter caravans and learn why the packs no longer fear torchlight.', risk:'Low', duration:1, rewardGold:260, rewardFame:7, recommended:['Guardian','Ranger'], secondaryGoal:'No merchant casualties', tutorialTag:'first-contract' },
  { id:'m-bell', title:'The Bell Beneath Dunmere', family:'Investigation', issuer:'Temple of the Dawn', description:'A buried bell sounds beneath a sealed chapel every midnight.', risk:'Medium', duration:2, rewardGold:390, rewardFame:11, recommended:['Cleric','Rogue'], secondaryGoal:'Recover evidence without disturbing the crypt' },
  { id:'m-boar', title:'The Sable Boar', family:'Monster Hunt', issuer:'Dunmere Council', description:'A giant boar has learned to raid storehouses and vanish into marshland.', risk:'Medium', duration:1, rewardGold:420, rewardFame:12, recommended:['Ranger','Guardian'], secondaryGoal:'Preserve the winter grain' },
  { id:'m-heir', title:'Baron Varric’s Missing Heir', family:'Political Mission', issuer:'House Varric', description:'Find the heir before rival agents turn a family crisis into a border war.', risk:'High', duration:2, rewardGold:610, rewardFame:18, recommended:['Rogue','Bard'], secondaryGoal:'Return with proof of who arranged the disappearance' },
  { id:'m-melee', title:'Dunmere Harvest Melee', family:'Tournament', issuer:'Dunmere Arena', description:'The local proving ground. Fame matters as much as victory.', risk:'Medium', duration:1, rewardGold:320, rewardFame:20, recommended:['Duelist','Guardian'], secondaryGoal:'Reach the final four', tutorialTag:'first-tournament' },
  { id:'m-blackwood', title:'Blackwood Tracks', family:'Saga Hunt', issuer:'Anonymous survivor', description:'Follow the trail left by the guild veterans who disappeared years ago.', risk:'High', duration:3, rewardGold:740, rewardFame:26, recommended:['Ranger','Cleric','Rogue'], secondaryGoal:'Discover what happened to the old captain' },
  { id:'m-ruins', title:'Ruins of Saint Oren', family:'Dungeon', issuer:'Temple of the Dawn', description:'Recover a reliquary from a flooded crypt before grave robbers reach it.', risk:'High', duration:2, rewardGold:680, rewardFame:19, recommended:['Cleric','Mage','Guardian'], secondaryGoal:'Leave the saint’s tomb intact' },
  { id:'m-ford', title:'Smugglers at Reed Ford', family:'Infiltration', issuer:'Town Watch', description:'Expose the river ring—or discover why half the town quietly protects it.', risk:'Medium', duration:1, rewardGold:460, rewardFame:10, recommended:['Rogue','Bard'], secondaryGoal:'Identify the patron financing the smugglers' }
];

export const RIVALS: RivalGuild[] = [
  { id:'g1', name:'Silver Falcons', ethos:'Noble Order', fame:138, power:68, titles:3, treasury:2700, trend:2 },
  { id:'g2', name:'Red Company', ethos:'Mercenary Company', fame:121, power:72, titles:2, treasury:3400, trend:1 },
  { id:'g3', name:'Greenwardens', ethos:'Frontier Brotherhood', fame:102, power:64, titles:1, treasury:1800, trend:3 },
  { id:'g4', name:'Order of Glass', ethos:'Scholastic Circle', fame:94, power:66, titles:1, treasury:2300, trend:0 },
  { id:'g5', name:'Morrow Crew', ethos:'Popular Crew', fame:88, power:61, titles:2, treasury:1500, trend:4 },
  { id:'g6', name:'Ashen Choir', ethos:'Religious Order', fame:78, power:59, titles:0, treasury:1900, trend:-1 },
  { id:'g7', name:'Black Antlers', ethos:'Criminal Guild', fame:69, power:63, titles:0, treasury:3200, trend:2 },
  { id:'g8', name:'Lantern Guard', ethos:'Civic Company', fame:57, power:55, titles:0, treasury:1200, trend:1 }
];

export const FACILITIES: Facility[] = [
  { id:'hall', name:'Great Hall', level:1, maxLevel:4, baseCost:500, description:'Raises hero capacity and unlocks guild appointments.' },
  { id:'yard', name:'Training Yard', level:1, maxLevel:4, baseCost:450, description:'Improves monthly growth and reduces form loss.' },
  { id:'infirmary', name:'Infirmary', level:1, maxLevel:4, baseCost:520, description:'Speeds recovery and reduces mission death risk.' },
  { id:'archive', name:'Archive', level:1, maxLevel:4, baseCost:380, description:'Converts achievements into more legacy and richer chronicles.' },
  { id:'scout', name:'Scout Office', level:0, maxLevel:3, baseCost:650, description:'Reveals mission threats and better recruits.' },
  { id:'academy', name:'Academy', level:0, maxLevel:3, baseCost:900, description:'Produces young heroes with higher potential.' },
  { id:'workshop', name:'Workshop', level:0, maxLevel:3, baseCost:760, description:'Reduces expedition costs and improves specialist missions.' },
  { id:'guest', name:'Guest Wing', level:0, maxLevel:3, baseCost:620, description:'Improves recruitment and patron relationships.' }
];
