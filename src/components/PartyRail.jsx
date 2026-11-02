import React from 'react';
import { HeroPortrait, ProgressBar } from './UI.jsx';

// A persistent, character-led shortcut. It deliberately has no game logic:
// the dossier remains the single place for changes to a hero.
export default function PartyRail({ state, onOpenHero }) {
  const preferred = (state.guild.mainParty || []).map((id) => state.heroes.find((hero) => hero.id === id)).filter(Boolean);
  const heroes = (preferred.length ? preferred : state.heroes.filter((hero) => !['dead', 'retired'].includes(hero.status)).slice(0, 4)).slice(0, 4);
  if (!heroes.length) return null;

  return (
    <aside className="party-rail" aria-label="Main party">
      <div className="party-rail__title">
        <span>Your company</span>
        <small>{preferred.length ? `${preferred.length} marked for the field` : 'Choose a main party in the War Room'}</small>
      </div>
      <div className="party-rail__members">
        {heroes.map((hero) => (
          <button key={hero.id} className={`party-rail__member party-rail__member--${hero.status}`} onClick={() => onOpenHero(hero.id)}>
            <HeroPortrait hero={hero} size="sm" />
            <span>
              <strong>{hero.name}</strong>
              <small>Lv {hero.level} · {hero.status === 'available' ? 'Ready' : hero.status}</small>
              <ProgressBar value={hero.health || 0} max={100} compact tone={hero.health >= 50 ? 'green' : 'red'} />
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
}
