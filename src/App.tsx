import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen, Castle, ChevronRight, Crown, Flag, Hourglass, Map, Medal, Menu,
  ScrollText, Shield, Swords, Target, Trophy, UserRound, Users, X, Coins, Star,
  Activity, HeartPulse, Landmark, Compass, Hammer, Plus, CheckCircle2
} from 'lucide-react';
import { CLASS_SIGILS } from './data/content';
import { advanceMonth, assignHero, chooseAlignment, commitMission, getActiveGoal, recruitHero, upgradeFacility, visitScreen } from './game/engine';
import { createInitialGame } from './game/createGame';
import { clearGame, loadGame, saveGame } from './game/storage';
import type { GameState, Hero, Mission, Screen } from './types/game';

const navItems: {id:Screen; label:string; icon:typeof Castle}[] = [
  {id:'command',label:'Command',icon:Castle},{id:'heroes',label:'Heroes',icon:Users},{id:'missions',label:'Missions',icon:Swords},
  {id:'world',label:'World',icon:Map},{id:'rankings',label:'Rankings',icon:Trophy},{id:'chronicle',label:'Chronicle',icon:BookOpen},{id:'headquarters',label:'Headquarters',icon:Landmark}
];

const monthNames=['January','February','March','April','May','June','July','August','September','October','November','December'];
const cx=(...v:(string|false|undefined)[])=>v.filter(Boolean).join(' ');

function App(){
  const [state,setState]=useState<GameState>(()=>loadGame()??createInitialGame());
  const [menuOpen,setMenuOpen]=useState(false);
  useEffect(()=>saveGame(state),[state]);
  const activeGoal=getActiveGoal(state);
  const activeMissions=state.missions.filter(m=>m.status==='active');

  function navigate(screen:Screen){setState(s=>visitScreen(s,screen));setMenuOpen(false);}
  function reset(){clearGame();setState(createInitialGame());}

  return <div className="game-shell">
    <aside className={cx('side-rail',menuOpen&&'open')}>
      <div className="brand"><div className="brand-mark">BL</div><div><small>Guilds of Legend</small><strong>{state.guildName}</strong></div><button className="icon-button mobile-close" onClick={()=>setMenuOpen(false)}><X size={20}/></button></div>
      <nav>{navItems.map(item=>{const Icon=item.icon;return <button key={item.id} className={cx('nav-button',state.screen===item.id&&'active')} onClick={()=>navigate(item.id)}><Icon size={19}/><span>{item.label}</span>{state.screen===item.id&&<ChevronRight size={16}/>}</button>})}</nav>
      <div className="rail-footer"><div><span>Campaign</span><b>{monthNames[state.month-1]} {state.year}</b></div><button onClick={reset}>Restart campaign</button></div>
    </aside>

    <main className="main-area">
      <header className="topbar">
        <button className="icon-button mobile-menu" onClick={()=>setMenuOpen(true)}><Menu size={22}/></button>
        <div className="title-block"><span>{state.tier} guild · rank #{state.localRank}</span><h1>{navItems.find(n=>n.id===state.screen)?.label}</h1></div>
        <div className="resource-strip">
          <div><Coins size={17}/><span>{state.gold.toLocaleString()}</span><small>crowns</small></div>
          <div><Star size={17}/><span>{state.fame}</span><small>fame</small></div>
          <div><Medal size={17}/><span>{state.legacy}</span><small>legacy</small></div>
        </div>
      </header>

      <section className="goal-ribbon">
        <div className="goal-icon"><Target size={21}/></div>
        <div className="goal-copy">
          <div><span>{activeGoal?.kind==='tutorial'?'NEXT STEP':activeGoal?.kind==='season'?'CURRENT CAMPAIGN GOAL':'LONG-TERM LEGACY'}</span>{activeGoal?.completed&&<CheckCircle2 size={16}/>}</div>
          <strong>{activeGoal?.title??'The guild writes its own history'}</strong>
          <p>{activeGoal?.instruction??'Continue the campaign and pursue the stories that matter to you.'}</p>
        </div>
        {activeGoal&&<div className="goal-progress"><span>{activeGoal.progress}/{activeGoal.target}</span><div><i style={{width:`${Math.min(100,activeGoal.progress/activeGoal.target*100)}%`}}/></div><button onClick={()=>navigate(activeGoal.screen)}>Go there <ChevronRight size={15}/></button></div>}
      </section>

      <div className="screen-content">
        {state.screen==='command'&&<CommandScreen state={state} navigate={navigate}/>} 
        {state.screen==='heroes'&&<HeroesScreen state={state} setState={setState}/>} 
        {state.screen==='missions'&&<MissionsScreen state={state} setState={setState}/>} 
        {state.screen==='world'&&<WorldScreen state={state} setState={setState}/>} 
        {state.screen==='rankings'&&<RankingsScreen state={state}/>} 
        {state.screen==='chronicle'&&<ChronicleScreen state={state}/>} 
        {state.screen==='headquarters'&&<HeadquartersScreen state={state} setState={setState}/>} 
      </div>

      <footer className="time-bar">
        <div><Hourglass size={18}/><span>{activeMissions.length?`${activeMissions.length} company ${activeMissions.length===1?'is':'are'} in the field`:'No company is currently deployed'}</span></div>
        <button onClick={()=>setState(advanceMonth)} disabled={!state.goals.find(g=>g.id==='goal-send-mission')?.completed&&activeMissions.length===0}>Advance one month <ChevronRight size={17}/></button>
      </footer>
    </main>
  </div>
}

