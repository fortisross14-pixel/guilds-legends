import React, { useEffect, useMemo, useRef, useState } from 'react';
import { firstStep, getWildAreaView, siteObjects } from '../game/engine.js';
import { siteTargets, wildMap } from './sceneMap.js';
import SiteCard from './SiteCard.jsx';
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
export default function WildScene({ area, state, actions, paused = false, apiRef = null, onTalk = null, openBuilding = null }) {
  // Contract objectives standing here (missions-in-world): the map is rebuilt when one is done.
  const objects = siteObjects(state, 'wild', area.id);
  const siteKey = objects.map((object) => `${object.missionId}:${object.objective.id}:${object.arrive ? 1 : 0}`).join('|');
  const map = useMemo(() => {
    const built = wildMap(area);
    built.targets = [...built.targets, ...siteTargets(objects)];
    return built;
  }, [area, siteKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const ownApi = useRef(null);
  const api = apiRef || ownApi;
  const [talk, setTalk] = useState(null);
  const [site, setSite] = useState(null);
  // An open conversation holds back queued cards (App.jsx, the interruption queue).
  useEffect(() => {
    onTalk?.(Boolean(talk || site));
  }, [talk, site, onTalk]);
  useEffect(() => () => onTalk?.(false), [onTalk]);
  const [camp, setCamp] = useState(false);
  // A door held shut by a boss (the temple, while the Ash Abbot holds its gate).
  const [barred, setBarred] = useState(null);
  const view = getWildAreaView(state, area.id);
  const saved = state.world?.exploration?.positions?.[area.id];
  // When the map rebuilds here (a contract objective done), keep the founder where they stand;
  // on arrival the scene starts from the saved spot (the shared controller may still be the last scene's).
  const arrived = useRef(false);
  useEffect(() => {
    arrived.current = true;
  }, []);
  const start = (arrived.current && api.current?.position()) || (saved && Number.isFinite(saved.x) ? saved : map.spawn);
  const fit = state.heroes.filter((hero) => hero.status === 'available').length;
  const hurt = state.heroes.filter((hero) => hero.status === 'injured').length;

  const interact = (target, position) => {
    if (target.site && target.kind === 'enemy') actions.siteAct(target.site.missionId, target.site.objectiveId, { position });
    else if (target.site) setSite(target.site);
    else if (target.kind === 'enemy') actions.fightWild(area.id, target.group, position);
    else if (target.kind === 'gather') actions.gather(area.id, target.spot);
    else if (target.kind === 'camp') setCamp(true);
    else if (target.kind === 'exit') actions.leaveWild(position, target.town);
    else if (target.kind === 'door' && view.gates?.[target.building]) setBarred(target.name);
    else if (target.kind === 'door') openBuilding?.(target.building);
    else if (target.dialogue) setTalk({ id: target.dialogue, visit: { sceneId: area.id, targetId: target.id, position } });
  };
  const remaining = view.groups.filter((group) => group.available).length;
  const working = objects[0] ? state.missions.find((mission) => mission.id === objects[0].missionId) : null;
  const step = working ? firstStep(state, working) : null;

  return (
    <>
      <WalkableScene
        key={`${area.id}-${siteKey}`}
        map={map}
        start={start}
        apiRef={api}
        activeTargets={[...view.activeTargets, ...map.targets.filter((target) => target.site).map((target) => target.id)]}
        paused={Boolean(paused || talk || site || camp || barred || state.activeEncounter || state.pendingEvent)}
        joystick={Boolean(state.settings?.joystick)}
        onInteract={interact}
        onWander={(position) => {
          if (!paused && !talk && !site && !camp && !barred && !state.activeEncounter && fit > 0) actions.ambush(area.id, position);
        }}
        className={`wild-scene wild-scene--${area.id}`}
        label={`Explore ${area.name}`}
      >
        <PlaceTag
          title={area.name}
          sub={dateLine(state.date)}
          goal={
            step ? (
              <p className="goal-line goal-line--status">
                <b>{working.title}:</b> {step.text}
              </p>
            ) : (
              <p className="goal-line goal-line--status">
                {fit} fit{hurt ? ` · ${hurt} hurt` : ''} · {remaining ? `${remaining} group${remaining === 1 ? '' : 's'}` : 'quiet'}
              </p>
            )
          }
        />
        {barred ? (
          <section className="walk-card" role="dialog" aria-label={barred}>
            <div className="walk-card__box panel">
              <span className="eyebrow">{barred}</span>
              <h2>The doors are barred</h2>
              <p>Brother Malric holds the temple gate. Get past him first.</p>
              <div className="walk-card__actions">
                <Button variant="primary" onClick={() => setBarred(null)}>
                  Back
                </Button>
              </div>
            </div>
          </section>
        ) : null}
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
        {talk ? <DialogueBox key={talk.id} state={state} actions={actions} conversationId={talk.id} visit={talk.visit} onClose={() => setTalk(null)} /> : null}
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
