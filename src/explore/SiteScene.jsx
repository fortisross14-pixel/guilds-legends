import React, { useEffect, useState } from 'react';
import { firstStep, siteObjects } from '../game/engine.js';
import { PAINTED_SITES } from '../data/missions/index.js';
import { ENEMY_TYPES } from '../data/enemies.js';
import { townFor } from '../data/towns/index.js';
import Icon from '../components/Icon.jsx';
import Asset from '../components/Asset.jsx';
import PaintedScene, { at, box } from './PaintedScene.jsx';
import SiteCard from './SiteCard.jsx';
import { PlaceTag } from '../hud/Hud.jsx';
import { dateLine } from '../hud/dateLine.js';

/**
 * A painted contract site behind a door in town (missions-in-world): the archive
 * vault, the slag pits, the cliff path. Its objectives stand on the painting:
 * people to talk to, groups to fight (tap to start), clues and finds as
 * hotspots. The door asks before leading back out.
 */
export default function SiteScene({ siteId, state, actions, onLeave, paused = false, onTalk = null }) {
  const site = PAINTED_SITES[siteId];
  const town = townFor(site?.town);
  const objects = siteObjects(state, 'painted', siteId);
  const [card, setCard] = useState(null);
  const [ask, setAsk] = useState(false);
  useEffect(() => {
    onTalk?.(Boolean(card));
  }, [card, onTalk]);
  useEffect(() => () => onTalk?.(false), [onTalk]);
  if (!site) return null;
  const blocked = Boolean(paused || card || state.activeEncounter);
  const working = objects[0] ? state.missions.find((mission) => mission.id === objects[0].missionId) : null;
  const step = working ? firstStep(state, working) : null;
  const tap = (object) => {
    setAsk(false);
    if (object.objective.kind === 'fight') actions.siteAct(object.missionId, object.objective.id);
    else setCard({ missionId: object.missionId, objectiveId: object.objective.id, arrive: Boolean(object.arrive) });
  };
  const door = [42, 86, 16, 14];
  return (
    <PaintedScene
      art={site.art}
      className="interior--site"
      label={site.name}
      onBackgroundTap={() => ask && setAsk(false)}
      overlay={
        <>
          <PlaceTag
            title={site.name}
            sub={dateLine(state.date)}
            goal={
              step ? (
                <p className="goal-line goal-line--status">
                  <b>{working.title}:</b> {step.text}
                </p>
              ) : (
                <p className="goal-line goal-line--status">Nothing left to do here.</p>
              )
            }
          />
          {card ? <SiteCard key={`${card.missionId}-${card.objectiveId}`} state={state} actions={actions} missionId={card.missionId} objectiveId={card.objectiveId} arrive={card.arrive} onClose={() => setCard(null)} /> : null}
        </>
      }
    >
      {objects
        .filter((object) => object.slot?.box)
        .map((object) => (
          <button
            key={`${object.missionId}-${object.objective.id}`}
            type="button"
            className="interior__hotspot is-objective"
            style={box(object.slot.box)}
            disabled={blocked}
            onClick={(event) => {
              event.stopPropagation();
              tap(object);
            }}
            aria-label={`${object.objective.kind === 'collect' ? 'Collect' : 'Inspect'}: ${object.objective.name}`}
          >
            <span className="interior__tag">
              <Icon name={object.objective.kind === 'collect' ? 'plant' : 'search'} size={14} />
              {object.objective.name}
            </span>
          </button>
        ))}
      <button
        type="button"
        className="interior__door"
        style={box(door)}
        disabled={blocked}
        onClick={(event) => {
          event.stopPropagation();
          setAsk(true);
        }}
        aria-label={`Leave to ${town?.name || 'town'}`}
      >
        <span className="interior__tag">
          <Icon name="door" size={14} />
          Out
        </span>
      </button>
      {objects
        .filter((object) => object.slot?.at)
        .map((object) => {
          const fight = object.objective.kind === 'fight';
          const sprite = fight ? ENEMY_TYPES[object.objective.enemies?.[0]]?.sprite : null;
          return (
            <button
              key={`${object.missionId}-${object.objective.id}-${object.arrive ? 'arrive' : ''}`}
              type="button"
              className={`interior__person is-quest${fight ? ' is-foe' : ''}`}
              style={at(object.slot.at)}
              disabled={blocked}
              onClick={(event) => {
                event.stopPropagation();
                tap(object);
              }}
              aria-label={`${fight ? 'Fight' : 'Talk'}: ${object.objective.name}`}
            >
              <span className="interior__name">
                <Icon name={fight ? (object.objective.boss ? 'skull' : 'swords') : 'alert'} size={14} tone="plain" className="walk__offer" />
                {object.arrive ? `Bring ${object.objective.name} here` : object.objective.name}
              </span>
              <Asset id={sprite ? `battle.${sprite}` : 'npc.role.traveller'} className={fight ? 'interior__foe' : 'interior__sprite'} alt="" />
            </button>
          );
        })}
      {ask ? (
        <button
          type="button"
          className="walk__confirm interior__confirm"
          style={{ left: `${door[0] + door[2] / 2}%`, top: `${door[1]}%`, transform: 'translate(-50%, -100%)' }}
          onClick={(event) => {
            event.stopPropagation();
            setAsk(false);
            onLeave();
          }}
        >
          <Icon name="door" size={16} tone="plain" />
          Leave to {town?.name || 'town'}
        </button>
      ) : null}
    </PaintedScene>
  );
}
