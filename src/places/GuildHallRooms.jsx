import React, { useState } from 'react';
import { APPOINTMENTS } from '../data/content.js';
import { HALL_ROOMS, MONTHLY_ACTIVITIES } from '../data/activities.js';
import { FORMATION_TYPES } from '../data/formations.js';
import { HOUSE, ROOM_BY_ID } from '../data/rooms.js';
import { HOME_LOCATION_ID, MAIN_PARTY_SIZE, activityAvailable, atHome, availableDrills, chestCapacity, chestUsed, getHallView, getPatronLoanOffer, isHeroAway, specializationTitle, trophyCount, upkeepBreakdown } from '../game/engine.js';
import { Badge, Button, HeroPortrait, Panel, ProgressBar } from '../components/UI.jsx';
import { activeRoster, heroStatus, heroWarnings } from '../components/heroStatus.js';
import Icon, { ROOM_ICONS } from '../components/Icon.jsx';
import EquipmentScreen from '../screens/EquipmentScreen.jsx';
import DraggableHero from '../components/DraggableHero.jsx';
import HeadquartersScreen from '../screens/HeadquartersScreen.jsx';
import CalendarScreen from './CalendarScreen.jsx';
import RestDial from './RestDial.jsx';
import { LOCATION_BY_ID } from '../data/world.js';

// The Guild Hall, from a rented room to a renowned hall (src/data/rooms.js).
// place.tab = the open room id, 'build' for the build list, 'rest' for resting, or null for the hall.

function roomHeroes(state, activity) {
  return activeRoster(state).filter((hero) => !isHeroAway(state, hero) && (hero.monthlyActivity || 'Rest') === activity);
}

function HallSummary({ state, hall }) {
  const upkeep = upkeepBreakdown(state);
  return (
    <header className="hall-summary">
      <strong>{state.guild.name}</strong>
      <Badge tone="gold">{hall.stage.name}</Badge>
      {hall.owned ? <Badge tone={hall.bought ? 'green' : 'blue'}>{hall.bought ? 'Owned' : `Rented · ${hall.rent}/month`}</Badge> : null}
      <span className={hall.free <= 0 ? 'is-full' : ''}>
        {hall.used}/{hall.beds} beds
      </span>
      {hall.owned ? (
        <span>
          {hall.slots.used}/{hall.slots.total} slots
        </span>
      ) : null}
      <span className="num">{state.guild.crowns.toLocaleString()} G</span>
      <span>−{upkeep.total}/month</span>
      <span>{state.guild.fame} fame</span>
      {specializationTitle(state) ? <Badge tone="purple">{specializationTitle(state)}</Badge> : null}
      {state.guild.loan ? <Badge tone="red">Loan {state.guild.loan.remaining}</Badge> : null}
    </header>
  );
}

/** One short line with one button: the upgrade that would help most right now. */
export function NextUpgrade({ suggestion, actions, setRoom }) {
  if (!suggestion) return null;
  const act = () => {
    const kind = suggestion.action?.kind;
    if (kind === 'build') actions.buildRoom(suggestion.action.roomId);
    else if (kind === 'story') actions.playStoryScene('m1');
    else setRoom?.(null);
  };
  return (
    <p className="next-upgrade">
      <span>
        <b>Next upgrade:</b> {suggestion.text}
      </span>
      <Button size="sm" variant="primary" onClick={act}>
        {suggestion.label}
      </Button>
    </p>
  );
}

