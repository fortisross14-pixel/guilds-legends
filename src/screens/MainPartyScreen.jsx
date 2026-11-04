import React from 'react';
import { FORMATION_TYPES } from '../data/formations.js';
import { MAIN_PARTY_SIZE } from '../game/engine.js';
import { HeroPortrait, Panel } from '../components/UI.jsx';
import { activeRoster, heroStatus } from '../components/heroStatus.js';
import DraggableHero from '../components/DraggableHero.jsx';

// Party → Main party: who travels with the founder (drag between the two
// zones, or tap), the lead, and the saved formations (no room needed).
export default function MainPartyScreen({ state, actions }) {
  const party = state.guild.mainParty || [];
  return (
    <>
      <Panel title="Main party" eyebrow={`${party.length}/${MAIN_PARTY_SIZE} · a lead and up to three companions`}>
        <div className="war-room__zones">
          {[
            ['party', 'Main party', activeRoster(state).filter((hero) => party.includes(hero.id))],
            ['bench', 'Everyone else', activeRoster(state).filter((hero) => !party.includes(hero.id))],
          ].map(([zone, label, heroes]) => (
            <div key={zone} className={`war-room__zone war-room__zone--${zone}`} data-drop={zone} data-drop-id={zone}>
              <strong>{label}</strong>
              {heroes.map((hero) => (
                <DraggableHero
                  key={hero.id}
                  hero={hero}
                  state={state}
                  actions={actions}
                  className="war-room__member"
                  onClick={() => (zone === 'party' || party.length < MAIN_PARTY_SIZE ? actions.toggleMainParty(hero.id) : null)}
                >
                  <HeroPortrait hero={hero} size="xs" showStatus={false} />
                  <span>
                    {zone === 'party' && party[0] === hero.id ? <b className="war-room__lead">Lead · </b> : null}
                    {hero.name} · Lv {hero.level} · {heroStatus(state, hero).label}
                  </span>
                  {zone === 'party' && party[0] !== hero.id ? (
                    <button
                      type="button"
                      className="war-room__make-lead"
                      onClick={(event) => {
                        event.stopPropagation();
                        actions.makeLead(hero.id);
                      }}
                    >
                      Make lead
                    </button>
                  ) : null}
                </DraggableHero>
              ))}
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Saved formations" eyebrow="Save them when you build a tournament team">
        {Object.keys(FORMATION_TYPES).map((type) => {
          const saved = state.guild.formations?.[type] || [];
          return (
            <p key={type} className="war-room__formation">
              <strong>{FORMATION_TYPES[type].label}:</strong>{' '}
              {saved.length ? saved.map((slot) => `${state.heroes.find((hero) => hero.id === slot.heroId)?.name || '—'} (${slot.role})`).join(', ') : 'not saved'}
            </p>
          );
        })}
      </Panel>
    </>
  );
}
