import GuildBanner from '../components/GuildBanner.jsx';
import React from 'react';
import { CHARTERS } from '../data/charters.js';
import { getConnectionsView, getPathScores, getPromotionRequirement, getReputationSummary, getStatusTitle, specializationTitle, getStanding, standingEpithet } from '../game/engine.js';
import { Badge, Button, ProgressBar } from '../components/UI.jsx';
import Asset from '../components/Asset.jsx';
import Icon from '../components/Icon.jsx';
import { NemesisView } from '../screens/RivalryScreens.jsx';
import { Treasury } from '../places/GuildHallRooms.jsx';

// Guild orb → Guild: who the guild is and how it stands. Charter (with status,
// promotion and the run paths), Reputation, Patrons, Rivals and Finances.
// One line per item; tap a row for its details.

export const GUILD_TABS = [
  { id: 'charter', label: 'Charter', icon: 'banner' },
  { id: 'standing', label: 'Standing', icon: 'heart' },
  { id: 'reputation', label: 'Reputation', icon: 'shield' },
  { id: 'patrons', label: 'Patrons', icon: 'letter' },
  { id: 'rivals', label: 'Rivals', icon: 'swords' },
  { id: 'finances', label: 'Finances', icon: 'coin' },
];

function Line({ icon, label, value, children }) {
  return (
    <div className="guild-line">
      {icon ? <Icon name={icon} size={18} /> : null}
      <span>{label}</span>
      {value !== undefined ? <strong className="num">{value}</strong> : null}
      {children}
    </div>
  );
}

