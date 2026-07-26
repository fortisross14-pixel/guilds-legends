import React, { useState } from 'react';
import { APPOINTMENTS, FACILITIES, TIERS } from '../data/content.js';
import { headquartersRoomCapacity, heroCapacity, usedFacilityRooms } from '../game/engine.js';
import { Badge, Button, HeroPortrait, Panel, ProgressBar } from '../components/UI.jsx';

function tierIndex(name) {
  return Math.max(0, TIERS.findIndex((tier) => tier.id === name));
}

export default function HeadquartersScreen({ state, actions }) {
  const [appointment, setAppointment] = useState('Guild Captain');
  const activeHeroes = state.heroes.filter((hero) => hero.status === 'available');
  const monthlyWages = state.heroes.filter((hero) => !['dead', 'retired'].includes(hero.status)).reduce((sum, hero) => sum + hero.salary, 0);
  const facilityUpkeep = Object.values(state.guild.facilities).reduce((sum, level) => sum + level * 8, 0);
  const roomCapacity = headquartersRoomCapacity(state);
  const occupiedRooms = usedFacilityRooms(state);
  const freeRooms = Math.max(0, roomCapacity - occupiedRooms);

  return (
    <div className="screen screen--headquarters">
      <header className="screen-heading">
        <div><span className="eyebrow">The institution between adventures</span><h1>Guild Headquarters</h1><p>Rooms, offices and appointments determine whether individual brilliance can survive for generations.</p></div>
        <div className="heading-metrics"><Badge tone="gold">{state.guild.crowns.toLocaleString()} crowns</Badge><Badge tone={freeRooms ? 'blue' : 'red'}>{occupiedRooms}/{roomCapacity} rooms</Badge><Badge tone="blue">{heroCapacity(state)} hero capacity</Badge></div>
      </header>

      <section className="hq-blueprint">
        <div className="hq-blueprint__hall">
          <span className="eyebrow">Rented hall · Dunmere</span>
          <h2>{state.guild.name}</h2>
          <p>{state.guild.founder} presides over a building that is slowly becoming an institution.</p>
          <div className="hq-ledger"><span>Monthly hero wages <strong>{monthlyWages}</strong></span><span>Facility upkeep <strong>{facilityUpkeep}</strong></span><span>Rooms occupied <strong>{occupiedRooms}/{roomCapacity}</strong></span><span>Total monthly cost <strong>{monthlyWages + facilityUpkeep + Object.keys(state.guild.appointments).length * 7}</strong></span></div><div className={`room-limit ${freeRooms ? '' : 'is-full'}`}><div><span className="eyebrow">Physical headquarters limit</span><strong>{freeRooms ? `${freeRooms} room${freeRooms === 1 ? '' : 's'} available` : 'No rooms available'}</strong><p>Constructing a new facility occupies one room. Upgrading an existing room does not. Promotion expands the building; Great Hall levels above 1 add another room.</p></div><ProgressBar value={occupiedRooms} max={roomCapacity} tone={freeRooms ? 'blue' : 'red'} compact /></div>
        </div>
        <div className="hq-blueprint__rooms">
          {FACILITIES.map((facility) => {
            const level = state.guild.facilities[facility.id] || 0;
            const tierLocked = facility.unlock && state.guild.tierIndex < tierIndex(facility.unlock);
            const roomLocked = level === 0 && freeRooms === 0;
            const locked = tierLocked || roomLocked;
            const cost = Math.round(facility.baseCost * (1 + level * 0.72));
            return (
              <article className={`facility-room ${locked ? 'is-locked' : ''}`} key={facility.id}>
                <div className="facility-room__icon">{locked ? '⌁' : facility.icon}</div>
                <div className="facility-room__content">
                  <div className="facility-room__title"><h3>{facility.name}</h3><Badge tone={level >= facility.max ? 'green' : level ? 'blue' : 'neutral'}>{tierLocked ? `Unlocks at ${facility.unlock}` : roomLocked ? 'No free room' : `Level ${level}/${facility.max}`}</Badge></div>
                  <p>{facility.description}</p>{level === 0 ? <small className="facility-room__space">Requires 1 free room</small> : <small className="facility-room__space">Uses an existing room</small>}
                  <strong className="facility-room__effect">{facility.effect}</strong>
                  <ProgressBar value={level} max={facility.max} tone={level >= facility.max ? 'green' : 'gold'} compact />
                </div>
                <Button size="sm" variant={level === 0 ? 'primary' : 'secondary'} disabled={locked || level >= facility.max || state.guild.crowns < cost} onClick={() => actions.upgradeFacility(facility.id)}>{level >= facility.max ? 'Complete' : `Upgrade · ${cost}`}</Button>
              </article>
            );
          })}
        </div>
      </section>

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
                    <div><strong>{item.id}</strong><small>{hero ? hero.name : 'Vacant'}</small></div>
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
                    <p><b>Main effect:</b> {definition.effect}</p>
                    <p><b>Trade-off:</b> {definition.tradeoff}</p>
                    {current ? <div className="current-appointee"><HeroPortrait hero={current} size="sm" /><div><strong>{current.name}</strong><small>{current.classId} · Presence {current.attributes.Presence}</small></div></div> : null}
                    <label>Assign hero<select value={currentId || ''} onChange={(event) => event.target.value && actions.appointHero(event.target.value, appointment)}><option value="">Choose an available hero</option>{activeHeroes.map((hero) => <option key={hero.id} value={hero.id}>{hero.name} · {hero.classId} · PWR {hero.power}</option>)}</select></label>
                  </>
                );
              })()}
            </div>
          </div>
        </Panel>

        <Panel title="Operating doctrine" eyebrow="Policies applied automatically">
          <div className="policy-stack">
            <label>Retreat policy<select value={state.guild.policies.retreat} onChange={(event) => actions.updatePolicy('retreat', event.target.value)}><option>Measured</option><option>Protect the wounded</option><option>Never retreat</option><option>Preserve the stars</option></select><small>Changes the hidden balance between survival, mission grade and public criticism.</small></label>
            <label>Treasure policy<select value={state.guild.policies.treasure} onChange={(event) => actions.updatePolicy('treasure', event.target.value)}><option>Guild Share</option><option>Equal Shares</option><option>Captain's Discretion</option><option>Public Trust</option></select><small>Influences loyalty, treasury and corruption events.</small></label>
            <label>Public record<select value={state.guild.policies.publicity} onChange={(event) => actions.updatePolicy('publicity', event.target.value)}><option>Truthful</option><option>Heroic</option><option>Private</option><option>Propaganda</option></select><small>Controls how efficiently deeds become fame—and how scandals grow.</small></label>
          </div>
        </Panel>

        <Panel title="Political posture" eyebrow="The first long relationship">
          {state.guild.alignment === 'Undeclared' ? (
            <div className="alignment-grid">
              <button onClick={() => actions.chooseAlignment('Council')}><span>⚖</span><strong>Serve the council</strong><p>Local trust, steady civic contracts and slower money.</p></button>
              <button onClick={() => actions.chooseAlignment('Baron')}><span>♛</span><strong>Serve the border baron</strong><p>Wealth, noble access and political obligations.</p></button>
              <button onClick={() => actions.chooseAlignment('Independent')}><span>⚑</span><strong>Remain independent</strong><p>Freedom, popular fame and fewer protected routes.</p></button>
            </div>
          ) : (
            <div className="alignment-chosen"><span>{state.guild.alignment === 'Council' ? '⚖' : state.guild.alignment === 'Baron' ? '♛' : '⚑'}</span><div><h3>{state.guild.alignment}</h3><p>This choice now modifies contracts, political events and how rival guilds interpret your rise.</p></div></div>
          )}
          {state.guild.obligations.length ? <div className="obligation-list"><span>Outstanding obligations</span>{state.guild.obligations.map((item) => <Badge tone="red" key={item}>{item}</Badge>)}</div> : null}
        </Panel>
      </div>
    </div>
  );
}
