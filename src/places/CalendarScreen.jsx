import React, { useEffect, useMemo, useState } from 'react';
import { MONTHS } from '../data/content.js';
import { getCalendarEntries } from '../game/engine.js';
import { Badge, Button, Panel } from '../components/UI.jsx';
import Icon, { EVENT_ICONS } from '../components/Icon.jsx';

function sameDate(a, b) {
  return a.year === b.year && a.month === b.month && a.week === b.week;
}

const away = (entry) => (entry.awayDays ? `you are ${entry.awayDays} day${entry.awayDays === 1 ? '' : 's'} away` : null);

// Month grid with weeks as rows. Read-only, except in the Guild Hall
// (`canAdvance`), where the player can wait for a date.
export default function CalendarScreen({ state, actions, canAdvance = false }) {
  const today = { year: state.date.year, month: state.date.month, week: state.date.week || 0 };
  const [view, setView] = useState({ year: today.year, month: today.month });
  const [selected, setSelected] = useState(null);
  // Follow the current date after time advances, unless the player browsed to another month.
  const [follow, setFollow] = useState(true);
  useEffect(() => {
    if (follow) setView({ year: state.date.year, month: state.date.month });
  }, [follow, state.date.year, state.date.month, state.date.week]);
  const entries = useMemo(() => getCalendarEntries(state, 14), [state]);
  const offset = (view.year - today.year) * 12 + (view.month - today.month);
  const shift = (delta) => {
    const serial = view.year * 12 + view.month + delta;
    setView({ year: Math.floor(serial / 12), month: serial % 12 });
    setFollow(serial === today.year * 12 + today.month);
    setSelected(null);
  };
  const monthEntries = entries.filter((entry) => entry.date.year === view.year && entry.date.month === view.month);
  const paused = state.activeEncounter || state.pendingRoadEvent;

  return (
    <div className="calendar">
      <header className="calendar__header">
        <Button size="sm" onClick={() => shift(-1)} disabled={offset <= 0}>
          ‹ Previous
        </Button>
        <h2>
          {MONTHS[view.month]} {view.year}
        </h2>
        {!follow ? (
          <Button size="sm" variant="secondary" onClick={() => setFollow(true)}>
            Today
          </Button>
        ) : null}
        <Button size="sm" onClick={() => shift(1)} disabled={offset >= 12}>
          Next ›
        </Button>
      </header>
      <div className="calendar__grid">
        {[0, 1, 2, 3].map((week) => {
          const date = { year: view.year, month: view.month, week };
          const isPast = offset < 0 || (offset === 0 && week < today.week);
          const isToday = sameDate(date, today);
          return (
            <section key={week} className={`calendar__week ${isToday ? 'is-today' : ''} ${isPast ? 'is-past' : ''}`}>
              <h3>
                Week {week + 1}
                {isToday ? <Badge tone="gold">Now</Badge> : null}
              </h3>
              <ul>
                {monthEntries
                  .filter((entry) => entry.date.week === week)
                  .map((entry) => (
                    <li key={`${entry.kind}-${entry.id}`}>
                      <button
                        className={`calendar-entry calendar-entry--${entry.kind} ${entry.locked ? 'is-locked' : ''} ${entry.enterable ? 'is-enterable' : ''} ${entry.almost ? 'is-almost' : ''}`}
                        onClick={() => setSelected(entry)}
                      >
                        <i aria-hidden="true">
                          <Icon name={EVENT_ICONS[entry.kind] || 'star'} size={24} />
                        </i>{' '}
                        {entry.title}
                        {entry.signedUp ? <Badge tone="gold">Signed up</Badge> : entry.enterable ? <Badge tone="green">Can enter</Badge> : null}
                        {entry.locked || entry.almost ? <small> · {entry.detail}</small> : null}
                        {away(entry) ? <small> · {away(entry)}</small> : null}
                      </button>
                    </li>
                  ))}
              </ul>
              {canAdvance && !isPast && !isToday ? (
                <Button size="sm" variant="secondary" disabled={Boolean(paused)} onClick={() => actions.advanceToDate(date)}>
                  Rest until week {week + 1}
                </Button>
              ) : null}
            </section>
          );
        })}
      </div>
      {selected ? (
        <Panel
          title={selected.title}
          eyebrow={`${MONTHS[selected.date.month]} ${selected.date.year}, week ${selected.date.week + 1} · in ${selected.weeksAway} week${selected.weeksAway === 1 ? '' : 's'}${away(selected) ? ` · ${away(selected)}` : ''}`}
        >
          <p>{selected.detail}</p>
          {selected.source ? <p className="calendar__source">Heard from {selected.source.source}: {selected.source.note}</p> : null}
          {canAdvance ? (
            <Button variant="primary" disabled={selected.weeksAway <= 0 || Boolean(paused)} onClick={() => actions.advanceToDate(selected.date)}>
              Advance to this date
            </Button>
          ) : null}
        </Panel>
      ) : null}
    </div>
  );
}
