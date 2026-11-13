import React, { useEffect } from 'react';
import { LOCATION_BY_ID } from '../data/world.js';
import { STORY_HEROES } from '../data/story.js';
import { activeContracts, contractDaysLeft, contractPlace, contractSteps, firstStep, getConnectionsView, getHallView, getHero, getStoryView, hasHall, knownMissions, nextUpgrade } from '../game/engine.js';
import { Button, EmptyState, RiskPips } from '../components/UI.jsx';
import Icon, { STATUS_ICONS } from '../components/Icon.jsx';
import HireGate from '../hud/HireGate.jsx';
import CalendarScreen from './CalendarScreen.jsx';

// The Journal (World orb): what is happening and what comes next, in one place.
// Now (who is away, who is hurt, what is being built, the tournament), Quests
// (the story, side quests, guild tasks, evidence), Contracts (the same list as
// the notice board) and the Calendar. One line per item; details on tap.

export const JOURNAL_TABS = [
  { id: 'now', label: 'Now', icon: 'hourglass' },
  { id: 'quests', label: 'Quests', icon: 'quill' },
  { id: 'contracts', label: 'Contracts', icon: 'scroll' },
  { id: 'calendar', label: 'Calendar', icon: 'calendar' },
];

const place = (id) => LOCATION_BY_ID[id === 'hall' ? 'dunmere' : id]?.name || id;
const weeks = (count) => (count > 0 ? `fit in ${Math.ceil(count * 7)}d` : 'fit now');

function Row({ icon, title, meta, onClick, children }) {
  const body = (
    <>
      <Icon name={icon} size={18} />
      <span className="journal-row__text">
        <strong>{title}</strong>
        {meta ? <small>{meta}</small> : null}
      </span>
      {children}
    </>
  );
  return onClick ? (
    <button type="button" className="journal-row" onClick={onClick}>
      {body}
    </button>
  ) : (
    <div className="journal-row">{body}</div>
  );
}

function Block({ title, count, children }) {
  return (
    <section className="journal-block">
      <h3>
        {title}
        {typeof count === 'number' ? <small className="num">{count}</small> : null}
      </h3>
      {children}
    </section>
  );
}

function MapLink({ locationId, navigate }) {
  const id = locationId === 'hall' ? 'dunmere' : locationId;
  if (!id || !LOCATION_BY_ID[id]) return null;
  return (
    <button type="button" className="icon-button icon-button--sm" aria-label={`Show ${place(id)} on the map`} onClick={() => navigate({ view: 'map', pin: id })}>
      <Icon name="pin" size={16} />
    </button>
  );
}

// ---------------------------------------------------------------- Now

