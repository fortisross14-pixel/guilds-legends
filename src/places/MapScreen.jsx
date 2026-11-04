import { usePanZoom } from '../components/usePanZoom.js';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { BUILDINGS, LOCATIONS, LOCATION_BY_ID, PRIMALS, locationBuildings } from '../data/world.js';
import { getStoryView, knownMissions, getTravelQuote, getWildAreaView, getWorldKnowledge } from '../game/engine.js';
import { WILD_AREAS, WILD_AREA_LIST } from '../data/wilds/index.js';
import { Badge, Button, PrimalBadge, ProgressBar, RiskPips } from '../components/UI.jsx';
import { useAssetUrl } from '../components/Asset.jsx';
import { BEYOND_TEASER, inSlice } from '../data/slice.js';
import Icon from '../components/Icon.jsx';

const TIER_ORDER = { Regional: 0, National: 1, Global: 2 };

// Road network as chains of location ids. Paths are built from each location's
// x/y (percent of the map), so routes always meet the nodes.
const MAP_ROUTES = [
  {
    dim: false,
    chain: ['dunmere', 'greenhollow', 'ironford', 'windmere', 'tidecross', 'sunspire', 'mooncourt', 'thornwatch', 'skyreach', 'beaststeppe', 'irondeep'],
  },
  { dim: true, chain: ['tidecross', 'brasshaven', 'coral-crown', 'cloud-monastery', 'ashen-caldera', 'starfall-archive', 'far-veil'] },
  { dim: true, chain: ['thornwatch', 'verdant-citadel', 'irondeep'] },
  { dim: true, chain: ['skyreach', 'ashen-caldera', 'cloud-monastery'] },
];

function routePath(chain) {
  return chain
    .map((id) => LOCATION_BY_ID[id])
    .filter(Boolean)
    .map((location, index) => `${index ? 'L' : 'M'}${location.x} ${location.y}`)
    .join(' ');
}

