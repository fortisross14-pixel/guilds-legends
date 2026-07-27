import React, { useMemo, useState } from 'react';
import { CLASSES } from '../data/content.js';
import { LOCATION_BY_ID, PRIMALS, RARITIES } from '../data/world.js';
import { activeHeroCount, heroCapacity, xpForNextLevel } from '../game/engine.js';
import { Badge, Button, EmptyState, HeroPortrait, LevelBadge, Panel, PrimalBadge, ProgressBar, RarityBadge, Tabs } from '../components/UI.jsx';

const TRAINING_OPTIONS = ['Fundamentals', 'Role Drills', 'Sparring', 'Mentorship', 'Study', 'Rehabilitation', 'Public Exhibition'];

function candidateValue(candidate) {
  return candidate.level * 70 + candidate.power * 4 + candidate.potential * 2;
}

export default function HeroesScreen({ state, actions, navigate }) {
  const [tab, setTab] = useState(state.flags.firstCompanionHired ? 'roster' : 'recruit');
  const [sort, setSort] = useState('level');
  const [classFilter, setClassFilter] = useState('All');
  const [primalFilter, setPrimalFilter] = useState('All');
  const currentLocationId = state.world?.currentLocationId || 'dunmere';
  const currentLocation = LOCATION_BY_ID[currentLocationId];

  const roster = useMemo(() => state.heroes
    .filter((hero) => !['retired', 'dead'].includes(hero.status))
    .filter((hero) => classFilter === 'All' || hero.classId === classFilter)
    .filter((hero) => primalFilter === 'All' || hero.primal === primalFilter)
    .sort((a, b) => {
      if (sort === 'age') return a.age - b.age;
      if (sort === 'potential') return b.potential - a.potential;
      if (sort === 'legacy') return b.legacy - a.legacy;
      if (sort === 'power') return b.power - a.power;
      return b.level - a.level || b.xp - a.xp;
    }), [state.heroes, classFilter, primalFilter, sort]);

  const localCandidates = useMemo(() => state.candidates
    .filter((candidate) => (candidate.locationId || 'dunmere') === currentLocationId)
    .sort((a, b) => candidateValue(b) - candidateValue(a)), [state.candidates, currentLocationId]);
  const remoteCandidates = useMemo(() => state.candidates
    .filter((candidate) => (candidate.locationId || 'dunmere') !== currentLocationId)
    .sort((a, b) => candidateValue(b) - candidateValue(a)), [state.candidates, currentLocationId]);

  const legends = useMemo(() => [...state.heroes.filter((hero) => ['retired', 'dead'].includes(hero.status)), ...state.historicHeroes]
    .sort((a, b) => b.legacy - a.legacy), [state.heroes, state.historicHeroes]);

  return (
    <div className="screen screen--heroes">
      <header className="screen-heading">
        <div><span className="eyebrow">Level · rarity · class · primal</span><h1>Heroes of the Banner</h1><p>Every hero grows from level 1 to 20. Missions award the most experience; training creates slow, dependable progress while the guild waits for its next great opportunity.</p></div>
        <div className="heading-metrics"><Badge tone="green">{activeHeroCount(state)}/{heroCapacity(state)} active</Badge><Badge tone="gold">{localCandidates.length} local candidates</Badge><PrimalBadge primal={currentLocation?.primal} /></div>
      </header>

      <Tabs active={tab} onChange={setTab} items={[
        { id: 'roster', label: 'Active roster', icon: '♟' },
        { id: 'recruit', label: 'Recruitment market', icon: '✦' },
        { id: 'legends', label: 'Retired & fallen', icon: '▤' },
      ]} />

      {tab === 'roster' ? (
        <>
          <div className="filter-bar">
            <label>Class<select value={classFilter} onChange={(event) => setClassFilter(event.target.value)}><option>All</option>{Object.keys(CLASSES).map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>Primal<select value={primalFilter} onChange={(event) => setPrimalFilter(event.target.value)}><option>All</option>{Object.keys(PRIMALS).map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>Sort by<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="level">Level</option><option value="power">Power</option><option value="potential">Potential</option><option value="age">Age</option><option value="legacy">Legacy</option></select></label>
            <span className="filter-bar__hint">A level is visible progress. Rarity controls the ceiling and cost; class controls role fit; primal controls matchup and cultural affinity.</span>
          </div>
          <div className="hero-grid">
            {roster.map((hero) => {
              const classInfo = CLASSES[hero.classId];
              const nextLevelXp = xpForNextLevel(hero.level);
              return (
                <article className={`hero-card hero-card--${hero.status}`} key={hero.id} style={{ '--rarity': RARITIES[hero.rarity]?.color, '--primal': PRIMALS[hero.primal]?.color }}>
                  <button className="hero-card__identity" onClick={() => actions.openHero(hero.id)}>
                    <div className="hero-card__portrait-stack"><HeroPortrait hero={hero} size="lg" /><LevelBadge hero={hero} /></div>
                    <div><div className="hero-card__name"><h3>{hero.name}</h3>{hero.appointment ? <Badge tone="purple">{hero.appointment}</Badge> : null}</div><div className="hero-card__taxonomy"><RarityBadge rarity={hero.rarity} /><PrimalBadge primal={hero.primal} /><span>{hero.classId}</span></div><p>Age {hero.age} · {hero.origin}</p><small>{hero.hook}</small></div>
                  </button>
                  <div className="hero-level-track">
                    <div><span>{hero.level >= 20 ? 'Maximum level reached' : `Progress to level ${hero.level + 1}`}</span><strong>{hero.level >= 20 ? '20 / 20' : `${hero.xp}/${nextLevelXp} XP`}</strong></div>
                    <ProgressBar value={hero.level >= 20 ? 1 : hero.xp} max={hero.level >= 20 ? 1 : nextLevelXp} tone="purple" compact />
                  </div>
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
                    <label>Monthly training<select value={hero.training} disabled={['mission', 'injured', 'tournament'].includes(hero.status)} onChange={(event) => actions.setTraining(hero.id, event.target.value)}>{TRAINING_OPTIONS.map((item) => <option key={item}>{item}</option>)}</select></label>
                    <span className={`availability availability--${hero.status}`}>{hero.status === 'injured' ? `${hero.injury} · ${hero.injuryMonths}m` : hero.status}</span>
                    <Button size="sm" onClick={() => actions.openHero(hero.id)}>Career</Button>
                  </div>
                  <div className="class-line"><span>{classInfo.glyph}</span><p>{classInfo.description}</p><small>{PRIMALS[hero.primal]?.icon} Beats {PRIMALS[hero.primal]?.beats} · weak to {PRIMALS[hero.primal]?.weakTo}</small></div>
                </article>
              );
            })}
            {!roster.length ? <EmptyState icon="♟" title="No heroes match" text="Clear the filters or recruit a new company member." /> : null}
          </div>
        </>
      ) : null}

      {tab === 'recruit' ? (
        <div className="recruit-layout">
          <Panel title={`The market in ${currentLocation?.name}`} eyebrow={`${currentLocation?.primal} territory · local negotiations only`}>
            <div className="recruit-market-intro">
              <div><span>{currentLocation?.icon}</span><div><strong>{currentLocation?.name} specialties</strong><p>{currentLocation?.specialties.join(' · ')}</p></div></div>
              <p>Higher-level and rarer heroes can transform the guild immediately, but demand a larger signing fee and monthly salary. Markets refresh with time and whenever the guild arrives in a new settlement.</p>
            </div>
            <div className="candidate-grid">
              {localCandidates.map((candidate) => (
                <article className="candidate-card" key={candidate.id} style={{ '--rarity': RARITIES[candidate.rarity]?.color, '--primal': PRIMALS[candidate.primal]?.color }}>
                  <div className="candidate-card__top"><div className="hero-card__portrait-stack"><HeroPortrait hero={candidate} size="md" showStatus={false} /><LevelBadge hero={candidate} /></div><div><h3>{candidate.name}</h3><div className="candidate-card__taxonomy"><RarityBadge rarity={candidate.rarity} /><PrimalBadge primal={candidate.primal} /></div><p>{candidate.classId} · Age {candidate.age}</p><Badge tone={candidate.channel === 'Academy' ? 'purple' : candidate.channel === 'Scout network' ? 'blue' : 'neutral'}>{candidate.channel}</Badge></div></div>
                  <div className="candidate-card__ratings"><span><small>Power</small><strong>{candidate.power}</strong></span><span><small>Potential</small><strong>{candidate.potential}</strong></span><span><small>Interest</small><strong>{candidate.interest}%</strong></span></div>
                  <p className="candidate-card__hook">{candidate.hook}</p>
                  <div className="candidate-card__conditions"><span><b>Dream</b>{candidate.dream}</span><span><b>Flaw</b>{candidate.flaw}</span><span><b>Monthly salary</b>{candidate.salary} crowns</span></div>
                  <div className="candidate-card__contract"><span>Signing fee<strong>{candidate.signingFee.toLocaleString()}</strong></span><span>First-year commitment<strong>{(candidate.signingFee + candidate.salary * 12).toLocaleString()}</strong></span></div>
                  <Button variant="primary" onClick={() => actions.recruit(candidate.id)} disabled={activeHeroCount(state) >= heroCapacity(state) || state.guild.crowns < candidate.signingFee}>{candidate.signingFee === 0 ? 'Choose as founding companion' : state.guild.crowns < candidate.signingFee ? `Need ${candidate.signingFee - state.guild.crowns} more crowns` : `Offer ${candidate.signingFee} crowns`}</Button>
                </article>
              ))}
              {!localCandidates.length ? <EmptyState icon="✦" title="The local market is empty" text="Advance into a new year or travel to another settlement to meet different classes and primals." action={<Button onClick={() => navigate('world')}>Open world map</Button>} /> : null}
            </div>
          </Panel>
          <aside className="recruit-sidebar">
            <Panel title="Hiring strategy" eyebrow="Build toward arrangements" tone="dark">
              <ul className="insight-list"><li><b>Combat:</b> commander, fighters and cleric/artificer support.</li><li><b>Diplomacy:</b> presence-led negotiators supported by strategists and advocates.</li><li><b>Expedition:</b> ranger or artificer leads, searchers and a curator.</li><li><b>Intrigue:</b> rogues, scouts and a reliable extraction specialist.</li><li>A local primal helps cultural negotiations but can be poor against local enemies.</li></ul>
            </Panel>
            <Panel title="Current capacity" eyebrow="Institutional limit">
              <ProgressBar value={activeHeroCount(state)} max={heroCapacity(state)} tone={activeHeroCount(state) >= heroCapacity(state) ? 'red' : 'green'} />
              <p className="muted">Upgrade the Great Hall or earn a higher social tier to increase active capacity.</p>
            </Panel>
            {remoteCandidates.length ? <Panel title="Scouted elsewhere" eyebrow={`${remoteCandidates.length} known candidates`}>
              <div className="remote-candidate-list">{remoteCandidates.slice(0, 6).map((candidate) => <article key={candidate.id}><PrimalBadge primal={candidate.primal} compact /><div><strong>{candidate.name}</strong><small>Lv {candidate.level} {candidate.rarity} {candidate.classId}</small><span>{LOCATION_BY_ID[candidate.locationId]?.name}</span></div></article>)}</div>
              <Button onClick={() => navigate('world')}>Plan recruitment journey</Button>
            </Panel> : null}
          </aside>
        </div>
      ) : null}

      {tab === 'legends' ? (
        <Panel title="Careers that no longer move" eyebrow="Institutional memory">
          {legends.length ? <div className="legend-list">{legends.map((hero, index) => (
            <button className="legend-row" key={hero.id} onClick={() => actions.openHero(hero.id)}>
              <span className="legend-row__rank">{index + 1}</span><HeroPortrait hero={hero} size="xs" /><div><strong>{hero.name}</strong><small>Lv {hero.level || 1} · {hero.rarity || 'Common'} · {hero.primal || 'Unknown'} {hero.classId} · {hero.status === 'dead' ? `Died ${hero.deathYear || ''}` : `Retired ${hero.retiredYear || ''}`}</small></div><span>{hero.career?.missions || 0} missions</span><span>{hero.career?.titles || 0} titles</span><b>{hero.legacy} legacy</b>
            </button>
          ))}</div> : <EmptyState icon="▤" title="The archive is still young" text="Retirements and deaths will eventually turn this page into the emotional center of the campaign." />}
        </Panel>
      ) : null}
    </div>
  );
}
