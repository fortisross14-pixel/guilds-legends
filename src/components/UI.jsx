import React, { useEffect, useMemo, useRef } from 'react';
import { CLASSES } from '../data/content.js';
import { PRIMALS, RARITIES } from '../data/world.js';

export function Crest({ variant = 'lantern', size = 'md' }) {
  return (
    <div className={`crest crest--${size}`} aria-label={`${variant} guild crest`}>
      <span className="crest__shield" />
      <span className="crest__mark">{variant === 'lantern' ? '✦' : variant === 'wolf' ? '◇' : variant === 'crown' ? '♛' : '◆'}</span>
    </div>
  );
}

export function HeroPortrait({ hero, size = 'md', showStatus = true }) {
  const info = CLASSES[hero.classId] || { glyph: '◆' };
  const initials = hero.name.split(' ').map((part) => part[0]).slice(0, 2).join('');
  const hue = Math.abs([...hero.id].reduce((sum, char) => sum + char.charCodeAt(0), 0)) % 360;
  return (
    <div className={`hero-portrait hero-portrait--${size}`} style={{ '--portrait-hue': hue }} aria-label={`${hero.name}, ${hero.classId}`}>
      <div className="hero-portrait__halo" />
      <span className="hero-portrait__glyph">{info.glyph}</span>
      <span className="hero-portrait__initials">{initials}</span>
      {showStatus && hero.status && hero.status !== 'available' ? <span className={`status-dot status-dot--${hero.status}`} title={hero.status} /> : null}
    </div>
  );
}


export function PrimalBadge({ primal, compact = false }) {
  const info = PRIMALS[primal] || { icon: '◇', color: '#8f99a5', id: primal || 'Unknown' };
  return <span className={`primal-badge ${compact ? 'primal-badge--compact' : ''}`} style={{ '--primal-color': info.color }} title={`${info.id}: strong against ${info.beats || '—'}, weak to ${info.weakTo || '—'}`}><i>{info.icon}</i>{compact ? null : <span>{info.id}</span>}</span>;
}

export function RarityBadge({ rarity }) {
  const info = RARITIES[rarity] || { color: '#8f99a5', id: rarity || 'Common' };
  return <span className="rarity-badge" style={{ '--rarity-color': info.color }}>{info.id}</span>;
}

export function LevelBadge({ hero, showXp = false }) {
  const level = hero?.level || 1;
  return <span className="level-badge" title={showXp && level < 20 ? `${hero.xp || 0} XP toward the next level` : level >= 20 ? 'Maximum level' : `Level ${level}`}><small>LV</small><strong>{level}</strong>{showXp && level < 20 ? <em>{hero.xp || 0} XP</em> : null}</span>;
}

export function ProgressBar({ value, max = 100, label = undefined, tone = 'gold', compact = false }) {
  const pct = max <= 0 ? 0 : Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={`progress ${compact ? 'progress--compact' : ''}`}>
      {label ? <div className="progress__label"><span>{label}</span><strong>{Math.round(value)}/{Math.round(max)}</strong></div> : null}
      <div className="progress__track"><span className={`progress__fill progress__fill--${tone}`} style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

export function Stat({ label, value, sub = undefined, icon = undefined, tone = 'neutral' }) {
  return (
    <div className={`stat stat--${tone}`}>
      {icon ? <span className="stat__icon">{icon}</span> : null}
      <div><span className="stat__label">{label}</span><strong className="stat__value">{value}</strong>{sub ? <span className="stat__sub">{sub}</span> : null}</div>
    </div>
  );
}

export function Badge({ children, tone = 'neutral', title = undefined }) {
  return <span className={`badge badge--${tone}`} title={title}>{children}</span>;
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
      {(title || eyebrow || action) ? (
        <header className="panel__header">
          <div>{eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}{title ? <h2>{title}</h2> : null}</div>
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

export function Modal({ open, title, eyebrow = undefined, children, onClose = undefined, width = 'wide', preventClose = false }) {
  const closeRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape' && !preventClose) onClose?.();
    };
    window.addEventListener('keydown', onKey);
    window.requestAnimationFrame(() => closeRef.current?.focus());
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, preventClose]);
  if (!open) return null;
  return (
    <div className="modal-layer" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !preventClose) onClose?.();
    }}>
      <div className={`modal modal--${width}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal__header">
          <div>{eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}<h2>{title}</h2></div>
          {!preventClose ? <button ref={closeRef} className="icon-button" onClick={onClose} aria-label="Close">×</button> : null}
        </header>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}

export function Tabs({ items, active, onChange, ariaLabel = 'Sections' }) {
  return (
    <div className="tabs" role="tablist" aria-label={ariaLabel}>
      {items.map((item) => (
        <button key={item.id} role="tab" aria-selected={active === item.id} className={active === item.id ? 'is-active' : ''} onClick={() => onChange(item.id)}>
          {item.icon ? <span>{item.icon}</span> : null}{item.label}
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
  return <span className="risk-pips" aria-label={`Risk ${risk} of 5`}>{[1, 2, 3, 4, 5].map((value) => <i key={value} className={value <= risk ? 'is-filled' : ''} />)}</span>;
}

export function Divider({ label = undefined }) {
  return <div className="divider">{label ? <span>{label}</span> : null}</div>;
}

export function NumberDelta({ value }) {
  const positive = value >= 0;
  return <span className={positive ? 'delta delta--positive' : 'delta delta--negative'}>{positive ? '+' : ''}{value}</span>;
}
