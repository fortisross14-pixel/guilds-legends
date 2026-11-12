import GuildBanner from '../components/GuildBanner.jsx';
import React, { useState } from 'react';
import { MONTHLY_ACTIVITIES } from '../data/activities.js';
import { HOUSE } from '../data/rooms.js';
import { HOME_LOCATION_ID, activityAvailable, atHome, chestCapacity, chestUsed, getHallView, getPatronLoanOffer, isHeroAway, upkeepBreakdown } from '../game/engine.js';
import { Badge, Button, HeroPortrait, Panel, ProgressBar } from '../components/UI.jsx';
import { activeRoster, heroStatus } from '../components/heroStatus.js';
import Icon from '../components/Icon.jsx';
import DraggableHero from '../components/DraggableHero.jsx';
import HeadquartersScreen from '../screens/HeadquartersScreen.jsx';
import CalendarScreen from './CalendarScreen.jsx';
import RestDial from './RestDial.jsx';
import { LOCATION_BY_ID } from '../data/world.js';

// The Guild Hall (docs/specs/guild-hall-rooms.md): a diorama of the lot with the
// cabin and every slot on one phone screen. Tap an empty slot to build; tap a
// room to see it, upgrade it, swap its equipment or clear it. Drag a hero from
// the strip onto a training room or infirmary (or tap the hero, then the room);
// drag them onto the yard to take them out. One bottom panel at a time.

const weeksText = (weeks) => `${weeks} week${weeks === 1 ? '' : 's'}`;
const daysText = (weeks) => {
  const days = Math.max(1, Math.ceil((weeks || 0) * 7));
  return `${days} day${days === 1 ? '' : 's'}`;
};
const TIER_PIPS = [1, 2, 3];

function TierPips({ tier }) {
  return (
    <span className="lot-slot__tier" aria-label={`Tier ${tier} of 3`}>
      {TIER_PIPS.map((pip) => (
        <i key={pip} className={pip <= tier ? 'is-on' : ''} />
      ))}
    </span>
  );
}

/** One short line with one button: the upgrade that would help most right now. */
export function NextUpgrade({ suggestion, actions, onBuild }) {
  if (!suggestion) return null;
  const act = () => {
    const kind = suggestion.action?.kind;
    if (kind === 'build') onBuild?.(suggestion.action.roomId);
    else if (kind === 'story') actions.playStoryScene('m1');
  };
  return (
    <p className="next-upgrade">
      <span>
        <b>Next:</b> {suggestion.text}
      </span>
      <Button size="sm" variant="primary" onClick={act}>
        {suggestion.action?.kind === 'build' ? 'Build' : suggestion.label}
      </Button>
    </p>
  );
}

