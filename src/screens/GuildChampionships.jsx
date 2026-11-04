import React, { useEffect, useState } from 'react';
import { FORMATION_TYPES } from '../data/formations.js';
import { getHero, getTournamentAccess, roleRating } from '../game/engine.js';
import { Badge, Button, EmptyState, HeroPortrait, Panel } from '../components/UI.jsx';
import Icon from '../components/Icon.jsx';

// Guild championships (team tournaments). Outside the Chapter 1 slice; the
// arena registrar shows this when the slice stops hiding them.

function nextOpponentId(tournament, playerId) {
  const entrants = tournament?.activeEntrants || [];
  const index = entrants.indexOf(playerId);
  if (index < 0) return null;
  return entrants[entrants.length - 1 - index] || null;
}

function bestCombatTeam(state) {
  const available = state.heroes.filter((hero) => hero.status === 'available');
  const used = new Set();
  return FORMATION_TYPES.Combat.slots
    .map((slot) => {
      const hero = available.filter((candidate) => !used.has(candidate.id)).sort((a, b) => roleRating(b, slot.role) - roleRating(a, slot.role))[0];
      if (!hero || (!slot.required && roleRating(hero, slot.role) < 44)) return null;
      used.add(hero.id);
      return { slotId: slot.id, role: slot.role, heroId: hero.id };
    })
    .filter(Boolean);
}

function EventStatus({ state, tournament, heroId = null }) {
  const access = getTournamentAccess(state, tournament, heroId);
  if (tournament.status === 'active') return <Badge tone="gold">In progress</Badge>;
  if (tournament.status === 'completed') return <Badge tone="neutral">Completed</Badge>;
  if (!access.registrationOpen) return <Badge tone="neutral">Registration closed</Badge>;
  if (!access.locationMet) return <Badge tone="blue">Travel required</Badge>;
  if (!access.unlocked) return <Badge tone="red">Requirements unmet</Badge>;
  return <Badge tone="green">Open</Badge>;
}