function CommandScreen({state,navigate}:{state:GameState;navigate:(s:Screen)=>void}){
  const active=state.missions.filter(m=>m.status==='active');
  const available=state.heroes.filter(h=>h.status==='Available');
  return <div className="command-grid">
    <section className="command-hero">
      <div className="kicker">THE BROKEN LANTERN CAMPAIGN</div>
      <h2>{active.length?`${active[0].title} is underway`:'A guild is remembered by what it chooses to risk.'}</h2>
      <p>{active.length?`${active[0].assignedHeroIds.length} heroes are away. Their return may change careers, rivalries, and the standing of the guild.`:'Begin with the instructions above. They teach the core loop: inspect, prepare, commit, resolve, interpret.'}</p>
      <div className="hero-actions"><button className="primary" onClick={()=>navigate('missions')}><Swords size={18}/>Open contract board</button><button onClick={()=>navigate('heroes')}><Users size={18}/>Review roster</button></div>
    </section>

    <section className="summary-card"><span>Available heroes</span><strong>{available.length}</strong><p>{state.heroes.length} total recorded</p><Users size={24}/></section>
    <section className="summary-card"><span>Active missions</span><strong>{active.length}</strong><p>{active[0]?`${active[0].remaining} month remaining`:'Ready for orders'}</p><ScrollText size={24}/></section>
    <section className="summary-card"><span>Regional test</span><strong>{Math.min(100,Math.round(state.fame/40*100))}%</strong><p>40 fame, 3 contracts, tournament result</p><Flag size={24}/></section>

    <section className="ledger-panel wide">
      <div className="section-heading"><div><span>CAMPAIGN ORDERS</span><h3>From immediate instruction to century-long ambition</h3></div></div>
      <div className="orders-list">{state.goals.map(goal=><div key={goal.id} className={cx('order-row',goal.completed&&'done')}><div className="order-kind">{goal.kind==='tutorial'?'I':goal.kind==='season'?'II':'III'}</div><div><strong>{goal.title}</strong><p>{goal.instruction}</p></div><div className="order-state">{goal.completed?<CheckCircle2 size={19}/>:<><span>{goal.progress}/{goal.target}</span><div><i style={{width:`${goal.progress/goal.target*100}%`}}/></div></>}</div></div>)}</div>
    </section>

    <section className="ledger-panel news-panel">
      <div className="section-heading"><div><span>DUNMERE GAZETTE</span><h3>The world moves without you</h3></div></div>
      {state.headlines.slice(0,5).map((h,i)=><article key={`${h}-${i}`}><time>{i===0?'Now':`${i} mo.`}</time><p>{h}</p></article>)}
    </section>

    <section className="ledger-panel">
      <div className="section-heading"><div><span>RECENT HISTORY</span><h3>What the archive will remember</h3></div><button onClick={()=>navigate('chronicle')}>Open archive</button></div>
      {state.chronicle.slice(0,4).map(e=><div className="history-line" key={e.id}><span>{e.date}</span><div><strong>{e.title}</strong><p>{e.text}</p></div></div>)}
    </section>
  </div>
}

