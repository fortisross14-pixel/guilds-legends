import React, { useEffect, useMemo, useRef, useState } from 'react';
import { COMMANDS } from '../game/combat.js';
import { SKILLS, STATUS_LABELS, skillLabel } from '../data/skills.js';
import { ITEMS } from '../data/items.js';
import { Badge, Button, HeroSprite, Modal, ProgressBar, artUrl, sceneStyle } from './UI.jsx';

// Battle backdrop: the arena for tournaments, otherwise the scene of the
// location's primal (see DESIGN.md, Components).
const PRIMAL_SCENES = { Fire: 'scene_10', Plant: 'scene_05', Water: 'scene_09', Air: 'scene_08', Animal: 'scene_05', Psychic: 'scene_07', Iron: 'scene_06' };
export function battleScene(encounter, locationPrimal) {
  if (!encounter) return 'scene_04';
  if (encounter.mode === 'duel' || /tournament|championship|challenge/i.test(encounter.sourceType || '')) return 'scene_04';
  return PRIMAL_SCENES[locationPrimal] || PRIMAL_SCENES[encounter.enemies?.[0]?.primal] || 'scene_06';
}

const HIT_FX = 'effect_01';
const HEAL_FX = 'effect_11';

// Watches unit HP between renders and returns short-lived damage / heal pops.
function useHpPops(encounter) {
  const previous = useRef(null);
  const [pops, setPops] = useState([]);
  useEffect(() => {
    if (!encounter) {
      previous.current = null;
      return undefined;
    }
    const units = [...encounter.party, ...encounter.enemies];
    const before = previous.current;
    previous.current = { id: encounter.id, hp: Object.fromEntries(units.map((unit) => [unit.id, unit.hp])) };
    if (!before || before.id !== encounter.id) return undefined;
    const fresh = units
      .filter((unit) => typeof before.hp[unit.id] === 'number' && before.hp[unit.id] !== unit.hp)
      .map((unit) => {
        const delta = unit.hp - before.hp[unit.id];
        return { key: `${unit.id}-${encounter.turn}-${encounter.log.length}`, unitId: unit.id, amount: Math.abs(delta), kind: delta < 0 ? 'hit' : 'heal' };
      });
    if (!fresh.length) return undefined;
    setPops(fresh);
    const timer = window.setTimeout(() => setPops([]), 1000);
    return () => window.clearTimeout(timer);
  }, [encounter]);
  return pops;
}

function UnitPops({ pops, unitId }) {
  return pops
    .filter((pop) => pop.unitId === unitId)
    .map((pop) => (
      <React.Fragment key={pop.key}>
        <span className="fx-wrap" aria-hidden="true">
          <img className="fx" src={artUrl(`art/effects/${pop.kind === 'hit' ? HIT_FX : HEAL_FX}.png`)} alt="" />
        </span>
        <span className={`dmg-pop dmg-pop--${pop.kind}`} aria-hidden="true">
          {pop.kind === 'heal' ? `+${pop.amount}` : pop.amount}
        </span>
      </React.Fragment>
    ));
}

// Front-view battle screen: enemies in the middle, party windows at the bottom,
// a command menu for the hero whose turn it is to choose, and a short log.

function targetTypeFor(command) {
  if (command.action === 'attack') return 'enemy';
  if (command.action === 'skill') return SKILLS[command.skillId]?.target;
  if (command.action === 'item') return ITEMS[command.itemId]?.battle?.target;
  return null;
}

function needsPick(targetType) {
  return ['enemy', 'ally', 'koAlly'].includes(targetType);
}

function commandLabel(command, unit) {
  if (!command) return '…';
  if (command.action === 'skill') return skillLabel(SKILLS[command.skillId], unit.primal);
  if (command.action === 'item') return ITEMS[command.itemId]?.name;
  return COMMANDS.find((item) => item.id === command.action)?.label;
}

function Statuses({ unit }) {
  const keys = Object.keys(unit.status || {});
  if (!keys.length) return null;
  return (
    <span className="battle-unit__statuses">
      {keys.map((key) => (
        <Badge key={key} tone={['poison', 'stun', 'exposed'].includes(key) ? 'red' : 'blue'}>
          {STATUS_LABELS[key] || key}
        </Badge>
      ))}
    </span>
  );
}

function EnemyArt({ unit }) {
  if (unit.sprite?.kind === 'enemy') {
    return <img className="battle-enemy__art" src={`${import.meta.env.BASE_URL}art/enemies/${unit.sprite.key}.png`} alt="" />;
  }
  return <HeroSprite hero={unit} size="lg" enemy />;
}

