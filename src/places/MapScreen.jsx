import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { TIERS } from '../data/content.js';
import { BUILDINGS, LOCATIONS, LOCATION_BY_ID, PRIMALS, locationBuildings, unlockedLocations } from '../data/world.js';
import { getStoryView, getTravelQuote } from '../game/engine.js';
import { BLACKWOOD_MAP } from '../data/story.js';
import { Badge, Button, EmptyState, Panel, PrimalBadge, ProgressBar, RiskPips, artUrl } from '../components/UI.jsx';
import PixelIcon from '../components/PixelIcon.jsx';

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
  const [selectedId, setSelectedId] = useState(pinId || currentLocationId);
  const selected = LOCATION_BY_ID[selectedId] || LOCATION_BY_ID[currentLocationId];
  const knownLocations = unlockedLocations(state.guild.tierIndex);
  const unlocked = TIER_ORDER[selected.tier] <= state.guild.tierIndex;
  const quote = getTravelQuote(state, selected.id);
  const current = LOCATION_BY_ID[currentLocationId];
  const travel = state.world?.activeTravel;
  const visited = new Set(state.world?.visitedLocationIds || [currentLocationId]);
  const locationMissions = state.missions.filter((mission) => mission.locationId === selected.id);
  const locationCandidates = state.candidates.filter((candidate) => candidate.locationId === selected.id);
  const locationTournament = state.tournaments?.find((tournament) => tournament.locationId === selected.id);
  const selectedBranch = (state.guild.branches || []).find((branch) => branch.active !== false && branch.locationId === selected.id);
  const tierCounts = useMemo(
    () => Object.fromEntries(['Regional', 'National', 'Global'].map((tier) => [tier, LOCATIONS.filter((location) => location.tier === tier).length])),
    [],
  );

  const startJourney = () => actions.travel(selected.id);

  return (
    <div className="screen screen--world">
      <header className="map-header">
        <h1>The Living World</h1>
        <span
          className="help-tip"
          tabIndex={0}
          title="Missions, tournaments and recruitment are local. Travel costs gold and weeks, but lets the guild seek the classes and primals it needs."
        >
          ?
        </span>
        <Badge tone="blue">
          {knownLocations.length}/{LOCATIONS.length} reachable
        </Badge>
        <Badge tone="gold">{current.name}</Badge>
        <PrimalBadge primal={current.primal} />
      </header>

      {travel ? (
        <section className="travel-banner">
          <div className="travel-banner__route">
            <span>{LOCATION_BY_ID[travel.fromId]?.icon}</span>
            <i>···➜</i>
            <span>{LOCATION_BY_ID[travel.toId]?.icon}</span>
          </div>
          <div>
            <span className="eyebrow">The guild is on the road</span>
            <h2>
              {LOCATION_BY_ID[travel.fromId]?.name} to {LOCATION_BY_ID[travel.toId]?.name}
            </h2>
            <p>The journey was interrupted. Deal with what happened, then continue. Recruitment and new deployments resume on arrival.</p>
          </div>
          <div className="travel-banner__time">
            <strong>{travel.weeksRemaining}</strong>
            <span>week{travel.weeksRemaining === 1 ? '' : 's'} remaining</span>
            <ProgressBar value={travel.totalWeeks - travel.weeksRemaining} max={travel.totalWeeks} tone="blue" compact />
            {!state.pendingRoadEvent ? (
              <Button variant="primary" size="sm" onClick={actions.continueJourney}>
                Continue journey
              </Button>
            ) : null}
          </div>
        </section>
      ) : null}

      <div className="world-layout world-layout--locations">
        {createPortal(
          <section className="world-map world-map--locations" aria-label="Fictional world travel map">
            <div className="world-map__plane">
              <div className="world-map__terrain" style={{ '--overworld': `url(${artUrl('ui/overworld.png')})` }} />
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
                    left: `${LOCATION_BY_ID[travel.fromId].x + (LOCATION_BY_ID[travel.toId].x - LOCATION_BY_ID[travel.fromId].x) * ((travel.totalWeeks - travel.weeksRemaining) / travel.totalWeeks)}%`,
                    top: `${LOCATION_BY_ID[travel.fromId].y + (LOCATION_BY_ID[travel.toId].y - LOCATION_BY_ID[travel.fromId].y) * ((travel.totalWeeks - travel.weeksRemaining) / travel.totalWeeks)}%`,
                  }}
                >
                  <PixelIcon name="flag" size={24} />
                </span>
              ) : null}
              {LOCATIONS.map((location) => {
                const canReach = TIER_ORDER[location.tier] <= state.guild.tierIndex;
                const isCurrent = location.id === currentLocationId;
                const isDestination = travel?.toId === location.id;
                return (
                  <button
                    key={location.id}
                    className={`location-node ${(state.guild.branches || []).some((branch) => branch.active !== false && branch.locationId === location.id) ? 'is-branch' : ''} ${selected.id === location.id ? 'is-selected' : ''} ${canReach ? 'is-unlocked' : 'is-locked'} ${isCurrent ? 'is-current' : ''} ${isDestination ? 'is-destination' : ''}`}
                    style={{ left: `${location.x}%`, top: `${location.y}%`, '--primal': PRIMALS[location.primal].color }}
                    onClick={() => setSelectedId(location.id)}
                    aria-label={`${location.name}, ${location.tier}, ${location.primal}`}
                  >
                    {isCurrent && !travel ? (
                      <em className="location-node__here">
                        <span>You are here</span>
                        <PixelIcon name="pointer" size={12} />
                      </em>
                    ) : null}
                    <span className="location-node__icon">
                      <PixelIcon name={canReach ? (isCurrent ? 'castle' : 'town') : 'lock'} size={24} />
                    </span>
                    <strong>{canReach ? location.name : location.tier}</strong>
                    <small>
                      {isCurrent
                        ? 'HQ here'
                        : (state.guild.branches || []).some((branch) => branch.active !== false && branch.locationId === location.id)
                          ? 'Branch'
                          : canReach
                            ? location.primal
                            : 'Locked'}
                    </small>
                  </button>
                );
              })}
              {state.missions
                .filter((mission) => mission.bossId && LOCATION_BY_ID[mission.locationId])
                .map((mission) => (
                  <span
                    key={mission.id}
                    className="map-boss"
                    style={{ left: `${LOCATION_BY_ID[mission.locationId].x}%`, top: `${LOCATION_BY_ID[mission.locationId].y}%` }}
                    title={mission.title}
                  >
                    <PixelIcon name="skull" size={24} label={`Boss: ${mission.title}`} />
                  </span>
                ))}
              {getStoryView(state).blackwoodOpen ? (
                <span
                  className="map-blackwood"
                  style={{ left: `${BLACKWOOD_MAP.x}%`, top: `${BLACKWOOD_MAP.y}%` }}
                  title="The Blackwood (reach it through the Dunmere contract)"
                >
                  <PixelIcon name="tree" size={24} /> {BLACKWOOD_MAP.name}
                </span>
              ) : null}
              {pinId && LOCATION_BY_ID[pinId] ? (
                <span className="map-pin" style={{ left: `${LOCATION_BY_ID[pinId].x}%`, top: `${LOCATION_BY_ID[pinId].y}%` }} title="Contract location">
                  <PixelIcon name="pin" size={24} label="Contract location" />
                </span>
              ) : null}
            </div>
            <div className="world-map__fog" aria-hidden="true" />
            <div className="map-legend">
              <span>
                <i className="legend-dot is-known" />
                Reachable
              </span>
              <span>
                <i className="legend-dot is-rumor" />
                Future frontier
              </span>
              <span>
                <i className="legend-dot is-current" />
                Guild position
              </span>
            </div>
          </section>,
          document.body,
        )}

        <aside className="region-dossier region-dossier--location" style={{ '--primal': PRIMALS[selected.primal].color }}>
          <div className="region-dossier__banner">
            <span>
              <PixelIcon name={unlocked ? (selected.id === currentLocationId ? 'castle' : 'town') : 'lock'} size={24} />
            </span>
            <div>
              <small>
                {selected.tier} destination · {selected.region}
              </small>
              <h2>{unlocked ? selected.name : 'Unreachable frontier'}</h2>
            </div>
          </div>
          {unlocked ? (
            <>
              <div className="location-affinity">
                <PrimalBadge primal={selected.primal} />
                <p>
                  {PRIMALS[selected.primal].temperament}. Strong against <b>{PRIMALS[selected.primal].beats}</b>; vulnerable to{' '}
                  <b>{PRIMALS[selected.primal].weakTo}</b>.
                </p>
              </div>
              <p className="region-dossier__identity">{selected.description}</p>
              <div className="location-economy-grid">
                <div>
                  <span>Open missions</span>
                  <strong>{locationMissions.length}</strong>
                </div>
                <div>
                  <span>Known recruits</span>
                  <strong>{locationCandidates.length}</strong>
                </div>
                <div>
                  <span>Local classes</span>
                  <strong>{selected.specialties.length}</strong>
                </div>
                <div>
                  <span>Tournament</span>
                  <strong>{locationTournament?.division || 'None'}</strong>
                </div>
              </div>
              <div className="dossier-row">
                <span>Recruitment specialties</span>
                <strong>{selected.specialties.join(' · ')}</strong>
              </div>
              <div className="dossier-row">
                <span>Visited</span>
                <strong>{visited.has(selected.id) ? 'Yes' : 'Not yet'}</strong>
              </div>
              <div className="dossier-row location-buildings">
                <span>Buildings</span>
                <strong>
                  {locationBuildings(selected.id)
                    .filter((id) => id !== 'guildHall')
                    .map((id) => BUILDINGS[id].name)
                    .join(' · ')}
                </strong>
              </div>

              {selectedBranch ? (
                <div className="current-location-actions">
                  <Badge tone="purple">Permanent branch · Level {selectedBranch.level}</Badge>
                  <Button variant="primary" onClick={() => navigate('missions')}>
                    Open branch contracts
                  </Button>
                  <Button onClick={() => navigate('heroes')}>Open branch market</Button>
                  <Button onClick={() => navigate('legacy')}>Manage branch</Button>
                </div>
              ) : selected.id !== currentLocationId ? (
                <div className="travel-quote">
                  <div>
                    <span>Journey</span>
                    <strong>
                      {quote.weeks} week{quote.weeks === 1 ? '' : 's'}
                    </strong>
                  </div>
                  <div>
                    <span>Travel budget</span>
                    <strong>{quote.cost} crowns</strong>
                  </div>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={startJourney}
                    disabled={Boolean(travel) || state.guild.crowns < quote.cost || (state.activeMissions.length > 0 && state.guild.tierIndex === 0)}
                  >
                    {travel
                      ? 'Already traveling'
                      : state.activeMissions.length > 0 && state.guild.tierIndex === 0
                        ? 'Recall deployed companies first'
                        : state.guild.crowns < quote.cost
                          ? `Need ${quote.cost - state.guild.crowns} more crowns`
                          : `Travel to ${selected.name}`}
                  </Button>
                </div>
              ) : (
                <div className="current-location-actions">
                  <Badge tone="green">You are here</Badge>
                  <Button variant="primary" size="lg" onClick={() => navigate('town')}>
                    Enter {selected.name}
                  </Button>
                  {state.guild.tierIndex >= 1 ? <Button onClick={() => navigate('legacy')}>Manage branches</Button> : null}
                </div>
              )}

              {locationMissions.length ? (
                <div className="region-missions">
                  {locationMissions.slice(0, 3).map((mission) => (
                    <button key={mission.id} onClick={() => (selected.id === currentLocationId ? navigate('missions') : null)}>
                      <div>
                        <strong>{mission.title}</strong>
                        <small>
                          {mission.family} · {mission.enemyPrimal} threat · {mission.reward} crowns
                        </small>
                      </div>
                      <RiskPips risk={mission.risk} />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="muted">No current petitions are known here. New work appears as weeks pass.</p>
              )}
            </>
          ) : (
            <div className="locked-dossier">
              <span>⌁</span>
              <h3>{selected.tier} reach required</h3>
              <p>The guild can hear stories about {selected.name}, but has neither the route, patronage nor reputation needed to move its operation there.</p>
              <Badge tone="purple">Earn {selected.tier} status</Badge>
            </div>
          )}
        </aside>
      </div>

      <div className="location-mobile-list" aria-label="Destinations list" data-menu>
        {LOCATIONS.map((location) => {
          const canReach = TIER_ORDER[location.tier] <= state.guild.tierIndex;
          return (
            <button
              key={location.id}
              className={`${selected.id === location.id ? 'is-selected' : ''} ${location.id === currentLocationId ? 'is-current' : ''}`}
              onClick={() => setSelectedId(location.id)}
            >
              <span style={{ '--primal': PRIMALS[location.primal].color }}>
                <PixelIcon name={canReach ? (location.id === currentLocationId ? 'castle' : 'town') : 'lock'} size={12} />
              </span>
              <div>
                <strong>{canReach ? location.name : `${location.tier} frontier`}</strong>
                <small>
                  {canReach
                    ? `${location.primal} · ${state.missions.filter((mission) => mission.locationId === location.id).length} missions`
                    : `Unlock at ${location.tier}`}
                </small>
              </div>
              {location.id === currentLocationId ? <Badge tone="green">Here</Badge> : null}
            </button>
          );
        })}
      </div>

      <div className="world-spacer" aria-hidden="true" />
      <div className="dashboard-grid dashboard-grid--world">
        <Panel title="Primal strategy" eyebrow="Combat and culture">
          <div className="primal-wheel-list">
            {Object.values(PRIMALS).map((primal) => (
              <article key={primal.id} style={{ '--primal': primal.color }}>
                <PrimalBadge primal={primal.id} />
                <span>
                  defeats <b>{primal.beats}</b>
                </span>
                <span>
                  falls to <b>{primal.weakTo}</b>
                </span>
              </article>
            ))}
          </div>
          <p className="muted">
            A Fire settlement supplies Fire recruits and Fire patrons—but many local enemies are also Fire. Travel to Water territory for combat counters, or
            recruit locally for diplomatic affinity.
          </p>
        </Panel>

        <Panel title="Reach of the banner" eyebrow="Regional → National → Global">
          <div className="reach-ladder">
            {TIERS.map((tier, index) => (
              <article key={tier.id} className={state.guild.tierIndex >= index ? 'is-reached' : ''}>
                <span>{state.guild.tierIndex > index ? '✓' : state.guild.tierIndex === index ? '◆' : '○'}</span>
                <div>
                  <strong>{tier.id}</strong>
                  <small>
                    {tierCounts[tier.id]} destinations · {tier.scope}
                  </small>
                </div>
              </article>
            ))}
          </div>
          <p className="muted">
            Promotion increases the number of settlements, markets, missions and tournament circuits that can be reached. It does not teleport the guild: every
            journey still costs time.
          </p>
        </Panel>
      </div>

      <Panel
        title="The guilds beyond the road"
        eyebrow="A living competitive world"
        action={
          <Button size="sm" onClick={() => navigate('rankings')}>
            Full rankings
          </Button>
        }
      >
        {state.rivals.length ? (
          <div className="rival-briefs">
            {[...state.rivals]
              .sort((a, b) => b.fame - a.fame)
              .slice(0, 6)
              .map((rival) => (
                <article key={rival.id}>
                  <i style={{ background: rival.color }} />
                  <div>
                    <strong>{rival.name}</strong>
                    <small>
                      {rival.archetype} · {TIERS[rival.tierIndex]?.id}
                    </small>
                    <p>{rival.motto}</p>
                  </div>
                  <span>
                    <b>{rival.fame}</b> fame
                  </span>
                </article>
              ))}
          </div>
        ) : (
          <EmptyState icon="◇" title="No rivals recorded" text="The competitive chronicle has not initialized." />
        )}
      </Panel>
    </div>
  );
}
