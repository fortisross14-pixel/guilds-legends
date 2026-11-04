import React, { useEffect, useMemo, useState } from 'react';
import { normalizeClassId } from '../data/content.js';
import { FORMATION_TYPES, formationForMission } from '../data/formations.js';
import { LOCATION_BY_ID, PRIMALS } from '../data/world.js';
import { knownMissions, operationalLocationIds, partyCapacity, partyEstimate, roleRating } from '../game/engine.js';
import { Badge, Button, EmptyState, HeroPortrait, LevelBadge, Panel, PrimalBadge, ProgressBar, RarityBadge, RiskPips } from '../components/UI.jsx';
import SideJobsPanel from './SideJobsPanel.jsx';
import Icon, { FORMATION_ICONS } from '../components/Icon.jsx';
import { sliceHides } from '../data/slice.js';
import { PATRONS } from '../data/patrons.js';
import { getReputationSummary } from '../game/engine.js';

/** The identity loop in one line: what you take shapes what you are offered. */
function identityLine(state) {
  const top = [...getReputationSummary(state).families].sort((a, b) => b.points - a.points)[0];
  return top?.points ? `Known for ${top.family.toLowerCase()} work (${top.name}): boards lean that way, and patron contracts raise standing (turning them down lowers it).` : 'Patron contracts raise standing with their patron; turning them down lowers it.';
}

function buildBestFormation(state, formationType) {
  const formation = FORMATION_TYPES[formationType];
  const available = state.heroes.filter((hero) => hero.status === 'available');
  const used = new Set();
  return formation.slots
    .map((slot) => {
      const candidates = available.filter((hero) => !used.has(hero.id)).sort((a, b) => roleRating(b, slot.role) - roleRating(a, slot.role));
      const hero = candidates[0];
      if (!hero || (!slot.required && roleRating(hero, slot.role) < 42)) return null;
      used.add(hero.id);
      return { slotId: slot.id, role: slot.role, heroId: hero.id };
    })
    .filter(Boolean);
}

// Fills the formation with available main-party heroes (best role fit first).
function buildMainPartyFormation(state, formationType) {
  const party = (state.guild.mainParty || []).map((id) => state.heroes.find((hero) => hero.id === id)).filter((hero) => hero?.status === 'available');
  if (!party.length) return null;
  const used = new Set();
  return FORMATION_TYPES[formationType].slots
    .map((slot) => {
      const hero = party.filter((item) => !used.has(item.id)).sort((a, b) => roleRating(b, slot.role) - roleRating(a, slot.role))[0];
      if (!hero) return null;
      used.add(hero.id);
      return { slotId: slot.id, role: slot.role, heroId: hero.id };
    })
    .filter(Boolean);
}

function MainPartyNotice({ state }) {
  const members = (state.guild.mainParty || []).map((id) => state.heroes.find((hero) => hero.id === id)).filter(Boolean);
  if (!members.length) return <p className="main-party-notice muted">No main party set. Pick one in the Guild Hall War Room to pre-fill companies.</p>;
  const missing = members.filter((hero) => hero.status !== 'available');
  if (!missing.length) return <p className="main-party-notice">Pre-filled with your main party.</p>;
  const substitutes = state.heroes
    .filter((hero) => hero.status === 'available' && !state.guild.mainParty.includes(hero.id))
    .sort((a, b) => b.power - a.power)
    .slice(0, missing.length);
  return (
    <p className="main-party-notice main-party-notice--warning">
      Main party: {missing.map((hero) => `${hero.name} (${hero.status === 'injured' ? 'injured' : 'away'})`).join(', ')} unavailable.
      {substitutes.length ? ` Suggested substitute${substitutes.length > 1 ? 's' : ''}: ${substitutes.map((hero) => hero.name).join(', ')}.` : ''}
    </p>
  );
}

