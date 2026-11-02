import React, { useEffect, useMemo, useState } from 'react';
import {
  CLASS_SIGNATURES,
  COMBAT_ACTIONS,
  combatActionDefinition,
  combatPrimalText,
} from '../game/combat.js';
import { Badge, Button, HeroPortrait, HeroSprite, Modal, PrimalBadge } from './UI.jsx';

function pct(value, max) {
  return Math.max(0, Math.min(100, Math.round((Number(value || 0) / Math.max(1, Number(max || 1))) * 100)));
}

function StatusChips({ side }) {
  return (
    <div className="combat-side__states">
      {side.guard > 0.08 ? <Badge tone="blue">Guard {Math.round(side.guard * 100)}%</Badge> : null}
      {side.focus > 0 ? <Badge tone="gold">Focus {side.focus}</Badge> : null}
      {side.exposed > 0 ? <Badge tone="red">Exposed</Badge> : null}
      {side.staggered > 0 ? <Badge tone="red">Staggered</Badge> : null}
      {side.evasion > 0 ? <Badge tone="purple">Evasive</Badge> : null}
      {side.empowered > 0 ? <Badge tone="green">Empowered</Badge> : null}
    </div>
  );
}

function SideSummary({ side, enemy = false, leadHeroId = null }) {
  const lead = side.roster.find((hero) => hero.id === leadHeroId) || side.roster.find((hero) => hero.id === side.leadHeroId) || side.roster[0];
  return (
    <article className={`combat-side ${enemy ? 'combat-side--enemy' : 'combat-side--player'}`}>
      <div className="combat-side__header">
        <div>
          <span className="eyebrow">{enemy ? 'Opposition' : 'Your side'}</span>
          <strong>{side.name}</strong>
          <small>{side.roster.length > 1 ? `${side.roster.length} heroes · lead ${lead?.name || '—'}` : `${lead?.classId || 'Hero'} · Level ${lead?.level || 1}`}</small>
        </div>
        {lead?.primal ? <PrimalBadge primal={lead.primal} compact /> : null}
      </div>
      <div className="combat-bars">
        <div className="combat-bar combat-bar--hp" role="progressbar" aria-label={`${side.name} health`} aria-valuemin={0} aria-valuemax={side.maxHp} aria-valuenow={Math.round(side.hp)}>
          <span style={{ width: `${pct(side.hp, side.maxHp)}%` }} />
          <b>{Math.max(0, Math.round(side.hp))}/{side.maxHp} HP</b>
        </div>
        <div className="combat-bar combat-bar--stamina" role="progressbar" aria-label={`${side.name} stamina`} aria-valuemin={0} aria-valuemax={side.maxStamina} aria-valuenow={Math.round(side.stamina)}>
          <span style={{ width: `${pct(side.stamina, side.maxStamina)}%` }} />
          <b>{Math.round(side.stamina)} STA</b>
        </div>
      </div>
      <StatusChips side={side} />
      <div className="combat-side__roster" aria-label={`${side.name} roster`}>
        {side.roster.map((hero) => (
          <div key={hero.id} className={`combat-roster-chip ${hero.id === lead?.id ? 'is-lead' : ''}`}>
            <HeroPortrait hero={{ ...hero, status: 'available' }} size="xs" showStatus={false} />
            <span><strong>{hero.name}</strong><small>{hero.role || hero.classId} · Lv {hero.level || 1}</small></span>
            <PrimalBadge primal={hero.primal} compact />
          </div>
        ))}
      </div>
    </article>
  );
}



function enemyVisualHero(encounter) {
  const lead = encounter.enemy.roster.find((hero) => hero.id === encounter.enemy.leadHeroId) || encounter.enemy.roster[0] || { classId: 'Guardian', primal: encounter.enemy.primal, name: encounter.enemy.name };
  return { ...lead, classId: lead.classId || 'Guardian', primal: lead.primal || encounter.enemy.primal || 'Iron', name: lead.name || encounter.enemy.name };
}

