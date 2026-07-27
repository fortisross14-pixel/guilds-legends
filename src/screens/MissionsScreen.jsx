import React, { useEffect, useMemo, useState } from 'react';
import { FORMATION_TYPES, formationForMission } from '../data/formations.js';
import { LOCATION_BY_ID, PRIMALS } from '../data/world.js';
import { partyCapacity, partyEstimate, roleRating } from '../game/engine.js';
import { Badge, Button, EmptyState, HeroPortrait, LevelBadge, Panel, PrimalBadge, ProgressBar, RarityBadge, RiskPips } from '../components/UI.jsx';

function buildBestFormation(state, formationType) {
  const formation = FORMATION_TYPES[formationType];
  const available = state.heroes.filter((hero) => hero.status === 'available');
  const used = new Set();
  return formation.slots.map((slot) => {
    const candidates = available.filter((hero) => !used.has(hero.id)).sort((a, b) => roleRating(b, slot.role) - roleRating(a, slot.role));
    const hero = candidates[0];
    if (!hero || (!slot.required && roleRating(hero, slot.role) < 42)) return null;
    used.add(hero.id);
    return { slotId: slot.id, role: slot.role, heroId: hero.id };
  }).filter(Boolean);
}

export default function MissionsScreen({ state, actions, navigate }) {
  const currentLocationId = state.world?.currentLocationId || 'dunmere';
  const currentLocation = LOCATION_BY_ID[currentLocationId];
  const localMissions = useMemo(() => state.missions.filter((mission) => mission.locationId === currentLocationId), [state.missions, currentLocationId]);
  const [selectedId, setSelectedId] = useState(localMissions[0]?.id || null);
  const [formationType, setFormationType] = useState('Combat');
  const [assignments, setAssignments] = useState([]);
  const [family, setFamily] = useState('All');
  const [showDetails, setShowDetails] = useState(true);

  const filtered = useMemo(() => localMissions.filter((mission) => family === 'All' || mission.family === family), [localMissions, family]);
  const selected = filtered.find((mission) => mission.id === selectedId) || filtered[0] || null;
  const recommended = selected ? formationForMission(selected) : 'Combat';
  const formation = FORMATION_TYPES[formationType];
  const estimate = selected ? partyEstimate(state, selected.id, formationType, assignments) : null;
  const fieldCapacity = partyCapacity(state);
  const atFieldCapacity = state.activeMissions.length >= fieldCapacity;
  const families = ['All', ...new Set(localMissions.map((mission) => mission.family))];
  const availableHeroes = state.heroes.filter((hero) => hero.status === 'available');
  const traveling = Boolean(state.world?.activeTravel);

  useEffect(() => {
    if (selected && selected.id !== selectedId) setSelectedId(selected.id);
  }, [selected, selectedId]);

  useEffect(() => {
    if (!selected) return;
    const type = formationForMission(selected);
    setFormationType(type);
    const saved = (state.guild.formations?.[type] || []).filter((assignment) => availableHeroes.some((hero) => hero.id === assignment.heroId));
    setAssignments(saved);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const selectMission = (mission) => {
    setSelectedId(mission.id);
    setShowDetails(true);
    actions.inspectMission(mission.id);
  };

  const changeFormation = (type) => {
    setFormationType(type);
    const availableIds = new Set(availableHeroes.map((hero) => hero.id));
    setAssignments((state.guild.formations?.[type] || []).filter((assignment) => availableIds.has(assignment.heroId)));
  };

  const assignSlot = (slot, heroId) => {
    setAssignments((current) => {
      const withoutSlotOrHero = current.filter((assignment) => assignment.slotId !== slot.id && assignment.heroId !== heroId);
      const next = heroId ? [...withoutSlotOrHero, { slotId: slot.id, role: slot.role, heroId }] : withoutSlotOrHero;
      if (selected) actions.notePartySelection(selected.id, formationType, next);
      return next;
    });
  };

  const autoBuild = () => {
    const next = buildBestFormation(state, formationType);
    setAssignments(next);
    if (selected) actions.notePartySelection(selected.id, formationType, next);
  };

  const launch = () => selected && actions.launchMission(selected.id, formationType, assignments);
  const primalTarget = selected ? (formationType === 'Diplomacy' ? selected.patronPrimal : selected.enemyPrimal) : null;

  return (
    <div className="screen screen--missions">
      <header className="screen-heading">
        <div><span className="eyebrow">Local contracts · specialist arrangements</span><h1>{currentLocation?.name} Contract Board</h1><p>Only petitions from the settlement where the guild currently operates can be accepted. Choose an arrangement, then place every hero in a role where class, level and primal actually matter.</p></div>
        <div className="heading-metrics"><Badge tone="gold">{localMissions.length} local contracts</Badge><Badge tone={atFieldCapacity ? 'red' : 'blue'}>{state.activeMissions.length}/{fieldCapacity} companies deployed</Badge><PrimalBadge primal={currentLocation?.primal} /></div>
      </header>

      {traveling ? <div className="travel-lock"><span>➜</span><div><strong>The guild is traveling</strong><p>New companies cannot depart until the guild reaches {LOCATION_BY_ID[state.world.activeTravel.toId]?.name}.</p></div><Button onClick={() => navigate('world')}>View journey</Button></div> : null}

      <div className="filter-bar">
        <label>Mission family<select value={family} onChange={(event) => setFamily(event.target.value)}>{families.map((item) => <option key={item}>{item}</option>)}</select></label>
        <span className="filter-bar__hint"><b>{currentLocation?.primal} territory:</b> local patrons prefer {currentLocation?.primal} delegates, while combat enemies frequently share the local primal. Travel to recruit counters before returning for dangerous hunts.</span>
        <Button size="sm" onClick={() => navigate('world')}>Change region</Button>
      </div>

      <div className="mission-layout">
        <div className="mission-board">
          {filtered.map((mission) => {
            const approach = formationForMission(mission);
            const enemyInfo = PRIMALS[mission.enemyPrimal];
            return (
              <button key={mission.id} className={`mission-card ${selected?.id === mission.id ? 'is-selected' : ''}`} onClick={() => selectMission(mission)}>
                <div className="mission-card__art" style={{ '--region-color': enemyInfo?.color || '#777' }}><span>{FORMATION_TYPES[approach].icon}</span><small>{mission.locationName}</small><PrimalBadge primal={mission.enemyPrimal} compact /></div>
                <div className="mission-card__body">
                  <div className="mission-card__top"><Badge tone={mission.family === 'Saga' || mission.family === 'Legend Quest' ? 'purple' : 'neutral'}>{mission.family}</Badge><Badge tone={FORMATION_TYPES[approach].color}>{approach}</Badge><RiskPips risk={mission.risk} /></div>
                  <h3>{mission.title}</h3><p>{mission.brief}</p>
                  <div className="mission-primal-preview"><span>Threat <PrimalBadge primal={mission.enemyPrimal} /></span><span>Patron <PrimalBadge primal={mission.patronPrimal} /></span></div>
                  <div className="mission-card__footer"><span>{mission.duration} month{mission.duration === 1 ? '' : 's'}</span><strong>{mission.reward} crowns</strong><span>+{mission.fame} fame</span></div>
                </div>
              </button>
            );
          })}
          {!filtered.length ? <EmptyState icon="⌖" title={traveling ? 'No board while traveling' : 'No local contracts match'} text={traveling ? 'Finish the journey before accepting new work.' : 'Change the family filter, advance time or travel to another settlement.'} action={<Button onClick={() => navigate('world')}>Open world map</Button>} /> : null}
        </div>

        <aside className="mission-planner">
          {selected ? (
            <>
              <div className="mission-planner__header">
                <span className="eyebrow">Issued by {selected.issuer} · {selected.locationName}</span><h2>{selected.title}</h2><p>{selected.stakes}</p>
                <div className="mission-targets"><span>Enemy or obstacle <PrimalBadge primal={selected.enemyPrimal} /></span><span>Patron culture <PrimalBadge primal={selected.patronPrimal} /></span></div>
                <button className="text-button" onClick={() => setShowDetails((value) => !value)}>{showDetails ? 'Hide intelligence' : 'Show full intelligence'}</button>
              </div>
              {showDetails ? <div className="intel-grid"><div><span>Difficulty</span><strong>{selected.difficulty}</strong></div><div><span>Duration</span><strong>{selected.duration}m</strong></div><div><span>Risk</span><strong>{selected.risk}/5</strong></div><div><span>Recommended</span><strong>{recommended}</strong></div></div> : null}

              <div className="formation-tabs" aria-label="Mission arrangement">
                {Object.values(FORMATION_TYPES).map((item) => <button key={item.id} className={formationType === item.id ? 'is-active' : ''} onClick={() => changeFormation(item.id)}><span>{item.icon}</span><strong>{item.id}</strong>{item.id === recommended ? <small>Recommended</small> : null}</button>)}
              </div>

              <div className={`formation-explainer formation-explainer--${formation.color}`}><div><span>{formation.icon}</span><strong>{formation.label}</strong></div><p>{formation.description}</p></div>
              <div className="primal-rule-callout" style={{ '--primal': PRIMALS[primalTarget]?.color }}><PrimalBadge primal={primalTarget} /><p>{formationType === 'Diplomacy' ? `Matching the ${selected.patronPrimal} patron increases trust. Opposing elemental force is less persuasive than cultural fluency.` : `${selected.enemyPrimal} opposition: ${PRIMALS[selected.enemyPrimal]?.weakTo} heroes have an advantage; ${PRIMALS[selected.enemyPrimal]?.beats} heroes are vulnerable.`}</p></div>

              <div className="formation-toolbar"><Button size="sm" onClick={autoBuild}>Build best available</Button><Button size="sm" onClick={() => actions.saveFormation(formationType, assignments)} disabled={!assignments.length}>Save as default</Button><span>{assignments.length}/5 filled</span></div>

              <div className="formation-slots">
                {formation.slots.map((slot) => {
                  const assignment = assignments.find((item) => item.slotId === slot.id);
                  const hero = assignment ? state.heroes.find((item) => item.id === assignment.heroId) : null;
                  return (
                    <article className={`formation-slot ${slot.required ? 'is-required' : ''} ${hero ? 'is-filled' : ''}`} key={slot.id}>
                      <div className="formation-slot__label"><span>{slot.required ? 'Required' : 'Optional'}</span><strong>{slot.label}</strong><small>{slot.description}</small></div>
                      <label>Assigned hero<select value={hero?.id || ''} onChange={(event) => assignSlot(slot, event.target.value)}><option value="">— Empty —</option>{availableHeroes.map((candidate) => <option key={candidate.id} value={candidate.id} disabled={assignments.some((item) => item.heroId === candidate.id && item.slotId !== slot.id)}>{candidate.name} · Lv {candidate.level} {candidate.rarity} {candidate.primal} {candidate.classId} · role {roleRating(candidate, slot.role)}</option>)}</select></label>
                      {hero ? <div className="formation-slot__hero"><HeroPortrait hero={hero} size="xs" /><div><strong>{hero.name}</strong><small><LevelBadge hero={hero} /> <RarityBadge rarity={hero.rarity} /> <PrimalBadge primal={hero.primal} /></small></div><b>{roleRating(hero, slot.role)}</b></div> : null}
                    </article>
                  );
                })}
              </div>

              <div className={`estimate estimate--${estimate?.chance >= 65 ? 'good' : estimate?.chance >= 40 ? 'mixed' : 'bad'}`}>
                <div className="estimate__number"><span>Estimated success</span><strong>{estimate?.chance || 0}%</strong></div>
                <ProgressBar value={estimate?.chance || 0} max={100} tone={estimate?.chance >= 65 ? 'green' : estimate?.chance >= 40 ? 'gold' : 'red'} compact />
                <div className="estimate-primal-edge"><span>Primal contribution</span><strong className={estimate?.primalEdge > 0 ? 'is-positive' : estimate?.primalEdge < 0 ? 'is-negative' : ''}>{estimate?.primalEdge > 0 ? '+' : ''}{estimate?.primalEdge || 0}</strong></div>
                <div className="estimate__breakdown">{estimate?.breakdown.map((item) => <span key={item.slotId}><b>{item.slotLabel}</b>{item.heroName}<small>Lv {item.level} · {item.primal} {item.primalModifier >= 0 ? '+' : ''}{item.primalModifier}</small><strong>{item.rating}</strong></span>)}</div>
                {estimate?.warnings.length ? <ul className="warning-list">{estimate.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul> : <p className="estimate__note">Every required slot is covered by a credible specialist.</p>}
              </div>

              <div className="commit-bar">
                <div><span>Supplies</span><strong>{Math.max(20, Math.round((25 + selected.risk * 18 + selected.duration * 12 + (formationType === 'Expedition' ? 12 : 0)) * (state.guild.appointments?.Quartermaster ? 0.88 : 1)))} crowns</strong></div>
                <div><span>Potential reward</span><strong>{selected.reward} crowns · {selected.fame} fame</strong></div>
                <Button variant="primary" size="lg" onClick={launch} disabled={traveling || assignments.length < 2 || estimate?.missingSlots.length > 0 || atFieldCapacity}>{traveling ? 'Traveling' : atFieldCapacity ? 'All companies deployed' : `Send ${formationType} company`}</Button>
              </div>
            </>
          ) : <EmptyState icon="▤" title="Select a local contract" text="Choose a petition from the current settlement to begin planning." />}
        </aside>
      </div>

      <Panel title="Parties already beyond the gate" eyebrow="Active expeditions">
        {state.activeMissions.length ? <div className="deployed-grid">{state.activeMissions.map((mission) => (
          <article className="deployed-card" key={mission.id}><div className="deployed-card__top"><Badge tone="blue">{mission.locationName}</Badge><Badge tone="purple">{mission.formationType || mission.approach}</Badge><RiskPips risk={mission.risk} /></div><h3>{mission.title}</h3><p>{mission.assignments.map((assignment) => { const hero = state.heroes.find((item) => item.id === assignment.heroId); return hero ? `${hero.name} (${assignment.role})` : null; }).filter(Boolean).join(' · ')}</p><ProgressBar value={mission.duration - mission.remaining} max={mission.duration} label={mission.remaining <= 0 ? 'Decision waiting' : `${mission.remaining} month${mission.remaining === 1 ? '' : 's'} remaining`} tone={mission.remaining <= 0 ? 'gold' : 'blue'} /></article>
        ))}</div> : <EmptyState icon="◇" title="The road is quiet" text="No active expedition is consuming time or heroes." />}
      </Panel>
    </div>
  );
}
