import React, { useMemo, useState } from 'react';
import { getHeroRankings } from '../game/engine.js';
import { Badge, EmptyState, HeroPortrait, Panel, Tabs } from '../components/UI.jsx';

export default function ChronicleScreen({ state, actions }) {
  const [tab, setTab] = useState('timeline');
  const [type, setType] = useState('All');
  const [search, setSearch] = useState('');
  const [year, setYear] = useState('All');
  const years = [...new Set(state.chronicle.map((event) => event.year))].sort((a, b) => b - a);
  const heroRankings = useMemo(() => getHeroRankings(state).slice(0, 12), [state]);
  const filtered = useMemo(() => state.chronicle.filter((event) => (
    (type === 'All' || event.type === type) &&
    (year === 'All' || event.year === Number(year)) &&
    (!search || `${event.title} ${event.text}`.toLowerCase().includes(search.toLowerCase()))
  )), [state.chronicle, type, year, search]);
  const eventTypes = ['All', ...new Set(state.chronicle.map((event) => event.type))];
  const reports = useMemo(() => [
    ...(state.missionHistory || []).map((record) => ({ ...record, reportKind: 'mission', sortYear: record.completedYear, sortMonth: record.completedMonth })),
    ...(state.tournamentHistory || []).map((record) => ({ ...record, reportKind: 'tournament', sortYear: record.year, sortMonth: 8 })),
  ].sort((a, b) => b.sortYear - a.sortYear || b.sortMonth - a.sortMonth), [state.missionHistory, state.tournamentHistory]);

  return (
    <div className="screen screen--chronicle">
      <header className="screen-heading">
        <div><span className="eyebrow">Nothing important disappears</span><h1>The Guild Chronicle</h1><p>Every completed mission and tournament stores its formation, participants, odds, choices, rewards, wounds and final result.</p></div>
        <div className="heading-metrics"><Badge tone="purple">{state.chronicle.length} events</Badge><Badge tone="blue">{reports.length} full reports</Badge><Badge tone="gold">{state.guild.legacy} legacy</Badge></div>
      </header>

      <Tabs active={tab} onChange={setTab} items={[
        { id: 'timeline', label: 'Timeline', icon: '▤' },
        { id: 'reports', label: 'Mission archive', icon: '⌖' },
        { id: 'eras', label: 'Era summaries', icon: '◷' },
        { id: 'hall', label: 'Hall of fame', icon: '♛' },
        { id: 'records', label: 'Records', icon: '✦' },
      ]} />

      {tab === 'timeline' ? (
        <>
          <div className="filter-bar">
            <label>Event type<select value={type} onChange={(event) => setType(event.target.value)}>{eventTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>Year<select value={year} onChange={(event) => setYear(event.target.value)}><option>All</option>{years.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="filter-search">Search<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Hero, mission, rival…" /></label>
          </div>
          <div className="chronicle-layout">
            <div className="chronicle-timeline">
              {filtered.map((event) => {
                const reportRef = event.missionRecordId ? { kind: 'mission', id: event.missionRecordId } : event.tournamentRecordId ? { kind: 'tournament', id: event.tournamentRecordId } : null;
                const content = <><div className="chronicle-event__top"><time>{event.date}</time><Badge tone={event.importance >= 4 ? 'gold' : event.type === 'death' || event.type === 'defeat' ? 'red' : event.type === 'victory' || event.type === 'promotion' ? 'green' : 'neutral'}>{event.type}</Badge></div><h3>{event.title}</h3><p>{event.text}</p>{event.tags?.length ? <div className="tag-row">{event.tags.slice(0, 4).map((tag) => <span key={`${event.id}-${tag}`}>{tag}</span>)}</div> : null}{reportRef ? <small className="chronicle-event__open">Open complete report ›</small> : null}</>;
                return <article className={`chronicle-event chronicle-event--${event.importance} ${reportRef ? 'is-clickable' : ''}`} key={event.id}><div className="chronicle-event__rail"><span>{event.month + 1}</span><i /></div>{reportRef ? <button className="chronicle-event__content" onClick={() => actions.openReport(reportRef)}>{content}</button> : <div className="chronicle-event__content">{content}</div>}</article>;
              })}
              {!filtered.length ? <EmptyState icon="▤" title="No event matches" text="Change the filters to return to the written record." /> : null}
            </div>
            <aside className="chronicle-sidebar">
              <Panel title="Founding generation" eyebrow="The Broken Lantern"><div className="founder-portraits">{state.heroes.filter((hero) => hero.joinedYear === 1187).slice(0, 5).map((hero) => <button key={hero.id} onClick={() => actions.openHero(hero.id)}><HeroPortrait hero={hero} size="sm" /><strong>{hero.name}</strong><small>{hero.id === state.guild.founderHeroId ? 'Founder' : hero.status}</small></button>)}</div></Panel>
              <Panel title="How to read history" eyebrow="Responsive records" tone="dark"><ul className="insight-list"><li>Click any mission or tournament result in the timeline.</li><li>Reports preserve the exact company arrangement and each role.</li><li>Odds and rolls remain visible so results never feel arbitrary.</li><li>Hero careers link back to the events that created wounds and renown.</li></ul></Panel>
            </aside>
          </div>
        </>
      ) : null}

      {tab === 'reports' ? (
        <Panel title="Complete field reports" eyebrow="Missions and tournaments">
          <div className="report-archive">
            {reports.map((report) => {
              const isMission = report.reportKind === 'mission';
              return <button key={report.id} onClick={() => actions.openReport({ kind: report.reportKind, id: report.id })}><span className={`report-archive__seal report-archive__seal--${isMission ? report.grade?.toLowerCase().replace(' ', '-') : report.champion ? 'legendary' : 'partial'}`}>{isMission ? report.grade === 'Legendary' ? '✦' : report.grade === 'Catastrophic' ? '!' : '◆' : report.champion ? '♛' : '⚔'}</span><div><small>{isMission ? report.completedDate : `Year ${report.year} · ${report.division}`}</small><h3>{report.title}</h3><p>{isMission ? `${report.family} · ${report.formationType} · ${report.team.length} heroes` : `${report.division} circuit · ${report.team.length} heroes · ${report.bracket.length} bouts`}</p><div className="tag-row"><span>{isMission ? report.grade : report.champion ? 'Champion' : `Top ${report.finish}`}</span><span>{isMission ? `${report.reward} crowns` : `${report.reward} prize`}</span><span>{isMission ? `${report.fame >= 0 ? '+' : ''}${report.fame} fame` : `+${report.fame} fame`}</span></div></div><i>Open ›</i></button>;
            })}
            {!reports.length ? <EmptyState icon="⌖" title="No field report exists yet" text="Complete the first mission and its full report will remain here permanently." /> : null}
          </div>
        </Panel>
      ) : null}

      {tab === 'eras' ? <Panel title="Era summaries" eyebrow="A history that can be skimmed"><div className="era-grid">{years.map((item) => { const events = state.chronicle.filter((event) => event.year === item); const major = events.filter((event) => event.importance >= 3); return <article key={item}><span className="era-year">{item}</span><h3>{major[0]?.title || `${state.guild.name} continues`}</h3><p>{major[0]?.text || `${events.length} events were recorded during a quieter year.`}</p><div><Badge tone="blue">{events.length} events</Badge><Badge tone="gold">{major.length} major</Badge></div></article>; })}</div></Panel> : null}

      {tab === 'hall' ? <Panel title="Hall of fame" eyebrow="The careers people argue about"><div className="hall-of-fame">{heroRankings.map((hero, index) => <button key={hero.id} onClick={() => actions.openHero(hero.id)} className={index < 3 ? `podium podium--${index + 1}` : ''}><span className="hall-of-fame__rank">{index + 1}</span><HeroPortrait hero={hero} size={index < 3 ? 'md' : 'sm'} /><div><h3>{hero.name}</h3><p>{hero.classId} · Peak {hero.career?.peakPower || hero.power}</p><small>{hero.career?.missions || 0} missions · {hero.career?.titles || 0} titles · {hero.career?.legendary || 0} legendary deeds</small></div><strong>{hero.historicalScore}</strong></button>)}{!heroRankings.length ? <EmptyState icon="♛" title="No career has separated from the age" text="Complete missions, tournaments and sagas to create genuine historical arguments." /> : null}</div></Panel> : null}

      {tab === 'records' ? <div className="record-book">{[
        ['Most missions', [...state.heroes, ...state.historicHeroes].sort((a, b) => (b.career?.missions || 0) - (a.career?.missions || 0))[0], 'missions'],
        ['Most titles', [...state.heroes, ...state.historicHeroes].sort((a, b) => (b.career?.titles || 0) - (a.career?.titles || 0))[0], 'titles'],
        ['Most legendary results', [...state.heroes, ...state.historicHeroes].sort((a, b) => (b.career?.legendary || 0) - (a.career?.legendary || 0))[0], 'legendary'],
        ['Highest peak power', [...state.heroes, ...state.historicHeroes].sort((a, b) => (b.career?.peakPower || b.power || 0) - (a.career?.peakPower || a.power || 0))[0], 'peakPower'],
        ['Greatest legacy', [...state.heroes, ...state.historicHeroes].sort((a, b) => b.legacy - a.legacy)[0], 'legacy'],
        ['Longest service', [...state.heroes, ...state.historicHeroes].sort((a, b) => (b.career?.serviceYears || 0) - (a.career?.serviceYears || 0))[0], 'serviceYears'],
      ].map(([label, hero, metric]) => <Panel key={label} title={label} eyebrow="Guild record">{hero ? <button className="record-holder" onClick={() => actions.openHero(hero.id)}><HeroPortrait hero={hero} size="md" /><div><h3>{hero.name}</h3><p>{hero.classId} · {hero.status}</p></div><strong>{metric === 'legacy' ? hero.legacy : metric === 'peakPower' ? hero.career?.peakPower || hero.power : hero.career?.[metric] || 0}</strong></button> : <p className="muted">No qualifying record.</p>}</Panel>)}</div> : null}
    </div>
  );
}
