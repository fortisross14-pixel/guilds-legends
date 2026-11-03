import React, { useState } from 'react';
import { MONTHS } from '../data/content.js';
import { locationBuildings } from '../data/world.js';
import { sliceHides } from '../data/slice.js';
import { getArenaView, getHero, getStoryView } from '../game/engine.js';
import { Badge, Button, EmptyState, HeroPortrait, Panel, PrimalBadge } from '../components/UI.jsx';
import Asset from '../components/Asset.jsx';
import GuildChampionships from './GuildChampionships.jsx';

// A town's arena (Phase 6a): an interior with three spots to tap. The fighting
// ground (referee), the sign-up desk (registrar) and the history board.

const when = (date) => `${MONTHS[date.month]} ${date.year}, week ${date.week + 1}`;
const inWeeks = (days) => (days <= 0 ? 'today' : days < 7 ? `in ${days} day${days === 1 ? '' : 's'}` : `in ${Math.round(days / 7)} week${Math.round(days / 7) === 1 ? '' : 's'}`);
const ordinal = (finish) => (finish === 1 ? 'Champion' : finish === 2 ? 'Runner-up' : `Top ${finish}`);

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
  if (view.active && view.player) {
    const round = view.active.currentRoundSize === 16 ? 'Round of 16' : view.active.currentRoundSize === 8 ? 'Quarterfinal' : view.active.currentRoundSize === 4 ? 'Semifinal' : 'Final';
    return (
      <Panel title={`${view.active.name}: ${round}`} eyebrow={`Referee · seed #${view.active.initialSeed} · expected top ${view.active.expectedFinish}`}>
        <div className="versus-card">
          <button onClick={() => actions.openHero(view.player.id)}>
            <HeroPortrait hero={view.player} size="lg" />
            <strong>{view.player.name}</strong>
            <small>
              Lv {view.player.level} · fatigue {view.player.fatigue}
            </small>
            <PrimalBadge primal={view.player.primal} />
          </button>
          <span>VS</span>
          {view.opponent ? (
            <button onClick={() => actions.openHero(view.opponent.id)}>
              <HeroPortrait hero={view.opponent} size="lg" />
              <strong>{view.opponent.name}</strong>
              <small>
                {view.opponent.guildId ? state.rivals.find((guild) => guild.id === view.opponent.guildId)?.name : 'Free agent'} · Lv {view.opponent.level}
              </small>
              <PrimalBadge primal={view.opponent.primal} />
            </button>
          ) : (
            <div>Opponent pending</div>
          )}
        </div>
        <p className="arena-line">“Fighters ready? Then step into the ring.”</p>
        <Button variant="primary" size="lg" disabled={Boolean(state.activeEncounter)} onClick={() => actions.startHeroCombat(view.active.id)}>
          {state.activeEncounter?.sourceId === view.active.id ? 'Bout in progress' : 'Start the next bout'}
        </Button>
        <div className="live-field">
          {view.active.activeEntrants.map((id) => {
            const hero = getHero(state, id);
            return hero ? (
              <button key={id} className={id === view.player.id ? 'is-player' : ''} onClick={() => actions.openHero(id)}>
                <HeroPortrait hero={hero} size="xs" />
                <div>
                  <strong>{hero.name}</strong>
                  <small>
                    Lv {hero.level} · {hero.classId}
                  </small>
                </div>
              </button>
            ) : null;
          })}
        </div>
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
      {view.next?.signup ? <p className="muted">Your guild is signed up. Be here on {when(view.next.date)}, day 1.</p> : null}
    </Panel>
  );
}

