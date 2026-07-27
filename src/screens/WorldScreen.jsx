import React, { useMemo, useState } from 'react';
import { TIERS } from '../data/content.js';
import { LOCATIONS, LOCATION_BY_ID, PRIMALS, unlockedLocations } from '../data/world.js';
import { getTravelQuote } from '../game/engine.js';
import { Badge, Button, EmptyState, Panel, PrimalBadge, ProgressBar, RiskPips } from '../components/UI.jsx';

const TIER_ORDER = { Regional: 0, National: 1, Global: 2 };

export default function WorldScreen({ state, actions, navigate }) {
  const currentLocationId = state.world?.currentLocationId || 'dunmere';
  const [selectedId, setSelectedId] = useState(currentLocationId);
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
  const tierCounts = useMemo(() => Object.fromEntries(['Regional', 'National', 'Global'].map((tier) => [tier, LOCATIONS.filter((location) => location.tier === tier).length])), []);

  const startJourney = () => actions.travel(selected.id);

  return (
    <div className="screen screen--world">
      <header className="screen-heading">
        <div><span className="eyebrow">Where you stand determines what you can do</span><h1>The Living World</h1><p>Missions, tournaments and recruitment are local. Travel consumes gold and months, but lets the guild seek the classes and primals needed for a deliberate strategy.</p></div>
        <div className="heading-metrics"><Badge tone="blue">{knownLocations.length}/{LOCATIONS.length} destinations reachable</Badge><Badge tone="gold">{current.name}</Badge><PrimalBadge primal={current.primal} /></div>
      </header>

      {travel ? (
        <section className="travel-banner">
          <div className="travel-banner__route"><span>{LOCATION_BY_ID[travel.fromId]?.icon}</span><i>···➜</i><span>{LOCATION_BY_ID[travel.toId]?.icon}</span></div>
          <div><span className="eyebrow">The guild is on the road</span><h2>{LOCATION_BY_ID[travel.fromId]?.name} to {LOCATION_BY_ID[travel.toId]?.name}</h2><p>Recruitment, new deployments and tournament registration are suspended until arrival.</p></div>
          <div className="travel-banner__time"><strong>{travel.monthsRemaining}</strong><span>month{travel.monthsRemaining === 1 ? '' : 's'} remaining</span><ProgressBar value={travel.totalMonths - travel.monthsRemaining} max={travel.totalMonths} tone="blue" compact /></div>
        </section>
      ) : null}

      <div className="world-layout world-layout--locations">
        <section className="world-map world-map--locations" aria-label="Fictional world travel map">
          <div className="world-map__mist" />
          <svg viewBox="0 0 100 90" preserveAspectRatio="none" role="img" aria-label="Travel routes between fictional settlements">
            <path className="map-route" d="M18 48 L31 28 L40 56 L27 70 L53 72 L66 62 L55 42 L44 24 L72 36 L70 16 L58 4" />
            <path className="map-route map-route--dim" d="M53 72 L62 82 L83 72 L88 52 L80 48 L91 28 L96 12" />
            <path className="map-route map-route--dim" d="M44 24 L51 10 L58 4 M72 36 L80 48 L88 52" />
          </svg>
          {LOCATIONS.map((location) => {
            const canReach = TIER_ORDER[location.tier] <= state.guild.tierIndex;
            const isCurrent = location.id === currentLocationId;
            const isDestination = travel?.toId === location.id;
            return (
              <button
                key={location.id}
                className={`location-node ${selected.id === location.id ? 'is-selected' : ''} ${canReach ? 'is-unlocked' : 'is-locked'} ${isCurrent ? 'is-current' : ''} ${isDestination ? 'is-destination' : ''}`}
                style={{ left: `${location.x}%`, top: `${location.y}%`, '--primal': PRIMALS[location.primal].color }}
                onClick={() => setSelectedId(location.id)}
                aria-label={`${location.name}, ${location.tier}, ${location.primal}`}
              >
                <span>{canReach ? location.icon : '⌁'}</span>
                <strong>{canReach ? location.name : location.tier}</strong>
                <small>{isCurrent ? 'Guild here' : canReach ? location.primal : 'Locked'}</small>
              </button>
            );
          })}
          <div className="map-legend"><span><i className="legend-dot is-known" />Reachable</span><span><i className="legend-dot is-rumor" />Future frontier</span><span><i className="legend-dot is-current" />Guild position</span></div>
        </section>

        <aside className="region-dossier region-dossier--location" style={{ '--primal': PRIMALS[selected.primal].color }}>
          <div className="region-dossier__banner"><span>{unlocked ? selected.icon : '⌁'}</span><div><small>{selected.tier} destination · {selected.region}</small><h2>{unlocked ? selected.name : 'Unreachable frontier'}</h2></div></div>
          {unlocked ? (
            <>
              <div className="location-affinity"><PrimalBadge primal={selected.primal} /><p>{PRIMALS[selected.primal].temperament}. Strong against <b>{PRIMALS[selected.primal].beats}</b>; vulnerable to <b>{PRIMALS[selected.primal].weakTo}</b>.</p></div>
              <p className="region-dossier__identity">{selected.description}</p>
              <div className="location-economy-grid"><div><span>Open missions</span><strong>{locationMissions.length}</strong></div><div><span>Known recruits</span><strong>{locationCandidates.length}</strong></div><div><span>Local classes</span><strong>{selected.specialties.length}</strong></div><div><span>Tournament</span><strong>{locationTournament?.division || 'None'}</strong></div></div>
              <div className="dossier-row"><span>Recruitment specialties</span><strong>{selected.specialties.join(' · ')}</strong></div>
              <div className="dossier-row"><span>Visited</span><strong>{visited.has(selected.id) ? 'Yes' : 'Not yet'}</strong></div>

              {selected.id !== currentLocationId ? (
                <div className="travel-quote">
                  <div><span>Journey</span><strong>{quote.months} month{quote.months === 1 ? '' : 's'}</strong></div><div><span>Travel budget</span><strong>{quote.cost} crowns</strong></div>
                  <Button variant="primary" size="lg" onClick={startJourney} disabled={Boolean(travel) || state.guild.crowns < quote.cost || state.activeMissions.length > 0}>{travel ? 'Already traveling' : state.activeMissions.length ? 'Recall deployed companies first' : state.guild.crowns < quote.cost ? `Need ${quote.cost - state.guild.crowns} more crowns` : `Travel to ${selected.name}`}</Button>
                </div>
              ) : (
                <div className="current-location-actions"><Badge tone="green">Current headquarters</Badge><Button variant="primary" onClick={() => navigate('missions')}>Open local contracts</Button><Button onClick={() => navigate('heroes')}>Open hiring market</Button></div>
              )}

              {locationMissions.length ? <div className="region-missions">{locationMissions.slice(0, 3).map((mission) => <button key={mission.id} onClick={() => selected.id === currentLocationId ? navigate('missions') : null}><div><strong>{mission.title}</strong><small>{mission.family} · {mission.enemyPrimal} threat · {mission.reward} crowns</small></div><RiskPips risk={mission.risk} /></button>)}</div> : <p className="muted">No current petitions are known here. New work appears as months pass.</p>}
            </>
          ) : (
            <div className="locked-dossier"><span>⌁</span><h3>{selected.tier} reach required</h3><p>The guild can hear stories about {selected.name}, but has neither the route, patronage nor reputation needed to move its operation there.</p><Badge tone="purple">Earn {selected.tier} status</Badge></div>
          )}
        </aside>
      </div>

      <div className="location-mobile-list" aria-label="Destinations list">
        {LOCATIONS.map((location) => {
          const canReach = TIER_ORDER[location.tier] <= state.guild.tierIndex;
          return <button key={location.id} className={`${selected.id === location.id ? 'is-selected' : ''} ${location.id === currentLocationId ? 'is-current' : ''}`} onClick={() => setSelectedId(location.id)}><span style={{ '--primal': PRIMALS[location.primal].color }}>{canReach ? location.icon : '⌁'}</span><div><strong>{canReach ? location.name : `${location.tier} frontier`}</strong><small>{canReach ? `${location.primal} · ${state.missions.filter((mission) => mission.locationId === location.id).length} missions` : `Unlock at ${location.tier}`}</small></div>{location.id === currentLocationId ? <Badge tone="green">Here</Badge> : null}</button>;
        })}
      </div>

      <div className="dashboard-grid dashboard-grid--world">
        <Panel title="Primal strategy" eyebrow="Combat and culture">
          <div className="primal-wheel-list">{Object.values(PRIMALS).map((primal) => <article key={primal.id} style={{ '--primal': primal.color }}><PrimalBadge primal={primal.id} /><span>defeats <b>{primal.beats}</b></span><span>falls to <b>{primal.weakTo}</b></span></article>)}</div>
          <p className="muted">A Fire settlement supplies Fire recruits and Fire patrons—but many local enemies are also Fire. Travel to Water territory for combat counters, or recruit locally for diplomatic affinity.</p>
        </Panel>

        <Panel title="Reach of the banner" eyebrow="Regional → National → Global">
          <div className="reach-ladder">{TIERS.map((tier, index) => <article key={tier.id} className={state.guild.tierIndex >= index ? 'is-reached' : ''}><span>{state.guild.tierIndex > index ? '✓' : state.guild.tierIndex === index ? '◆' : '○'}</span><div><strong>{tier.id}</strong><small>{tierCounts[tier.id]} destinations · {tier.scope}</small></div></article>)}</div>
          <p className="muted">Promotion increases the number of settlements, markets, missions and tournament circuits that can be reached. It does not teleport the guild: every journey still costs time.</p>
        </Panel>
      </div>

      <Panel title="The guilds beyond the road" eyebrow="A living competitive world" action={<Button size="sm" onClick={() => navigate('rankings')}>Full rankings</Button>}>
        {state.rivals.length ? <div className="rival-briefs">{[...state.rivals].sort((a, b) => b.fame - a.fame).slice(0, 6).map((rival) => <article key={rival.id}><i style={{ background: rival.color }} /><div><strong>{rival.name}</strong><small>{rival.archetype} · {TIERS[rival.tierIndex]?.id}</small><p>{rival.motto}</p></div><span><b>{rival.fame}</b> fame</span></article>)}</div> : <EmptyState icon="◇" title="No rivals recorded" text="The competitive chronicle has not initialized." />}
      </Panel>
    </div>
  );
}
