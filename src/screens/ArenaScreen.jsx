import { RollOfChampions, TaleOfTape } from './SportsDesk.jsx';
import React, { useEffect, useState } from 'react';
import { MONTHS } from '../data/content.js';
import { locationBuildings } from '../data/world.js';
import { TOURNAMENT_LORE } from '../data/lore.js';
import { getArenaView, getStoryView } from '../game/engine.js';
import { Badge, Button, HeroPortrait, Panel } from '../components/UI.jsx';
import Asset from '../components/Asset.jsx';
import { CIRCUITS, CIRCUIT_BY_TIER } from '../data/tournaments.js';

// A town's arena (Phase 6a): an interior with three spots to tap. The fighting
// ground (referee), the sign-up desk (registrar) and the history board.

const when = (date) => `${MONTHS[date.month]} ${date.year}, week ${date.week + 1}`;
const inWeeks = (days) => (days <= 0 ? 'today' : days < 7 ? `in ${days} day${days === 1 ? '' : 's'}` : `in ${Math.round(days / 7)} week${Math.round(days / 7) === 1 ? '' : 's'}`);

function Spot({ id, active, asset, title, text, badge, onClick }) {
  return (
    <button className={`arena-spot arena-spot--${id} ${active ? 'is-selected' : ''}`} onClick={onClick} aria-pressed={active}>
      <Asset id={asset} className="arena-spot__art" alt="" />
      <span>
        <strong>{title}</strong>
        <small>{text}</small>
      </span>
      {badge ? <Badge tone="gold">{badge}</Badge> : null}
    </button>
  );
}

function FightingGround({ state, view, actions }) {
  // A story duel waiting in this ring (mission 7: Halden Marsh at Windmere).
  const duel = getStoryView(state).active?.current;
  if (duel?.kind === 'duel' && duel.canDuel) {
    const mission = getStoryView(state).active;
    return (
      <Panel title={mission.title} eyebrow="Story duel">
        <p className="arena-line">{duel.text} Your strongest fit hero steps into the ring.</p>
        <Button variant="primary" size="lg" disabled={Boolean(state.activeEncounter)} onClick={() => actions.startStoryDuel(mission.id)}>
          Start the duel
        </Button>
      </Panel>
    );
  }
  if (view.active && view.team.length) {
    const size = view.active.currentRoundSize;
    const round = size >= 16 ? 'Round of 16' : size === 8 ? 'Quarterfinal' : size === 4 ? 'Semifinal' : 'Final';
    const rivals = state.rivals || [];
    return (
      <Panel title={`${view.active.name}: ${round}`} eyebrow={`Referee · seed #${view.active.initialSeed} · expected top ${view.active.expectedFinish}`}>
        <div className="versus-card versus-card--teams">
          <div className="versus-team">
            <strong>{state.guild.name}</strong>
            <div className="versus-team__heroes">
              {view.team.map((hero) => (
                <button key={hero.id} onClick={() => actions.openHero(hero.id)} aria-label={hero.name}>
                  <HeroPortrait hero={hero} size="sm" />
                  <small>{hero.name}</small>
                </button>
              ))}
            </div>
          </div>
          <span>VS</span>
          <div className="versus-team">
            <strong>{view.opponentGuild?.name || 'Opponent pending'}</strong>
            {view.opponentGuild ? <small className="muted">{CIRCUIT_BY_TIER[view.opponentGuild.tierIndex || 0]?.id} guild</small> : null}
          </div>
        </div>
        <TaleOfTape state={state} tournamentId={view.active.id} />
        <p className="arena-line">“Teams ready? Then step into the ring.”</p>
        <Button variant="primary" size="lg" disabled={Boolean(state.activeEncounter)} onClick={() => actions.startBout(view.active.id)}>
          {state.activeEncounter?.sourceId === view.active.id ? 'Bout in progress' : 'Start the next bout'}
        </Button>
        <ul className="arena-others">
          {view.active.activeEntrants.map((id) => (
            <li key={id} className={id === 'player' ? 'is-player' : ''}>
              <strong>{id === 'player' ? state.guild.name : rivals.find((guild) => guild.id === id)?.name || id}</strong>
            </li>
          ))}
        </ul>
      </Panel>
    );
  }
  return (
    <Panel title="The fighting ground" eyebrow="Referee">
      <p className="arena-line">
        {view.next
          ? `“No tournament in progress. The next one is the ${view.next.definition.name} ${inWeeks(view.next.days)}.”`
          : '“No tournaments are held here this season.”'}
      </p>
      {view.next?.openNow ? <p className="muted">Sign-up is open at the registrar for {view.next.closesIn} more day{view.next.closesIn === 1 ? '' : 's'}.</p> : null}
    </Panel>
  );
}

