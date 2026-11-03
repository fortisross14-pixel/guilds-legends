import React, { useRef, useState } from 'react';
import { OPENING_ROOM_MAP } from '../data/openingRoom.js';
import WalkableScene, { useCoarsePointer } from '../explore/WalkableScene.jsx';
import { Button } from './UI.jsx';

const LINES = [
  { text: 'You… still carry yourself like someone who has not learned to run. Good. The others never made it out.', options: ['Who are you?', 'What happened in the Blackwood?'] },
  { text: 'A lantern-bearer. Or I was. Do not trust what they say happened in the Blackwood. We were not lost.', options: ['What did you find?', 'Why give this to me?'] },
  { text: 'A banner is only cloth… until someone carries it. Let it mean more than our last mistake.', options: ['I will carry it forward.'] },
];

export default function FallenBannerOpening({ state, onComplete }) {
  const coarse = useCoarsePointer();
  // 'house' → talk to the stranger, then 'identity' (card), then 'door'.
  const [phase, setPhase] = useState(state.flags.opening?.phase === 'door' ? 'door' : 'house');
  const [dialogue, setDialogue] = useState(null);
  const choices = useRef([]);

  const interact = (target) => {
    if (target.id === 'door') onComplete(choices.current);
    else if (target.id === 'stranger') setDialogue(0);
  };
  const choose = (answer) => {
    choices.current = [...choices.current, answer];
    if (dialogue === LINES.length - 1) {
      setDialogue(null);
      setPhase('identity');
    } else setDialogue((step) => step + 1);
  };

  const current = dialogue === null ? null : LINES[dialogue];
  const objective = phase === 'door' ? 'The door to Dunmere is open.' : 'Someone is hurt by the window.';
  const hint = coarse ? 'Tap to walk. Tap someone to talk.' : 'Click to walk, or use the arrow keys.';
  return (
    <WalkableScene
      map={OPENING_ROOM_MAP}
      activeTargets={phase === 'door' ? ['door'] : phase === 'house' ? ['stranger'] : []}
      paused={current !== null || phase === 'identity'}
      joystick={Boolean(state.settings?.joystick)}
      onInteract={interact}
      className="opening-exploration"
      label="The Fallen Banner prologue"
    >
      <header className="walk-hud">
        <div className="walk-hud__place">
          <span>Year 1187 · A room above the old road</span>
          <h1>The Fallen Banner</h1>
          <small>
            {objective} {hint}
          </small>
        </div>
      </header>
      {current ? (
        <section className="opening-dialogue" aria-live="polite">
          <div className="opening-dialogue__box">
            <span className="opening-dialogue__speaker">The messenger</span>
            <p>{current.text}</p>
            <div className="opening-dialogue__choices">
              {current.options.map((option) => (
                <button key={option} onClick={() => choose(option)}>
                  {option}
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : null}
      {phase === 'identity' ? (
        <section className="opening-identity">
          <div className="opening-identity__card panel">
            <span className="eyebrow">The room falls quiet</span>
            <h1>A name to carry</h1>
            <p>
              The banner is yours. {state.guild.name}, led by {state.guild.founder}, will be remembered in Dunmere.
            </p>
            <Button variant="primary" onClick={() => setPhase('door')}>
              Take the banner to Dunmere
            </Button>
          </div>
        </section>
      ) : null}
    </WalkableScene>
  );
}
