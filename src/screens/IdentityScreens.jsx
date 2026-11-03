import React from 'react';
import { CHARTERS } from '../data/charters.js';
import { getConnectionsView, getPathScores, getReputationSummary } from '../game/engine.js';
import { Badge, Button, Panel, ProgressBar } from '../components/UI.jsx';
import Asset from '../components/Asset.jsx';
import PixelIcon from '../components/PixelIcon.jsx';

/** Who the guild set out to be, and what it has become: shown at the top of the Herald. */
export function IdentityStrip({ state }) {
  const charter = CHARTERS[state.guild.charter] || CHARTERS.free;
  const reputation = getReputationSummary(state);
  const top = [...reputation.families].sort((a, b) => b.points - a.points)[0];
  return (
    <section className="identity-strip">
      <Asset id={charter.crest} className="identity-strip__crest" />
      <div>
        <span className="eyebrow">Founding charter</span>
        <strong>{charter.name}</strong>
        <small>{charter.modifiers.join(' · ')}</small>
      </div>
      <div>
        <span className="eyebrow">Known as</span>
        <strong>{reputation.title || 'Nobody yet'}</strong>
        <small>
          {top && top.points ? `${top.family} · ${top.name} (${top.points}). Boards offer more ${top.family.toLowerCase()} work as this grows.` : 'Finish contracts: what you take shapes what you are offered.'}
        </small>
      </div>
    </section>
  );
}

/** The four run paths, with the charter's path marked. */
export function PathPanel({ state }) {
  const paths = getPathScores(state);
  const best = [...paths].sort((a, b) => b.progress - a.progress)[0];
  return (
    <Panel title="Paths" eyebrow="How Chapter 1 will remember you · the best path names your ending">
      <div className="path-grid">
        {paths.map((path) => (
          <article key={path.id} className={`path-card ${path.charterPath ? 'is-charter' : ''} ${best?.id === path.id ? 'is-leading' : ''}`}>
            <header>
              <PixelIcon name={path.icon} size={24} />
              <strong>{path.name}</strong>
              {path.charterPath ? <Badge tone="gold">Your charter</Badge> : null}
              {best?.id === path.id && path.score > 0 ? <Badge tone="green">Leading</Badge> : null}
            </header>
            <p className="path-card__score num">{path.score.toLocaleString()}</p>
            <ProgressBar value={Math.round(path.progress * 100)} max={100} compact tone={path.charterPath ? 'gold' : 'blue'} />
            <small>{path.detail}</small>
            {path.signature ? <em>{path.signature}</em> : null}
          </article>
        ))}
      </div>
    </Panel>
  );
}

/** Patrons: standing, what each level unlocks, who they oppose, and a monthly gift. */
export function ConnectionsPage({ state, actions }) {
  const patrons = getConnectionsView(state);
  return (
    <div className="connections">
      <p className="muted">Patrons reward the work they care about. Helping one can cost you with another, so you cannot be everyone’s Ally.</p>
      {patrons.map((patron) => (
        <article key={patron.id} className={`patron-card patron-card--${patron.level.id}`}>
          <header>
            <Asset id={patron.crest} className="patron-card__crest" />
            <div>
              <strong>{patron.name}</strong>
              <small>
                {patron.homeName} · {patron.rep.name}, {patron.rep.role}
              </small>
            </div>
            <Badge tone={patron.level.index < 0 ? 'red' : patron.level.index >= 2 ? 'gold' : 'blue'}>{patron.level.name}</Badge>
          </header>
          <p>{patron.about}</p>
          <div className="patron-card__standing">
            <span className="num">{patron.points} standing</span>
            {patron.next ? (
              <>
                <ProgressBar value={Math.max(0, patron.points)} max={patron.next.min} compact tone="gold" />
                <small>
                  {patron.next.toGo} to {patron.next.name}
                </small>
              </>
            ) : (
              <small>Highest standing.</small>
            )}
          </div>
          <ul className="patron-card__unlocks">
            {patron.unlocks.map((unlock) => (
              <li key={unlock.id} className={unlock.open ? 'is-open' : ''}>
                <b>{unlock.open ? '✓' : '·'} {unlock.name}:</b> {unlock.text}
              </li>
            ))}
          </ul>
          <p className="patron-card__notes">
            Their contracts: {patron.families.join(', ')}
            {patron.openContracts ? ` · ${patron.openContracts} on the boards now` : ''}
            {patron.opposes.length ? ` · working for them costs standing with ${patron.opposes.map((item) => item.name).join(' and ')}` : ''}
          </p>
          <Button size="sm" disabled={!patron.giftReady || state.guild.crowns < 50 || patron.level.index < 0} onClick={() => actions.giftPatron(patron.id)}>
            {patron.giftReady ? 'Send a gift (50 G)' : 'Gift sent this month'}
          </Button>
        </article>
      ))}
    </div>
  );
}
