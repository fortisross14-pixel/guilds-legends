import React from 'react';
import { MONTHS } from '../data/content.js';
import { getUpcomingEvents } from '../game/engine.js';
import { Button } from './UI.jsx';

const KIND_ICONS = { tournament: '♛', mission: '⌖', travel: '➜', promise: '✎' };

// The next three things the player can act on, with a link to the calendar.
export default function UpcomingStrip({ state, actions, navigate }) {
  const events = getUpcomingEvents(state, 3);
  const companyOut = state.activeMissions.length > 0 && !state.world?.activeTravel;
  return (
    <aside className="upcoming-strip" aria-label="Upcoming events">
      <button className="upcoming-strip__label" onClick={() => navigate('calendar')}>
        Upcoming ▦
      </button>
      <ol>
        {events.map((event) => (
          <li key={`${event.kind}-${event.id}`} className={`upcoming-item upcoming-item--${event.kind}`} title={event.detail}>
            <i>{KIND_ICONS[event.kind]}</i>
            <span>
              <strong>{event.title}</strong>
              <small>
                {event.weeksAway === 0 ? 'this week' : `in ${event.weeksAway} wk`} · {MONTHS[event.date.month].slice(0, 3)} w{event.date.week + 1}
              </small>
            </span>
          </li>
        ))}
        {!events.length ? <li className="upcoming-item muted">Nothing scheduled you can act on yet.</li> : null}
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
