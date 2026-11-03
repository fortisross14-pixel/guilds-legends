import React, { useMemo, useState } from 'react';
import { TIERS } from '../data/content.js';
import {
  LADDERS,
  LADDER_LABELS,
  getGuildLadder,
  getGuildStar,
  getHeroLadder,
  getHeroRankings,
  getPlayerRanks,
  getPointsToPass,
  getRankMovement,
  getStatusTitle,
  specializationTitle,
} from '../game/engine.js';
import { NemesisView, ReputationView } from './RivalryScreens.jsx';
import { Badge, Button, HeroPortrait, Panel, PrimalBadge, RankChange, RarityBadge, Sparkline, Tabs } from '../components/UI.jsx';

const LADDER_COPY = {
  strength: 'Current power: the average of each guild’s top five heroes. Moves fast.',
  legacy: 'All-time points from completed missions (difficulty × grade) and titles. Never decays.',
  official: 'Tournament points from the last 12 months. Decides status titles and promotion.',
};

function LadderPicker({ ladder, setLadder }) {
  return (
    <div className="ladder-picker" role="tablist">
      {LADDERS.map((id) => (
        <button key={id} role="tab" aria-selected={ladder === id} className={ladder === id ? 'is-selected' : ''} onClick={() => setLadder(id)}>
          {LADDER_LABELS[id]}
        </button>
      ))}
    </div>
  );
}

