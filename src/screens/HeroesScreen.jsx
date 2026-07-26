import React, { useMemo, useState } from 'react';
import { CLASSES } from '../data/content.js';
import { activeHeroCount, heroCapacity } from '../game/engine.js';
import { Badge, Button, EmptyState, HeroPortrait, Panel, ProgressBar, Tabs } from '../components/UI.jsx';

const TRAINING_OPTIONS = ['Fundamentals', 'Role Drills', 'Sparring', 'Mentorship', 'Study', 'Rehabilitation', 'Public Exhibition'];

export default function HeroesScreen({ state, actions }) {
  const [tab, setTab] = useState(state.flags.firstCompanionHired ? 'roster' : 'recruit');
  const [sort, setSort] = useState('power');
  const [classFilter, setClassFilter] = useState('All');

  const roster = useMemo(() => state.heroes
    .filter((hero) => !['retired', 'dead'].includes(hero.status))
    .filter((hero) => classFilter === 'All' || hero.classId === classFilter)
    .sort((a, b) => {
      if (sort === 'age') return a.age - b.age;
      if (sort === 'potential') return b.potential - a.potential;
      if (sort === 'legacy') return b.legacy - a.legacy;
      return b.power - a.power;
    }), [state.heroes, classFilter, sort]);

  const legends = useMemo(() => [...state.heroes.filter((hero) => ['retired', 'dead'].includes(hero.status)), ...state.historicHeroes]
    .sort((a, b) => b.legacy - a.legacy), [state.heroes, state.historicHeroes]);

  return (
    <div className="screen screen--heroes">
      <header className="screen-heading">
        <div><span className="eyebrow">Careers, not ratings</span><h1>Heroes of the Banner</h1><p>You begin as the founding hero. Every recruit expands which arrangements—and therefore which kinds of missions—the guild can credibly pursue.</p></div>
        <div className="heading-metrics"><Badge tone="green">{activeHeroCount(state)}/{heroCapacity(state)} active</Badge><Badge tone="gold">{state.candidates.length} candidates</Badge></div>
      </header>

      <Tabs active={tab} onChange={setTab} items={[
        { id: 'roster', label: 'Active roster', icon: '♟' },
        { id: 'recruit', label: 'Recruitment', icon: '✦' },
        { id: 'legends', label: 'Retired & fallen', icon: '▤' },
      ]} />

      {tab === 'roster' ? (
        <>
          <div className="filter-bar">
            <label>Class<select value={classFilter} onChange={(event) => setClassFilter(event.target.value)}><option>All</option>{Object.keys(CLASSES).map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>Sort by<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="power">Power</option><option value="potential">Potential</option><option value="age">Age</option><option value="legacy">Legacy</option></select></label>
            <span className="filter-bar__hint">Training is applied each month. Young heroes grow faster; appointments trade field availability for institutional strength.</span>
          </div>
          <div className="hero-grid">
            {roster.map((hero) => {
              const classInfo = CLASSES[hero.classId];
              return (
                <article className={`hero-card hero-card--${hero.status}`} key={hero.id}>
                  <button className="hero-card__identity" onClick={() => actions.openHero(hero.id)}>
                    <HeroPortrait hero={hero} size="lg" />
                    <div><div className="hero-card__name"><h3>{hero.name}</h3>{hero.appointment ? <Badge tone="purple">{hero.appointment}</Badge> : null}</div><p>{hero.classId} · Age {hero.age} · {hero.origin}</p><small>{hero.hook}</small></div>
                  </button>
                  <div className="hero-card__ratings">
                    <div><span>Power</span><strong>{hero.power}</strong></div>
                    <div><span>Potential</span><strong>{hero.potential}</strong></div>
                    <div><span>Form</span><strong>{hero.form}</strong></div>
                    <div><span>Renown</span><strong>{hero.renown}</strong></div>
                  </div>
                  <div className="hero-card__bars">
                    <ProgressBar value={hero.health} max={100} label="Health" tone={hero.health >= 75 ? 'green' : hero.health >= 45 ? 'gold' : 'red'} compact />
                    <ProgressBar value={100 - hero.fatigue} max={100} label="Readiness" tone={hero.fatigue < 35 ? 'blue' : hero.fatigue < 65 ? 'gold' : 'red'} compact />
                    <ProgressBar value={hero.loyalty} max={100} label="Loyalty" tone={hero.loyalty >= 70 ? 'green' : hero.loyalty >= 45 ? 'gold' : 'red'} compact />
                  </div>
                  <div className="hero-card__tags"><Badge>{hero.personality}</Badge><Badge tone="red">{hero.flaw}</Badge><Badge tone="blue">Dream: {hero.dream}</Badge></div>
                  <div className="hero-card__footer">
                    <label>Training<select value={hero.training} disabled={['mission', 'injured'].includes(hero.status)} onChange={(event) => actions.setTraining(hero.id, event.target.value)}>{TRAINING_OPTIONS.map((item) => <option key={item}>{item}</option>)}</select></label>
                    <span className={`availability availability--${hero.status}`}>{hero.status === 'injured' ? `${hero.injury} · ${hero.injuryMonths}m` : hero.status}</span>
                    <Button size="sm" onClick={() => actions.openHero(hero.id)}>Career</Button>
                  </div>
                  <div className="class-line"><span>{classInfo.glyph}</span><p>{classInfo.description}</p></div>
                </article>
              );
            })}
            {!roster.length ? <EmptyState icon="♟" title="No heroes match" text="Clear the filter or recruit a new company member." /> : null}
          </div>
        </>
      ) : null}

      {tab === 'recruit' ? (
        <div className="recruit-layout">
          <Panel title="The market of lives" eyebrow="Available candidates">
            <div className="candidate-grid">
              {state.candidates.map((candidate) => (
                <article className="candidate-card" key={candidate.id}>
                  <div className="candidate-card__top"><HeroPortrait hero={candidate} size="md" showStatus={false} /><div><h3>{candidate.name}</h3><p>{candidate.classId} · Age {candidate.age}</p><Badge tone={candidate.channel === 'Academy' ? 'purple' : candidate.channel === 'Scout network' ? 'blue' : 'neutral'}>{candidate.channel}</Badge></div></div>
                  <div className="candidate-card__ratings"><span><small>Power</small><strong>{candidate.power}</strong></span><span><small>Potential</small><strong>{candidate.potential}</strong></span><span><small>Interest</small><strong>{candidate.interest}%</strong></span></div>
                  <p className="candidate-card__hook">{candidate.hook}</p>
                  <div className="candidate-card__conditions"><span><b>Dream</b>{candidate.dream}</span><span><b>Flaw</b>{candidate.flaw}</span><span><b>Salary</b>{candidate.salary}/month</span></div>
                  <Button variant="primary" onClick={() => actions.recruit(candidate.id)} disabled={activeHeroCount(state) >= heroCapacity(state) || state.guild.crowns < candidate.signingFee}>{candidate.signingFee === 0 ? 'Choose as founding companion' : `Recruit for ${candidate.signingFee} crowns`}</Button>
                </article>
              ))}
              {!state.candidates.length ? <EmptyState icon="✦" title="No one is listening" text="New candidates appear each year and through upgraded scouting facilities." /> : null}
            </div>
          </Panel>
          <aside className="recruit-sidebar">
            <Panel title="Why they join" eyebrow="Recruitment logic" tone="dark">
              <ul className="insight-list"><li>Guild tier and fame prove that ambition can be fulfilled.</li><li>Great Hall level determines active capacity.</li><li>High-potential heroes demand more salary and signing money.</li><li>Academy prospects begin weaker but are shaped by your facilities.</li><li>Famous veterans provide immediate results but shorter careers.</li></ul>
            </Panel>
            <Panel title="Current capacity" eyebrow="Institutional limit">
              <ProgressBar value={activeHeroCount(state)} max={heroCapacity(state)} tone={activeHeroCount(state) >= heroCapacity(state) ? 'red' : 'green'} />
              <p className="muted">Upgrade the Great Hall or earn a higher social tier to increase capacity.</p>
            </Panel>
          </aside>
        </div>
      ) : null}

      {tab === 'legends' ? (
        <Panel title="Careers that no longer move" eyebrow="Institutional memory">
          {legends.length ? <div className="legend-list">{legends.map((hero, index) => (
            <button className="legend-row" key={hero.id} onClick={() => actions.openHero(hero.id)}>
              <span className="legend-row__rank">{index + 1}</span><HeroPortrait hero={hero} size="xs" /><div><strong>{hero.name}</strong><small>{hero.classId} · {hero.status === 'dead' ? `Died ${hero.deathYear || ''}` : `Retired ${hero.retiredYear || ''}`}</small></div><span>{hero.career?.missions || 0} missions</span><span>{hero.career?.titles || 0} titles</span><b>{hero.legacy} legacy</b>
            </button>
          ))}</div> : <EmptyState icon="▤" title="The archive is still young" text="Retirements and deaths will eventually turn this page into the emotional center of the campaign." />}
        </Panel>
      ) : null}
    </div>
  );
}