function NowTab({ state, actions, navigate }) {
  useEffect(() => {
    if (state.newsUnread) actions.markNewsRead();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const working = activeContracts(state);
  const jobs = state.activeSideJobs || [];
  const injured = state.heroes.filter((hero) => hero.status === 'injured');
  const hall = getHallView(state);
  const building = hall.construction ? [{ id: 'room', name: hall.construction.name, left: hall.construction.weeksLeft }] : [];
  if (hall.expansion) building.push({ id: 'land', name: hall.expansion.land, left: hall.expansion.weeksLeft });
  const tournaments = (state.tournaments || []).filter((item) => item.signup && ['registration', 'active'].includes(item.status));
  const news = (state.news || []).slice(0, 4);
  const quiet = !working.length && !jobs.length && !injured.length && !building.length && !tournaments.length;
  return (
    <div className="journal">
      {quiet ? <p className="journal__quiet">All quiet. Everyone is home and well.</p> : null}
      {working.length ? (
        <Block title="Contracts" count={working.length}>
          {working.map((mission) => (
            <Row key={mission.id} icon={mission.site.status === 'ready' ? 'check' : 'flag'} title={mission.title} meta={firstStep(state, mission)?.text || contractPlace(mission).name}>
              <MapLink locationId={mission.locationId} navigate={navigate} />
            </Row>
          ))}
        </Block>
      ) : null}
      {jobs.length ? (
        <Block title="Away" count={jobs.length}>
          {jobs.map((job) => (
            <Row key={job.id} icon="hammer" title={job.title} meta={`${job.heroIds.map((id) => getHero(state, id)?.name).filter(Boolean).join(', ')} · 1w`} />
          ))}
        </Block>
      ) : null}
      {injured.length ? (
        <Block title="Injured" count={injured.length}>
          {injured.map((hero) => (
            <Row key={hero.id} icon={STATUS_ICONS.injured} title={hero.name} meta={`${hero.injury || 'Hurt'} · ${weeks(hero.injuryWeeks)}`} onClick={() => actions.openHero(hero.id)} />
          ))}
        </Block>
      ) : null}
      {building.length ? (
        <Block title="Building">
          {building.map((item) => (
            <Row key={item.id} icon="hammer" title={item.name} meta={weeks(item.left)} onClick={() => navigate('hall')} />
          ))}
        </Block>
      ) : null}
      {tournaments.length ? (
        <Block title="Tournament">
          {tournaments.map((item) => (
            <Row key={item.id} icon="crown" title={item.name} meta={item.status === 'active' ? 'In progress' : `${place(item.locationId)} · signed up`} onClick={() => navigate('arena')} />
          ))}
        </Block>
      ) : null}
      {news.length ? (
        <Block title="News">
          {news.map((item) => (
            <details key={item.id} className="journal-details">
              <summary>
                <Icon name="letter" size={16} />
                <span>{item.title}</span>
              </summary>
              <p>{item.text}</p>
            </details>
          ))}
        </Block>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------- Quests

function goStep(state, story, actions, navigate) {
  const step = story.active?.current;
  if (!step) return;
  const here = (state.world?.currentLocationId || 'dunmere') === (step.at === 'hall' ? 'dunmere' : step.at);
  if (step.canTalk) return actions.playStoryScene(story.active.id);
  if (step.canDuel) return actions.startStoryDuel(story.active.id);
  if (!here && step.at) return navigate({ view: 'map', pin: step.at === 'hall' ? 'dunmere' : step.at });
  if (step.kind === 'contract') return navigate('missions');
  return navigate('town');
}

function sideEntries(state, story) {
  const entries = [];
  const hero = (id) => state.heroes.find((item) => item.storyId === id && !['dead', 'retired'].includes(item.status));
  const done = (id) => story.missions.find((mission) => mission.id === id)?.status === 'done';
  if (hero('nessa')) {
    entries.push({
      id: 'nessa',
      title: 'Tobin’s trail',
      text: done('m8') ? 'The deep Blackwood waits.' : done('m5') ? 'Someone else must have seen Tobin.' : 'Nessa is looking for someone.',
      locationId: done('m8') ? 'dunmere' : 'greenhollow',
      progress: [done('m5'), done('m6'), done('m8')].filter(Boolean).length,
      target: 3,
    });
  }
  const bram = hero('bram');
  if (bram) entries.push({ id: 'bram', title: 'A title for Bram', text: 'Win a tournament with Bram.', locationId: 'dunmere', progress: Math.min(1, bram.career?.individualTitles || 0), target: 1 });
  if (hero('wren')) entries.push({ id: 'wren', title: 'The way back in', text: `${STORY_HEROES.wren.name}’s promise (Chapter 2).` });
  getConnectionsView(state)
    .filter((patron) => patron.next)
    .forEach((patron) => entries.push({ id: `patron-${patron.id}`, title: `${patron.short || patron.name}: ${patron.next.name}`, text: `${patron.next.toGo} standing to go`, locationId: patron.home }));
  state.heroes
    .filter((item) => !['dead', 'retired'].includes(item.status))
    .flatMap((item) => (item.promises || []).filter((promise) => promise.status === 'active').map((promise) => ({ hero: item, promise })))
    .forEach(({ hero: item, promise }) => entries.push({ id: promise.id, title: `Promise to ${item.name}`, text: `${promise.label} · ${promise.dueLabel}` }));
  if (state.wager) entries.push({ id: 'wager', title: `Wager: ${state.wager.rivalName}`, text: `A ${state.wager.family} contract · ${state.wager.gold} gold` });
  Object.entries(state.world?.knowledge?.sources || {}).forEach(([locationId, source]) => entries.push({ id: `lead-${locationId}`, title: `Lead: ${place(locationId)}`, text: `From ${source.source}`, locationId }));
  return entries;
}

function QuestsTab({ state, actions, navigate }) {
  const story = getStoryView(state);
  const { active, next } = story;
  const side = sideEntries(state, story);
  const upgrade = nextUpgrade(state);
  const found = story.evidence.filter((item) => item.found);
  const done = story.missions.filter((mission) => mission.status === 'done');
  const step = active?.current;
  // Clues: what the lead has turned up so far (its finished steps), newest last.
  const clues = active ? active.steps.filter((item) => item.done && !item.skipped) : [];
  const contracts = activeContracts(state).filter((mission) => !mission.story);
  return (
    <div className="journal">
      {active ? (
        <article className="quest-card">
          <header>
            <span className="eyebrow num">Primary · {active.number}</span>
            <h3>{active.title}</h3>
            <p>{active.goal || active.summary}</p>
          </header>
          {clues.length ? (
            <ul className="quest-card__clues" aria-label="Found so far">
              {clues.map((item) => (
                <li key={item.id}>
                  <Icon name="check" size={14} tone="plain" /> {item.text}
                </li>
              ))}
            </ul>
          ) : null}
          {step ? (
            <p className="quest-card__step">
              <Icon name="play" size={14} tone="plain" /> {step.text}
            </p>
          ) : null}
          <div className="quest-card__actions">
            <Button size="sm" variant="primary" disabled={step?.canDuel && Boolean(state.activeEncounter)} onClick={() => goStep(state, story, actions, navigate)}>
              Go
            </Button>
            {active.pin ? (
              <Button size="sm" onClick={() => navigate({ view: 'map', pin: active.pin })}>
                <Icon name="pin" size={14} tone="plain" /> Show on map
              </Button>
            ) : null}
          </div>
          <details className="journal-details">
            <summary>All steps</summary>
            <ol className="quest-steps">
              {active.steps.map((item) => (
                <li key={item.id} className={item.done ? 'is-done' : item.current ? 'is-current' : ''}>
                  <span>{item.done ? <Icon name="check" size={14} tone="plain" /> : item.current ? <Icon name="play" size={14} tone="plain" /> : '·'}</span>
                  <p>{item.text}</p>
                </li>
              ))}
            </ol>
          </details>
          <details className="journal-details">
            <summary>How it opened</summary>
            <p>{active.summary}</p>
            <p>{active.gate.text}</p>
          </details>
        </article>
      ) : next ? (
        <article className="quest-card">
          <header>
            <span className="eyebrow num">Next · {next.number}</span>
            <h3>{next.title}</h3>
            <p>{next.goal || next.summary}</p>
          </header>
          <details className="journal-details">
            <summary>How it opens</summary>
            <p>{next.gate.text}</p>
            {next.alternatives.map((alternative) => (
              <p key={alternative.text}>Or: {alternative.text}</p>
            ))}
          </details>
        </article>
      ) : (
        <p className="journal__quiet">The story continues in a later chapter. Keep playing in the meantime.</p>
      )}
      {story.secondary.length || contracts.length || side.length ? (
        <Block title="Secondary" count={story.secondary.length + contracts.length + side.length}>
          {story.secondary.map((mission) => (
            <Row key={mission.id} icon="flag" title={mission.title} meta={mission.current?.text || mission.goal}>
              <MapLink locationId={mission.pin} navigate={navigate} />
            </Row>
          ))}
          {contracts.map((mission) => (
            <Row key={mission.id} icon="scroll" title={mission.title} meta={`${contractPlace(mission).name}${mission.giverName ? ` · for ${mission.giverName}` : ''}`} onClick={() => navigate({ section: 'journal', tab: 'contracts' })} />
          ))}
          {side.map((entry) => (
            <Row key={entry.id} icon="quill" title={entry.title} meta={entry.text}>
              {typeof entry.progress === 'number' ? <span className="journal-row__count num">{entry.progress}/{entry.target}</span> : null}
              <MapLink locationId={entry.locationId} navigate={navigate} />
            </Row>
          ))}
        </Block>
      ) : null}
      {found.length || story.prologue === 'done' ? (
        <Block title="Evidence" count={found.length}>
          {found.length ? (
            found.map((item) => <Row key={item.id} icon="check" title={item.name} />)
          ) : (
            <p className="journal__quiet">Nothing yet.</p>
          )}
        </Block>
      ) : null}
      {!hasHall(state) || upgrade ? (
      <Block title="Guild">
        <HireGate state={state} />
        {upgrade ? (
          <Row icon="castle" title={upgrade.label} onClick={() => (upgrade.action?.kind === 'story' ? actions.playStoryScene('m1') : navigate({ section: 'hall', tab: upgrade.action?.roomId ? 'build' : null }))} />
        ) : null}
      </Block>
      ) : null}
      {done.length ? (
        <details className="journal-details">
          <summary>Done ({done.length})</summary>
          {done.map((mission) => (
            <p key={mission.id}>
              <Icon name="check" size={14} tone="plain" /> {mission.number}. {mission.title}
            </p>
          ))}
        </details>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------- Contracts

/** One contract you are working on: its steps (done, now, later, extras), its deadline, and Go. */
function ContractSteps({ state, mission, navigate }) {
  const days = contractDaysLeft(state, mission);
  return (
    <article className="journal-contract">
      <header>
        <strong>{mission.title}</strong>
        <small>
          {contractPlace(mission).name}
          {days !== null ? ` · ${days > 0 ? `${days} day${days === 1 ? '' : 's'} left` : 'last day'}` : ''}
        </small>
      </header>
      <ol className="contract-steps">
        {contractSteps(state, mission).map((step) => (
          <li key={step.id} className={`${step.done ? 'is-done' : ''} ${step.open ? 'is-open' : ''} ${step.optional ? 'is-optional' : ''}`}>
            <Icon name={step.done ? 'check' : step.optional ? 'star' : 'dot'} size={14} />
            {step.text}
            {step.optional ? <small> (extra)</small> : null}
          </li>
        ))}
      </ol>
      <MapLink locationId={mission.locationId} navigate={navigate} />
    </article>
  );
}

function ContractsTab({ state, navigate }) {
  const working = activeContracts(state);
  const board = knownMissions(state).filter((mission) => !mission.site);
  const here = state.world?.currentLocationId || 'dunmere';
  if (!working.length && !board.length) return <EmptyState icon="scroll" title="No contracts" text="Talk to people in town: they have work." />;
  return (
    <div className="journal">
      {working.length ? (
        <Block title="Working on" count={working.length}>
          {working.map((mission) => (
            <ContractSteps key={mission.id} state={state} mission={mission} navigate={navigate} />
          ))}
        </Block>
      ) : null}
      {board.length ? (
        <Block title="On the board" count={board.length}>
          {board.map((mission) => (
            <Row key={mission.id} icon={mission.story ? 'book' : 'scroll'} title={mission.title} meta={`${place(mission.locationId)} · ${mission.reward} gold`} onClick={mission.locationId === here ? () => navigate('missions') : () => navigate({ view: 'map', pin: mission.locationId })}>
              <RiskPips risk={mission.risk} />
            </Row>
          ))}
        </Block>
      ) : null}
    </div>
  );
}

/** The Journal body; the section owns the tabs (JOURNAL_TABS). */
export default function JournalScreen({ state, actions, navigate, tab = 'now' }) {
  if (tab === 'quests') return <QuestsTab state={state} actions={actions} navigate={navigate} />;
  if (tab === 'contracts') return <ContractsTab state={state} navigate={navigate} />;
  if (tab === 'calendar') return <CalendarScreen state={state} actions={actions} />;
  return <NowTab state={state} actions={actions} navigate={navigate} />;
}

