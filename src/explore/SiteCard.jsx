import React, { useState } from 'react';
import { siteObjectiveView } from '../game/engine.js';
import Asset from '../components/Asset.jsx';
import Icon from '../components/Icon.jsx';

/**
 * A contract objective on site (missions-in-world): a person to talk to (choices,
 * each with its test, "Presence 52: likely", or its cost), a clue or lock to
 * inspect, something to collect, or someone to escort. One box at the bottom, in
 * the dialogue style; the result line shows in it, then Continue closes it.
 */
export default function SiteCard({ state, actions, missionId, objectiveId, arrive = false, onClose }) {
  const view = siteObjectiveView(state, missionId, objectiveId);
  const [result, setResult] = useState(null);
  if (!view) return null;
  const act = (options = {}) => {
    const outcome = actions.siteAct(missionId, objectiveId, { arrive, ...options });
    if (outcome) setResult(outcome);
  };
  const speaker = view.kind === 'talk' || view.kind === 'escort' ? view.name : null;
  const text = result?.text || (arrive ? `Here, ${view.name} is safe.` : view.line) || (view.kind === 'collect' ? `${view.name}: ${view.progress}/${view.count}.` : view.kind === 'inspect' ? view.name : '');
  const actionsFor = () => {
    if (result) return [{ key: 'done', text: 'Continue', run: onClose }];
    if (view.kind === 'talk')
      return [
        ...view.choices
          .filter((choice) => !choice.gone)
          .map((choice) => ({
            key: `c${choice.index}`,
            text: choice.text,
            note: choice.test?.label || (choice.cost && !/gold/.test(choice.text) ? `${choice.cost} gold` : choice.fight ? 'A fight' : null),
            run: () => (choice.fight ? (onClose(), actions.siteAct(missionId, objectiveId, { choice: choice.index })) : act({ choice: choice.index })),
          })),
        { key: 'leave', text: 'Not now.', run: onClose },
      ];
    if (view.kind === 'escort') return [{ key: 'go', text: arrive ? 'You’re safe here.' : view.escorting ? 'Stay close.' : 'Come with us.', run: () => (view.escorting && !arrive ? onClose() : act()) }, { key: 'leave', text: 'Not now.', run: onClose }];
    if (view.kind === 'inspect')
      return view.ready
        ? [{ key: 'go', text: 'Inspect', note: view.test?.label || null, run: () => act() }, { key: 'leave', text: 'Leave it.', run: onClose }]
        : [{ key: 'leave', text: 'Leave it.', run: onClose }];
    if (view.kind === 'collect') return [{ key: 'go', text: `Collect (${view.progress + 1}/${view.count})`, run: () => act() }, { key: 'leave', text: 'Leave it.', run: onClose }];
    return [{ key: 'leave', text: 'Close', run: onClose }];
  };
  return (
    <section className="dialogue dialogue--site" aria-live="polite">
      <div className="dialogue__box">
        <div className="dialogue__portrait">
          <Asset id={speaker ? 'portrait.role.traveller' : 'portrait.poi'} alt="" />
        </div>
        <div className="dialogue__body">
          {speaker ? (
            <span className="dialogue__speaker">
              {speaker}
              {view.role ? <small> · {view.role}</small> : null}
            </span>
          ) : (
            <span className="dialogue__speaker">
              <Icon name={view.kind === 'collect' ? 'plant' : 'search'} size={14} tone="plain" /> {view.name}
            </span>
          )}
          <p className={`dialogue__text${speaker ? '' : ' is-narration'}${result && !result.ok ? ' is-setback' : ''}`}>{text}</p>
          <div className="dialogue__choices">
            {actionsFor().map((choice) => (
              <button key={choice.key} type="button" onClick={choice.run}>
                {choice.text}
                {choice.note ? <small className="dialogue__check"> {choice.note}</small> : null}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
