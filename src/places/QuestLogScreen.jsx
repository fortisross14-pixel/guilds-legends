import React from 'react';
import { LOCATION_BY_ID } from '../data/world.js';
import { getCalendarEntries, getHero, getLivingHistory, getPromotionRequirement, getStoryView } from '../game/engine.js';
import { EmptyState, Panel, ProgressBar } from '../components/UI.jsx';

// Active contracts, open promises and current objectives in one place.
export default function QuestLogScreen({ state, navigate }) {
  const promises = state.heroes
    .filter((hero) => !['dead', 'retired'].includes(hero.status))
    .flatMap((hero) => (hero.promises || []).filter((promise) => promise.status === 'active').map((promise) => ({ hero, promise })));
  const goals = (state.goals || []).filter((goal) => !goal.completed).slice(0, 4);
  const promotion = getPromotionRequirement(state);
  const locationLeads = Object.entries(state.world?.knowledge?.sources || {}).map(([locationId, source]) => ({ locationId, source }));
  const eventLeads = getCalendarEntries(state, 12).filter((entry) => entry.source);
  const livingHistory = getLivingHistory(state);

  const story = getStoryView(state);
  return (
    <div className="quest-log">
      <Panel
        title="The Lantern in the Blackwood"
        eyebrow={story.done ? 'Complete' : story.started ? `Chapter ${story.step + 1} of ${story.total}` : 'Not begun'}
      >
        {story.done ? (
          <p className="quest-row">
            <strong>{story.honorific}</strong> <small>Perk: {story.choice?.perk}</small>
          </p>
        ) : story.started ? (
          <button className="quest-row" onClick={() => story.pin && navigate({ view: 'map', pin: story.pin })}>
            <strong>{story.posted ? story.posted.title : story.beat?.title}</strong>
            <small>
              {story.posted ? `Special contract at the Notice Board in ${story.posted.locationName}` : 'The next lead will turn up in a few months.'}
            </small>
            {story.pin ? <span className="quest-row__map">Show on map 📍</span> : null}
          </button>
        ) : (
          <p className="muted">Rumors about the old guild will reach you soon.</p>
        )}
      </Panel>
      {livingHistory.highlights.length ? (
        <Panel title="What the world remembers" eyebrow="Recent consequences">
          {livingHistory.highlights.map((item, index) => (
            <p key={`${item.kind}-${index}`} className={`quest-row quest-row--${item.tone}`}>
              <strong>{item.title}</strong>
              <small>{item.text}</small>
            </p>
          ))}
        </Panel>
      ) : null}
      {locationLeads.length || eventLeads.length ? (
        <Panel title="Rumors and leads" eyebrow="What the guild has heard">
          {locationLeads.map(({ locationId, source }) => (
            <button key={locationId} className="quest-row" onClick={() => navigate({ view: 'map', pin: locationId })}>
              <strong>{LOCATION_BY_ID[locationId]?.name || 'Unmarked destination'}</strong>
              <small>{source.note}</small>
              <span className="quest-row__map">Heard from {source.source} · Show on map</span>
            </button>
          ))}
          {eventLeads.map((entry) => (
            <p key={`${entry.kind}-${entry.id}`} className="quest-row">
              <strong>{entry.title}</strong>
              <small>{entry.source.note}</small>
              <span className="quest-row__map">Heard from {entry.source.source}</span>
            </p>
          ))}
        </Panel>
      ) : null}
      {(state.activeSideJobs || []).length || state.wager ? (
        <Panel title="Side jobs and wagers" eyebrow="Short tasks">
          {(state.activeSideJobs || []).map((job) => (
            <p key={job.id} className="quest-row">
              <strong>{job.title}</strong> <small>{job.heroIds.map((id) => getHero(state, id)?.name).join(', ')} · back next week</small>
            </p>
          ))}
          {state.wager ? (
            <p className="quest-row">
              <strong>Wager with {state.wager.rivalName}</strong>{' '}
              <small>
                Finish a {state.wager.family} contract to win {state.wager.gold} gold
              </small>
            </p>
          ) : null}
        </Panel>
      ) : null}
      <Panel title="Active contracts" eyebrow={`${state.activeMissions.length} compan${state.activeMissions.length === 1 ? 'y' : 'ies'} in the field`}>
        {state.activeMissions.length ? (
          state.activeMissions.map((mission) => (
            <button key={mission.id} className="quest-row" onClick={() => navigate({ view: 'map', pin: mission.locationId })}>
              <strong>{mission.title}</strong>
              <small>
                {mission.locationName} · {mission.assignments.map((assignment) => getHero(state, assignment.heroId)?.name).join(', ')} ·{' '}
                {mission.remaining > 0 ? `${mission.remaining} week${mission.remaining === 1 ? '' : 's'} remaining` : 'returning now'}
              </small>
              <span className="quest-row__map">Show on map 📍</span>
            </button>
          ))
        ) : (
          <EmptyState icon="⌖" title="No contracts in progress" text="Take one at a Notice Board." />
        )}
      </Panel>
      <Panel title="Promises" eyebrow="Keep them to protect loyalty">
        {promises.length ? (
          promises.map(({ hero, promise }) => (
            <p key={promise.id} className="quest-row">
              <strong>{hero.name}</strong>{' '}
              <small>
                {promise.label} · due {promise.dueLabel}
              </small>
            </p>
          ))
        ) : (
          <p className="muted">No open promises.</p>
        )}
      </Panel>
      <Panel title="Objectives" eyebrow="Goals and the next promotion">
        {goals.map((goal) => (
          <p key={goal.id} className="quest-row">
            <strong>{goal.title}</strong> <small>{goal.description}</small>
          </p>
        ))}
        {promotion ? (
          <div className="quest-row">
            <strong>Promotion to {promotion.target.id}</strong>
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
          </div>
        ) : null}
      </Panel>
    </div>
  );
}