function HeroSigil({hero,large=false}:{hero:Hero;large?:boolean}){return <div className={cx('hero-sigil',large&&'large')}><span>{CLASS_SIGILS[hero.heroClass].slice(0,1)}</span></div>}

function HeroesScreen({state,setState}:{state:GameState;setState:React.Dispatch<React.SetStateAction<GameState>>}){
  const selected=state.heroes.find(h=>h.id===state.selectedHeroId)??state.heroes[0];
  const ranked=[...state.heroes].sort((a,b)=>b.power-a.power);
  return <div className="heroes-layout">
    <section className="roster-panel">
      <div className="section-heading"><div><span>ACTIVE ROSTER</span><h3>{state.heroes.length} careers under one banner</h3></div><button className="small-button" onClick={()=>setState(recruitHero)}><Plus size={16}/>Recruit 350</button></div>
      <div className="roster-list">{ranked.map(h=><button key={h.id} className={cx('roster-row',selected.id===h.id&&'selected')} onClick={()=>setState(s=>({...s,selectedHeroId:h.id}))}><HeroSigil hero={h}/><div><strong>{h.name}</strong><span>{h.heroClass} · age {h.age} · {h.status}</span></div><b>{h.power}</b></button>)}</div>
    </section>
    <section className="hero-dossier">
      <div className="dossier-head"><HeroSigil hero={selected} large/><div><span>{selected.heroClass.toUpperCase()} · {selected.status.toUpperCase()}</span><h2>{selected.name}</h2><p>{selected.dream}</p></div></div>
      <div className="hero-metrics"><div><span>Power</span><strong>{selected.power}</strong><small>potential {selected.potential}</small></div><div><span>Form</span><strong>{selected.form}</strong><small>{selected.fatigue}% fatigue</small></div><div><span>Renown</span><strong>{selected.renown}</strong><small>{selected.career.titles} titles</small></div><div><span>Loyalty</span><strong>{selected.loyalty}</strong><small>{selected.trait}</small></div></div>
      <div className="trait-strip"><span>{selected.trait}</span><span className="negative">{selected.flaw}</span><span>{selected.dream}</span></div>
      <div className="dossier-columns">
        <div><h3>Attributes</h3>{Object.entries(selected.attributes).map(([k,v])=><div className="stat-bar" key={k}><span>{k}</span><div><i style={{width:`${v}%`}}/></div><b>{v}</b></div>)}</div>
        <div><h3>Career ledger</h3><div className="career-grid"><div><span>Missions</span><b>{selected.career.missions}</b></div><div><span>Victories</span><b>{selected.career.wins}</b></div><div><span>Titles</span><b>{selected.career.titles}</b></div><div><span>Career fame</span><b>{selected.career.fame}</b></div></div>
          <div className="career-history">{selected.history.length?selected.history.slice().reverse().map((e,i)=><p key={i}><span>{e.date}</span>{e.text}</p>):<p><span>1187</span>The first page remains unwritten.</p>}</div>
        </div>
      </div>
    </section>
  </div>
}

