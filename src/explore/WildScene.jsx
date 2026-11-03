import React, { useMemo, useRef, useState } from 'react';
import { getWildAreaView } from '../game/engine.js';
import { TOWNS } from '../data/towns/index.js';
import { wildMap } from './sceneMap.js';
import WalkableScene from './WalkableScene.jsx';
import DialogueBox from './DialogueBox.jsx';
import SceneHud from './SceneHud.jsx';
import { Button } from '../components/UI.jsx';

/**
 * A walkable wild area (src/data/wilds). Enemy groups stand on the map:
 * walking into one or tapping it starts a battle. Gathering spots give items
 * or gold, the camp heals the party for a week, the exit leads back to town.
 */
export default function WildScene({ area, state, actions, navigate }) {
  const map = useMemo(() => wildMap(area), [area]);
  const api = useRef(null);
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
  const leave = (route) => {
    const position = api.current?.position();
    if (position) actions.savePosition(area.id, position);
    navigate(route);
  };
  const remaining = view.groups.filter((group) => group.available).length;

  return (
    <WalkableScene
      key={area.id}
      map={map}
      start={start}
      apiRef={api}
      activeTargets={view.activeTargets}
      paused={Boolean(talk || camp || state.activeEncounter || state.pendingEvent)}
      joystick={Boolean(state.settings?.joystick)}
      onInteract={interact}
      className={`wild-scene wild-scene--${area.id}`}
      label={`Explore ${area.name}`}
    >
      <SceneHud
        eyebrow={area.tagline}
        title={area.name}
        leave={leave}
        extra={
          <button type="button" className="walk-nav__minor" onClick={() => actions.leaveWild(api.current?.position())}>
            Back to {hub?.name}
          </button>
        }
      >
        <span className="walk-hud__status">
          {fit} fit{hurt ? ` · ${hurt} injured` : ''} · {remaining ? `${remaining} group${remaining === 1 ? '' : 's'} on the map` : 'the area is quiet'}
        </span>
      </SceneHud>
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
                Rest a week
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