function Registrar({ state, view, actions }) {
  const open = view.open;
  const cap = open?.teamSize || view.next?.teamSize || 2;
  const fit = view.heroes.filter((row) => row.fit);
  const [picked, setPicked] = useState(() => fit.slice(0, cap).map((row) => row.hero.id));
  const team = picked.filter((id) => fit.some((row) => row.hero.id === id)).slice(0, cap);
  const toggle = (id) => setPicked((list) => (list.includes(id) ? list.filter((item) => item !== id) : list.length >= cap ? list : [...list, id]));
  const blocked = view.access?.checks?.filter((check) => !check.met) || [];
  const why = !view.present
    ? `Be in ${view.location.name} to sign up.`
    : blocked.length
      ? `Not yet: ${blocked.map((check) => `${check.label} ${check.current}/${check.target}`).join(', ')}.`
      : !team.length
        ? 'Pick at least one fit hero.'
        : `Entry costs ${open?.entryFee} gold.`;
  return (
    <>
      <Panel title="Sign-up desk" eyebrow={open ? `Registrar · ${CIRCUITS[open.circuit]?.label || ''}` : 'Registrar'}>
        {open ? (
          (
            <>
              <p className="arena-line">
                “The {open.name} is taking names for {view.next.closesIn} more day{view.next.closesIn === 1 ? '' : 's'}. Sign up and you fight today. Teams of up to {cap}. Entry is {open.entryFee} gold; the purse is {open.purse} gold.”
              </p>
              <p>
                <b>Entry rules:</b> {view.next.rules.join(' · ')}
              </p>
              <p className="muted">
                Your team: {team.length} of {cap}. Fewer is allowed.
              </p>
              <div className="arena-entrants" role="group" aria-label="Who fights for the guild">
                {view.heroes.map((row) => {
                  const on = team.includes(row.hero.id);
                  return (
                    <button
                      key={row.hero.id}
                      aria-pressed={on}
                      className={`arena-entrant ${on ? 'is-selected' : ''} ${row.fit ? '' : 'is-blocked'}`}
                      disabled={!row.fit || (!on && team.length >= cap)}
                      onClick={() => toggle(row.hero.id)}
                    >
                      <HeroPortrait hero={row.hero} size="xs" showStatus={false} />
                      <span>
                        <strong>{row.hero.name}</strong>
                        <small>
                          Lv {row.hero.level} {row.hero.classId}
                          {row.fit ? '' : ' · not fit'}
                        </small>
                      </span>
                    </button>
                  );
                })}
              </div>
              <Button
                variant="primary"
                size="lg"
                disabled={!view.present || blocked.length > 0 || !team.length || state.guild.crowns < open.entryFee}
                why={why}
                onClick={() => actions.signUpForTournament(open.id, team)}
              >
                {state.guild.crowns < open.entryFee ? `Entry costs ${open.entryFee} G` : `Sign up ${team.length} (${open.entryFee} G)`}
              </Button>
              <p className="muted">Only fit heroes can fight. The tournament starts as soon as you sign up.</p>
            </>
          )
        ) : (
          <p className="arena-line">
            {view.next ? `“The ${view.next.definition.name} opens for sign-up ${inWeeks(view.next.days)} (${when(view.next.date)}), for two weeks.”` : '“Nothing to sign up for here at your status.”'}
          </p>
        )}
      </Panel>
      <Panel title="Other tournaments you can enter" eyebrow="Sign up at each town's arena">
        <ul className="arena-others">
          {view.others.map((item) => (
            <li key={item.definition.id}>
              <strong>{item.definition.name}</strong>
              <small>
                {item.definition.circuit} · {item.town} · {item.openNow ? `open now, ${item.closesIn} day${item.closesIn === 1 ? '' : 's'} left` : `opens ${when(item.date)} (${inWeeks(item.days)})`} · {item.rules.join(' · ')}
              </small>
              {item.openNow ? (
                <Badge tone="gold">Open · {item.travelDays ? `${item.travelDays} day${item.travelDays === 1 ? '' : 's'} away` : 'here'}</Badge>
              ) : (
                <em>Sign up at the arena in {item.town}.</em>
              )}
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}

function HistoryBoard({ state, navigate }) {
  const hasHerald = locationBuildings(state.world?.currentLocationId || 'dunmere').includes('herald');
  return (
    <>
      <RollOfChampions state={state} locationId={state.world?.currentLocationId || 'dunmere'} />
      {hasHerald ? (
        <Button onClick={() => navigate({ view: 'town', building: 'herald', tab: 'tournaments' })}>The full regional almanac at the Herald ›</Button>
      ) : (
        <p className="muted">The Herald in Dunmere or Ironford keeps the full regional almanac.</p>
      )}
    </>
  );
}

/** The arena's three places. `initialSpot` opens one (the registrar, referee or history board was tapped). */
export default function ArenaScreen({ state, actions, navigate, locationId, initialSpot = null }) {
  const view = getArenaView(state, locationId);
  const [spot, setSpot] = useState(initialSpot || (view.active ? 'ground' : null));
  useEffect(() => {
    if (initialSpot === 'board') actions.readHistoryBoard(view.history.map((item) => TOURNAMENT_LORE[item.definition.id]).filter(Boolean));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="arena-room">
      <nav className="arena-spots" aria-label={`${view.location.name} arena`}>
        <Spot
          id="ground"
          active={spot === 'ground'}
          asset="portrait.arena.referee"
          title="Fighting ground"
          text={view.active ? `${view.active.name}: your bout is ready` : view.next ? `Next: ${view.next.definition.name} ${inWeeks(view.next.days)}` : 'Quiet today'}
          badge={view.active ? 'Bout ready' : null}
          onClick={() => setSpot('ground')}
        />
        <Spot
          id="registrar"
          active={spot === 'registrar'}
          asset="portrait.arena.registrar"
          title="Sign-up desk"
          text={view.open?.signup ? 'Signed up' : view.open ? `${view.open.name}: sign-ups open` : 'Entries and the tournament calendar'}
          badge={view.open && !view.open.signup ? 'Open' : null}
          onClick={() => setSpot('registrar')}
        />
        <Spot
          id="board"
          active={spot === 'board'}
          asset="trophy.title"
          title="History board"
          text="Champions, records and your best results"
          onClick={() => {
            setSpot('board');
            actions.readHistoryBoard(view.history.map((item) => TOURNAMENT_LORE[item.definition.id]).filter(Boolean));
          }}
        />
      </nav>
      {spot === 'ground' ? <FightingGround state={state} view={view} actions={actions} /> : null}
      {spot === 'registrar' ? <Registrar state={state} view={view} actions={actions} /> : null}
      {spot === 'board' ? <HistoryBoard state={state} navigate={navigate} /> : null}
      {!spot ? <p className="muted arena-hint">Tap the fighting ground, the sign-up desk or the history board.</p> : null}
    </div>
  );
}
