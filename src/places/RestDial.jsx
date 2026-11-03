import React, { useMemo, useState } from 'react';
import { MONTHS } from '../data/content.js';
import { MAX_REST_DAYS, campaignDaySerial, dateFromDaySerial, getCalendarEntries, spanLabel } from '../game/engine.js';
import PixelIcon, { EVENT_ICONS } from '../components/PixelIcon.jsx';
import { Button } from '../components/UI.jsx';

// The rest dial: drag along a timeline (days → weeks → months) dotted with the
// events ahead. It snaps to the day just before an event; one tap rests.
// The scale is uneven so a thumb can pick a single day or three months.
const toPos = (days) => (days <= 7 ? ((days - 1) / 6) * 30 : days <= 28 ? 30 + ((days - 7) / 21) * 30 : 60 + ((days - 28) / (MAX_REST_DAYS - 28)) * 40);
const fromPos = (pos) => Math.round(pos <= 30 ? 1 + (pos / 30) * 6 : pos <= 60 ? 7 + ((pos - 30) / 30) * 21 : 28 + ((pos - 60) / 40) * (MAX_REST_DAYS - 28));
const SKIP = ['reputation', 'season'];

export default function RestDial({ state, disabled, onRest }) {
  const events = useMemo(
    () =>
      getCalendarEntries(state, 4)
        .map((entry) => ({ ...entry, day: entry.weeksAway * 7 - (state.date.day || 0) }))
        .filter((entry) => entry.day >= 2 && entry.day <= MAX_REST_DAYS && !SKIP.includes(entry.kind)),
    [state],
  );
  const [days, setDays] = useState(7);
  // Snap to "just before" an event when the thumb comes close.
  const snap = (value) => {
    const near = events.find((entry) => Math.abs(value - (entry.day - 1)) <= Math.max(1, Math.round(value / 14)));
    return near ? near.day - 1 : value;
  };
  const target = dateFromDaySerial(campaignDaySerial(state) + days);
  const next = events.find((entry) => entry.day > days);
  const just = events.find((entry) => entry.day - 1 === days);
  return (
    <div className="rest-dial">
      <div className="rest-dial__track">
        {events.map((entry) => (
          <span key={`${entry.kind}-${entry.id}`} className={`rest-dial__event rest-dial__event--${entry.kind}`} style={{ left: `${toPos(entry.day)}%` }} title={entry.title}>
            <PixelIcon name={EVENT_ICONS[entry.kind] || 'star'} size={16} />
          </span>
        ))}
        <input
          type="range"
          min={0}
          max={100}
          step={0.5}
          value={toPos(days)}
          onChange={(event) => setDays(Math.max(1, Math.min(MAX_REST_DAYS, snap(fromPos(Number(event.target.value))))))}
          aria-label="How long to rest"
          aria-valuetext={spanLabel(days)}
        />
        <div className="rest-dial__scale" aria-hidden="true">
          <span>1 day</span>
          <span>1 week</span>
          <span>1 month</span>
          <span>3 months</span>
        </div>
      </div>
      <p className="rest-dial__readout">
        <b>{spanLabel(days)}</b> → {MONTHS[target.month]} {target.year}, week {target.week + 1}, day {target.day + 1}
        {just ? <small> · just before: {just.title}</small> : next ? <small> · next: {next.title}</small> : null}
      </p>
      <Button variant="primary" size="lg" disabled={disabled} onClick={() => onRest(days)}>
        Rest {spanLabel(days)}
      </Button>
    </div>
  );
}
