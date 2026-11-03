import React, { useMemo, useState } from 'react';
import { Badge, EmptyState, HeroPortrait, Panel, Tabs } from '../components/UI.jsx';

export default function ChronicleScreen({ state, actions }) {
  const [tab, setTab] = useState('timeline');
  const [type, setType] = useState('All');
  const [search, setSearch] = useState('');
  const [year, setYear] = useState('All');
  const years = [...new Set(state.chronicle.map((event) => event.year))].sort((a, b) => b - a);
  const filtered = useMemo(
    () =>
      state.chronicle.filter(
        (event) =>
          (type === 'All' || event.type === type) &&
          (year === 'All' || event.year === Number(year)) &&
          (!search || `${event.title} ${event.text}`.toLowerCase().includes(search.toLowerCase())),
      ),
    [state.chronicle, type, year, search],
  );
  const eventTypes = ['All', ...new Set(state.chronicle.map((event) => event.type))];
  return (
    <div className="screen screen--chronicle">
      <header className="screen-heading">
        <div>
          <span className="eyebrow">Nothing important disappears</span>
          <h1>The Guild Chronicle</h1>
          <p>The year-by-year story of the guild. Contracts live in the mission log; records and the hall of fame are at the Herald.</p>
        </div>
        <div className="heading-metrics">
          <Badge tone="purple">{state.chronicle.length} events</Badge>
          <Badge tone="blue">{(state.missionHistory || []).length} contracts logged</Badge>
          <Badge tone="gold">{state.guild.legacy} legacy</Badge>
        </div>
      </header>

      <Tabs
        active={tab}
        onChange={setTab}
        items={[
          { id: 'timeline', label: 'Timeline', icon: '▤' },
          { id: 'eras', label: 'Era summaries', icon: '◷' },
        ]}
      />

      {tab === 'timeline' ? (
        <>
          <div className="filter-bar">
            <label>
              Event type
              <select value={type} onChange={(event) => setType(event.target.value)}>
                {eventTypes.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              Year
              <select value={year} onChange={(event) => setYear(event.target.value)}>
                <option>All</option>
                {years.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="filter-search">
              Search
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Hero, mission, rival…" />
            </label>
          </div>
          <div className="chronicle-layout">
            <div className="chronicle-timeline">
              {filtered.map((event) => {
                const reportRef = event.missionRecordId
                  ? { kind: 'mission', id: event.missionRecordId }
                  : event.tournamentRecordId
                    ? { kind: 'tournament', id: event.tournamentRecordId }
                    : null;
                const content = (
                  <>
                    <div className="chronicle-event__top">
                      <time>{event.date}</time>
                      <Badge
                        tone={
                          event.importance >= 4
                            ? 'gold'
                            : event.type === 'death' || event.type === 'defeat'
                              ? 'red'
                              : event.type === 'victory' || event.type === 'promotion'
                                ? 'green'
                                : 'neutral'
                        }
                      >
                        {event.type}
                      </Badge>
                    </div>
                    <h3>{event.title}</h3>
                    <p>{event.text}</p>
                    {event.tags?.length ? (
                      <div className="tag-row">
                        {event.tags.slice(0, 4).map((tag) => (
                          <span key={`${event.id}-${tag}`}>{tag}</span>
                        ))}
                      </div>
                    ) : null}
                    {reportRef ? <small className="chronicle-event__open">Open complete report ›</small> : null}
                  </>
                );
                return (
                  <article className={`chronicle-event chronicle-event--${event.importance} ${reportRef ? 'is-clickable' : ''}`} key={event.id}>
                    <div className="chronicle-event__rail">
                      <span>{event.month + 1}</span>
                      <i />
                    </div>
                    {reportRef ? (
                      <button className="chronicle-event__content" onClick={() => actions.openReport(reportRef)}>
                        {content}
                      </button>
                    ) : (
                      <div className="chronicle-event__content">{content}</div>
                    )}
                  </article>
                );
              })}
              {!filtered.length ? <EmptyState icon="▤" title="No event matches" text="Change the filters to return to the written record." /> : null}
            </div>
            <aside className="chronicle-sidebar">
              <Panel title="Founding generation" eyebrow="The Broken Lantern">
                <div className="founder-portraits">
                  {state.heroes
                    .filter((hero) => hero.joinedYear === 1187)
                    .slice(0, 5)
                    .map((hero) => (
                      <button key={hero.id} onClick={() => actions.openHero(hero.id)}>
                        <HeroPortrait hero={hero} size="sm" />
                        <strong>{hero.name}</strong>
                        <small>{hero.id === state.guild.founderHeroId ? 'Founder' : hero.status}</small>
                      </button>
                    ))}
                </div>
              </Panel>
              <Panel title="How to read history" eyebrow="Responsive records" tone="dark">
                <ul className="insight-list">
                  <li>Click any mission or tournament result in the timeline.</li>
                  <li>Reports preserve the exact company arrangement and each role.</li>
                  <li>Odds and rolls remain visible so results never feel arbitrary.</li>
                  <li>Hero careers link back to the events that created wounds and renown.</li>
                </ul>
              </Panel>
            </aside>
          </div>
        </>
      ) : null}

      {tab === 'eras' ? (
        <Panel title="Era summaries" eyebrow="A history that can be skimmed">
          <div className="era-grid">
            {years.map((item) => {
              const events = state.chronicle.filter((event) => event.year === item);
              const major = events.filter((event) => event.importance >= 3);
              return (
                <article key={item}>
                  <span className="era-year">{item}</span>
                  <h3>{major[0]?.title || `${state.guild.name} continues`}</h3>
                  <p>{major[0]?.text || `${events.length} events were recorded during a quieter year.`}</p>
                  <div>
                    <Badge tone="blue">{events.length} events</Badge>
                    <Badge tone="gold">{major.length} major</Badge>
                  </div>
                </article>
              );
            })}
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
