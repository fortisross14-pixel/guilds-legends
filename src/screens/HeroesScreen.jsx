import React, { useMemo, useState } from 'react';
import { CLASSES, normalizeClassId } from '../data/content.js';
import { PRIMALS } from '../data/world.js';
import { EmptyState, HeroPortrait } from '../components/UI.jsx';
import Icon, { CLASS_ICONS, STATUS_ICONS } from '../components/Icon.jsx';

// The guild's heroes (Guild orb → Party). tabs is ['roster'] or ['legends'].
// One line per hero; everything else is on the hero's page (tap the row).
const FILTER_FROM = 6; // the filter icon appears once the roster is this big

const statusLabel = (hero) => (hero.status === 'injured' ? `Injured · fit in ${Math.max(1, Math.ceil((hero.injuryWeeks || 0) * 7))}d` : hero.status === 'available' ? 'Ready' : hero.status === 'sidejob' ? 'Side job' : hero.status[0].toUpperCase() + hero.status.slice(1));

function HeroRow({ hero, onOpen }) {
  const classId = normalizeClassId(hero.classId);
  const health = Math.max(0, Math.min(100, hero.health ?? 100));
  return (
    <button type="button" className={`hero-row hero-row--${hero.status}`} onClick={onOpen}>
      <HeroPortrait hero={hero} size="sm" showStatus={false} />
      <span className="hero-row__name">
        <strong>{hero.name}</strong>
        <span className="hero-row__meta">
          <b className="num">Lv {hero.level}</b>
          <Icon name={CLASS_ICONS[classId] || 'party'} size={14} label={classId} />
        </span>
      </span>
      <span className="hero-row__hp" aria-label={`Health ${health}`}>
        <i style={{ width: `${health}%` }} className={health >= 75 ? 'is-good' : health >= 45 ? 'is-mid' : 'is-low'} />
      </span>
      <span className="hero-row__status" title={statusLabel(hero)}>
        <Icon name={STATUS_ICONS[hero.status] || 'dot'} size={18} label={statusLabel(hero)} />
      </span>
    </button>
  );
}

export default function HeroesScreen({ state, actions, tabs = ['roster'] }) {
  const tab = tabs[0];
  const [sort, setSort] = useState('level');
  const [classFilter, setClassFilter] = useState('All');
  const [primalFilter, setPrimalFilter] = useState('All');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const active = useMemo(() => state.heroes.filter((hero) => !['retired', 'dead'].includes(hero.status)), [state.heroes]);
  const roster = useMemo(
    () =>
      active
        .filter((hero) => classFilter === 'All' || normalizeClassId(hero.classId) === classFilter)
        .filter((hero) => primalFilter === 'All' || hero.primal === primalFilter)
        .sort((a, b) => {
          if (sort === 'age') return a.age - b.age;
          if (sort === 'potential') return b.potential - a.potential;
          if (sort === 'power') return b.power - a.power;
          return b.level - a.level || b.xp - a.xp;
        }),
    [active, classFilter, primalFilter, sort],
  );
  const legends = useMemo(
    () => [...state.heroes.filter((hero) => ['retired', 'dead'].includes(hero.status)), ...state.historicHeroes].sort((a, b) => b.legacy - a.legacy),
    [state.heroes, state.historicHeroes],
  );
  const filtering = active.length >= FILTER_FROM;

  if (tab === 'legends') {
    return (
      <div className="hero-list">
        {legends.map((hero) => (
          <button className="hero-row hero-row--legend" key={hero.id} onClick={() => actions.openHero(hero.id)}>
            <HeroPortrait hero={hero} size="sm" showStatus={false} />
            <span className="hero-row__name">
              <strong>{hero.name}</strong>
              <span className="hero-row__meta">
                <b className="num">Lv {hero.level || 1}</b>
                <Icon name={CLASS_ICONS[normalizeClassId(hero.classId)] || 'party'} size={14} label={normalizeClassId(hero.classId)} />
              </span>
            </span>
            <span className="hero-row__year num">{hero.status === 'dead' ? hero.deathYear : hero.retiredYear}</span>
            <span className="hero-row__status">
              <Icon name={hero.status === 'dead' ? 'skull' : 'moon'} size={18} label={hero.status === 'dead' ? 'Fallen' : 'Retired'} />
            </span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="hero-list">
      {filtering ? (
        <div className="hero-list__tools">
          <button type="button" className={`icon-button${filtersOpen || classFilter !== 'All' || primalFilter !== 'All' ? ' is-on' : ''}`} aria-expanded={filtersOpen} aria-label="Filter and sort" onClick={() => setFiltersOpen((open) => !open)}>
            <Icon name="search" size={18} />
          </button>
          {filtersOpen ? (
            <div className="filter-bar">
              <select aria-label="Class" value={classFilter} onChange={(event) => setClassFilter(event.target.value)}>
                <option value="All">All classes</option>
                {Object.keys(CLASSES).map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <select aria-label="Primal" value={primalFilter} onChange={(event) => setPrimalFilter(event.target.value)}>
                <option value="All">All primals</option>
                {Object.keys(PRIMALS).map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <select aria-label="Sort" value={sort} onChange={(event) => setSort(event.target.value)}>
                <option value="level">Level</option>
                <option value="power">Power</option>
                <option value="potential">Potential</option>
                <option value="age">Age</option>
              </select>
            </div>
          ) : null}
        </div>
      ) : null}
      {roster.map((hero) => (
        <HeroRow key={hero.id} hero={hero} onOpen={() => actions.openHero(hero.id)} />
      ))}
      {!roster.length ? <EmptyState icon="party" title="No heroes match" text="Clear the filters." /> : null}
    </div>
  );
}
