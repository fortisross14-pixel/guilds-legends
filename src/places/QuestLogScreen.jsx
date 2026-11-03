import React from 'react';
import { getHero, getPromotionRequirement } from '../game/engine.js';
import { EmptyState, Panel, ProgressBar } from '../components/UI.jsx';

// Active contracts, open promises and current objectives in one place.
export default function QuestLogScreen({ state, navigate }) {
  const promises = state.heroes
    .filter((hero) => !['dead', 'retired'].includes(hero.status))
    .flatMap((hero) => (hero.promises || []).filter((promise) => promise.status === 'active').map((promise) => ({ hero, promise })));
  const goals = (state.goals || []).filter((goal) => !goal.completed).slice(0, 4);
  const promotion = getPromotionRequirement(state);

  return (
    <div className="quest-log">
      <Panel title="Active contracts" eyebrow={`${state.activeMissions.length} compan${state.activeMissions.length === 1 ? 'y' : 'ies'} in the field`}>
        {state.activeMissions.length ? (
          state.activeMissions.map((mission) => (
            <button key={mission.id} className="quest-row" onClick={() => navigate({ view: 'map', pin: mission.locationId })}>
              <strong>{mission.title}</strong>
              <small>
                {mission.locationName} · {mission.assignments.map((assignment) => getHero(state, assignment.heroId)?.name).join(', ')} ·{' '}
                {mission.remaining > 0 ? `${mission.remaining} week${mission.remaining === 1 ? '' : 's'} remaining` : 'returning now'}
              </small>
              <span className="quest-row__map">Show on map 📍</span>
            </button>
          ))
        ) : (
          <EmptyState icon="⌖" title="No contracts in progress" text="Take one at a Notice Board." />
        )}
      </Panel>
      <Panel title="Promises" eyebrow="Keep them to protect loyalty">
        {promises.length ? (
          promises.map(({ hero, promise }) => (
            <p key={promise.id} className="quest-row">
              <strong>{hero.name}</strong>{' '}
              <small>
                {promise.label} · due {promise.dueLabel}
              </small>
            </p>
          ))
        ) : (
          <p className="muted">No open promises.</p>
        )}
      </Panel>
      <Panel title="Objectives" eyebrow="Goals and the next promotion">
        {goals.map((goal) => (
          <p key={goal.id} className="quest-row">
            <strong>{goal.title}</strong> <small>{goal.description}</small>
          </p>
        ))}
        {promotion ? (
          <div className="quest-row">
            <strong>Promotion to {promotion.target.id}</strong>
            {[
              ['Fame', promotion.fame],
              ['Contracts', promotion.contracts],
              ['Official rank', promotion.rank],
              ['Signature feats', promotion.feat],
              ['Years', promotion.time],
            ].map(([label, item]) => (
              <ProgressBar
                key={label}
                compact
                tone={item.met ? 'green' : 'gold'}
                value={label === 'Official rank' ? (item.met ? 1 : 0) : item.current}
                max={label === 'Official rank' ? 1 : item.target || 1}
                label={label === 'Official rank' ? `${label}: #${item.current} (need #${item.target})` : `${label}: ${item.current}/${item.target}`}
              />
            ))}
          </div>
        ) : null}
      </Panel>
    </div>
  );
}