function Registrar({ state, view, actions, navigate }) {
  const [heroId, setHeroId] = useState('');
  const open = view.open;
  const chosen = view.heroes.find((row) => row.hero.id === heroId) || view.heroes.find((row) => row.meets) || null;
  return (
    <>
      <Panel title="Sign-up desk" eyebrow="Registrar">
        {open ? (
          open.signup ? (
            <p className="arena-line">
              “You're on the list: {getHero(state, open.signup.heroId)?.name || 'your entrant'} fights in the {open.name}. Be here on {when({ year: open.year, month: open.month, week: open.week || 0 })}. If you're not, the name is
              struck and the fee is kept.”
            </p>
          ) : (
            <>
              <p className="arena-line">
                “The {open.name} starts {inWeeks(view.next.days)} ({when(view.next.date)}). Entry is {open.entryFee} gold; the purse is {open.purse} gold.”
              </p>
              <p>
                <b>Entry rules:</b> {view.next.rules.join(' · ')}
              </p>
              <div className="arena-entrants" role="radiogroup" aria-label="Who enters">
                {view.heroes.map((row) => (
                  <button
                    key={row.hero.id}
                    role="radio"
                    aria-checked={chosen?.hero.id === row.hero.id}
                    className={`arena-entrant ${chosen?.hero.id === row.hero.id ? 'is-selected' : ''} ${row.meets ? '' : 'is-blocked'}`}
                    disabled={!row.meets}
                    onClick={() => setHeroId(row.hero.id)}
                  >
                    <HeroPortrait hero={row.hero} size="xs" showStatus={false} />
                    <span>
                      <strong>{row.hero.name}</strong>
                      <small>
                        Lv {row.hero.level} {row.hero.classId}
                        {row.meets ? (row.hero.status !== 'available' ? ' · busy now' : '') : ` · ${row.access.checks.filter((check) => !check.met).map((check) => `${check.label} ${check.target}`).join(', ')}`}
                      </small>
                    </span>
                  </button>
                ))}
              </div>
              <Button variant="primary" size="lg" disabled={!chosen?.meets || state.guild.crowns < open.entryFee || !view.present} onClick={() => actions.signUpForTournament(open.id, chosen.hero.id)}>
                {state.guild.crowns < open.entryFee ? `Entry costs ${open.entryFee} G` : `Sign up ${chosen?.hero.name || ''} (${open.entryFee} G)`}
              </Button>
              <small className="muted">The entrant must be fit and the guild in {view.location.name} on the start day, or it's a forfeit.</small>
            </>
          )
        ) : (
          <p className="arena-line">
            {view.next ? `“Sign-ups for the ${view.next.definition.name} open when the ${view.next.date.year} calendar is published.”` : '“Nothing to sign up for here.”'}
          </p>
        )}
      </Panel>
      <Panel title="Other regional tournaments" eyebrow="Information only: sign up at each town's arena">
        <ul className="arena-others">
          {view.others.map((item) => (
            <li key={item.definition.id}>
              <strong>{item.definition.name}</strong>
              <small>
                {item.town} · {when(item.date)} ({inWeeks(item.days)}) · {item.rules.join(' · ')}
              </small>
              {item.signup ? (
                <Badge tone="gold">
                  Signed up · {item.travelDays ? `${item.travelDays} day${item.travelDays === 1 ? '' : 's'} from here` : 'you are there'}
                </Badge>
              ) : (
                <em>Sign up at the arena in {item.town}.</em>
              )}
            </li>
          ))}
        </ul>
      </Panel>
      {!sliceHides('guildChampionships') ? <GuildChampionships state={state} actions={actions} navigate={navigate} /> : null}
    </>
  );
}

function HistoryBoard({ state, view, actions, navigate }) {
  const hasHerald = locationBuildings(state.world?.currentLocationId || 'dunmere').includes('herald');
  return (
    <>
      {view.history.map((item) => (
        <Panel key={item.definition.id} title={item.definition.name} eyebrow={`History board · ${item.definition.trophy}`}>
          <div className="arena-history">
            <section>
              <h3>Champions by year</h3>
              <ul>
                {item.winners.map((winner, index) => (
                  <li key={`${winner.year}-${index}`}>
                    <b className="num">{winner.year}</b> {winner.heroName || winner.guildName}
                    {winner.guildName && winner.heroName ? <small> · {winner.guildName}</small> : null}
                  </li>
                ))}
                {!item.winners.length ? <li className="muted">No champions recorded.</li> : null}
              </ul>
            </section>
            <section>
              <h3>Title record</h3>
              <p>
                {item.record?.recordHolderName || '—'} · {item.record?.recordWins || 0} titles
              </p>
              <h3>Repeat winners</h3>
              <p>{item.repeat.length ? item.repeat.map((row) => `${row.name} (${row.count})`).join(', ') : 'None yet.'}</p>
              <h3>Your best</h3>
              {item.best ? (
                <Button size="sm" onClick={() => actions.openReport({ kind: 'tournament', id: item.best.id })}>
                  {ordinal(item.best.finish)} in {item.best.year} ({item.best.hero}) ›
                </Button>
              ) : (
                <p className="muted">The guild has not fought here yet.</p>
              )}
            </section>
          </div>
        </Panel>
      ))}
      {!view.history.length ? <EmptyState icon="♛" title="An empty board" text="No tournament has been held here." /> : null}
      {hasHerald ? (
        <Button onClick={() => navigate({ view: 'town', building: 'herald', tab: 'tournaments' })}>The full regional almanac at the Herald ›</Button>
      ) : (
        <p className="muted">The Herald in Dunmere or Ironford keeps the full regional almanac.</p>
      )}
    </>
  );
}

export default function ArenaScreen({ state, actions, navigate, locationId }) {
  const view = getArenaView(state, locationId);
  const [spot, setSpot] = useState(view.active ? 'ground' : null);
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
          text={view.open?.signup ? 'Signed up' : view.open ? `${view.open.name}: sign-ups open` : 'Entries and the regional calendar'}
          badge={view.open && !view.open.signup ? 'Open' : null}
          onClick={() => setSpot('registrar')}
        />
        <Spot id="board" active={spot === 'board'} asset="trophy.title" title="History board" text="Champions, records and your best results" onClick={() => setSpot('board')} />
      </nav>
      {spot === 'ground' ? <FightingGround state={state} view={view} actions={actions} /> : null}
      {spot === 'registrar' ? <Registrar state={state} view={view} actions={actions} navigate={navigate} /> : null}
      {spot === 'board' ? <HistoryBoard state={state} view={view} actions={actions} navigate={navigate} /> : null}
      {!spot ? <p className="muted arena-hint">Tap the fighting ground, the sign-up desk or the history board.</p> : null}
    </div>
  );
}
