import React, { useState } from 'react';
import { LOCATION_BY_ID } from '../data/world.js';
import { ACTS, CHAPTERS, STORY_HEROES } from '../data/story.js';
import { getConnectionsView, getHero, getPromotionRequirement, getStoryView, nextUpgrade } from '../game/engine.js';
import { Badge, Button, EmptyState, Panel, ProgressBar, Tabs } from '../components/UI.jsx';

// The Quest Log: Main (the story, with gates, routes and evidence), Side (story
// recruits, patrons, promises, side jobs and leads), Guild (the tutorial, then
// goals and the next upgrade) and Done. Every entry with a place can be shown
// on the map. The main quest marker (map and towns) can be hidden here.

const place = (id) => LOCATION_BY_ID[id]?.name || (id === 'hall' ? 'your Guild Hall' : id);

function MapButton({ locationId, navigate }) {
  if (!locationId || !LOCATION_BY_ID[locationId === 'hall' ? 'dunmere' : locationId]) return null;
  return (
    <button type="button" className="quest-row__map" onClick={() => navigate({ view: 'map', pin: locationId === 'hall' ? 'dunmere' : locationId })}>
      Show on map 📍
    </button>
  );
}

function StepList({ mission, state, actions, navigate }) {
  return (
    <ol className="quest-steps">
      {mission.steps.map((step) => (
        <li key={step.id} className={step.done ? 'is-done' : step.current ? 'is-current' : ''}>
          <span>{step.done ? (step.skipped ? '↷' : '✓') : step.current ? '▶' : '·'}</span>
          <div>
            <p>{step.text}</p>
            {step.current && step.hint ? <small>{step.hint}</small> : null}
            {step.current ? (
              <div className="quest-steps__actions">
                {step.canTalk ? (
                  <Button size="sm" variant="primary" onClick={() => actions.playStoryScene(mission.id)}>
                    Talk now
                  </Button>
                ) : null}
                {step.canDuel ? (
                  <Button size="sm" variant="primary" disabled={Boolean(state.activeEncounter)} onClick={() => actions.startStoryDuel(mission.id)}>
                    Start the duel
                  </Button>
                ) : null}
                {step.kind === 'contract' && (state.world?.currentLocationId || 'dunmere') === step.at ? (
                  <Button size="sm" onClick={() => navigate('missions')}>
                    Notice Board
                  </Button>
                ) : null}
                {!step.here && step.at ? <small className="muted">At {place(step.at)}.</small> : null}
                <MapButton locationId={step.at} navigate={navigate} />
              </div>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

function MainTab({ state, actions, navigate, story }) {
  const { active, next } = story;
  return (
    <>
      {active ? (
        <Panel title={`${active.number}. ${active.title}`} eyebrow={`${ACTS[active.act]?.title} · ${place(active.locationId)}`}>
          <p>{active.summary}</p>
          <StepList mission={active} state={state} actions={actions} navigate={navigate} />
          <details className="quest-gate">
            <summary>How this mission opened</summary>
            <p>
              <b>Gate:</b> {active.gate.text}
            </p>
            {active.alternatives.map((alternative) => (
              <p key={alternative.text}>
                <b>Or:</b> {alternative.text}
              </p>
            ))}
          </details>
        </Panel>
      ) : next ? (
        <Panel title={`Next: ${next.number}. ${next.title}`} eyebrow="Not open yet">
          <p>{next.summary}</p>
          <ul className="quest-gates">
            <li>
              <b>Gate:</b> {next.gate.text}
            </li>
            {next.alternatives.map((alternative) => (
              <li key={alternative.text}>
                <b>Alternative:</b> {alternative.text}
              </li>
            ))}
          </ul>
          <MapButton locationId={next.locationId} navigate={navigate} />
        </Panel>
      ) : (
        <Panel title={CHAPTERS[1].title} eyebrow="Complete">
          <p>Chapter 1 is over. {CHAPTERS[2].teaser}</p>
        </Panel>
      )}
      <Panel title="Evidence" eyebrow="Against Garrick Thorne">
        <ul className="quest-evidence">
          {story.evidence.map((item) => (
            <li key={item.id} className={item.found ? 'is-found' : ''}>
              <strong>{item.found ? '✓' : '○'} {item.name}</strong>
              <small>{item.found ? item.text : item.from}</small>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title="Chapter 2: The Crown Must Fall" eyebrow="Locked">
        <ul className="quest-gates">
          {story.missions
            .filter((mission) => mission.chapter === 2)
            .map((mission) => (
              <li key={mission.id} className="is-locked">
                {mission.number}. {mission.title}
              </li>
            ))}
        </ul>
      </Panel>
    </>
  );
}

function sideEntries(state, story) {
  const entries = [];
  const hero = (id) => state.heroes.find((item) => item.storyId === id && !['dead', 'retired'].includes(item.status));
  const done = (id) => story.missions.find((mission) => mission.id === id)?.status === 'done';
  if (hero('nessa')) {
    entries.push({
      id: 'nessa',
      title: 'Tobin’s trail',
      by: STORY_HEROES.nessa.name,
      text: done('m8')
        ? 'Wren saw the Warden take Tobin. The deep Blackwood waits (Chapter 2).'
        : done('m5')
          ? 'Maren Bell stitched Tobin up after the Crownfall. Someone else must have seen him since.'
          : 'Nessa is looking for someone she won’t name yet. Follow the story to Greenhollow.',
      locationId: done('m8') ? 'dunmere' : 'greenhollow',
      progress: [done('m5'), done('m6'), done('m8')].filter(Boolean).length,
      target: 3,
    });
  }
  const bram = hero('bram');
  if (bram) {
    const titles = bram.career?.individualTitles || 0;
    entries.push({ id: 'bram', title: 'A title for Bram', by: STORY_HEROES.bram.name, text: titles ? 'Bram has his title. He won’t stop talking about it.' : 'Win any tournament with Bram as your entrant.', locationId: 'dunmere', progress: Math.min(1, titles), target: 1 });
  }
  if (hero('wren')) entries.push({ id: 'wren', title: 'The way back in', by: STORY_HEROES.wren.name, text: 'Aldric sent Wren back for help. One day, she means to keep that promise (Chapter 2).', locationId: 'dunmere' });
  getConnectionsView(state)
    .filter((patron) => patron.next)
    .forEach((patron) =>
      entries.push({ id: `patron-${patron.id}`, title: `${patron.short || patron.name}: reach ${patron.next.name}`, by: patron.rep?.name, text: `${patron.next.toGo} standing to go. ${patron.unlocks.find((unlock) => !unlock.open)?.text || ''}`, locationId: patron.home }),
    );
  state.heroes
    .filter((item) => !['dead', 'retired'].includes(item.status))
    .flatMap((item) => (item.promises || []).filter((promise) => promise.status === 'active').map((promise) => ({ hero: item, promise })))
    .forEach(({ hero: item, promise }) => entries.push({ id: promise.id, title: `Promise to ${item.name}`, text: `${promise.label} · due ${promise.dueLabel}` }));
  (state.activeSideJobs || []).forEach((job) => entries.push({ id: job.id, title: job.title, text: `${job.heroIds.map((id) => getHero(state, id)?.name).join(', ')} · back next week`, locationId: job.locationId }));
  if (state.wager) entries.push({ id: 'wager', title: `Wager with ${state.wager.rivalName}`, text: `Finish a ${state.wager.family} contract to win ${state.wager.gold} gold.` });
  Object.entries(state.world?.knowledge?.sources || {}).forEach(([locationId, source]) => entries.push({ id: `lead-${locationId}`, title: `Lead: ${place(locationId)}`, by: source.source, text: source.note, locationId }));
  return entries;
}

function SideTab({ state, navigate, story }) {
  const entries = sideEntries(state, story);
  if (!entries.length) return <EmptyState icon="✎" title="No side quests yet" text="Story recruits, patrons, promises and rumors add them here." />;
  return (
    <Panel title="Side quests" eyebrow="Recruits, patrons, promises and leads">
      {entries.map((entry) => (
        <article key={entry.id} className="quest-row">
          <strong>{entry.title}</strong>
          {entry.by ? <small>From {entry.by}</small> : null}
          <small>{entry.text}</small>
          {typeof entry.progress === 'number' ? <ProgressBar value={entry.progress} max={entry.target} compact tone="purple" /> : null}
          <MapButton locationId={entry.locationId} navigate={navigate} />
        </article>
      ))}
    </Panel>
  );
}

function GuildTab({ state, actions, navigate, story }) {
  const tutorial = story.missions.filter((mission) => mission.act === 1);
  const goals = (state.goals || []).filter((goal) => !goal.completed).slice(0, 5);
  const promotion = getPromotionRequirement(state);
  const upgrade = nextUpgrade(state);
  return (
    <>
      {story.tutorial === 'active' ? (
        <Panel title="The tutorial" eyebrow="Act I of the story">
          <ol className="quest-steps">
            {tutorial.map((mission) => (
              <li key={mission.id} className={mission.status === 'done' ? 'is-done' : mission.status === 'active' ? 'is-current' : ''}>
                <span>{mission.status === 'done' ? '✓' : mission.status === 'active' ? '▶' : mission.number}</span>
                <div>
                  <p>
                    {mission.number}. {mission.title}
                  </p>
                  {mission.status === 'active' && mission.current ? <small>{mission.current.hint || mission.current.text}</small> : null}
                </div>
              </li>
            ))}
          </ol>
        </Panel>
      ) : null}
      {upgrade ? (
        <Panel title="Next upgrade" eyebrow="The Guild Hall">
          <p className="quest-row">
            <strong>{upgrade.label}</strong>
            <small>{upgrade.text}</small>
          </p>
          <Button size="sm" onClick={() => (upgrade.action?.kind === 'story' ? actions.playStoryScene('m1') : navigate({ view: 'town', building: 'guildHall', tab: upgrade.action?.roomId ? 'build' : null }))}>
            Go
          </Button>
        </Panel>
      ) : null}
      <Panel title="Guild goals" eyebrow="Longer aims">
        {goals.map((goal) => (
          <p key={goal.id} className="quest-row">
            <strong>{goal.title}</strong> <small>{goal.description}</small>
          </p>
        ))}
        {!goals.length ? <p className="muted">Every goal of this tier is done.</p> : null}
      </Panel>
      {promotion ? (
        <Panel title={`Promotion to ${promotion.target.id}`} eyebrow="The next tier">
          {[
            ['Fame', promotion.fame],
            ['Contracts', promotion.contracts],
            ['Official rank', promotion.rank],
            ['Signature feats', promotion.feat],
            ['Years', promotion.time],
          ].map(([label, item]) => (
            <ProgressBar
              key={label}
              compact
              tone={item.met ? 'green' : 'gold'}
              value={label === 'Official rank' ? (item.met ? 1 : 0) : item.current}
              max={label === 'Official rank' ? 1 : item.target || 1}
              label={label === 'Official rank' ? `${label}: #${item.current} (need #${item.target})` : `${label}: ${item.current}/${item.target}`}
            />
          ))}
        </Panel>
      ) : null}
      <Panel title="Companies in the field" eyebrow={`${state.activeMissions.length} out`}>
        {state.activeMissions.map((mission) => (
          <article key={mission.id} className="quest-row">
            <strong>
              {mission.story ? <Badge tone="purple">Story</Badge> : null} {mission.title}
            </strong>
            <small>
              {mission.locationName} · {mission.assignments.map((assignment) => getHero(state, assignment.heroId)?.name).join(', ')} ·{' '}
              {mission.remaining > 0 ? `${mission.remaining} week${mission.remaining === 1 ? '' : 's'} left` : 'returning now'}
            </small>
            <MapButton locationId={mission.locationId} navigate={navigate} />
          </article>
        ))}
        {!state.activeMissions.length ? <p className="muted">Nobody is out on a contract.</p> : null}
      </Panel>
    </>
  );
}

function DoneTab({ state, story }) {
  const missions = story.missions.filter((mission) => mission.status === 'done');
  const goals = (state.goals || []).filter((goal) => goal.completed);
  if (!missions.length && !goals.length) return <EmptyState icon="✓" title="Nothing done yet" text="Finished story missions and goals land here." />;
  return (
    <>
      {missions.length ? (
        <Panel title="Story missions" eyebrow={`${missions.length} done`}>
          {missions.map((mission) => (
            <p key={mission.id} className="quest-row">
              <strong>
                ✓ {mission.number}. {mission.title}
              </strong>
              <small>{mission.summary}</small>
            </p>
          ))}
        </Panel>
      ) : null}
      {goals.length ? (
        <Panel title="Goals" eyebrow={`${goals.length} done`}>
          {goals.map((goal) => (
            <p key={goal.id} className="quest-row">
              <strong>✓ {goal.title}</strong> <small>{goal.description}</small>
            </p>
          ))}
        </Panel>
      ) : null}
    </>
  );
}

export default function QuestLogScreen({ state, actions, navigate }) {
  const story = getStoryView(state);
  const [tab, setTab] = useState('main');
  const marker = state.settings?.questMarker !== false;
  return (
    <div className="quest-log">
      <header className="quest-log__head">
        <Tabs
          active={tab}
          onChange={setTab}
          ariaLabel="Quest Log"
          items={[
            { id: 'main', label: 'Main', icon: '★' },
            { id: 'side', label: 'Side', icon: '✎' },
            { id: 'guild', label: 'Guild', icon: '♜' },
            { id: 'done', label: 'Done', icon: '✓' },
          ]}
        />
        <label className="quest-log__marker">
          <input type="checkbox" checked={marker} onChange={(event) => actions.updateSettings({ questMarker: event.target.checked })} />
          Show the main quest marker
        </label>
      </header>
      {tab === 'main' ? <MainTab state={state} actions={actions} navigate={navigate} story={story} /> : null}
      {tab === 'side' ? <SideTab state={state} navigate={navigate} story={story} /> : null}
      {tab === 'guild' ? <GuildTab state={state} actions={actions} navigate={navigate} story={story} /> : null}
      {tab === 'done' ? <DoneTab state={state} story={story} /> : null}
    </div>
  );
}
