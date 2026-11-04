import React, { useState } from 'react';
import { BOSSES } from '../data/enemies.js';
import { Panel } from '../components/UI.jsx';
import LoreCodex from './LoreCodex.jsx';
import ChronicleScreen from './ChronicleScreen.jsx';
import { GuildDirectory } from './RankingsScreen.jsx';

// Records → Codex: what the guild knows about the world, in one tab: the Lore,
// the Almanac (the guild's chronicle), the Bestiary and the guild directory.

const PAGES = [
  ['lore', 'Lore'],
  ['almanac', 'Almanac'],
  ['bestiary', 'Bestiary'],
  ['guilds', 'Guilds'],
];

function Bestiary({ state }) {
  const defeated = new Map((state.defeatedBosses || []).map((item) => [item.id, item]));
  return (
    <Panel title="Regional bosses">
      {Object.entries(BOSSES).map(([region, boss]) => (
        <details key={boss.id} className={`journal-details bestiary-row ${defeated.has(boss.id) ? 'is-defeated' : ''}`}>
          <summary>
            <img src={`${import.meta.env.BASE_URL}art/enemies/${boss.sprite}.png`} alt="" />
            <span>{boss.name}</span>
            <small>{defeated.has(boss.id) ? `Defeated ${defeated.get(boss.id).year}` : region}</small>
          </summary>
          <p>{boss.intro}</p>
        </details>
      ))}
    </Panel>
  );
}

export default function CodexScreen({ state, actions, navigate, page: initial = 'lore' }) {
  const [page, setPage] = useState(PAGES.some(([id]) => id === initial) ? initial : 'lore');
  return (
    <div className="codex">
      <div className="segmented" role="tablist" aria-label="Codex">
        {PAGES.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={page === id} className={page === id ? 'is-selected' : ''} onClick={() => setPage(id)}>
            {label}
          </button>
        ))}
      </div>
      {page === 'lore' ? <LoreCodex state={state} actions={actions} /> : null}
      {page === 'almanac' ? <ChronicleScreen state={state} actions={actions} navigate={navigate} /> : null}
      {page === 'bestiary' ? <Bestiary state={state} /> : null}
      {page === 'guilds' ? <GuildDirectory state={state} actions={actions} onOpenRival={(id) => navigate({ section: 'guild', tab: 'rivals', view: id })} /> : null}
    </div>
  );
}
