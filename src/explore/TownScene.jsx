import React, { useMemo, useRef, useState } from 'react';
import { getLivingHistory, hallStage } from '../game/engine.js';
import { townMap } from './sceneMap.js';
import WalkableScene from './WalkableScene.jsx';
import DialogueBox from './DialogueBox.jsx';
import SceneHud from './SceneHud.jsx';

/**
 * A walkable town (src/data/towns). Doors open their building, people and
 * landmarks talk through the dialogue system, exits lead to wild areas.
 * The position is saved whenever the founder leaves, so returning puts them back.
 */
export default function TownScene({ town, state, actions, navigate, openBuilding, showBuilding, openDirectory }) {
  // The guild's own hall stands in Dunmere and changes with its stage.
  const stage = hallStage(state);
  const hall = town.id === 'dunmere' ? { asset: stage.exterior, label: stage.townLabel } : null;
  const map = useMemo(() => townMap(town, hall), [town, hall?.asset, hall?.label]);
  const api = useRef(null);
  const [talk, setTalk] = useState(null);
  const saved = state.world?.exploration?.positions?.[town.id];
  const start = saved && Number.isFinite(saved.x) ? saved : map.spawn;

  const interact = (target, position) => {
    if (target.kind === 'door') {
      actions.visitBuilding(town.id, target.id, position, target.building);
      showBuilding(target.building);
    } else if (target.kind === 'exit') {
      actions.enterWild(target.area, position);
    } else if (target.dialogue) {
      setTalk({ id: target.dialogue, visit: { sceneId: town.id, targetId: target.id, position } });
    }
  };
  const leave = (route) => {
    const position = api.current?.position();
    if (position) actions.savePosition(town.id, position);
    navigate(route);
  };

  const livingHistory = getLivingHistory(state);
  return (
    <WalkableScene
      key={`${town.id}-${stage.id}`}
      map={map}
      start={start}
      apiRef={api}
      paused={Boolean(talk || state.activeEncounter)}
      joystick={Boolean(state.settings?.joystick)}
      onInteract={interact}
      className={`town-scene town-scene--${town.id}`}
      label={`Explore ${town.name}`}
    >
      <SceneHud
        eyebrow={town.tagline}
        title={town.name}
        leave={leave}
        extra={
          <button type="button" className="walk-nav__minor" onClick={() => {
            const position = api.current?.position();
            if (position) actions.savePosition(town.id, position);
            openDirectory();
          }}>
            Town directory
          </button>
        }
      />
      {livingHistory.spotlight && !talk ? (
        <div className={`walk-history exploration-history--${livingHistory.spotlight.tone}`}>{livingHistory.spotlight.title}</div>
      ) : null}
      {talk ? (
        <DialogueBox
          key={talk.id}
          state={state}
          actions={actions}
          conversationId={talk.id}
          visit={talk.visit}
          onClose={() => setTalk(null)}
          onOpenBuilding={(building) => {
            setTalk(null);
            openBuilding(building);
          }}
        />
      ) : null}
    </WalkableScene>
  );
}
