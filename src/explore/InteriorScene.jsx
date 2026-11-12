import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getStoryView, hasHall, peopleIn, shortLabels, storyNpcsHere } from '../game/engine.js';
import Icon from '../components/Icon.jsx';
import Asset from '../components/Asset.jsx';
import PaintedScene, { at, box } from './PaintedScene.jsx';
import WalkableScene from './WalkableScene.jsx';
import { hasWalkableRoom, interiorMap } from './sceneMap.js';
import { interiorLayout } from '../data/interiors.js';
import { townFor } from '../data/towns/index.js';
import DialogueBox from './DialogueBox.jsx';
import PersonDialogue from './PersonDialogue.jsx';
import { PlaceTag } from '../hud/Hud.jsx';
import { dateLine } from '../hud/dateLine.js';

const offerIcon = (offer) => (offer.type === 'hire' ? (offer.locked ? 'lock' : 'coin') : offer.type === 'mission' ? 'alert' : 'swords');

/**
 * A building's interior. Rooms built from the hand-painted tiles are walkable
 * (the same controls as town: tap or drag to walk, walk up to someone to talk,
 * to a shelf or board to use it, to the door mat to leave). A painting without
 * a walkable room falls back to the painted scene: people at fixed spots, tap
 * to talk or use, the door asks before leading out.
 */
