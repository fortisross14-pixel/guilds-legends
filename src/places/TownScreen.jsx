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
import DunmereExploration from '../components/DunmereExploration.jsx';
import { townLayoutFor } from '../data/townLayouts.js';
import { getLivingHistory } from '../game/engine.js';
import { firstAsset } from '../data/assets.js';

// Interior art behind each building (asset ids, src/data/assets.js); the town backdrop otherwise.
const BUILDING_INTERIORS = { guildHall: 'interior.guildhall', herald: 'interior.herald', shop: 'interior.shop', arena: 'interior.arena', tavern: 'interior.tavern', noticeBoard: 'interior.noticeboard' };

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
  const townLayout = townLayoutFor(town, available);
  const livingHistory = getLivingHistory(state);
  const missing = place.building && !available.includes(place.building) ? BUILDINGS[place.building] : null;
  const building = place.building && !missing ? place.building : null;
  const props = { state, actions, navigate, slot };
  const openBuilding = (id) => {
    if (id === 'herald') actions.noteTutorial('visitHerald');
    setPlace({ view: 'town', building: id, tab: null });
  };

  // Exploration owns the entire viewport. Keeping it below this animated screen
  // would turn its fixed canvas into a descendant-sized strip.
  // The tile menu stays as an accessibility fallback ("Town directory").
  if (!building && !place.directory && locationId === 'dunmere' && state.flags?.opening?.phase === 'complete') {
    return (
      <DunmereExploration
        state={state}
        actions={actions}
        openBuilding={openBuilding}
        openDirectory={() => setPlace({ view: 'town', building: null, directory: true })}
      />
    );
  }

  return (
    <div className={`screen screen--town town--${locationId}`} style={{ '--primal': PRIMALS[town.primal]?.color }}>
      <SceneBackdrop asset={BUILDING_INTERIORS[building] || firstAsset(`bg.town.${locationId}`, 'bg.town.default')} dim={building ? 0.58 : 0.28} />
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
          {!building && place.directory && locationId === 'dunmere' ? (
            <Button size="sm" variant="primary" onClick={() => setPlace({ view: 'town', building: null })}>
              Walk the streets
            </Button>
          ) : null}
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
            <span className="eyebrow">{townLayout.landmark}</span>
            <p>{townLayout.summary}</p>
            <small>{townLayout.districts.join(' · ')}</small>
            {livingHistory.spotlight ? (
              <div className={`town-history town-history--${livingHistory.spotlight.tone}`}>
                <strong>{livingHistory.spotlight.title}</strong>
                <span>{livingHistory.spotlight.text}</span>
              </div>
            ) : null}
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
