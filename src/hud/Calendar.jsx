import React, { useState } from 'react';
import Icon from '../components/Icon.jsx';
import { MONTHS } from '../data/content.js';
import { getArenaView } from '../game/engine.js';

/**
 * The calendar in the HUD (top right, under the ledger): today's date in large
 * type, always on screen, and a trophy that opens the next tournaments (open now
 * with the days left, or how many days until sign-up opens).
 */
export default function Calendar({ state, navigate, onMap = false }) {
  const [open, setOpen] = useState(false);
  const { date } = state;
  const here = state.world?.currentLocationId || 'dunmere';
  const arena = getArenaView(state, here);
  const events = [...(arena.next ? [arena.next] : []), ...(arena.others || [])]
    .filter(Boolean)
    .sort((a, b) => (a.openNow === b.openNow ? (a.openNow ? a.closesIn - b.closesIn : a.days - b.days) : a.openNow ? -1 : 1))
    .slice(0, 5);
  const openNow = events.filter((item) => item.openNow).length;
  return (
    <div className={`calendar-chip${onMap ? ' calendar-chip--map' : ''}`}>
      <div className="calendar-chip__date" aria-label="Today">
        <strong>
          {MONTHS[date.month]} {date.year}
        </strong>
        <span>
          Week {(date.week || 0) + 1} · Day {(date.day || 0) + 1}
        </span>
      </div>
      <button type="button" className={`calendar-chip__cup${openNow ? ' is-open' : ''}`} onClick={() => setOpen(!open)} aria-expanded={open} aria-label={openNow ? `${openNow} tournament${openNow === 1 ? '' : 's'} open for sign-up` : 'Next tournaments'}>
        <Icon name="trophy" size={22} tone="plain" />
        {openNow ? <b>{openNow}</b> : null}
      </button>
      {open ? (
        <div className="calendar-chip__panel" role="dialog" aria-label="Next tournaments">
          <strong>Tournaments</strong>
          {events.length ? (
            <ul>
              {events.map((item) => (
                <li key={item.definition.id} className={item.openNow ? 'is-open' : ''}>
                  <span>
                    <b>{item.definition.name}</b>
                    <small>
                      {item.town} · teams of {item.teamSize}
                    </small>
                  </span>
                  <em>{item.openNow ? `open · ${item.closesIn}d left` : item.days <= 0 ? 'opens today' : `in ${item.days}d`}</em>
                </li>
              ))}
            </ul>
          ) : (
            <p>None at your status.</p>
          )}
          <button
            type="button"
            className="button button--secondary button--sm"
            onClick={() => {
              setOpen(false);
              navigate({ section: 'journal', tab: 'calendar' });
            }}
          >
            The full calendar
          </button>
        </div>
      ) : null}
    </div>
  );
}
