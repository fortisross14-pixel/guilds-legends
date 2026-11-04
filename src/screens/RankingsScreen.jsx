import React, { useMemo, useState } from 'react';
import { TIERS } from '../data/content.js';
import { statusName } from '../data/tournaments.js';
import { LADDERS, LADDER_LABELS, getGuildLadder, getHeroLadder, getHeroRankings, getPlayerRanks, getPointsToPass, getRankMovement, getStatusTitle } from '../game/engine.js';
import { Button, HeroPortrait, Panel, PrimalBadge, RankChange, toast } from '../components/UI.jsx';
import { HallOfFame, RecordBook } from './HistoryScreens.jsx';
import Icon, { LADDER_ICONS } from '../components/Icon.jsx';
import { useLongPress } from '../components/gestures.js';

const LADDER_COPY = {
  strength: 'Strength: the power of each guild’s top five heroes.',
  legacy: 'Legacy: all-time points from missions and titles.',
  official: 'Official: tournament points from the last 12 months.',
};

// One ladder button: tap to show it, long-press for what it measures.
function LadderButton({ id, selected, onSelect }) {
  const press = useLongPress(() => toast(LADDER_COPY[id]), () => onSelect(id));
  return (
    <button role="tab" aria-selected={selected} className={selected ? 'is-selected' : ''} title={LADDER_COPY[id]} {...press}>
      <Icon name={LADDER_ICONS[id]} size={16} tone="plain" /> {LADDER_LABELS[id]}
    </button>
  );
}

function LadderPicker({ ladder, setLadder }) {
  return (
    <div className="segmented" role="tablist" aria-label="Ladder">
      {LADDERS.map((id) => (
        <LadderButton key={id} id={id} selected={ladder === id} onSelect={setLadder} />
      ))}
    </div>
  );
}

/** The guild's three ranks and status, one line. */
function StatusLine({ state, scope }) {
  const ranks = getPlayerRanks(state, scope);
  const movement = getRankMovement(state);
  return (
    <div className="status-line">
      <strong>{getStatusTitle(state)}</strong>
      {LADDERS.map((id) => (
        <span key={id} className="num">
          <Icon name={LADDER_ICONS[id]} size={14} label={LADDER_LABELS[id]} /> #{ranks[id].rank}
          <small>/{ranks[id].total}</small> <RankChange change={movement[id]} />
        </span>
      ))}
    </div>
  );
}

function GuildLadders({ state, actions, ladder, scope }) {
  const rows = useMemo(() => getGuildLadder(state, ladder, scope), [state, ladder, scope]);
  const toPass = useMemo(() => getPointsToPass(state, ladder, scope), [state, ladder, scope]);
  const unit = ladder === 'strength' ? 'power' : 'pts';
  // The guild's own row is the focus: pinned on top when it ranks below fifth.
  const own = rows.find((guild) => guild.player);
  return (
    <>
      <p className="points-to-pass">{toPass ? `${toPass.gap} ${unit} to pass ${toPass.name} (#${toPass.rank})` : 'You lead this ladder.'}</p>
      {own && own.rank > 5 ? (
        <div className="ladder-row ladder-row--guild is-player ladder-row--own">
          <span className="ranking-position">{own.rank}</span>
          <span className="ladder-row__name">
            <strong>{own.name}</strong>
          </span>
          <strong className="ladder-row__value num">{own.value.toLocaleString()}</strong>
        </div>
      ) : null}
      <div className="ladder-table">
        {rows.map((guild) => (
          <button key={guild.id} type="button" className={`ladder-row ladder-row--guild ${guild.player ? "is-player" : ""}`} onClick={() => (!guild.player && guild.star ? actions.openHero(guild.star.id) : null)}>
            <span className="ranking-position">{guild.rank}</span>
            <span className="ladder-row__name">
              <strong>{guild.name}</strong>
            </span>
            <strong className="ladder-row__value num">
              {guild.value.toLocaleString()} <small>{unit}</small>
            </strong>
          </button>
        ))}
      </div>
    </>
  );
}

function HeroLadders({ state, actions, ladder }) {
  const rows = useMemo(() => getHeroLadder(state, ladder).slice(0, 60), [state, ladder]);
  const unit = ladder === 'strength' ? 'power' : 'pts';
  return (
    <div className="ladder-table" data-menu>
      {rows.map((hero) => (
        <button key={hero.id} className={`ladder-row ladder-row--hero ${hero.player ? 'is-player' : ''}`} onClick={() => actions.openHero(hero.id)}>
          <span className="ranking-position">{hero.rank}</span>
          <HeroPortrait hero={hero} size="xs" />
          <span className="ladder-row__name">
            <strong>{hero.name}</strong>
            <small>{hero.guildName}</small>
          </span>
          <strong className="ladder-row__value num">
            {hero.value.toLocaleString()} <small>{unit}</small>
          </strong>
        </button>
      ))}
    </div>
  );
}

