import React, { useState } from 'react';
import { LORE, LORE_CATEGORIES } from '../data/lore.js';
import { getLoreCodex } from '../game/engine.js';
import { Badge, EmptyState, Panel } from '../components/UI.jsx';
import Asset from '../components/Asset.jsx';

// The Lore codex (Chronicle menu): where the world's history lives. Entries are
// short and unlock through the story, conversations, arena history boards and
// discoveries, so dialogue can stay short.
export default function LoreCodex({ state }) {
  const entries = getLoreCodex(state);
  const [category, setCategory] = useState('All');
  const shown = entries.filter((entry) => category === 'All' || entry.category === category);
  const hidden = LORE.length - entries.length;
  return (
    <div className="screen screen--history lore-codex">
      <header className="screen-heading">
        <div>
          <span className="eyebrow">The world’s history</span>
          <h1>Lore codex</h1>
          <p>What the guild has learned: from the story, from people, from arena boards and from the places it has walked.</p>
        </div>
        <div className="heading-metrics">
          <Badge tone="purple">{entries.length} found</Badge>
          {hidden ? <Badge>{hidden} still hidden</Badge> : null}
        </div>
      </header>
      <div className="filter-pills">
        {['All', ...LORE_CATEGORIES].map((item) => (
          <button key={item} className={category === item ? 'is-selected' : ''} onClick={() => setCategory(item)}>
            {item}
          </button>
        ))}
      </div>
      {shown.length ? (
        <div className="lore-grid">
          {shown.map((entry) => (
            <Panel key={entry.id} title={entry.title} eyebrow={entry.category}>
              {entry.id === 'the-banner' ? <Asset id="relic.banner" className="lore-grid__relic" alt="" /> : null}
              {entry.id === 'argent-crown' ? <Asset id="crest.argent-crown" className="lore-grid__relic" alt="" /> : null}
              <p>{entry.text}</p>
            </Panel>
          ))}
        </div>
      ) : (
        <EmptyState icon="✦" title="Nothing here yet" text="Talk to people, read the arena boards and follow the story." />
      )}
    </div>
  );
}
