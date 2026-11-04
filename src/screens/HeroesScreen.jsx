import React, { useMemo, useState } from 'react';
import { CLASSES, normalizeClassId } from '../data/content.js';
import { PRIMALS, RARITIES } from '../data/world.js';
import { xpForNextLevel } from '../game/engine.js';
import { MONTHLY_ACTIVITIES, TRAINING_FOCI } from '../data/activities.js';
import { Badge, Button, EmptyState, HeroPortrait, LevelBadge, Panel, PrimalBadge, ProgressBar, RarityBadge } from '../components/UI.jsx';

// The guild's heroes (Guild orb → Party). tabs is ['roster'] or ['legends'];
// recruits are met in person in the taverns and arenas (people.js).
export default function HeroesScreen({ state, actions, tabs = ['roster'] }) {
  const tab = tabs[0];
  const [sort, setSort] = useState('level');
  const [classFilter, setClassFilter] = useState('All');
  const [primalFilter, setPrimalFilter] = useState('All');

  const roster = useMemo(
    () =>
      state.heroes
        .filter((hero) => !['retired', 'dead'].includes(hero.status))
        .filter((hero) => classFilter === 'All' || normalizeClassId(hero.classId) === classFilter)
        .filter((hero) => primalFilter === 'All' || hero.primal === primalFilter)
        .sort((a, b) => {
          if (sort === 'age') return a.age - b.age;
          if (sort === 'potential') return b.potential - a.potential;
          if (sort === 'legacy') return b.legacy - a.legacy;
          if (sort === 'power') return b.power - a.power;
          return b.level - a.level || b.xp - a.xp;
        }),
    [state.heroes, classFilter, primalFilter, sort],
  );

  const legends = useMemo(
    () => [...state.heroes.filter((hero) => ['retired', 'dead'].includes(hero.status)), ...state.historicHeroes].sort((a, b) => b.legacy - a.legacy),
    [state.heroes, state.historicHeroes],
  );

  return (
    <div className="screen screen--heroes">
      {tab === 'roster' ? (
        <>
          <div className="filter-bar">
            <label>
              Class
              <select value={classFilter} onChange={(event) => setClassFilter(event.target.value)}>
                <option>All</option>
                {Object.keys(CLASSES).map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              Primal
              <select value={primalFilter} onChange={(event) => setPrimalFilter(event.target.value)}>
                <option>All</option>
                {Object.keys(PRIMALS).map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              Sort by
              <select value={sort} onChange={(event) => setSort(event.target.value)}>
                <option value="level">Level</option>
                <option value="power">Power</option>
                <option value="potential">Potential</option>
                <option value="age">Age</option>
                <option value="legacy">Legacy</option>
              </select>
            </label>
            <span className="filter-bar__hint">
              A level is visible progress. Rarity controls the ceiling and cost; class controls role fit; primal controls matchup and cultural affinity.
            </span>
          </div>
          <div className="hero-grid">
            {roster.map((hero) => {
              const classInfo = CLASSES[normalizeClassId(hero.classId)];
              const nextLevelXp = xpForNextLevel(hero.level);
              return (
                <article
                  className={`hero-card hero-card--${hero.status}`}
                  key={hero.id}
                  style={{ '--rarity': RARITIES[hero.rarity]?.color, '--primal': PRIMALS[hero.primal]?.color }}
                >
                  <button className="hero-card__identity" onClick={() => actions.openHero(hero.id)}>
                    <div className="hero-card__portrait-stack">
                      <HeroPortrait hero={hero} size="lg" />
                      <LevelBadge hero={hero} />
                    </div>
                    <div>
                      <div className="hero-card__name">
                        <h3>{hero.name}</h3>
                        {hero.appointment ? <Badge tone="purple">{hero.appointment}</Badge> : null}
                      </div>
                      <div className="hero-card__taxonomy">
                        <RarityBadge rarity={hero.rarity} />
                        <PrimalBadge primal={hero.primal} />
                        <span>{normalizeClassId(hero.classId)}</span>
                      </div>
                      <p>
                        Age {hero.age} · {hero.origin}
                      </p>
                      <small>{hero.hook}</small>
                    </div>
                  </button>
                  <div className="hero-level-track">
                    <div>
                      <span>{hero.level >= 20 ? 'Maximum level reached' : `Progress to level ${hero.level + 1}`}</span>
                      <strong>{hero.level >= 20 ? '20 / 20' : `${hero.xp}/${nextLevelXp} XP`}</strong>
                    </div>
                    <ProgressBar value={hero.level >= 20 ? 1 : hero.xp} max={hero.level >= 20 ? 1 : nextLevelXp} tone="purple" compact />
                  </div>
                  <div className="hero-card__ratings">
                    <div>
                      <span>Power</span>
                      <strong>{hero.power}</strong>
                    </div>
                    <div>
                      <span>Potential</span>
                      <strong>{hero.potential}</strong>
                    </div>
                    <div>
                      <span>Form</span>
                      <strong>{hero.form}</strong>
                    </div>
                    <div>
                      <span>Renown</span>
                      <strong>{hero.renown}</strong>
                    </div>
                  </div>
                  <div className="hero-card__bars">
                    <ProgressBar value={hero.health} max={100} label="Health" tone={hero.health >= 75 ? 'green' : hero.health >= 45 ? 'gold' : 'red'} compact />
                    <ProgressBar
                      value={100 - hero.fatigue}
                      max={100}
                      label="Readiness"
                      tone={hero.fatigue < 35 ? 'blue' : hero.fatigue < 65 ? 'gold' : 'red'}
                      compact
                    />
                    <ProgressBar
                      value={hero.loyalty}
                      max={100}
                      label="Loyalty"
                      tone={hero.loyalty >= 70 ? 'green' : hero.loyalty >= 45 ? 'gold' : 'red'}
                      compact
                    />
                  </div>
                  <div className="hero-card__tags">
                    <Badge>{hero.personality}</Badge>
                    <Badge tone="red">{hero.flaw}</Badge>
                    <Badge tone="blue">Dream: {hero.dream}</Badge>
                  </div>
                  {hero.promises?.some((promise) => promise.status === 'active') ? (
                    <div className="hero-card__promise">
                      <Badge tone="gold">Promise</Badge>
                      {hero.promises
                        .filter((promise) => promise.status === 'active')
                        .map((promise) => (
                          <span key={promise.id}>
                            <strong>{promise.label}</strong>
                            <small>Due {promise.dueLabel}</small>
                          </span>
                        ))}
                    </div>
                  ) : null}
                  <div className="hero-card__footer hero-card__footer--planning">
                    <label>
                      Monthly assignment
                      <select
                        value={hero.monthlyActivity || (hero.status === 'injured' ? 'Infirmary' : 'Training')}
                        disabled={['mission', 'tournament'].includes(hero.status)}
                        onChange={(event) => actions.setMonthlyActivity(hero.id, event.target.value)}
                      >
                        {MONTHLY_ACTIVITIES.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    {(hero.monthlyActivity || 'Training') === 'Training' && !['mission', 'tournament'].includes(hero.status) ? (
                      <label>
                        Training focus
                        <select value={hero.training} onChange={(event) => actions.setTraining(hero.id, event.target.value)}>
                          {TRAINING_FOCI.map((item) => (
                            <option key={item}>{item}</option>
                          ))}
                        </select>
                      </label>
                    ) : null}
                    <span className={`availability availability--${hero.status}`}>
                      {hero.status === 'injured' ? `${hero.injury} · ${hero.injuryWeeks}w` : hero.status}
                    </span>
                    <Button size="sm" onClick={() => actions.openHero(hero.id)}>
                      Career
                    </Button>
                  </div>
                  <div className="class-line">
                    <span>{classInfo.glyph}</span>
                    <p>{classInfo.description}</p>
                    <small>
                      Beats {PRIMALS[hero.primal]?.beats} · weak to {PRIMALS[hero.primal]?.weakTo}
                    </small>
                  </div>
                </article>
              );
            })}
            {!roster.length ? <EmptyState icon="♟" title="No heroes match" text="Clear the filters or recruit a new company member." /> : null}
          </div>
        </>
      ) : null}

      {tab === 'legends' ? (
        <Panel title="Careers that no longer move" eyebrow="Institutional memory">
          {legends.length ? (
            <div className="legend-list">
              {legends.map((hero, index) => (
                <button className="legend-row" key={hero.id} onClick={() => actions.openHero(hero.id)}>
                  <span className="legend-row__rank">{index + 1}</span>
                  <HeroPortrait hero={hero} size="xs" />
                  <div>
                    <strong>{hero.name}</strong>
                    <small>
                      Lv {hero.level || 1} · {hero.rarity || 'Common'} · {hero.primal || 'Unknown'} {normalizeClassId(hero.classId)} ·{' '}
                      {hero.status === 'dead' ? `Died ${hero.deathYear || ''}` : `Retired ${hero.retiredYear || ''}`}
                    </small>
                  </div>
                  <span>{hero.career?.missions || 0} missions</span>
                  <span>{hero.career?.titles || 0} titles</span>
                  <b>{hero.legacy} legacy</b>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="▤"
              title="The archive is still young"
              text="Retirements and deaths will eventually turn this page into the emotional center of the campaign."
            />
          )}
        </Panel>
      ) : null}
    </div>
  );
}