/** Records → Rankings: the guild's ranks first, then one ladder (Guilds or Heroes). */
export default function RankingsScreen({ state, actions }) {
  const [who, setWho] = useState('guilds');
  const [ladder, setLadder] = useState('official');
  const [scope, setScope] = useState(TIERS[state.guild.tierIndex]?.id || 'Regional');
  return (
    <div className="screen screen--rankings">
      <StatusLine state={state} scope={scope} />
      <div className="rank-controls">
        <div className="segmented" role="tablist" aria-label="Show">
          {[
            ['guilds', 'Guilds'],
            ['heroes', 'Heroes'],
          ].map(([id, label]) => (
            <button key={id} role="tab" aria-selected={who === id} className={who === id ? 'is-selected' : ''} onClick={() => setWho(id)}>
              {label}
            </button>
          ))}
        </div>
        <LadderPicker ladder={ladder} setLadder={setLadder} />
        {who === 'guilds' && state.guild.tierIndex > 0 ? (
          <select aria-label="Scope" value={scope} onChange={(event) => setScope(event.target.value)}>
            {['Regional', 'National', 'Global'].map((item) => (
              <option key={item} value={item}>
                {statusName(item)}
              </option>
            ))}
          </select>
        ) : null}
      </div>
      {who === 'guilds' ? <GuildLadders state={state} actions={actions} ladder={ladder} scope={scope} /> : <HeroLadders state={state} actions={actions} ladder={ladder} />}
    </div>
  );
}

function TournamentLegends({ state, actions }) {
  const heroes = useMemo(() => getHeroRankings(state), [state]);
  const titleKings = [...heroes]
    .sort((a, b) => (b.career?.titles || 0) - (a.career?.titles || 0) || (b.career?.prizeMoney || 0) - (a.career?.prizeMoney || 0))
    .slice(0, 12);
  const prizeLeaders = [...heroes].sort((a, b) => (b.career?.prizeMoney || 0) - (a.career?.prizeMoney || 0)).slice(0, 12);
  const records = Object.values(state.titleRecords || {});
  return (
    <div className="tournament-almanac-grid">
      <Panel title="Most tournament titles" eyebrow="Heroes who fought on winning teams">
        <div className="leader-list">
          {titleKings.map((hero, index) => (
            <button key={hero.id} onClick={() => actions.openHero(hero.id)}>
              <span>{index + 1}</span>
              <HeroPortrait hero={hero} size="xs" />
              <div>
                <strong>{hero.name}</strong>
                <small>{hero.guildName}</small>
              </div>
              <b>{hero.career?.titles || 0}</b>
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
              <b>{(hero.career?.prizeMoney || 0).toLocaleString()} G</b>
            </button>
          ))}
        </div>
      </Panel>
      <Panel title="Records to chase" eyebrow="Win one tournament enough times to own its history" className="records-to-chase">
        <div className="record-chase-grid">
          {records.map((record) => (
            <article key={record.id}>
              <small>
                {record.circuit}
              </small>
              <strong>{record.name}</strong>
              <p>
                <b>{record.recordHolderName}</b> holds the record with <em>{record.recordWins}</em> wins.
              </p>
              <span>
                Your best:{' '}
                {record.winsByGuild?.player || 0}
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
              <span><Icon name="coin" size={16} tone="brass" /></span>
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

export function GuildDirectory({ state, actions, onOpenRival }) {
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
                {TIERS[item.tierIndex]?.name} · {item.titles} titles
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
            Rivalry <Icon name="swords" size={14} tone="plain" />
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


/** Records → Record book: the records, then the artifacts of the world. */
export function RecordBookTab({ state, actions }) {
  return (
    <>
      <RecordBook state={state} actions={actions} />
      <ArtifactAlmanac state={state} actions={actions} />
    </>
  );
}

/** Records → Hall of fame: the guild's greats, then the tournament legends. */
export function HallOfFameTab({ state, actions }) {
  return (
    <>
      <HallOfFame state={state} actions={actions} />
      <TournamentLegends state={state} actions={actions} />
    </>
  );
}