function GuildLadders({ state, actions }) {
  const [scope, setScope] = useState(TIERS[state.guild.tierIndex]?.id || 'Regional');
  const [ladder, setLadder] = useState('official');
  const rows = useMemo(() => getGuildLadder(state, ladder, scope), [state, ladder, scope]);
  const ranks = useMemo(() => getPlayerRanks(state, scope), [state, scope]);
  const movement = useMemo(() => getRankMovement(state), [state]);
  const toPass = useMemo(() => getPointsToPass(state, ladder, scope), [state, ladder, scope]);
  const playerStar = getGuildStar(state);
  const history = (state.rankHistory || []).map((entry) => -entry[ladder]);
  const unit = ladder === 'strength' ? 'power' : 'pts';
  return (
    <div className="ladder-view">
      <div className="status-banner">
        <span className="eyebrow">Status</span>
        <strong className="status-banner__title">{getStatusTitle(state)}</strong>
        {specializationTitle(state) ? <Badge tone="purple">{specializationTitle(state)}</Badge> : null}
        <div className="status-banner__ranks">
          {LADDERS.map((id) => (
            <span key={id}>
              {LADDER_LABELS[id]} <b>#{ranks[id].rank}</b>
              <small>/{ranks[id].total}</small> <RankChange change={movement[id]} />
            </span>
          ))}
        </div>
      </div>
      <LadderPicker ladder={ladder} setLadder={setLadder} />
      <div className="scope-picker">
        {['Regional', 'National', 'Global'].map((item) => (
          <button key={item} className={scope === item ? 'is-selected' : ''} onClick={() => setScope(item)}>
            {item}
          </button>
        ))}
      </div>
      <Panel
        title={`${scope} · ${LADDER_LABELS[ladder]} ladder`}
        eyebrow={LADDER_COPY[ladder]}
        action={history.length > 1 ? <Sparkline values={history} label="Your rank history" /> : null}
      >
        {toPass ? (
          <p className="points-to-pass">
            {toPass.gap} {unit} to pass {toPass.name} (#{toPass.rank})
          </p>
        ) : (
          <p className="points-to-pass">You lead this ladder.</p>
        )}
        <div className="ladder-table">
          <div className="ladder-row ladder-row--head" aria-hidden="true">
            <span>#</span>
            <span>Guild</span>
            <span>Star</span>
            <span>{unit === 'power' ? 'Power' : 'Points'}</span>
          </div>
          {rows.map((guild) => (
            <article key={guild.id} className={`ladder-row ${guild.player ? 'is-player' : ''}`}>
              <span className="ranking-position">{guild.rank}</span>
              <div className="ladder-row__name">
                <strong>{guild.name}</strong>
                <small>
                  {TIERS[guild.tierIndex]?.id} · {guild.rosterSize} heroes · {guild.titles} titles
                </small>
              </div>
              {guild.player ? (
                <div className="ranking-star">
                  {playerStar ? <HeroPortrait hero={playerStar} size="xs" /> : null}
                  <span>{playerStar?.name || 'No active hero'}</span>
                </div>
              ) : guild.star ? (
                <button className="ranking-star" onClick={() => actions.openHero(guild.star.id)}>
                  <HeroPortrait hero={guild.star} size="xs" />
                  <span>{guild.star.name}</span>
                </button>
              ) : (
                <span />
              )}
              <strong className="ladder-row__value">
                {guild.value.toLocaleString()} <small>{unit}</small>
              </strong>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function HeroLadders({ state, actions }) {
  const [ladder, setLadder] = useState('official');
  const rows = useMemo(() => getHeroLadder(state, ladder).slice(0, 60), [state, ladder]);
  const unit = ladder === 'strength' ? 'power' : 'pts';
  return (
    <div className="ladder-view">
      <LadderPicker ladder={ladder} setLadder={setLadder} />
      <Panel title={`Hero ${LADDER_LABELS[ladder]} ladder`} eyebrow={LADDER_COPY[ladder].replace('each guild’s top five heroes', 'hero power')}>
        <div className="ladder-table" data-menu>
          {rows.map((hero) => (
            <button key={hero.id} className={`ladder-row ${hero.player ? 'is-player' : ''}`} onClick={() => actions.openHero(hero.id)}>
              <span className="ranking-position">{hero.rank}</span>
              <HeroPortrait hero={hero} size="xs" />
              <div className="ladder-row__name">
                <strong>{hero.name}</strong>
                <small>
                  Lv {hero.level} {hero.classId} · {hero.guildName}
                </small>
              </div>
              <strong className="ladder-row__value">
                {hero.value.toLocaleString()} <small>{unit}</small>
              </strong>
            </button>
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

function GuildDirectory({ state, actions, onOpenRival }) {
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
      <Panel
        title={guild.name}
        eyebrow={`${guild.archetype} · Founded ${guild.founded}`}
        action={
          <Button size="sm" onClick={() => onOpenRival(guild.id)}>
            Rivalry ⚔
          </Button>
        }
      >
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
  const [tab, setTab] = useState(state.challenge?.status === 'pending' ? 'rivals' : 'guilds');
  const [rivalFocus, setRivalFocus] = useState(null);
  const openRival = (id) => {
    setRivalFocus(id);
    setTab('rivals');
  };
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
          <h1>The Herald</h1>
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
          { id: 'heroLadders', label: 'Hero ladders', icon: '♟' },
          { id: 'heroes', label: 'All-time greats', icon: '✦' },
          { id: 'tournaments', label: 'Tournament legends', icon: '♛' },
          { id: 'reputation', label: 'Reputation', icon: '❖' },
          { id: 'rivals', label: 'Rivals & nemeses', icon: '⚔' },
          { id: 'directory', label: 'Guild directory', icon: '▤' },
          { id: 'artifacts', label: 'Artifacts', icon: '◈' },
        ]}
      />
      {tab === 'guilds' ? <GuildLadders state={state} actions={actions} /> : null}
      {tab === 'heroLadders' ? <HeroLadders state={state} actions={actions} /> : null}
      {tab === 'reputation' ? <ReputationView state={state} /> : null}
      {tab === 'rivals' ? <NemesisView state={state} actions={actions} initialRivalId={rivalFocus} /> : null}
      {tab === 'heroes' ? <HeroGoat state={state} actions={actions} /> : null}
      {tab === 'tournaments' ? <TournamentLegends state={state} actions={actions} /> : null}
      {tab === 'directory' ? <GuildDirectory state={state} actions={actions} onOpenRival={openRival} /> : null}
      {tab === 'artifacts' ? <ArtifactAlmanac state={state} actions={actions} /> : null}
    </div>
  );
}
