import React, { useEffect, useMemo, useState } from 'react';
import { MISSION_GAME_ACTIONS, missionGameActionPreview, PERSONALITY_GAME_NOTES } from '../game/missionGames.js';
import { Badge, Button, HeroPortrait, Modal, PrimalBadge, ProgressBar } from './UI.jsx';
import Icon from './Icon.jsx';

const NO_ACTIONS = [];

function Metric({ label, value, max = 100, tone = 'blue', inverse = false, detail = null }) {
  const display = Math.max(0, Math.round(value ?? 0));
  const barValue = inverse ? Math.max(0, max - display) : display;
  return (
    <div className="mission-game-metric">
      <div>
        <span>{label}</span>
        <strong>
          {display}
          {max === 100 ? '%' : ''}
        </strong>
      </div>
      <ProgressBar value={barValue} max={max} tone={tone} compact />
      {detail ? <small>{detail}</small> : null}
    </div>
  );
}

function DiplomacyMeters({ game }) {
  const m = game.metrics;
  return (
    <div className="mission-game-metrics">
      <Metric label="Agreement" value={m.agreement} tone={m.agreement >= 75 ? 'green' : 'gold'} />
      <Metric label="Trust" value={m.trust} tone={m.trust >= 45 ? 'green' : m.trust >= 20 ? 'gold' : 'red'} />
      <Metric label="Insight" value={m.insight} tone="blue" />
      <Metric
        label="Patience"
        value={m.patience}
        max={8}
        tone={m.patience >= 4 ? 'blue' : 'red'}
        detail={`${m.concessions} concession${m.concessions === 1 ? '' : 's'} offered`}
      />
    </div>
  );
}

function ExpeditionMeters({ game }) {
  const m = game.metrics;
  return (
    <div className="mission-game-metrics">
      <Metric label="Route progress" value={m.progress} tone={m.progress >= 75 ? 'green' : 'blue'} />
      <Metric label="Evidence" value={m.evidence} tone="purple" />
      <Metric label={game.requiresVerification ? 'Certainty / authenticity' : 'Certainty'} value={m.certainty} tone="gold" />
      <Metric label="Supplies" value={m.supplies} tone={m.supplies >= 40 ? 'green' : m.supplies >= 20 ? 'gold' : 'red'} />
      <Metric label="Hazard" value={m.hazard} tone={m.hazard >= 70 ? 'red' : m.hazard >= 40 ? 'gold' : 'green'} inverse />
    </div>
  );
}

function IntrigueMeters({ game }) {
  const m = game.metrics;
  return (
    <div className="mission-game-metrics">
      <Metric label="Objective" value={m.progress} tone={m.progress >= 75 ? 'green' : 'purple'} />
      <Metric label="Intel" value={m.intel} tone="blue" />
      <Metric
        label="Heat"
        value={m.heat}
        tone={m.heat >= 70 ? 'red' : m.heat >= 40 ? 'gold' : 'green'}
        inverse
        detail={m.progress >= 70 ? 'Extraction is now possible.' : 'Reach 70% objective progress before attempting extraction.'}
      />
    </div>
  );
}