function CharterTab({ state }) {
  const charter = CHARTERS[state.guild.charter] || CHARTERS.free;
  const promotion = getPromotionRequirement(state);
  const paths = getPathScores(state);
  const best = [...paths].sort((a, b) => b.progress - a.progress)[0];
  const checks = promotion
    ? [
        ['laurel', 'Fame', promotion.fame],
        ['scroll', 'Contracts', promotion.contracts],
        ['crown', 'Official rank', promotion.rank],
        ['star', 'Feats', promotion.feat],
        ['hourglass', 'Years', promotion.time],
      ]
    : [];
  return (
    <div className="guild-screen">
      <header className="guild-charter">
        {state.guild.banner ? <GuildBanner banner={state.guild.banner} size={56} title={`The banner of ${state.guild.name}`} className="guild-charter__crest" /> : <Asset id={charter.crest} className="guild-charter__crest" />}
        <div>
          <strong>{state.guild.name}</strong>
          <small>{charter.name}</small>
          {state.guild.motto ? <em>“{state.guild.motto}”</em> : null}
        </div>
      </header>
      <ul className="guild-chips">
        {charter.modifiers.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <Line icon="banner" label="Status" value={getStatusTitle(state)} />
      <Line icon="star" label="Known for" value={specializationTitle(state) || 'Nothing yet'} />
      {promotion ? (
        <details className="journal-details">
          <summary>
            Promotion to {promotion.target.id}: {checks.filter(([, , item]) => item.met).length}/{checks.length}
          </summary>
          {checks.map(([icon, label, item]) => (
            <Line key={label} icon={icon} label={label} value={label === 'Official rank' ? `#${item.current} / #${item.target}` : `${item.current}/${item.target}`}>
              {item.met ? <Icon name="check" size={14} tone="plain" /> : null}
            </Line>
          ))}
        </details>
      ) : null}
      <h3 className="guild-heading">Paths</h3>
      {paths.map((path) => (
        <details key={path.id} className="journal-details">
          <summary>
            <Icon name={path.icon} size={16} />
            <span>{path.name}</span>
            {path.charterPath ? <Badge tone="gold">Charter</Badge> : null}
            {best?.id === path.id && path.score > 0 ? <Badge tone="green">Leading</Badge> : null}
            <b className="num">{path.score.toLocaleString()}</b>
          </summary>
          <ProgressBar value={Math.round(path.progress * 100)} max={100} compact tone={path.charterPath ? 'gold' : 'blue'} />
          <p>{path.detail}</p>
        </details>
      ))}
    </div>
  );
}

function ReputationTab({ state }) {
  const summary = getReputationSummary(state);
  const row = (key, label, item, tone) => (
    <details key={key} className="journal-details">
      <summary>
        <span>{label}</span>
        <small>{item.name}</small>
        <b className="num">{item.points}</b>
      </summary>
      <ProgressBar value={item.next ? item.points : 1} max={item.next || 1} compact tone={tone} label={item.next ? `${item.next - item.points} to ${item.nextName || 'next'}` : 'Maximum'} />
      {item.perk ? <p>{item.perk}</p> : null}
    </details>
  );
  return (
    <div className="guild-screen">
      <h3 className="guild-heading">Work</h3>
      {summary.families.map((item) => row(item.family, item.family, item, 'gold'))}
      <h3 className="guild-heading">Regions</h3>
      {summary.regions.map((item) => row(item.region, item.label, item, 'blue'))}
    </div>
  );
}

function PatronsTab({ state, actions }) {
  const patrons = getConnectionsView(state);
  return (
    <div className="guild-screen">
      {patrons.map((patron) => (
        <details key={patron.id} className={`journal-details patron-line patron-line--${patron.level.id}`}>
          <summary>
            <Asset id={patron.crest} className="patron-line__crest" />
            <span>{patron.short || patron.name}</span>
            <Badge tone={patron.level.index < 0 ? 'red' : patron.level.index >= 2 ? 'gold' : 'blue'}>{patron.level.name}</Badge>
            <b className="num">{patron.points}</b>
          </summary>
          {patron.next ? <ProgressBar value={Math.max(0, patron.points)} max={patron.next.min} compact tone="gold" label={`${patron.next.toGo} to ${patron.next.name}`} /> : null}
          <ul className="patron-line__unlocks">
            {patron.unlocks.map((unlock) => (
              <li key={unlock.id} className={unlock.open ? 'is-open' : ''}>
                {unlock.open ? <Icon name="check" size={14} tone="plain" /> : <Icon name="lock" size={14} tone="plain" />} {unlock.name}
              </li>
            ))}
          </ul>
          <p>
            {patron.rep.name}, {patron.homeName}
            {patron.opposes.length ? ` · rivals ${patron.opposes.map((item) => item.name).join(', ')}` : ''}
          </p>
          <Button size="sm" disabled={!patron.giftReady || state.guild.crowns < 50 || patron.level.index < 0} why={!patron.giftReady ? 'One gift a month.' : state.guild.crowns < 50 ? 'You need 50 gold.' : 'They will not take your gift.'} onClick={() => actions.giftPatron(patron.id)}>
            <Icon name="coin" size={14} tone="plain" /> Gift 50
          </Button>
        </details>
      ))}
    </div>
  );
}

/** The Guild section body; the section owns the tabs (GUILD_TABS). */
const HONOR_LABEL = { honourable: 'Honourable', neutral: 'Neither', wicked: 'Wicked' };
const DREAD_LABEL = { none: 'Not feared', feared: 'Feared', dreaded: 'Dreaded' };

/** Guild → Standing: honor (wicked ↔ honourable) and dread, the epithet they earn, and the deeds behind them. */
function StandingTab({ state }) {
  const standing = getStanding(state);
  const epithet = standingEpithet(state);
  const needle = (standing.honor + 100) / 2;
  return (
    <div className="guild-screen standing">
      <header className="standing__epithet">
        <strong>{epithet.words ? epithet.short : state.guild.name}</strong>
        <small>{epithet.words ? `People call you ${epithet.long}.` : 'Nobody has a word for your guild yet. Your choices will give it one.'}</small>
      </header>
      <div className="standing__scale" aria-label={`Honor ${standing.honor}`}>
        <span>Wicked</span>
        <div className="standing__track">
          <i className="standing__needle" style={{ left: `${needle}%` }} />
        </div>
        <span>Honourable</span>
      </div>
      <Line icon="heart" label="Honor" value={`${standing.honor > 0 ? '+' : ''}${standing.honor} · ${HONOR_LABEL[standing.honorBand] || 'Neither'}`} />
      <div className="standing__dread" aria-label={`Dread ${standing.dread} of 100`}>
        {[0, 1, 2, 3, 4].map((index) => (
          <span key={index} className={standing.dread >= (index + 1) * 20 ? 'is-on' : ''}>
            <Icon name="skull" size={18} tone="plain" />
          </span>
        ))}
      </div>
      <Line icon="skull" label="Dread" value={`${standing.dread} · ${DREAD_LABEL[standing.dreadBand] || 'Not feared'}`} />
      <p className="muted">Both fade a little each month: a guild is what it has done lately.</p>
      <h3 className="guild-subhead">Deeds</h3>
      {(standing.log || []).length ? (
        <ul className="standing__log">
          {standing.log.map((deed, index) => (
            <li key={`${deed.day}-${index}`}>
              <span>{deed.text}</span>
              <small className="num">
                {deed.honor ? `honor ${deed.honor > 0 ? '+' : ''}${deed.honor}` : ''}
                {deed.honor && deed.dread ? ' · ' : ''}
                {deed.dread ? `dread ${deed.dread > 0 ? '+' : ''}${deed.dread}` : ''}
              </small>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">No deeds yet. What you choose at the end of a job, or in the story, will show here.</p>
      )}
    </div>
  );
}

export default function GuildScreen({ state, actions, tab = 'charter' }) {
  if (tab === 'standing') return <StandingTab state={state} />;
  if (tab === 'reputation') return <ReputationTab state={state} />;
  if (tab === 'patrons') return <PatronsTab state={state} actions={actions} />;
  if (tab === 'rivals') return <NemesisView state={state} actions={actions} />;
  if (tab === 'finances') return <Treasury state={state} actions={actions} />;
  return <CharterTab state={state} />;
}
