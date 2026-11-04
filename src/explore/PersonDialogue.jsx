import React, { useEffect, useRef, useState } from 'react';
import { getPersonTalk } from '../game/engine.js';
import Asset from '../components/Asset.jsx';
import { toast } from '../components/UI.jsx';

/**
 * Talking to someone in a building (engine: people.js). First meetings are a
 * line or two that reveal what they offer; then a menu of short questions:
 * "Need anything done?", "Looking for work?" (the interview), "Fancy a bout?",
 * or their service (shop, inn, sign-ups, rankings). Same box as the story
 * dialogue: dark ink on parchment, choices as full-width rows.
 *
 * `onOpen(ui)` opens a panel ({ open: 'shop' | 'inn' | 'arena' | 'records' | 'news', tab }).
 */
export default function PersonDialogue({ state, actions, personId, onClose, onOpen }) {
  const [talk] = useState(() => getPersonTalk(state, personId));
  const [lines, setLines] = useState(() => talk?.lines || []);
  const [choices, setChoices] = useState(() => talk?.choices || []);
  const [index, setIndex] = useState(0);
  const started = useRef(false);

  // Meeting someone is remembered once the conversation opens.
  useEffect(() => {
    if (started.current || !talk) return;
    started.current = true;
    actions.meetPerson(personId);
  }, [actions, personId, talk]);

  if (!talk) return null;
  const { person } = talk;
  const reading = index < lines.length - 1;

  const choose = (choice) => {
    const result = actions.talkPerson(personId, choice.id);
    if (!result) return;
    const ui = result.ui || {};
    if (ui.notice) toast(ui.notice, 'green');
    if (ui.recruit) {
      actions.recruit(ui.recruit, 'accept', ui.years || 2);
      onClose();
      return;
    }
    if (ui.open) {
      onClose();
      onOpen?.(ui);
      return;
    }
    if (ui.close) {
      onClose();
      return;
    }
    setLines(result.lines?.length ? result.lines : ['…']);
    setChoices(result.choices || []);
    setIndex(0);
  };

  return (
    <section className="dialogue dialogue--person" aria-live="polite" onClick={reading ? () => setIndex((value) => value + 1) : undefined}>
      <div className="dialogue__box" onClick={(event) => !reading && event.stopPropagation()}>
        <div className="dialogue__portrait">
          <Asset id={person.portrait || 'portrait.poi'} alt="" />
        </div>
        <div className="dialogue__body">
          <span className="dialogue__speaker">
            {person.name}
            <small> · {person.role}</small>
          </span>
          <p className="dialogue__text">{lines[index]}</p>
          {reading ? (
            <div className="dialogue__controls">
              <span className="dialogue__hint">Tap to continue</span>
            </div>
          ) : (
            <div className="dialogue__choices">
              {choices.map((choice) => (
                <button key={choice.id} type="button" onClick={() => choose(choice)}>
                  {choice.text}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
