import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Crest } from '../components/UI.jsx';
import { haptic } from '../components/gestures.js';

// The exploring HUD (docs/UX.md, "The HUD"): a fading place tag (top left), the
// ledger (top right) and two orbs (bottom corners) that fan their items out in a
// quarter circle toward the screen centre. The orbs share the combat radial's
// gesture: tap to open and tap an item, or press, slide onto an item and release.

const FAN_RADIUS = 156; // CSS px from the orb centre to each item centre
const FAN_FROM = 80; // degrees: nearly straight up (leaning toward the centre, so labels stay on screen)…
const FAN_TO = 2; // …to just above straight sideways
const HIT = 34; // how close a sliding finger must be to an item to pick it

function fanPoints(count, side) {
  return Array.from({ length: count }, (_, index) => {
    const angle = count === 1 ? 45 : FAN_FROM - ((FAN_FROM - FAN_TO) * index) / (count - 1);
    const radians = (angle * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    return { x: (side === 'left' ? 1 : -1) * FAN_RADIUS * cos, y: -FAN_RADIUS * sin, cos: side === 'left' ? cos : -cos, sin };
  });
}

/**
 * One orb. `items`: [{ id, label, icon, badge, onSelect }]. `badge` on an item is a
 * number or true (a dot); the orb shows a dot when any item has one.
 */
export function Orb({ side, icon, art = null, label, items, showLabel = false, open, onOpenChange, settings }) {
  const orbRef = useRef(null);
  const press = useRef(null);
  const [hot, setHot] = useState(null);
  const points = fanPoints(items.length, side);
  const badge = items.some((item) => item.badge);

  const centre = () => {
    const rect = orbRef.current.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  };
  const itemAt = (clientX, clientY) => {
    const c = centre();
    let best = null;
    points.forEach((point, index) => {
      const distance = Math.hypot(clientX - (c.x + point.x), clientY - (c.y + point.y));
      if (distance <= HIT && (!best || distance < best.distance)) best = { index, distance };
    });
    return best ? best.index : null;
  };
  const select = (index) => {
    const item = items[index];
    onOpenChange(false);
    setHot(null);
    if (item && !item.disabled) {
      haptic('tap', settings);
      item.onSelect();
    }
  };

  const onPointerDown = (event) => {
    if (event.button > 0) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    press.current = { x: event.clientX, y: event.clientY, wasOpen: open, moved: false };
    if (!open) onOpenChange(true);
  };
  const onPointerMove = (event) => {
    const current = press.current;
    if (!current) return;
    if (Math.hypot(event.clientX - current.x, event.clientY - current.y) > 10) current.moved = true;
    if (current.moved) setHot(itemAt(event.clientX, event.clientY));
  };
  const onPointerUp = (event) => {
    const current = press.current;
    press.current = null;
    if (!current) return;
    const index = current.moved ? itemAt(event.clientX, event.clientY) : null;
    if (index !== null) select(index);
    else if (!current.moved && current.wasOpen) onOpenChange(false);
    else if (current.moved) setHot(null);
  };

  // Keyboard: the first item takes focus when the fan opens; arrows walk the arc.
  const itemRefs = useRef([]);
  useEffect(() => {
    if (open) window.requestAnimationFrame(() => itemRefs.current[0]?.focus({ preventScroll: true }));
  }, [open]);
  const onFanKey = (event, index) => {
    const step = { ArrowUp: -1, ArrowLeft: side === 'left' ? -1 : 1, ArrowDown: 1, ArrowRight: side === 'left' ? 1 : -1 }[event.key];
    if (step) {
      event.preventDefault();
      itemRefs.current[(index + step + items.length) % items.length]?.focus();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onOpenChange(false);
      orbRef.current?.focus();
    }
  };

  return (
    <div className={`orb orb--${side}${open ? ' is-open' : ''}`}>
      <button
        ref={orbRef}
        type="button"
        className="orb__button"
        aria-label={label}
        aria-expanded={open}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          press.current = null;
          setHot(null);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onOpenChange(!open);
          }
        }}
        onContextMenu={(event) => event.preventDefault()}
      >
        {art || <Icon name={icon} size={28} />}
        {badge && !open ? <i className="orb__badge" aria-hidden="true" /> : null}
      </button>
      {showLabel && !open ? <span className="orb__label">{label}</span> : null}
      {open ? (
        <ul className="orb__fan" role="menu" aria-label={label}>
          {items.map((item, index) => {
            const point = points[index];
            return (
              <li
                key={item.id}
                className={`orb__item${hot === index ? ' is-hot' : ''}${item.disabled ? ' is-disabled' : ''}`}
                style={{ '--x': `${point.x}px`, '--y': `${point.y}px`, '--cos': point.cos, '--sin': point.sin, '--i': index }}
              >
                <button
                  ref={(element) => {
                    itemRefs.current[index] = element;
                  }}
                  type="button"
                  role="menuitem"
                  aria-label={item.badge ? `${item.label} (${typeof item.badge === 'number' ? item.badge : 'new'})` : item.label}
                  onClick={() => select(index)}
                  onKeyDown={(event) => onFanKey(event, index)}
                >
                  <Icon name={item.icon} size={24} />
                  {item.badge ? <b className="orb__count">{typeof item.badge === 'number' ? item.badge : ''}</b> : null}
                </button>
                <span className="orb__item-label" aria-hidden="true">
                  {item.label}
                  {item.hint ? <small>{item.hint}</small> : null}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

/** Taps outside the open fan (or swipes) close it. */
export function OrbScrim({ onClose }) {
  return <div className="orb-scrim" onPointerUp={onClose} onContextMenu={(event) => event.preventDefault()} aria-hidden="true" />;
}

const FLASH_MS = 2600;

/**
 * The ledger. Collapsed: the book with the crest, and gold. Tapped: a column of
 * rows (each opens its detail). On its own: when a watched value changes, it
 * shows that row with the change ("+120", "▲2") and folds away again.
 * rows: [{ id, icon, label, sub?, value, num?, change?, quiet? (never flashes), onOpen }]
 */
export function Ledger({ crest, gold, rows, open, onOpenChange }) {
  const memory = useRef(null);
  const [flash, setFlash] = useState(null); // { ids: [], deltas: { id: text } }
  const timer = useRef(0);

  useLayoutEffect(() => {
    const now = Object.fromEntries(rows.map((row) => [row.id, row.num ?? row.value]));
    const before = memory.current;
    memory.current = now;
    if (!before) return;
    const deltas = {};
    rows.forEach((row) => {
      if (row.quiet) return;
      const was = before[row.id];
      const is = now[row.id];
      if (was === undefined || was === is) return;
      if (typeof was === 'number' && typeof is === 'number') {
        const diff = is - was;
        // Ranks: a smaller number is better.
        deltas[row.id] = row.rank ? (diff < 0 ? `▲${-diff}` : `▼${diff}`) : `${diff > 0 ? '+' : '−'}${Math.abs(diff).toLocaleString()}`;
      } else deltas[row.id] = 'new';
    });
    const ids = Object.keys(deltas);
    if (!ids.length) return;
    setFlash({ ids, deltas });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setFlash(null), FLASH_MS);
  });
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const shown = open ? rows : flash ? rows.filter((row) => flash.ids.includes(row.id)) : [];
  return (
    <div className={`ledger${open ? ' is-open' : ''}${flash && !open ? ' is-flashing' : ''}`}>
      <button type="button" className="ledger__book" onClick={() => onOpenChange(!open)} aria-expanded={open} aria-label={`Ledger: ${gold.toLocaleString()} gold`}>
        <span className="ledger__crest" aria-hidden="true">
          {crest || <Crest size="xs" />}
        </span>
        <Icon name="coin" size={18} />
        <b className="num">{gold.toLocaleString()}</b>
        <Icon name="ledger" size={18} className="ledger__glyph" />
      </button>
      {shown.length ? (
        <ul className="ledger__rows" aria-live="polite">
          {shown.map((row) => {
            const delta = flash?.deltas[row.id];
            return (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    row.onOpen?.();
                  }}
                  className={delta ? 'is-changed' : ''}
                >
                  <Icon name={row.icon} size={18} />
                  <span className="ledger__label">
                    {row.label}
                    {row.sub ? <small>{row.sub}</small> : null}
                  </span>
                  <strong className="num">{row.value}</strong>
                  {row.change ? <em className={`ledger__move ledger__move--${row.change > 0 ? 'up' : 'down'}`}>{row.change > 0 ? `▲${row.change}` : `▼${-row.change}`}</em> : null}
                  {delta && delta !== 'new' ? <i className={`ledger__delta ${/^[+▲]/.test(delta) ? 'is-up' : 'is-down'}`}>{delta}</i> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

const SHOW_MS = 4200;

/**
 * Where you are and when, small, top left. Fades after a few seconds; tap to
 * show it again. `goal` (optional) is one line under it that stays.
 */
export function PlaceTag({ title, sub, goal = null }) {
  const [shown, setShown] = useState(true);
  const timer = useRef(0);
  const reveal = () => {
    setShown(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setShown(false), SHOW_MS);
  };
  useEffect(() => {
    reveal();
    return () => window.clearTimeout(timer.current);
  }, [title, sub]);
  return (
    <div className="place-tag">
      <button type="button" className={`place-tag__name${shown ? '' : ' is-faded'}`} onClick={reveal} aria-label={sub ? `${title}, ${sub}` : title}>
        <Icon name="pin" size={16} />
        <span>
          <strong>{title}</strong>
          {sub ? <small>{sub}</small> : null}
        </span>
      </button>
      {goal}
    </div>
  );
}
