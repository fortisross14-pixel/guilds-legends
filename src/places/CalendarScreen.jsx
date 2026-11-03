import React, { useEffect, useMemo, useState } from 'react';
import { MONTHS } from '../data/content.js';
import { getCalendarEntries } from '../game/engine.js';
import { Badge, Button, Panel } from '../components/UI.jsx';

const KIND_ICONS = { tournament: '♛', mission: '⌖', travel: '➜', promise: '✎', wages: '◈', season: '★', contract: '✍', challenge: '⚔', reputation: '❖' };

function sameDate(a, b) {
  return a.year === b.year && a.month === b.month && a.week === b.week;
}

// Month grid with weeks as rows. Click an entry for details and "Advance to this date".
export default function CalendarScreen({ state, actions }) {
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
  const paused = state.pendingDecisions.length || state.activeEncounter || state.activeMissionGame || state.pendingRoadEvent;

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
                        <i aria-hidden="true">{KIND_ICONS[entry.kind]}</i> {entry.title}
                        {entry.enterable ? <Badge tone="green">Can enter</Badge> : null}
                        {entry.locked || entry.almost ? <small> · {entry.detail}</small> : null}
                      </button>
                    </li>
                  ))}
              </ul>
              {!isPast && !isToday ? (
                <Button size="sm" variant="secondary" disabled={Boolean(paused)} onClick={() => actions.advanceToDate(date)}>
                  Advance to week {week + 1}
                </Button>
              ) : null}
            </section>
          );
        })}
      </div>
      {selected ? (
        <Panel
          title={selected.title}
          eyebrow={`${MONTHS[selected.date.month]} ${selected.date.year}, week ${selected.date.week + 1} · in ${selected.weeksAway} week${selected.weeksAway === 1 ? '' : 's'}`}
        >
          <p>{selected.detail}</p>
          <Button variant="primary" disabled={selected.weeksAway <= 0 || Boolean(paused)} onClick={() => actions.advanceToDate(selected.date)}>
            Advance to this date
          </Button>
        </Panel>
      ) : (
        <p className="muted">Click an entry for details. Time stops early if a battle, decision or tournament needs you.</p>
      )}
    </div>
  );
}
