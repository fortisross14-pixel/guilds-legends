import React from 'react';
import { BUILDINGS, LOCATION_BY_ID, PRIMALS, locationBuildings } from '../data/world.js';
import { Badge, Button, PrimalBadge, SceneBackdrop } from '../components/UI.jsx';
import PixelIcon, { BUILDING_ICONS } from '../components/PixelIcon.jsx';
import HeroesScreen from '../screens/HeroesScreen.jsx';
import MissionsScreen from '../screens/MissionsScreen.jsx';
import TournamentsScreen from '../screens/TournamentsScreen.jsx';
import RankingsScreen from '../screens/RankingsScreen.jsx';
import ShopScreen from '../screens/ShopScreen.jsx';
import GuildHallRooms from './GuildHallRooms.jsx';

// Pixel scene behind each building's header (town street by default).
const BUILDING_SCENES = { guildHall: 'scene_09', herald: 'scene_03', shop: 'scene_01', arena: 'scene_02', tavern: 'scene_08', noticeBoard: 'scene_10' };

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
      <SceneBackdrop scene={BUILDING_SCENES[building] || 'scene_07'} dim={building ? 0.58 : 0.28} />
      <header className={`town-header place-title ${building ? 'place-title--building' : ''}`}>
        {building ? (
          <Button size="sm" className="town-header__back" onClick={() => setPlace({ view: 'town', building: null })}>
            ◀ {town.name}
          </Button>
        ) : null}
        <div className="place-title__name">
          <h1>{building ? BUILDINGS[building].name : town.name}</h1>
          <span className="eyebrow">{building ? `${town.name} · ${town.region}` : `${town.region} · ${town.tier}`}</span>
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
          {building === 'guildHall' ? <GuildHallRooms {...props} room={place.tab} setRoom={(tab) => setPlace({ ...place, tab })} /> : null}
          {building === 'tavern' ? <HeroesScreen {...props} tabs={['recruit']} /> : null}
          {building === 'noticeBoard' ? <MissionsScreen {...props} /> : null}
          {building === 'arena' ? <TournamentsScreen {...props} /> : null}
          {building === 'shop' ? <ShopScreen {...props} /> : null}
          {building === 'herald' ? <RankingsScreen {...props} /> : null}
        </div>
      ) : (
        <div className="town-body">
          <nav className="building-grid" aria-label={`Buildings in ${town.name}`} data-menu>
            {available.map((id) => {
              const info = BUILDINGS[id];
              const badge = buildingBadge(state, id, locationId);
              return (
                <button key={id} className={`building-tile building-tile--${id}`} onClick={() => openBuilding(id)}>
                  <span className="building-tile__icon">
                    <PixelIcon name={BUILDING_ICONS[id] || 'town'} size={36} />
                  </span>
                  <strong>{info.name}</strong>
                  <small>{info.description}</small>
                  {badge ? <Badge tone={id === 'guildHall' ? 'red' : 'blue'}>{badge}</Badge> : null}
                </button>
              );
            })}
          </nav>
          <aside className="town-info win">
            <p>{town.description}</p>
            <div className="heading-metrics">
              <PrimalBadge primal={town.primal} />
              <Button size="sm" onClick={() => navigate('map')}>
                World map
              </Button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
