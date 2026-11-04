import React, { useMemo, useRef, useState } from 'react';
import { hasHall, peopleIn, storyNpcsHere } from '../game/engine.js';
import { INTERIORS } from '../data/interiors.js';
import { townFor } from '../data/towns/index.js';
import { interiorMap } from './sceneMap.js';
import WalkableScene from './WalkableScene.jsx';
import DialogueBox from './DialogueBox.jsx';
import PersonDialogue from './PersonDialogue.jsx';
import { PlaceTag } from '../hud/Hud.jsx';
import { dateLine } from '../hud/dateLine.js';

/**
 * A building's interior: a small walkable room that fits one screen, with the
 * people in it (engine people.js). Tap a person to walk over and talk; tap
 * furniture (shelves, boards) to use it; tap the doorway to leave.
 * The room is rebuilt when someone arrives or leaves (`peopleKey`).
 */
export default function InteriorScene({ building, state, actions, onLeave, onOpen, paused = false, apiRef = null }) {
  const locationId = state.world?.currentLocationId || 'dunmere';
  const town = townFor(locationId);
  const room = INTERIORS[building];
  const label = town?.buildings.find((item) => item.building === building)?.label || building;
  const people = peopleIn(state, locationId, building);
  // Rebuild when who is here, or what you know about them, changes.
  const peopleKey = people.map((person) => `${person.id}:${person.spot}:${person.met ? 1 : 0}:${person.offers.map((offer) => `${offer.type}${offer.locked ? 'L' : ''}`).join(',')}`).join('|');
  // The Phaser room is rebuilt only when someone arrives or leaves; badges update in place.
  const whoKey = people.map((person) => `${person.id}:${person.spot}`).join('|');
  const sceneId = `interior:${locationId}:${building}`;
  const map = useMemo(() => interiorMap(room, people, { id: sceneId, exitName: `Out to ${town?.name || 'the street'}` }), [peopleKey, building, locationId]); // eslint-disable-line react-hooks/exhaustive-deps
  const ownApi = useRef(null);
  const api = apiRef || ownApi;
  const [talk, setTalk] = useState(null);
  // The main quest marker sits on a regular who holds the current story scene.
  const questNpcs = state.settings?.questMarker === false ? [] : storyNpcsHere(state);
  const beacons = map.targets.filter((target) => target.dialogue && questNpcs.includes(target.dialogue)).map((target) => target.id);

  const interact = (target) => {
    if (target.kind === 'exit') onLeave();
    else if (target.person) setTalk({ person: target.person, dialogue: target.dialogue });
    else if (target.poi?.shelf) onOpen({ open: 'shop', kind: target.poi.shelf });
    else if (target.poi?.board === 'history') onOpen({ open: 'arena', tab: 'board' });
    else if (target.poi?.board === 'rankings') onOpen({ open: 'records', tab: 'rankings' });
    else if (target.poi?.board === 'records') onOpen({ open: 'records', tab: 'codex', view: 'almanac' });
  };

  return (
    <WalkableScene
      key={`${sceneId}-${whoKey}`}
      map={map}
      start={api.current?.position() || map.spawn}
      apiRef={api}
      beacons={beacons}
      paused={Boolean(paused || talk || state.activeEncounter)}
      joystick={Boolean(state.settings?.joystick)}
      onInteract={interact}
      className={`interior-scene interior-scene--${building}`}
      label={`Inside ${label}`}
    >
      <PlaceTag title={label} sub={dateLine(state.date)} goal={building === 'tavern' && !hasHall(state) ? <p className="goal-line goal-line--status">No hall, no hires.</p> : null} />
      {talk?.dialogue ? (
        <DialogueBox
          key={talk.person}
          state={state}
          actions={actions}
          conversationId={talk.dialogue}
          visit={null}
          onClose={() => setTalk(null)}
          onOpenBuilding={(id) => id !== building && onOpen({ open: id })}
        />
      ) : talk ? (
        <PersonDialogue key={talk.person} state={state} actions={actions} personId={talk.person} onClose={() => setTalk(null)} onOpen={onOpen} />
      ) : null}
    </WalkableScene>
  );
}
