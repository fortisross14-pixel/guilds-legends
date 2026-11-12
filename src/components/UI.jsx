import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { normalizeClassId } from '../data/content.js';
import { PRIMALS, RARITIES } from '../data/world.js';
import { ASSETS } from '../data/assets.js';
import { useAssetUrl } from './Asset.jsx';
import Icon from './Icon.jsx';
const CREST_SIZES = { xs: 26, sm: 32, md: 42, lg: 56, xl: 84 };

// The guild crest: an engraved shield with a lantern star, in brass and wine.
export function Crest({ size = 'md' }) {
  const width = CREST_SIZES[size] || 42;
  return (
    <div className={`crest crest--${size}`}>
      <svg width={width} height={Math.round(width * 1.15)} viewBox="0 0 40 46" role="img" aria-label="Guild crest">
        <defs>
          <linearGradient id="crest-brass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f6dc9a" />
            <stop offset=".55" stopColor="#c9a05a" />
            <stop offset="1" stopColor="#7d5a26" />
          </linearGradient>
          <linearGradient id="crest-field" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7a2232" />
            <stop offset="1" stopColor="#3a0f18" />
          </linearGradient>
        </defs>
        <path d="M20 1.5 37 7v13.5C37 32 29.5 40.5 20 44.5 10.5 40.5 3 32 3 20.5V7z" fill="url(#crest-brass)" />
        <path d="M20 5 33.5 9.6v11c0 9.6-6 16.8-13.5 20.3C12.5 37.4 6.5 30.2 6.5 20.6v-11z" fill="url(#crest-field)" />
        <path d="M20 10.5l2.3 7.2 7.2 2.3-7.2 2.3L20 29.5l-2.3-7.2-7.2-2.3 7.2-2.3z" fill="#fff1cf" />
        <circle cx="20" cy="20" r="2.2" fill="#f6dc9a" />
      </svg>
    </div>
  );
}

/** URL of a public art file, safe under the GitHub Pages subpath. */
export function artUrl(path) {
  // Absolute, because a relative url() inside a CSS variable resolves against the
  // stylesheet (assets/), not the page, and the art would 404.
  const relative = `${import.meta.env.BASE_URL}${path}`;
  return typeof document === 'undefined' ? relative : new URL(relative, document.baseURI).href;
}

/** Inline style that sets a scene backdrop from an asset id (see `.scene` in art.css and src/data/assets.js). */
export function useSceneStyle(assetId, extra = {}) {
  const url = useAssetUrl(assetId);
  return { '--scene': url ? `url("${url}")` : 'none', ...extra };
}

export function heroArtKey(hero = {}) {
  return normalizeClassId(hero.classId || 'Guardian').toLowerCase();
}

// Hero portraits show a close-up of the hero's HeroEditor design (scripts/art/characters.py):
// the founder's own, a story hero's own, otherwise their class's. The old class portraits stand in.
const STORY_WALKERS = { nessa: 'npc.dunmere.nessa', bram: 'npc.dunmere.fighter' };
function heroLook(hero) {
  const id = hero.heroId || hero.id;
  return ASSETS[id === 'founder-player' ? 'char.founder' : STORY_WALKERS[hero.storyId] || `char.class.${heroArtKey(hero)}`] || null;
}
function heroBust(hero) {
  return heroLook(hero)?.bust || null;
}

export function HeroPortrait({ hero, size = 'md', showStatus = true }) {
  const classId = normalizeClassId(hero.classId);
  const bust = heroBust(hero);
  const primal = PRIMALS[hero.primal] || PRIMALS.Fire;
  const rarity = RARITIES[hero.rarity] || RARITIES.Common;
  return (
    <div
      className={`hero-portrait hero-portrait--${size} hero-portrait--r-${rarity.id.toLowerCase()}`}
      style={{
        '--portrait-frame': `var(--r-${rarity.id.toLowerCase()})`,
        '--portrait-primal': `var(--p-${primal.id.toLowerCase()})`,
        '--portrait-ground': `url(${artUrl(`art/primals/${primal.id.toLowerCase()}.png`)})`,
      }}
      role="img"
      aria-label={`${hero.name}, ${rarity.id} ${classId}`}
    >
      <img className={`hero-portrait__art${bust ? ' hero-portrait__art--bust' : ''}`} src={artUrl(bust || ASSETS['char.class.guardian']?.bust || '')} alt="" loading="lazy" />
      {showStatus && hero.status && hero.status !== 'available' ? <span className={`status-dot status-dot--${hero.status}`} title={hero.status} /> : null}
    </div>
  );
}

/**
 * Arrow keys move between the buttons of any element marked `data-menu`
 * (Up/Down, and Left/Right for horizontal menus); Enter activates natively.
 * Install once near the root.
 */
