import React, { useEffect, useMemo, useRef, useState } from 'react';
import { COMMANDS, previewCommand, turnOrder } from '../game/combat.js';
import { SKILLS, STATUSES, skillLabel } from '../data/skills.js';
import { ITEMS } from '../data/items.js';
import { Button, HeroSprite, Modal, Motes, useSceneStyle } from './UI.jsx';
import Asset from './Asset.jsx';
import PixelIcon, { COMMAND_ICONS } from './PixelIcon.jsx';
import { playSound } from '../audio/sfx.js';

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
const AREA_TARGETS = ['allEnemies', 'allAllies', 'self'];
const INTENT_ICONS = { attack: '⚔', spell: '✦', heal: '✚', buff: '▲', guard: '◆', taunt: '!', flee: '↯', charge: '☄', debuff: '▼' };
const PROFILE_NAMES = { brute: 'Brute', caster: 'Caster', healer: 'Healer', skirmisher: 'Skirmisher', tank: 'Tank' };
const STATUS_FX = { poison: 'poison', burn: 'fire', regen: 'heal' };

function targetTypeFor(command) {
  if (command.action === 'attack') return 'enemy';
  if (command.action === 'skill') return SKILLS[command.skillId]?.target;
  if (command.action === 'item') return ITEMS[command.itemId]?.battle?.target;
  return null;
}

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
function useReplay(encounter, speed) {
  const shown = useRef(null);
  const live = useRef(encounter);
  const speedRef = useRef(speed);
  live.current = encounter;
  speedRef.current = speed;
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
      if (beat.hits.some((hit) => hit.type === 'damage')) playSound(crit ? 'crit' : 'hit');
      else if (beat.hits.some((hit) => hit.type === 'heal' || hit.type === 'revive')) playSound('heal');
      setReplay({ display: { ...display }, beat, order, shake: crit || beat.kind === 'phase' || (beat.big && beat.hits.length > 0) });
      timer = window.setTimeout(step, (BEAT[beat.kind] || 420) / (speedRef.current || 1));
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
          {STATUSES[key].icon}
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

function PreviewChip({ preview, selected }) {
  if (!preview) return null;
  const value =
    preview.kind === 'damage'
      ? `${preview.min}–${preview.max}`
      : preview.kind === 'heal'
        ? `+${preview.min}`
        : preview.kind === 'revive'
          ? `Revive ${preview.min}`
          : preview.note || 'Effect';
  return (
    <span className={`target-preview ${selected ? 'is-selected' : ''} ${preview.kind === 'heal' || preview.kind === 'revive' ? 'is-heal' : ''}`}>
      <strong>{value}</strong>
      {preview.tag ? <em className={`target-preview__tag target-preview__tag--${preview.tag.toLowerCase()}`}>{preview.tag}</em> : null}
      {selected ? (
        <small>
          {Math.round((preview.hit ?? 1) * 100)}% hit{preview.crit ? ` · ${Math.round(preview.crit * 100)}% crit` : ''}
          {preview.note && preview.kind !== 'status' ? ` · ${preview.note}` : ''}
          <br />
          Tap again to confirm
        </small>
      ) : null}
    </span>
  );
}

export default function CombatArenaModal({ encounter, actions, locationPrimal, speed = 1 }) {
  const [commands, setCommands] = useState({});
  const [pending, setPending] = useState(null);
  const [selected, setSelected] = useState(null);
  const [menu, setMenu] = useState('root');
  const [info, setInfo] = useState(null);
  const [auto, setAuto] = useState(false);
  const [hintsHidden, setHintsHidden] = useState(false);
  const [intro, setIntro] = useState(() => encounter?.intro || null);
  const replay = useReplay(encounter, speed);
  const stageStyle = useSceneStyle(battleBackground(encounter, locationPrimal));
  const turnKey = encounter ? `${encounter.id}:${encounter.turn}:${encounter.status}` : null;
  const replaying = Boolean(replay);

  useEffect(() => {
    setCommands({});
    setPending(null);
    setSelected(null);
    setMenu('root');
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
  const active = !replaying && !auto ? livingParty.find((unit) => !commands[unit.id]) || null : null;
  const preview = useMemo(() => (pending && active ? previewCommand(encounter, active.id, pending.command) : {}), [pending, active, encounter]);

  if (!encounter) return null;
  const finished = encounter.status !== 'active';
  const display = replay?.display || null;
  const beat = replay?.beat || null;
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

  const commit = (unit, command) => {
    const next = { ...commands, [unit.id]: command };
    setPending(null);
    setSelected(null);
    setMenu('root');
    if (livingParty.every((hero) => next[hero.id])) {
      setCommands({});
      actions.combatRound(next);
    } else setCommands(next);
  };

  const choose = (command) => {
    if (!active) return;
    const targetType = targetTypeFor(command);
    if (!targetType) return commit(active, command);
    setPending({ command, targetType });
    // Area and self skills have nothing to pick: everything valid is selected at once.
    setSelected(AREA_TARGETS.includes(targetType) ? 'area' : null);
  };

  const valid = (unit) =>
    Boolean(pending) &&
    !unit.hidden &&
    (((pending.targetType === 'enemy' || pending.targetType === 'allEnemies') && unit.side === 'enemy' && !unit.ko) ||
      ((pending.targetType === 'ally' || pending.targetType === 'allAllies') && unit.side === 'party' && !unit.ko) ||
      (pending.targetType === 'self' && unit.id === active?.id) ||
      (pending.targetType === 'koAlly' && unit.side === 'party' && unit.ko));

  const confirm = () => {
    if (!pending || !active || !selected) return;
    commit(active, selected === 'area' ? pending.command : { ...pending.command, targetId: selected });
  };
  const cancel = () => {
    setPending(null);
    setSelected(null);
  };

  const tapUnit = (unit, event) => {
    event.stopPropagation();
    if (replaying) return;
    if (pending) {
      if (!valid(unit)) return;
      const id = AREA_TARGETS.includes(pending.targetType) ? 'area' : unit.id;
      if (selected === id) confirm();
      else setSelected(id);
      return;
    }
    setInfo(info === unit.id ? null : unit.id);
  };

  const undo = () => {
    const chosen = livingParty.filter((unit) => commands[unit.id]);
    const last = chosen[chosen.length - 1];
    if (!last) return;
    const next = { ...commands };
    delete next[last.id];
    setCommands(next);
    cancel();
    setMenu('root');
  };

  const isSelected = (unit) => selected && (selected === 'area' ? valid(unit) : selected === unit.id);
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
      valid(unit) ? 'is-targetable' : '',
      isSelected(unit) ? 'is-selected' : '',
      finished && !replaying && encounter.result?.playerWon && unit.side === 'party' && !unit.ko ? 'is-victory' : '',
      unit.charging ? 'is-charging' : '',
    ]
      .filter(Boolean)
      .join(' ');
  };

  const order = replay?.order || turnOrder(encounter);
  const intent = encounter.enemyIntent;
  const infoUnit = info ? [...encounter.party, ...encounter.enemies].find((unit) => unit.id === info) : null;
  const wildWipe = finished && encounter.sourceType === 'wild' && !encounter.result?.playerWon && encounter.result?.method !== 'withdrew';
  const pendingTargetText = pending
    ? AREA_TARGETS.includes(pending.targetType)
      ? pending.targetType === 'self'
        ? 'on yourself'
        : 'on every highlighted target'
      : pending.targetType === 'enemy'
        ? 'tap an enemy'
        : pending.targetType === 'koAlly'
          ? 'tap a fallen ally'
          : 'tap an ally'
    : '';

  return (
    <Modal
      open
      title={encounter.title || 'Battle'}
      eyebrow={`${encounter.roundName || 'Battle'} · Round ${encounter.turn}`}
      preventClose
      width="wide"
      className="battle-modal"
    >
      <div className={`battle-screen battle-screen--${encounter.mode} ${replay?.shake ? 'is-shaking' : ''}`} style={{ '--speed': speed }}>
        <section
          className="battle-stage scene"
          style={stageStyle}
          data-asset={battleBackground(encounter, locationPrimal)}
          aria-label="Battlefield"
          onClick={() => {
            if (pending) cancel();
            setInfo(null);
          }}
        >
          <Motes />
          {encounter.hints?.length && !finished ? <p className="battle-hint">{encounter.hints[Math.min(encounter.turn - 1, encounter.hints.length - 1)]}</p> : null}

          {!finished ? (
            <ol className="turn-order" aria-label="Turn order">
              {order.map((turn, index) => {
                const unit = [...encounter.party, ...encounter.enemies].find((item) => item.id === turn.unitId);
                if (!unit) return null;
                const now = replaying && beat?.actorId === unit.id && turn.round === encounter.turn - 1;
                return (
                  <li
                    key={`${turn.unitId}-${index}`}
                    className={`turn-order__slot turn-order__slot--${turn.side} ${turn.skip ? 'is-skipped' : ''} ${now ? 'is-now' : ''} ${index > 0 && order[index - 1].round !== turn.round ? 'is-next-round' : ''}`}
                    title={`${unit.name}${turn.skip ? ' (stunned)' : ''}`}
                  >
                    {unit.side === 'enemy' && unit.sprite?.kind === 'enemy' ? <Asset id={`battle.${unit.sprite.key}`} /> : <HeroSprite hero={unit} size="xs" enemy={unit.side === 'enemy'} />}
                    <span>{unit.name.split(' ')[0]}</span>
                  </li>
                );
              })}
            </ol>
          ) : null}

          {encounter.guaranteed && !finished && !hintsHidden ? (
            <aside className="battle-hints panel" onClick={(event) => event.stopPropagation()}>
              <strong>First battle</strong>
              <ol>
                <li>Pick a command for the glowing hero, then tap the target on the field.</li>
                <li>The numbers on each target show the damage range. Tap the same target again to confirm.</li>
                <li>Someone hurt? Item → Potion, then tap the ally.</li>
                <li>The Tell shows the leader’s next move. Defend against big ones, or stun them first.</li>
              </ol>
              <Button size="sm" variant="secondary" onClick={() => setHintsHidden(true)}>
                Hide hints
              </Button>
            </aside>
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

          <div className="battle-enemies" aria-label="Enemies" data-menu>
            {encounter.enemies.map((raw, index) => {
              const unit = view(raw);
              if (unit.hidden || (unit.fled && !display)) return null;
              const plan = !finished && !replaying ? encounter.intents?.[unit.id] : null;
              const target = plan?.targetId ? [...encounter.party, ...encounter.enemies].find((item) => item.id === plan.targetId) : null;
              return (
                <button
                  key={unit.id}
                  type="button"
                  style={{ '--i': index }}
                  className={`battle-enemy ${unitClass(unit)} ${intent?.actorId === unit.id ? 'is-telling' : ''} ${unit.boss ? 'is-boss' : ''}`}
                  onClick={(event) => tapUnit(unit, event)}
                  aria-label={`${unit.name}, ${unit.hp} of ${unit.maxHp} HP${valid(unit) ? ', tap to target' : ''}`}
                >
                  {plan && !unit.ko ? (
                    <span className={`intent intent--${plan.icon} ${plan.big ? 'is-big' : ''}`}>
                      <i aria-hidden="true">{INTENT_ICONS[plan.icon] || '?'}</i>
                      {plan.label}
                      {target ? ` → ${target.name.split(' ')[0]}` : ''}
                    </span>
                  ) : null}
                  {valid(unit) ? <PreviewChip preview={preview[unit.id]} selected={isSelected(unit)} /> : null}
                  <EnemyArt unit={unit} />
                  <strong>{unit.name}</strong>
                  <Meter value={unit.hp} max={unit.maxHp} kind="hp" />
                  <StatusIcons status={unit.status} />
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
                  <p className="battle-result__note">The party falls. Try again from the start, or carry the wounded back to camp (they will need time to heal).</p>
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
        </section>

        <div
          className="battle-hud"
          style={{ '--active': Math.max(0, encounter.party.findIndex((unit) => unit.id === active?.id)), '--count': encounter.party.length }}
        >
          {!finished ? (
            <section className="battle-commands panel" aria-label="Commands">
              {replaying ? (
                <span className="battle-commands__who">{beat?.actorId ? `${[...encounter.party, ...encounter.enemies].find((unit) => unit.id === beat.actorId)?.name || ''}${beat.label ? `: ${beat.label}` : ''}` : 'Resolving the round…'}</span>
              ) : auto ? (
                <span className="battle-commands__who">Auto-battle is on</span>
              ) : pending ? (
                <div className="battle-commands__prompt">
                  <span>
                    {active?.name}: {commandLabel(pending.command, active)} · {pendingTargetText}
                  </span>
                  <div className="battle-commands__row">
                    <Button variant="primary" disabled={!selected} onClick={confirm}>
                      Confirm
                    </Button>
                    <Button onClick={cancel}>Cancel</Button>
                  </div>
                </div>
              ) : active ? (
                <>
                  <span className="battle-commands__who">{active.name}</span>
                  {menu === 'root' ? (
                    <div className="battle-commands__menu" data-menu>
                      {COMMANDS.map((command) => (
                        <Button
                          key={command.id}
                          icon={<PixelIcon name={COMMAND_ICONS[command.id] || 'star'} size={24} />}
                          disabled={(command.id === 'skill' && !active.skills.length) || (command.id === 'item' && !itemsLeft.length)}
                          onClick={() => (command.id === 'skill' || command.id === 'item' ? setMenu(command.id) : choose({ action: command.id }))}
                        >
                          {command.label}
                        </Button>
                      ))}
                    </div>
                  ) : null}
                  {menu === 'skill' ? (
                    <div className="battle-commands__list" data-menu>
                      {active.skills.map((id) => {
                        const skill = SKILLS[id];
                        return (
                          <Button key={id} size="sm" disabled={active.mp < skill.mp} onClick={() => choose({ action: 'skill', skillId: id })}>
                            <span className="battle-option">
                              <b>
                                {skillLabel(skill, active.primal)} · {skill.mp} MP
                              </b>
                              <small>{skill.description}</small>
                            </span>
                          </Button>
                        );
                      })}
                      <Button size="sm" variant="secondary" onClick={() => setMenu('root')}>
                        ◀ Back
                      </Button>
                    </div>
                  ) : null}
                  {menu === 'item' ? (
                    <div className="battle-commands__list" data-menu>
                      {itemsLeft.map(([id, count]) => (
                        <Button key={id} size="sm" onClick={() => choose({ action: 'item', itemId: id })}>
                          <span className="battle-option">
                            <b>
                              {ITEMS[id]?.name} ×{count}
                            </b>
                            <small>{ITEMS[id]?.description}</small>
                          </span>
                        </Button>
                      ))}
                      <Button size="sm" variant="secondary" onClick={() => setMenu('root')}>
                        ◀ Back
                      </Button>
                    </div>
                  ) : null}
                </>
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
            {encounter.log.slice(-6).map((entry, index) => (
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
                  className={`battle-hero ${unitClass(unit)} ${active?.id === unit.id && !finished ? 'is-active' : ''}`}
                  onClick={(event) => tapUnit(unit, event)}
                  aria-label={`${unit.name}, ${unit.hp} of ${unit.maxHp} HP${valid(unit) ? ', tap to target' : ''}`}
                >
                  {valid(unit) ? <PreviewChip preview={preview[unit.id]} selected={isSelected(unit)} /> : null}
                  <HeroSprite hero={unit} size="sm" />
                  <span className="battle-hero__info">
                    <strong>{unit.name}</strong>
                    <small>
                      Lv {unit.level} {unit.classId}
                      {unit.ko ? ' · KO' : ''}
                    </small>
                    <Meter value={unit.hp} max={unit.maxHp} kind="hp" />
                    <Meter value={unit.mp} max={unit.maxMp} kind="mp" />
                    <StatusIcons status={unit.status} />
                    {!finished && !replaying ? <em className="battle-hero__command">{commandLabel(commands[unit.id], unit)}</em> : null}
                  </span>
                  <BeatMarks beat={beat} unitId={unit.id} />
                </button>
              );
            })}
          </section>
        </div>
      </div>
    </Modal>
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
          ×
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
              <span className={`status-icon status-icon--${STATUSES[key].bad ? 'bad' : 'good'}`}>{STATUSES[key].icon}</span>
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
