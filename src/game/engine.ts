import type { GameState, Goal, Hero, Mission, MissionRisk, Screen } from '../types/game';

function clone<T>(value:T):T { return structuredClone(value); }
function clamp(value:number,min:number,max:number){ return Math.max(min,Math.min(max,value)); }
function riskValue(risk:MissionRisk){ return {Low:1,Medium:2,High:3,Deadly:4}[risk]; }
function dateLabel(s:GameState){ return `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][s.month-1]} ${s.year}`; }
function rng(state:GameState){ state.seed=(state.seed*1664525+1013904223)>>>0; return state.seed/4294967296; }
function activeGoal(state:GameState){ return [...state.goals].filter(g=>!g.completed).sort((a,b)=>b.priority-a.priority)[0]; }

function completeGoal(state:GameState,id:string){
  const goal=state.goals.find(g=>g.id===id); if(!goal||goal.completed)return;
  goal.progress=goal.target; goal.completed=true;
  if(id==='goal-build-party') state.gold+=50;
  if(id==='goal-resolve') state.gold+=100;
  state.notifications.unshift(`Goal complete: ${goal.title}. Reward: ${goal.reward}.`);
}

export function visitScreen(current:GameState,screen:Screen):GameState{
  const state=clone(current); state.screen=screen;
  if(screen==='missions') completeGoal(state,'goal-open-missions');
  if(screen==='heroes' && state.goals.find(g=>g.id==='goal-resolve')?.completed) completeGoal(state,'goal-review-hero');
  return state;
}

export function assignHero(current:GameState,missionId:string,heroId:string):GameState{
  const state=clone(current); const mission=state.missions.find(m=>m.id===missionId); const hero=state.heroes.find(h=>h.id===heroId);
  if(!mission||!hero||mission.status!=='available'||hero.status!=='Available')return state;
  const inAnother=state.missions.some(m=>m.status==='available'&&m.id!==missionId&&m.assignedHeroIds.includes(heroId));
  if(inAnother)return state;
  mission.assignedHeroIds=mission.assignedHeroIds.includes(heroId)?mission.assignedHeroIds.filter(id=>id!==heroId):mission.assignedHeroIds.length<5?[...mission.assignedHeroIds,heroId]:mission.assignedHeroIds;
  const tutorial=state.goals.find(g=>g.id==='goal-build-party');
  if(tutorial&&!tutorial.completed){tutorial.progress=mission.id==='m-wolves'?mission.assignedHeroIds.length:0; if(tutorial.progress>=tutorial.target)completeGoal(state,tutorial.id);}
  return state;
}

export function commitMission(current:GameState,missionId:string):GameState{
  const state=clone(current); const mission=state.missions.find(m=>m.id===missionId); if(!mission||mission.status!=='available'||mission.assignedHeroIds.length<2)return state;
  mission.status='active'; mission.remaining=mission.duration;
  mission.assignedHeroIds.forEach(id=>{const h=state.heroes.find(x=>x.id===id);if(h){h.status='On mission';h.history.push({date:dateLabel(state),text:`Departed on ${mission.title}`});}});
  state.chronicle.unshift({id:crypto.randomUUID(),date:dateLabel(state),category:'Mission',title:`Company departs for ${mission.title}`,text:`${mission.assignedHeroIds.length} heroes carry the Broken Lantern banner.`,importance:2});
  if(mission.id==='m-wolves')completeGoal(state,'goal-send-mission');
  return state;
}

function missionPower(state:GameState,mission:Mission){
  const heroes=mission.assignedHeroIds.map(id=>state.heroes.find(h=>h.id===id)).filter(Boolean) as Hero[];
  if(!heroes.length)return 0;
  const avg=heroes.reduce((sum,h)=>sum+h.power*(h.form/100)*(1-h.fatigue/160),0)/heroes.length;
  const classFit=heroes.reduce((sum,h)=>sum+(mission.recommended.includes(h.heroClass)?7:0),0);
  const diversity=new Set(heroes.map(h=>h.heroClass)).size*2;
  return avg+classFit+diversity;
}

