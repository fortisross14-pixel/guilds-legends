import React, { useMemo, useRef, useState } from 'react';
import { getWildAreaView } from '../game/engine.js';
import { TOWNS } from '../data/towns/index.js';
import { wildMap } from './sceneMap.js';
import WalkableScene from './WalkableScene.jsx';
import DialogueBox from './DialogueBox.jsx';
import { PlaceTag } from '../hud/Hud.jsx';
import { dateLine } from '../hud/dateLine.js';
import { Button } from '../components/UI.jsx';

/**
 * A walkable wild area (src/data/wilds). Enemy groups stand on the map:
 * walking into one or tapping it starts a battle. Gathering spots give items
 * or gold, a night at the camp heals the party (one day passes), the exit leads back to town.
 */
export default function WildScene({ area, state, actions, paused = false, apiRef = null }) {
  const map = useMemo(() => wildMap(area), [area]);
  const ownApi = useRef(null);
  const api = apiRef || ownApi;
  const [talk, setTalk] = useState(null);
  const [camp, setCamp] = useState(false);
  const view = getWildAreaView(state, area.id);
  const saved = state.world?.exploration?.positions?.[area.id];
  const start = saved && Number.isFinite(saved.x) ? saved : map.spawn;
  const hub = TOWNS[area.hub];
  const fit = state.heroes.filter((hero) => hero.status === 'available').length;
  const hurt = state.heroes.filter((hero) => hero.status === 'injured').length;

  const interact = (target, position) => {
    if (target.kind === 'enemy') actions.fightWild(area.id, target.group, position);
    else if (target.kind === 'gather') actions.gather(area.id, target.spot);
    else if (target.kind === 'camp') setCamp(true);
    else if (target.kind === 'exit') actions.leaveWild(position);
    else if (target.dialogue) setTalk({ id: target.dialogue, visit: { sceneId: area.id, targetId: target.id, position } });
  };
  const remaining = view.groups.filter((group) => group.available).length;

  return (
    <WalkableScene
      key={area.id}
      map={map}
      start={start}
      apiRef={api}
      activeTargets={view.activeTargets}
      paused={Boolean(paused || talk || camp || state.activeEncounter || state.pendingEvent)}
      joystick={Boolean(state.settings?.joystick)}
      onInteract={interact}
      className={`wild-scene wild-scene--${area.id}`}
      label={`Explore ${area.name}`}
    >
      <PlaceTag
        title={area.name}
        sub={dateLine(state.date)}
        goal={
          <p className="goal-line goal-line--status">
            {fit} fit{hurt ? ` · ${hurt} injured` : ''} · {remaining ? `${remaining} group${remaining === 1 ? '' : 's'} here` : 'quiet'} · the signpost leads back to {hub?.name}
          </p>
        }
      />
      {camp ? (
        <section className="walk-card" role="dialog" aria-label={area.camp.name}>
          <div className="walk-card__box panel">
            <span className="eyebrow">{area.camp.name}</span>
            <h2>Rest by the fire?</h2>
            <p>One week passes. Every hero recovers health and fatigue, and injuries heal two weeks faster.</p>
            <div className="walk-card__actions">
              <Button
                variant="primary"
                onClick={() => {
                  setCamp(false);
                  actions.restAtCamp(area.id);
                }}
              >
                Camp for the night
              </Button>
              <Button onClick={() => setCamp(false)}>Not now</Button>
            </div>
          </div>
        </section>
      ) : null}
      {talk ? (
        <DialogueBox key={talk.id} state={state} actions={actions} conversationId={talk.id} visit={talk.visit} onClose={() => setTalk(null)} />
      ) : null}
    </WalkableScene>
  );
}
