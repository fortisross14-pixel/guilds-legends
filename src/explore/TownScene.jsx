import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  activeContracts,
  checkCondition,
  firstStep,
  knownMissions,
  freeBeds,
  getArenaView,
  getPlayerRanks,
  getStoryView,
  hasHall,
  siteDoors,
  siteObjects,
  storyNpcsHere,
} from '../game/engine.js';
import { HALL_EXTERIOR } from '../data/rooms.js';
import { BUILDINGS } from '../data/world.js';
import { REGULARS } from '../data/people.js';
import { Button } from '../components/UI.jsx';
import { siteDoorTarget, siteTargets, townMap } from './sceneMap.js';
import SiteCard from './SiteCard.jsx';
import WalkableScene from './WalkableScene.jsx';
import DialogueBox from './DialogueBox.jsx';
import { PlaceTag } from '../hud/Hud.jsx';
import { dateLine } from '../hud/dateLine.js';
import Icon from '../components/Icon.jsx';

/**
 * A walkable town (src/data/towns). Doors open their building, people and
 * landmarks talk through the dialogue system, exits lead to wild areas.
 * The position is saved whenever the founder leaves, so returning puts them back.
 */
export default function TownScene({
  town,
  state,
  actions,
  navigate,
  openBuilding,
  showBuilding,
  openSite = null,
  paused = false,
  apiRef = null,
  onTalk = null,
}) {
  // The guild's own hall stands in Dunmere (an empty lot until story mission 1 rents it).
  const hall = town.id === 'dunmere' ? { asset: HALL_EXTERIOR, label: hasHall(state) ? 'Guild Hall' : 'Empty lot' } : null;
  // Contract objectives in the streets and doors to painted contract sites (missions-in-world).
  const objects = siteObjects(state, 'town', town.id);
  const doors = siteDoors(state, town.id);
  const siteKey = [...objects.map((object) => `${object.missionId}:${object.objective.id}:${object.arrive ? 1 : 0}`), ...doors.map((door) => door.id)].join(
    '|',
  );
  const map = useMemo(() => {
    const built = townMap(town, hall);
    built.targets = [...built.targets, ...siteTargets(objects), ...doors.map(siteDoorTarget)];
    return built;
  }, [town, hall?.asset, hall?.label, siteKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const [site, setSite] = useState(null);
  const ownApi = useRef(null);
  const api = apiRef || ownApi;
  const [talk, setTalk] = useState(null);
  // An open conversation holds back queued cards (App.jsx, the interruption queue).
  useEffect(() => {
    onTalk?.(Boolean(talk || site));
  }, [talk, site, onTalk]);
  useEffect(() => () => onTalk?.(false), [onTalk]);
  const [peek, setPeek] = useState(null);
  // Conditional people (an NPC with `if`) appear only while their condition holds.
  const active = map.targets.filter((target) => !target.if || checkCondition(state, target.if)).map((target) => target.id);
  // The main quest marker sits on whoever holds the current story scene (hidden with the Quest Log toggle).
  const questNpcs = state.settings?.questMarker === false ? [] : storyNpcsHere(state);
  // A quest person standing inside a building puts the marker on its door.
  const inside = REGULARS.filter((person) => person.locationId === town.id && person.dialogue && questNpcs.includes(person.dialogue)).map(
    (person) => `door:${person.building}`,
  );
  // Exits toward a wild area where a contract waits carry the quest marker too.
  const contractAreas = new Set(
    activeContracts(state)
      .filter((mission) => mission.site.place.kind === 'wild')
      .map((mission) => mission.site.place.id),
  );
  const toContracts = map.targets.filter((target) => target.kind === 'exit' && contractAreas.has(target.area)).map((target) => target.id);
  const beacons = [
    ...map.targets.filter((target) => target.kind === 'npc' && questNpcs.includes(target.dialogue)).map((target) => target.id),
    ...inside,
    ...toContracts,
  ];
  const saved = state.world?.exploration?.positions?.[town.id];
  // When the map rebuilds here (a contract objective done), keep the founder where they stand;
  // on arrival the scene starts from the saved spot (the shared controller may still be the last scene's).
  const arrived = useRef(false);
  useEffect(() => {
    arrived.current = true;
  }, []);
  const start = (arrived.current && api.current?.position()) || (saved && Number.isFinite(saved.x) ? saved : map.spawn);

  const interact = (target, position) => {
    if (target.site && target.kind === 'enemy') actions.siteAct(target.site.missionId, target.site.objectiveId, { position });
    else if (target.site) setSite(target.site);
    else if (target.siteId) {
      actions.savePosition(town.id, position);
      openSite?.(target.siteId);
    } else if (target.kind === 'door') {
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

  return (
    <>
      <WalkableScene
        key={`${town.id}-${siteKey}`}
        map={map}
        start={start}
        apiRef={api}
        activeTargets={active}
        beacons={beacons}
        onPeek={(target) => setPeek(target)}
        paused={Boolean(paused || talk || site || state.activeEncounter)}
        joystick={Boolean(state.settings?.joystick)}
        onInteract={interact}
        className={`town-scene town-scene--${town.id}`}
        label={`Explore ${town.name}`}
      >
        <PlaceTag
          title={town.name}
          sub={dateLine(state.date)}
          goal={
            <QuestChip
              state={state}
              actions={actions}
              town={town}
              beacons={beacons}
              contractTargets={[...map.targets.filter((target) => target.site || target.siteId).map((target) => target.id), ...toContracts]}
              onGo={(targetId) => api.current?.goTo(targetId)}
              onMap={(pin) => leave({ view: 'map', pin })}
            />
          }
        />
        {peek && !talk ? (
          <PeekCard
            state={state}
            town={town}
            target={peek}
            onClose={() => setPeek(null)}
            onGo={() => {
              setPeek(null);
              api.current?.goTo(peek.id);
            }}
          />
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
      {site ? (
        <SiteCard
          key={`${site.missionId}-${site.objectiveId}`}
          state={state}
          actions={actions}
          missionId={site.missionId}
          objectiveId={site.objectiveId}
          arrive={site.arrive}
          onClose={() => setSite(null)}
        />
      ) : null}
    </>
  );
}

/** Long-press a door or a person: what is there, without walking over. */
function PeekCard({ state, town, target, onClose, onGo }) {
  const lines = [];
  if (target.kind === 'door') {
    const building = target.building;
    if (building === 'tavern') {
      const recruits = state.candidates.filter((candidate) => (candidate.locationId || 'dunmere') === town.id).slice(0, 3);
      lines.push(recruits.length ? recruits.map((candidate) => `${candidate.name} · ${candidate.classId}`).join(', ') : 'Nobody looking for work.');
    } else if (building === 'arena') {
      const next = getArenaView(state, town.id).next;
      lines.push(
        next
          ? `${next.definition.name}: ${next.days <= 0 ? 'today' : `in ${Math.ceil(next.days / 7)} wk`}${next.signup ? ' · signed up' : ''}`
          : 'No tournament here this season.',
      );
    } else if (building === 'guildHall') {
      const home = state.heroes.filter((hero) => !['dead', 'retired'].includes(hero.status)).length;
      lines.push(`${home} heroes · ${freeBeds(state)} free beds`);
    } else if (building === 'herald') {
      const ranks = getPlayerRanks(state);
      lines.push(`Strength #${ranks.strength.rank} · Legacy #${ranks.legacy.rank} · Official #${ranks.official.rank}`);
    } else if (building === 'shop') {
      lines.push('Potions, weapons, armor, charms.');
    } else if (building === 'noticeBoard') {
      const contracts = knownMissions(state).filter((mission) => mission.locationId === town.id);
      lines.push(`${contracts.length} contracts${contracts[0] ? ` · ${contracts[0].title}` : ''}`);
    }
    if (!lines.length) lines.push(BUILDINGS[building]?.description || '');
  } else if (target.kind === 'npc') {
    lines.push(target.role || '');
  } else {
    lines.push('Take a look.');
  }
  return (
    <aside className="peek-card panel" role="dialog" aria-label={target.name}>
      <header>
        <strong>{target.name}</strong>
        <button type="button" onClick={onClose} aria-label="Close">
          <Icon name="close" size={18} tone="plain" />
        </button>
      </header>
      {lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
      <Button variant="primary" size="sm" onClick={onGo}>
        {target.verb || 'Go'}
      </Button>
    </aside>
  );
}

/**
 * The current goal, one line under the place tag. Tap: the founder walks there,
 * the scene plays (when it needs no one to walk to), or the map opens.
 */
function QuestChip({ state, actions, town, beacons, contractTargets = [], onGo, onMap }) {
  if (state.settings?.questMarker === false) return null;
  const story = getStoryView(state);
  const step = story.active?.current;
  if (!step) return null;
  // A story contract being played: its next site step (missions-in-world), and the way to it.
  const contract = step.kind === 'contract' ? activeContracts(state).find((mission) => mission.story?.startsWith(`${story.active.id}.`)) : null;
  if (contract) {
    const next = firstStep(state, contract);
    const there = contract.locationId === town.id;
    return (
      <button type="button" className="goal-line" onClick={() => (!there ? onMap(contract.locationId) : contractTargets[0] ? onGo(contractTargets[0]) : null)} aria-label={`Goal: ${next?.text || contract.title}`}>
        <Icon name="alert" size={14} tone="plain" />
        <span>{next?.text || contract.title}</span>
      </button>
    );
  }
  const here = step.at === town.id || (step.at === 'hall' && town.id === 'dunmere');
  const go = () => {
    if (!here) return onMap(step.at === 'hall' ? 'dunmere' : step.at);
    if (step.canTalk && !beacons[0]) return actions.playStoryScene(story.active.id);
    if (beacons[0]) return onGo(beacons[0]);
    if (step.at === 'hall' || step.screen === 'rest' || step.screen === 'hall') return onGo('door:guildHall');
    if (step.screen === 'tournaments' || step.kind === 'duel') return onGo('door:arena');
    if (step.kind === 'contract' || step.screen === 'missions') return onGo('poi:noticeBoard');
    return onGo('door:guildHall');
  };
  return (
    <button type="button" className="goal-line" onClick={go} aria-label={`Goal: ${step.text}`}>
      <Icon name="alert" size={14} tone="plain" />
      <span>{step.text}</span>
    </button>
  );
}
