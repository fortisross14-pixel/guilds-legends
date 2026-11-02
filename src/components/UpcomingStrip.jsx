import React from 'react';
import { getUpcomingEvents } from '../game/engine.js';
import { Button } from './UI.jsx';

const KIND_ICONS = { tournament: '♛', mission: '⌖', travel: '➜', promise: '✎' };

// Calendar strip: what is coming up, soonest first. Time only moves through
// actions, so the strip offers "wait for the company" when one is deployed.
export default function UpcomingStrip({ state, actions }) {
  const events = getUpcomingEvents(state, 6);
  const companyOut = state.activeMissions.length > 0 && !state.world?.activeTravel;
  if (!events.length) return null;
  return (
    <aside className="upcoming-strip" aria-label="Upcoming events">
      <span className="upcoming-strip__label">Upcoming</span>
      <ol>
        {events.map((event) => (
          <li key={`${event.kind}-${event.id}`} className={`upcoming-item upcoming-item--${event.kind}`} title={event.detail}>
            <i>{KIND_ICONS[event.kind]}</i>
            <span>
              <strong>{event.title}</strong>
              <small>
                {event.date ? `${event.date} · ` : ''}
                {event.monthsAway === 0 ? 'this month' : `in ${event.monthsAway} mo`} · {event.detail}
              </small>
            </span>
          </li>
        ))}
      </ol>
      {companyOut ? (
        <Button
          size="sm"
          onClick={actions.waitForCompany}
          disabled={state.pendingDecisions.length > 0 || Boolean(state.activeEncounter) || Boolean(state.activeMissionGame)}
        >
          Wait for the company
        </Button>
      ) : null}
    </aside>
  );
}
