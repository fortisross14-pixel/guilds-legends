import React, { useState } from 'react';
import { HeroPortrait, ProgressBar } from './UI.jsx';
import { activeRoster, heroStatus, heroWarnings } from './heroStatus.js';
import DraggableHero from './DraggableHero.jsx';
import Icon from './Icon.jsx';

// The party bar: every active hero, always visible. Tap a card for the hero
// status screen; drag it onto a Guild Hall room, the main party or a slot.
export default function PartyRail({ state, actions, onOpenHero, onOpenQuests }) {
  const [collapsed, setCollapsed] = useState(false);
  const mainParty = state.guild.mainParty || [];
  const heroes = [...activeRoster(state)].sort((a, b) => Number(mainParty.includes(b.id)) - Number(mainParty.includes(a.id)));
  if (!heroes.length) return null;

  return (
    <aside className={`party-rail ${collapsed ? 'party-rail--collapsed' : ''}`} aria-label="Your heroes">
      <div className="party-rail__title">
        <span>Your company</span>
        <small>{mainParty.length ? `${mainParty.length} in the main party` : 'Pick a lead and companions: Party → Main party'}</small>
        <div className="party-rail__tools">
          <button onClick={onOpenQuests}>Quest log</button>
          <button className="party-rail__toggle" onClick={() => setCollapsed(!collapsed)} aria-expanded={!collapsed}>
            {collapsed ? 'Show' : 'Hide'}
          </button>
        </div>
      </div>
      {!collapsed ? (
        <div className="party-rail__members">
          {heroes.map((hero) => {
            const status = heroStatus(state, hero);
            const warnings = heroWarnings(state, hero);
            return (
              <DraggableHero
                key={hero.id}
                hero={hero}
                state={state}
                actions={actions}
                className={`party-rail__member party-rail__member--${status.key}`}
                onClick={() => onOpenHero(hero.id)}
                title={[status.label, ...warnings].join(' · ')}
              >
                <HeroPortrait hero={hero} size="sm" showStatus={false} />
                <span>
                  <strong>
                    {mainParty.includes(hero.id) ? (
                      <i className="party-rail__main" aria-label="Main party">
                        <Icon name="star" size={12} tone="plain" />
                      </i>
                    ) : null}
                    {hero.name}
                  </strong>
                  <small>
                    <i className="party-rail__status" aria-hidden="true">
                      <Icon name={status.icon} size={12} tone="plain" />
                    </i>{' '}
                    Lv {hero.level} · {status.label}
                  </small>
                  <ProgressBar
                    value={hero.health ?? 100}
                    max={100}
                    compact
                    tone={(hero.health ?? 100) >= 50 ? 'green' : 'red'}
                    label={`HP ${hero.health ?? 100}`}
                  />
                  <ProgressBar
                    value={hero.fatigue || 0}
                    max={100}
                    compact
                    tone={(hero.fatigue || 0) >= 60 ? 'red' : 'gold'}
                    label={`Fatigue ${hero.fatigue || 0}`}
                  />
                </span>
                {warnings.length ? <i className="party-rail__warning" aria-label={warnings.join(', ')} /> : null}
              </DraggableHero>
            );
          })}
        </div>
      ) : null}
    </aside>
  );
}
