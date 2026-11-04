import React, { useEffect, useRef, useState } from 'react';
import { getPersonTalk } from '../game/engine.js';
import Asset from '../components/Asset.jsx';
import Icon from '../components/Icon.jsx';
import { toast } from '../components/UI.jsx';

/**
 * Talking to someone in a building (engine: people.js; style: docs/DIALOGUE.md).
 * They open, with their name on a first meeting; then the topics the player can
 * ask in any order ("Need anything done?", "Looking for work?" for the
 * interview, "Fancy a friendly bout?", their service). Each answer comes back
 * to the topics, asked ones checked. Goodbye shows their farewell, then closes.
 * Same box as the scripted dialogue: dark ink on parchment, choices as rows.
 *
 * `onOpen(ui)` opens a panel ({ open: 'shop' | 'inn' | 'arena' | 'records' | 'news', tab }).
 */
export default function PersonDialogue({ state, actions, personId, onClose, onOpen }) {
  const [talk] = useState(() => getPersonTalk(state, personId));
  const [lines, setLines] = useState(() => talk?.lines || []);
  const [choices, setChoices] = useState(() => talk?.choices || []);
  const [index, setIndex] = useState(0);
  const [closing, setClosing] = useState(false);
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
  const advance = () => {
    if (reading) setIndex((value) => value + 1);
    else if (closing) onClose();
  };

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
    if (ui.close && !result.lines?.length) {
      onClose();
      return;
    }
    setClosing(Boolean(ui.close));
    setLines(result.lines?.length ? result.lines : ['…']);
    setChoices(ui.close ? [] : result.choices || []);
    setIndex(0);
  };

  const waiting = reading || closing;
  return (
    <section className="dialogue dialogue--person" aria-live="polite" onClick={waiting ? advance : undefined}>
      <div className="dialogue__box" onClick={(event) => !waiting && event.stopPropagation()}>
        <div className="dialogue__portrait">
          <Asset id={person.portrait || 'portrait.poi'} alt="" />
        </div>
        <div className="dialogue__body">
          <span className="dialogue__speaker">
            {person.name}
            <small> · {person.role}</small>
          </span>
          <p className="dialogue__text">{lines[index]}</p>
          {waiting ? (
            <div className="dialogue__controls">
              <span className="dialogue__hint">Tap to continue</span>
            </div>
          ) : (
            <div className="dialogue__choices dialogue__choices--hub">
              {choices.map((choice) => (
                <button key={choice.id} type="button" className={choice.asked ? 'is-asked' : ''} onClick={() => choose(choice)}>
                  {choice.asked ? <Icon name="check" size={14} tone="plain" /> : null}
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