function resolveMission(state:GameState,mission:Mission){
  const heroes=mission.assignedHeroIds.map(id=>state.heroes.find(h=>h.id===id)).filter(Boolean) as Hero[];
  const margin=missionPower(state,mission)-(42+riskValue(mission.risk)*12+rng(state)*16);
  const grade=margin>20?'Legendary':margin>10?'Great Success':margin>-4?'Success':margin>-14?'Partial Success':margin>-26?'Defeat':'Catastrophe';
  const success=['Legendary','Great Success','Success'].includes(grade); const partial=grade==='Partial Success';
  const gold=Math.round(mission.rewardGold*(success?1:partial?.55:.15));
  const fame=Math.round(mission.rewardFame*(grade==='Legendary'?2:grade==='Great Success'?1.45:success?1:partial?.45:-.25));
  state.gold+=gold; state.fame=Math.max(0,state.fame+fame); state.legacy+=Math.max(0,Math.round(fame*.6));
  heroes.forEach(h=>{
    h.status='Available'; h.career.missions++; h.career.fame+=Math.max(0,fame); h.renown+=Math.max(0,Math.round(fame/2)); h.fatigue=clamp(h.fatigue+10+riskValue(mission.risk)*6,0,100); h.form=clamp(h.form+(success?5:-8),30,100);
    if(success){h.career.wins++; if(rng(state)<.55)h.power=clamp(h.power+1,20,h.potential);} 
    if((grade==='Catastrophe'&&rng(state)<.24)||(grade==='Defeat'&&rng(state)<.08)){const injury=['Cracked ribs','Damaged knee','Deep cut','Shattered confidence'][Math.floor(rng(state)*4)];h.career.injuries.push(injury);h.health-=18;h.power=Math.max(20,h.power-2);}
    h.history.push({date:dateLabel(state),text:`${grade} at ${mission.title}`});
  });
  if(mission.family==='Tournament'&&success){const champion=[...heroes].sort((a,b)=>b.power-a.power)[0];champion.career.titles++;completeGoal(state,'goal-melee');}
  if(mission.family!=='Tournament'&&success){const g=state.goals.find(x=>x.id==='goal-three-contracts');if(g&&!g.completed){g.progress++;if(g.progress>=g.target)completeGoal(state,g.id);}}
  const fameGoal=state.goals.find(g=>g.id==='goal-fame'); if(fameGoal){fameGoal.progress=state.fame;if(fameGoal.progress>=40)completeGoal(state,fameGoal.id);}
  const star=[...heroes].sort((a,b)=>b.power+b.form-(a.power+a.form))[0];
  state.chronicle.unshift({id:crypto.randomUUID(),date:dateLabel(state),category:mission.family==='Tournament'?'Tournament':'Mission',title:`${grade}: ${mission.title}`,text:`${star?.name??'The company'} became the face of the expedition. The guild earned ${gold} crowns and ${fame} fame.`,importance:grade==='Legendary'?5:success?3:2});
  state.headlines.unshift(`${mission.title}: ${grade}. ${star?.name??'The company'} dominates the local talk.`);
  mission.status='resolved'; mission.assignedHeroIds=[];
  if(mission.id==='m-wolves')completeGoal(state,'goal-resolve');
}

export function advanceMonth(current:GameState):GameState{
  const state=clone(current); state.month++; if(state.month===13){state.month=1;state.year++;state.heroes.forEach(h=>{if(h.status!=='Dead')h.age++;});}
  state.heroes.forEach(h=>{if(h.status==='Available'){h.fatigue=clamp(h.fatigue-12,0,100);h.health=clamp(h.health+6,0,100);}});
  state.missions.filter(m=>m.status==='active').forEach(m=>{m.remaining--;if(m.remaining<=0)resolveMission(state,m);});
  state.rivals.forEach(g=>{g.fame+=Math.floor(rng(state)*8)-1;g.power=clamp(g.power+(rng(state)<.18?1:0),45,95);if(rng(state)<.04)g.titles++;});
  const guilds=[state.fame,...state.rivals.map(r=>r.fame)].sort((a,b)=>b-a);state.localRank=guilds.indexOf(state.fame)+1;
  if(state.fame>=40&&state.goals.find(g=>g.id==='goal-melee')?.completed&&state.goals.find(g=>g.id==='goal-three-contracts')?.completed){state.tier='Regional';}
  const legacyGoal=state.goals.find(g=>g.id==='goal-legacy');if(legacyGoal){legacyGoal.progress=Math.min(legacyGoal.target,state.legacy+(state.tier==='Regional'?100:0));if(state.tier==='Regional'&&state.legacy>=150)completeGoal(state,legacyGoal.id);}
  return state;
}

export function chooseAlignment(current:GameState,alignment:GameState['alignment']):GameState{
  const state=clone(current);state.alignment=alignment;completeGoal(state,'goal-alignment');state.chronicle.unshift({id:crypto.randomUUID(),date:dateLabel(state),category:'Guild',title:`The guild chooses ${alignment}`,text:`The Broken Lantern’s political identity will shape future contracts and enemies.`,importance:4});return state;
}

export function upgradeFacility(current:GameState,id:string):GameState{
  const state=clone(current);const facility=state.facilities.find(f=>f.id===id);if(!facility||facility.level>=facility.maxLevel)return state;const cost=facility.baseCost*(facility.level+1);if(state.gold<cost)return state;state.gold-=cost;facility.level++;state.chronicle.unshift({id:crypto.randomUUID(),date:dateLabel(state),category:'Guild',title:`${facility.name} expanded`,text:`The headquarters now supports level ${facility.level} operations.`,importance:2});return state;
}

export function recruitHero(current:GameState):GameState{
  const state=clone(current);if(state.gold<350)return state;state.gold-=350;
  const names=['Celia Dawn','Brann Hollow','Nessa Wren','Kael Ironwood','Talia Ember','Soren Grey'];const classes:Hero['heroClass'][]=['Mage','Berserker','Bard','Guardian','Ranger','Rogue'];const i=Math.floor(rng(state)*names.length);const power=44+Math.floor(rng(state)*15);
  const h:Hero={id:crypto.randomUUID(),name:names[i],heroClass:classes[i],age:17+Math.floor(rng(state)*12),power,potential:power+15+Math.floor(rng(state)*20),form:70,fatigue:0,health:100,renown:5,loyalty:65+Math.floor(rng(state)*25),trait:['Patient','Brave','Merciful','Disciplined'][Math.floor(rng(state)*4)],flaw:['Vain','Greedy','Jealous','Reckless'][Math.floor(rng(state)*4)],dream:['Found a school','Win a national title','Discover a lost city','Defeat a legendary rival'][Math.floor(rng(state)*4)],status:'Available',attributes:{might:power,finesse:power,mind:power,spirit:power,presence:power,endurance:power},career:{missions:0,wins:0,titles:0,fame:0,injuries:[]},history:[{date:dateLabel(state),text:'Joined the Broken Lantern'}]};state.heroes.push(h);state.selectedHeroId=h.id;return state;
}

export function getActiveGoal(state:GameState):Goal|undefined{return activeGoal(state);}
