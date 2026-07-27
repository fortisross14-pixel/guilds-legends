import React from 'react';
import { getDashboardSummary, getGoalMetric, getNextAction, getPromotionRequirement } from '../game/engine.js';
import { MONTHS, ONBOARDING_STEPS, TIERS } from '../data/content.js';
import { Badge, Button, Crest, EmptyState, HeroPortrait, Panel, PrimalBadge, ProgressBar, RiskPips, Stat } from '../components/UI.jsx';

export default function HallScreen({ state, navigate, actions }) {
  const summary = getDashboardSummary(state);
  const nextAction = getNextAction(state);
  const promotion = getPromotionRequirement(state);
  const availableHeroes = state.heroes.filter((hero) => hero.status === 'available').sort((a, b) => b.power - a.power).slice(0, 5);
  const currentGoal = state.goals.find((goal) => !goal.completed && goal.tier === state.guild.tier) || state.goals.find((goal) => !goal.completed);
  const goalProgress = currentGoal ? getGoalMetric(state, currentGoal.metric) : 0;

  return (
    <div className="screen screen--hall">
      <section className="hall-hero">
        <div className="hall-hero__crest"><Crest size="xl" variant={state.guild.crest} /></div>
        <div className="hall-hero__copy">
          <span className="eyebrow">{MONTHS[state.date.month]} · Year {state.date.year}</span>
          <h1>{state.guild.name}</h1>
          <p>{state.guild.motto}</p>
          <div className="hall-hero__badges">
            <Badge tone="gold">{state.guild.tier} Guild</Badge>
            <Badge tone="blue">Rank #{state.guild.rank}</Badge>
            <Badge tone={state.guild.alignment === 'Undeclared' ? 'neutral' : 'purple'}>{state.guild.alignment}</Badge>
            <Badge tone="blue">{summary.travel ? `Traveling to ${summary.travel.toId}` : summary.location}</Badge>
            <PrimalBadge primal={summary.locationPrimal} />
            {state.guild.fallen ? <Badge tone="red">Fallen Status</Badge> : null}
          </div>
        </div>
        <div className="hall-hero__stats">
          <Stat icon="◈" label="Treasury" value={summary.crowns.toLocaleString()} sub={`${summary.upkeep}/month`} tone={summary.crowns < summary.upkeep * 2 ? 'danger' : 'gold'} />
          <Stat icon="✦" label="Fame" value={summary.fame.toLocaleString()} sub={`${summary.legacy} legacy`} tone="blue" />
          <Stat icon="♟" label="Heroes" value={`${summary.activeHeroes}/${summary.capacity}`} sub={`${summary.activeMissions} deployed`} tone="green" />
        </div>
      </section>

      <section className={`next-order next-order--${nextAction.kind}`}>
        <div className="next-order__seal">{nextAction.kind === 'critical' ? '!' : nextAction.kind === 'tutorial' ? nextAction.step : '✦'}</div>
        <div className="next-order__content">
          <span className="eyebrow">{nextAction.kind === 'tutorial' ? `Council Order ${nextAction.step} of ${nextAction.total}` : nextAction.kind === 'critical' ? 'Time has paused' : 'Recommended next step'}</span>
          <h2>{nextAction.title}</h2>
          <p>{nextAction.body}</p>
          {typeof nextAction.progress === 'number' ? <ProgressBar value={nextAction.progress} max={nextAction.target} compact /> : null}
        </div>
        <Button variant="primary" icon="➜" onClick={() => {
          if (nextAction.kind === 'tutorial' && nextAction.target === 'acknowledgeWelcome') actions.acknowledgeWelcome();
          else navigate(nextAction.screen || 'missions');
        }}>
          {nextAction.kind === 'tutorial' && nextAction.target === 'acknowledgeWelcome' ? 'Accept the order' : nextAction.kind === 'critical' ? 'Make the decision' : 'Go there'}
        </Button>
      </section>

      <div className="dashboard-grid dashboard-grid--main">
        <Panel title="The company today" eyebrow="Available roster" action={<Button size="sm" onClick={() => navigate('heroes')}>Full roster</Button>}>
          <div className="hero-strip">
            {availableHeroes.map((hero) => (
              <button className="hero-strip__item" key={hero.id} onClick={() => actions.openHero(hero.id)}>
                <HeroPortrait hero={hero} size="sm" />
                <span><strong>{hero.name}</strong><small>Lv {hero.level} · {hero.rarity} · {hero.primal} {hero.classId} · Power {hero.power}</small></span>
                <i className="form-ring" style={{ '--form': `${hero.form}%` }}>{hero.form}</i>
              </button>
            ))}
            {!availableHeroes.length ? <EmptyState icon="⌛" title="No one is available" text="Advance time or wait for an expedition to return." /> : null}
          </div>
        </Panel>

        <Panel title="Expeditions in motion" eyebrow="Active missions" action={<Button size="sm" onClick={() => navigate('missions')}>Contract board</Button>}>
          {state.activeMissions.length ? (
            <div className="active-mission-list">
              {state.activeMissions.map((mission) => (
                <div className="active-mission" key={mission.id}>
                  <div className="active-mission__icon"><RiskPips risk={mission.risk} /></div>
                  <div><strong>{mission.title}</strong><span>{mission.assignments.map((assignment) => state.heroes.find((hero) => hero.id === assignment.heroId)?.name).filter(Boolean).join(', ')}</span></div>
                  <Badge tone={mission.remaining <= 1 ? 'gold' : 'neutral'}>{mission.remaining <= 0 ? 'Decision waiting' : `${mission.remaining} month${mission.remaining === 1 ? '' : 's'}`}</Badge>
                </div>
              ))}
            </div>
          ) : <EmptyState icon="⌖" title="No party is deployed" text="The roads will not become safer while the company waits in the hall." action={<Button variant="primary" onClick={() => navigate('missions')}>Choose a contract</Button>} />}
        </Panel>
      </div>

      <div className="dashboard-grid dashboard-grid--lower">
        <Panel title="The next threshold" eyebrow={`Path to ${promotion?.target.id || 'Mythic Legacy'}`}>
          {promotion ? (
            <div className="requirement-list">
              <ProgressBar value={promotion.fame.current} max={promotion.fame.target} label="Fame" tone={promotion.fame.met ? 'green' : 'gold'} />
              <ProgressBar value={promotion.contracts.current} max={promotion.contracts.target} label="Successful contracts" tone={promotion.contracts.met ? 'green' : 'blue'} />
              <ProgressBar value={Math.max(0, promotion.rank.target + 2 - promotion.rank.current)} max={2} label={`Rank ${promotion.rank.target} or better (now #${promotion.rank.current})`} tone={promotion.rank.met ? 'green' : 'purple'} />
              <ProgressBar value={promotion.feat.current} max={promotion.feat.target} label="Signature achievements" tone={promotion.feat.met ? 'green' : 'red'} />
              <ProgressBar value={promotion.time.current} max={Math.max(1, promotion.time.target)} label={`Institutional maturity (${promotion.time.current}/${promotion.time.target} years)`} tone={promotion.time.met ? 'green' : 'blue'} />
            </div>
          ) : <p className="muted">The guild has reached the final social scale. Only the ending of its myth remains.</p>}
        </Panel>

        <Panel title={currentGoal?.title || 'A living institution'} eyebrow="Current campaign goal" action={<Button size="sm" onClick={() => navigate('goals')}>All goals</Button>}>
          {currentGoal ? (
            <div className="goal-focus">
              <p>{currentGoal.description}</p>
              <ProgressBar value={goalProgress} max={currentGoal.target} tone="gold" />
              <div className="reward-line"><span>Reward</span><strong>{currentGoal.reward.crowns} crowns{currentGoal.reward.fame ? ` · ${currentGoal.reward.fame} fame` : ''}</strong></div>
            </div>
          ) : <p className="muted">All active goals are complete. Promotion or a new era will reveal longer ambitions.</p>}
        </Panel>

        <Panel title="Latest chronicle" eyebrow="What the world remembers" action={<Button size="sm" onClick={() => navigate('chronicle')}>Open archive</Button>}>
          <div className="news-stack">
            {state.chronicle.slice(0, 4).map((event) => (
              <article className={`news-line news-line--${event.importance}`} key={event.id}>
                <time>{event.date}</time><strong>{event.title}</strong><p>{event.text}</p>
              </article>
            ))}
          </div>
        </Panel>
      </div>

      {!state.tutorial.completed && state.tutorial.step > 0 ? (
        <aside className="tutorial-rail">
          <span>{state.tutorial.step}/{ONBOARDING_STEPS.length} orders complete</span>
          <div>{ONBOARDING_STEPS.map((step, index) => <i key={step.id} className={index < state.tutorial.step ? 'is-complete' : index === state.tutorial.step ? 'is-current' : ''} />)}</div>
        </aside>
      ) : null}
    </div>
  );
}
