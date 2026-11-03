import React from 'react';
import { APPOINTMENTS } from '../data/content.js';
import { HALL_ROOMS, MONTHLY_ACTIVITIES, TRAINING_FOCI } from '../data/activities.js';
import { FORMATION_TYPES } from '../data/formations.js';
import { MAIN_PARTY_SIZE, getPatronLoanOffer, heroCapacity, isHeroAway, specializationTitle } from '../game/engine.js';
import { Badge, Button, HeroPortrait, Panel, ProgressBar } from '../components/UI.jsx';
import { activeRoster, heroStatus, heroWarnings } from '../components/heroStatus.js';
import EquipmentScreen from '../screens/EquipmentScreen.jsx';
import HeadquartersScreen from '../screens/HeadquartersScreen.jsx';

const ACTIVITY_ROOMS = HALL_ROOMS.filter((room) => room.activity);

function roomHeroes(state, room) {
  return activeRoster(state).filter((hero) => !isHeroAway(state, hero) && (hero.monthlyActivity || 'Training') === room.activity);
}

function GuildSummary({ state }) {
  const upkeep = upkeepBreakdown(state);
  return (
    <header className="hall-summary">
      <strong>{state.guild.name}</strong>
      <span>{state.guild.crowns.toLocaleString()} gold</span>
      <span>−{upkeep.total}/month</span>
      <span>
        {activeRoster(state).length}/{heroCapacity(state)} heroes
      </span>
      <span>{state.guild.fame} fame</span>
      <Badge tone="gold">{state.guild.statusTitle || 'Unknown'}</Badge>
      {specializationTitle(state) ? <Badge tone="purple">{specializationTitle(state)}</Badge> : null}
      {state.guild.loan ? <Badge tone="red">Loan {state.guild.loan.remaining}</Badge> : null}
    </header>
  );
}

function upkeepBreakdown(state) {
  const wages = activeRoster(state).reduce((sum, hero) => sum + (hero.salary || 0), 0);
  const facilities = Object.values(state.guild.facilities || {}).reduce((sum, level) => sum + level * 8, 0);
  const appointments = Object.keys(state.guild.appointments || {}).length * 7;
  return { wages, facilities, appointments, loan: state.guild.loan?.installment || 0, total: wages + facilities + appointments };
}

