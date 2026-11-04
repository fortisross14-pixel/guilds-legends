import React, { useState } from 'react';
import { getNemesisView, nemesisIds, rivalRecord } from '../game/engine.js';
import { Badge, Button, HeroPortrait, Panel } from '../components/UI.jsx';
import { HeadToHeadPanel } from './HistoryScreens.jsx';
import Icon from '../components/Icon.jsx';

// Guild → Rivals: rivalries, nemeses, challenges and head-to-head records.
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
                {nemeses.includes(id) ? <Icon name="swords" size={14} tone="plain" /> : null}
                {rival.name} <small>{rivalRecord(state, id).score}</small>
              </button>
            );
          })
        ) : (
          <p className="muted">No rivals yet.</p>
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
      {rivalId ? <HeadToHeadPanel state={state} rivalId={rivalId} /> : null}
    </div>
  );
}