export default function InteriorScene({ building, state, actions, onLeave, onOpen, paused = false, onTalk = null, title = null, outTo = null }) {
  const locationId = state.world?.currentLocationId || 'dunmere';
  const town = townFor(locationId);
  const layout = interiorLayout(building, locationId);
  const label = title || town?.buildings.find((item) => item.building === building)?.label || building;
  const outside = outTo || town?.name || 'the street';
  const people = peopleIn(state, locationId, building);
  const names = shortLabels(people);
  const [talk, setTalk] = useState(null);
  const [ask, setAsk] = useState(false);
  // An open conversation holds back queued cards (App.jsx, the interruption queue).
  useEffect(() => {
    onTalk?.(Boolean(talk));
  }, [talk, onTalk]);
  useEffect(() => () => onTalk?.(false), [onTalk]);

  // Start centred on the keeper (the one you came to see), else the middle.
  const keeperSpot = people.find((person) => person.kind === 'regular')?.spot;
  const focusX = (layout?.spots[keeperSpot] || [50])[0];
  // The main quest marker sits on a regular who holds the current story scene.
  const questNpcs = state.settings?.questMarker === false ? [] : storyNpcsHere(state);
  const questPerson = people.find((person) => person.dialogue && questNpcs.includes(person.dialogue));
  const talkTo = (person) => {
    setAsk(false);
    setTalk({ person: person.id, dialogue: person.dialogue || null });
  };
  const use = (spot) => {
    setAsk(false);
    if (spot.shelf) onOpen({ open: 'shop', kind: spot.shelf });
    else if (spot.board === 'history') onOpen({ open: 'arena', tab: 'board' });
    else if (spot.board === 'rankings') onOpen({ open: 'records', tab: 'rankings' });
    else if (spot.board === 'records') onOpen({ open: 'records', tab: 'codex', view: 'almanac' });
  };
  const blocked = Boolean(paused || talk || state.activeEncounter);

  // Test hook (docs/PLAYTEST_CH1.md): who and what is on the painting.
  useEffect(() => {
    window.render_game_to_text = () =>
      JSON.stringify({
        scene: `interior:${locationId}:${building}`,
        people: people.map((person) => ({ id: person.id, name: person.name, spot: person.spot, offers: person.offers.map((offer) => offer.type) })),
        hotspots: (layout?.hotspots || []).map((spot) => spot.id),
        talking: talk?.person || null,
        asking: ask,
      });
    return () => {
      delete window.render_game_to_text;
    };
  });

  // The goal line, as in town: talk to the story person here, or head out when the step is elsewhere.
  const step = state.settings?.questMarker === false ? null : getStoryView(state).active?.current;
  const goalLine = step ? (
    <button type="button" className="goal-line" onClick={() => (questPerson ? talkTo(questPerson) : setAsk(true))} aria-label={`Goal: ${step.text}`}>
      <Icon name="alert" size={14} tone="plain" />
      <span>{step.text}</span>
    </button>
  ) : building === 'tavern' && !hasHall(state) ? (
    <p className="goal-line goal-line--status">No hall, no hires.</p>
  ) : null;

  // Walkable rooms rebuild when who is here changes; the walker keeps their place.
  const walkable = layout && hasWalkableRoom(layout.art);
  const sceneApi = useRef(null);
  const lastSpot = useRef(null);
  const peopleKey = people.map((person) => `${person.id}@${person.spot}:${person.offers.length}:${person.met ? 1 : 0}`).join('|');
  const roomMap = useMemo(
    () =>
      walkable
        ? interiorMap({ id: `${locationId}:${building}`, layout, people, names, townName: outside, badgesFor: (person) => person.offers.map(offerIcon) })
        : null,
    [walkable, peopleKey, locationId, building], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const overlay = (
    <>
      <PlaceTag title={label} sub={dateLine(state.date)} goal={goalLine} />
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
    </>
  );

  if (!layout) return null;
  if (roomMap) {
    const remember = () => {
      const spot = sceneApi.current?.position?.();
      if (spot) lastSpot.current = spot;
    };
    return (
      <WalkableScene
        key={peopleKey}
        map={roomMap}
        start={lastSpot.current || roomMap.spawn}
        apiRef={sceneApi}
        paused={blocked}
        beacons={questPerson ? [`person:${questPerson.id}`] : []}
        onInteract={(target) => {
          remember();
          if (target.kind === 'npc') talkTo(people.find((person) => person.id === target.personId) || { id: target.personId });
          else if (target.kind === 'poi') use(target.spot);
          else if (target.kind === 'exit') onLeave();
        }}
        className={`room room--${building}`}
        label={`Inside ${label}`}
      >
        {overlay}
      </WalkableScene>
    );
  }
  const doorAt = layout.door;
  return (
    <PaintedScene
      art={layout.art}
      focusX={focusX}
      className={`interior--${building}`}
      label={`Inside ${label}`}
      onBackgroundTap={() => ask && setAsk(false)}
      overlay={overlay}
    >
      {layout.hotspots.map((spot) => (
        <button
          key={spot.id}
          type="button"
          className="interior__hotspot"
          style={box(spot.box)}
          disabled={blocked}
          onClick={(event) => {
            event.stopPropagation();
            use(spot);
          }}
          aria-label={`${spot.verb}: ${spot.name}`}
        >
          <span className="interior__tag">
            <Icon name={spot.shelf ? 'bag' : spot.board === 'history' ? 'trophy' : spot.board === 'rankings' ? 'crown' : 'book'} size={14} />
            {spot.name}
          </span>
        </button>
      ))}
      <button
        type="button"
        className="interior__door"
        style={box(doorAt)}
        disabled={blocked}
        onClick={(event) => {
          event.stopPropagation();
          setAsk(true);
        }}
        aria-label={`Leave to ${outside}`}
      >
        <span className="interior__tag">
          <Icon name="door" size={14} />
          Out
        </span>
      </button>
      {/* People sit above hotspots and the door: their tap always wins. */}
      {people.map((person) => {
        const spot = layout.spots[person.spot];
        if (!spot) return null;
        const known = person.met || person.dialogue;
        const quest = questPerson?.id === person.id;
        return (
          <button
            key={person.id}
            type="button"
            className={`interior__person${quest ? ' is-quest' : ''}`}
            style={at(spot)}
            disabled={blocked}
            onClick={(event) => {
              event.stopPropagation();
              talkTo(person);
            }}
            aria-label={`Talk: ${person.name}, ${person.role}`}
          >
            <span className="interior__name">
              {!known ? (
                <b className="walk__unknown" aria-label="Someone you have not met">
                  ?
                </b>
              ) : null}
              {known
                ? person.offers.map((offer, index) => (
                    <Icon
                      key={`${offer.type}-${index}`}
                      name={offerIcon(offer)}
                      size={14}
                      tone="plain"
                      className={`walk__offer walk__offer--${offerIcon(offer)}`}
                    />
                  ))
                : null}
              {names[person.id] || person.name}
            </span>
            <Asset id={person.sprite} className="interior__sprite" alt="" />
          </button>
        );
      })}
      {ask ? (
        <button
          type="button"
          className="walk__confirm interior__confirm"
          style={{ left: `${doorAt[0] + doorAt[2] / 2}%`, top: `${doorAt[1]}%`, transform: "translate(-50%, -100%)" }}
          onClick={(event) => {
            event.stopPropagation();
            setAsk(false);
            onLeave();
          }}
        >
          <Icon name="door" size={16} tone="plain" />
          Leave to {outside}
        </button>
      ) : null}
    </PaintedScene>
  );
}
