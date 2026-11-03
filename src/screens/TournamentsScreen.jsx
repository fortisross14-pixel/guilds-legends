import React, { useEffect, useState } from 'react';
import { normalizeClassId } from '../data/content.js';
import { FORMATION_TYPES } from '../data/formations.js';
import { LOCATION_BY_ID, PRIMALS } from '../data/world.js';
import { getHero, getTournamentAccess, roleRating } from '../game/engine.js';
import { Badge, Button, EmptyState, HeroPortrait, LevelBadge, Panel, PrimalBadge, RarityBadge, Tabs } from '../components/UI.jsx';
import { sliceHides } from '../data/slice.js';

function ordinal(finish) {
  if (finish === 1) return 'Champion';
  if (finish === 2) return 'Runner-up';
  return `Top ${finish}`;
}

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

function HeroCircuit({ state, actions, navigate }) {
  const [selectedId, setSelectedId] = useState(state.tournaments?.find((event) => event.status === 'active')?.id || state.tournaments?.[0]?.id || '');
  const [heroId, setHeroId] = useState('');
  const selected = state.tournaments?.find((event) => event.id === selectedId) || state.tournaments?.[0];
  const record = selected ? state.titleRecords?.[selected.definitionId] : null;
  const playerHero = selected?.playerHeroId ? getHero(state, selected.playerHeroId) : null;
  const chosenHero = heroId ? getHero(state, heroId) : null;
  const access = selected ? getTournamentAccess(state, selected, heroId || selected.playerHeroId) : null;
  const eligible = state.heroes.filter((hero) => hero.status === 'available');
  const opponent = selected?.status === 'active' && playerHero ? getHero(state, nextOpponentId(selected, playerHero.id)) : null;
  const latestRecord = selected ? state.tournamentHistory.find((item) => item.definitionId === selected.definitionId) : null;

  useEffect(() => {
    if (!selected) return;
    if (selected.playerHeroId) setHeroId(selected.playerHeroId);
    else if (!eligible.some((hero) => hero.id === heroId)) {
      const lead = (state.guild.mainParty || []).find((id) => eligible.some((hero) => hero.id === id));
      setHeroId(lead || eligible[0]?.id || '');
    }
  }, [selectedId, selected?.playerHeroId, eligible.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!selected)
    return <EmptyState icon="♛" title="No circuit scheduled" text="The seasonal tournament calendar will be published at the start of the next year." />;

  return (
    <div className="universe-tournaments">
      <div className="event-rail">
        {state.tournaments.map((event) => {
          const eventRecord = state.titleRecords?.[event.definitionId];
          return (
            <button key={event.id} className={`event-ticket ${event.id === selected.id ? 'is-selected' : ''}`} onClick={() => setSelectedId(event.id)}>
              <span className={`event-ticket__tier event-ticket__tier--${event.circuit.toLowerCase()}`}>{event.circuit}</span>
              <strong>{event.name}</strong>
              <small>
                {event.location} · Month {event.month + 1}, week {(event.week || 0) + 1}
              </small>
              <div>
                <PrimalBadge primal={event.primal} compact />
                <span>{event.purse.toLocaleString()} ◈</span>
              </div>
              <p>
                Record: {eventRecord?.recordHolderName} · {eventRecord?.recordWins} wins
              </p>
            </button>
          );
        })}
      </div>

      <section className="arena-hero" style={{ '--arena-primal': PRIMALS[selected.primal]?.color }}>
        <div className="arena-hero__copy">
          <span className="eyebrow">
            Year {selected.year} · {selected.circuit} individual circuit
          </span>
          <h2>{selected.name}</h2>
          <p>{selected.description}</p>
          <div className="arena-hero__badges">
            <EventStatus state={state} tournament={selected} heroId={heroId || null} />
            <PrimalBadge primal={selected.primal} />
            <Badge>{selected.size}-hero knockout</Badge>
          </div>
        </div>
        <div className="arena-hero__trophy">
          <span>♛</span>
          <small>{selected.trophy}</small>
          <strong>{selected.purse.toLocaleString()} ◈</strong>
          <em>{selected.prestige} prestige</em>
        </div>
      </section>

      <div className="tournament-record-strip">
        <div>
          <small>All-time record</small>
          <strong>{record?.recordHolderName || 'No record'}</strong>
          <span>{record?.recordWins || 0} championships</span>
        </div>
        <div>
          <small>Recent champion</small>
          <strong>{latestRecord?.championName || record?.winners?.[0]?.heroName || 'Season not held'}</strong>
          <span>{latestRecord ? `Year ${latestRecord.year}` : 'Historical archive'}</span>
        </div>
        <div>
          <small>Your record</small>
          <strong>{chosenHero?.career?.titleWins?.[selected.definitionId] || 0} wins</strong>
          <span>
            {chosenHero?.career?.bestTournamentFinish && chosenHero.career.bestTournamentFinish < 99
              ? ordinal(chosenHero.career.bestTournamentFinish)
              : 'No appearance'}
          </span>
        </div>
      </div>

      {selected.status === 'registration' ? (
        <div className="tournament-entry-grid">
          <Panel title="Choose your champion" eyebrow="One hero carries the banner">
            <label className="field-label">
              Entrant
              <select value={heroId} onChange={(event) => setHeroId(event.target.value)}>
                <option value="">Select an available hero</option>
                {eligible.map((hero) => (
                  <option key={hero.id} value={hero.id}>
                    {hero.name} · Lv {hero.level} · {hero.rarity} {normalizeClassId(hero.classId)} · {hero.primal}
                  </option>
                ))}
              </select>
            </label>
            {chosenHero ? (
              <button className="entrant-card" onClick={() => actions.openHero(chosenHero.id)}>
                <HeroPortrait hero={chosenHero} size="md" />
                <div>
                  <strong>{chosenHero.name}</strong>
                  <span>
                    <LevelBadge hero={chosenHero} />
                    <RarityBadge rarity={chosenHero.rarity} />
                    <PrimalBadge primal={chosenHero.primal} compact />
                  </span>
                  <small>
                    PWR {chosenHero.power} · Form {chosenHero.form} · Tournament craft +{chosenHero.specializations?.tournament || 0}
                  </small>
                </div>
                <i>Open career ›</i>
              </button>
            ) : null}
            <div className="entry-economy">
              <span>
                Entry fee <b>{selected.entryFee} ◈</b>
              </span>
              <span>
                Guild treasury <b>{state.guild.crowns.toLocaleString()} ◈</b>
              </span>
            </div>
            <Button
              variant="primary"
              size="lg"
              disabled={!chosenHero || !access?.unlocked || !access?.locationMet || !access?.registrationOpen || state.guild.crowns < selected.entryFee}
              onClick={() => actions.enterHeroTournament(selected.id, chosenHero.id)}
            >
              Enter {chosenHero?.name || 'hero'}
            </Button>
          </Panel>

          <Panel title="Entry conditions" eyebrow="License, location and expectation">
            <div className="qualification-checks qualification-checks--vertical">
              {(access?.checks || []).map((check) => (
                <div key={check.id} className={check.met ? 'is-met' : ''}>
                  <span>{check.met ? '✓' : '○'}</span>
                  <p>
                    <strong>{check.label}</strong>
                    <small>
                      {check.id === 'tierIndex'
                        ? `${['Regional', 'National', 'Global'][check.current] || 'Regional'} / ${['Regional', 'National', 'Global'][check.target] || 'Regional'}`
                        : `${check.current} / ${check.target}`}
                    </small>
                  </p>
                </div>
              ))}
              <div className={access?.locationMet ? 'is-met' : ''}>
                <span>{access?.locationMet ? '✓' : '○'}</span>
                <p>
                  <strong>Present in {selected.location}</strong>
                  <small>Currently in {LOCATION_BY_ID[state.world.currentLocationId]?.name}</small>
                </p>
              </div>
            </div>
            {!access?.locationMet ? <Button onClick={() => navigate('world')}>Open travel map</Button> : null}
            <div className="expectation-note">
              <strong>Fame follows expectations</strong>
              <p>
                An unknown entrant can gain fame from a brave loss. A celebrated champion entering this field is expected to win; an early exit can reduce fame.
              </p>
            </div>
          </Panel>
        </div>
      ) : null}

      {selected.status === 'active' && playerHero ? (
        <div className="live-bracket-grid">
          <Panel
            title={`${selected.currentRoundSize === 16 ? 'Round of 16' : selected.currentRoundSize === 8 ? 'Quarterfinal' : selected.currentRoundSize === 4 ? 'Semifinal' : 'Final'}: enter the arena`}
            eyebrow={`Seed #${selected.initialSeed} · Expected top ${selected.expectedFinish}`}
          >
            <div className="versus-card">
              <button onClick={() => actions.openHero(playerHero.id)}>
                <HeroPortrait hero={playerHero} size="lg" />
                <strong>{playerHero.name}</strong>
                <small>
                  Lv {playerHero.level} · PWR {playerHero.power} · fatigue {playerHero.fatigue}
                </small>
                <PrimalBadge primal={playerHero.primal} />
              </button>
              <span>VS</span>
              {opponent ? (
                <button onClick={() => actions.openHero(opponent.id)}>
                  <HeroPortrait hero={opponent} size="lg" />
                  <strong>{opponent.name}</strong>
                  <small>
                    {opponent.guildId ? state.rivals.find((guild) => guild.id === opponent.guildId)?.name : 'Free agent'} · Lv {opponent.level} ·{' '}
                    {opponent.rarity}
                  </small>
                  <PrimalBadge primal={opponent.primal} />
                </button>
              ) : (
                <div>Opponent pending</div>
              )}
            </div>
            <div className="tactical-combat-intro">
              <strong>Turn-based duel</strong>
              <p>
                A one-on-one battle: read the opponent’s tell, exploit primal matchups, and use {playerHero.classId} skills and items to win before the judges
                call time.
              </p>
            </div>
            <Button variant="primary" size="lg" disabled={Boolean(state.activeEncounter)} onClick={() => actions.startHeroCombat(selected.id)}>
              {state.activeEncounter?.sourceId === selected.id ? 'Combat in progress' : 'Enter the arena'}
            </Button>
          </Panel>
          <Panel title="Live field" eyebrow={`${selected.activeEntrants.length} champions remain`}>
            <div className="live-field">
              {selected.activeEntrants.map((id, index) => {
                const hero = getHero(state, id);
                return hero ? (
                  <button key={id} className={id === playerHero.id ? 'is-player' : ''} onClick={() => actions.openHero(id)}>
                    <span>#{selected.initialEntrants.indexOf(id) + 1 || index + 1}</span>
                    <HeroPortrait hero={hero} size="xs" />
                    <div>
                      <strong>{hero.name}</strong>
                      <small>
                        {hero.rarity} · Lv {hero.level} · {hero.classId}
                      </small>
                    </div>
                    <PrimalBadge primal={hero.primal} compact />
                  </button>
                ) : null;
              })}
            </div>
          </Panel>
        </div>
      ) : null}

      {selected.status === 'completed' ? (
        <Panel title="This year’s completed bracket" eyebrow={latestRecord ? `Champion: ${latestRecord.championName}` : 'Archived result'}>
          {latestRecord ? (
            <div className="completed-tournament">
              <div>
                <span>♛</span>
                <h3>{latestRecord.championName}</h3>
                <p>
                  {latestRecord.championGuild} · {latestRecord.prize.toLocaleString()} crowns
                </p>
              </div>
              <p>{latestRecord.narrative}</p>
              <Button onClick={() => actions.openReport({ kind: 'tournament', id: latestRecord.id })}>Open full bracket</Button>
            </div>
          ) : (
            <EmptyState title="Result unavailable" text="The archive does not contain a result for this edition." />
          )}
        </Panel>
      ) : null}
    </div>
  );
}

function GuildChampionships({ state, actions, navigate }) {
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
              {event.location} · {event.purse.toLocaleString()} ◈
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
        <span>⚑</span>
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
              Register company · {selected.entryFee} ◈
            </Button>
          </Panel>
          <Panel title="Championship license" eyebrow="Guild events are not local">
            <div className="qualification-checks qualification-checks--vertical">
              {access?.checks.map((check) => (
                <div key={check.id} className={check.met ? 'is-met' : ''}>
                  <span>{check.met ? '✓' : '○'}</span>
                  <p>
                    <strong>{check.label}</strong>
                    <small>
                      {check.current} / {check.target}
                    </small>
                  </p>
                </div>
              ))}
              <div className={access?.locationMet ? 'is-met' : ''}>
                <span>{access?.locationMet ? '✓' : '○'}</span>
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

function TitleHistory({ state, actions }) {
  const records = Object.values(state.titleRecords || {});
  return (
    <div className="title-archive">
      {records.map((record) => {
        const tournament = [...(state.tournaments || []), ...(state.guildTournaments || [])].find((event) => event.definitionId === record.id);
        return (
          <article key={record.id}>
            <header>
              <span>{record.kind === 'individual' ? '♛' : '⚑'}</span>
              <div>
                <small>
                  {record.circuit} · {record.kind}
                </small>
                <h3>{record.name}</h3>
              </div>
              <Badge tone="gold">Record {record.recordWins}</Badge>
            </header>
            <div className="title-archive__record">
              <small>Record holder</small>
              <strong>{record.recordHolderName}</strong>
            </div>
            <div className="title-winners">
              {(record.winners || []).slice(0, 6).map((winner, index) => (
                <button
                  key={`${winner.year}-${winner.heroId || winner.guildId || index}`}
                  onClick={() => winner.heroId && actions.openHero(winner.heroId)}
                  disabled={!winner.heroId}
                >
                  <span>{winner.year}</span>
                  <strong>{winner.heroName || winner.guildName}</strong>
                  <small>{winner.guildName && winner.heroName ? winner.guildName : winner.player ? state.guild.name : 'Champion'}</small>
                </button>
              ))}
            </div>
            {tournament ? <p>{tournament.description}</p> : null}
          </article>
        );
      })}
    </div>
  );
}

export default function TournamentsScreen({ state, actions, navigate }) {
  const [tab, setTab] = useState('heroes');
  const active = [...(state.tournaments || []), ...(state.guildTournaments || [])].find((event) => event.status === 'active');
  return (
    <div className="screen screen--tournaments">
      <header className="screen-heading">
        <div>
          <span className="eyebrow">A living circuit with champions, records and expectations</span>
          <h1>Tournament Universe</h1>
          <p>
            Every bracket is populated by heroes from rival guilds and the open market. Build a career one upset, title and repeated championship at a time.
          </p>
        </div>
        <div className="heading-metrics">
          <Badge tone="gold">{state.stats.individualTournamentWins || 0} hero titles</Badge>
          {sliceHides('guildChampionships') ? null : <Badge tone="purple">{state.stats.guildTournamentWins || 0} guild titles</Badge>}
          <Badge tone={active ? 'red' : 'green'}>{active ? `${active.name} active` : 'No active entry'}</Badge>
        </div>
      </header>
      <Tabs
        active={tab}
        onChange={setTab}
        items={[
          { id: 'heroes', label: 'Hero circuits', icon: '♛' },
          { id: 'guilds', label: 'Guild championships', icon: '⚑' },
          { id: 'records', label: 'Title history', icon: '▤' },
        ].filter((item) => item.id !== 'guilds' || !sliceHides('guildChampionships'))}
      />
      {tab === 'heroes' ? <HeroCircuit state={state} actions={actions} navigate={navigate} /> : null}
      {tab === 'guilds' && !sliceHides('guildChampionships') ? <GuildChampionships state={state} actions={actions} navigate={navigate} /> : null}
      {tab === 'records' ? <TitleHistory state={state} actions={actions} /> : null}
    </div>
  );
}