export default function MissionsScreen({ state, actions, navigate }) {
  const currentLocationId = state.world?.currentLocationId || 'dunmere';
  const operationalIds = [...operationalLocationIds(state)];
  const [operationLocationId, setOperationLocationId] = useState(currentLocationId);
  const activeLocationId = operationalIds.includes(operationLocationId) ? operationLocationId : currentLocationId;
  const currentLocation = LOCATION_BY_ID[activeLocationId];
  // Story contracts first.
  const localMissions = useMemo(
    () => knownMissions(state).filter((mission) => mission.locationId === activeLocationId).sort((a, b) => Number(Boolean(b.story)) - Number(Boolean(a.story))),
    [state.missions, activeLocationId],
  );
  // Contracts you know of in other towns: travel there to take them on.
  const elsewhere = knownMissions(state).filter((mission) => mission.locationId !== activeLocationId);
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
    setAssignments(buildMainPartyFormation(state, type) || saved);
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
    setAssignments(buildMainPartyFormation(state, type) || (state.guild.formations?.[type] || []).filter((assignment) => availableIds.has(assignment.heroId)));
  };

  const assignSlot = (slot, heroId) => {
    setAssignments((current) => {
      const withoutSlotOrHero = current.filter((assignment) => assignment.slotId !== slot.id && assignment.heroId !== heroId);
      const next = heroId ? [...withoutSlotOrHero, { slotId: slot.id, role: slot.role, heroId }] : withoutSlotOrHero;
      return next;
    });
  };

  // A hero dragged from the party bar onto a slot (App routes 'slot' drops here).
  useEffect(() => {
    const onDrop = (event) => {
      const { heroId, kind, id } = event.detail || {};
      if (kind !== 'slot') return;
      const slot = formation.slots.find((item) => item.id === id);
      const hero = state.heroes.find((item) => item.id === heroId);
      if (slot && hero?.status === 'available') assignSlot(slot, heroId);
    };
    window.addEventListener('gol:drop-hero', onDrop);
    return () => window.removeEventListener('gol:drop-hero', onDrop);
  });

  const autoBuild = () => {
    const next = buildBestFormation(state, formationType);
    setAssignments(next);
  };

  const launch = () => selected && actions.launchMission(selected.id, formationType, assignments);
  const primalTarget = selected ? (formationType === 'Diplomacy' ? selected.patronPrimal : selected.enemyPrimal) : null;

  return (
    <div className="screen screen--missions">
      <header className="screen-heading">
        <div>
          <span className="eyebrow">Operational contracts · specialist arrangements</span>
          <h1>{currentLocation?.name} Contract Board</h1>
          <p>
            {sliceHides('branches')
              ? `Pick a contract, then build the party that best fits its petition. ${identityLine(state)}`
              : 'Headquarters and permanent branches can each launch companies. Choose an operational settlement, then build the arrangement that best fits its petition.'}
          </p>
        </div>
        <div className="heading-metrics">
          <Badge tone="gold">{localMissions.length} local contracts</Badge>
          <Badge tone={atFieldCapacity ? 'red' : 'blue'}>
            {state.activeMissions.length}/{fieldCapacity} companies deployed
          </Badge>
          <PrimalBadge primal={currentLocation?.primal} />
        </div>
      </header>

      {traveling && activeLocationId === currentLocationId ? (
        <div className="travel-lock">
          <span><Icon name="next" size={14} tone="plain" /></span>
          <div>
            <strong>Headquarters is traveling</strong>
            <p>Permanent branches can still launch companies while the main hall moves toward {LOCATION_BY_ID[state.world.activeTravel.toId]?.name}.</p>
          </div>
          <Button onClick={() => navigate('world')}>View journey</Button>
        </div>
      ) : null}

      <div className="filter-bar">
        {operationalIds.length > 1 ? (
          <label>
            Operating hall
            <select
              value={activeLocationId}
              onChange={(event) => {
                setOperationLocationId(event.target.value);
                setSelectedId(null);
              }}
            >
              {operationalIds.map((id) => (
                <option key={id} value={id}>
                  {LOCATION_BY_ID[id]?.name}
                  {id === currentLocationId ? ' · HQ' : ' · Branch'}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label>
          Mission family
          <select value={family} onChange={(event) => setFamily(event.target.value)}>
            {families.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>


      <div className="mission-layout">
        <div className="mission-board" data-menu>
          {filtered.map((mission) => {
            const approach = formationForMission(mission);
            const enemyInfo = PRIMALS[mission.enemyPrimal];
            return (
              <button key={mission.id} className={`mission-card ${selected?.id === mission.id ? 'is-selected' : ''}`} onClick={() => selectMission(mission)}>
                <div className="mission-card__art" style={{ '--region-color': enemyInfo?.color || '#777' }}>
                  <span>
                    <Icon name={FORMATION_ICONS[approach] || 'swords'} size={24} />
                  </span>
                  <small>{mission.locationName}</small>
                  <PrimalBadge primal={mission.enemyPrimal} compact />
                </div>
                <div className="mission-card__body">
                  <div className="mission-card__top">
                    <Badge tone={mission.family === 'Saga' || mission.family === 'Legend Quest' ? 'purple' : 'neutral'}>{mission.family}</Badge>
                    <Badge tone={FORMATION_TYPES[approach].color}>{approach}</Badge>
                    {mission.patron ? (
                      <Badge tone={mission.exclusive ? 'gold' : 'blue'}>
                        {PATRONS[mission.patron]?.short}
                        {mission.exclusive ? ' · exclusive' : ''}
                      </Badge>
                    ) : null}
                    <RiskPips risk={mission.risk} />
                  </div>
                  <h3>{mission.title}</h3>
                  <p>{mission.brief}</p>
                  <div className="mission-primal-preview">
                    <span>
                      Threat <PrimalBadge primal={mission.enemyPrimal} />
                    </span>
                    <span>
                      Patron <PrimalBadge primal={mission.patronPrimal} />
                    </span>
                  </div>
                  <div className="mission-card__footer">
                    <span>
                      {mission.duration} week{mission.duration === 1 ? '' : 's'}
                    </span>
                    <strong>{mission.reward} gold</strong>
                    <span>+{mission.fame} fame</span>
                  </div>
                </div>
              </button>
            );
          })}
          {!filtered.length ? (
            <EmptyState
              icon="⌖"
              title={traveling ? 'No board while traveling' : 'No contracts here yet'}
              text={traveling ? 'Finish the journey before accepting new work.' : 'Talk to people in the tavern, the shop and the arena: when you take a job, it is pinned here.'}
            />
          ) : null}
          {elsewhere.length ? (
            <section className="board-elsewhere" aria-label="Contracts in other towns">
              <h2>In other towns</h2>
              {elsewhere.map((mission) => (
                <div key={mission.id} className="board-elsewhere__row">
                  <span>
                    <strong>{mission.title}</strong>
                    <small>
                      {mission.locationName} · {mission.accepted ? 'accepted' : 'open'} · {mission.reward} gold · risk {mission.risk}/5
                    </small>
                  </span>
                  <Button size="sm" onClick={() => navigate({ view: 'map', pin: mission.locationId })}>
                    Show on map
                  </Button>
                </div>
              ))}
            </section>
          ) : null}
        </div>

        <aside className="mission-planner">
          {selected ? (
            <>
              <div className="mission-planner__header">
                <span className="eyebrow">
                  Issued by {selected.issuer} · {selected.locationName}
                </span>
                <h2>{selected.title}</h2>
                <p>{selected.stakes}</p>
                <div className="mission-targets">
                  <span>
                    Enemy or obstacle <PrimalBadge primal={selected.enemyPrimal} />
                  </span>
                  <span>
                    Patron culture <PrimalBadge primal={selected.patronPrimal} />
                  </span>
                </div>
                <button className="text-button" onClick={() => setShowDetails((value) => !value)}>
                  {showDetails ? 'Hide intelligence' : 'Show full intelligence'}
                </button>
              </div>
              {showDetails ? (
                <div className="intel-grid">
                  <div>
                    <span>Difficulty</span>
                    <strong>{selected.difficulty}</strong>
                  </div>
                  <div>
                    <span>Duration</span>
                    <strong>{selected.duration}m</strong>
                  </div>
                  <div>
                    <span>Risk</span>
                    <strong>{selected.risk}/5</strong>
                  </div>
                  <div>
                    <span>Recommended</span>
                    <strong>{recommended}</strong>
                  </div>
                </div>
              ) : null}

              <div className="formation-tabs" aria-label="Mission arrangement">
                {Object.values(FORMATION_TYPES).map((item) => (
                  <button key={item.id} className={formationType === item.id ? 'is-active' : ''} onClick={() => changeFormation(item.id)}>
                    <span><Icon name={item.icon} size={18} /></span>
                    <strong>{item.id}</strong>
                    {item.id === recommended ? <small>Recommended</small> : null}
                  </button>
                ))}
              </div>

              <div className={`formation-explainer formation-explainer--${formation.color}`}>
                <div>
                  <span><Icon name={formation.icon} size={18} /></span>
                  <strong>{formation.label}</strong>
                </div>
                <p>{formation.description}</p>
              </div>
              {formationType === 'Combat' ? (
                <div className="tactical-combat-intro">
                  <strong>Turn-based engagement</strong>
                  <p>
                    When the company reaches hostile contact, time pauses for a turn-based battle. Give each hero a command and a target, watch the enemy tell,
                    use skills and items, or let auto-battle handle routine fights.
                  </p>
                </div>
              ) : null}
              {formationType === 'Diplomacy' ? (
                <div className="mission-game-intro mission-game-intro--diplomacy">
                  <strong>Playable negotiation</strong>
                  <p>
                    The mission pauses at the decisive meeting. Build Trust and Insight, move Agreement toward 100, decide when to present evidence or apply
                    pressure, and remember that concessions can secure peace while reducing the final reward.
                  </p>
                </div>
              ) : null}
              {formationType === 'Expedition' ? (
                <div className="mission-game-intro mission-game-intro--expedition">
                  <strong>Playable expedition</strong>
                  <p>
                    Choose the pace turn by turn. Survey routes, search for evidence, manage Supplies and Hazard, and verify important discoveries before
                    declaring an artifact or conclusion authentic.
                  </p>
                </div>
              ) : null}
              {formationType === 'Intrigue' ? (
                <div className="mission-game-intro mission-game-intro--intrigue">
                  <strong>Playable covert operation</strong>
                  <p>
                    Gather Intel, infiltrate without letting Heat spiral, create distractions and extract only after the objective is secure. A premature escape
                    attempt can expose the entire cell.
                  </p>
                </div>
              ) : null}
              <div className="primal-rule-callout" style={{ '--primal': PRIMALS[primalTarget]?.color }}>
                <PrimalBadge primal={primalTarget} />
                <p>
                  {formationType === 'Diplomacy'
                    ? `Matching the ${selected.patronPrimal} patron increases trust. Opposing elemental force is less persuasive than cultural fluency.`
                    : `${selected.enemyPrimal} opposition: ${PRIMALS[selected.enemyPrimal]?.weakTo} heroes have an advantage; ${PRIMALS[selected.enemyPrimal]?.beats} heroes are vulnerable.`}
                </p>
              </div>

              <MainPartyNotice state={state} />
              <div className="formation-toolbar">
                <Button
                  size="sm"
                  onClick={() => setAssignments(buildMainPartyFormation(state, formationType) || [])}
                  disabled={!(state.guild.mainParty || []).length}
                >
                  Use main party
                </Button>
                <Button size="sm" onClick={autoBuild}>
                  Build best available
                </Button>
                {state.guild.hall?.rooms?.war ? (
                  <Button size="sm" onClick={() => actions.saveFormation(formationType, assignments)} disabled={!assignments.length}>
                    Save as default
                  </Button>
                ) : null}
                <span>{assignments.length}/5 filled</span>
              </div>

              <div className="formation-slots">
                {formation.slots.map((slot) => {
                  const assignment = assignments.find((item) => item.slotId === slot.id);
                  const hero = assignment ? state.heroes.find((item) => item.id === assignment.heroId) : null;
                  return (
                    <article className={`formation-slot ${slot.required ? 'is-required' : ''} ${hero ? 'is-filled' : ''}`} key={slot.id} data-drop="slot" data-drop-id={slot.id}>
                      <div className="formation-slot__label">
                        <span>{slot.required ? 'Required' : 'Optional'}</span>
                        <strong>{slot.label}</strong>
                        <small>{slot.description}</small>
                      </div>
                      <label>
                        Assigned hero
                        <select value={hero?.id || ''} onChange={(event) => assignSlot(slot, event.target.value)}>
                          <option value="">— Empty —</option>
                          {availableHeroes.map((candidate) => (
                            <option
                              key={candidate.id}
                              value={candidate.id}
                              disabled={assignments.some((item) => item.heroId === candidate.id && item.slotId !== slot.id)}
                            >
                              {candidate.name} · Lv {candidate.level} {candidate.rarity} {candidate.primal} {normalizeClassId(candidate.classId)} · role{' '}
                              {roleRating(candidate, slot.role)}
                            </option>
                          ))}
                        </select>
                      </label>
                      {hero ? (
                        <div className="formation-slot__hero">
                          <HeroPortrait hero={hero} size="xs" />
                          <div>
                            <strong>{hero.name}</strong>
                            <small>
                              <LevelBadge hero={hero} /> <RarityBadge rarity={hero.rarity} /> <PrimalBadge primal={hero.primal} />
                            </small>
                          </div>
                          <b>{roleRating(hero, slot.role)}</b>
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>

              <div className={`estimate estimate--${estimate?.chance >= 65 ? 'good' : estimate?.chance >= 40 ? 'mixed' : 'bad'}`}>
                <div className="estimate__number">
                  <span>Estimated success</span>
                  <strong>{estimate?.chance || 0}%</strong>
                </div>
                <ProgressBar
                  value={estimate?.chance || 0}
                  max={100}
                  tone={estimate?.chance >= 65 ? 'green' : estimate?.chance >= 40 ? 'gold' : 'red'}
                  compact
                />
                <div className="estimate-primal-edge">
                  <span>Primal contribution</span>
                  <strong className={estimate?.primalEdge > 0 ? 'is-positive' : estimate?.primalEdge < 0 ? 'is-negative' : ''}>
                    {estimate?.primalEdge > 0 ? '+' : ''}
                    {estimate?.primalEdge || 0}
                  </strong>
                </div>
                <div className="estimate__breakdown">
                  {estimate?.breakdown.map((item) => (
                    <span key={item.slotId}>
                      <b>{item.slotLabel}</b>
                      {item.heroName}
                      <small>
                        Lv {item.level} · {item.primal} {item.primalModifier >= 0 ? '+' : ''}
                        {item.primalModifier}
                      </small>
                      <strong>{item.rating}</strong>
                    </span>
                  ))}
                </div>
                {estimate?.warnings.length ? (
                  <ul className="warning-list">
                    {estimate.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="estimate__note">Every required slot is covered by a credible specialist.</p>
                )}
              </div>

              <div className="commit-bar">
                <div>
                  <span>Supplies</span>
                  <strong>
                    {Math.max(
                      20,
                      Math.round(
                        (25 + selected.risk * 18 + selected.duration * 12 + (formationType === 'Expedition' ? 12 : 0)) *
                          (state.guild.appointments?.Quartermaster ? 0.88 : 1),
                      ),
                    )}{' '}
                    gold
                  </strong>
                </div>
                <div>
                  <span>Potential reward</span>
                  <strong>
                    {selected.reward} gold · {selected.fame} fame
                  </strong>
                </div>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={launch}
                  disabled={
                    (traveling && activeLocationId === currentLocationId) || assignments.length < 2 || estimate?.missingSlots.length > 0 || atFieldCapacity
                  }
                >
                  {traveling && activeLocationId === currentLocationId
                    ? 'Traveling'
                    : atFieldCapacity
                      ? 'All companies deployed'
                      : `Send ${formationType} company`}
                </Button>
                <Button variant="secondary" onClick={() => selected && actions.declineContract(selected.id)} title="A rival takes it; regional reputation −5">
                  Decline
                </Button>
              </div>
            </>
          ) : (
            <EmptyState icon="▤" title="Select a local contract" text="Choose a petition from the current settlement to begin planning." />
          )}
        </aside>
      </div>

      <SideJobsPanel state={state} actions={actions} locationId={currentLocationId} />

      <Panel title="Parties already beyond the gate" eyebrow="Active expeditions">
        {state.activeMissions.length ? (
          <div className="deployed-grid">
            {state.activeMissions.map((mission) => (
              <article className="deployed-card" key={mission.id}>
                <div className="deployed-card__top">
                  <Badge tone="blue">{mission.locationName}</Badge>
                  <Badge tone="purple">{mission.formationType || mission.approach}</Badge>
                  <RiskPips risk={mission.risk} />
                </div>
                <h3>{mission.title}</h3>
                <p>
                  {mission.assignments
                    .map((assignment) => {
                      const hero = state.heroes.find((item) => item.id === assignment.heroId);
                      return hero ? `${hero.name} (${assignment.role})` : null;
                    })
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                <ProgressBar
                  value={mission.duration - mission.remaining}
                  max={mission.duration}
                  label={
                    mission.remaining <= 0
                      ? mission.formationType === 'Combat' && !mission.combatResolved
                        ? 'Battle waiting'
                        : ['Diplomacy', 'Expedition', 'Intrigue'].includes(mission.formationType) && !mission.missionGameResolved
                          ? `${mission.formationType} challenge waiting`
                          : 'Aftermath decision waiting'
                      : `${mission.remaining} week${mission.remaining === 1 ? '' : 's'} remaining`
                  }
                  tone={mission.remaining <= 0 ? 'gold' : 'blue'}
                />
              </article>
            ))}
          </div>
        ) : (
          <EmptyState icon="◇" title="The road is quiet" text="No active expedition is consuming time or heroes." />
        )}
      </Panel>
    </div>
  );
}