export default function CombatArenaModal({ encounter, actions, locationPrimal }) {
  const [commands, setCommands] = useState({});
  const [pending, setPending] = useState(null);
  const [menu, setMenu] = useState('root');
  const [hintsHidden, setHintsHidden] = useState(false);
  const commandsRef = useRef(null);
  const pops = useHpPops(encounter);
  const turnKey = encounter ? `${encounter.id}:${encounter.turn}:${encounter.status}` : null;

  useEffect(() => {
    setCommands({});
    setPending(null);
    setMenu('root');
  }, [turnKey]);

  const livingParty = useMemo(() => (encounter ? encounter.party.filter((unit) => !unit.ko) : []), [encounter]);
  const active = livingParty.find((unit) => !commands[unit.id]) || null;

  // Keep the cursor on the command window: focus its first entry whenever the
  // acting hero or the sub-menu changes; when picking a target, focus the first target.
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const scope = pending ? document.querySelector('.battle-screen') : commandsRef.current;
      const first = scope?.querySelector(pending ? '.is-targetable' : '.battle-commands__menu button:not(:disabled), .battle-commands__list button:not(:disabled)');
      first?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [active?.id, menu, pending]);

  // Escape backs out of a target pick or a sub-menu, like a cancel button.
  useEffect(() => {
    if (!encounter) return undefined;
    const onKey = (event) => {
      if (event.key !== 'Escape') return;
      if (pending) setPending(null);
      else if (menu !== 'root') setMenu('root');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [encounter, pending, menu]);

  if (!encounter) return null;
  const finished = encounter.status !== 'active';

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
    setMenu('root');
    if (livingParty.every((hero) => next[hero.id])) {
      setCommands({});
      actions.combatRound(next);
    } else setCommands(next);
  };

  const choose = (command) => {
    if (!active) return;
    const targetType = targetTypeFor(command);
    if (needsPick(targetType)) setPending({ ...command, targetType });
    else commit(active, command);
  };

  const pickTarget = (unit) => {
    if (!pending || !active) return;
    const valid =
      (pending.targetType === 'enemy' && unit.side === 'enemy' && !unit.ko) ||
      (pending.targetType === 'ally' && unit.side === 'party' && !unit.ko) ||
      (pending.targetType === 'koAlly' && unit.side === 'party' && unit.ko);
    if (!valid) return;
    const { targetType: _targetType, ...command } = pending;
    commit(active, { ...command, targetId: unit.id });
  };

  const undo = () => {
    const chosen = livingParty.filter((unit) => commands[unit.id]);
    const last = chosen[chosen.length - 1];
    if (!last) return;
    const next = { ...commands };
    delete next[last.id];
    setCommands(next);
    setPending(null);
    setMenu('root');
  };

  const targetable = (unit) =>
    pending &&
    ((pending.targetType === 'enemy' && unit.side === 'enemy' && !unit.ko) ||
      (pending.targetType === 'ally' && unit.side === 'party' && !unit.ko) ||
      (pending.targetType === 'koAlly' && unit.side === 'party' && unit.ko));

  const intent = encounter.enemyIntent;

  return (
    <Modal
      open
      title={encounter.title || 'Battle'}
      eyebrow={`${encounter.roundName || 'Battle'} · Round ${encounter.turn}`}
      preventClose
      width="wide"
      className="battle-modal"
    >
      <div className={`battle-screen battle-screen--${encounter.mode}`}>
        {encounter.guaranteed && !finished && !hintsHidden ? (
          <aside className="battle-hints">
            <strong>First battle</strong>
            <ol>
              <li>The highlighted window is the hero choosing now. Pick a command for each hero.</li>
              <li>Attack and most skills need a target: click an enemy.</li>
              <li>Someone hurt? Use Item → Potion (or a healing skill) and click the ally.</li>
              <li>The Tell shows the strongest enemy’s next move. Defend against big ones, or stun them first.</li>
            </ol>
            <Button size="sm" variant="secondary" onClick={() => setHintsHidden(true)}>
              Hide hints
            </Button>
          </aside>
        ) : null}
        {!finished && intent ? (
          <div className={`battle-tell ${intent.big ? 'battle-tell--danger' : ''}`}>
            <strong>Tell</strong> {intent.telegraph}
          </div>
        ) : null}

        <section className="battle-enemies" aria-label="Enemies">
          {encounter.enemies.map((unit) => (
            <button
              key={unit.id}
              className={`battle-enemy ${unit.ko ? 'is-ko' : ''} ${targetable(unit) ? 'is-targetable' : ''} ${intent?.actorId === unit.id ? 'is-telling' : ''}`}
              onClick={() => pickTarget(unit)}
              disabled={!targetable(unit)}
            >
              <EnemyArt unit={unit} />
              <strong>{unit.name}</strong>
              <ProgressBar value={unit.hp} max={unit.maxHp} tone="red" compact label={`${unit.hp}/${unit.maxHp}`} />
              <Statuses unit={unit} />
            </button>
          ))}
        </section>

        <section className="battle-party" aria-label="Your party">
          {encounter.party.map((unit) => (
            <button
              key={unit.id}
              className={`battle-hero ${unit.ko ? 'is-ko' : ''} ${active?.id === unit.id && !finished ? 'is-active' : ''} ${targetable(unit) ? 'is-targetable' : ''}`}
              onClick={() => pickTarget(unit)}
              disabled={!targetable(unit)}
            >
              <HeroSprite hero={unit} size="sm" />
              <span className="battle-hero__info">
                <strong>{unit.name}</strong>
                <small>
                  Lv {unit.level} {unit.classId}
                  {unit.ko ? ' · KO' : ''}
                </small>
                <ProgressBar value={unit.hp} max={unit.maxHp} tone="green" compact label={`HP ${unit.hp}/${unit.maxHp}`} />
                <ProgressBar value={unit.mp} max={unit.maxMp} tone="blue" compact label={`MP ${unit.mp}/${unit.maxMp}`} />
                <Statuses unit={unit} />
                {!finished ? <em className="battle-hero__command">{commandLabel(commands[unit.id], unit)}</em> : null}
              </span>
            </button>
          ))}
        </section>

        {!finished ? (
          <section className="battle-commands">
            {pending ? (
              <div className="battle-commands__prompt">
                <span>
                  Choose a target for {active?.name}:{' '}
                  {pending.targetType === 'enemy' ? 'click an enemy' : pending.targetType === 'koAlly' ? 'click a fallen ally' : 'click an ally'}.
                </span>
                <Button size="sm" onClick={() => setPending(null)}>
                  Cancel
                </Button>
              </div>
            ) : active ? (
              <>
                <span className="battle-commands__who">{active.name}’s command</span>
                {menu === 'root' ? (
                  <div className="battle-commands__menu">
                    {COMMANDS.map((command) => (
                      <Button
                        key={command.id}
                        icon={command.icon}
                        disabled={(command.id === 'skill' && !active.skills.length) || (command.id === 'item' && !itemsLeft.length)}
                        onClick={() => (command.id === 'skill' || command.id === 'item' ? setMenu(command.id) : choose({ action: command.id }))}
                      >
                        {command.label}
                      </Button>
                    ))}
                  </div>
                ) : null}
                {menu === 'skill' ? (
                  <div className="battle-commands__list">
                    {active.skills.map((id) => {
                      const skill = SKILLS[id];
                      return (
                        <Button
                          key={id}
                          size="sm"
                          disabled={active.mp < skill.mp}
                          title={skill.description}
                          onClick={() => choose({ action: 'skill', skillId: id })}
                        >
                          {skillLabel(skill, active.primal)} · {skill.mp} MP
                        </Button>
                      );
                    })}
                    <Button size="sm" variant="secondary" onClick={() => setMenu('root')}>
                      Back
                    </Button>
                  </div>
                ) : null}
                {menu === 'item' ? (
                  <div className="battle-commands__list">
                    {itemsLeft.map(([id, count]) => (
                      <Button key={id} size="sm" title={ITEMS[id]?.description} onClick={() => choose({ action: 'item', itemId: id })}>
                        {ITEMS[id]?.name} ×{count}
                      </Button>
                    ))}
                    <Button size="sm" variant="secondary" onClick={() => setMenu('root')}>
                      Back
                    </Button>
                  </div>
                ) : null}
              </>
            ) : null}
            <div className="battle-commands__meta">
              <Button size="sm" variant="secondary" onClick={undo} disabled={!Object.keys(commands).length}>
                Undo
              </Button>
              <Button size="sm" onClick={actions.autoResolveCombat}>
                Auto-battle
              </Button>
              {encounter.canFlee ? (
                <Button size="sm" variant="danger" onClick={actions.fleeCombat}>
                  Flee
                </Button>
              ) : null}
            </div>
          </section>
        ) : (
          <section className={`battle-result battle-result--${encounter.result?.playerWon ? 'won' : 'lost'}`}>
            <h3>{encounter.result?.playerWon ? 'Victory!' : encounter.result?.method === 'withdrew' ? 'You withdrew' : 'Defeat'}</h3>
            <p>
              {encounter.result?.method} · {encounter.result?.turns} rounds · party HP {encounter.result?.playerHpPct}%
              {encounter.result?.knockedOut?.length ? ` · ${encounter.result.knockedOut.length} knocked out (injury risk afterwards)` : ''}
            </p>
            <Button variant="primary" size="lg" onClick={actions.concludeCombat}>
              Continue
            </Button>
          </section>
        )}

        <ol className="battle-log">
          {encounter.log.slice(-8).map((entry, index) => (
            <li key={`${entry.turn}-${index}`} className={`battle-log__entry battle-log__entry--${entry.tone}`}>
              {entry.text}
            </li>
          ))}
        </ol>
      </div>
    </Modal>
  );
}