function HeroRow({ state, hero, room, actions }) {
  const status = heroStatus(state, hero);
  const warnings = heroWarnings(state, hero);
  const activities = MONTHLY_ACTIVITIES.filter((activity) => activityAvailable(state, activity.id));
  const current = activityAvailable(state, hero.monthlyActivity || 'Rest') ? hero.monthlyActivity || 'Rest' : 'Rest';
  return (
    <article className={`room-hero ${status.away ? 'is-away' : ''}`}>
      <button className="room-hero__who" onClick={() => actions.openHero(hero.id)}>
        <HeroPortrait hero={hero} size="sm" showStatus={false} />
        <span>
          <strong>{hero.name}</strong>
          <small>
            Lv {hero.level} {hero.classId} · {status.label}
            {warnings.length ? ` · ${warnings.join(', ')}` : ''}
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
              Drill
              <select value={availableDrills(state).includes(hero.training) ? hero.training : ''} onChange={(event) => actions.setTraining(hero.id, event.target.value)}>
                {!availableDrills(state).includes(hero.training) ? <option value="">Choose…</option> : null}
                {availableDrills(state).map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          ) : null}
          {room?.id === 'office' ? (
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
            <select value={current} onChange={(event) => actions.setMonthlyActivity(hero.id, event.target.value)}>
              {activities.map((activity) => (
                <option key={activity.id} value={activity.id}>
                  {HALL_ROOMS.find((item) => item.activity === activity.id)?.name || ROOM_BY_ID[{ Training: 'training', Infirmary: 'infirmary', Scouting: 'scouts' }[activity.id]]?.name || activity.label}
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

function ActivityRoom({ state, activity, name, bulk, room, actions }) {
  const inside = roomHeroes(state, activity);
  const others = activeRoster(state).filter((hero) => !isHeroAway(state, hero) && !inside.includes(hero));
  return (
    <>
      <div className="room-actions">
        {bulk ? <Button onClick={() => actions.sendIdleHeroesTo(activity)}>Send all idle heroes here</Button> : null}
        <Button onClick={actions.autoAssignRooms}>Auto-assign</Button>
        {others.length ? (
          <label>
            Add a hero
            <select value="" onChange={(event) => event.target.value && actions.setMonthlyActivity(event.target.value, activity)}>
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
      <Panel title={`In the ${name}`} eyebrow={`${inside.length} hero${inside.length === 1 ? '' : 'es'}`}>
        {inside.length ? inside.map((hero) => <HeroRow key={hero.id} state={state} hero={hero} room={room} actions={actions} />) : <p className="muted">Nobody is here.</p>}
      </Panel>
    </>
  );
}

/** Level, effect, upkeep and the upgrade button for a built room. */
function RoomStatus({ plan, hall, actions }) {
  const building = hall.construction?.roomId === plan.id;
  return (
    <div className="room-status">
      <p>
        <Badge tone="blue">Level {plan.level}</Badge> {plan.effect} · upkeep {plan.upkeep}/month
      </p>
      {building ? (
        <p className="room-status__building">
          Builders at work: level {hall.construction.level} in {hall.construction.weeksLeft} week{hall.construction.weeksLeft === 1 ? '' : 's'}.
        </p>
      ) : plan.next ? (
        <BuildOffer plan={plan} hall={hall} actions={actions} compact />
      ) : (
        <p className="muted">Fully built.</p>
      )}
    </div>
  );
}

/** A buildable room or level: cost, requirement, time and effect, then Build. */
function BuildOffer({ plan, hall, actions, compact = false }) {
  const next = plan.next;
  const busy = Boolean(hall.construction);
  const noSlot = !plan.built && hall.slots.free <= 0;
  return (
    <article className={`build-offer ${next.met ? '' : 'is-locked'} ${compact ? 'build-offer--compact' : ''}`}>
      <header>
        <Icon name={ROOM_ICONS[plan.id] || 'castle'} size={24} />
        <strong>
          {plan.name}
          {plan.built ? ` → level ${next.level}` : ''}
        </strong>
      </header>
      {!compact ? <p className="build-offer__desc">{plan.description}</p> : null}
      <p className="build-offer__effect">{next.effect}</p>
      <dl className="build-offer__facts">
        <dt>Cost</dt>
        <dd>{next.cost} G</dd>
        <dt>Time</dt>
        <dd>
          {next.weeks} week{next.weeks === 1 ? '' : 's'}
        </dd>
        <dt>Upkeep</dt>
        <dd>{next.upkeep}/month</dd>
        <dt>Needs</dt>
        <dd>{next.met ? 'Ready' : next.missing.join(', ')}</dd>
      </dl>
      <Button variant="primary" disabled={!next.met || busy || noSlot} why={busy ? 'The builders are busy.' : noSlot ? (hall.bought ? 'No empty slot left: expand the lot.' : 'No empty slot left: buy the lot, then expand it.') : `Needs: ${next.missing?.join(', ') || 'more gold'}.`} onClick={() => actions.buildRoom(plan.id)}>
        {busy ? 'Builders are busy' : noSlot ? 'No empty slot' : `Build (${next.cost} G)`}
      </Button>
    </article>
  );
}

function BuildList({ hall, actions }) {
  const options = hall.rooms.filter((plan) => !plan.built && plan.next && hall.construction?.roomId !== plan.id);
  return (
    <div className="build-list">
      {hall.construction ? <p className="muted">The builders are busy with the {hall.construction.name}. You can plan, but only one room is built at a time.</p> : null}
      {options.map((plan) => (
        <BuildOffer key={plan.id} plan={plan} hall={hall} actions={actions} />
      ))}
      {!options.length ? <p className="muted">Every room type is built. Upgrade rooms from their own pages.</p> : null}
    </div>
  );
}

/** Before a lot is rented: the founder's house, and where to go next (story mission 1). No hall, no hires. */
function House({ state, hall, actions }) {
  return (
    <Panel title={HOUSE.name} eyebrow="Your home, not yet a guild hall">
      <ul className="rented-room">
        <li>
          <Icon name="moon" size={24} /> {hall.houseBeds} bed ({hall.used} used)
        </li>
        <li>
          <Icon name="flag" size={24} /> The banner, hidden under the floorboards
        </li>
        <li>
          <Icon name="bag" size={24} /> A small chest: {chestUsed(state)}/{chestCapacity(state)} items
        </li>
      </ul>
      <p className="muted">No hall, no hires: recruits will talk to you, but nobody signs with a guild that has nowhere to sleep. The old stable yard on Banner Plaza stands empty; Gideon Rusk rents it out (story mission 1).</p>
      <Button variant="primary" onClick={() => actions.playStoryScene('m1')}>
        Talk to Gideon Rusk
      </Button>
    </Panel>
  );
}

/**
 * The long-term goal for the lot: buy it outright while rented (ends the rent),
 * then buy the land next door step by step. Price, savings and "at this rate".
 */
export function PropertyGoal({ hall, actions, compact = false }) {
  const goal = hall.goal;
  if (hall.expansion) {
    return (
      <section className="property-goal">
        <strong>Clearing {hall.expansion.land}</strong>
        <ProgressBar value={hall.expansion.totalWeeks - hall.expansion.weeksLeft} max={hall.expansion.totalWeeks} label={`${hall.expansion.weeksLeft} weeks left · ${hall.expansion.toSlots} slots when done`} tone="blue" compact />
      </section>
    );
  }
  if (!goal) return hall.bought && !compact ? <p className="muted property-goal">The lot is yours and as big as it gets for now.</p> : null;
  const ready = goal.missing === 0;
  const when = ready ? 'You have enough.' : !goal.measured ? 'Savings are measured from the next month on.' : goal.months === null ? 'At this rate: never; the treasury is not growing.' : `At this rate: about ${goal.months} month${goal.months === 1 ? '' : 's'}.`;
  return (
    <section className="property-goal">
      <span className="property-goal__head">
        <strong>{goal.kind === 'buy' ? 'Buy the property' : 'Expand the lot'}</strong>
        <small>{goal.name}. {goal.detail}</small>
      </span>
      <ProgressBar value={Math.min(goal.savings, goal.price)} max={goal.price} label="Savings" tone="gold" compact />
      <span className="property-goal__foot">
        <small>
          {when} {goal.measured ? `Saving ${goal.rate >= 0 ? '+' : '−'}${Math.abs(goal.rate)} a month.` : ''}
        </small>
        {!compact ? (
          <Button size="sm" variant={ready ? 'primary' : 'secondary'} disabled={!ready} why={`You need ${goal.missing.toLocaleString()} more gold.`} onClick={goal.kind === 'buy' ? actions.buyLot : actions.expandLot}>
            {goal.kind === 'buy' ? 'Buy the deed' : 'Buy the land'} ({goal.price.toLocaleString()} G)
          </Button>
        ) : null}
      </span>
    </section>
  );
}

export function WarRoom({ state, actions }) {
  const party = state.guild.mainParty || [];
  return (
    <>
      <Panel title="Main party" eyebrow={`${party.length}/${MAIN_PARTY_SIZE} · drag heroes in and out, or tap to toggle`}>
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
                    {hero.name} · Lv {hero.level} · {heroStatus(state, hero).label}
                  </span>
                </DraggableHero>
              ))}
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Saved formations" eyebrow="Save them from the Notice Board party builder">
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

function Treasury({ state, actions }) {
  const upkeep = upkeepBreakdown(state);
  const hall = getHallView(state);
  const report = state.council?.lastReport;
  const offer = getPatronLoanOffer(state);
  const net = report ? report.crownsAfter - report.crownsBefore : null;
  const income = report ? net + report.upkeep + (report.loanPayment || 0) : null;
  return (
    <>
      <Panel title="Income vs costs" eyebrow={report?.label || 'Last month'}>
        {report ? (
          <div className="treasury-bars">
            <p>
              <span>Income</span>
              <i style={{ width: `${Math.min(100, (Math.max(0, income) / Math.max(1, income, upkeep.total)) * 100)}%` }} className="is-income" />
              <b>{income}</b>
            </p>
            <p>
              <span>Costs</span>
              <i style={{ width: `${Math.min(100, (upkeep.total / Math.max(1, income, upkeep.total)) * 100)}%` }} className="is-costs" />
              <b>{upkeep.total}</b>
            </p>
            <p className={net >= 0 ? 'is-good' : 'is-bad'}>
              Net {net >= 0 ? '+' : ''}
              {net}
            </p>
          </div>
        ) : (
          <p className="muted">Rest at the hall into a new month to receive the first report.</p>
        )}
      </Panel>
      <Panel title="Monthly costs" eyebrow="Paid on week 1 of every month">
        <dl className="treasury-table">
          <dt>Wages</dt>
          <dd>{upkeep.wages}</dd>
          {upkeep.hall.lease ? (
            <>
              <dt>Rent</dt>
              <dd>{upkeep.hall.lease}</dd>
            </>
          ) : null}
          {upkeep.hall.rooms.map((room) => (
            <React.Fragment key={room.id}>
              <dt>
                {room.name} {room.level > 1 ? `lv ${room.level}` : ''}
              </dt>
              <dd>{room.upkeep}</dd>
            </React.Fragment>
          ))}
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
      <Panel title="The property" eyebrow={hall.owned ? (hall.bought ? 'The deed is the guild’s' : `Rented from ${hall.lot.owner}`) : 'No hall yet'}>
        {hall.owned ? <PropertyGoal state={state} hall={hall} actions={actions} /> : <p className="muted">Rent the old stable yard on Banner Plaza first (story mission 1).</p>}
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
    </>
  );
}

function TrophyHall({ state }) {
  const wildBosses = Object.entries(state.world?.exploration?.wild || {}).filter(([, area]) => area.bosses > 0);
  return (
    <>
      <Panel title="On display" eyebrow={`${trophyCount(state)} trophies · +${Math.min(trophyCount(state), 5) * 2} fame a month`}>
        <ul className="trophy-list">
          {state.stats.individualTournamentWins ? <li><Icon name="crown" size={14} tone="brass" /> {state.stats.individualTournamentWins} tournament title(s)</li> : null}
          {state.stats.guildTournamentWins ? <li><Icon name="flag" size={14} tone="brass" /> {state.stats.guildTournamentWins} guild title(s)</li> : null}
          {(state.artifacts || []).map((artifact) => (
            <li key={artifact.id || artifact.name}><Icon name="star" size={14} tone="brass" /> {artifact.name}</li>
          ))}
          {(state.defeatedBosses || []).map((boss) => (
            <li key={boss}><Icon name="skull" size={14} tone="brass" /> {String(boss).replace(/^boss-/, '').replace(/-/g, ' ')}</li>
          ))}
          {wildBosses.map(([areaId]) => (
            <li key={areaId}><Icon name="skull" size={14} tone="brass" /> The boss of {areaId.replace(/-/g, ' ')}</li>
          ))}
          {!trophyCount(state) ? <li className="muted">Empty cases, waiting.</li> : null}
        </ul>
      </Panel>
      <Panel title="Records" eyebrow="Kept by the guild">
        <dl className="treasury-table">
          <dt>Contracts won</dt>
          <dd>{state.stats.missionsWon || 0}</dd>
          <dt>Battles won</dt>
          <dd>{state.stats.combatWins || 0}</dd>
          <dt>Best tournament finish</dt>
          <dd>{state.stats.tournamentBest < 99 ? `#${state.stats.tournamentBest}` : '—'}</dd>
          <dt>Strongest hero ever</dt>
          <dd>{state.stats.highestPower || '—'}</dd>
        </dl>
      </Panel>
    </>
  );
}

const activityName = (id) =>
  HALL_ROOMS.find((item) => item.activity === id)?.name || ROOM_BY_ID[{ Training: 'training', Infirmary: 'infirmary', Scouting: 'scouts' }[id]]?.name || MONTHLY_ACTIVITIES.find((item) => item.id === id)?.label || id;

/**
 * Resting: the only place to let time pass freely. Each hero at home shows
 * their task, which can be changed here before confirming 1 week, 1 month or
 * 3 months. The calendar below can also wait for a chosen date.
 */
function RestRoom({ state, actions }) {
  const [draft, setDraft] = useState({});
  if (!atHome(state)) {
    return (
      <p className="town-notice">
        <strong>Your Guild Hall is in {LOCATION_BY_ID[HOME_LOCATION_ID].name}.</strong>
        <span>Away from home, rest at an inn (the tavern), or camp in the wild. The heroes at home keep to their tasks.</span>
      </p>
    );
  }
  const home = activeRoster(state).filter((hero) => !isHeroAway(state, hero));
  const away = activeRoster(state).filter((hero) => isHeroAway(state, hero));
  const activities = MONTHLY_ACTIVITIES.filter((activity) => activityAvailable(state, activity.id));
  const taskOf = (hero) => draft[hero.id] || (activityAvailable(state, hero.monthlyActivity || 'Rest') ? hero.monthlyActivity || 'Rest' : 'Rest');
  const paused = state.pendingDecisions.length || state.activeEncounter || state.activeMissionGame || state.pendingRoadEvent;
  const monthDays = (4 - (state.date.week || 0)) * 7 - (state.date.day || 0);
  return (
    <div className="rest-room">
      <p className="muted">
        Tasks pay off at the start of each month (the next one in {monthDays} day{monthDays === 1 ? '' : 's'}). Injuries, construction and side jobs move every week.
      </p>
      <div className="rest-room__tasks">
        {home.map((hero) => (
          <label key={hero.id} className="rest-task">
            <span className="rest-task__who">
              <HeroPortrait hero={hero} size="xs" showStatus={false} />
              <span>
                <strong>{hero.name}</strong>
                <small>
                  Lv {hero.level} {hero.classId} · HP {hero.health ?? 100} · fatigue {hero.fatigue || 0}
                  {hero.status === 'injured' ? ' · injured' : ''}
                </small>
              </span>
            </span>
            <select value={taskOf(hero)} onChange={(event) => setDraft({ ...draft, [hero.id]: event.target.value })}>
              {activities.map((activity) => (
                <option key={activity.id} value={activity.id}>
                  {activityName(activity.id)}
                </option>
              ))}
            </select>
          </label>
        ))}
        {away.length ? <p className="muted">Away: {away.map((hero) => `${hero.name} (${heroStatus(state, hero).label})`).join(', ')}.</p> : null}
      </div>
      <RestDial state={state} disabled={Boolean(paused)} onRest={(days) => actions.restAtHall(days, draft)} />
      <p className="muted">Stops early if a battle, decision or tournament needs you.</p>
      <details className="rest-room__calendar">
        <summary>Calendar</summary>
        <CalendarScreen state={state} actions={actions} canAdvance />
      </details>
    </div>
  );
}

/** A tile on the hall floor plan. */
function Tile({ id, icon, name, text, badge, onClick, className = '', activity = null, state = null, actions = null }) {
  const inside = activity && state ? roomHeroes(state, activity) : [];
  return (
    <div className={`room-tile-wrap ${activity ? 'is-drop' : ''}`} {...(activity ? { 'data-drop': 'room', 'data-drop-id': activity } : {})}>
      <button className={`building-tile room-tile room-tile--${id} ${className}`} onClick={onClick}>
        <span className="building-tile__icon">
          <Icon name={icon} size={36} />
        </span>
        <strong>{name}</strong>
        <small>{text}</small>
        {badge !== null && badge !== undefined && !activity ? <Badge tone="blue">{badge}</Badge> : null}
      </button>
      {activity ? (
        <div className="room-tile__heroes" aria-label={`In the ${name}`}>
          {inside.map((hero) => (
            <DraggableHero key={hero.id} hero={hero} state={state} actions={actions} className="room-tile__hero" onClick={() => actions.openHero(hero.id)} title={hero.name}>
              <HeroPortrait hero={hero} size="xs" showStatus={false} />
            </DraggableHero>
          ))}
          {!inside.length ? <small className="muted">Drop heroes here</small> : null}
        </div>
      ) : null}
    </div>
  );
}

export default function GuildHallRooms({ state, actions, navigate, slot, room: roomId, setRoom }) {
  const hall = getHallView(state);
  const props = { state, actions, navigate, slot };
  const plan = hall.rooms.find((item) => item.id === roomId && item.built) || null;
  const basic = HALL_ROOMS.find((item) => item.id === roomId && (!item.needsHall || hall.owned)) || null;

  if (!plan && !basic && roomId !== 'build' && roomId !== 'rest') {
    const building = hall.construction && !hall.rooms.find((item) => item.id === hall.construction.roomId)?.built ? hall.construction : null;
    const emptySlots = Math.max(0, hall.slots.free);
    return (
      <div className="hall-rooms">
        <HallSummary state={state} hall={hall} />
        <NextUpgrade suggestion={hall.suggestion} actions={actions} setRoom={setRoom} />
        {!hall.owned ? (
          <div className="hall-start">
            <House state={state} hall={hall} actions={actions} />
          </div>
        ) : (
          <PropertyGoal state={state} hall={hall} actions={actions} />
        )}
        <div className="room-actions">
          {atHome(state) ? (
            <Button variant="primary" onClick={() => setRoom('rest')}>
              Rest and pass time…
            </Button>
          ) : null}
          <Button onClick={actions.autoAssignRooms}>Auto-assign heroes to rooms</Button>
        </div>
        {hall.owned && !state.settings?.seenHints?.roomDrag && state.settings?.gestures !== 'tap' ? (
          <p className="gesture-tip">
            <span className="gesture-tip__hand" aria-hidden="true"><Icon name="hand" size={22} tone="brass" /></span> Drag a hero from the party bar onto a room to put them to work.
          </p>
        ) : null}
        <nav className="building-grid" aria-label="Guild Hall rooms" data-menu>
          {HALL_ROOMS.filter((item) => !item.needsHall || hall.owned).map((item) => (
            <Tile key={item.id} id={item.id} icon={ROOM_ICONS[item.id] || 'castle'} name={item.name} text={item.description} activity={item.activity} state={state} actions={actions} onClick={() => setRoom(item.id)} />
          ))}
          {hall.rooms
            .filter((item) => item.built)
            .map((item) => (
              <Tile
                key={item.id}
                id={item.id}
                icon={ROOM_ICONS[item.id] || 'castle'}
                name={`${item.name}${item.max > 1 ? ` · lv ${item.level}` : ''}`}
                text={hall.construction?.roomId === item.id ? `Upgrading: ${hall.construction.weeksLeft} weeks left` : item.effect}
                badge={item.id === 'war' ? (state.guild.mainParty || []).length : null}
                activity={item.activity || null}
                state={state}
                actions={actions}
                onClick={() => setRoom(item.id)}
              />
            ))}
          {building ? (
            <Tile
              id="construction"
              icon="hammer"
              name={`Building: ${building.name}`}
              text={`${building.weeksLeft} of ${building.totalWeeks} weeks left`}
              className="room-tile--construction"
              onClick={() => setRoom('build')}
            />
          ) : null}
          {Array.from({ length: emptySlots }, (_, index) => (
            <Tile key={`slot-${index}`} id="slot" icon="hammer" name="Empty slot" text="Tap to choose a room" className="room-tile--empty" onClick={() => setRoom('build')} />
          ))}
        </nav>
      </div>
    );
  }

  const title = roomId === 'build' ? 'Build a room' : roomId === 'rest' ? 'Rest at the hall' : plan ? plan.name : basic.name;
  return (
    <div className={`hall-room hall-room--${roomId}`}>
      <HallSummary state={state} hall={hall} />
      <h2 className="hall-room__title">
        <Button size="sm" className="town-header__back" onClick={() => setRoom(null)}>
          <Icon name="back" size={14} tone="plain" /> Hall
        </Button>
        <Icon name={roomId === 'build' ? 'hammer' : roomId === 'rest' ? 'calendar' : ROOM_ICONS[roomId] || 'castle'} size={24} />
        {title}
      </h2>
      {roomId === 'build' ? <BuildList hall={hall} actions={actions} /> : null}
      {roomId === 'rest' ? <RestRoom state={state} actions={actions} /> : null}
      {plan ? (
        <>
          <p className="muted">{plan.description}</p>
          <RoomStatus plan={plan} hall={hall} actions={actions} />
        </>
      ) : null}
      {basic ? <p className="muted">{basic.description}</p> : null}
      {basic?.id === 'quarters' ? (
        <p className="quarters-beds">
          {hall.used}/{hall.beds} beds used{hall.houseBeds ? ` · ${hall.houseBeds} in your house` : ''}
        </p>
      ) : null}
      {basic?.activity ? <ActivityRoom state={state} activity={basic.activity} name={basic.name} bulk={basic.bulk} room={basic} actions={actions} /> : null}
      {basic?.id === 'office' ? <HeadquartersScreen {...props} /> : null}
      {plan?.activity ? <ActivityRoom state={state} activity={plan.activity} name={plan.name} bulk room={plan} actions={actions} /> : null}
      {plan?.id === 'war' ? <WarRoom state={state} actions={actions} /> : null}
      {plan?.id === 'treasury' ? <Treasury state={state} actions={actions} /> : null}
      {plan?.id === 'armory' ? <EquipmentScreen {...props} /> : null}
      {plan?.id === 'trophies' ? <TrophyHall state={state} /> : null}
    </div>
  );
}
