import React, { useMemo, useState } from 'react';
import { TIERS } from '../data/content.js';
import { getGuildRankings, getHeroRankings } from '../game/engine.js';
import { Badge, HeroPortrait, Panel, ProgressBar, Tabs } from '../components/UI.jsx';

export default function RankingsScreen({ state, actions }) {
  const [tab, setTab] = useState('guilds');
  const guilds = useMemo(() => getGuildRankings(state), [state]);
  const heroes = useMemo(() => getHeroRankings(state), [state]);
  const titleRace = useMemo(() => [...state.heroes].filter((hero) => !['dead', 'retired'].includes(hero.status)).sort((a, b) => (b.power + b.form * 0.2 + b.renown * 0.12) - (a.power + a.form * 0.2 + a.renown * 0.12)).slice(0, 8), [state.heroes]);

  return (
    <div className="screen screen--rankings">
      <header className="screen-heading">
        <div><span className="eyebrow">The argument of an era</span><h1>Rankings & Almanac</h1><p>The strongest hero is not automatically the greatest career. Titles, longevity, legendary deeds and historical context all matter.</p></div>
        <div className="heading-metrics"><Badge tone="gold">Guild rank #{state.guild.rank}</Badge><Badge tone="purple">{heroes.length} recorded careers</Badge></div>
      </header>

      <Tabs active={tab} onChange={setTab} items={[
        { id: 'guilds', label: 'Guild power ranking', icon: '⚑' },
        { id: 'heroes', label: 'Historical heroes', icon: '✦' },
        { id: 'races', label: 'Current title races', icon: '♛' },
        { id: 'artifacts', label: 'Artifacts', icon: '◈' },
      ]} />

      {tab === 'guilds' ? (
        <Panel title="Guild power ranking" eyebrow="Form, fame, tier and legacy">
          <div className="ranking-table">
            <div className="ranking-table__head"><span>Rank</span><span>Guild</span><span>Tier</span><span>Fame</span><span>Legacy</span><span>Form</span></div>
            {guilds.map((guild) => (
              <article key={guild.id} className={guild.player ? 'is-player' : ''}>
                <span className="ranking-position">{guild.rank}</span>
                <div className="ranking-identity"><i style={{ background: guild.player ? '#c89a4b' : state.rivals.find((rival) => rival.id === guild.id)?.color }} /><div><strong>{guild.name}</strong><small>{guild.player ? state.guild.motto : state.rivals.find((rival) => rival.id === guild.id)?.archetype}</small></div></div>
                <Badge tone={guild.player ? 'gold' : 'neutral'}>{TIERS[guild.tierIndex].id}</Badge>
                <strong>{guild.fame}</strong><strong>{guild.legacy}</strong><span>{Math.round(guild.form)}</span>
              </article>
            ))}
          </div>
          <p className="table-note">The ranking intentionally values social tier and sustained legacy more than one hot month. A fallen guild keeps historical prestige but loses practical access.</p>
        </Panel>
      ) : null}

      {tab === 'heroes' ? (
        <Panel title="Greatest careers" eyebrow="Historical score, not raw power">
          <div className="hero-ranking-list">
            {heroes.slice(0, 100).map((hero, index) => (
              <button key={hero.id} className={hero.guildId === 'player' || !hero.guildId ? 'is-player' : ''} onClick={() => actions.openHero(hero.id)}>
                <span className="ranking-position">{index + 1}</span><HeroPortrait hero={hero} size="xs" /><div className="hero-ranking-list__name"><strong>{hero.name}</strong><small>{hero.classId} · {hero.status}</small></div><span><small>Peak</small><b>{hero.career?.peakPower || hero.power}</b></span><span><small>Titles</small><b>{hero.career?.titles || 0}</b></span><span><small>Legendary</small><b>{hero.career?.legendary || 0}</b></span><span><small>Legacy</small><b>{hero.legacy}</b></span><strong className="historical-score">{hero.historicalScore}</strong>
              </button>
            ))}
          </div>
        </Panel>
      ) : null}

      {tab === 'races' ? (
        <div className="dashboard-grid dashboard-grid--races">
          <Panel title="Champion of the year" eyebrow="Form-weighted projection">
            <div className="race-list">
              {titleRace.map((hero, index) => {
                const score = hero.power + hero.form * 0.2 + hero.renown * 0.12;
                const max = titleRace[0] ? titleRace[0].power + titleRace[0].form * 0.2 + titleRace[0].renown * 0.12 : 100;
                return <button key={hero.id} onClick={() => actions.openHero(hero.id)}><span>{index + 1}</span><HeroPortrait hero={hero} size="xs" /><div><strong>{hero.name}</strong><small>{hero.classId} · Form {hero.form}</small><ProgressBar value={score} max={max} tone={index === 0 ? 'gold' : 'blue'} compact /></div><b>{Math.round(score)}</b></button>;
              })}
            </div>
          </Panel>
          <Panel title="Rival guilds to watch" eyebrow="Threat is more than rank">
            <div className="threat-list">{[...state.rivals].sort((a, b) => (b.hostility + b.form + b.power) - (a.hostility + a.form + a.power)).slice(0, 6).map((rival) => <article key={rival.id}><i style={{ background: rival.color }} /><div><strong>{rival.name}</strong><small>{rival.star.name} · PWR {rival.star.power}</small><ProgressBar value={rival.hostility} max={100} tone={rival.hostility >= 60 ? 'red' : 'purple'} compact /></div><Badge tone={rival.fallen ? 'red' : rival.hostility >= 60 ? 'red' : 'neutral'}>{rival.fallen ? 'Fallen' : `${rival.hostility} hostility`}</Badge></article>)}</div>
          </Panel>
        </div>
      ) : null}

      {tab === 'artifacts' ? (
        <Panel title="The guild vault" eyebrow="Ownership history and legend">
          {state.artifacts.length ? <div className="artifact-grid">{state.artifacts.map((artifact) => {
            const owner = state.heroes.find((hero) => hero.id === artifact.ownerId) || state.historicHeroes.find((hero) => hero.id === artifact.ownerId);
            return <article key={artifact.id}><span className="artifact-grid__icon">◈</span><div><span className="eyebrow">Recovered {artifact.discoveredYear}</span><h3>{artifact.name}</h3><p>{artifact.legend}</p><div className="artifact-grid__meta"><Badge tone="purple">Prestige {artifact.prestige}</Badge><span>{owner ? `Bearer: ${owner.name}` : 'Held in the guild vault'}</span></div></div></article>;
          })}</div> : <div className="empty-state"><span className="empty-state__icon">◈</span><h3>The vault is empty</h3><p>Legend quests and exceptional dungeon outcomes create named artifacts with permanent ownership histories.</p></div>}
        </Panel>
      ) : null}
    </div>
  );
}
