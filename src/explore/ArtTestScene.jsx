import React, { useMemo, useRef, useState } from 'react';
import { artTestDoorStep, artTestMap } from '../data/artTest/index.js';
import { Button } from '../components/UI.jsx';
import Icon from '../components/Icon.jsx';
import WalkableScene from './WalkableScene.jsx';

/**
 * The art test town (System → Settings → Developer, or #art-test in the address):
 * Dunmere rebuilt from the Arex V "Medieval Fantasy" pack, with the normal touch
 * controls. Only the Wayfarer has an inside. Nothing here changes the campaign.
 */
export default function ArtTestScene({ onClose }) {
  const [room, setRoom] = useState('town');
  const [start, setStart] = useState(null);
  const [line, setLine] = useState(null);
  const api = useRef(null);
  const map = useMemo(() => artTestMap(room), [room]);

  const interact = (target) => {
    if (target.kind === 'npc') setLine({ name: target.name, text: target.line });
    else if (target.kind === 'door' && target.building === 'tavern') {
      setStart(null);
      setRoom('tavern');
    } else if (target.kind === 'door') setLine({ name: target.name, text: 'Only the Wayfarer has an inside in this test.' });
    else if (target.kind === 'exit' && room === 'tavern') {
      setStart(artTestDoorStep('door:tavern'));
      setRoom('town');
    } else if (target.kind === 'exit') setLine({ name: target.name, text: 'The road ends here in the art test.' });
  };

  return (
    <div className="art-test">
      <WalkableScene
        key={room}
        map={map}
        start={start || map.spawn}
        apiRef={api}
        paused={Boolean(line)}
        onInteract={interact}
        className={`art-test__scene art-test__scene--${room}`}
        label={room === 'tavern' ? 'Art test: the Wayfarer' : 'Art test: Dunmere'}
      >
        <div className="art-test__bar">
          <span>
            <b>Art test</b> · {room === 'tavern' ? 'The Wayfarer' : 'Dunmere'}
          </span>
          <Button size="sm" onClick={onClose} aria-label="Close the art test">
            <Icon name="close" size={14} tone="plain" /> Close
          </Button>
        </div>
      </WalkableScene>
      {line ? (
        <button type="button" className="art-test__line" onClick={() => setLine(null)} aria-live="polite">
          <strong>{line.name}</strong>
          <span>{line.text}</span>
          <small>Tap to close</small>
        </button>
      ) : null}
    </div>
  );
}
