import React from 'react';
import { normalizeClassId } from '../data/content.js';
import { ACTIVITY_BY_ID, MONTHLY_ACTIVITIES, TRAINING_FOCI } from '../data/activities.js';
import { Badge, Button, HeroPortrait, ProgressBar } from './UI.jsx';

function effectiveActivity(hero) {
  if (hero.status === 'mission') return { id: 'Mission', label: 'On mission', icon: '⌖' };
  if (hero.status === 'tournament') return { id: 'Tournament', label: 'Tournament', icon: '♛' };
  if (hero.status === 'injured')
    return { ...(ACTIVITY_BY_ID[hero.monthlyActivity] || ACTIVITY_BY_ID.Infirmary), label: hero.monthlyActivity === 'Rest' ? 'Resting injured' : 'Infirmary' };
  return ACTIVITY_BY_ID[hero.monthlyActivity] || ACTIVITY_BY_ID.Training;
}

export default function CouncilPlanner({ state, actions, compact = false }) {
  const activeHeroes = state.heroes.filter((hero) => !['retired', 'dead', 'candidate'].includes(hero.status));
  const counts = activeHeroes.reduce((result, hero) => {
    const activity = effectiveActivity(hero).id;
    result[activity] = (result[activity] || 0) + 1;
    return result;
  }, {});
  const healthyAvailable = activeHeroes.filter((hero) => hero.status === 'available');
  const ready = healthyAvailable.filter((hero) => hero.fatigue < 65 && hero.health >= 55).length;

  return (
    <div className={`council-planner ${compact ? 'council-planner--compact' : ''}`}>
      <div className="council-planner__summary">
        <div>
          <span>Ready</span>
          <strong>{ready}</strong>
          <small>available heroes</small>
        </div>
        <div>
          <span>Training</span>
          <strong>{counts.Training || 0}</strong>
          <small>this month</small>
        </div>
        <div>
          <span>Recovery</span>
          <strong>{(counts.Rest || 0) + (counts.Infirmary || 0)}</strong>
          <small>rest / infirmary</small>
        </div>
        <div>
          <span>Deployed</span>
          <strong>{(counts.Mission || 0) + (counts.Tournament || 0)}</strong>
          <small>missions / events</small>
        </div>
      </div>

      <div className="council-roster">
        {activeHeroes.map((hero) => {
          const locked = ['mission', 'tournament'].includes(hero.status);
          const activity = effectiveActivity(hero);
          const unhealthy = hero.status === 'injured' || hero.health < 70 || hero.fatigue > 55;
          return (
            <article className={`council-row ${locked ? 'is-locked' : ''}`} key={hero.id}>
              <button className="council-row__hero" onClick={() => actions.openHero(hero.id)}>
                <HeroPortrait hero={hero} size="sm" />
                <span>
                  <strong>{hero.name}</strong>
                  <small>
                    Lv {hero.level} · {hero.rarity} {normalizeClassId(hero.classId)}
                  </small>
                </span>
              </button>
              <div className="council-row__condition">
                <ProgressBar
                  value={100 - hero.fatigue}
                  max={100}
                  label="Readiness"
                  compact
                  tone={hero.fatigue < 35 ? 'green' : hero.fatigue < 65 ? 'gold' : 'red'}
                />
                {unhealthy ? (
                  <Badge tone={hero.status === 'injured' ? 'red' : 'gold'}>
                    {hero.status === 'injured' ? `${hero.injuryMonths}m injury` : hero.health < 70 ? `${hero.health}% health` : `${hero.fatigue}% fatigue`}
                  </Badge>
                ) : (
                  <Badge tone="green">Fit</Badge>
                )}
              </div>
              <div className="council-row__assignment">
                {locked ? (
                  <div className="assignment-locked">
                    <span>{activity.icon}</span>
                    <strong>{activity.label}</strong>
                  </div>
                ) : (
                  <>
                    <label>
                      <span>Monthly assignment</span>
                      <select
                        value={hero.monthlyActivity || (hero.status === 'injured' ? 'Infirmary' : 'Training')}
                        onChange={(event) => actions.setMonthlyActivity(hero.id, event.target.value)}
                      >
                        {MONTHLY_ACTIVITIES.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.icon} {item.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    {(hero.monthlyActivity || 'Training') === 'Training' ? (
                      <label>
                        <span>Training focus</span>
                        <select value={hero.training || 'Fundamentals'} onChange={(event) => actions.setTraining(hero.id, event.target.value)}>
                          {TRAINING_FOCI.map((item) => (
                            <option key={item}>{item}</option>
                          ))}
                        </select>
                      </label>
                    ) : null}
                  </>
                )}
              </div>
              <p className="council-row__effect">{activity.description || (locked ? 'This hero is committed until the current event resolves.' : '')}</p>
            </article>
          );
        })}
      </div>

      <footer className="council-planner__footer">
        <div>
          <strong>Assignments persist.</strong>
          <span>Change only what you want; the rest of the company keeps its current routine next month.</span>
        </div>
        <Button
          variant="primary"
          icon="➜"
          onClick={() => actions.advance(1)}
          disabled={
            state.pendingDecisions.length > 0 || [...(state.tournaments || []), ...(state.guildTournaments || [])].some((event) => event.status === 'active')
          }
        >
          Resolve month
        </Button>
      </footer>
    </div>
  );
}
