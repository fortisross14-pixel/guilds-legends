import { ROADS } from '../data/roads.js';
import { usePanZoom } from '../components/usePanZoom.js';
import React, { useState } from 'react';
import { statusName } from '../data/tournaments.js';
import { createPortal } from 'react-dom';
import { BUILDINGS, LOCATIONS, LOCATION_BY_ID, PRIMALS, locationBuildings } from '../data/world.js';
import { activeContracts, getStoryView, knownMissions, getTravelQuote, getWildAreaView, getWorldKnowledge } from '../game/engine.js';
import { WILD_AREAS, WILD_AREA_LIST } from '../data/wilds/index.js';
import { Badge, Button, PrimalBadge, ProgressBar, RiskPips } from '../components/UI.jsx';
import { useAssetUrl } from '../components/Asset.jsx';
import { BEYOND_TEASER, inSlice } from '../data/slice.js';
import Icon from '../components/Icon.jsx';


// Road network as chains of location ids: roads travelled from the map (no walkable area).
// Walkable roads are drawn as spurs from each known end to their marker (below).
const MAP_ROUTES = ROADS.filter((road) => !road.area && road.ends.every(Boolean)).map((road) => ({ dim: Boolean(road.gate?.chapterAtLeast), chain: road.ends }));

/**
 * Where a wild area sits on the map: a road between two places sits halfway along it;
 * a dead end (the Old Road, the Blackwood track) a little way out from its town.
 */