const MENU_ROW = 'button:not([disabled])';
const SELECTED_ROW = '.is-selected, .is-active, [aria-current="page"], [aria-selected="true"], [aria-pressed="true"], [aria-checked="true"]';

function rowsOf(menu) {
  return [...menu.querySelectorAll(MENU_ROW)].filter((item) => item.closest('[data-menu]') === menu && item.offsetParent !== null);
}

// Moves the menu's shared gem cursor next to `row` (or to the selected row, or hides it).
function placeGem(menu, row) {
  if (!menu || menu.dataset.menu === 'plain') return;
  let gem = menu.querySelector(':scope > .glide-gem');
  if (!gem) {
    gem = document.createElement('span');
    gem.className = 'glide-gem';
    gem.setAttribute('aria-hidden', 'true');
    menu.prepend(gem);
    menu.classList.add('has-glide');
  }
  const target = row || rowsOf(menu).find((item) => item.matches(SELECTED_ROW));
  if (!target) {
    gem.classList.remove('is-on');
    return;
  }
  const box = menu.getBoundingClientRect();
  const r = target.getBoundingClientRect();
  const x = r.left - box.left + menu.scrollLeft + 10;
  const y = r.top - box.top + menu.scrollTop + r.height / 2 - 6;
  gem.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  gem.classList.add('is-on');
}

function focusedRow(menu) {
  const active = document.activeElement;
  return active && menu.contains(active) && active.matches(MENU_ROW) ? active : null;
}

/** Places every menu's gem on its focused or selected row. */
export function syncMenuCursors(root = document) {
  root.querySelectorAll('[data-menu]').forEach((menu) => placeGem(menu, focusedRow(menu)));
}

export function useMenuKeys() {
  // The gem glides to whatever row is hovered or focused, and back to the selected row after.
  useEffect(() => {
    const rowAt = (target) => {
      const row = target instanceof Element ? target.closest(MENU_ROW) : null;
      const menu = row?.closest('[data-menu]');
      return menu && rowsOf(menu).includes(row) ? { menu, row } : null;
    };
    const onOver = (event) => {
      const hit = rowAt(event.target);
      if (hit) placeGem(hit.menu, hit.row);
    };
    const onOut = (event) => {
      const menu = event.target instanceof Element ? event.target.closest('[data-menu]') : null;
      if (!menu || (event.relatedTarget instanceof Node && menu.contains(event.relatedTarget))) return;
      placeGem(menu, focusedRow(menu));
    };
    document.addEventListener('pointerover', onOver);
    document.addEventListener('focusin', onOver);
    document.addEventListener('pointerout', onOut);
    document.addEventListener('focusout', onOut);
    return () => {
      document.removeEventListener('pointerover', onOver);
      document.removeEventListener('focusin', onOver);
      document.removeEventListener('pointerout', onOut);
      document.removeEventListener('focusout', onOut);
    };
  }, []);
  // After every render of the host, re-seat gems on the selected rows.
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => syncMenuCursors());
    return () => window.cancelAnimationFrame(frame);
  });
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
  const primal = PRIMALS[hero.primal] || PRIMALS.Fire;
  return (
    <div className={`hero-sprite hero-sprite--${size} ${enemy ? 'hero-sprite--enemy' : ''}`} style={{ '--sprite-glow': primal.color }}>
      {/* The hero's HeroEditor figure (heroes face right; the enemy side is mirrored in CSS). */}
      <img className={heroLook(hero)?.battle ? 'hero-sprite__figure' : ''} src={`${import.meta.env.BASE_URL}${heroLook(hero)?.battle || ASSETS['char.class.guardian']?.battle || ''}`} alt="" loading="lazy" />
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
      <i><Icon name={info.icon} size={14} tone="plain" /></i>
      {compact ? null : <span>{info.id}</span>}
    </span>
  );
}

