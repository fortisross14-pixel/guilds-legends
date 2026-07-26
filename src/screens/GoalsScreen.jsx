import React from 'react';
import { ONBOARDING_STEPS, TIERS } from '../data/content.js';
import { getGoalMetric, getPromotionRequirement } from '../game/engine.js';
import { Badge, Panel, ProgressBar } from '../components/UI.jsx';

export default function GoalsScreen({ state }) {
  const promotion = getPromotionRequirement(state);
  const completedTutorial = state.tutorial.step;
  const completedGoals = state.goals.filter((goal) => goal.completed).length;
  const achievements = state.achievements.filter((achievement) => achievement.unlocked).length;

  return (
    <div className="screen screen--goals">
      <header className="screen-heading">
        <div><span className="eyebrow">Specific first, strategic later</span><h1>Orders, Ambitions & Achievements</h1><p>The guild begins with exact instructions. As the player understands the loop, goals become longer and leave the method open.</p></div>
        <div className="heading-metrics"><Badge tone="green">{completedGoals}/{state.goals.length} goals</Badge><Badge tone="purple">{achievements}/{state.achievements.length} achievements</Badge></div>
      </header>

      <div className="goal-summary">
        <div><span>Opening orders</span><strong>{state.tutorial.completed ? 'Complete' : `${completedTutorial}/${ONBOARDING_STEPS.length}`}</strong><ProgressBar value={completedTutorial} max={ONBOARDING_STEPS.length} tone="green" compact /></div>
        <div><span>Campaign goals</span><strong>{completedGoals}/{state.goals.length}</strong><ProgressBar value={completedGoals} max={state.goals.length} tone="gold" compact /></div>
        <div><span>Achievements</span><strong>{achievements}/{state.achievements.length}</strong><ProgressBar value={achievements} max={state.achievements.length} tone="purple" compact /></div>
      </div>

      <Panel title="The learning path" eyebrow="First minutes">
        <div className="tutorial-path">
          {ONBOARDING_STEPS.map((step, index) => {
            const complete = index < state.tutorial.step || state.tutorial.completed;
            const current = index === state.tutorial.step && !state.tutorial.completed;
            return <article key={step.id} className={`${complete ? 'is-complete' : ''} ${current ? 'is-current' : ''}`}><span>{complete ? '✓' : index + 1}</span><div><h3>{step.title}</h3><p>{step.body}</p><small>Reward: {step.reward} crowns</small></div></article>;
          })}
        </div>
      </Panel>

      <div className="goal-era-list">
        {TIERS.slice(0, 5).map((tier, tierIndex) => {
          const goals = state.goals.filter((goal) => goal.tier === tier.id);
          if (!goals.length) return null;
          return (
            <Panel key={tier.id} title={`${tier.id} ambitions`} eyebrow={tier.scope} className={state.guild.tierIndex < tierIndex ? 'is-locked-panel' : ''}>
              <div className="campaign-goal-list">
                {goals.map((goal) => {
                  const current = getGoalMetric(state, goal.metric);
                  const displayCurrent = goal.comparator === 'lte' && current === 99 ? 0 : current;
                  return <article key={goal.id} className={goal.completed ? 'is-complete' : ''}><span className="campaign-goal-list__check">{goal.completed ? '✓' : '◇'}</span><div><div className="campaign-goal-list__title"><h3>{goal.title}</h3><Badge tone={goal.completed ? 'green' : state.guild.tierIndex < tierIndex ? 'neutral' : 'gold'}>{goal.completed ? 'Completed' : `${displayCurrent}/${goal.target}`}</Badge></div><p>{goal.description}</p><ProgressBar value={goal.comparator === 'lte' ? (current <= goal.target ? goal.target : 0) : current} max={goal.target} tone={goal.completed ? 'green' : 'gold'} compact /><small>Reward: {goal.reward.crowns} crowns{goal.reward.fame ? ` · ${goal.reward.fame} fame` : ''}</small></div></article>;
                })}
              </div>
            </Panel>
          );
        })}
      </div>

      <div className="dashboard-grid dashboard-grid--goals">
        <Panel title={`Promotion to ${promotion?.target.id || 'Mythic Legacy'}`} eyebrow="Numeric standing + signature achievement">
          {promotion ? <div className="promotion-checklist">
            {[
              ['Fame', promotion.fame], ['Successful contracts', promotion.contracts], ['Guild rank', promotion.rank], ['Signature achievement', promotion.feat], ['Institutional maturity', promotion.time],
            ].map(([label, item]) => <div key={label} className={item.met ? 'is-met' : ''}><span>{item.met ? '✓' : '◇'}</span><div><strong>{label}</strong><small>{label === 'Guild rank' ? `Rank #${item.current}; need #${item.target} or better` : label === 'Institutional maturity' ? `${item.current}/${item.target} campaign years` : `${item.current}/${item.target}`}</small></div></div>)}
          </div> : <p className="muted">No higher social tier remains. Complete the final world-defining saga.</p>}
        </Panel>

        <Panel title="Achievements" eyebrow="Optional historical distinctions">
          <div className="achievement-grid">{state.achievements.map((achievement) => <article key={achievement.id} className={achievement.unlocked ? 'is-unlocked' : ''}><span>{achievement.icon}</span><div><h3>{achievement.name}</h3><p>{achievement.description}</p>{achievement.unlockedDate ? <small>Unlocked {achievement.unlockedDate}</small> : <small>Locked</small>}</div></article>)}</div>
        </Panel>
      </div>
    </div>
  );
}
