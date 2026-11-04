import React, { useEffect, useRef, useState } from 'react';
import { getPersonTalk } from '../game/engine.js';
import Asset from '../components/Asset.jsx';
import Icon from '../components/Icon.jsx';
import { toast } from '../components/UI.jsx';
import { prefersInstantText, useTypewriter } from './useTypewriter.js';
import TypedLine from './TypedLine.jsx';
import RecruitCard from './RecruitCard.jsx';

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

  // After Skip, the last line shows whole, so the topics come up at once.
  const [skipped, setSkipped] = useState(false);
  const typing = useTypewriter(lines[index] || '', skipped || prefersInstantText(state.settings));
  if (!talk) return null;
  const { person } = talk;
  // A recruit's ID card sits above the box from the first line (battle-hiring spec).
  const candidate = person.candidateId ? (state.candidates || []).find((item) => item.id === person.candidateId) : null;
  const reading = index < lines.length - 1 || !typing.done;
  // A tap finishes the line, then moves on; Skip finishes it, then jumps to the topics (or closes).
  const advance = () => {
    if (!typing.done) typing.finish();
    else if (index < lines.length - 1) setIndex((value) => value + 1);
    else if (closing) onClose();
  };
  const skip = () => {
    if (!typing.done) typing.finish();
    else if (closing) onClose();
    else {
      setSkipped(true);
      setIndex(lines.length - 1);
    }
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
    setSkipped(false);
    setLines(result.lines?.length ? result.lines : ['…']);
    setChoices(ui.close ? [] : result.choices || []);
    setIndex(0);
  };

  const waiting = reading || closing;
  return (
    <section className="dialogue dialogue--person" aria-live="polite" onClick={waiting ? advance : undefined}>
      {candidate ? <RecruitCard state={state} candidate={candidate} /> : null}
      <div className="dialogue__box" onClick={(event) => !waiting && event.stopPropagation()}>
        <div className="dialogue__portrait">
          <Asset id={person.portrait || 'portrait.poi'} alt="" />
        </div>
        <div className="dialogue__body">
          <span className="dialogue__speaker">
            {person.name}
            <small> · {person.role}</small>
          </span>
          <TypedLine text={lines[index]} shown={typing.shown} />
          {waiting ? (
            <div className="dialogue__controls" onClick={(event) => event.stopPropagation()}>
              <span className="dialogue__hint">{closing && index >= lines.length - 1 ? 'Tap to close' : 'Tap to continue'}</span>
              <button type="button" onClick={skip}>
                Skip
              </button>
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
