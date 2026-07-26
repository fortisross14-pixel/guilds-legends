import React, { useState } from 'react';
import { REGIONS, TIERS } from '../data/content.js';
import { Badge, Button, EmptyState, Panel, ProgressBar, RiskPips } from '../components/UI.jsx';

function tierIndex(name) {
  return Math.max(0, TIERS.findIndex((tier) => tier.id === name));
}

export default function WorldScreen({ state, navigate }) {
  const [selectedRegion, setSelectedRegion] = useState(REGIONS[0].id);
  const region = REGIONS.find((item) => item.id === selectedRegion) || REGIONS[0];
  const unlocked = state.guild.tierIndex >= tierIndex(region.unlock);
  const regionMissions = state.missions.filter((mission) => mission.region === region.id);
  const relatedSagas = state.sagas.filter((saga) => saga.tier === region.unlock || (region.id === 'Verdant Marches' && saga.id.includes('Blackwood')));

  return (
    <div className="screen screen--world">
      <header className="screen-heading">
        <div><span className="eyebrow">Rumor before certainty</span><h1>The Known World</h1><p>The map widens when the guild’s social scale changes. New routes bring greater rewards, obligations and enemies.</p></div>
        <div className="heading-metrics"><Badge tone="blue">{REGIONS.filter((item) => state.guild.tierIndex >= tierIndex(item.unlock)).length}/7 regions known</Badge></div>
      </header>

      <div className="world-mobile-summary"><span>Select a region to inspect its contracts and saga threads.</span><strong>{state.guild.tier} reach</strong></div>
      <div className="world-layout">
        <section className="world-map" aria-label="Fictional world region map">
          <div className="world-map__mist" />
          <svg viewBox="0 0 900 520" role="img" aria-label="Schematic map of the seven fictional macro-regions">
            <path className="map-route" d="M175 170 C290 105 390 120 465 205 S640 285 744 198" />
            <path className="map-route map-route--dim" d="M295 355 C410 280 550 335 665 420" />
            <path className="map-route map-route--dim" d="M465 205 C470 310 525 390 665 420" />
          </svg>
          {REGIONS.map((item, index) => {
            const positions = [
              [16, 26], [34, 58], [47, 27], [64, 63], [78, 34], [18, 72], [84, 76],
            ];
            const isUnlocked = state.guild.tierIndex >= tierIndex(item.unlock);
            return (
              <button
                key={item.id}
                className={`region-node ${selectedRegion === item.id ? 'is-selected' : ''} ${isUnlocked ? 'is-unlocked' : 'is-locked'}`}
                style={{ left: `${positions[index][0]}%`, top: `${positions[index][1]}%`, '--region': item.color }}
                onClick={() => setSelectedRegion(item.id)}
              >
                <span>{isUnlocked ? item.icon : '⌁'}</span>
                <strong>{isUnlocked ? item.id : 'Unknown frontier'}</strong>
                <small>{isUnlocked ? item.unlock : `Unlocks at ${item.unlock}`}</small>
                <em className="region-node__status">{isUnlocked ? `${state.missions.filter((mission) => mission.region === item.id).length} open contract${state.missions.filter((mission) => mission.region === item.id).length === 1 ? '' : 's'}` : 'Only rumors can reach the guild hall'}</em>
              </button>
            );
          })}
          <div className="map-legend"><span><i className="legend-dot is-known" />Known route</span><span><i className="legend-dot is-rumor" />Rumored route</span></div>
        </section>

        <aside className="region-dossier">
          <div className="region-dossier__banner" style={{ '--region': region.color }}><span>{unlocked ? region.icon : '⌁'}</span><div><small>{region.unlock} reach</small><h2>{unlocked ? region.id : 'Uncharted region'}</h2></div></div>
          {unlocked ? (
            <>
              <p className="region-dossier__identity">{region.identity}</p>
              <div className="dossier-row"><span>Gameplay emphasis</span><strong>{region.emphasis}</strong></div>
              <div className="dossier-row"><span>Open contracts</span><strong>{regionMissions.length}</strong></div>
              <div className="dossier-row"><span>Known saga threads</span><strong>{relatedSagas.filter((saga) => saga.discovered).length}</strong></div>
              {regionMissions.length ? <div className="region-missions">{regionMissions.slice(0, 3).map((mission) => <button key={mission.id} onClick={() => navigate('missions')}><div><strong>{mission.title}</strong><small>{mission.family} · {mission.reward} crowns</small></div><RiskPips risk={mission.risk} /></button>)}</div> : <p className="muted">No current petitions originate here. Time and politics will create new work.</p>}
              <Button variant="primary" onClick={() => navigate('missions')}>View contracts</Button>
            </>
          ) : (
            <div className="locked-dossier"><span>⌁</span><h3>The guild is not yet important enough</h3><p>{region.id} becomes reachable at {region.unlock} status. Rumors exist, but no reliable route or patron will risk the journey.</p><Badge tone="purple">Required: {region.unlock}</Badge></div>
          )}
        </aside>
      </div>

      <div className="dashboard-grid dashboard-grid--world">
        <Panel title="Adventure sagas" eyebrow="Overlapping history">
          <div className="saga-list">
            {state.sagas.map((saga) => (
              <article className={`saga-card ${saga.discovered ? '' : 'is-hidden'} ${saga.completed ? 'is-complete' : ''}`} key={saga.id}>
                <div className="saga-card__seal">{saga.completed ? '✓' : saga.discovered ? '✦' : '?'}</div>
                <div><div className="saga-card__title"><h3>{saga.discovered ? saga.id : 'Unwritten saga'}</h3><Badge tone={saga.completed ? 'green' : saga.discovered ? 'purple' : 'neutral'}>{saga.completed ? 'Concluded' : saga.discovered ? saga.tier : 'Unknown'}</Badge></div><p>{saga.discovered ? saga.description : 'The chronicle has not yet found the people, place or disaster that begins this story.'}</p>{saga.discovered ? <ProgressBar value={saga.progress} max={saga.stages} tone={saga.completed ? 'green' : 'purple'} compact /> : null}</div>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="The guilds beyond Dunmere" eyebrow="A living world" action={<Button size="sm" onClick={() => navigate('rankings')}>Full rankings</Button>}>
          <div className="rival-briefs">
            {[...state.rivals].sort((a, b) => b.fame - a.fame).slice(0, 5).map((rival) => (
              <article key={rival.id}>
                <i style={{ background: rival.color }} />
                <div><strong>{rival.name}</strong><small>{rival.archetype} · {TIERS[rival.tierIndex].id}</small><p>{rival.motto}</p></div>
                <span><b>{rival.fame}</b> fame</span>
              </article>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
