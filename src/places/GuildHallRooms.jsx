import React from 'react';
import { APPOINTMENTS } from '../data/content.js';
import { HALL_ROOMS, MONTHLY_ACTIVITIES } from '../data/activities.js';
import { FORMATION_TYPES } from '../data/formations.js';
import { RENTED_ROOM, ROOM_BY_ID } from '../data/rooms.js';
import { MAIN_PARTY_SIZE, activityAvailable, availableDrills, chestCapacity, chestUsed, getHallView, getPatronLoanOffer, isHeroAway, specializationTitle, trophyCount, upkeepBreakdown } from '../game/engine.js';
import { Badge, Button, HeroPortrait, Panel, ProgressBar } from '../components/UI.jsx';
import { activeRoster, heroStatus, heroWarnings } from '../components/heroStatus.js';
import PixelIcon, { ROOM_ICONS } from '../components/PixelIcon.jsx';
import EquipmentScreen from '../screens/EquipmentScreen.jsx';
import HeadquartersScreen from '../screens/HeadquartersScreen.jsx';

// The Guild Hall, from a rented room to a renowned hall (src/data/rooms.js).
// place.tab = the open room id, 'build' for the build list, or null for the hall.

function roomHeroes(state, activity) {
  return activeRoster(state).filter((hero) => !isHeroAway(state, hero) && (hero.monthlyActivity || 'Rest') === activity);
}

