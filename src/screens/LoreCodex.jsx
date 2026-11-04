import React from 'react';
import { LORE, LORE_CATEGORIES } from '../data/lore.js';
import { getLoreCodex } from '../game/engine.js';
import { EmptyState } from '../components/UI.jsx';
import Asset from '../components/Asset.jsx';

// Records → Codex → Lore: where the world's history lives. Entries unlock through
// the story, conversations, arena boards and discoveries, so dialogue can stay
// short. One line per entry, grouped by category; tap to read.
const ART = { 'the-banner': 'relic.banner', 'argent-crown': 'crest.argent-crown' };

export default function LoreCodex({ state }) {
  const entries = getLoreCodex(state);
  const hidden = LORE.length - entries.length;
  if (!entries.length) return <EmptyState icon="book" title="Nothing here yet" text="Talk to people and follow the story." />;
  return (
    <div className="journal lore-codex">
      <p className="journal__quiet num">
        {entries.length} found{hidden ? ` · ${hidden} hidden` : ''}
      </p>
      {LORE_CATEGORIES.map((category) => {
        const shown = entries.filter((entry) => entry.category === category);
        if (!shown.length) return null;
        return (
          <section key={category} className="journal-block">
            <h3>{category}</h3>
            {shown.map((entry) => (
              <details key={entry.id} className="journal-details">
                <summary>
                  <span>{entry.title}</span>
                </summary>
                {ART[entry.id] ? <Asset id={ART[entry.id]} className="lore-grid__relic" alt="" /> : null}
                <p>{entry.text}</p>
              </details>
            ))}
          </section>
        );
      })}
    </div>
  );
}