function MissionsScreen({state,setState}:{state:GameState;setState:React.Dispatch<React.SetStateAction<GameState>>}){
  const selected=state.missions.find(m=>m.id===state.selectedMissionId)??state.missions[0];
  const assigned=selected.assignedHeroIds.map(id=>state.heroes.find(h=>h.id===id)).filter(Boolean) as Hero[];
  const expected=assigned.length?Math.round(assigned.reduce((a,h)=>a+h.power,0)/assigned.length+assigned.filter(h=>selected.recommended.includes(h.heroClass)).length*7):0;
  return <div className="missions-layout">
    <section className="mission-board">
      <div className="section-heading"><div><span>CONTRACT BOARD</span><h3>Choose what becomes history</h3></div></div>
      {state.missions.filter(m=>m.status!=='resolved').map(m=><button key={m.id} className={cx('mission-list-row',selected.id===m.id&&'selected')} onClick={()=>setState(s=>({...s,selectedMissionId:m.id}))}><div className={cx('risk-mark',m.risk.toLowerCase())}>{m.risk[0]}</div><div><strong>{m.title}</strong><span>{m.family} · {m.duration} month{m.duration>1?'s':''}</span></div><div><b>{m.rewardGold}</b><small>crowns</small></div></button>)}
    </section>
    <section className="mission-sheet">
      <div className="mission-title-line"><div><span>{selected.issuer.toUpperCase()}</span><h2>{selected.title}</h2></div><div className={cx('risk-label',selected.risk.toLowerCase())}>{selected.risk} risk</div></div>
      <p className="mission-description">{selected.description}</p>
      <div className="mission-facts"><div><span>Reward</span><b>{selected.rewardGold} crowns</b></div><div><span>Fame</span><b>+{selected.rewardFame}</b></div><div><span>Travel</span><b>{selected.duration} month{selected.duration>1?'s':''}</b></div><div><span>Secondary goal</span><b>{selected.secondaryGoal}</b></div></div>
      <div className="section-heading company-heading"><div><span>COMPANY SELECTION</span><h3>Assign 2–5 heroes</h3></div><div className="readiness"><span>Readiness</span><b>{expected}</b></div></div>
      <div className="party-grid">{state.heroes.filter(h=>h.status==='Available'||selected.assignedHeroIds.includes(h.id)).map(h=>{const picked=selected.assignedHeroIds.includes(h.id);const fit=selected.recommended.includes(h.heroClass);return <button key={h.id} disabled={selected.status!=='available'} className={cx('party-card',picked&&'picked')} onClick={()=>setState(s=>assignHero(s,selected.id,h.id))}><HeroSigil hero={h}/><div><strong>{h.name}</strong><span>{h.heroClass} · power {h.power}</span></div>{fit&&<small>Recommended</small>}</button>})}</div>
      <div className="mission-explanation"><Shield size={19}/><div><strong>How outcome works</strong><p>Power matters, but class fit, form, fatigue, mission risk and chance all contribute. Recommended classes add options and reduce bad outcomes.</p></div></div>
      <button className="commit-button" disabled={selected.status!=='available'||selected.assignedHeroIds.length<2} onClick={()=>setState(s=>commitMission(s,selected.id))}>{selected.status==='active'?'Company deployed':selected.assignedHeroIds.length<2?'Select at least 2 heroes':'Commit company to mission'}<ChevronRight size={18}/></button>
    </section>
  </div>
}

function WorldScreen({state,setState}:{state:GameState;setState:React.Dispatch<React.SetStateAction<GameState>>}){
  return <div className="world-layout">
    <section className="region-board">
      <div className="map-copy"><span>KNOWN WORLD · 12% CHARTED</span><h2>Dunmere District</h2><p>At Local tier, roads matter more than continents. Each promotion widens the map and changes the obligations of the guild.</p></div>
      <div className="schematic-map" aria-label="Schematic map of Dunmere district"><div className="river"/><div className="road road-a"/><div className="road road-b"/><div className="location town"><Castle/><b>Dunmere</b><span>Guild headquarters</span></div><div className="location woods"><Compass/><b>Blackwood</b><span>Unresolved saga</span></div><div className="location field"><Swords/><b>Harvest Field</b><span>Local tournament</span></div><div className="location unknown"><span>?</span><b>Old Pass</b><small>Unknown</small></div></div>
    </section>
    <section className="ledger-panel political-panel">
      <div className="section-heading"><div><span>FIRST POLITICAL DECISION</span><h3>Who receives your banner?</h3></div></div>
      <p className="helper">This is a permanent campaign direction. It changes mission access, relationships, and future narrative events.</p>
      <div className="alignment-grid">{[
        ['Town Council','Civic trust','Safer contracts, local support, modest pay.'],['Border Baron','Military access','Better equipment and dangerous obligations.'],['Independent','Freedom','Harder early years, broader long-term choices.']
      ].map(([name,label,desc])=><button key={name} disabled={Boolean(state.alignment)} className={cx(state.alignment===name&&'chosen')} onClick={()=>setState(s=>chooseAlignment(s,name as GameState['alignment']))}><span>{label}</span><strong>{name}</strong><p>{desc}</p>{state.alignment===name&&<CheckCircle2/>}</button>)}</div>
    </section>
    <section className="ledger-panel rivals-panel"><div className="section-heading"><div><span>KNOWN RIVALS</span><h3>Eight guilds with their own ambitions</h3></div></div>{[...state.rivals].sort((a,b)=>b.fame-a.fame).map((g,i)=><div className="rival-row" key={g.id}><b>{i+1}</b><div className="crest-small">{g.name.split(' ').map(x=>x[0]).join('').slice(0,2)}</div><div><strong>{g.name}</strong><span>{g.ethos}</span></div><div><strong>{g.fame}</strong><span>{g.trend>=0?`+${g.trend}`:g.trend} trend</span></div></div>)}</section>
  </div>
}