export function RarityBadge({ rarity }) {
  const info = RARITIES[rarity] || { color: '#8f99a5', id: rarity || 'Common' };
  return (
    <span className={`rarity-badge rarity-badge--${String(info.id).toLowerCase()}`} style={{ '--rarity-color': `var(--r-${String(info.id).toLowerCase()}, ${info.color})` }}>
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
        <span className="progress__ghost" style={{ width: `${pct}%` }} />
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

/** Shows a short message in the app's message bar (App.jsx listens). */
export function toast(text, tone = 'blue') {
  window.dispatchEvent(new CustomEvent('gol:toast', { detail: { text, tone } }));
}

/**
 * A button. `why` explains a disabled button: tapping or long-pressing it says
 * why it can't be used (disabled buttons get no events, so a wrapper listens).
 */
export function Button({ children, variant = 'secondary', size = 'md', icon = undefined, className = '', why = null, ...props }) {
  const button = (
    <button className={`button button--${variant} button--${size} ${className}`} {...props}>
      {icon ? <span className="button__icon">{icon}</span> : null}
      <span>{children}</span>
    </button>
  );
  if (!props.disabled || !why) return button;
  return (
    <span className="why-wrap" role="presentation" onClick={() => toast(why, 'red')} onContextMenu={(event) => event.preventDefault()}>
      {button}
    </span>
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

export function EmptyState({ icon = 'gem', title, text, action = null }) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon"><Icon name={icon} size={28} /></span>
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
  // Bottom panels: swipe the header down to close (when the panel can close).
  const swipe = useRef(null);
  const onHeaderDown = (event) => {
    if (preventClose || event.target.closest('button')) return;
    swipe.current = { y: event.clientY };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const onHeaderMove = (event) => {
    if (!swipe.current || !dialogRef.current) return;
    const dy = Math.max(0, event.clientY - swipe.current.y);
    dialogRef.current.style.transform = dy ? `translateY(${dy}px)` : '';
  };
  const onHeaderUp = (event) => {
    if (!swipe.current) return;
    const dy = event.clientY - swipe.current.y;
    swipe.current = null;
    if (dialogRef.current) dialogRef.current.style.transform = '';
    if (dy > 90) onClose?.();
  };
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
        <header className="modal__header" onPointerDown={onHeaderDown} onPointerMove={onHeaderMove} onPointerUp={onHeaderUp} onPointerCancel={onHeaderUp}>
          {!preventClose ? <i className="modal__grab" aria-hidden="true" /> : null}
          <div>
            <h2>{title}</h2>
            {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
          </div>
          {!preventClose ? (
            <button ref={closeRef} className="close-button" onClick={onClose} aria-label="Close">
              <Icon name="close" size={18} tone="plain" />
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
          {item.icon ? <Icon name={item.icon} size={16} /> : null}
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

// Deterministic positions for the dust motes (no randomness in render).
const MOTES = Array.from({ length: 18 }, (_, index) => ({
  left: (index * 37 + 11) % 100,
  top: 30 + ((index * 53) % 65),
  size: 2 + (index % 3),
  delay: (index * 1.7) % 12,
  duration: 9 + (index % 5) * 2.5,
  dx: ((index % 4) - 1.5) * 26,
  opacity: 0.35 + (index % 4) * 0.15,
}));

/**
 * A full-viewport scene behind a place: the art with a slow drift, depth-of-field
 * blur at the top and bottom edges, warm bloom, vignette, a contrast scrim and dust.
 */
export function SceneBackdrop({ asset, focus = '50% 60%', dim = 0.35 }) {
  const style = useSceneStyle(asset, { '--focus': focus, '--dim': dim });
  return createPortal(
    <div className="scene-backdrop" style={style} data-asset={asset} aria-hidden="true">
      <div className="scene-backdrop__art" />
      <div className="scene-backdrop__dof scene-backdrop__dof--top" />
      <div className="scene-backdrop__dof scene-backdrop__dof--bottom" />
      <div className="scene-backdrop__bloom" />
      <div className="scene-backdrop__vignette" />
      <Motes />
    </div>,
    document.body,
  );
}

/** Drifting dust motes for a scene (hidden under reduced motion). */
export function Motes() {
  return (
    <div className="motes" aria-hidden="true">
      {MOTES.map((mote, index) => (
        <i
          key={index}
          style={{
            left: `${mote.left}%`,
            top: `${mote.top}%`,
            width: mote.size,
            height: mote.size,
            animationDelay: `${mote.delay}s`,
            animationDuration: `${mote.duration}s`,
            '--dx': `${mote.dx}px`,
            '--o': mote.opacity,
          }}
        />
      ))}
    </div>
  );
}

function prefersReducedMotion() {
  if (typeof window === 'undefined') return true;
  return document.documentElement.classList.contains('reduced-motion') || Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
}

/** Text that types itself out; `done` shows it all. Screen readers get the full text at once. */
export function TypeText({ text = '', speed = 22, done = false }) {
  const [count, setCount] = useState(() => (prefersReducedMotion() ? text.length : 0));
  useEffect(() => {
    if (prefersReducedMotion()) {
      setCount(text.length);
      return undefined;
    }
    setCount(0);
    const timer = window.setInterval(() => setCount((current) => (current >= text.length ? current : current + 2)), speed);
    return () => window.clearInterval(timer);
  }, [text, speed]);
  const shown = done ? text.length : Math.min(count, text.length);
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {text.slice(0, shown)}
        <span className="type-text__rest">{text.slice(shown)}</span>
      </span>
    </>
  );
}

/** A number that counts up from 0 (instant under reduced motion). */
export function CountUp({ value = 0, duration = 900 }) {
  const [shown, setShown] = useState(() => (prefersReducedMotion() ? value : 0));
  useEffect(() => {
    if (prefersReducedMotion()) {
      setShown(value);
      return undefined;
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [value, duration]);
  return <>{shown.toLocaleString()}</>;
}