function HeroRow({ state, hero, room, actions }) {
  const status = heroStatus(state, hero);
  const warnings = heroWarnings(state, hero);
  return (
    <article className={`room-hero ${status.away ? 'is-away' : ''}`}>
      <button className="room-hero__who" onClick={() => actions.openHero(hero.id)}>
        <HeroPortrait hero={hero} size="sm" showStatus={false} />
        <span>
          <strong>{hero.name}</strong>
          <small>
            Lv {hero.level} {hero.classId} · {status.label}
            {warnings.length ? ` · ⚠ ${warnings.join(', ')}` : ''}
          </small>
        </span>
      </button>
      <div className="room-hero__bars">
        <ProgressBar value={hero.health ?? 100} max={100} compact tone="green" label={`HP ${hero.health ?? 100}`} />
        <ProgressBar value={hero.fatigue || 0} max={100} compact tone="gold" label={`Fatigue ${hero.fatigue || 0}`} />
      </div>
      {!status.away ? (
        <div className="room-hero__controls">
          {room?.activity === 'Training' ? (
            <label>
              Focus
              <select value={hero.training} onChange={(event) => actions.setTraining(hero.id, event.target.value)}>
                {TRAINING_FOCI.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          ) : null}
          {room?.id === 'council' ? (
            <label>
              Appointment
              <select value={hero.appointment || ''} onChange={(event) => event.target.value && actions.appointHero(hero.id, event.target.value)}>
                <option value="">None</option>
                {APPOINTMENTS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.id}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label>
            Move to
            <select value={hero.monthlyActivity || 'Training'} onChange={(event) => actions.setMonthlyActivity(hero.id, event.target.value)}>
              {MONTHLY_ACTIVITIES.map((activity) => (
                <option key={activity.id} value={activity.id}>
                  {ACTIVITY_ROOMS.find((item) => item.activity === activity.id)?.name || activity.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : (
        <small className="room-hero__away">Away</small>
      )}
    </article>
  );
}

function ActivityRoom({ state, room, actions }) {
  const inside = roomHeroes(state, room);
  const others = activeRoster(state).filter((hero) => !isHeroAway(state, hero) && !inside.includes(hero));
  const away = activeRoster(state).filter((hero) => isHeroAway(state, hero));
  return (
    <>
      <div className="room-actions">
        {room.bulk ? <Button onClick={() => actions.sendIdleHeroesTo(room.activity)}>Send all idle heroes here</Button> : null}
        <Button onClick={actions.autoAssignRooms}>Auto-assign</Button>
        {others.length ? (
          <label>
            Add a hero
            <select value="" onChange={(event) => event.target.value && actions.setMonthlyActivity(event.target.value, room.activity)}>
              <option value="">Choose…</option>
              {others.map((hero) => (
                <option key={hero.id} value={hero.id}>
                  {hero.name} ({heroStatus(state, hero).label})
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
      <Panel title={`In the ${room.name}`} eyebrow={`${inside.length} hero${inside.length === 1 ? '' : 'es'}`}>
        {inside.length ? (
          inside.map((hero) => <HeroRow key={hero.id} state={state} hero={hero} room={room} actions={actions} />)
        ) : (
          <p className="muted">Nobody is here.</p>
        )}
      </Panel>
      {away.length ? (
        <Panel title="Away" eyebrow="On missions, in tournaments, travelling or on branch duty">
          {away.map((hero) => (
            <HeroRow key={hero.id} state={state} hero={hero} actions={actions} />
          ))}
        </Panel>
      ) : null}
    </>
  );
}

function WarRoom({ state, actions }) {
  const party = state.guild.mainParty || [];
  return (
    <>
      <Panel title="Main party" eyebrow={`${party.length}/${MAIN_PARTY_SIZE} · pre-fills missions and tournament entry`}>
        {activeRoster(state).map((hero) => (
          <label key={hero.id} className="war-room__member">
            <input
              type="checkbox"
              checked={party.includes(hero.id)}
              disabled={!party.includes(hero.id) && party.length >= MAIN_PARTY_SIZE}
              onChange={() => actions.toggleMainParty(hero.id)}
            />
            <HeroPortrait hero={hero} size="xs" showStatus={false} />
            <span>
              {hero.name} · Lv {hero.level} {hero.classId} · {heroStatus(state, hero).label}
            </span>
          </label>
        ))}
      </Panel>
      <Panel title="Saved formations" eyebrow="Saved from the Notice Board party builder">
        {Object.keys(FORMATION_TYPES).map((type) => {
          const saved = state.guild.formations?.[type] || [];
          return (
            <p key={type} className="war-room__formation">
              <strong>{FORMATION_TYPES[type].label}:</strong>{' '}
              {saved.length
                ? saved.map((slot) => `${state.heroes.find((hero) => hero.id === slot.heroId)?.name || '—'} (${slot.role})`).join(', ')
                : 'not saved'}
            </p>
          );
        })}
      </Panel>
    </>
  );
}

function Treasury({ state, actions }) {
  const upkeep = upkeepBreakdown(state);
  const report = state.council?.lastReport;
  const offer = getPatronLoanOffer(state);
  const net = report ? report.crownsAfter - report.crownsBefore : null;
  return (
    <>
      <Panel title="Monthly upkeep" eyebrow="Paid on week 1 of every month">
        <dl className="treasury-table">
          <dt>Wages</dt>
          <dd>{upkeep.wages}</dd>
          <dt>Facilities</dt>
          <dd>{upkeep.facilities}</dd>
          <dt>Appointments</dt>
          <dd>{upkeep.appointments}</dd>
          {upkeep.loan ? (
            <>
              <dt>Loan payment</dt>
              <dd>{upkeep.loan}</dd>
            </>
          ) : null}
          <dt>Total</dt>
          <dd>
            <strong>{upkeep.total + upkeep.loan}</strong>
          </dd>
        </dl>
      </Panel>
      <Panel title="Loans and debt" eyebrow={state.guild.unpaidMonths ? `Wages unpaid for ${state.guild.unpaidMonths} month(s)` : 'Wages are paid'}>
        {state.guild.loan ? (
          <p>
            You owe {state.guild.loan.remaining} gold, repaid at {state.guild.loan.installment} per month.
          </p>
        ) : (
          <p className="muted">No loans.</p>
        )}
        {offer.available ? (
          <Button onClick={actions.takePatronLoan}>
            Borrow {offer.amount} (repay {offer.repayment})
          </Button>
        ) : null}
      </Panel>
      <Panel title="Last council report" eyebrow={report?.label || 'No report yet'}>
        {report ? (
          <p>
            Upkeep −{report.upkeep}
            {report.loanPayment ? `, loan −${report.loanPayment}` : ''}. Gold {report.crownsBefore} → {report.crownsAfter} ({net >= 0 ? '+' : ''}
            {net}). Income over the period: about {net + report.upkeep + (report.loanPayment || 0)}. Fame {report.fameDelta >= 0 ? '+' : ''}
            {report.fameDelta}.
          </p>
        ) : (
          <p className="muted">Advance time to receive a report.</p>
        )}
      </Panel>
    </>
  );
}

// The Guild Hall as rooms. room = the open room id (place.tab), or null for the room tiles.
export default function GuildHallRooms({ state, actions, navigate, slot, room: roomId, setRoom }) {
  const room = HALL_ROOMS.find((item) => item.id === roomId) || null;
  const props = { state, actions, navigate, slot };
  if (!room) {
    return (
      <div className="hall-rooms">
        <GuildSummary state={state} />
        <div className="room-actions">
          <Button onClick={actions.autoAssignRooms}>Auto-assign heroes to rooms</Button>
        </div>
        <div className="building-grid">
          {HALL_ROOMS.map((item) => {
            const count = item.activity ? roomHeroes(state, item).length : item.id === 'war' ? (state.guild.mainParty || []).length : null;
            return (
              <button key={item.id} className={`building-tile room-tile room-tile--${item.id}`} onClick={() => setRoom(item.id)}>
                <span className="building-tile__icon">{item.icon}</span>
                <strong>{item.name}</strong>
                <small>{item.description}</small>
                {count !== null ? <Badge tone={count ? 'gold' : 'neutral'}>{count}</Badge> : null}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
  return (
    <div className={`hall-room hall-room--${room.id}`}>
      <GuildSummary state={state} />
      <h2 className="hall-room__title">
        <button className="town-header__back" onClick={() => setRoom(null)}>
          ← Rooms
        </button>{' '}
        {room.icon} {room.name}
      </h2>
      <p className="muted">{room.description}</p>
      {room.activity ? <ActivityRoom state={state} room={room} actions={actions} /> : null}
      {room.id === 'war' ? <WarRoom state={state} actions={actions} /> : null}
      {room.id === 'treasury' ? <Treasury state={state} actions={actions} /> : null}
      {room.id === 'armory' ? <EquipmentScreen {...props} /> : null}
      {room.id === 'facilities' ? <HeadquartersScreen {...props} /> : null}
    </div>
  );
}
