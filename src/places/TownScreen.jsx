import React from 'react';
import { BUILDINGS, LOCATION_BY_ID, PRIMALS, locationBuildings } from '../data/world.js';
import { Badge, Button, PrimalBadge, SceneBackdrop } from '../components/UI.jsx';
import PixelIcon, { BUILDING_ICONS } from '../components/PixelIcon.jsx';
import HeroesScreen from '../screens/HeroesScreen.jsx';
import MissionsScreen from '../screens/MissionsScreen.jsx';
import ArenaScreen from '../screens/ArenaScreen.jsx';
import RankingsScreen from '../screens/RankingsScreen.jsx';
import ShopScreen from '../screens/ShopScreen.jsx';
import GuildHallRooms from './GuildHallRooms.jsx';
import TownScene from '../explore/TownScene.jsx';
import WildScene from '../explore/WildScene.jsx';
import { townFor } from '../data/towns/index.js';
import { WILD_AREAS } from '../data/wilds/index.js';
import { HOME_LOCATION_ID, INN_NIGHT_COST, getLivingHistory, hallStage, roomLevel, travellingPartyIds } from '../game/engine.js';
import { ROOM_BY_ID, roomInterior } from '../data/rooms.js';
import { firstAsset } from '../data/assets.js';

// Interior art behind each building (asset ids, src/data/assets.js); the town backdrop otherwise.
// Arenas and inns have one interior per town (falling back to the shared one).
const BUILDING_INTERIORS = { herald: 'interior.herald', shop: 'interior.shop', arena: 'interior.arena', tavern: 'interior.tavern', noticeBoard: 'interior.noticeboard' };
const interiorFor = (building, locationId) =>
  building === 'arena' ? firstAsset(`interior.arena.${locationId}`, 'interior.arena') : building === 'tavern' && locationId !== HOME_LOCATION_ID ? firstAsset(`interior.inn.${locationId}`, 'interior.tavern') : BUILDING_INTERIORS[building];

/** Away from home, the tavern is an inn: rest 1–3 nights (heals the party, passes time). */
function InnRest({ state, actions }) {
  const party = Math.max(1, travellingPartyIds(state).length);
  return (
    <section className="inn-rest win">
      <div>
        <strong>Rooms for the night</strong>
        <small>
          {INN_NIGHT_COST} G a night per traveller ({party} with you). Rest heals the party; the heroes at home keep to their tasks.
        </small>
      </div>
      <div className="inn-rest__buttons">
        {[1, 2, 3].map((nights) => (
          <Button key={nights} size="sm" disabled={state.guild.crowns < INN_NIGHT_COST * nights * party} onClick={() => actions.restAtInn(nights)}>
            Rest {nights} night{nights === 1 ? '' : 's'} ({INN_NIGHT_COST * nights * party} G)
          </Button>
        ))}
      </div>
    </section>
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
  const walkable = townFor(locationId);
  const townLayout = walkable || { landmark: town.name, summary: town.description, districts: [] };
  const wildArea = !travel ? WILD_AREAS[state.world?.wildAreaId] : null;
  const livingHistory = getLivingHistory(state);
  const missing = place.building && !available.includes(place.building) ? BUILDINGS[place.building] : null;
  const building = place.building && !missing ? place.building : null;
  const props = { state, actions, navigate, slot };
  const showBuilding = (id) => setPlace({ view: 'town', building: id, tab: null });
  const openBuilding = (id) => showBuilding(id);
  // The Guild Hall shows its stage's interior, or the open room's interior at its level.
  const hallArt =
    building === 'guildHall'
      ? ROOM_BY_ID[place.tab] && roomLevel(state, place.tab)
        ? roomInterior(place.tab, roomLevel(state, place.tab))
        : hallStage(state).interior
      : null;
  const buildingLabel = (id) =>
    id === 'guildHall' ? (hallStage(state).key === 'rented' ? 'Your rented room' : 'Guild Hall') : walkable?.buildings.find((item) => item.building === id && !item.id)?.label || BUILDINGS[id]?.name;

  // Scenes own the entire viewport. Keeping them below this animated screen
  // would turn the fixed canvas into a descendant-sized strip.
  if (!building && wildArea) {
    return <WildScene key={wildArea.id} area={wildArea} state={state} actions={actions} navigate={navigate} />;
  }
  // The tile menu stays only as a small fallback ("Town directory").
  if (!building && !place.directory && !travel && walkable) {
    return (
      <TownScene
        key={walkable.id}
        town={walkable}
        state={state}
        actions={actions}
        navigate={navigate}
        openBuilding={openBuilding}
        showBuilding={showBuilding}
        openDirectory={() => setPlace({ view: 'town', building: null, directory: true })}
      />
    );
  }

  return (
    <div className={`screen screen--town town--${locationId}`} style={{ '--primal': PRIMALS[town.primal]?.color }}>
      <SceneBackdrop asset={hallArt || interiorFor(building, locationId) || firstAsset(`bg.town.${locationId}`, 'bg.town.default')} dim={building ? 0.58 : 0.28} />
      <header className={`town-header place-title ${building ? 'place-title--building' : ''}`}>
        {building ? (
          <Button size="sm" variant="primary" className="town-header__back town-header__leave" onClick={() => setPlace({ view: 'town', building: null })}>
            ◀ Leave
          </Button>
        ) : null}
        <div className="place-title__name">
          <h1>{building ? buildingLabel(building) : town.name}</h1>
          <span className="eyebrow">{building ? `Inside · ${BUILDINGS[building].name} · ${wildArea ? `back to ${wildArea.name}` : town.name}` : `Town directory · ${town.region}`}</span>
        </div>
        <div className="heading-metrics">
          <PrimalBadge primal={town.primal} />
          {!building && walkable && !travel ? (
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
              Continue journey ({travel.daysRemaining} day{travel.daysRemaining === 1 ? '' : 's'})
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
          {building === 'tavern' && locationId !== HOME_LOCATION_ID ? <InnRest state={state} actions={actions} /> : null}
          {building === 'tavern' ? <HeroesScreen {...props} tabs={['recruit']} /> : null}
          {building === 'noticeBoard' ? <MissionsScreen {...props} /> : null}
          {building === 'arena' ? <ArenaScreen {...props} locationId={locationId} /> : null}
          {building === 'shop' ? <ShopScreen {...props} /> : null}
          {building === 'herald' ? <RankingsScreen {...props} initialTab={place.tab} /> : null}
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
