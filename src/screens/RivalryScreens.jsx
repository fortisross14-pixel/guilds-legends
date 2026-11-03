import React, { useState } from 'react';
import { getNemesisView, getReputationSummary, nemesisIds, rivalRecord } from '../game/engine.js';
import { Badge, Button, HeroPortrait, Panel, ProgressBar } from '../components/UI.jsx';

// Herald → Reputation: families (with perks) and regions.
export function ReputationView({ state }) {
  const summary = getReputationSummary(state);
  return (
    <div className="reputation-view">
      <p className="reputation-view__title">
        Specialization: <strong>{summary.title || 'none yet (reach Known in a family)'}</strong>
      </p>
      <Panel title="Mission families" eyebrow="Completed contracts raise reputation; failures lower it a little">
        {summary.families.map((item) => (
          <article key={item.family} className="reputation-row">
            <div>
              <strong>
                {item.family} · {item.name}
              </strong>
              <small>{item.perk}</small>
            </div>
            <ProgressBar
              value={item.next ? item.points : 1}
              max={item.next || 1}
              compact
              tone="gold"
              label={item.next ? `${item.points}/${item.next} to ${item.nextName}` : `${item.points} · maximum`}
            />
          </article>
        ))}
      </Panel>
      <Panel title="Regions" eyebrow="Regional standing: +5% pay and −5% signing fees per level in that region">
        {summary.regions.map((item) => (
          <article key={item.region} className="reputation-row">
            <div>
              <strong>
                {item.label} · {item.name}
              </strong>
            </div>
            <ProgressBar
              value={item.next ? item.points : 1}
              max={item.next || 1}
              compact
              tone="blue"
              label={item.next ? `${item.points}/${item.next}` : `${item.points}`}
            />
          </article>
        ))}
      </Panel>
    </div>
  );
}

// Herald → Rivals: rivalry scores, nemesis pages and challenges.
export function NemesisView({ state, actions, initialRivalId = null }) {
  const nemeses = nemesisIds(state);
  const ranked = Object.keys(state.rivalries || {})
    .filter((id) => state.rivals.some((rival) => rival.id === id))
    .sort((a, b) => rivalRecord(state, b).score - rivalRecord(state, a).score)
    .slice(0, 8);
  const [rivalId, setRivalId] = useState(initialRivalId || nemeses[0] || ranked[0] || null);
  const view = rivalId ? getNemesisView(state, rivalId) : null;
  const challenge = state.challenge;

  return (
    <div className="nemesis-view">
      {challenge?.status === 'pending' ? (
        <Panel
          title={`${challenge.rivalName} ${challenge.by === 'us' ? 'accepted your challenge' : 'challenges you'}`}
          eyebrow={`Stakes: ${challenge.stakes.gold} gold, ${challenge.stakes.fame} fame, ${challenge.stakes.points} official points`}
        >
          <div className="contract-options">
            <Button variant="primary" onClick={actions.acceptChallenge}>
              Fight now
            </Button>
            <Button onClick={actions.declineChallenge}>Decline (−{Math.round(challenge.stakes.fame / 2)} fame)</Button>
          </div>
        </Panel>
      ) : null}
      <div className="nemesis-view__list">
        {ranked.length ? (
          ranked.map((id) => {
            const rival = state.rivals.find((item) => item.id === id);
            return (
              <button
                key={id}
                className={`nemesis-chip ${id === rivalId ? 'is-selected' : ''} ${nemeses.includes(id) ? 'is-nemesis' : ''}`}
                onClick={() => setRivalId(id)}
              >
                {nemeses.includes(id) ? '⚔ ' : ''}
                {rival.name} <small>{rivalRecord(state, id).score}</small>
              </button>
            );
          })
        ) : (
          <p className="muted">No rivalries yet. Meet guilds in tournaments, let them take your contracts, or trade heroes with them.</p>
        )}
      </div>
      {view ? (
        <Panel title={view.rival.name} eyebrow={view.nemesis ? 'Nemesis' : `Rivalry score ${view.record.score}`}>
          <div className="nemesis-grid">
            <section>
              <h3>Head to head</h3>
              <p>
                Bouts {view.record.boutsWon}–{view.record.boutsLost} · Challenges {view.record.challengesWon}–{view.record.challengesLost}
              </p>
              <p>
                Contracts they took from you: {view.record.contractsTaken} · Poached from you: {view.record.poachedFromUs} · Poached from them:{' '}
                {view.record.poachedFromThem}
              </p>
            </section>
            <section>
              <h3>Ranks (global)</h3>
              {view.ladders.map((row) => (
                <p key={row.ladder}>
                  {row.ladder}: them #{row.theirs} · you #{row.ours}
                </p>
              ))}
            </section>
            {view.star ? (
              <section>
                <h3>Their star</h3>
                <button className="room-hero__who" onClick={() => actions.openHero(view.star.id)}>
                  <HeroPortrait hero={view.star} size="sm" showStatus={false} />
                  <span>
                    <strong>{view.star.name}</strong>
                    <small>
                      Lv {view.star.level} {view.star.rarity} {view.star.classId}
                    </small>
                  </span>
                </button>
              </section>
            ) : null}
          </div>
          {view.nemesis ? (
            <Button variant="primary" disabled={!view.canChallenge} onClick={() => actions.challengeNemesis(view.rival.id)}>
              {view.canChallenge ? 'Issue a challenge' : 'Challenge already used this season'}
            </Button>
          ) : (
            <Badge>Becomes a nemesis at 20+ rivalry and in the top 2</Badge>
          )}
        </Panel>
      ) : null}
    </div>
  );
}