export default function MissionGameModal({ game, actions }) {
  const [leadHeroId, setLeadHeroId] = useState(game?.leadHeroId || game?.roster?.[0]?.id || null);
  useEffect(() => {
    if (!game) return;
    if (!game.roster.some((hero) => hero.id === leadHeroId)) setLeadHeroId(game.leadHeroId || game.roster[0]?.id || null);
  }, [game, leadHeroId]);
  const lead = game?.roster?.find((hero) => hero.id === leadHeroId) || game?.roster?.[0];
  const actionsList = MISSION_GAME_ACTIONS[game?.type] || NO_ACTIONS;
  const previews = useMemo(
    () => Object.fromEntries(actionsList.map((action) => [action.id, missionGameActionPreview(game, action.id, leadHeroId)])),
    [game, actionsList, leadHeroId],
  );
  if (!game) return null;

  const guidance =
    game.type === 'Diplomacy'
      ? `Reach 100 Agreement without destroying Trust or exhausting Patience. The other side appears to value ${game.disposition?.toLowerCase()}.`
      : game.type === 'Expedition'
        ? `Reach 100 Route Progress before supplies or hazard collapse. ${game.requiresVerification ? 'A great result also requires enough certainty to know what you actually found.' : 'Evidence and certainty improve the quality of the result.'}`
        : 'Build enough objective progress, control Heat, then Extract. Reaching the target is useless if the cell cannot get out.';

  return (
    <Modal open title={game.title} eyebrow={`${game.type} challenge · Turn ${game.turn}/${game.maxTurns}`} preventClose width="wide">
      <div className={`mission-game mission-game--${game.type.toLowerCase()}`}>
        <header className="mission-game__header">
          <div>
            <Badge tone={game.type === 'Diplomacy' ? 'gold' : game.type === 'Expedition' ? 'blue' : 'purple'}>{game.type}</Badge>
            <h3>{guidance}</h3>
          </div>
          <div className="mission-game__context">
            <span>
              Difficulty <strong>{game.difficulty}</strong>
            </span>
            {game.patronPrimal ? (
              <span>
                Patron <PrimalBadge primal={game.patronPrimal} compact />
              </span>
            ) : null}
          </div>
        </header>

        {game.type === 'Diplomacy' ? (
          <DiplomacyMeters game={game} />
        ) : game.type === 'Expedition' ? (
          <ExpeditionMeters game={game} />
        ) : (
          <IntrigueMeters game={game} />
        )}

        <section className="mission-game__lead">
          <div>
            <span className="eyebrow">Who leads this move?</span>
            <p>Class, attributes, assigned role, personality and flaw all change how well an action fits.</p>
          </div>
          <div className="mission-game__roster" role="radiogroup" aria-label="Lead hero">
            {game.roster.map((hero) => (
              <button
                key={hero.id}
                role="radio"
                aria-checked={hero.id === leadHeroId}
                className={hero.id === leadHeroId ? 'is-active' : ''}
                onClick={() => setLeadHeroId(hero.id)}
              >
                <HeroPortrait hero={hero} size="xs" showStatus={false} />
                <span>
                  <strong>{hero.name}</strong>
                  <small>
                    {hero.role} · {hero.personality}
                  </small>
                </span>
              </button>
            ))}
          </div>
          {lead ? (
            <div className="mission-game__character-note">
              <strong>{lead.personality}</strong>
              <span>{PERSONALITY_GAME_NOTES[lead.personality] || 'Personality shapes situational performance.'}</span>
              <small>Flaw: {lead.flaw}</small>
            </div>
          ) : null}
        </section>

        <section className="mission-game__actions">
          {actionsList.map((action) => {
            const preview = previews[action.id];
            const unavailable = game.type === 'Intrigue' && action.id === 'extract' && game.metrics.progress < 70;
            return (
              <button key={action.id} disabled={unavailable} onClick={() => actions.missionGameAction(action.id, leadHeroId)}>
                <span className="mission-game__action-icon"><Icon name={action.icon} size={20} /></span>
                <div>
                  <strong>{action.label}</strong>
                  <p>{action.hint}</p>
                  {preview ? (
                    <small>
                      Lead fit {preview.score}
                      {preview.netCharacter ? ` · character ${preview.netCharacter > 0 ? '+' : ''}${preview.netCharacter}` : ''}
                    </small>
                  ) : null}
                </div>
                <i>›</i>
              </button>
            );
          })}
        </section>

        <div className="mission-game__footer">
          <div>
            <strong>Player control matters.</strong>
            <p>Auto Resolve uses competent heuristics but cannot exploit every personality, role or situation as well as deliberate play.</p>
          </div>
          <Button onClick={actions.autoResolveMissionGame}>Auto Resolve challenge</Button>
        </div>

        <section className="mission-game__log" aria-live="polite">
          <span className="eyebrow">Field log</span>
          {(game.log || []).slice(0, 8).map((entry, index) => (
            <article className={`is-${entry.tone || 'neutral'}`} key={`${entry.turn}-${index}`}>
              <time>T{entry.turn}</time>
              <p>{entry.text}</p>
            </article>
          ))}
        </section>
      </div>
    </Modal>
  );
}