function RankingsScreen({state}:{state:GameState}){
  const guildRows=[{name:state.guildName,fame:state.fame,power:Math.round(state.heroes.reduce((a,h)=>a+h.power,0)/state.heroes.length),titles:state.heroes.reduce((a,h)=>a+h.career.titles,0),player:true},...state.rivals.map(r=>({...r,player:false}))].sort((a,b)=>b.fame-a.fame);
  const heroRows=[...state.heroes].sort((a,b)=>(b.renown+b.career.titles*18+b.career.fame*.5)-(a.renown+a.career.titles*18+a.career.fame*.5));
  return <div className="rankings-grid">
    <section className="ledger-panel"><div className="section-heading"><div><span>GUILD TABLE</span><h3>Standing in the Crownlands</h3></div></div><div className="table-head"><span>Rank</span><span>Guild</span><span>Power</span><span>Titles</span><span>Fame</span></div>{guildRows.map((g,i)=><div className={cx('ranking-row',g.player&&'player')} key={g.name}><b>{i+1}</b><div><strong>{g.name}</strong><span>{g.player?'Your guild':'Rival guild'}</span></div><span>{g.power}</span><span>{g.titles}</span><strong>{g.fame}</strong></div>)}</section>
    <section className="ledger-panel"><div className="section-heading"><div><span>HERO LEDGER</span><h3>Greatest active careers</h3></div></div>{heroRows.map((h,i)=><div className="hero-rank-row" key={h.id}><b>{i+1}</b><HeroSigil hero={h}/><div><strong>{h.name}</strong><span>{h.heroClass} · age {h.age}</span></div><div><strong>{h.renown+h.career.titles*18+Math.round(h.career.fame*.5)}</strong><span>historical score</span></div></div>)}</section>
  </div>
}

function ChronicleScreen({state}:{state:GameState}){
  return <div className="chronicle-layout"><section className="chronicle-cover"><div className="book-mark"><BookOpen/></div><span>THE ARCHIVE OF THE BROKEN LANTERN</span><h2>{state.year-1186} years under the banner</h2><p>The Chronicle stores facts before prose: careers, titles, sacrifices, rivalries, records, failures, and unfinished dreams.</p><div className="archive-metrics"><div><b>{state.chronicle.length}</b><span>recorded events</span></div><div><b>{state.legacy}</b><span>legacy</span></div><div><b>{state.heroes.reduce((a,h)=>a+h.career.titles,0)}</b><span>titles</span></div></div></section><section className="timeline">{state.chronicle.map(entry=><article key={entry.id}><time>{entry.date}</time><div className="timeline-mark"/><div><span>{entry.category}</span><h3>{entry.title}</h3><p>{entry.text}</p></div></article>)}</section></div>
}

function HeadquartersScreen({state,setState}:{state:GameState;setState:React.Dispatch<React.SetStateAction<GameState>>}){
  return <div className="hq-layout"><section className="hq-intro"><div><span>RENTED HALL · DUNMERE</span><h2>An institution is built room by room.</h2><p>At Local tier, money forces real choices. Upgrade for immediate safety, stronger development, or better access to future talent.</p></div><Castle size={64}/></section><section className="facility-list">{state.facilities.map(f=>{const cost=f.baseCost*(f.level+1);return <article key={f.id}><div className="facility-icon">{f.id==='yard'?<Swords/>:f.id==='infirmary'?<HeartPulse/>:f.id==='archive'?<BookOpen/>:f.id==='workshop'?<Hammer/>:<Landmark/>}</div><div><span>LEVEL {f.level}/{f.maxLevel}</span><h3>{f.name}</h3><p>{f.description}</p></div><button disabled={f.level>=f.maxLevel||state.gold<cost} onClick={()=>setState(s=>upgradeFacility(s,f.id))}>{f.level>=f.maxLevel?'Max level':`Upgrade · ${cost}`}</button></article>})}</section></div>
}

export default App;