export default function GuildChampionships({ state, actions, navigate }) {
  const [selectedId, setSelectedId] = useState(state.guildTournaments?.find((event) => event.status === 'active')?.id || state.guildTournaments?.[0]?.id || '');
  const [assignments, setAssignments] = useState([]);
  const selected = state.guildTournaments?.find((event) => event.id === selectedId) || state.guildTournaments?.[0];
  const slots = FORMATION_TYPES.Combat.slots;
  const available = state.heroes.filter((hero) => hero.status === 'available');
  const access = selected ? getTournamentAccess(state, selected) : null;
  const record = selected ? state.titleRecords?.[selected.definitionId] : null;

  useEffect(() => {
    if (selected?.status === 'active') setAssignments(selected.assignments || []);
    else setAssignments((state.guild.formations?.Combat || []).filter((assignment) => available.some((hero) => hero.id === assignment.heroId)));
  }, [selectedId, selected?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const assign = (slot, heroId) =>
    setAssignments((current) => {
      const next = current.filter((item) => item.slotId !== slot.id && item.heroId !== heroId);
      return heroId ? [...next, { slotId: slot.id, role: slot.role, heroId }] : next;
    });
  const requiredFilled = slots.filter((slot) => slot.required).every((slot) => assignments.some((item) => item.slotId === slot.id));
  const opponentGuildId = selected?.status === 'active' ? nextOpponentId(selected, 'player') : null;
  const opponentGuild = state.rivals.find((guild) => guild.id === opponentGuildId);

  if (!selected) return <EmptyState icon="⚑" title="No guild championship scheduled" text="Guild competitions begin at National status." />;

  return (
    <div className="guild-championships">
      <div className="championship-selector">
        {state.guildTournaments.map((event) => (
          <button key={event.id} className={event.id === selected.id ? 'is-selected' : ''} onClick={() => setSelectedId(event.id)}>
            <span>{event.circuit}</span>
            <strong>{event.name}</strong>
            <small>
              {event.location} · {event.purse.toLocaleString()} G
            </small>
            <EventStatus state={state} tournament={event} />
          </button>
        ))}
      </div>
      <section className="guild-banner-stage">
        <div>
          <span className="eyebrow">National and global guild competition</span>
          <h2>{selected.name}</h2>
          <p>{selected.description}</p>
          <div>
            <Badge tone="gold">
              Record: {record?.recordHolderName} · {record?.recordWins} wins
            </Badge>
            <Badge>{selected.size} guilds</Badge>
          </div>
        </div>
        <span><Icon name="flag" size={18} tone="brass" /></span>
      </section>

      {selected.status === 'registration' ? (
        <div className="guild-entry-layout">
          <Panel title="Combat Company" eyebrow="One fixed five-hero arrangement">
            <div className="compact-formation-builder">
              {slots.map((slot) => {
                const item = assignments.find((assignment) => assignment.slotId === slot.id);
                const hero = item ? getHero(state, item.heroId) : null;
                return (
                  <article key={slot.id} className={hero ? 'is-filled' : ''}>
                    <div>
                      <small>{slot.required ? 'Required' : 'Optional'}</small>
                      <strong>{slot.label}</strong>
                      <span>{slot.description}</span>
                    </div>
                    <select value={hero?.id || ''} onChange={(event) => assign(slot, event.target.value)}>
                      <option value="">— Empty —</option>
                      {available.map((candidate) => (
                        <option
                          key={candidate.id}
                          value={candidate.id}
                          disabled={assignments.some((assignment) => assignment.heroId === candidate.id && assignment.slotId !== slot.id)}
                        >
                          {candidate.name} · role {roleRating(candidate, slot.role)} · Lv {candidate.level}
                        </option>
                      ))}
                    </select>
                    {hero ? (
                      <button onClick={() => actions.openHero(hero.id)}>
                        <HeroPortrait hero={hero} size="xs" />
                        <span>{hero.name}</span>
                        <b>{roleRating(hero, slot.role)}</b>
                      </button>
                    ) : null}
                  </article>
                );
              })}
            </div>
            <div className="formation-actions">
              <Button size="sm" onClick={() => setAssignments(bestCombatTeam(state))}>
                Build best company
              </Button>
              {state.guild.hall?.rooms?.war ? (
                <Button size="sm" onClick={() => actions.saveFormation('Combat', assignments)}>
                  Save as Combat arrangement
                </Button>
              ) : null}
            </div>
            <Button
              variant="primary"
              size="lg"
              disabled={!requiredFilled || !access?.unlocked || !access?.locationMet || state.guild.crowns < selected.entryFee}
              onClick={() => actions.enterGuildTournament(selected.id, 'Combat', assignments)}
            >
              Register company · {selected.entryFee} G
            </Button>
          </Panel>
          <Panel title="Championship license" eyebrow="Guild events are not local">
            <div className="qualification-checks qualification-checks--vertical">
              {access?.checks.map((check) => (
                <div key={check.id} className={check.met ? 'is-met' : ''}>
                  <span>{check.met ? <Icon name="check" size={14} tone="plain" /> : <Icon name="dot" size={14} tone="plain" />}</span>
                  <p>
                    <strong>{check.label}</strong>
                    <small>
                      {check.current} / {check.target}
                    </small>
                  </p>
                </div>
              ))}
              <div className={access?.locationMet ? 'is-met' : ''}>
                <span>{access?.locationMet ? <Icon name="check" size={14} tone="plain" /> : <Icon name="dot" size={14} tone="plain" />}</span>
                <p>
                  <strong>Present in host city</strong>
                  <small>{selected.location}</small>
                </p>
              </div>
            </div>
            {!access?.locationMet ? <Button onClick={() => navigate('world')}>Travel to host</Button> : null}
          </Panel>
        </div>
      ) : null}

      {selected.status === 'active' ? (
        <Panel title="Next guild battle" eyebrow={`Seed #${selected.initialSeed} · Expected top ${selected.expectedFinish}`}>
          <div className="guild-versus">
            <div>
              <strong>{state.guild.name}</strong>
              <small>
                {assignments.length} heroes · entry power {selected.teamPowerAtEntry}
              </small>
            </div>
            <span>VS</span>
            <div>
              <strong>{opponentGuild?.name || 'Opponent pending'}</strong>
              <small>
                {opponentGuild?.archetype} · PWR {opponentGuild?.power}
              </small>
            </div>
          </div>
          <div className="tactical-combat-intro">
            <strong>Company battle</strong>
            <p>
              A full party battle against the opposing company. Each of your heroes acts every round with their own skills; there is no fleeing a championship.
            </p>
          </div>
          <Button variant="primary" size="lg" disabled={Boolean(state.activeEncounter)} onClick={() => actions.startGuildCombat(selected.id)}>
            {state.activeEncounter?.sourceId === selected.id ? 'Combat in progress' : 'Enter company battle'}
          </Button>
        </Panel>
      ) : null}
    </div>
  );
}
