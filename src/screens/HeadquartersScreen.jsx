import React, { useState } from 'react';
import { APPOINTMENTS } from '../data/content.js';
import { Badge, HeroPortrait, Panel } from '../components/UI.jsx';
import { sliceHides } from '../data/slice.js';

export default function HeadquartersScreen({ state, actions }) {
  const [appointment, setAppointment] = useState('Guild Captain');
  const activeHeroes = state.heroes.filter((hero) => hero.status === 'available');

  return (
    <div className="screen screen--headquarters">
      <header className="screen-heading">
        <div>
          <span className="eyebrow">The office</span>
          <h1>Appointments and doctrine</h1>
          <p>Who holds which office, and how the guild tells its story.</p>
        </div>
      </header>

      <div className="dashboard-grid dashboard-grid--hq">
        <Panel title="Guild appointments" eyebrow="Power behind the banner">
          <div className="appointment-layout">
            <div className="appointment-list">
              {APPOINTMENTS.map((item) => {
                const heroId = state.guild.appointments[item.id];
                const hero = state.heroes.find((candidate) => candidate.id === heroId);
                return (
                  <button key={item.id} className={appointment === item.id ? 'is-selected' : ''} onClick={() => setAppointment(item.id)}>
                    <span>{hero ? <HeroPortrait hero={hero} size="xs" /> : <i>+</i>}</span>
                    <div>
                      <strong>{item.id}</strong>
                      <small>{hero ? hero.name : 'Vacant'}</small>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="appointment-dossier">
              {(() => {
                const definition = APPOINTMENTS.find((item) => item.id === appointment);
                const currentId = state.guild.appointments[appointment];
                const current = state.heroes.find((hero) => hero.id === currentId);
                return (
                  <>
                    <span className="eyebrow">Institutional office</span>
                    <h3>{appointment}</h3>
                    <p>
                      <b>Main effect:</b> {definition.effect}
                    </p>
                    <p>
                      <b>Trade-off:</b> {definition.tradeoff}
                    </p>
                    {current ? (
                      <div className="current-appointee">
                        <HeroPortrait hero={current} size="sm" />
                        <div>
                          <strong>{current.name}</strong>
                          <small>
                            {current.classId} · Presence {current.attributes.Presence}
                          </small>
                        </div>
                      </div>
                    ) : null}
                    <label>
                      Assign hero
                      <select value={currentId || ''} onChange={(event) => event.target.value && actions.appointHero(event.target.value, appointment)}>
                        <option value="">Choose an available hero</option>
                        {activeHeroes.map((hero) => (
                          <option key={hero.id} value={hero.id}>
                            {hero.name} · {hero.classId} · PWR {hero.power}
                          </option>
                        ))}
                      </select>
                    </label>
                  </>
                );
              })()}
            </div>
          </div>
        </Panel>

        <Panel title="Operating doctrine" eyebrow="Policies applied automatically">
          <div className="policy-stack">
            <label>
              Retreat policy
              <select value={state.guild.policies.retreat} onChange={(event) => actions.updatePolicy('retreat', event.target.value)}>
                <option>Measured</option>
                <option>Protect the wounded</option>
                <option>Never retreat</option>
                <option>Preserve the stars</option>
              </select>
              <small>Changes the hidden balance between survival, mission grade and public criticism.</small>
            </label>
            <label>
              Treasure policy
              <select value={state.guild.policies.treasure} onChange={(event) => actions.updatePolicy('treasure', event.target.value)}>
                <option>Guild Share</option>
                <option>Equal Shares</option>
                <option>Captain's Discretion</option>
                <option>Public Trust</option>
              </select>
              <small>Influences loyalty, treasury and corruption events.</small>
            </label>
            <label>
              Public record
              <select value={state.guild.policies.publicity} onChange={(event) => actions.updatePolicy('publicity', event.target.value)}>
                <option>Truthful</option>
                <option>Heroic</option>
                <option>Private</option>
                <option>Propaganda</option>
              </select>
              <small>Controls how efficiently deeds become fame—and how scandals grow.</small>
            </label>
          </div>
        </Panel>

        {sliceHides('alignment') ? null : (
        <Panel title="Political posture" eyebrow="The first long relationship">
          {state.guild.alignment === 'Undeclared' ? (
            <div className="alignment-grid">
              <button onClick={() => actions.chooseAlignment('Council')}>
                <span>⚖</span>
                <strong>Serve the council</strong>
                <p>Local trust, steady civic contracts and slower money.</p>
              </button>
              <button onClick={() => actions.chooseAlignment('Baron')}>
                <span>♛</span>
                <strong>Serve the border baron</strong>
                <p>Wealth, noble access and political obligations.</p>
              </button>
              <button onClick={() => actions.chooseAlignment('Independent')}>
                <span>⚑</span>
                <strong>Remain independent</strong>
                <p>Freedom, popular fame and fewer protected routes.</p>
              </button>
            </div>
          ) : (
            <div className="alignment-chosen">
              <span>{state.guild.alignment === 'Council' ? '⚖' : state.guild.alignment === 'Baron' ? '♛' : '⚑'}</span>
              <div>
                <h3>{state.guild.alignment}</h3>
                <p>This choice now modifies contracts, political events and how rival guilds interpret your rise.</p>
              </div>
            </div>
          )}
          {state.guild.obligations.length ? (
            <div className="obligation-list">
              <span>Outstanding obligations</span>
              {state.guild.obligations.map((item) => (
                <Badge tone="red" key={item}>
                  {item}
                </Badge>
              ))}
            </div>
          ) : null}
        </Panel>
        )}
      </div>
    </div>
  );
}