// place.pin: a location to highlight (from the Quest Log).
export default function MapScreen({ state, actions, navigate, place }) {
  const currentLocationId = state.world?.currentLocationId || 'dunmere';
  const pinId = place?.pin || null;
  const [selectedId, setSelectedId] = useState(pinId || (state.world?.wildAreaId ? `wild:${state.world.wildAreaId}` : currentLocationId));
  const selectedWild = String(selectedId).startsWith('wild:') ? WILD_AREAS[String(selectedId).slice(5)] || null : null;
  const selected = LOCATION_BY_ID[selectedId] || LOCATION_BY_ID[currentLocationId];
  const story = getStoryView(state);
  // The main quest marker: where the current story step happens (it can be hidden in the Quest Log).
  const questId = state.settings?.questMarker === false ? null : story.pin;
  const questTitle = story.active?.title || '';
  const knowledge = getWorldKnowledge(state);
  const selectedBeyond = !inSlice(selected.id);
  const unlocked = TIER_ORDER[selected.tier] <= state.guild.tierIndex && !selectedBeyond;
  const overworld = useAssetUrl('ui.overworld');
  // Drag to pan, pinch (or wheel) to zoom; a tap still picks a location.
  const panZoom = usePanZoom({ max: 3 });
  const quote = getTravelQuote(state, selected.id);
  const travel = state.world?.activeTravel;
  const locationMissions = knownMissions(state).filter((mission) => mission.locationId === selected.id);
  const locationTournament = state.tournaments?.find((tournament) => tournament.locationId === selected.id);
  const selectedBranch = (state.guild.branches || []).find((branch) => branch.active !== false && branch.locationId === selected.id);
  const selectedKnowledge = knowledge[selected.id] || 'unknown';
  const selectedKnown = selectedKnowledge !== 'unknown';
  const selectedVisited = selectedKnowledge === 'visited' || selectedKnowledge === 'fullyExplored';
  const selectedSource = state.world?.knowledge?.sources?.[selected.id];

  const startJourney = () => actions.travel(selected.id);

  return (
    <div className="screen screen--world">
      {travel ? (
        <section className="travel-banner">
          <div className="travel-banner__route">
            <span><Icon name={LOCATION_BY_ID[travel.fromId]?.icon} size={16} /></span>
            <i><Icon name="next" size={14} tone="plain" /></i>
            <span><Icon name={LOCATION_BY_ID[travel.toId]?.icon} size={16} /></span>
          </div>
          <div>
            <h2>
              {LOCATION_BY_ID[travel.fromId]?.name} to {LOCATION_BY_ID[travel.toId]?.name}
            </h2>
          </div>
          <div className="travel-banner__time">
            <strong>{travel.daysRemaining}</strong>
            <span>day{travel.daysRemaining === 1 ? '' : 's'} left</span>
            <ProgressBar value={travel.totalDays - travel.daysRemaining} max={travel.totalDays} tone="blue" compact />
            {!state.pendingRoadEvent ? (
              <Button variant="primary" size="sm" onClick={actions.continueJourney}>
                Continue
              </Button>
            ) : null}
          </div>
        </section>
      ) : null}

      <div className="world-layout world-layout--locations">
        {createPortal(
          <section className="world-map world-map--locations" aria-label="Fictional world travel map (drag to pan, pinch to zoom)" {...panZoom.handlers}>
            {panZoom.zoomed ? (
              <button type="button" className="world-map__reset" onClick={panZoom.reset} aria-label="Reset the map view">
                <Icon name="recenter" size={18} tone="plain" />
              </button>
            ) : null}
            <div className="world-map__plane" style={panZoom.style}>
              <div className="world-map__terrain" style={{ '--overworld': overworld ? `url("${overworld}")` : 'none' }} data-asset="ui.overworld" />
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Travel routes between fictional settlements">
                {MAP_ROUTES.map((route) => (
                  <path
                    key={`under-${route.chain.join('-')}`}
                    className={`map-route map-route--under${route.dim ? ' map-route--dim' : ''}`}
                    d={routePath(route.chain)}
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
                {MAP_ROUTES.map((route) => (
                  <path
                    key={route.chain.join('-')}
                    className={`map-route${route.dim ? ' map-route--dim' : ''}`}
                    d={routePath(route.chain)}
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
                {travel && LOCATION_BY_ID[travel.fromId] && LOCATION_BY_ID[travel.toId] ? (
                  <>
                    <path
                      className="map-route map-route--travel"
                      d={`M${LOCATION_BY_ID[travel.fromId].x} ${LOCATION_BY_ID[travel.fromId].y} L${LOCATION_BY_ID[travel.toId].x} ${LOCATION_BY_ID[travel.toId].y}`}
                      vectorEffect="non-scaling-stroke"
                    />
                  </>
                ) : null}
              </svg>
              {travel && LOCATION_BY_ID[travel.fromId] && LOCATION_BY_ID[travel.toId] ? (
                <span
                  className="map-party-marker"
                  title="Your guild on the road"
                  style={{
                    left: `${LOCATION_BY_ID[travel.fromId].x + (LOCATION_BY_ID[travel.toId].x - LOCATION_BY_ID[travel.fromId].x) * ((travel.totalDays - travel.daysRemaining) / travel.totalDays)}%`,
                    top: `${LOCATION_BY_ID[travel.fromId].y + (LOCATION_BY_ID[travel.toId].y - LOCATION_BY_ID[travel.fromId].y) * ((travel.totalDays - travel.daysRemaining) / travel.totalDays)}%`,
                  }}
                >
                  <Icon name="flag" size={24} />
                </span>
              ) : null}
              {LOCATIONS.map((location) => {
                const beyond = !inSlice(location.id);
                const canReach = TIER_ORDER[location.tier] <= state.guild.tierIndex && !beyond;
                const isCurrent = location.id === currentLocationId;
                const isDestination = travel?.toId === location.id;
                const knowledgeStatus = knowledge[location.id] || 'unknown';
                return (
                  <button
                    key={location.id}
                    className={`location-node location-node--${knowledgeStatus} ${(state.guild.branches || []).some((branch) => branch.active !== false && branch.locationId === location.id) ? 'is-branch' : ''} ${selected.id === location.id ? 'is-selected' : ''} ${canReach ? 'is-unlocked' : 'is-locked'} ${isCurrent ? 'is-current' : ''} ${isDestination ? 'is-destination' : ''}`}
                    style={{ left: `${location.x}%`, top: `${location.y}%`, '--primal': PRIMALS[location.primal].color }}
                    onClick={() => setSelectedId(location.id)}
                    aria-label={beyond ? BEYOND_TEASER.title : knowledgeStatus === 'unknown' ? `Uncharted ${location.tier} frontier` : `${location.name}, ${knowledgeStatus}`}
                  >
                    {isCurrent && !travel ? (
                      <em className="location-node__here">
                        <span>You are here</span>
                        <Icon name="pointer" size={12} />
                      </em>
                    ) : null}
                    <span className="location-node__icon">
                      <Icon name={canReach ? (knowledgeStatus === 'unknown' ? 'pin' : isCurrent ? 'castle' : 'town') : 'lock'} size={24} />
                    </span>
                    <strong>{canReach ? (knowledgeStatus === 'unknown' ? 'Uncharted' : location.name) : beyond ? 'Beyond' : location.tier}</strong>
                    <small>
                      {isCurrent
                        ? 'HQ here'
                        : (state.guild.branches || []).some((branch) => branch.active !== false && branch.locationId === location.id)
                          ? 'Branch'
                          : canReach
                            ? knowledgeStatus === 'visited'
                              ? location.primal
                              : knowledgeStatus === 'rumored'
                                ? 'Rumored'
                                : 'Unknown'
                            : beyond
                              ? 'Known roads end'
                              : 'Locked'}
                    </small>
                  </button>
                );
              })}
              {state.missions
                .filter((mission) => mission.bossId && LOCATION_BY_ID[mission.locationId] && knowledge[mission.locationId] !== 'unknown')
                .map((mission) => (
                  <span
                    key={mission.id}
                    className="map-boss"
                    style={{ left: `${LOCATION_BY_ID[mission.locationId].x}%`, top: `${LOCATION_BY_ID[mission.locationId].y}%` }}
                    title={mission.title}
                  >
                    <Icon name="skull" size={24} label={`Boss: ${mission.title}`} />
                  </span>
                ))}
              {WILD_AREA_LIST.map((area) => {
                const view = getWildAreaView(state, area.id);
                return (
                  <button
                    key={area.id}
                    className={`location-node location-node--wild ${view.unlocked ? 'is-unlocked' : 'is-locked'} ${selectedWild?.id === area.id ? 'is-selected' : ''} ${view.here ? 'is-current' : ''}`}
                    style={{ left: `${area.map.x}%`, top: `${area.map.y}%`, '--primal': PRIMALS[area.primal]?.color }}
                    onClick={() => setSelectedId(`wild:${area.id}`)}
                    aria-label={`${area.name}, wild area${view.unlocked ? '' : ', closed'}`}
                  >
                    {view.here ? (
                      <em className="location-node__here">
                        <span>You are here</span>
                        <Icon name="pointer" size={12} />
                      </em>
                    ) : null}
                    <span className="location-node__icon">
                      <Icon name={view.unlocked ? 'tree' : 'lock'} size={24} />
                    </span>
                    <strong>{area.name}</strong>
                    <small>{view.unlocked ? 'Wild area' : 'Closed'}</small>
                  </button>
                );
              })}
              {questId && LOCATION_BY_ID[questId] ? (
                <span className="map-quest" style={{ left: `${LOCATION_BY_ID[questId].x}%`, top: `${LOCATION_BY_ID[questId].y}%` }}>
                  <Icon name="star" size={18} label={`Main quest: ${questTitle}`} />
                  <span>{questTitle}</span>
                </span>
              ) : null}
              {pinId && LOCATION_BY_ID[pinId] ? (
                <span className="map-pin" style={{ left: `${LOCATION_BY_ID[pinId].x}%`, top: `${LOCATION_BY_ID[pinId].y}%` }} title="Contract location">
                  <Icon name="pin" size={24} label="Contract location" />
                </span>
              ) : null}
            </div>
            <div className="world-map__fog" aria-hidden="true" />
          </section>,
          document.body,
        )}

        {selectedWild ? (
          <WildCard area={selectedWild} state={state} actions={actions} />
        ) : (
        <aside className="region-dossier region-dossier--location" style={{ '--primal': PRIMALS[selected.primal].color }}>
          <div className="region-dossier__banner">
            <span>
              <Icon name={unlocked ? (selected.id === currentLocationId ? 'castle' : 'town') : 'lock'} size={24} />
            </span>
            <div>
              <h2>{unlocked ? (selectedKnown ? selected.name : 'Uncharted') : selectedBeyond ? BEYOND_TEASER.title : `${selected.tier} frontier`}</h2>
              {unlocked && selectedKnown ? <PrimalBadge primal={selected.primal} /> : null}
            </div>
          </div>
          {unlocked && selectedVisited ? (
            <>
              {selectedBranch ? (
                <div className="current-location-actions">
                  <Badge tone="purple">Branch · Lv {selectedBranch.level}</Badge>
                  <Button variant="primary" onClick={() => navigate('missions')}>
                    Contracts
                  </Button>
                </div>
              ) : selected.id !== currentLocationId ? (
                <div className="current-location-actions">
                  <span className="map-quote num">
                    <Icon name="boot" size={16} /> {quote.label} · <Icon name="coin" size={16} /> {quote.cost}
                  </span>
                  <Button variant="primary" size="lg" onClick={startJourney} disabled={Boolean(travel) || state.guild.crowns < quote.cost} why={travel ? 'Already on the road.' : `Travel costs ${quote.cost} gold.`}>
                  {travel ? 'On the road' : `Travel to ${selected.name}`}
                </Button>
                </div>
              ) : (
                <div className="current-location-actions">
                  <Badge tone="green">You are here</Badge>
                  <Button variant="primary" size="lg" onClick={() => navigate('town')}>
                    Enter {selected.name}
                  </Button>
                </div>
              )}
              <details className="journal-details">
                <summary>Details</summary>
                <p className="region-dossier__identity">{selected.description}</p>
                <div className="dossier-row">
                  <span>Primal</span>
                  <strong>
                    Beats {PRIMALS[selected.primal].beats} · weak to {PRIMALS[selected.primal].weakTo}
                  </strong>
                </div>
                <div className="dossier-row">
                  <span>Recruits</span>
                  <strong>{selected.specialties.join(' · ')}</strong>
                </div>
                <div className="dossier-row">
                  <span>Buildings</span>
                  <strong>
                    {locationBuildings(selected.id)
                      .filter((id) => id !== 'guildHall')
                      .map((id) => BUILDINGS[id].name)
                      .join(' · ')}
                  </strong>
                </div>
                {locationTournament ? (
                  <div className="dossier-row">
                    <span>Tournament</span>
                    <strong>{locationTournament.division}</strong>
                  </div>
                ) : null}
                {locationMissions.length ? (
                  <div className="region-missions">
                    {locationMissions.slice(0, 3).map((mission) => (
                      <button key={mission.id} onClick={() => (selected.id === currentLocationId ? navigate('missions') : null)}>
                        <div>
                          <strong>{mission.title}</strong>
                          <small className="num">{mission.reward} gold</small>
                        </div>
                        <RiskPips risk={mission.risk} />
                      </button>
                    ))}
                  </div>
                ) : null}
              </details>
            </>
          ) : unlocked && ['rumored', 'discovered'].includes(selectedKnowledge) ? (
            <div className="locked-dossier">
              <p>“{selectedSource?.note || `People talk of ${selected.name}.`}” · {selectedSource?.source || 'Travellers'}</p>
              {selected.id !== currentLocationId ? (
                <Button variant="primary" size="lg" onClick={startJourney} disabled={Boolean(travel) || state.guild.crowns < quote.cost} why={travel ? 'Already on the road.' : `Travel costs ${quote.cost} gold.`}>
                  {travel ? 'On the road' : `Travel (${quote.label})`}
                </Button>
              ) : null}
            </div>
          ) : unlocked ? (
            <div className="locked-dossier">
              {selected.id !== currentLocationId ? (
                <Button variant="primary" size="lg" onClick={startJourney} disabled={Boolean(travel) || state.guild.crowns < quote.cost} why={travel ? 'Already on the road.' : `Travel costs ${quote.cost} gold.`}>
                  {travel ? 'On the road' : `Chart this road (${quote.label})`}
                </Button>
              ) : null}
            </div>
          ) : selectedBeyond ? (
            <div className="locked-dossier locked-dossier--beyond">
              <Badge tone="purple">A later chapter</Badge>
            </div>
          ) : (
            <div className="locked-dossier">
              <Badge tone="purple">Needs {selected.tier} status</Badge>
            </div>
          )}
        </aside>
        )}
      </div>

      <div className="location-mobile-list" aria-label="Destinations list" data-menu>
        {WILD_AREA_LIST.map((area) => (
          <button key={area.id} className={selectedWild?.id === area.id ? 'is-selected' : ''} onClick={() => setSelectedId(`wild:${area.id}`)}>
            <span style={{ '--primal': PRIMALS[area.primal]?.color }}>
              <Icon name="tree" size={12} />
            </span>
            <div>
              <strong>{area.name}</strong>
            </div>
          </button>
        ))}
        {/* Places in a later chapter share one row. */}
        {LOCATIONS.filter((location, index) => inSlice(location.id) || LOCATIONS.findIndex((item) => !inSlice(item.id)) === index).map((location) => {
          const beyond = !inSlice(location.id);
          const canReach = TIER_ORDER[location.tier] <= state.guild.tierIndex && !beyond;
          const knowledgeStatus = knowledge[location.id] || 'unknown';
          return (
            <button
              key={location.id}
              className={`${selected.id === location.id ? 'is-selected' : ''} ${location.id === currentLocationId ? 'is-current' : ''}`}
              onClick={() => setSelectedId(location.id)}
            >
              <span style={{ '--primal': PRIMALS[location.primal].color }}>
                <Icon name={canReach ? (location.id === currentLocationId ? 'castle' : 'town') : 'lock'} size={12} />
              </span>
              <div>
                <strong>{canReach ? (knowledgeStatus === 'unknown' ? 'Uncharted' : location.name) : beyond ? BEYOND_TEASER.title : `${location.tier} frontier`}</strong>
              </div>
              {location.id === currentLocationId ? <Icon name="pin" size={18} label="You are here" /> : null}
            </button>
          );
        })}
      </div>

    </div>
  );
}

/** The world-map card for a wild area: what is there, and Enter or Travel. */
function WildCard({ area, state, actions }) {
  const view = getWildAreaView(state, area.id);
  const hub = LOCATION_BY_ID[area.hub];
  const quote = getTravelQuote(state, area.hub);
  const travel = state.world?.activeTravel;
  const groups = view.groups.filter((group) => group.present);
  const ready = groups.filter((group) => group.available);
  const boss = groups.find((group) => group.boss);
  return (
    <aside className="region-dossier region-dossier--location region-dossier--wild" style={{ '--primal': PRIMALS[area.primal]?.color }}>
      <div className="region-dossier__banner">
        <span>
          <Icon name={view.unlocked ? 'tree' : 'lock'} size={24} />
        </span>
        <div>
          <small>Wild area · reached from {hub?.name}</small>
          <h2>{area.name}</h2>
        </div>
      </div>
      <p className="region-dossier__identity">{area.description}</p>
      {view.unlocked ? (
        <>
          <div className="location-economy-grid">
            <div>
              <span>Enemy groups</span>
              <strong>
                {ready.length}/{groups.length}
              </strong>
            </div>
            <div>
              <span>Gathering spots</span>
              <strong>{view.gathers.filter((spot) => spot.available).length}</strong>
            </div>
            <div>
              <span>Camp</span>
              <strong>{area.camp.name}</strong>
            </div>
            <div>
              <span>Boss</span>
              <strong>{boss ? (boss.available ? boss.name : `Back in ${boss.weeksLeft}w`) : 'None yet'}</strong>
            </div>
          </div>
          {view.here ? (
            <Badge tone="green">You are here</Badge>
          ) : view.atHub ? (
            <Button variant="primary" size="lg" onClick={() => actions.enterWild(area.id)}>
              Enter {area.name}
            </Button>
          ) : (
            <div className="travel-quote">
              <div>
                <span>Journey to {hub?.name}</span>
                <strong>{quote.label}</strong>
              </div>
              <div>
                <span>Travel budget</span>
                <strong>{quote.cost} gold</strong>
              </div>
              <Button variant="primary" size="lg" disabled={Boolean(travel) || state.guild.crowns < quote.cost}
                    why={travel ? 'Already on the road.' : `Travel costs ${quote.cost} gold.`} onClick={() => actions.travel(area.hub)}>
                {travel ? 'Already traveling' : `Travel to ${hub?.name} (${quote.label})`}
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="locked-dossier">
          <Icon name="lock" size={28} />
          <h3>Closed for now</h3>
          <p>{area.lockedText}</p>
        </div>
      )}
    </aside>
  );
}
