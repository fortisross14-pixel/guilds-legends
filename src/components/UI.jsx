import React, { useEffect, useMemo, useRef } from 'react';
import { normalizeClassId } from '../data/content.js';
import { PRIMALS, RARITIES } from '../data/world.js';
import { PixelCrest } from './PixelIcon.jsx';

const CREST_SCALES = { xs: 2, sm: 2, md: 3, lg: 4, xl: 6 };

export function Crest({ size = 'md' }) {
  return (
    <div className={`crest crest--${size}`}>
      <PixelCrest scale={CREST_SCALES[size] || 3} />
    </div>
  );
}

/** URL of a public art file, safe under the GitHub Pages subpath. */
export function artUrl(path) {
  return `${import.meta.env.BASE_URL}${path}`;
}

/** Inline style that sets a scene backdrop (see `.scene` in art.css). */
export function sceneStyle(scene, extra = {}) {
  return { '--scene': `url(${artUrl(`art/scenes/${scene}.png`)})`, ...extra };
}

export function heroArtKey(hero = {}) {
  return normalizeClassId(hero.classId || 'Guardian').toLowerCase();
}

export function HeroPortrait({ hero, size = 'md', showStatus = true }) {
  const classId = normalizeClassId(hero.classId);
  const primal = PRIMALS[hero.primal] || PRIMALS.Fire;
  const rarity = RARITIES[hero.rarity] || RARITIES.Common;
  const artKey = heroArtKey(hero);
  return (
    <div
      className={`hero-portrait hero-portrait--${size}`}
      style={{
        '--portrait-frame': `var(--r-${rarity.id.toLowerCase()})`,
        '--portrait-primal': `var(--p-${primal.id.toLowerCase()})`,
      }}
      role="img"
      aria-label={`${hero.name}, ${rarity.id} ${classId}`}
    >
      <img className="hero-portrait__art" src={artUrl(`art/portraits/${artKey}.png`)} alt="" loading="lazy" />
      {showStatus && hero.status && hero.status !== 'available' ? <span className={`status-dot status-dot--${hero.status}`} title={hero.status} /> : null}
    </div>
  );
}

/**
 * Arrow keys move between the buttons of any element marked `data-menu`
 * (Up/Down, and Left/Right for horizontal menus); Enter activates natively.
 * Install once near the root.
 */
