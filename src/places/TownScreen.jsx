import React from 'react';
import { BUILDINGS, LOCATION_BY_ID, PRIMALS, locationBuildings } from '../data/world.js';
import { Badge, Button, PrimalBadge, Tabs } from '../components/UI.jsx';
import HallScreen from '../screens/HallScreen.jsx';
import HeroesScreen from '../screens/HeroesScreen.jsx';
import HeadquartersScreen from '../screens/HeadquartersScreen.jsx';
import MissionsScreen from '../screens/MissionsScreen.jsx';
import TournamentsScreen from '../screens/TournamentsScreen.jsx';
import RankingsScreen from '../screens/RankingsScreen.jsx';
import ShopScreen from '../screens/ShopScreen.jsx';
import EquipmentScreen from '../screens/EquipmentScreen.jsx';

const GUILD_HALL_TABS = [
  { id: 'overview', label: 'Overview', icon: '◆' },
  { id: 'roster', label: 'Roster', icon: '♟' },
  { id: 'equipment', label: 'Equipment & items', icon: '⚔' },
  { id: 'headquarters', label: 'Facilities & appointments', icon: '♜' },
];

function GuildHall({ props, tab, setTab }) {
  const active = GUILD_HALL_TABS.some((item) => item.id === tab) ? tab : 'overview';
  return (
    <>
      <Tabs active={active} onChange={setTab} items={GUILD_HALL_TABS} />
      {active === 'overview' ? <HallScreen {...props} /> : null}
      {active === 'roster' ? <HeroesScreen {...props} tabs={['roster', 'legends']} /> : null}
      {active === 'equipment' ? <EquipmentScreen {...props} /> : null}
      {active === 'headquarters' ? <HeadquartersScreen {...props} /> : null}
    </>
  );
}

function buildingBadge(state, buildingId, locationId) {
  if (buildingId === 'noticeBoard') return state.missions.filter((mission) => mission.locationId === locationId).length || null;
  if (buildingId === 'tavern') return state.candidates.filter((candidate) => (candidate.locationId || 'dunmere') === locationId).length || null;
  if (buildingId === 'arena')
    return state.tournaments.filter((tournament) => tournament.locationId === locationId && tournament.status !== 'completed').length || null;
  if (buildingId === 'guildHall') return state.pendingDecisions.length || null;
  return null;
}

export default function TownScreen({ state, actions, navigate, slot, place, setPlace }) {
  const locationId = state.world?.currentLocationId || 'dunmere';
  const town = LOCATION_BY_ID[locationId];
  const travel = state.world?.activeTravel;
  const available = travel ? ['guildHall'] : locationBuildings(locationId);
  const missing = place.building && !available.includes(place.building) ? BUILDINGS[place.building] : null;
  const building = place.building && !missing ? place.building : null;
  const props = { state, actions, navigate, slot };
  const openBuilding = (id) => {
    if (id === 'herald') actions.noteTutorial('visitHerald');
    setPlace({ view: 'town', building: id, tab: null });
  };

  return (
    <div className={`screen screen--town town--${locationId}`} style={{ '--primal': PRIMALS[town.primal]?.color }}>
      <header className="town-header">
        <div>
          <span className="eyebrow">
            {town.region} · {town.tier}
          </span>
          <h1>
            {building ? (
              <button className="town-header__back" onClick={() => setPlace({ view: 'town', building: null })}>
                ← {town.name}
              </button>
            ) : (
              town.name
            )}
            {building ? <span className="town-header__building"> · {BUILDINGS[building].name}</span> : null}
          </h1>
          {!building ? <p>{town.description}</p> : null}
        </div>
        <div className="heading-metrics">
          <PrimalBadge primal={town.primal} />
          <Button size="sm" onClick={() => navigate('map')}>
            World map
          </Button>
        </div>
      </header>

      {travel ? (
        <section className="town-notice">
          <strong>The guild is on the road to {LOCATION_BY_ID[travel.toId]?.name}.</strong>
          <span>Only the Guild Hall is open until you arrive.</span>
          {!state.pendingRoadEvent ? (
            <Button variant="primary" size="sm" onClick={actions.continueJourney}>
              Continue journey ({travel.monthsRemaining} month{travel.monthsRemaining === 1 ? '' : 's'})
            </Button>
          ) : null}
        </section>
      ) : null}

      {missing ? (
        <section className="town-notice">
          <strong>
            {town.name} has no {missing.name}.
          </strong>
          <span>Travel to a larger town on the world map.</span>
        </section>
      ) : null}

      {building ? (
        <div className={`building building--${building}`}>
          {building === 'guildHall' ? <GuildHall props={props} tab={place.tab} setTab={(tab) => setPlace({ ...place, tab })} /> : null}
          {building === 'tavern' ? <HeroesScreen {...props} tabs={['recruit', 'roster']} /> : null}
          {building === 'noticeBoard' ? <MissionsScreen {...props} /> : null}
          {building === 'arena' ? <TournamentsScreen {...props} /> : null}
          {building === 'shop' ? <ShopScreen {...props} /> : null}
          {building === 'herald' ? <RankingsScreen {...props} /> : null}
        </div>
      ) : (
        <div className="building-grid">
          {available.map((id) => {
            const info = BUILDINGS[id];
            const badge = buildingBadge(state, id, locationId);
            return (
              <button key={id} className={`building-tile building-tile--${id}`} onClick={() => openBuilding(id)}>
                <span className="building-tile__icon">{info.icon}</span>
                <strong>{info.name}</strong>
                <small>{info.description}</small>
                {badge ? <Badge tone={id === 'guildHall' ? 'red' : 'gold'}>{badge}</Badge> : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
