import React, { useState } from 'react';
import { DUNMERE_DOORS, DUNMERE_MAP, dialogueForDunmereNpc } from '../data/dunmere.js';
import { getLivingHistory } from '../game/engine.js';
import WalkableScene, { useCoarsePointer } from '../explore/WalkableScene.jsx';
import { Button } from './UI.jsx';

export default function DunmereExploration({ state, actions, openBuilding, openDirectory }) {
  const coarse = useCoarsePointer();
  const [conversation, setConversation] = useState(null);
  const [line, setLine] = useState(0);
  const saved = state.world?.exploration?.dunmere;
  const start = saved && Number.isFinite(saved.x) ? { x: saved.x, y: saved.y } : DUNMERE_MAP.spawn;

  const interact = (target, position) => {
    actions.recordDunmereExploration(`${target.kind}:${target.id}`, position);
    if (target.kind === 'door') openBuilding(target.building);
    else {
      setConversation(target);
      setLine(0);
    }
  };

  const livingHistory = getLivingHistory(state);
  const dialogue = conversation ? dialogueForDunmereNpc(conversation.id, state) : null;
  const availableCompanion = conversation?.id === 'innkeeper' ? state.candidates.find((candidate) => (candidate.locationId || 'dunmere') === 'dunmere') : null;
  const advance = () => {
    if (line < dialogue.lines.length - 1) setLine((value) => value + 1);
    else setConversation(null);
  };
  const lastLine = dialogue ? line >= dialogue.lines.length - 1 : false;

  return (
    <WalkableScene
      map={DUNMERE_MAP}
      start={start}
      paused={Boolean(dialogue)}
      joystick={Boolean(state.settings?.joystick)}
      onInteract={interact}
      className="dunmere-exploration"
      label="Explore Dunmere"
    >
      <header className="walk-hud">
        <div className="walk-hud__place">
          <span>Regional capital · your first home</span>
          <h1>Dunmere</h1>
          <small>{coarse ? 'Tap to walk. Tap people and doors to visit.' : 'Click to walk, or use the arrow keys.'}</small>
        </div>
        <div className="walk-hud__actions">
          <Button size="sm" onClick={() => openBuilding('guildHall')}>
            Guild Hall
          </Button>
          {openDirectory ? (
            <Button size="sm" onClick={openDirectory}>
              Directory
            </Button>
          ) : null}
        </div>
      </header>
      {livingHistory.spotlight && !dialogue ? (
        <div className={`walk-history exploration-history--${livingHistory.spotlight.tone}`}>{livingHistory.spotlight.title}</div>
      ) : null}
      {dialogue ? (
        <section className="town-dialogue" aria-live="polite" onClick={() => (!lastLine ? advance() : null)}>
          <div className="town-dialogue__box" onClick={(event) => event.stopPropagation()}>
            <span className="town-dialogue__speaker">{dialogue.speaker}</span>
            <p>{dialogue.lines[line]}</p>
            <div className="town-dialogue__actions">
              {!lastLine ? (
                <Button variant="primary" onClick={advance}>
                  Continue
                </Button>
              ) : (
                <>
                  <Button variant="primary" onClick={advance}>
                    Leave
                  </Button>
                  {availableCompanion ? (
                    <Button
                      variant="primary"
                      onClick={() => {
                        actions.recruit(availableCompanion.id);
                        setConversation(null);
                      }}
                    >
                      Invite {availableCompanion.name}
                    </Button>
                  ) : null}
                  {dialogue.door ? <Button onClick={() => openBuilding(dialogue.door)}>Go to {DUNMERE_DOORS.find((door) => door.id === dialogue.door)?.label}</Button> : null}
                </>
              )}
            </div>
          </div>
        </section>
      ) : null}
    </WalkableScene>
  );
}