function HallSummary({ state, hall }) {
  const upkeep = upkeepBreakdown(state);
  return (
    <header className="hall-summary">
      <strong>{state.guild.name}</strong>
      <Badge tone="gold">{hall.stage.name}</Badge>
      <span className={hall.free <= 0 ? 'is-full' : ''}>
        {hall.used}/{hall.beds} beds
      </span>
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
    if (kind === 'rentBed') actions.rentBed();
    else if (kind === 'build') actions.buildRoom(suggestion.action.roomId);
    else if (kind === 'buyHall') setRoom?.(null);
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
  const noWing = !plan.built && hall.wings.free <= 0;
  return (
    <article className={`build-offer ${next.met ? '' : 'is-locked'} ${compact ? 'build-offer--compact' : ''}`}>
      <header>
        <PixelIcon name={ROOM_ICONS[plan.id] || 'castle'} size={24} />
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
      <Button variant="primary" disabled={!next.met || busy || noWing} onClick={() => actions.buildRoom(plan.id)}>
        {busy ? 'Builders are busy' : noWing ? 'No empty wing' : `Build (${next.cost} G)`}
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

function RentedRoom({ state, hall, actions }) {
  const rent = upkeepBreakdown(state).hall.rent;
  return (
    <Panel title={RENTED_ROOM.name} eyebrow={`Rent ${rent}/month`}>
      <ul className="rented-room">
        <li>
          <PixelIcon name="moon" size={24} /> {hall.rentedBeds} bed{hall.rentedBeds === 1 ? '' : 's'} ({hall.used} used)
        </li>
        <li>
          <PixelIcon name="flag" size={24} /> The banner on the wall
        </li>
        <li>
          <PixelIcon name="bag" size={24} /> A small chest: {chestUsed(state)}/{chestCapacity(state)} items
        </li>
      </ul>
      {hall.canRentBed ? (
        <Button onClick={actions.rentBed}>
          Rent another bed ({hall.bedCost} G, +{hall.bedRent}/month)
        </Button>
      ) : hall.rentedBeds >= RENTED_ROOM.maxBeds ? (
        <p className="muted">No space for another bed up here.</p>
      ) : null}
    </Panel>
  );
}

function HallPurchase({ state, hall, actions }) {
  const purchase = hall.purchase;
  return (
    <Panel title="The old hall on Banner Plaza" eyebrow="For sale by the town council">
      <p>Empty, drafty, and big enough to grow into: six wings to build rooms in, and a dormitory corner with two more beds.</p>
      {purchase.met ? (
        <div className="hall-purchase__actions">
          <Button variant="primary" disabled={state.guild.crowns < purchase.buy} onClick={() => actions.acquireHall('buy')}>
            Buy ({purchase.buy} G)
          </Button>
          <Button disabled={state.guild.crowns < purchase.lease} onClick={() => actions.acquireHall('lease')}>
            Lease ({purchase.lease} G now, {purchase.leaseRent}/month)
          </Button>
        </div>
      ) : (
        <p className="muted">The council wants proof you will last: {purchase.missing.join(', ')}.</p>
      )}
    </Panel>
  );
}

function WarRoom({ state, actions }) {
  const party = state.guild.mainParty || [];
  return (
    <>
      <Panel title="Main party" eyebrow={`${party.length}/${MAIN_PARTY_SIZE} · fights in the wild, pre-fills contracts and tournaments`}>
        {activeRoster(state).map((hero) => (
          <label key={hero.id} className="war-room__member">
            <input type="checkbox" checked={party.includes(hero.id)} disabled={!party.includes(hero.id) && party.length >= MAIN_PARTY_SIZE} onChange={() => actions.toggleMainParty(hero.id)} />
            <HeroPortrait hero={hero} size="xs" showStatus={false} />
            <span>
              {hero.name} · Lv {hero.level} {hero.classId} · {heroStatus(state, hero).label}
            </span>
          </label>
        ))}
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
          <p className="muted">Advance time to receive the first report.</p>
        )}
      </Panel>
      <Panel title="Monthly costs" eyebrow="Paid on week 1 of every month">
        <dl className="treasury-table">
          <dt>Wages</dt>
          <dd>{upkeep.wages}</dd>
          {upkeep.hall.rent ? (
            <>
              <dt>Room rent</dt>
              <dd>{upkeep.hall.rent}</dd>
            </>
          ) : null}
          {upkeep.hall.lease ? (
            <>
              <dt>Hall lease</dt>
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
          {state.stats.individualTournamentWins ? <li>♛ {state.stats.individualTournamentWins} tournament title(s)</li> : null}
          {state.stats.guildTournamentWins ? <li>⚑ {state.stats.guildTournamentWins} guild title(s)</li> : null}
          {(state.artifacts || []).map((artifact) => (
            <li key={artifact.id || artifact.name}>✦ {artifact.name}</li>
          ))}
          {(state.defeatedBosses || []).map((boss) => (
            <li key={boss}>☠ {String(boss).replace(/^boss-/, '').replace(/-/g, ' ')}</li>
          ))}
          {wildBosses.map(([areaId]) => (
            <li key={areaId}>☠ The boss of {areaId.replace(/-/g, ' ')}</li>
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

/** A tile on the hall floor plan. */
function Tile({ id, icon, name, text, badge, onClick, className = '' }) {
  return (
    <button className={`building-tile room-tile room-tile--${id} ${className}`} onClick={onClick}>
      <span className="building-tile__icon">
        <PixelIcon name={icon} size={36} />
      </span>
      <strong>{name}</strong>
      <small>{text}</small>
      {badge !== null && badge !== undefined ? <Badge tone="blue">{badge}</Badge> : null}
    </button>
  );
}

export default function GuildHallRooms({ state, actions, navigate, slot, room: roomId, setRoom }) {
  const hall = getHallView(state);
  const props = { state, actions, navigate, slot };
  const plan = hall.rooms.find((item) => item.id === roomId && item.built) || null;
  const basic = HALL_ROOMS.find((item) => item.id === roomId && (!item.needsHall || hall.owned)) || null;

  if (!plan && !basic && roomId !== 'build') {
    const building = hall.construction && !hall.rooms.find((item) => item.id === hall.construction.roomId)?.built ? hall.construction : null;
    const emptyWings = Math.max(0, hall.wings.free);
    return (
      <div className="hall-rooms">
        <HallSummary state={state} hall={hall} />
        <NextUpgrade suggestion={hall.suggestion} actions={actions} setRoom={setRoom} />
        {!hall.owned ? (
          <div className="hall-start">
            <RentedRoom state={state} hall={hall} actions={actions} />
            <HallPurchase state={state} hall={hall} actions={actions} />
          </div>
        ) : null}
        <div className="room-actions">
          <Button onClick={actions.autoAssignRooms}>Auto-assign heroes to rooms</Button>
        </div>
        <nav className="building-grid" aria-label="Guild Hall rooms" data-menu>
          {HALL_ROOMS.filter((item) => !item.needsHall || hall.owned).map((item) => (
            <Tile key={item.id} id={item.id} icon={ROOM_ICONS[item.id] || 'castle'} name={item.name} text={item.description} badge={roomHeroes(state, item.activity).length} onClick={() => setRoom(item.id)} />
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
                badge={item.activity ? roomHeroes(state, item.activity).length : item.id === 'war' ? (state.guild.mainParty || []).length : null}
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
          {Array.from({ length: emptyWings }, (_, index) => (
            <Tile key={`wing-${index}`} id="wing" icon="hammer" name="Empty wing" text="Build here" className="room-tile--empty" onClick={() => setRoom('build')} />
          ))}
        </nav>
      </div>
    );
  }

  const title = roomId === 'build' ? 'Build a room' : plan ? plan.name : basic.name;
  return (
    <div className={`hall-room hall-room--${roomId}`}>
      <HallSummary state={state} hall={hall} />
      <h2 className="hall-room__title">
        <Button size="sm" className="town-header__back" onClick={() => setRoom(null)}>
          ◀ Hall
        </Button>
        <PixelIcon name={roomId === 'build' ? 'hammer' : ROOM_ICONS[roomId] || 'castle'} size={24} />
        {title}
      </h2>
      {roomId === 'build' ? <BuildList hall={hall} actions={actions} /> : null}
      {plan ? (
        <>
          <p className="muted">{plan.description}</p>
          <RoomStatus plan={plan} hall={hall} actions={actions} />
        </>
      ) : null}
      {basic ? <p className="muted">{basic.description}</p> : null}
      {basic?.id === 'quarters' ? (
        <p className="quarters-beds">
          {hall.used}/{hall.beds} beds used{hall.rentedBeds ? ` · ${hall.rentedBeds} in the rented room` : ''}
          {hall.canRentBed ? (
            <Button size="sm" onClick={actions.rentBed}>
              Rent another bed ({hall.bedCost} G)
            </Button>
          ) : null}
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