export function useMenuKeys() {
  useEffect(() => {
    const onKey = (event) => {
      if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      const target = event.target;
      if (!(target instanceof HTMLElement) || target.matches('input, select, textarea, [role="tab"]')) return;
      const menu = target.closest('[data-menu]');
      if (!menu) return;
      const items = [...menu.querySelectorAll('button:not([disabled])')].filter((item) => item.closest('[data-menu]') === menu && item.offsetParent !== null);
      const index = items.indexOf(target);
      if (index < 0) return;
      const forward = event.key === 'ArrowDown' || event.key === 'ArrowRight';
      const next =
        event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + (forward ? 1 : -1) + items.length) % items.length;
      event.preventDefault();
      items[next].focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

export function HeroSprite({ hero, size = 'md', enemy = false }) {
  const artKey = heroArtKey(hero);
  const primal = PRIMALS[hero.primal] || PRIMALS.Fire;
  return (
    <div className={`hero-sprite hero-sprite--${size} ${enemy ? 'hero-sprite--enemy' : ''}`} style={{ '--sprite-glow': primal.color }}>
      <img src={`${import.meta.env.BASE_URL}art/sprites/${artKey}.png`} alt="" loading="lazy" />
    </div>
  );
}

export function PrimalBadge({ primal, compact = false }) {
  const info = PRIMALS[primal] || { icon: '◇', color: '#8f99a5', id: primal || 'Unknown' };
  return (
    <span
      className={`primal-badge ${compact ? 'primal-badge--compact' : ''}`}
      style={{ '--primal-color': info.color }}
      title={`${info.id}: strong against ${info.beats || '—'}, weak to ${info.weakTo || '—'}`}
    >
      <i>{info.icon}</i>
      {compact ? null : <span>{info.id}</span>}
    </span>
  );
}

export function RarityBadge({ rarity }) {
  const info = RARITIES[rarity] || { color: '#8f99a5', id: rarity || 'Common' };
  return (
    <span className="rarity-badge" style={{ '--rarity-color': info.color }}>
      {info.id}
    </span>
  );
}

export function LevelBadge({ hero, showXp = false }) {
  const level = hero?.level || 1;
  return (
    <span className="level-badge" title={showXp && level < 20 ? `${hero.xp || 0} XP toward the next level` : level >= 20 ? 'Maximum level' : `Level ${level}`}>
      <small>LV</small>
      <strong>{level}</strong>
      {showXp && level < 20 ? <em>{hero.xp || 0} XP</em> : null}
    </span>
  );
}

export function ProgressBar({ value, max = 100, label = undefined, tone = 'gold', compact = false }) {
  const pct = max <= 0 ? 0 : Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={`progress ${compact ? 'progress--compact' : ''}`}>
      {label ? (
        <div className="progress__label">
          <span>{label}</span>
          <strong>
            {Math.round(value)}/{Math.round(max)}
          </strong>
        </div>
      ) : null}
      <div
        className="progress__track"
        role="progressbar"
        aria-label={label || 'Progress'}
        aria-valuemin={0}
        aria-valuemax={Math.round(max)}
        aria-valuenow={Math.round(value)}
      >
        <span className={`progress__fill progress__fill--${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function Stat({ label, value, sub = undefined, icon = undefined, tone = 'neutral' }) {
  return (
    <div className={`stat stat--${tone}`}>
      {icon ? <span className="stat__icon">{icon}</span> : null}
      <div>
        <span className="stat__label">{label}</span>
        <strong className="stat__value">{value}</strong>
        {sub ? <span className="stat__sub">{sub}</span> : null}
      </div>
    </div>
  );
}

export function Badge({ children, tone = 'neutral', title = undefined }) {
  return (
    <span className={`badge badge--${tone}`} title={title}>
      {children}
    </span>
  );
}

export function Button({ children, variant = 'secondary', size = 'md', icon = undefined, className = '', ...props }) {
  return (
    <button className={`button button--${variant} button--${size} ${className}`} {...props}>
      {icon ? <span className="button__icon">{icon}</span> : null}
      <span>{children}</span>
    </button>
  );
}

export function Panel({ title = undefined, eyebrow = undefined, action = null, children, className = '', tone = 'default' }) {
  return (
    <section className={`panel panel--${tone} ${className}`}>
      {title || eyebrow || action ? (
        <header className="panel__header">
          <div>
            {title ? <h2>{title}</h2> : null}
            {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
          </div>
          {action ? <div className="panel__action">{action}</div> : null}
        </header>
      ) : null}
      <div className="panel__body">{children}</div>
    </section>
  );
}

export function EmptyState({ icon = '◇', title, text, action = null }) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon">{icon}</span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}

export function Modal({ open, title, eyebrow = undefined, children, onClose = undefined, width = 'wide', preventClose = false, className = '' }) {
  const closeRef = useRef(null);
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    previousFocusRef.current = document.activeElement;
    const onKey = (event) => {
      if (event.key === 'Escape' && !preventClose) {
        onClose?.();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = [
        ...(dialogRef.current?.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) || []),
      ];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    window.requestAnimationFrame(() => (closeRef.current || dialogRef.current?.querySelector('button, input, select, textarea'))?.focus());
    return () => {
      window.removeEventListener('keydown', onKey);
      previousFocusRef.current?.focus?.();
    };
  }, [open, onClose, preventClose]);
  if (!open) return null;
  return (
    <div
      className="modal-layer"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !preventClose) onClose?.();
      }}
    >
      <div ref={dialogRef} className={`modal modal--${width} ${className}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}>
        <header className="modal__header">
          <div>
            <h2>{title}</h2>
            {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
          </div>
          {!preventClose ? (
            <button ref={closeRef} className="icon-button" onClick={onClose} aria-label="Close">
              ×
            </button>
          ) : null}
        </header>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}

export function Tabs({ items, active, onChange, ariaLabel = 'Sections' }) {
  const onKeyDown = (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const current = Math.max(
      0,
      items.findIndex((item) => item.id === active),
    );
    const nextIndex =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? items.length - 1
          : event.key === 'ArrowRight'
            ? (current + 1) % items.length
            : (current - 1 + items.length) % items.length;
    onChange(items[nextIndex].id);
  };
  return (
    <div className="tabs" role="tablist" aria-label={ariaLabel} onKeyDown={onKeyDown}>
      {items.map((item) => (
        <button
          key={item.id}
          role="tab"
          aria-selected={active === item.id}
          tabIndex={active === item.id ? 0 : -1}
          className={active === item.id ? 'is-active' : ''}
          onClick={() => onChange(item.id)}
        >
          {item.icon ? <span>{item.icon}</span> : null}
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function Sparkline({ values = [], label = undefined }) {
  const points = useMemo(() => {
    if (!values.length) return '';
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    return values.map((value, index) => `${(index / Math.max(1, values.length - 1)) * 100},${28 - ((value - min) / span) * 24}`).join(' ');
  }, [values]);
  return (
    <svg className="sparkline" viewBox="0 0 100 32" role="img" aria-label={label || 'Trend'} preserveAspectRatio="none">
      <polyline points={points} fill="none" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function RiskPips({ risk }) {
  return (
    <span className="risk-pips" aria-label={`Risk ${risk} of 5`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <i key={value} className={value <= risk ? 'is-filled' : ''} />
      ))}
    </span>
  );
}

export function Divider({ label = undefined }) {
  return <div className="divider">{label ? <span>{label}</span> : null}</div>;
}

export function NumberDelta({ value }) {
  const positive = value >= 0;
  return (
    <span className={positive ? 'delta delta--positive' : 'delta delta--negative'}>
      {positive ? '+' : ''}
      {value}
    </span>
  );
}

/** Rank movement arrow: positive = moved up. */
export function RankChange({ change }) {
  if (!change) return <span className="rank-change rank-change--flat">–</span>;
  return <span className={`rank-change rank-change--${change > 0 ? 'up' : 'down'}`}>{change > 0 ? `▲${change}` : `▼${-change}`}</span>;
}
