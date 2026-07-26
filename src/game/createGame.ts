import { FACILITIES, MISSION_TEMPLATES, RIVALS } from '../data/content';
import type { GameState, Hero, HeroClass } from '../types/game';

const attrs = (power:number, spread:number[]): Hero['attributes'] => ({
  might: power + spread[0], finesse: power + spread[1], mind: power + spread[2], spirit: power + spread[3], presence: power + spread[4], endurance: power + spread[5]
});

const hero = (id:string, name:string, heroClass:HeroClass, age:number, power:number, potential:number, trait:string, flaw:string, dream:string, spread:number[]):Hero => ({
  id, name, heroClass, age, power, potential, form:72, fatigue:0, health:100, renown:Math.round(power/5), loyalty:78, trait, flaw, dream, status:'Available', attributes:attrs(power,spread), career:{missions:0,wins:0,titles:0,fame:0,injuries:[]}, history:[]
});

export function createInitialGame(): GameState {
  const heroes = [
    hero('h-mara','Mara Veyne','Duelist',22,58,88,'Ambitious','Proud','Become the greatest arena champion',[0,8,1,-2,6,2]),
    hero('h-aldren','Brother Aldren','Cleric',34,55,72,'Reliable','Doctrine-bound','Protect Dunmere from a coming darkness',[-5,-2,7,10,4,1]),
    hero('h-torren','Torren Ash','Ranger',19,51,84,'Fearless','Reckless','Map every road beyond Blackwood',[-1,8,2,1,-3,5]),
    hero('h-ysra','Ysra Stoneborn','Guardian',29,57,69,'Loyal','Slow to trust','Keep every companion alive',[9,-4,0,5,2,8]),
    hero('h-pip','Pip Quickstep','Rogue',17,43,78,'Cunning','Secretive','Become a folk hero instead of a thief',[-4,11,6,-2,1,0])
  ];

  return {
    version:3, seed:1187, year:1187, month:1, tier:'Local', guildName:'The Broken Lantern', founder:'Guildmaster Rowan',
    gold:1250, fame:12, legacy:0, localRank:14, screen:'command', selectedHeroId:heroes[0].id, selectedMissionId:'m-wolves',
    heroes,
    missions:MISSION_TEMPLATES.map(m=>({...m,status:'available',assignedHeroIds:[],remaining:m.duration})),
    rivals:RIVALS.map(r=>({...r})), facilities:FACILITIES.map(f=>({...f})),
    goals:[
      { id:'goal-open-missions', kind:'tutorial', title:'Read the contract board', instruction:'Open Missions and inspect Wolves on the Old Road.', progress:0,target:1,reward:'The next instruction',completed:false,screen:'missions',priority:100 },
      { id:'goal-build-party', kind:'tutorial', title:'Form your first company', instruction:'Assign at least 3 available heroes to Wolves on the Old Road.', progress:0,target:3,reward:'50 crowns',completed:false,screen:'missions',priority:95 },
      { id:'goal-send-mission', kind:'tutorial', title:'Commit the company', instruction:'Send the party on Wolves on the Old Road.', progress:0,target:1,reward:'Unlock time controls',completed:false,screen:'missions',priority:90 },
      { id:'goal-resolve', kind:'tutorial', title:'Bring them home', instruction:'Advance one month and resolve the contract.', progress:0,target:1,reward:'100 crowns',completed:false,screen:'command',priority:85 },
      { id:'goal-review-hero', kind:'tutorial', title:'Read a career page', instruction:'Open Heroes and inspect the returning company.', progress:0,target:1,reward:'Training unlocked',completed:false,screen:'heroes',priority:80 },
      { id:'goal-three-contracts', kind:'season', title:'Reliable hands', instruction:'Complete 3 contracts without losing a hero.', progress:0,target:3,reward:'Guild charter',completed:false,screen:'missions',priority:50 },
      { id:'goal-melee', kind:'season', title:'Make Dunmere remember', instruction:'Reach the top four of the Harvest Melee.', progress:0,target:1,reward:'Tournament banner',completed:false,screen:'missions',priority:45 },
      { id:'goal-fame', kind:'season', title:'Earn regional recognition', instruction:'Reach 40 local fame.', progress:12,target:40,reward:'Regional promotion test',completed:false,screen:'rankings',priority:40 },
      { id:'goal-alignment', kind:'season', title:'Choose who receives your banner', instruction:'Commit to the Town Council, Border Baron, or independence.', progress:0,target:1,reward:'Political route',completed:false,screen:'world',priority:35 },
      { id:'goal-legacy', kind:'legacy', title:'A guild that outlives its founders', instruction:'Reach Regional tier and record 250 legacy.', progress:0,target:250,reward:'A new era',completed:false,screen:'chronicle',priority:10 }
    ],
    chronicle:[{id:'c0',date:'Jan 1187',category:'Guild',title:'The Broken Lantern Reopens',text:'A rented hall, five imperfect heroes, and one promise: the banner will not fall again.',importance:4}],
    headlines:['Road wardens report monster tracks near Blackwood.','The Silver Falcons have signed local champion Sir Caldus.','Harvest Melee registration closes in three months.'],
    notifications:['The guild has reopened. Your first task is waiting on the contract board.']
  };
}
