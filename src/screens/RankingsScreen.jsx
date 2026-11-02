import React, { useMemo, useState } from 'react';
import { TIERS } from '../data/content.js';
import { getGuildRankings, getGuildRankSummary, getGuildStar, getHeroRankings } from '../game/engine.js';
import { Badge, HeroPortrait, Panel, PrimalBadge, ProgressBar, RarityBadge, Tabs } from '../components/UI.jsx';

const SCOPE_COPY = {
  Regional: 'All recognized companies in the opening districts.',
  National: 'Regional challengers measured against kingdom-level institutions.',
  Global: 'Every known banner, from Dunmere to the Far Veil.',
};

function GuildLadders({ state, actions }) {
  const [scope, setScope] = useState('Regional');
  const rows = useMemo(() => getGuildRankings(state, scope), [state, scope]);
  const summary = useMemo(() => getGuildRankSummary(state), [state]);
  const player = rows.find((row) => row.player);
  const playerStar = getGuildStar(state);
  return (
    <div className="ladder-view">
      <div className="scope-cards">
        {summary.map((item) => (
          <button key={item.scope} className={scope === item.scope ? 'is-selected' : ''} onClick={() => setScope(item.scope)}>
            <small>{item.scope} rank</small>
            <strong>#{item.rank}</strong>
            <span>of {item.total} guilds</span>
            <ProgressBar
              value={item.total - item.rank + 1}
              max={item.total}
              tone={item.scope === 'Regional' ? 'green' : item.scope === 'National' ? 'gold' : 'purple'}
              compact
            />
          </button>
        ))}
      </div>
      <Panel title={`${scope} guild ranking`} eyebrow={SCOPE_COPY[scope]} action={<Badge tone="gold">Your score {player?.score || 0}</Badge>}>
        <div className="universe-ranking-table">
          <div className="universe-ranking-table__head">
            <span>#</span>
            <span>Guild</span>
            <span>Star</span>
            <span>Fame</span>
            <span>Titles</span>
            <span>Score</span>
          </div>
          {rows.map((guild) => (
            <article key={guild.id} className={guild.player ? 'is-player' : ''}>
              <span className="ranking-position">{guild.rank}</span>
              <div className="ranking-identity">
                <i style={{ background: guild.player ? '#c89a4b' : guild.color }} />
                <div>
                  <strong>{guild.name}</strong>
                  <small>{guild.player ? state.guild.motto : `${guild.archetype} · ${TIERS[guild.tierIndex]?.id}`}</small>
                </div>
              </div>
              {guild.player ? (
                <div className="ranking-star">
                  {playerStar ? <HeroPortrait hero={playerStar} size="xs" /> : null}
                  <span>
                    <strong>{playerStar?.name || 'No active hero'}</strong>
                    <small>{guild.rosterSize} active heroes</small>
                  </span>
                </div>
              ) : (
                <button className="ranking-star" onClick={() => actions.openHero(guild.star.id)}>
                  <HeroPortrait hero={guild.star} size="xs" />
                  <span>
                    <strong>{guild.star.name}</strong>
                    <small>
                      {guild.star.rarity} · Lv {guild.star.level}
                    </small>
                  </span>
                </button>
              )}
              <strong>{guild.fame}</strong>
              <strong>{guild.titles}</strong>
              <strong className="historical-score">{guild.score}</strong>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function HeroGoat({ state, actions }) {
  const [filter, setFilter] = useState('All');
  const heroes = useMemo(() => getHeroRankings(state), [state]);
  const visible = heroes.filter(
    (hero) =>
      filter === 'All' ||
      (filter === 'Active' && !['retired', 'dead'].includes(hero.status)) ||
      (filter === 'Legends' && (hero.career?.titles || 0) >= 3) ||
      (filter === 'My Guild' && hero.player),
  );
  const playerBest = heroes.find((hero) => hero.player);
  return (
    <div className="goat-view">
      <div className="goat-summary">
        <div>
          <small>Your highest-ranked hero</small>
          <strong>#{playerBest?.historicalRank || '—'}</strong>
          <span>{playerBest?.name || 'No ranked career yet'}</span>
        </div>
        <div>
          <small>Universe careers</small>
          <strong>{heroes.length}</strong>
          <span>Active, retired and historical</span>
        </div>
        <div>
          <small>Highest score</small>
          <strong>{heroes[0]?.historicalScore || 0}</strong>
          <span>{heroes[0]?.name}</span>
        </div>
      </div>
      <div className="filter-pills">
        {['All', 'Active', 'Legends', 'My Guild'].map((item) => (
          <button key={item} className={filter === item ? 'is-selected' : ''} onClick={() => setFilter(item)}>
            {item}
          </button>
        ))}
      </div>
      <Panel
        title="Greatest hero careers"
        eyebrow="Major deeds 25% · tournaments 20% · quests 15% · peak 15% · longevity 10% · leadership 10% · cultural influence 5%"
      >
        <div className="universe-hero-ranking">
          {visible.slice(0, 180).map((hero) => (
            <button key={hero.id} className={hero.player ? 'is-player' : ''} onClick={() => actions.openHero(hero.id)}>
              <span className="ranking-position">{hero.historicalRank}</span>
              <HeroPortrait hero={hero} size="xs" />
              <div className="universe-hero-ranking__identity">
                <strong>{hero.name}</strong>
                <small>
                  {hero.guildName} · {hero.classId} · {hero.status}
                </small>
                <span>
                  <RarityBadge rarity={hero.rarity} />
                  <PrimalBadge primal={hero.primal} compact />
                </span>
              </div>
              <span>
                <small>Titles</small>
                <b>{hero.career?.titles || 0}</b>
              </span>
              <span>
                <small>Bout wins</small>
                <b>{hero.career?.tournamentBoutWins || 0}</b>
              </span>
              <span>
                <small>Prize</small>
                <b>{(hero.career?.prizeMoney || 0).toLocaleString()}</b>
              </span>
              <span>
                <small>Peak</small>
                <b>{hero.career?.peakPower || hero.power}</b>
              </span>
              <strong className="historical-score">{hero.historicalScore}</strong>
            </button>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function TournamentLegends({ state, actions }) {
  const heroes = useMemo(() => getHeroRankings(state), [state]);
  const titleKings = [...heroes]
    .sort((a, b) => (b.career?.individualTitles || 0) - (a.career?.individualTitles || 0) || (b.career?.prizeMoney || 0) - (a.career?.prizeMoney || 0))
    .slice(0, 12);
  const prizeLeaders = [...heroes].sort((a, b) => (b.career?.prizeMoney || 0) - (a.career?.prizeMoney || 0)).slice(0, 12);
  const records = Object.values(state.titleRecords || {});
  return (
    <div className="tournament-almanac-grid">
      <Panel title="Most individual titles" eyebrow="Repeat champions define an era">
        <div className="leader-list">
          {titleKings.map((hero, index) => (
            <button key={hero.id} onClick={() => actions.openHero(hero.id)}>
              <span>{index + 1}</span>
              <HeroPortrait hero={hero} size="xs" />
              <div>
                <strong>{hero.name}</strong>
                <small>{hero.guildName}</small>
              </div>
              <b>{hero.career?.individualTitles || 0}</b>
            </button>
          ))}
        </div>
      </Panel>
      <Panel title="Career prize money" eyebrow="Tournament earnings">
        <div className="leader-list">
          {prizeLeaders.map((hero, index) => (
            <button key={hero.id} onClick={() => actions.openHero(hero.id)}>
              <span>{index + 1}</span>
              <HeroPortrait hero={hero} size="xs" />
              <div>
                <strong>{hero.name}</strong>
                <small>{hero.career?.titles || 0} titles</small>
              </div>
              <b>{(hero.career?.prizeMoney || 0).toLocaleString()} ◈</b>
            </button>
          ))}
        </div>
      </Panel>
      <Panel title="Records to chase" eyebrow="Win one tournament enough times to own its history" className="records-to-chase">
        <div className="record-chase-grid">
          {records.map((record) => (
            <article key={record.id}>
              <small>
                {record.circuit} · {record.kind}
              </small>
              <strong>{record.name}</strong>
              <p>
                <b>{record.recordHolderName}</b> holds the record with <em>{record.recordWins}</em> wins.
              </p>
              <span>
                Your best:{' '}
                {record.kind === 'individual'
                  ? Math.max(0, ...state.heroes.map((hero) => hero.career?.titleWins?.[record.id] || 0))
                  : record.winsByGuild?.player || 0}
              </span>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function ArtifactAlmanac({ state, actions }) {
  const all = [
    ...(state.artifacts || []).map((artifact) => ({ ...artifact, player: true })),
    ...(state.worldArtifacts || []).map((artifact) => ({ ...artifact, player: false })),
  ].sort((a, b) => b.prestige - a.prestige);
  return (
    <Panel title="Artifacts of the known world" eyebrow="Ownership contributes to historical greatness">
      <div className="world-artifact-grid">
        {all.map((artifact) => {
          const owner = [
            ...state.heroes,
            ...state.historicHeroes,
            ...state.rivals.flatMap((guild) => [guild.star, ...(guild.members || [])]),
            ...(state.worldHistoricHeroes || []),
          ].find((hero) => hero.id === artifact.ownerId);
          const guild = artifact.player ? state.guild.name : state.rivals.find((item) => item.id === artifact.ownerGuildId)?.name;
          return (
            <article key={artifact.id} className={artifact.player ? 'is-player' : ''}>
              <span>◈</span>
              <div>
                <small>Prestige {artifact.prestige}</small>
                <h3>{artifact.name}</h3>
                <p>{artifact.legend}</p>
                <button disabled={!owner} onClick={() => owner && actions.openHero(owner.id)}>
                  {owner ? `${owner.name} · ${guild || 'Open circuit'}` : 'Guild vault'}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </Panel>
  );
}

function GuildDirectory({ state, actions }) {
  const [guildId, setGuildId] = useState(state.rivals[0]?.id || '');
  const guild = state.rivals.find((item) => item.id === guildId) || state.rivals[0];
  if (!guild) return null;
  const roster = [guild.star, ...(guild.members || [])];
  return (
    <div className="guild-directory">
      <aside>
        {state.rivals.map((item) => (
          <button key={item.id} className={item.id === guild.id ? 'is-selected' : ''} onClick={() => setGuildId(item.id)}>
            <i style={{ background: item.color }} />
            <div>
              <strong>{item.name}</strong>
              <small>
                {TIERS[item.tierIndex]?.id} · {item.titles} titles
              </small>
            </div>
            <span>{item.power}</span>
          </button>
        ))}
      </aside>
      <Panel title={guild.name} eyebrow={`${guild.archetype} · Founded ${guild.founded}`} action={<Badge tone="gold">{guild.titles} titles</Badge>}>
        <div className="directory-banner" style={{ '--guild-color': guild.color }}>
          <blockquote>“{guild.motto}”</blockquote>
          <div>
            <span>
              Fame <b>{guild.fame}</b>
            </span>
            <span>
              Legacy <b>{guild.legacy}</b>
            </span>
            <span>
              Prize money <b>{guild.prizeMoney.toLocaleString()}</b>
            </span>
            <span>
              Power <b>{guild.power}</b>
            </span>
          </div>
        </div>
        <div className="directory-roster">
          {roster.map((hero, index) => (
            <button key={hero.id} onClick={() => actions.openHero(hero.id)}>
              <HeroPortrait hero={hero} size="sm" />
              <div>
                <small>{index === 0 ? 'Guild star' : 'Company member'}</small>
                <strong>{hero.name}</strong>
                <span>
                  {hero.rarity} · Lv {hero.level} · {hero.classId}
                </span>
              </div>
              <PrimalBadge primal={hero.primal} compact />
              <b>{hero.power}</b>
            </button>
          ))}
        </div>
      </Panel>
    </div>
  );
}

export default function RankingsScreen({ state, actions }) {
  const [tab, setTab] = useState('guilds');
  const heroCount =
    state.rivals.reduce((sum, guild) => sum + 1 + guild.members.length, 0) +
    (state.freeAgents?.length || 0) +
    (state.worldHistoricHeroes?.length || 0) +
    state.heroes.length;
  return (
    <div className="screen screen--rankings">
      <header className="screen-heading">
        <div>
          <span className="eyebrow">The world existed before you—and keeps moving without you</span>
          <h1>Universe Almanac</h1>
          <p>Compare your young banner to regional companies, national powers, global institutions and generations of champions.</p>
        </div>
        <div className="heading-metrics">
          <Badge tone="gold">{state.rivals.length + 1} guilds</Badge>
          <Badge tone="purple">{heroCount} simulated heroes</Badge>
          <Badge tone="blue">{state.universeStats?.boutsResolved || 0} recorded bouts</Badge>
        </div>
      </header>
      <Tabs
        active={tab}
        onChange={setTab}
        items={[
          { id: 'guilds', label: 'Guild ladders', icon: '⚑' },
          { id: 'heroes', label: 'Hero GOAT', icon: '✦' },
          { id: 'tournaments', label: 'Tournament legends', icon: '♛' },
          { id: 'directory', label: 'Guild directory', icon: '▤' },
          { id: 'artifacts', label: 'Artifacts', icon: '◈' },
        ]}
      />
      {tab === 'guilds' ? <GuildLadders state={state} actions={actions} /> : null}
      {tab === 'heroes' ? <HeroGoat state={state} actions={actions} /> : null}
      {tab === 'tournaments' ? <TournamentLegends state={state} actions={actions} /> : null}
      {tab === 'directory' ? <GuildDirectory state={state} actions={actions} /> : null}
      {tab === 'artifacts' ? <ArtifactAlmanac state={state} actions={actions} /> : null}
    </div>
  );
}
