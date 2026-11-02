import React, { useEffect, useMemo, useState } from 'react';
import { COMMANDS } from '../game/combat.js';
import { SKILLS, STATUS_LABELS, skillLabel } from '../data/skills.js';
import { ITEMS } from '../data/items.js';
import { Badge, Button, HeroSprite, Modal, ProgressBar } from './UI.jsx';

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

export default function CombatArenaModal({ encounter, actions }) {
  const [commands, setCommands] = useState({});
  const [pending, setPending] = useState(null);
  const [menu, setMenu] = useState('root');
  const [hintsHidden, setHintsHidden] = useState(false);
  const turnKey = encounter ? `${encounter.id}:${encounter.turn}:${encounter.status}` : null;

  useEffect(() => {
    setCommands({});
    setPending(null);
    setMenu('root');
  }, [turnKey]);

  const livingParty = useMemo(() => (encounter ? encounter.party.filter((unit) => !unit.ko) : []), [encounter]);
  const active = livingParty.find((unit) => !commands[unit.id]) || null;

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
    <Modal open title={encounter.title || 'Battle'} eyebrow={`${encounter.roundName || 'Battle'} · Round ${encounter.turn}`} preventClose width="wide">
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
