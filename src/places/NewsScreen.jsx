import React, { useEffect } from 'react';
import { BOSSES } from '../data/enemies.js';
import { EmptyState, Panel } from '../components/UI.jsx';

// Chronicle → News: minor world events that didn't need a pop-up.
export function NewsScreen({ state, actions }) {
  useEffect(() => {
    if (state.newsUnread) actions.markNewsRead();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const news = state.news || [];
  return (
    <Panel title="News" eyebrow="Town talk, side-job results and world events">
      {news.length ? (
        <ul className="news-feed">
          {news.map((item) => (
            <li key={item.id} className={`news-item news-item--${item.tone || 'neutral'}`}>
              <time>{item.date}</time>
              <strong>{item.title}</strong>
              <p>{item.text}</p>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon="✉" title="No news yet" text="Advance a week and listen to the town." />
      )}
    </Panel>
  );
}

// Codex → Bestiary: regional bosses (defeated ones are remembered). The story lives in the Quest Log and the Lore codex.
export function BestiaryScreen({ state }) {
  const defeated = new Map((state.defeatedBosses || []).map((item) => [item.id, item]));
  return (
    <div className="bestiary">
      <Panel title="Regional bosses" eyebrow="One per region; their contracts appear once you are Known there">
        {Object.entries(BOSSES).map(([region, boss]) => (
          <article key={boss.id} className={`bestiary-row ${defeated.has(boss.id) ? 'is-defeated' : ''}`}>
            <img src={`${import.meta.env.BASE_URL}art/enemies/${boss.sprite}.png`} alt="" />
            <div>
              <strong>{boss.name}</strong>
              <small>
                {region} · {defeated.has(boss.id) ? `Defeated in ${defeated.get(boss.id).year}` : 'Undefeated'}
              </small>
              <p>{boss.intro}</p>
            </div>
          </article>
        ))}
      </Panel>
    </div>
  );
}