function BattlefieldStage({ encounter, leadHeroId }) {
  const playerLead = encounter.player.roster.find((hero) => hero.id === leadHeroId) || encounter.player.roster[0];
  const enemyLead = enemyVisualHero(encounter);
  return (
    <section className={`battlefield-stage battlefield-stage--${encounter.mode}`} aria-label="Combat stage">
      <div className="battlefield-stage__backdrop" />
      <div className="battlefield-stage__side battlefield-stage__side--enemy">
        <HeroSprite hero={enemyLead} size={encounter.mode === 'duel' ? 'xl' : 'lg'} enemy />
        <strong>{enemyLead.name}</strong>
      </div>
      <div className="battlefield-stage__vs">VS</div>
      <div className="battlefield-stage__side battlefield-stage__side--player">
        <HeroSprite hero={playerLead} size={encounter.mode === 'duel' ? 'xl' : 'lg'} />
        <strong>{playerLead?.name || 'Your lead'}</strong>
      </div>
    </section>
  );
}

function ObjectivePanel({ encounter }) {
  const objective = encounter.objectiveState;
  if (!objective || encounter.mode !== 'party') return null;
  const progressMax = Math.max(1, objective.target || 100);
  return (
    <section className="combat-objective-panel">
      <div>
        <span className="eyebrow">Mission objective</span>
        <strong>{objective.label}</strong>
        <p>{encounter.objective}</p>
      </div>
      <div className="combat-objective-panel__tracks">
        {objective.id === 'eliminate' ? (
          <label><span>Opposition remaining</span><b>{Math.round(encounter.enemy.hp)}/{encounter.enemy.maxHp}</b><i><em className="is-enemy" style={{ width: `${pct(encounter.enemy.hp, encounter.enemy.maxHp)}%` }} /></i></label>
        ) : (
          <>
            <label><span>Your progress</span><b>{Math.round(objective.progress)}/{progressMax}</b><i><em style={{ width: `${pct(objective.progress, progressMax)}%` }} /></i></label>
            {objective.id !== 'hold' && objective.id !== 'protect' ? <label><span>Enemy progress</span><b>{Math.round(objective.enemyProgress)}/{progressMax}</b><i><em className="is-enemy" style={{ width: `${pct(objective.enemyProgress, progressMax)}%` }} /></i></label> : null}
            {objective.id === 'protect' ? <label><span>Protected target</span><b>{Math.round(objective.protectedIntegrity ?? 100)}%</b><i><em style={{ width: `${objective.protectedIntegrity ?? 100}%` }} /></i></label> : null}
          </>
        )}
      </div>
    </section>
  );
}

function EnemyTell({ encounter }) {
  const intent = encounter.enemyIntent;
  if (!intent || encounter.status !== 'active') return null;
  return (
    <section className="enemy-tell" aria-live="polite">
      <div className="enemy-tell__icon">{intent.icon || '◈'}</div>
      <div>
        <span className="eyebrow">Read the opponent</span>
        <strong>{intent.label}</strong>
        <p>{intent.telegraph || intent.description}</p>
      </div>
      <Badge tone="gold">Read {Math.round((intent.confidence ?? 0.88) * 100)}%</Badge>
    </section>
  );
}

function LeadPicker({ encounter, leadHeroId, setLeadHeroId }) {
  if (encounter.mode !== 'party' || encounter.player.roster.length <= 1) return null;
  const lead = encounter.player.roster.find((hero) => hero.id === leadHeroId) || encounter.player.roster[0];
  const sig = CLASS_SIGNATURES[lead?.classId] || CLASS_SIGNATURES.Guardian;
  return (
    <section className="combat-lead-picker">
      <label htmlFor="combat-lead"><span className="eyebrow">Tactical lead</span><strong>Who executes the Signature?</strong></label>
      <select id="combat-lead" value={leadHeroId} onChange={(event) => setLeadHeroId(event.target.value)}>
        {encounter.player.roster.map((hero) => <option key={hero.id} value={hero.id}>{hero.name} — {hero.classId} / {hero.role}</option>)}
      </select>
      <small><b>{sig.icon} {sig.name}</b> — {sig.text}</small>
    </section>
  );
}

function ActionGrid({ encounter, actions, leadHeroId }) {
  const available = useMemo(() => COMBAT_ACTIONS.filter((action) => action.modes.includes(encounter.mode)), [encounter.mode]);
  return (
    <section className="combat-actions" aria-label="Combat actions">
      {available.map((base) => {
        const action = combatActionDefinition(encounter, base.id, leadHeroId);
        const meta = action.id === 'recover' ? 'Restore stamina' : action.id === 'objective' ? 'Mission progress' : `${action.cost || 0} STA${action.cooldown ? ` · CD ${action.cooldown}` : ''}`;
        return (
          <button type="button" key={action.id} disabled={Boolean(action.disabled)} onClick={() => actions.combatAction(action.id, leadHeroId)} title={action.hint}>
            <span className="combat-actions__icon">{action.icon || '◇'}</span>
            <div><strong>{action.label}</strong><small>{action.hint}</small></div>
            <em>{action.disabled && action.cooldown > 0 ? `Cooldown ${action.cooldown}` : meta}</em>
          </button>
        );
      })}
    </section>
  );
}

