import React, { useEffect, useMemo, useState } from 'react';
import { FORMATION_TYPES, TOURNAMENT_DIVISIONS } from '../data/formations.js';
import { getTournamentAccess, roleRating } from '../game/engine.js';
import { Badge, Button, EmptyState, HeroPortrait, Panel, ProgressBar } from '../components/UI.jsx';

function bestCombatTeam(state) {
  const available = state.heroes.filter((hero) => hero.status === 'available');
  const used = new Set();
  return FORMATION_TYPES.Combat.slots.map((slot) => {
    const hero = available.filter((item) => !used.has(item.id)).sort((a, b) => roleRating(b, slot.role) - roleRating(a, slot.role))[0];
    if (!hero || (!slot.required && roleRating(hero, slot.role) < 44)) return null;
    used.add(hero.id);
    return { slotId: slot.id, role: slot.role, heroId: hero.id };
  }).filter(Boolean);
}

export default function TournamentsScreen({ state, actions }) {
  const [selectedId, setSelectedId] = useState(state.tournaments?.[0]?.id || '');
  const [assignments, setAssignments] = useState([]);
  const [tactic, setTactic] = useState('Measured');
  const selected = state.tournaments?.find((item) => item.id === selectedId) || state.tournaments?.[0] || null;
  const access = selected ? getTournamentAccess(state, selected) : { unlocked: false, checks: [] };
  const activeTournament = state.tournaments?.find((item) => item.status === 'active') || null;
  const availableHeroes = state.heroes.filter((hero) => hero.status === 'available');
  const combatSlots = FORMATION_TYPES.Combat.slots;

  useEffect(() => {
    if (!selected) return;
    if (selected.status === 'active') setAssignments(selected.assignments || []);
    else setAssignments((state.guild.formations?.Combat || []).filter((assignment) => availableHeroes.some((hero) => hero.id === assignment.heroId)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, selected?.status]);

  const selectedTeam = useMemo(() => assignments.map((assignment) => {
    const hero = state.heroes.find((item) => item.id === assignment.heroId);
    const slot = combatSlots.find((item) => item.id === assignment.slotId);
    return hero && slot ? { hero, slot, rating: roleRating(hero, slot.role) } : null;
  }).filter(Boolean), [assignments, state.heroes]);

  const requiredFilled = combatSlots.filter((slot) => slot.required).every((slot) => assignments.some((assignment) => assignment.slotId === slot.id));
  const teamPower = selectedTeam.length ? Math.round(selectedTeam.reduce((sum, item) => sum + item.rating, 0) / selectedTeam.length + Math.max(0, selectedTeam.length - 2) * 2.5) : 0;

  const assignSlot = (slot, heroId) => {
    setAssignments((current) => {
      const next = current.filter((assignment) => assignment.slotId !== slot.id && assignment.heroId !== heroId);
      return heroId ? [...next, { slotId: slot.id, role: slot.role, heroId }] : next;
    });
  };

  const divisionInfo = selected ? TOURNAMENT_DIVISIONS.find((item) => item.id === selected.division) : null;

  return (
    <div className="screen screen--tournaments">
      <header className="screen-heading">
        <div><span className="eyebrow">Local reputation · Professional proof · Elite history</span><h1>Tournament Circuits</h1><p>Competition is a progression system of its own. Fame gets invitations; combat victories and lower-division titles prove you belong.</p></div>
        <div className="heading-metrics"><Badge tone="gold">{state.stats.tournamentsWon} titles</Badge><Badge tone="red">{state.stats.combatWins || 0} combat wins</Badge></div>
      </header>

      <div className="circuit-ladder">
        {(state.tournaments || []).map((tournament) => {
          const tournamentAccess = getTournamentAccess(state, tournament);
          const info = TOURNAMENT_DIVISIONS.find((item) => item.id === tournament.division);
          return (
            <button key={tournament.id} className={`circuit-card ${selected?.id === tournament.id ? 'is-selected' : ''} ${tournamentAccess.unlocked ? 'is-unlocked' : 'is-locked'}`} onClick={() => setSelectedId(tournament.id)}>
              <span className="circuit-card__icon">{info?.icon}</span>
              <div><small>{tournament.division} circuit</small><strong>{tournament.name}</strong><p>{tournament.location} · {tournament.format}</p></div>
              <Badge tone={tournament.status === 'active' ? 'gold' : tournament.status === 'completed' ? 'neutral' : tournamentAccess.unlocked ? 'green' : 'red'}>{tournament.status === 'active' ? 'Competing' : tournament.status === 'completed' ? 'Completed' : tournamentAccess.unlocked ? 'Qualified' : 'Locked'}</Badge>
            </button>
          );
        })}
      </div>

      {selected ? (
        <section className="tournament-stage">
          <div className="tournament-stage__banner">
            <span className="tournament-stage__laurel">{divisionInfo?.icon || '♛'}</span>
            <div><span className="eyebrow">Year {selected.year} · {selected.division}</span><h2>{selected.name}</h2><p>{divisionInfo?.description}</p></div>
            <div className="tournament-prize"><small>Champion's purse</small><strong>{selected.prize}</strong><span>crowns · +{selected.famePrize} fame</span></div>
          </div>

          {!access.unlocked ? (
            <div className="qualification-panel">
              <div><span className="qualification-panel__lock">⌁</span><h3>{selected.division} qualification</h3><p>Travel is allowed, but registration is not. Earn every requirement through actual play.</p></div>
              <div className="qualification-checks">{access.checks.map((check) => <div key={check.id} className={check.met ? 'is-met' : ''}><span>{check.met ? '✓' : '○'}</span><p><strong>{check.label}</strong><small>{check.id === 'tierIndex' ? `${check.current >= 1 ? 'Regional' : 'Local'} / Regional` : `${check.current} / ${check.target}`}</small></p></div>)}</div>
            </div>
          ) : null}

          {selected.status === 'registration' ? (
            <div className="tournament-registration tournament-registration--team">
              <div className="registration-copy"><h3>Enter a Combat Company</h3><p>The same arrangement fights every round. Fatigue accumulates, so a brilliant two-person team can be less durable than a deep five-person company.</p><div className="registration-cost"><span>Entry fee</span><strong>{selected.entryFee} crowns</strong></div><Button size="sm" onClick={() => setAssignments(bestCombatTeam(state))}>Build best available</Button></div>
              <div className="tournament-team-builder">
                {combatSlots.map((slot) => {
                  const assignment = assignments.find((item) => item.slotId === slot.id);
                  const hero = assignment ? state.heroes.find((item) => item.id === assignment.heroId) : null;
                  return <article className={`formation-slot ${slot.required ? 'is-required' : ''} ${hero ? 'is-filled' : ''}`} key={slot.id}><div className="formation-slot__label"><span>{slot.required ? 'Required' : 'Optional'}</span><strong>{slot.label}</strong><small>{slot.description}</small></div><label>Hero<select value={hero?.id || ''} onChange={(event) => assignSlot(slot, event.target.value)}><option value="">— Empty —</option>{availableHeroes.map((candidate) => <option key={candidate.id} value={candidate.id} disabled={assignments.some((item) => item.heroId === candidate.id && item.slotId !== slot.id)}>{candidate.name} · {candidate.classId} · role {roleRating(candidate, slot.role)}</option>)}</select></label>{hero ? <div className="formation-slot__hero"><HeroPortrait hero={hero} size="xs" /><div><strong>{hero.name}</strong><small>{hero.classId} · PWR {hero.power}</small></div><b>{roleRating(hero, slot.role)}</b></div> : null}</article>;
                })}
                <div className="tournament-entry-summary"><span>Team power <strong>{teamPower}</strong></span><span>Members <strong>{assignments.length}/5</strong></span><Button variant="primary" size="lg" disabled={!access.unlocked || !requiredFilled || assignments.length < 2 || state.guild.crowns < selected.entryFee || Boolean(activeTournament)} onClick={() => actions.enterTournament(selected.id, 'Combat', assignments)}>{activeTournament ? 'Another circuit is active' : `Enter ${selected.division} circuit`}</Button></div>
              </div>
            </div>
          ) : null}

          {selected.status === 'active' ? (
            <div className="tournament-active tournament-active--team">
              <div className="team-pedestal"><span className="eyebrow">Your Combat Company</span><h3>{state.guild.name}</h3><div className="tournament-team-strip">{selected.assignments.map((assignment) => { const hero = state.heroes.find((item) => item.id === assignment.heroId); return hero ? <div key={hero.id}><HeroPortrait hero={hero} size="sm" /><span><strong>{hero.name}</strong><small>{assignment.role} · fatigue {hero.fatigue}</small></span></div> : null; })}</div><ProgressBar value={Math.max(0, 100 - Math.round(selected.assignments.reduce((sum, assignment) => sum + (state.heroes.find((hero) => hero.id === assignment.heroId)?.fatigue || 0), 0) / selected.assignments.length))} max={100} label="Company readiness" tone="gold" /></div>
              <div className="round-control"><span className="round-control__number">{selected.currentRound === 8 ? 'QF' : selected.currentRound === 4 ? 'SF' : 'F'}</span><h3>{selected.currentRound === 8 ? 'Quarterfinal' : selected.currentRound === 4 ? 'Semifinal' : 'Championship final'}</h3><p>The herald reveals the opposing company only when the bout begins.</p><label>Tactical approach<select value={tactic} onChange={(event) => setTactic(event.target.value)}><option>Measured</option><option>Aggressive</option><option>Defensive</option><option>Showmanship</option></select></label><div className="tactic-notes"><span className={tactic === 'Measured' ? 'is-active' : ''}><b>Measured</b>Reliable and balanced.</span><span className={tactic === 'Aggressive' ? 'is-active' : ''}><b>Aggressive</b>Higher edge, more fatigue.</span><span className={tactic === 'Defensive' ? 'is-active' : ''}><b>Defensive</b>Conserves readiness.</span><span className={tactic === 'Showmanship' ? 'is-active' : ''}><b>Showmanship</b>Harder, more public.</span></div><Button variant="primary" size="lg" onClick={() => actions.fightTournamentRound(selected.id, tactic)}>Fight the next round</Button></div>
            </div>
          ) : null}

          {selected.status === 'completed' ? <div className="tournament-result"><span>{selected.finish === 1 ? '♛' : '⚔'}</span><div><span className="eyebrow">Tournament complete</span><h3>{selected.finish === 1 ? `${state.guild.name} is champion` : `The guild finishes in the top ${selected.finish}`}</h3><p>Open the Chronicle to inspect the complete team, every opponent, odds and tactical choice.</p></div></div> : null}

          <div className="bracket-history"><h3>Guild bouts</h3>{selected.bracket.length ? selected.bracket.map((bout, index) => <article key={`${bout.round}-${index}`} className={bout.won ? 'is-win' : 'is-loss'}><span>{bout.round}</span><strong>{state.guild.name}</strong><i>{bout.won ? 'def.' : 'lost to'}</i><strong>{bout.opponent}</strong><small>{bout.tactic} · {bout.chance}% estimate · team {bout.teamPower} vs {bout.opponentPower}</small></article>) : <p className="muted">No guild bout has been fought yet.</p>}</div>
        </section>
      ) : <EmptyState icon="♛" title="No tournament is scheduled" text="A new set of circuits is generated at the beginning of each year." />}

      <div className="dashboard-grid dashboard-grid--tournament">
        <Panel title="Competitive license" eyebrow="Current proof"><div className="record-grid"><div><span>Combat mission wins</span><strong>{state.stats.combatWins || 0}</strong></div><div><span>Local titles</span><strong>{state.stats.localTournamentWins || 0}</strong></div><div><span>Professional titles</span><strong>{state.stats.professionalTournamentWins || 0}</strong></div><div><span>Elite titles</span><strong>{state.stats.eliteTournamentWins || 0}</strong></div></div></Panel>
        <Panel title="Why this matters" eyebrow="Roster strategy"><ul className="insight-list"><li>Professional access requires 60 fame, five Combat mission wins and a Local title.</li><li>Elite access requires Regional status, 220 fame, fifteen Combat wins and two Professional titles.</li><li>Support specialists may contribute little damage but preserve readiness across a tournament run.</li><li>The exact company and every bout are stored permanently in the Chronicle.</li></ul></Panel>
      </div>
    </div>
  );
}