function areaSpot(area) {
  const road = ROADS.find((item) => item.area === area.id);
  const [a, b] = (road?.ends || []).map((id) => LOCATION_BY_ID[id]);
  if (a && b) return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  if (a && area.map) return { x: a.x + (area.map.x - a.x) * 0.45, y: a.y + (area.map.y - a.y) * 0.45 };
  return area.map;
}

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
  const questTitle = story.trackedContract?.title || story.tracked?.title || '';
  const knowledge = getWorldKnowledge(state);
  const selectedBeyond = !inSlice(selected.id);
  // The open world: every place can be reached; danger, not status, keeps a guild away.
  const unlocked = !selectedBeyond;
  const overworld = useAssetUrl('ui.overworld');
  // Drag to pan, pinch (or wheel) to zoom; a tap still picks a location.
  const panZoom = usePanZoom({ max: 3 });
  const quote = getTravelQuote(state, selected.id);
  const travel = state.world?.activeTravel;
  const locationMissions = knownMissions(state).filter((mission) => mission.locationId === selected.id);
  const locationTournament = state.tournaments?.find((tournament) => tournament.locationId === selected.id && tournament.status !== 'completed');
  const selectedBranch = (state.guild.branches || []).find((branch) => branch.active !== false && branch.locationId === selected.id);
  // Only what the guild knows is on the map: places it has visited or heard of, the roads
  // out of those places, and routes whose two ends it knows. A new campaign shows Dunmere.
  const known = (id) => id === currentLocationId || (knowledge[id] || 'unknown') !== 'unknown';
  const knownArea = (area) => {
    const road = ROADS.find((item) => item.area === area.id);
    return Boolean(state.world?.exploration?.wild?.[area.id]?.visited) || (road ? road.ends.some((end) => end && known(end)) : known(area.hub));
  };
  const routes = MAP_ROUTES.flatMap((route) =>
    route.chain.slice(1).map((id, index) => ({ dim: route.dim, chain: [route.chain[index], id] })).filter((leg) => leg.chain.every(known)),
  );
  // A walkable road is drawn from each known end to its marker, so it reaches the marker
  // before the far town is known (and a dead end, the Old Road, still meets its town).
  const spurs = WILD_AREA_LIST.filter(knownArea)
    .map((area) => ({ area, road: ROADS.find((item) => item.area === area.id) }))
    .filter(({ road }) => road)
    .flatMap(({ area, road }) =>
      road.ends.filter((end) => end && known(end)).map((end) => ({ id: `${area.id}-${end}`, from: LOCATION_BY_ID[end], to: areaSpot(area) })),
    );
  const selectedKnowledge = knowledge[selected.id] || 'unknown';
  const selectedKnown = selectedKnowledge !== 'unknown';
  const selectedVisited = selectedKnowledge === 'visited' || selectedKnowledge === 'fullyExplored';
  const selectedSource = state.world?.knowledge?.sources?.[selected.id];

  // A neighbour reached by a walkable road: step onto that road (src/data/roads.js); otherwise travel by the map.
  const startJourney = () => (quote?.walk ? actions.enterWild(quote.walk) : actions.travel(selected.id));

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
            <div className="world-map__plane" style={{ ...panZoom.style, '--fx': (LOCATION_BY_ID[currentLocationId]?.x ?? 50) / 100, '--fy': (LOCATION_BY_ID[currentLocationId]?.y ?? 50) / 100 }}>
              <div className="world-map__terrain" style={{ '--overworld': overworld ? `url("${overworld}")` : 'none' }} data-asset="ui.overworld" />
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Travel routes between fictional settlements">
                {spurs.map((spur) => (
                  <path key={`spur-under-${spur.id}`} className="map-route map-route--under" d={`M${spur.from.x} ${spur.from.y} L${spur.to.x} ${spur.to.y}`} vectorEffect="non-scaling-stroke" />
                ))}
                {spurs.map((spur) => (
                  <path key={`spur-${spur.id}`} className="map-route" d={`M${spur.from.x} ${spur.from.y} L${spur.to.x} ${spur.to.y}`} vectorEffect="non-scaling-stroke" />
                ))}
                {routes.map((route) => (
                  <path
                    key={`under-${route.chain.join('-')}`}
                    className={`map-route map-route--under${route.dim ? ' map-route--dim' : ''}`}
                    d={routePath(route.chain)}
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
                {routes.map((route) => (
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
              {LOCATIONS.filter((location) => known(location.id)).map((location) => {
                const beyond = !inSlice(location.id);
                const canReach = !beyond;
                const isCurrent = location.id === currentLocationId;
                const isDestination = travel?.toId === location.id;
                const knowledgeStatus = knowledge[location.id] || 'unknown';
                return (
                  <button
                    key={location.id}
                    className={`location-node location-node--${knowledgeStatus} ${(state.guild.branches || []).some((branch) => branch.active !== false && branch.locationId === location.id) ? 'is-branch' : ''} ${selected.id === location.id ? 'is-selected' : ''} ${canReach ? 'is-unlocked' : 'is-locked'} ${isCurrent ? 'is-current' : ''} ${isDestination ? 'is-destination' : ''}`}
                    style={{ left: `${location.x}%`, top: `${location.y}%`, '--primal': PRIMALS[location.primal].color }}
                    onClick={() => setSelectedId(location.id)}
                    aria-label={beyond ? BEYOND_TEASER.title : knowledgeStatus === 'unknown' ? `Uncharted ${statusName(location.tier)} frontier` : `${location.name}, ${knowledgeStatus}`}
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
                    <strong>{canReach ? (knowledgeStatus === 'unknown' ? 'Uncharted' : location.name) : beyond ? 'Beyond' : statusName(location.tier)}</strong>
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
              {WILD_AREA_LIST.filter(knownArea).map((area) => {
                const view = getWildAreaView(state, area.id);
                return (
                  <button
                    key={area.id}
                    className={`location-node location-node--wild ${view.unlocked ? 'is-unlocked' : 'is-locked'} ${selectedWild?.id === area.id ? 'is-selected' : ''} ${view.here ? 'is-current' : ''}`}
                    style={{ left: `${areaSpot(area).x}%`, top: `${areaSpot(area).y}%`, '--primal': PRIMALS[area.primal]?.color }}
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
              {/* A marker for every contract you are working on: at its wild area, or its town (missions-in-world). */}
              {activeContracts(state).map((mission) => {
                const area = mission.site.place.kind === 'wild' ? WILD_AREAS[mission.site.place.id] : null;
                const spot = area?.map || LOCATION_BY_ID[mission.locationId];
                if (!spot) return null;
                return (
                  <span key={mission.id} className={`map-contract${mission.site.status === 'ready' ? ' is-ready' : ''}`} style={{ left: `${spot.x}%`, top: `${spot.y}%` }}>
                    <Icon name={mission.site.status === 'ready' ? 'check' : 'flag'} size={16} label={`Contract: ${mission.title}`} />
                    <span>{mission.title}</span>
                  </span>
                );
              })}
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
              <h2>{unlocked ? (selectedKnown ? selected.name : 'Uncharted') : selectedBeyond ? BEYOND_TEASER.title : `${statusName(selected.tier)} frontier`}</h2>
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
                  {travel ? 'On the road' : quote?.walk ? `Take ${quote.road.name}` : `Travel to ${selected.name}`}
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
                    <strong>
                      {locationTournament.name} · {locationTournament.circuit}
                    </strong>
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
                  {travel ? 'On the road' : quote?.walk ? `Take ${quote.road.name}` : `Travel (${quote.label})`}
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
              <Badge tone="purple">Needs {statusName(selected.tier)} status</Badge>
            </div>
          )}
        </aside>
        )}
      </div>

      <div className="location-mobile-list" aria-label="Destinations list" data-menu>
        {WILD_AREA_LIST.filter(knownArea).map((area) => (
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
        {LOCATIONS.filter((location) => known(location.id) && inSlice(location.id)).map((location) => {
          const beyond = !inSlice(location.id);
          const canReach = !beyond;
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
                <strong>{canReach ? (knowledgeStatus === 'unknown' ? 'Uncharted' : location.name) : beyond ? BEYOND_TEASER.title : `${statusName(location.tier)} frontier`}</strong>
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
      {PRIMALS[area.primal] ? (
        <p className="region-dossier__element">
          <PrimalBadge primal={area.primal} /> Foes here fight with {area.primal}: strong against {PRIMALS[area.primal].beats}, weak to {PRIMALS[area.primal].weakTo}.
        </p>
      ) : null}
      {view.danger ? (
        <p className="region-dossier__danger">
          <Icon name="skull" size={16} tone="plain" /> Bands here: level {view.danger[0] === view.danger[1] ? view.danger[0] : `${view.danger[0]}–${view.danger[1]}`}
        </p>
      ) : null}
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