function CombatLog({ encounter }) {
  return (
    <section className="combat-log">
      <header><span className="eyebrow">Combat chronicle</span><small>Latest exchanges</small></header>
      <div aria-live="polite">
        {encounter.log.slice(-10).reverse().map((entry, index) => (
          <p key={`${entry.turn}-${index}`} className={`combat-log__${entry.tone || 'neutral'}`}><b>{entry.turn ? `T${entry.turn}` : '•'}</b><span>{entry.text}</span></p>
        ))}
      </div>
    </section>
  );
}

function CombatResult({ encounter, actions }) {
  const result = encounter.result || {};
  const victory = Boolean(result.playerWon);
  const objective = result.objective;
  return (
    <section className={`combat-result combat-result--${victory ? 'green' : 'red'}`} aria-live="polite">
      <div className="combat-result__seal">{victory ? '♛' : '✕'}</div>
      <div>
        <span className="eyebrow">Engagement complete</span>
        <h3>{victory ? 'Victory' : 'Defeat'}</h3>
        <p>{result.method || 'The field is decided.'} · {result.turns || encounter.turn} turns · performance {Math.round(result.performance || 0)}/100.</p>
        <p><strong>Field state:</strong> you {Math.round(result.playerHpPct || 0)}% HP · opposition {Math.round(result.enemyHpPct || 0)}% HP{objective && objective.id !== 'eliminate' ? ` · objective ${Math.round(objective.progress || 0)}/${objective.target}` : ''}.</p>
      </div>
      <Button variant="primary" size="lg" onClick={() => actions.concludeCombat()}>Record result & continue</Button>
    </section>
  );
}

export default function CombatArenaModal({ encounter, actions }) {
  const [leadHeroId, setLeadHeroId] = useState(encounter?.player?.leadHeroId || encounter?.player?.roster?.[0]?.id || '');
  useEffect(() => {
    setLeadHeroId(encounter?.player?.leadHeroId || encounter?.player?.roster?.[0]?.id || '');
  }, [encounter?.id]);
  if (!encounter) return null;
  const active = encounter.status === 'active';
  const playerLead = encounter.player.roster.find((hero) => hero.id === leadHeroId) || encounter.player.roster[0];
  const enemyLead = encounter.enemy.roster.find((hero) => hero.id === encounter.enemy.leadHeroId) || encounter.enemy.roster[0];
  const primalRead = playerLead && enemyLead ? combatPrimalText(playerLead.primal, enemyLead.primal) : '';
  const typeLabel = encounter.mode === 'duel' ? 'Arena duel' : 'Company engagement';

  return (
    <Modal open title={encounter.title} eyebrow={`${typeLabel} · ${encounter.roundName || 'Engagement'} · Turn ${Math.min(encounter.turn, encounter.maxTurns)}/${encounter.maxTurns}`} preventClose width="wide">
      <div className={`combat-arena combat-arena--${encounter.mode}`}>
        <BattlefieldStage encounter={encounter} leadHeroId={leadHeroId} />
        <ObjectivePanel encounter={encounter} />
        <div className="combat-matchup">
          <SideSummary side={encounter.player} leadHeroId={leadHeroId} />
          <div className="combat-versus"><span>VS</span><small>{primalRead}</small></div>
          <SideSummary side={encounter.enemy} enemy />
        </div>
        {active ? <EnemyTell encounter={encounter} /> : null}
        {active ? <LeadPicker encounter={encounter} leadHeroId={leadHeroId} setLeadHeroId={setLeadHeroId} /> : null}
        {active ? <ActionGrid encounter={encounter} actions={actions} leadHeroId={leadHeroId} /> : <CombatResult encounter={encounter} actions={actions} />}
        <div className="combat-arena__lower">
          <CombatLog encounter={encounter} />
          {active ? (
            <aside className="combat-auto">
              <span className="eyebrow">Routine encounter?</span>
              <p>Auto-resolve reads tells competently. Manual play can outperform it by countering guard with Feint, punishing Recover with Attack, timing Signatures, and pressing mission objectives at the right moment.</p>
              <Button onClick={() => actions.autoResolveCombat()}>Auto-resolve remaining combat</Button>
            </aside>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
