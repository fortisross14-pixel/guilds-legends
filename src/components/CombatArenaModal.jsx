import React, { useEffect, useMemo, useRef, useState } from 'react';
import { COMMANDS, previewCommand, turnOrder } from '../game/combat.js';
import { SKILLS, STATUSES, skillLabel } from '../data/skills.js';
import { ITEMS } from '../data/items.js';
import { Button, HeroSprite, Modal, Motes, useSceneStyle } from './UI.jsx';
import Asset from './Asset.jsx';
import Icon from './Icon.jsx';
import { playSound } from '../audio/sfx.js';
import { DRAG_SLOP, LONG_PRESS_MS, dragEnabled, haptic } from './gestures.js';

// Battle background asset id (src/data/assets.js): the encounter's own, the
// arena for tournaments, the slice's wild areas by name, else the primal.
const AREA_BATTLES = [
  [/old road/i, 'bg.battle.oldroad'],
  [/thornwood/i, 'bg.battle.thornwood'],
  [/blackwood/i, 'bg.battle.blackwood'],
];
export function battleBackground(encounter, locationPrimal) {
  if (!encounter) return 'bg.battle.arena';
  if (encounter.background) return encounter.background;
  if (encounter.mode === 'duel' || /tournament|championship|challenge/i.test(encounter.sourceType || '')) return 'bg.battle.arena';
  const area = AREA_BATTLES.find(([pattern]) => pattern.test(`${encounter.title || ''} ${encounter.objective || ''}`));
  if (area) return area[1];
  const primal = locationPrimal || encounter.enemies?.[0]?.primal || 'Plant';
  return `bg.battle.${String(primal).toLowerCase()}`;
}

// Beat lengths at 1× speed (ms). An attack is about 400 ms.
const BEAT = { attack: 420, skill: 480, item: 420, defend: 220, stunned: 360, tick: 560, phase: 1300, charge: 1100, interrupt: 1000, enrage: 900, flee: 900, retreat: 500, fleeFailed: 800, victory: 300, defeat: 300 };
const INTENT_ICONS = { attack: '⚔', spell: '✦', heal: '✚', buff: '▲', guard: '◆', taunt: '!', flee: '↯', charge: '☄', debuff: '▼' };
const PROFILE_NAMES = { brute: 'Brute', caster: 'Caster', healer: 'Healer', skirmisher: 'Skirmisher', tank: 'Tank' };
const STATUS_FX = { poison: 'poison', burn: 'fire', regen: 'heal' };

function commandLabel(command, unit) {
  if (!command) return '…';
  if (command.action === 'skill') return skillLabel(SKILLS[command.skillId], unit.primal);
  if (command.action === 'item') return ITEMS[command.itemId]?.name;
  return COMMANDS.find((item) => item.id === command.action)?.label;
}

const encounterKey = (encounter) => (encounter ? `${encounter.id}:${encounter.turn}:${encounter.status}:${encounter.log.length}:${encounter.events?.length || 0}` : null);

/**
 * Replays the last round's events (encounter.events) beat by beat. While it
 * runs, `display` holds each unit's HP/MP/KO as of the current beat.
 */
