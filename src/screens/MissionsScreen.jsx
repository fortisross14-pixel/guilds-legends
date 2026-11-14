import React, { useState } from 'react';
import { LOCATION_BY_ID } from '../data/world.js';
import { contractDaysLeft, contractPlace, contractSteps, helpWanted, knownMissions, reportTo } from '../game/engine.js';
import { Button } from '../components/UI.jsx';
import Icon from '../components/Icon.jsx';

// The notice board: who in town is looking for help, and where to find them (the job is
// theirs to tell: walk over and talk), the posted story and bounty contracts, and the
// contracts the guild is working on, until they're done. Tap a contract for its panel.

const FAMILY_ICONS = { 'Bounty Hunt': 'swords', Rescue: 'heart', Investigation: 'search', Political: 'crown', Tournament: 'trophy', Dungeon: 'skull', Saga: 'book', Escort: 'boot', Exploration: 'map', Infiltration: 'eye' };

function statusOf(mission) {
  const status = mission.site?.status;
  if (status === 'ready') return { key: 'ready', label: 'Done: report', tone: 'good' };
  if (status === 'failed') return { key: 'failed', label: 'Too late', tone: 'bad' };
  if (status === 'active') return { key: 'active', label: 'Working', tone: 'blue' };
  return { key: 'new', label: mission.story ? 'Story' : 'New', tone: mission.story ? 'purple' : 'gold' };
}

function ContractPanel({ state, mission, actions, navigate }) {
  const steps = contractSteps(state, mission);
  const place = contractPlace(mission);
  const days = contractDaysLeft(state, mission);
  const status = statusOf(mission);
  const reporter = reportTo(mission);
  return (
    <div className="contract-panel">
      <p className="contract-panel__stakes">{mission.stakes || mission.title}</p>
      {mission.giverName && !mission.accepted ? <p className="contract-panel__where">Pinned by {mission.giverName}, for your guild.</p> : null}
      <p className="contract-panel__where">
        <Icon name="pin" size={14} /> {place.name}
        {days !== null ? (
          <span className={days <= 2 ? 'is-urgent' : ''}>
            {' '}
            · <Icon name="hourglass" size={14} /> {days > 0 ? `${days} day${days === 1 ? '' : 's'} left` : 'last day'}
          </span>
        ) : null}
      </p>
      <ol className="contract-steps">
        {steps.map((step) => (
          <li key={step.id} className={`${step.done ? 'is-done' : ''} ${step.open ? 'is-open' : ''} ${step.optional ? 'is-optional' : ''}`}>
            <Icon name={step.done ? 'check' : step.optional ? 'star' : 'dot'} size={14} />
            {step.text}
            {step.optional ? <small> (extra)</small> : null}
          </li>
        ))}
      </ol>
      <p className="contract-panel__pay">
        <span>
          <Icon name="coin" size={18} />
          {mission.reward}
        </span>
        <span>
          <Icon name="laurel" size={18} />
          {mission.fame}
        </span>
      </p>
      <div className="contract-panel__actions">
        {status.key === 'new' ? (
          <>
            <Button variant="primary" onClick={() => actions.acceptContract(mission.id)}>
              Accept
            </Button>
            {!mission.story && !mission.bossId ? <Button onClick={() => actions.declineContract(mission.id)}>Decline</Button> : null}
          </>
        ) : null}
        {status.key === 'active' ? (
          <Button variant="primary" onClick={() => navigate?.({ view: 'scene' })}>
            Go
          </Button>
        ) : null}
        {status.key === 'ready' && reporter === 'the Notice Board' ? (
          <Button variant="primary" onClick={() => actions.reportContract(mission.id)}>
            Report
          </Button>
        ) : null}
        {status.key === 'ready' && reporter && reporter !== 'the Notice Board' ? <p className="muted">Report to {reporter}.</p> : null}
        {status.key === 'active' && !mission.story && !mission.bossId ? (
          <Button
            onClick={() => {
              if (window.confirm(`Give up “${mission.title}”? A rival guild takes it, and reputation drops a little.`)) actions.declineContract(mission.id);
            }}
          >
            Give up
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export default function MissionsScreen({ state, actions, navigate }) {
  const here = state.world?.currentLocationId || 'dunmere';
  // Posted contracts (story, boss) and the ones taken from people here; story first.
  const local = knownMissions(state)
    .filter((mission) => mission.locationId === here)
    .sort((a, b) => Number(Boolean(b.story)) - Number(Boolean(a.story)) || Number(Boolean(b.site)) - Number(Boolean(a.site)));
  const elsewhere = knownMissions(state).filter((mission) => mission.locationId !== here);
  const [openId, setOpenId] = useState(local[0]?.id || null);
  const help = helpWanted(state, here);
  return (
    <div className="notice-board">
      <h3 className="notice-board__head">Looking for help</h3>
      {help.length ? (
        <ul className="help-list">
          {help.map((person) => (
            <li key={person.id} className={`help-row${person.working ? ' is-working' : ''}`}>
              <Icon name="letter" size={20} />
              <span className="help-row__who">
                <strong>{person.name}</strong>
                <small>{person.role}</small>
              </span>
              <span className="help-row__where">
                <Icon name="pin" size={14} /> {person.where}
              </span>
              {person.working ? <span className="contract-row__status is-blue">{person.working.ready ? 'Done: tell them' : 'On it'}</span> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">Nobody is asking for help here this month.</p>
      )}
      <h3 className="notice-board__head">Contracts</h3>
      {local.length ? (
        <ul className="contract-list">
          {local.map((mission) => {
            const status = statusOf(mission);
            const open = openId === mission.id;
            return (
              <li key={mission.id} className={`contract-row ${open ? 'is-open' : ''} is-${status.key}`}>
                <button type="button" className="contract-row__head" aria-expanded={open} onClick={() => setOpenId(open ? null : mission.id)}>
                  <Icon name={FAMILY_ICONS[mission.family] || 'notice'} size={22} />
                  <span className="contract-row__title">{mission.title}</span>
                  <span className={`contract-row__status is-${status.tone}`}>{status.label}</span>
                </button>
                {open ? <ContractPanel state={state} mission={mission} actions={actions} navigate={navigate} /> : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="muted">No contracts posted or taken here.</p>
      )}
      {elsewhere.length ? (
        <p className="notice-board__elsewhere">
          <b>Elsewhere:</b> {elsewhere.map((mission) => `${mission.title} (${LOCATION_BY_ID[mission.locationId]?.name || mission.locationId})`).join(' · ')}
        </p>
      ) : null}
    </div>
  );
}