/** Before a lot is rented: the founder's house, and where to go next (story mission 1). No hall, no hires. */
function House({ state, hall, actions }) {
  return (
    <Panel title="The old stable yard on Banner Plaza" eyebrow="An empty lot, for rent">
      <p>A fenced yard with a small cabin in the middle (two bunks) and room for five more buildings. Gideon Rusk rents it out.</p>
      <Button variant="primary" onClick={() => actions.playStoryScene('m1')}>
        Talk to Gideon Rusk
      </Button>
      <h3 className="house-heading">Until then: {HOUSE.name}</h3>
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
      <p className="muted">No hall, no hires: recruits will talk to you, but nobody signs with a guild that has nowhere to sleep.</p>
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
  const when = ready ? 'Ready to buy.' : !goal.measured ? '' : goal.months === null ? 'Not growing.' : `About ${goal.months} month${goal.months === 1 ? '' : 's'} at this rate.`;
  return (
    <section className="property-goal">
      <span className="property-goal__head">
        <strong>{goal.kind === 'buy' ? 'Buy the property' : 'Expand the lot'}</strong>
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

export function Treasury({ state, actions }) {
  const upkeep = upkeepBreakdown(state);
  const hall = getHallView(state);
  const report = state.council?.lastReport;
  const offer = getPatronLoanOffer(state);
  const net = report ? report.crownsAfter - report.crownsBefore : null;
  const income = report ? net + report.upkeep + (report.loanPayment || 0) : null;
  const detailed = hall.rooms.some((room) => room.type === 'treasury');
  return (
    <>
      <Panel title="Last month" eyebrow={report?.label || null}>
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
          <p className="muted">No report yet.</p>
        )}
      </Panel>
      <Panel title="Costs a month" eyebrow={detailed ? 'Treasury: room by room' : 'Build a Treasury for the detail'}>
        <dl className="treasury-table">
          <dt>Wages</dt>
          <dd>{upkeep.wages}</dd>
          {upkeep.hall.lease ? (
            <>
              <dt>Rent</dt>
              <dd>{upkeep.hall.lease}</dd>
            </>
          ) : null}
          {detailed ? (
            upkeep.hall.rooms.map((room) => (
              <React.Fragment key={room.id}>
                <dt>
                  {room.name} {room.level > 1 ? `(tier ${room.level})` : ''}
                </dt>
                <dd>{room.upkeep}</dd>
              </React.Fragment>
            ))
          ) : (
            <>
              <dt>Rooms</dt>
              <dd>{upkeep.hall.rooms.reduce((sum, room) => sum + room.upkeep, 0)}</dd>
            </>
          )}
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
      <Panel title="Property" eyebrow={hall.owned ? (hall.bought ? 'Owned' : `Rented from ${hall.lot.owner}`) : null}>
        {hall.owned ? <PropertyGoal state={state} hall={hall} actions={actions} /> : <p className="muted">No hall yet.</p>}
      </Panel>
      <Panel title="Debt" eyebrow={state.guild.unpaidMonths ? `Wages unpaid: ${state.guild.unpaidMonths} month${state.guild.unpaidMonths === 1 ? '' : 's'}` : null}>
        {state.guild.loan ? (
          <p>
            Owed: {state.guild.loan.remaining} gold · {state.guild.loan.installment} a month
          </p>
        ) : (
          <p className="muted">None.</p>
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

/** Who is in a room, as the diorama shows them: a portrait (training, infirmary) or sleepers (bedrooms). */
function Occupants({ state, room, hall, actions }) {
  if (room.type === 'bedroom') {
    const index = hall.rooms.filter((item) => item.type === 'bedroom').findIndex((item) => item.id === room.id);
    const sleepers = Math.max(0, Math.min(2, hall.used - index * 2 - (hall.houseBeds || 0)));
    return (
      <span className="lot-slot__sleepers" aria-label={`${sleepers} of 2 beds used`}>
        {[0, 1].map((bed) => (
          <i key={bed} className={bed < sleepers ? 'is-used' : ''} />
        ))}
      </span>
    );
  }
  if (!room.holdsHero) return null;
  if (!room.hero) return <small className="lot-slot__empty-bed">{room.type === 'infirmary' ? 'Empty bed' : 'Free'}</small>;
  const hero = state.heroes.find((item) => item.id === room.hero.id);
  return (
    <DraggableHero hero={hero} state={state} actions={actions} className={`lot-slot__hero lot-slot__hero--${room.type}`} title={room.hero.name}>
      <HeroPortrait hero={hero} size="xs" showStatus={false} />
    </DraggableHero>
  );
}

/** A slot on the lot: a built room, the room being built, or an empty slot. */
function Slot({ state, hall, room, picked, onOpen, actions }) {
  const busy = room.busy;
  const canTake = room.holdsHero && picked;
  return (
    <div className={`lot-slot lot-slot--${room.type} ${busy ? 'is-busy' : ''} ${canTake ? 'is-target' : ''}`} {...(room.holdsHero ? { 'data-drop': 'room', 'data-drop-id': room.id } : {})}>
      <button type="button" className="lot-slot__tile" onClick={() => onOpen(room)} aria-label={`${room.name}, ${room.tierName}${room.hero ? `, ${room.hero.name} inside` : ''}`}>
        <Icon name={room.equipment?.icon || room.icon} size={30} />
        <strong>{room.type === 'training' ? `${room.equipment.stat} training` : room.name}</strong>
        <TierPips tier={room.tier} />
        {room.equipment ? <small>+{room.equipment.gain} {room.equipment.stat} a month</small> : null}
        {busy ? <small className="lot-slot__busy">{busy.kind === 'clear' ? 'Clearing' : 'Upgrading'}: {weeksText(busy.weeksLeft)}</small> : null}
      </button>
      <Occupants state={state} room={room} hall={hall} actions={actions} />
    </div>
  );
}

/** The bottom panel's build list for an empty slot: icon, one line, cost, weeks, upkeep and what it gives. */
function BuildList({ state, hall, actions, onDone, highlight }) {
  const [equipment, setEquipment] = useState('dummy');
  return (
    <div className="build-list">
      {hall.construction ? <p className="muted">The builders are busy with the {hall.construction.name}. One job at a time.</p> : null}
      {hall.catalog.map((room) => (
        <article key={room.id} className={`build-offer ${room.blocker ? 'is-locked' : ''} ${highlight === room.id ? 'is-suggested' : ''}`}>
          <header>
            <Icon name={room.icon} size={24} />
            <strong>{room.name}</strong>
          </header>
          <p className="build-offer__desc">{room.line}</p>
          <p className="build-offer__effect">{room.gives}</p>
          {room.id === 'training' ? (
            <label className="build-offer__equipment">
              Equipment
              <select value={equipment} onChange={(event) => setEquipment(event.target.value)}>
                {hall.equipment.map((piece) => (
                  <option key={piece.id} value={piece.id}>
                    {piece.name} ({piece.stat})
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <dl className="build-offer__facts">
            <dt>Cost</dt>
            <dd>{room.cost} G</dd>
            <dt>Time</dt>
            <dd>{weeksText(room.weeks)}</dd>
            <dt>Upkeep</dt>
            <dd>{room.upkeep}/month</dd>
          </dl>
          <Button
            variant="primary"
            disabled={Boolean(room.blocker)}
            why={room.blocker}
            onClick={() => {
              actions.buildRoom(room.id, equipment);
              onDone();
            }}
          >
            Build ({room.cost} G)
          </Button>
        </article>
      ))}
      {state.guild.crowns < Math.min(...hall.catalog.map((room) => room.cost)) ? <p className="muted">Not enough gold for any room yet.</p> : null}
    </div>
  );
}

/** The Crown Room's cases: every trophy with its count, and every special title. */
function CrownShelf({ hall }) {
  return (
    <div className="crown-shelf">
      <p className="muted">+{hall.crownFame} fame a month from the trophies on show.</p>
      {hall.trophies.length ? (
        <ul className="trophy-list">
          {hall.trophies.map((trophy) => (
            <li key={trophy.id}>
              <Icon name="trophy" size={16} tone="brass" /> {trophy.name}
              {trophy.count > 1 ? <b> ×{trophy.count}</b> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">Empty cases, waiting for a first tournament win.</p>
      )}
      {hall.titles.length ? (
        <ul className="trophy-list">
          {hall.titles.map((title) => (
            <li key={title.id || title.name || title}>
              <Icon name="banner" size={16} tone="brass" /> {title.name}
              {title.year ? <small className="muted"> · {title.year}</small> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** The bottom panel for a built room: who is in it, what it does, upgrade, equipment swap, clear. */
function RoomPanel({ state, room, hall, actions, onDone }) {
  const [swap, setSwap] = useState(room.equipment?.id || 'dummy');
  const home = activeRoster(state).filter((hero) => !isHeroAway(state, hero));
  const eligible = room.type === 'infirmary' ? home.filter((hero) => hero.status === 'injured') : home.filter((hero) => hero.status === 'available');
  return (
    <div className="room-panel">
      <p className="room-panel__does">
        <Badge tone="blue">{room.tierName}</Badge> {room.gives} · upkeep {room.upkeep}/month
      </p>
      {room.type === 'bedroom' ? (
        <p className="muted">
          {hall.used}/{hall.beds} beds used in the hall{hall.houseBeds ? ` (and ${hall.houseBeds} in your house)` : ''}.
        </p>
      ) : null}
      {room.holdsHero ? (
        <div className="room-panel__who">
          {room.hero ? (
            <p>
              <strong>{room.hero.name}</strong> {room.type === 'infirmary' ? `· fit to fight in ${daysText(room.hero.injuryWeeks)}` : `· +${room.equipment.gain} ${room.equipment.stat} a month`}{' '}
              <Button size="sm" onClick={() => actions.assignRoom(room.hero.id, null)}>
                Take out
              </Button>
            </p>
          ) : (
            <p className="muted">{room.type === 'infirmary' ? 'No patient.' : 'Nobody training.'}</p>
          )}
          {eligible.length ? (
            <label>
              {room.hero ? 'Swap in' : 'Put in'}
              <select value="" onChange={(event) => event.target.value && actions.assignRoom(event.target.value, room.id)}>
                <option value="">Choose…</option>
                {eligible
                  .filter((hero) => hero.id !== room.hero?.id)
                  .map((hero) => (
                    <option key={hero.id} value={hero.id}>
                      {hero.name} ({heroStatus(state, hero).label})
                    </option>
                  ))}
              </select>
            </label>
          ) : null}
        </div>
      ) : null}
      {room.type === 'crown' ? <CrownShelf hall={hall} /> : null}
      {room.busy ? (
        <ProgressBar value={room.busy.totalWeeks - room.busy.weeksLeft} max={room.busy.totalWeeks} label={`${room.busy.kind === 'clear' ? 'Clearing' : 'Upgrading'}: ${weeksText(room.busy.weeksLeft)} left`} tone="blue" compact />
      ) : (
        <>
          {room.next ? (
            <div className="room-panel__upgrade">
              <p>
                <strong>{room.type === 'training' ? `${room.next.name} equipment` : room.next.name}:</strong> {room.next.gives}
              </p>
              <small>
                {room.next.cost} G · {weeksText(room.next.weeks)} · upkeep {room.next.upkeep}/month
              </small>
              <Button variant="primary" disabled={Boolean(room.next.blocker)} why={room.next.blocker} onClick={() => actions.upgradeRoom(room.id)}>
                {room.type === 'training' ? 'Upgrade equipment' : 'Upgrade'} ({room.next.cost} G)
              </Button>
            </div>
          ) : (
            <p className="muted">State of the art.</p>
          )}
          {room.equipment ? (
            <div className="room-panel__swap">
              <label>
                Swap equipment
                <select value={swap} onChange={(event) => setSwap(event.target.value)}>
                  {hall.equipment.map((piece) => (
                    <option key={piece.id} value={piece.id}>
                      {piece.name} ({piece.stat})
                    </option>
                  ))}
                </select>
              </label>
              <Button disabled={swap === room.equipment.id} why="That piece is already in the room." onClick={() => actions.setRoomEquipment(room.id, swap)}>
                Swap ({room.equipment.swapCost} G, {room.equipment.refund} back)
              </Button>
            </div>
          ) : null}
          <Button
            className="room-panel__clear"
            onClick={() => {
              if (window.confirm(`Clear the ${room.name}? ${room.refund} gold back, and the slot is free in a week.`)) {
                actions.clearRoom(room.id);
                onDone();
              }
            }}
          >
            Clear the room ({room.refund} G back)
          </Button>
        </>
      )}
    </div>
  );
}

const activityName = (id) => MONTHLY_ACTIVITIES.find((item) => item.id === id)?.label || id;

/** What each room will give while the guild rests (the rest dial's summary). */
function RoomOutputs({ state, hall }) {
  const lines = hall.rooms
    .filter((room) => !room.busy)
    .map((room) => {
      if (room.type === 'training') return room.hero ? `${room.hero.name}: +${room.equipment.gain} ${room.equipment.stat} a month` : `${room.equipment.stat} training: nobody in it`;
      if (room.type === 'infirmary') return room.hero ? `${room.hero.name}: fit in ${daysText(room.hero.injuryWeeks)}` : 'Infirmary: empty bed';
      return null;
    })
    .filter(Boolean);
  if (hall.crownFame) lines.push(`Crown Room: +${hall.crownFame} fame a month`);
  if (hall.construction) lines.push(`Builders: ${hall.construction.name} in ${weeksText(hall.construction.weeksLeft)}`);
  const hurt = state.heroes.filter((hero) => hero.status === 'injured' && !hall.rooms.some((room) => room.hero?.id === hero.id));
  if (hurt.length) lines.push(`Recovering in bed: ${hurt.map((hero) => hero.name).join(', ')}`);
  if (!lines.length) return null;
  return (
    <ul className="room-outputs">
      {lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  );
}

/** Resting: the only place to let time pass freely at home. */
function RestPanel({ state, hall, actions, onDone = null }) {
  const [draft, setDraft] = useState({});
  if (!atHome(state)) {
    return (
      <p className="town-notice">
        <strong>Your Guild Hall is in {LOCATION_BY_ID[HOME_LOCATION_ID].name}.</strong>
        <span>Away from home, rest at an inn (the tavern), or camp in the wild.</span>
      </p>
    );
  }
  const inRoom = new Set(hall.rooms.map((room) => room.hero?.id).filter(Boolean));
  const free = activeRoster(state).filter((hero) => !isHeroAway(state, hero) && !inRoom.has(hero.id) && hero.status === 'available');
  const activities = MONTHLY_ACTIVITIES.filter((activity) => activityAvailable(state, activity.id));
  const taskOf = (hero) => draft[hero.id] || (activityAvailable(state, hero.monthlyActivity || 'Rest') ? hero.monthlyActivity || 'Rest' : 'Rest');
  const paused = state.activeEncounter || state.pendingRoadEvent;
  return (
    <div className="rest-room">
      <RoomOutputs state={state} hall={hall} />
      {free.length ? (
        <div className="rest-room__tasks">
          {free.map((hero) => (
            <label key={hero.id} className="rest-task">
              <span className="rest-task__who">
                <HeroPortrait hero={hero} size="xs" showStatus={false} />
                <strong>{hero.name}</strong>
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
        </div>
      ) : null}
      <RestDial state={state} disabled={Boolean(paused)} onRest={(days) => {
          actions.restAtHall(days, draft);
          onDone?.();
        }}
      />
      <div className="rest-room__until">
        <Button size="sm" disabled={Boolean(paused)} onClick={() => { actions.restUntil('fit'); onDone?.(); }}>
          Rest until fit
        </Button>
        <Button size="sm" disabled={Boolean(paused)} onClick={() => { actions.restUntil('full'); onDone?.(); }}>
          Rest until full health
        </Button>
      </div>
      <p className="muted">Stops early if a battle, decision or tournament needs you.</p>
      <details className="rest-room__calendar">
        <summary>Calendar</summary>
        <CalendarScreen state={state} actions={actions} canAdvance />
      </details>
    </div>
  );
}

/** The one bottom panel (build list, a room, resting, the office). */
function Sheet({ title, icon, onClose, children }) {
  return (
    <section className="hall-sheet" role="dialog" aria-label={title}>
      <header className="hall-sheet__head">
        <Icon name={icon} size={22} />
        <strong>{title}</strong>
        <button type="button" className="close-button close-button--small" onClick={onClose} aria-label="Close">
          <Icon name="close" size={18} tone="plain" />
        </button>
      </header>
      <div className="hall-sheet__body">{children}</div>
    </section>
  );
}

export default function GuildHallRooms({ state, actions, navigate, slot, initial = null }) {
  const hall = getHallView(state);
  // open: null | { kind: 'build', highlight? } | { kind: 'room', id } | { kind: 'rest' } | { kind: 'office' }
  // A route can open a panel at once: 'rest', 'build' or 'office' (src/places/routes.js).
  const [open, setOpen] = useState(() => (['rest', 'build', 'office'].includes(initial) ? { kind: initial } : null));
  // Tap fallback for dragging: tap a hero in the strip, then a room.
  const [picked, setPicked] = useState(null);
  const close = () => setOpen(null);

  if (!hall.owned) {
    return (
      <div className="hall-rooms">
        <NextUpgrade suggestion={hall.suggestion} actions={actions} />
        <House state={state} hall={hall} actions={actions} />
        {atHome(state) ? <RestPanel state={state} hall={hall} actions={actions} /> : null}
      </div>
    );
  }

  const openRoom = (room) => {
    if (picked && room.holdsHero) {
      actions.assignRoom(picked, room.id);
      setPicked(null);
      return;
    }
    setOpen({ kind: 'room', id: room.id });
  };
  const room = open?.kind === 'room' ? hall.rooms.find((item) => item.id === open.id) : null;
  const strip = activeRoster(state).filter((hero) => !isHeroAway(state, hero));
  const building = hall.construction?.kind === 'build' ? hall.construction : null;
  const empty = Math.max(0, hall.slots.free);

  return (
    <div className="hall-rooms">
      <header className="hall-summary">
        {state.guild.banner ? <GuildBanner banner={state.guild.banner} size={40} title={`The banner of ${state.guild.name}, over the door`} className="hall-summary__banner" /> : null}
        <strong>{hall.lotName}</strong>
        <Badge tone={hall.bought ? 'green' : 'blue'}>{hall.bought ? 'Owned' : `Rented · ${hall.rent}/month`}</Badge>
        <span className={hall.free <= 0 ? 'is-full' : ''}>
          {hall.used}/{hall.beds} beds
        </span>
        <span>
          {hall.slots.used}/{hall.slots.total} slots
        </span>
      </header>
      <NextUpgrade suggestion={hall.suggestion} actions={actions} onBuild={(type) => setOpen({ kind: 'build', highlight: type })} />
      <div className="lot" data-drop="room" data-drop-id="out" aria-label="The lot">
        {hall.rooms.map((item) => (
          <Slot key={item.id} state={state} hall={hall} room={item} picked={picked} onOpen={openRoom} actions={actions} />
        ))}
        {building ? (
          <div className="lot-slot lot-slot--building">
            <button type="button" className="lot-slot__tile" onClick={() => setOpen({ kind: 'build' })}>
              <Icon name="hammer" size={30} />
              <strong>{building.name}</strong>
              <ProgressBar value={building.totalWeeks - building.weeksLeft} max={building.totalWeeks} compact tone="blue" label={`${weeksText(building.weeksLeft)} left`} />
            </button>
          </div>
        ) : null}
        {Array.from({ length: empty }, (_, index) => (
          <div key={`empty-${index}`} className="lot-slot lot-slot--empty">
            <button type="button" className="lot-slot__tile" onClick={() => setOpen({ kind: 'build' })} aria-label="Empty slot: build a room">
              <Icon name="plus" size={26} />
              <strong>Empty slot</strong>
              <small>Tap to build</small>
            </button>
          </div>
        ))}
      </div>
      <div className="hall-strip" aria-label="Heroes at home">
        {strip.map((hero) => (
          <DraggableHero
            key={hero.id}
            hero={hero}
            state={state}
            actions={actions}
            className={`hall-strip__hero ${picked === hero.id ? 'is-picked' : ''}`}
            onClick={() => setPicked(picked === hero.id ? null : hero.id)}
            title={`${hero.name} · ${heroStatus(state, hero).label}`}
          >
            <HeroPortrait hero={hero} size="xs" showStatus={false} />
            <small>{hero.name.split(' ')[0]}</small>
          </DraggableHero>
        ))}
      </div>
      <p className="hall-tip muted">{picked ? `Now tap a training room or the infirmary for ${state.heroes.find((hero) => hero.id === picked)?.name}.` : 'Drag a hero onto a training room or the infirmary, or tap the hero, then the room. Drag onto the yard to take them out.'}</p>
      <div className="room-actions">
        {atHome(state) ? (
          <Button variant="primary" onClick={() => setOpen({ kind: 'rest' })}>
            Rest and pass time…
          </Button>
        ) : null}
        <Button onClick={actions.autoAssignRooms}>Auto-assign</Button>
        <Button onClick={() => setOpen({ kind: 'office' })}>Office</Button>
      </div>
      <PropertyGoal state={state} hall={hall} actions={actions} />
      {open?.kind === 'build' ? (
        <Sheet title="Build a room" icon="hammer" onClose={close}>
          <BuildList state={state} hall={hall} actions={actions} onDone={close} highlight={open.highlight} />
        </Sheet>
      ) : null}
      {room ? (
        <Sheet title={room.type === 'training' ? `${room.equipment.name} · ${room.equipment.stat} training` : room.name} icon={room.equipment?.icon || room.icon} onClose={close}>
          <RoomPanel key={room.id} state={state} room={room} hall={hall} actions={actions} onDone={close} />
        </Sheet>
      ) : null}
      {open?.kind === 'rest' ? (
        <Sheet title="Rest at the hall" icon="calendar" onClose={close}>
          <RestPanel state={state} hall={hall} actions={actions} onDone={close} />
        </Sheet>
      ) : null}
      {open?.kind === 'office' ? (
        <Sheet title="Office" icon="crown" onClose={close}>
          <HeadquartersScreen state={state} actions={actions} navigate={navigate} slot={slot} />
        </Sheet>
      ) : null}
    </div>
  );
}