function useReplay(encounter, speed, boost, settings) {
  const shown = useRef(null);
  const live = useRef(encounter);
  const speedRef = useRef(speed);
  const settingsRef = useRef(settings);
  const boostRef = useRef(boost);
  boostRef.current = boost;
  live.current = encounter;
  speedRef.current = speed;
  settingsRef.current = settings;
  const [replay, setReplay] = useState(null);
  const key = encounterKey(encounter);

  useEffect(() => {
    const current = live.current;
    const before = shown.current;
    shown.current = current;
    if (!current || !before || before.id !== current.id || !current.events?.length) {
      setReplay(null);
      return undefined;
    }
    const display = {};
    [...before.party, ...before.enemies].forEach((unit) => (display[unit.id] = { hp: unit.hp, mp: unit.mp, ko: unit.ko, status: unit.status }));
    [...current.party, ...current.enemies].forEach((unit) => {
      if (!display[unit.id]) display[unit.id] = { hp: unit.hp, mp: unit.mp, ko: false, hidden: true, status: {} };
    });
    const order = turnOrder(before);
    const events = current.events;
    let index = 0;
    let timer = 0;
    let cancelled = false;
    const step = () => {
      if (cancelled) return;
      if (index >= events.length) {
        setReplay(null);
        if (current.status !== 'active') playSound(current.result?.playerWon ? 'victory' : 'defeat');
        return;
      }
      const beat = events[index];
      index += 1;
      if (beat.mp !== undefined && display[beat.actorId]) display[beat.actorId] = { ...display[beat.actorId], mp: beat.mp };
      beat.hits.forEach((hit) => {
        const unit = display[hit.targetId];
        if (!unit) return;
        display[hit.targetId] = {
          ...unit,
          hp: hit.hp ?? unit.hp,
          mp: hit.mp ?? unit.mp,
          ko: hit.ko ? true : hit.type === 'revive' ? false : unit.ko,
          hidden: hit.type === 'summon' ? false : unit.hidden,
        };
      });
      if (beat.kind === 'flee' && display[beat.actorId]) display[beat.actorId] = { ...display[beat.actorId], ko: true, fled: true };
      const crit = beat.hits.some((hit) => hit.crit);
      if (beat.hits.some((hit) => hit.type === 'damage')) {
        playSound(crit ? 'crit' : 'hit');
        haptic(beat.hits.some((hit) => hit.ko) ? 'ko' : crit ? 'crit' : 'hit', settingsRef.current);
      }
      else if (beat.hits.some((hit) => hit.type === 'heal' || hit.type === 'revive')) playSound('heal');
      setReplay({ display: { ...display }, beat, order, shake: crit || beat.kind === 'phase' || (beat.big && beat.hits.length > 0) });
      // Holding anywhere fast-forwards (boost).
      timer = window.setTimeout(step, (BEAT[beat.kind] || 420) / ((speedRef.current || 1) * (boostRef.current?.current || 1)));
    };
    step();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [key]);

  return replay;
}

/** An HP or MP bar that eases down, with a lagging "damage ghost" behind it. */
function Meter({ value, max, kind }) {
  const pct = max ? Math.max(0, Math.min(1, value / max)) : 0;
  const [ghost, setGhost] = useState(pct);
  useEffect(() => {
    if (pct >= ghost) {
      setGhost(pct);
      return undefined;
    }
    const timer = window.setTimeout(() => setGhost(pct), 380);
    return () => window.clearTimeout(timer);
    // The ghost only follows `pct`; reading it here is intended.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pct]);
  return (
    <span className={`meter meter--${kind} ${kind === 'hp' && pct <= 0.3 ? 'is-low' : ''}`} role="meter" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={`${kind.toUpperCase()} ${value} of ${max}`}>
      <i className="meter__ghost" style={{ width: `${ghost * 100}%` }} />
      <i className="meter__fill" style={{ width: `${pct * 100}%` }} />
      <b>
        {kind === 'hp' ? 'HP' : 'MP'} {value}/{max}
      </b>
    </span>
  );
}

function StatusIcons({ status }) {
  const keys = Object.keys(status || {}).filter((key) => STATUSES[key] && status[key] > 0);
  if (!keys.length) return null;
  return (
    <span className="status-icons">
      {keys.map((key) => (
        <span key={key} className={`status-icon status-icon--${STATUSES[key].bad ? 'bad' : 'good'}`} title={`${STATUSES[key].label}: ${STATUSES[key].description}`}>
          <Icon name={STATUSES[key].icon} size={14} tone="plain" />
          <sub>{status[key]}</sub>
        </span>
      ))}
    </span>
  );
}

function EnemyArt({ unit }) {
  if (unit.sprite?.kind === 'enemy') return <Asset id={`battle.${unit.sprite.key}`} className="battle-enemy__art" />;
  return <HeroSprite hero={unit} size="lg" enemy />;
}

/** Floating number and effect sprite on a unit for the current beat. */
function BeatMarks({ beat, unitId }) {
  if (!beat) return null;
  const hit = beat.hits.find((item) => item.targetId === unitId);
  if (!hit) return null;
  const fx = beat.kind === 'tick' ? STATUS_FX[hit.status] : hit.type === 'miss' ? null : beat.fx;
  let text = null;
  let tone = 'hit';
  if (hit.type === 'miss') {
    text = 'MISS';
    tone = 'miss';
  } else if (hit.type === 'damage') text = hit.amount;
  else if (hit.type === 'heal' || hit.type === 'revive') {
    text = `+${hit.amount}`;
    tone = 'heal';
  } else if (hit.type === 'status' && STATUSES[hit.status]) {
    text = STATUSES[hit.status].label;
    tone = STATUSES[hit.status].bad ? 'debuff' : 'buff';
  } else if (hit.type === 'resist') {
    text = 'RESIST';
    tone = 'miss';
  }
  const tags = [hit.crit ? 'CRIT' : null, hit.tag, hit.status && hit.type === 'damage' && beat.kind !== 'tick' ? STATUSES[hit.status]?.label : null].filter(Boolean);
  return (
    <>
      {fx ? (
        <span className="fx-wrap" aria-hidden="true" key={`fx-${beat.seq}`}>
          <Asset id={`fx.${fx}`} className="fx" />
        </span>
      ) : null}
      {text !== null ? (
        <span className={`dmg-pop dmg-pop--${tone} ${hit.crit ? 'is-crit' : ''}`} aria-hidden="true" key={`pop-${beat.seq}`}>
          {text}
          {tags.length ? <small>{tags.join(' · ')}</small> : null}
        </span>
      ) : null}
    </>
  );
}

/** What dropping on this target would do (the first action of its radial menu). */
function PreviewChip({ preview }) {
  if (!preview) return null;
  const value =
    preview.kind === 'damage' ? `${preview.min}–${preview.max}` : preview.kind === 'heal' ? `+${preview.min}` : preview.kind === 'revive' ? `Revive ${preview.min}` : preview.note || 'Effect';
  return (
    <span className={`target-preview is-selected ${preview.kind === 'heal' || preview.kind === 'revive' ? 'is-heal' : ''}`}>
      <strong>
        {preview.lethal ? <Icon name="skull" size={14} tone="plain" /> : null}
        {value}
      </strong>
      {preview.tag ? <em className={`target-preview__tag target-preview__tag--${preview.tag.toLowerCase()}`}>{preview.tag}</em> : null}
      {preview.kind === 'damage' ? <small>{Math.round((preview.hit ?? 1) * 100)}% hit</small> : null}
    </span>
  );
}

export default function CombatArenaModal({ encounter, actions, locationPrimal, speed = 1, settings = {} }) {
  const [commands, setCommands] = useState({});
  const [actorId, setActorId] = useState(null);
  const [radial, setRadial] = useState(null);
  const [hoverOption, setHoverOption] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [info, setInfo] = useState(null);
  const [auto, setAuto] = useState(false);
  const [intro, setIntro] = useState(() => encounter?.intro || null);
  const boost = useRef(1);
  const [boosting, setBoosting] = useState(false);
  const replay = useReplay(encounter, speed, boost, settings);
  const stageStyle = useSceneStyle(battleBackground(encounter, locationPrimal));
  const turnKey = encounter ? `${encounter.id}:${encounter.turn}:${encounter.status}` : null;
  const replaying = Boolean(replay);
  const lineRef = useRef(null);
  // The dragged hero's ghost, and where the finger was when the drag began.
  const ghostRef = useRef(null);
  const dragFrom = useRef({ x: 0, y: 0 });
  // The party stands just above the command HUD, whatever its height on this screen.
  const screenRef = useRef(null);
  const hudRef = useRef(null);
  useEffect(() => {
    if (!hudRef.current || typeof ResizeObserver === 'undefined') return undefined;
    // The command panel floats above the HUD box, so measure from whichever top is higher.
    const measure = () => {
      const screen = screenRef.current?.getBoundingClientRect();
      if (!screen || !hudRef.current) return;
      const tops = [hudRef.current, ...hudRef.current.children].filter((element) => getComputedStyle(element).position !== 'fixed').map((element) => element.getBoundingClientRect().top).filter((top) => top > screen.top);
      screenRef.current.style.setProperty('--battle-hud-h', `${Math.max(0, screen.bottom - Math.min(...tops))}px`);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(hudRef.current);
    [...hudRef.current.children].forEach((element) => observer.observe(element));
    measure();
    return () => observer.disconnect();
  }, []);
  const press = useRef(null);
  const canDrag = dragEnabled(settings);

  useEffect(() => {
    setCommands({});
    setActorId(null);
    setRadial(null);
    setDragging(null);
  }, [turnKey]);

  // The boss's intro line, shown when the battle opens.
  useEffect(() => {
    if (!intro) return undefined;
    const timer = window.setTimeout(() => setIntro(null), 2800);
    return () => window.clearTimeout(timer);
  }, [intro]);

  // Auto-battle: when the round is ready, let the party AI choose.
  useEffect(() => {
    if (!auto || replaying || intro || !encounter || encounter.status !== 'active') return undefined;
    const timer = window.setTimeout(() => actions.combatRound({}), 380 / speed);
    return () => window.clearTimeout(timer);
  }, [auto, replaying, intro, turnKey, encounter, actions, speed]);

  const livingParty = useMemo(() => (encounter ? encounter.party.filter((unit) => !unit.ko) : []), [encounter]);
  const ready = !replaying && !auto && encounter?.status === 'active';
  const active = ready ? livingParty.find((unit) => !commands[unit.id]) || null : null;
  const actor = ready ? livingParty.find((unit) => unit.id === (dragging?.actorId || radial?.actorId || actorId)) || active : null;

  if (!encounter) return null;
  const finished = encounter.status !== 'active';
  const display = replay?.display || null;
  const beat = replay?.beat || null;
  const units = [...encounter.party, ...encounter.enemies];
  const unitById = (id) => units.find((unit) => unit.id === id) || null;
  const view = (unit) => {
    const shown = display?.[unit.id];
    return shown ? { ...unit, hp: shown.hp, mp: shown.mp, ko: shown.ko, hidden: shown.hidden, status: shown.status || unit.status } : unit;
  };

  const reservedItems = Object.values(commands).reduce((counts, command) => {
    if (command.action === 'item') counts[command.itemId] = (counts[command.itemId] || 0) + 1;
    return counts;
  }, {});
  const itemsLeft = Object.entries(encounter.items || {})
    .map(([id, count]) => [id, count - (reservedItems[id] || 0)])
    .filter(([, count]) => count > 0);
  const optionsOn = (who, target) => (who && target && !target.hidden ? actionsFor(encounter, who, target, itemsLeft) : []);

  const commit = (unit, command) => {
    const next = { ...commands, [unit.id]: command };
    setRadial(null);
    setHoverOption(null);
    setActorId(null);
    haptic('drop', settings);
    if (!settings.seenHints?.battleDrag) actions.updateSettings({ seenHints: { ...(settings.seenHints || {}), battleDrag: true } });
    if (livingParty.every((hero) => next[hero.id])) {
      setCommands({});
      actions.combatRound(next);
    } else setCommands(next);
  };
  const cancel = () => {
    setRadial(null);
    setHoverOption(null);
    setDragging(null);
  };
  const openRadial = (who, target, x, y, drag = false) => {
    const options = optionsOn(who, target);
    if (!options.length) return false;
    setRadial({ actorId: who.id, targetId: target.id, x, y, drag });
    setHoverOption(null);
    return true;
  };
  const choose = (option) => {
    if (!radial) return;
    const who = unitById(radial.actorId);
    if (option.disabled) {
      haptic('error', settings);
      return;
    }
    commit(who, option.command);
  };

  // ---------------------------------------------------------------- pointer: tap, long-press, drag
  const unitAt = (x, y) => unitById(document.elementFromPoint(x, y)?.closest?.('[data-unit-id]')?.dataset.unitId);
  const optionAt = (x, y) => {
    const index = document.elementFromPoint(x, y)?.closest?.('[data-radial-index]')?.dataset.radialIndex;
    return index === undefined ? null : Number(index);
  };
  const onUnitPointerDown = (unit, event, fromSprite = true) => {
    event.stopPropagation();
    if (event.button > 0) return;
    const state = { unit, x: event.clientX, y: event.clientY, fired: false, drag: false, over: null, dwell: 0 };
    press.current = state;
    const long = window.setTimeout(() => {
      state.fired = true;
      setInfo(unit.id);
      haptic('tap', settings);
    }, LONG_PRESS_MS);
    const startRect = event.currentTarget.getBoundingClientRect();
    const origin = { x: startRect.left + startRect.width / 2, y: startRect.top + startRect.height / 2 };
    const draggable = fromSprite && canDrag && ready && unit.side === 'party' && !unit.ko;
    const move = (moveEvent) => {
      const { clientX: x, clientY: y } = moveEvent;
      if (!state.drag) {
        if (Math.hypot(x - state.x, y - state.y) < DRAG_SLOP) return;
        window.clearTimeout(long);
        if (!draggable || state.fired) return;
        state.drag = true;
        dragFrom.current = { x, y };
        setRadial(null);
        setDragging({ actorId: unit.id, overId: null });
      }
      moveEvent.preventDefault();
      // The hero's ghost follows the finger.
      if (ghostRef.current) ghostRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      lineRef.current?.setAttribute('x1', origin.x);
      lineRef.current?.setAttribute('y1', origin.y);
      lineRef.current?.setAttribute('x2', x);
      lineRef.current?.setAttribute('y2', y);
      if (state.radial) {
        const index = optionAt(x, y);
        setHoverOption((current) => (current === index ? current : index));
        return;
      }
      const over = unitAt(x, y);
      if (over?.id !== state.over?.id) {
        state.over = over;
        window.clearTimeout(state.dwell);
        setDragging({ actorId: unit.id, overId: over?.id || null });
        // Resting on a target opens the radial menu under the thumb: keep dragging onto an action and release.
        if (over && optionsOn(unit, over).length) {
          state.dwell = window.setTimeout(() => {
            state.radial = openRadial(unit, over, x, y, true);
          }, 260);
        }
      }
    };
    const up = (upEvent) => {
      window.clearTimeout(long);
      window.clearTimeout(state.dwell);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', abort);
      press.current = null;
      if (state.fired) return;
      if (!state.drag) {
        tapUnit(unit);
        return;
      }
      setDragging(null);
      const { clientX: x, clientY: y } = upEvent;
      if (state.radial) {
        const index = optionAt(x, y);
        const options = optionsOn(unit, state.over);
        if (index !== null && options[index]) choose({ ...options[index] });
        else if (state.over && unitAt(x, y)?.id === state.over.id) setRadial((current) => (current ? { ...current, drag: false } : current));
        else cancel();
        return;
      }
      const target = unitAt(x, y);
      if (!target || !openRadial(unit, target, x, y)) cancel();
    };
    const abort = () => {
      window.clearTimeout(long);
      window.clearTimeout(state.dwell);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', abort);
      press.current = null;
      cancel();
    };
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', abort);
  };

  // Tap fallback: tap a hero, then tap a target, then the same radial menu.
  const tapUnit = (unit) => {
    if (!ready) {
      setInfo(info === unit.id ? null : unit.id);
      return;
    }
    const who = livingParty.find((hero) => hero.id === actorId);
    if (!who && unit.side === 'party' && !unit.ko) {
      setActorId(unit.id);
      setRadial(null);
      haptic('tap', settings);
      return;
    }
    const rect = document.querySelector(`[data-unit-id="${unit.id}"]`)?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
    if (!openRadial(who || active, unit, x, y)) haptic('error', settings);
  };

  // Hold anywhere during the round's animation to fast-forward it.
  const onStagePointerDown = () => {
    if (!replaying) return;
    boost.current = 4;
    setBoosting(true);
  };
  const stopBoost = () => {
    if (boost.current === 1) return;
    boost.current = 1;
    setBoosting(false);
  };

  const undo = () => {
    const chosen = livingParty.filter((unit) => commands[unit.id]);
    const last = chosen[chosen.length - 1];
    if (!last) return;
    const next = { ...commands };
    delete next[last.id];
    setCommands(next);
    cancel();
  };

  // ---------------------------------------------------------------- what to highlight
  const dragActor = dragging ? unitById(dragging.actorId) : null;
  const radialActor = radial ? unitById(radial.actorId) : null;
  const radialTarget = radial ? unitById(radial.targetId) : null;
  const radialOptions = radial ? optionsOn(radialActor, radialTarget) : [];
  const hovered = hoverOption !== null ? radialOptions[hoverOption] : null;
  const affected = new Set(hovered?.area ? units.filter((unit) => !unit.ko && !unit.hidden && unit.side === (hovered.area === 'enemies' ? 'enemy' : 'party')).map((unit) => unit.id) : []);
  const targetable = (unit) => Boolean(dragActor) && optionsOn(dragActor, unit).length > 0;
  const overPreview = dragging?.overId && dragActor ? previewOf(encounter, dragActor, unitById(dragging.overId), optionsOn(dragActor, unitById(dragging.overId))[0]) : null;

  const unitClass = (unit) => {
    const hit = beat?.hits.find((item) => item.targetId === unit.id);
    return [
      unit.ko ? 'is-ko' : '',
      unit.hidden ? 'is-hidden' : '',
      display?.[unit.id]?.fled ? 'is-fled' : '',
      beat?.actorId === unit.id && ['attack', 'skill', 'item'].includes(beat.kind) ? `is-acting is-acting--${unit.side}` : '',
      beat?.actorId === unit.id && ['charge', 'phase', 'enrage'].includes(beat.kind) ? 'is-powering' : '',
      hit && hit.type === 'damage' ? `is-hit ${hit.crit ? 'is-crit' : ''}` : '',
      hit && (hit.type === 'heal' || hit.type === 'revive') ? 'is-healed' : '',
      hit && hit.type === 'summon' ? 'is-summoned' : '',
      targetable(unit) ? 'is-targetable' : '',
      dragging?.overId === unit.id || radial?.targetId === unit.id || affected.has(unit.id) ? 'is-selected' : '',
      finished && !replaying && encounter.result?.playerWon && unit.side === 'party' && !unit.ko ? 'is-victory' : '',
      unit.charging ? 'is-charging' : '',
    ]
      .filter(Boolean)
      .join(' ');
  };
  const unitHandlers = (unit, fromSprite = true) => ({
    'data-unit-id': unit.id,
    onPointerDown: (event) => onUnitPointerDown(unit, event, fromSprite),
    // Taps are handled on pointer up; the click must not reach the stage (which cancels).
    onClick: (event) => event.stopPropagation(),
    onContextMenu: (event) => event.preventDefault(),
  });

  const order = replay?.order || turnOrder(encounter);
  const intent = encounter.enemyIntent;
  const infoUnit = info ? unitById(info) : null;
  const wildWipe = finished && encounter.sourceType === 'wild' && !encounter.result?.playerWon && encounter.result?.method !== 'withdrew';
  const showHand = canDrag && ready && !settings.seenHints?.battleDrag && !dragging && !radial;

  return (
    <Modal open title={encounter.title || 'Battle'} eyebrow={`${encounter.roundName || 'Battle'} · Round ${encounter.turn}`} preventClose width="wide" className="battle-modal">
      <div
        ref={screenRef}
        className={`battle-screen battle-screen--${encounter.mode} ${replay?.shake ? 'is-shaking' : ''} ${boosting ? 'is-boosting' : ''}`}
        style={{ '--speed': speed * (boosting ? 4 : 1) }}
        onPointerDown={onStagePointerDown}
        onPointerUp={stopBoost}
        onPointerCancel={stopBoost}
        onPointerLeave={stopBoost}
      >
        <section
          className="battle-stage scene"
          style={stageStyle}
          data-asset={battleBackground(encounter, locationPrimal)}
          aria-label="Battlefield"
          onClick={() => {
            if (!press.current) {
              cancel();
              setActorId(null);
              setInfo(null);
            }
          }}
        >
          <Motes />
          {encounter.hints?.length && !finished ? <p className="battle-hint">{encounter.hints[Math.min(encounter.turn - 1, encounter.hints.length - 1)]}</p> : null}
          {boosting ? <span className="battle-boost" aria-hidden="true">»</span> : null}

          {!finished ? (
            <ol className="turn-order" aria-label="Turn order">
              {order.map((turn, index) => {
                const unit = unitById(turn.unitId);
                if (!unit) return null;
                const now = replaying && beat?.actorId === unit.id && turn.round === encounter.turn - 1;
                return (
                  <li
                    key={`${turn.unitId}-${index}`}
                    className={`turn-order__slot turn-order__slot--${turn.side} ${turn.skip ? 'is-skipped' : ''} ${now ? 'is-now' : ''} ${index > 0 && order[index - 1].round !== turn.round ? 'is-next-round' : ''}`}
                    {...longPressOnly(() => setInfo(unit.id))}
                  >
                    {unit.side === 'enemy' && unit.sprite?.kind === 'enemy' ? <Asset id={`battle.${unit.sprite.key}`} /> : <HeroSprite hero={unit} size="xs" enemy={unit.side === 'enemy'} />}
                    <span>{unit.name.split(' ')[0]}</span>
                  </li>
                );
              })}
            </ol>
          ) : null}

          {!finished && intent && !replaying ? (
            <div className={`battle-tell ${intent.big ? 'battle-tell--danger' : ''}`}>
              <strong>Tell</strong> {intent.telegraph}
            </div>
          ) : null}

          {beat?.banner || intro ? (
            <div className={`battle-banner ${beat?.kind ? `battle-banner--${beat.kind}` : 'battle-banner--intro'}`} onClick={() => setIntro(null)}>
              {beat?.banner || intro}
            </div>
          ) : null}

          <div className="battle-enemies" aria-label="Enemies">
            {encounter.enemies.map((raw, index) => {
              const unit = view(raw);
              if (unit.hidden || (unit.fled && !display)) return null;
              const plan = !finished && !replaying ? encounter.intents?.[unit.id] : null;
              const target = plan?.targetId ? unitById(plan.targetId) : null;
              return (
                <button
                  key={unit.id}
                  type="button"
                  style={{ '--i': index }}
                  className={`battle-enemy ${unitClass(unit)} ${intent?.actorId === unit.id ? 'is-telling' : ''} ${unit.boss ? 'is-boss' : ''}`}
                  {...unitHandlers(unit)}
                  aria-label={`${unit.name}, ${unit.hp} of ${unit.maxHp} HP`}
                >
                  {plan && !unit.ko ? (
                    <span className={`intent intent--${plan.icon} ${plan.big ? 'is-big' : ''}`}>
                      <i aria-hidden="true">{plan.icon === 'taunt' ? '!' : <Icon name={INTENT_ICONS[plan.icon] || 'question'} size={14} tone="plain" />}</i>
                      {plan.label}
                      {target ? ` → ${target.name.split(' ')[0]}` : ''}
                    </span>
                  ) : null}
                  {dragging?.overId === unit.id && overPreview ? <PreviewChip preview={overPreview} /> : null}
                  <EnemyArt unit={unit} />
                  <strong>{unit.name}</strong>
                  <Meter value={unit.hp} max={unit.maxHp} kind="hp" />
                  <StatusIcons status={unit.status} />
                  <BeatMarks beat={beat} unitId={unit.id} />
                </button>
              );
            })}
          </div>

          <div className="battle-allies" aria-label="Your party on the field">
            {encounter.party.map((raw, index) => {
              const unit = view(raw);
              return (
                <button
                  key={unit.id}
                  type="button"
                  style={{ '--i': index }}
                  className={`battle-ally ${unitClass(unit)} ${actor?.id === unit.id && !finished ? 'is-active' : ''} ${canDrag && ready && !unit.ko ? 'is-draggable' : ''} ${dragging?.actorId === unit.id ? 'is-lifted' : ''}`}
                  {...unitHandlers(unit)}
                  aria-label={`${unit.name}: drag onto a target`}
                >
                  {dragging?.overId === unit.id && overPreview ? <PreviewChip preview={overPreview} /> : null}
                  <HeroSprite hero={unit} size="md" />
                  <BeatMarks beat={beat} unitId={unit.id} />
                </button>
              );
            })}
          </div>

          {infoUnit ? <UnitInfo unit={view(infoUnit)} intent={encounter.intents?.[infoUnit.id]} onClose={() => setInfo(null)} /> : null}

          {finished && !replaying ? (
            <section className={`battle-result battle-result--${encounter.result?.playerWon ? 'won' : 'lost'} panel`} onClick={(event) => event.stopPropagation()}>
              <h3>{encounter.result?.playerWon ? 'Victory!' : encounter.result?.method === 'withdrew' ? 'You withdrew' : 'Defeat'}</h3>
              <p>
                {encounter.result?.turns} round{encounter.result?.turns === 1 ? '' : 's'} · party HP {encounter.result?.playerHpPct}%
              </p>
              <ul className="battle-result__damage">
                {encounter.party.map((unit) => (
                  <li key={unit.id}>
                    <span>{unit.name}</span>
                    <i style={{ width: `${Math.round(((encounter.result?.damageByHero?.[unit.heroId] || 0) / Math.max(1, encounter.result?.playerDamage || 1)) * 100)}%` }} />
                    <b>{encounter.result?.damageByHero?.[unit.heroId] || 0}</b>
                  </li>
                ))}
              </ul>
              {wildWipe ? (
                <>
                  <p className="battle-result__note">The party falls. Retry, or carry the wounded back to camp.</p>
                  <div className="battle-result__actions">
                    <Button variant="primary" size="lg" onClick={actions.retryWildBattle}>
                      Retry battle
                    </Button>
                    <Button size="lg" onClick={actions.retreatToCamp}>
                      Retreat to camp
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {encounter.result?.knockedOut?.length ? <p className="battle-result__note">{encounter.result.knockedOut.length} knocked out: they may be injured.</p> : null}
                  <Button variant="primary" size="lg" onClick={actions.concludeCombat}>
                    Continue
                  </Button>
                </>
              )}
            </section>
          ) : null}

          {showHand ? (
            <div className="gesture-hint gesture-hint--battle" aria-hidden="true">
              <span className="gesture-hint__hand"><Icon name="hand" size={22} tone="brass" /></span>
              <small>Drag a hero onto an enemy</small>
            </div>
          ) : null}
        </section>

        <div className="battle-hud" ref={hudRef}>
          {!finished ? (
            <section className="battle-commands panel" aria-label="Commands">
              {replaying ? (
                <span className="battle-commands__who">
                  {beat?.actorId ? `${unitById(beat.actorId)?.name || ''}${beat.label ? `: ${beat.label}` : ''}` : 'Resolving…'} <small>Hold to speed up</small>
                </span>
              ) : auto ? (
                <span className="battle-commands__who">Auto-battle is on</span>
              ) : actor ? (
                <span className="battle-commands__who">
                  <b>{actor.name}</b> <small>{canDrag ? 'Drag onto a target · tap = pick' : 'Tap a target'} · long-press = inspect</small>
                </span>
              ) : null}
              <div className="battle-commands__meta">
                <Button size="sm" variant="secondary" onClick={undo} disabled={!Object.keys(commands).length || replaying}>
                  Undo
                </Button>
                <Button size="sm" className={auto ? 'is-on' : ''} aria-pressed={auto} onClick={() => setAuto((value) => !value)}>
                  Auto {auto ? 'on' : 'off'}
                </Button>
                <Button size="sm" aria-label={`Battle speed ${speed}×`} onClick={() => actions.updateSettings({ battleSpeed: speed === 2 ? 1 : 2 })}>
                  {speed}×
                </Button>
                {encounter.canFlee ? (
                  <Button size="sm" variant="danger" disabled={replaying} onClick={actions.fleeCombat}>
                    Flee
                  </Button>
                ) : null}
              </div>
            </section>
          ) : null}

          <ol className="battle-log" aria-live="polite" aria-label="Battle messages">
            {encounter.log.slice(-4).map((entry, index) => (
              <li key={`${entry.turn}-${index}`} className={`battle-log__entry battle-log__entry--${entry.tone}`}>
                {entry.text}
              </li>
            ))}
          </ol>

          <section className="battle-party" aria-label="Your party">
            {encounter.party.map((raw) => {
              const unit = view(raw);
              return (
                <button
                  key={unit.id}
                  type="button"
                  className={`battle-hero ${unitClass(unit)} ${actor?.id === unit.id && !finished ? 'is-active' : ''}`}
                  {...unitHandlers(unit, false)}
                  aria-label={`${unit.name}, ${unit.hp} of ${unit.maxHp} HP`}
                >
                  <span className="battle-hero__info">
                    <strong>{unit.name}</strong>
                    <Meter value={unit.hp} max={unit.maxHp} kind="hp" />
                    <Meter value={unit.mp} max={unit.maxMp} kind="mp" />
                    <StatusIcons status={unit.status} />
                    {!finished && !replaying ? <em className="battle-hero__command">{commandLabel(commands[unit.id], unit)}</em> : null}
                  </span>
                </button>
              );
            })}
          </section>
        </div>

        {dragging ? (
          <svg className="drag-line" aria-hidden="true">
            <line ref={lineRef} />
          </svg>
        ) : null}
        {dragging && dragActor ? (
          <div className="drag-sprite" ref={ghostRef} style={{ transform: `translate3d(${dragFrom.current.x}px, ${dragFrom.current.y}px, 0)` }} aria-hidden="true">
            <HeroSprite hero={dragActor} size="sm" />
          </div>
        ) : null}

        {radial && radialTarget ? (
          <Radial
            radial={radial}
            options={radialOptions}
            hover={hoverOption}
            previews={radialOptions.map((option) => previewOf(encounter, radialActor, radialTarget, option))}
            onPick={choose}
            onCancel={cancel}
            onHover={setHoverOption}
          />
        ) : null}
      </div>
    </Modal>
  );
}

/** Long-press only (turn order icons): inspect the unit. */
function longPressOnly(onLongPress) {
  let timer = 0;
  const clear = () => window.clearTimeout(timer);
  return {
    onPointerDown: (event) => {
      event.stopPropagation();
      clear();
      timer = window.setTimeout(onLongPress, LONG_PRESS_MS);
    },
    onPointerUp: clear,
    onPointerLeave: clear,
    onContextMenu: (event) => event.preventDefault(),
  };
}

/**
 * The actions one hero can take on one target, for the radial menu.
 * Enemy: Attack and offensive skills/items. Ally: heals, buffs, items.
 * Fallen ally: revives. Self: Defend, self skills, items.
 */
function actionsFor(encounter, actor, target, itemsLeft) {
  const options = [];
  const self = target.id === actor.id;
  const enemy = target.side === 'enemy';
  const fallen = target.side === 'party' && target.ko;
  if (enemy && target.ko) return options;
  const fits = (kind) => {
    if (enemy) return ['enemy', 'allEnemies'].includes(kind);
    if (fallen) return kind === 'koAlly';
    if (self) return ['self', 'ally', 'allAllies'].includes(kind);
    return ['ally', 'allAllies'].includes(kind);
  };
  const withTarget = (kind) => (['enemy', 'ally', 'koAlly'].includes(kind) ? { targetId: target.id } : {});
  const area = (kind) => (kind === 'allEnemies' ? 'enemies' : kind === 'allAllies' ? 'allies' : null);
  if (enemy) options.push({ key: 'attack', label: 'Attack', icon: 'sword', command: { action: 'attack', targetId: target.id } });
  if (self && !fallen) options.push({ key: 'defend', label: 'Defend', icon: 'shield', command: { action: 'defend' } });
  (actor.skills || []).forEach((id) => {
    const skill = SKILLS[id];
    if (!skill || !fits(skill.target)) return;
    options.push({ key: id, label: skillLabel(skill, actor.primal), icon: 'star', cost: `${skill.mp} MP`, disabled: actor.mp < skill.mp, area: area(skill.target), command: { action: 'skill', skillId: id, ...withTarget(skill.target) } });
  });
  itemsLeft.forEach(([id, count]) => {
    const kind = ITEMS[id]?.battle?.target;
    if (!kind || !fits(kind)) return;
    options.push({ key: `item-${id}`, label: ITEMS[id].name, icon: 'cross', cost: `×${count}`, area: area(kind), command: { action: 'item', itemId: id, ...withTarget(kind) } });
  });
  return options;
}

function previewOf(encounter, actor, target, option) {
  if (!actor || !target || !option || option.command.action === 'defend') return null;
  const preview = previewCommand(encounter, actor.id, option.command)?.[target.id];
  if (!preview) return null;
  return { ...preview, lethal: preview.kind === 'damage' && preview.max >= target.hp };
}

/** The radial menu that opens under the thumb, with only the valid actions. */
function Radial({ radial, options, hover, previews, onPick, onCancel, onHover }) {
  const size = 64;
  const radius = Math.max(78, Math.min(118, 30 + options.length * 14));
  const margin = radius + size / 2 + 8;
  const cx = Math.min(Math.max(radial.x, margin), window.innerWidth - margin);
  const cy = Math.min(Math.max(radial.y, margin), window.innerHeight - margin);
  return (
    <div className={`radial ${radial.drag ? 'is-dragging' : ''}`} style={{ left: cx, top: cy }} onClick={(event) => event.stopPropagation()} onPointerDown={(event) => event.stopPropagation()}>
      <button type="button" className="radial__center" onClick={onCancel} aria-label="Cancel">
        <Icon name="close" size={18} tone="plain" />
      </button>
      {options.map((option, index) => {
        const angle = -Math.PI / 2 + (index * 2 * Math.PI) / options.length;
        const preview = previews[index];
        return (
          <button
            key={option.key}
            type="button"
            data-radial-index={index}
            className={`radial__option ${hover === index ? 'is-hover' : ''} ${option.disabled ? 'is-disabled' : ''}`}
            style={{ transform: `translate(${Math.cos(angle) * radius}px, ${Math.sin(angle) * radius}px)` }}
            onPointerEnter={() => onHover(index)}
            onClick={() => onPick(option)}
            aria-label={`${option.label}${option.cost ? `, ${option.cost}` : ''}`}
          >
            <Icon name={option.icon} size={22} />
            <b>{option.label}</b>
            {option.cost ? <small>{option.cost}</small> : null}
            {preview ? <PreviewLine preview={preview} /> : null}
          </button>
        );
      })}
    </div>
  );
}

function PreviewLine({ preview }) {
  const value = preview.kind === 'damage' ? `${preview.min}–${preview.max}` : preview.kind === 'heal' ? `+${preview.min}` : preview.kind === 'revive' ? `Revive ${preview.min}` : preview.note || '';
  return (
    <em className="radial__preview">
      {preview.lethal ? <Icon name="skull" size={14} tone="plain" /> : null}
      {value}
      {preview.kind === 'damage' ? ` · ${Math.round((preview.hit ?? 1) * 100)}%` : ''}
      {preview.tag ? ` · ${preview.tag}` : ''}
    </em>
  );
}

/** Tap a unit to see its statuses (turns left, what they do) and, for enemies, its behavior and plan. */
function UnitInfo({ unit, intent, onClose }) {
  const statuses = Object.entries(unit.status || {}).filter(([key, turns]) => STATUSES[key] && turns > 0);
  return (
    <aside className="unit-info panel" onClick={(event) => event.stopPropagation()} aria-label={`${unit.name} details`}>
      <header>
        <strong>{unit.name}</strong>
        <button type="button" onClick={onClose} aria-label="Close">
          <Icon name="close" size={18} tone="plain" />
        </button>
      </header>
      <p className="unit-info__line">
        {unit.side === 'enemy' ? `${PROFILE_NAMES[unit.profile] || 'Fighter'}${unit.boss ? ' · Boss' : ''}` : `Lv ${unit.level} ${unit.classId}`} · {unit.primal}
      </p>
      <p className="unit-info__line">
        HP {unit.hp}/{unit.maxHp} · MP {unit.mp}/{unit.maxMp}
      </p>
      {intent ? <p className="unit-info__intent">{intent.telegraph}</p> : null}
      {statuses.length ? (
        <ul className="unit-info__statuses">
          {statuses.map(([key, turns]) => (
            <li key={key}>
              <span className={`status-icon status-icon--${STATUSES[key].bad ? 'bad' : 'good'}`}><Icon name={STATUSES[key].icon} size={14} tone="plain" /></span>
              <b>
                {STATUSES[key].label} · {turns} turn{turns === 1 ? '' : 's'}
              </b>
              <small>{STATUSES[key].description}</small>
            </li>
          ))}
        </ul>
      ) : (
        <p className="unit-info__line">No statuses.</p>
      )}
    </aside>
  );
}
