import React, { useEffect, useRef, useState } from 'react';
import { getDialogueReply, getDialogueView, getTopicReply } from '../game/engine.js';
import Asset from '../components/Asset.jsx';
import Icon from '../components/Icon.jsx';
import { prefersInstantText, useTypewriter } from './useTypewriter.js';
import TypedLine from './TypedLine.jsx';

const AUTO_MS = 2600;

/**
 * A conversation over a walkable scene (docs/DIALOGUE.md). The view is taken
 * once when it opens, so lines do not change under the player while effects
 * land in state. The shape: the NPC's opener → small talk (or, in a story
 * scene, the decision) → the hub of topics (asked ones are checked) → goodbye.
 * A tap finishes the line, then moves on; hold to speed up; swipe up for the log.
 * Skip finishes the line, then jumps to the next choice (never past one) or the end.
 *
 * `visit` ({ sceneId, targetId, position }) is recorded with the conversation.
 */
export default function DialogueBox({ state, actions, conversationId, visit = null, onClose, onOpenBuilding }) {
  const [view] = useState(() => getDialogueView(state, conversationId));
  // A story scene can stand in for an NPC's usual talk; its id drives everything after.
  const id = view?.id || conversationId;
  const [lines, setLines] = useState(() => view?.lines || []);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState('lines'); // lines | choices | hub
  // What comes when the current lines end: the small talk, the hub, or the end.
  const after = useRef(view?.choices.length ? 'choices' : view?.hub ? 'hub' : 'close');
  // In a decision scene, questions return to the decision.
  const back = view?.decide ? 'choices' : 'hub';
  const [asked, setAsked] = useState(() => new Set((view?.hub || []).filter((topic) => topic.asked).map((topic) => topic.id)));
  const [auto, setAuto] = useState(false);
  // Hold anywhere to fast-forward the lines; swipe up for the conversation so far.
  const [holding, setHolding] = useState(false);
  const [log, setLog] = useState(false);
  const logSwipe = useRef(null);
  const seen = useRef([]);
  const press = useRef(null);
  const followUp = useRef({});
  const started = useRef(false);

  // Count the conversation and apply its own effects once.
  useEffect(() => {
    if (started.current || !view) return;
    started.current = true;
    followUp.current = actions.talk(id, visit) || {};
  }, [actions, id, view, visit]);

  const finish = () => {
    const next = followUp.current;
    onClose();
    if (next.open) onOpenBuilding?.(next.open);
  };
  const say = (reply, then) => {
    after.current = then;
    if (!reply.length) {
      if (then === 'close') finish();
      else setPhase(then);
      return;
    }
    setLines(reply);
    setIndex(0);
    setPhase('lines');
  };
  const endLines = () => {
    if (after.current === 'close') finish();
    else setPhase(after.current);
  };

  const atLastLine = index >= lines.length - 1;
  const current = lines[index] || null;
  const typing = useTypewriter(phase === 'lines' ? current?.text : '', prefersInstantText(state.settings));
  const advance = () => {
    if (phase !== 'lines') return;
    if (!typing.done) typing.finish();
    else if (!atLastLine) setIndex((value) => value + 1);
    else endLines();
  };
  const skip = () => {
    if (phase !== 'lines') return;
    if (!typing.done) typing.finish();
    else endLines();
  };

  useEffect(() => {
    if ((!auto && !holding) || phase !== 'lines') return undefined;
    const timer = window.setTimeout(advance, holding ? 120 : typing.done ? AUTO_MS : 200);
    return () => window.clearTimeout(timer);
  });

  // Small talk or a story decision.
  const choose = (choice) => {
    const reply = getDialogueReply(state, id, view.variantIndex, choice.index);
    const ui = actions.chooseDialogue(id, view.variantIndex, choice.index);
    if (!ui) return;
    followUp.current = { ...followUp.current, ...ui };
    say(reply, view.hub && !view.decide && !ui.open ? 'hub' : 'close');
  };
  // A topic from the hub: its answer, then back to the hub.
  const ask = (topic) => {
    const reply = getTopicReply(state, id, topic.id);
    const ui = actions.askTopic(id, topic.id);
    if (!ui) return;
    followUp.current = { ...followUp.current, ...ui };
    setAsked((current) => new Set(current).add(topic.id));
    say(reply, ui.open ? 'close' : back);
  };
  const goodbye = () => say(view.bye?.lines || [], 'close');

  if (!view) return null;
  const line = lines[index] || { speaker: view.speaker, portrait: view.portrait, text: '' };
  if (line.text && seen.current.at(-1) !== line) seen.current.push(line);

  return (
    <section
      className="dialogue"
      aria-live="polite"
      onClick={phase === 'lines' && !press.current?.used ? advance : undefined}
      onPointerDown={(event) => {
        const state = { y: event.clientY, used: false, timer: 0 };
        state.timer = window.setTimeout(() => {
          state.used = true;
          setHolding(true);
        }, 400);
        press.current = state;
      }}
      onPointerUp={(event) => {
        const state = press.current;
        if (!state) return;
        window.clearTimeout(state.timer);
        setHolding(false);
        if (state.y - event.clientY > 60) {
          state.used = true;
          setLog(true);
        }
        window.setTimeout(() => (press.current = null), 0);
      }}
      onPointerCancel={() => {
        window.clearTimeout(press.current?.timer);
        setHolding(false);
        press.current = null;
      }}
    >
      {log ? (
        <div
          className="dialogue__log"
          role="dialog"
          aria-label="The conversation so far"
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          onPointerUp={(event) => event.stopPropagation()}
        >
          <div
            className="dialogue__log-head"
            onPointerDown={(event) => {
              logSwipe.current = event.clientY;
              event.currentTarget.setPointerCapture?.(event.pointerId);
            }}
            onPointerUp={(event) => {
              const from = logSwipe.current;
              logSwipe.current = null;
              if (from !== null && event.clientY - from > 60) setLog(false);
            }}
          >
            <strong>So far</strong>
            <button type="button" className="section__close" onClick={() => setLog(false)} aria-label="Close the log">
              <Icon name="close" size={18} tone="plain" />
            </button>
          </div>
          <div className="dialogue__log-body">
            {seen.current.map((entry, row) => (
              <p key={row}>
                {entry.speaker ? <b>{entry.speaker}: </b> : null}
                {entry.text}
              </p>
            ))}
          </div>
        </div>
      ) : null}
      <div className="dialogue__box" onClick={(event) => phase !== 'lines' && event.stopPropagation()}>
        <div className="dialogue__portrait">
          <Asset id={line.portrait || 'portrait.poi'} alt="" />
        </div>
        <div className="dialogue__body">
          {line.speaker ? <span className="dialogue__speaker">{line.speaker}</span> : null}
          <TypedLine className={`dialogue__text${line.speaker ? '' : ' is-narration'}`} text={line.text} shown={phase === 'lines' ? typing.shown : line.text} />
          {phase === 'choices' ? (
            <div className="dialogue__choices">
              {view.decide && view.hub
                ? view.hub.map((topic) => (
                    <button key={topic.id} type="button" className={`dialogue__ask ${asked.has(topic.id) ? 'is-asked' : ''}`} onClick={() => ask(topic)}>
                      {asked.has(topic.id) ? <Icon name="check" size={14} tone="plain" /> : null}
                      {topic.text}
                    </button>
                  ))
                : null}
              {view.choices.map((choice) => (
                <button key={choice.index} type="button" onClick={() => choose(choice)}>
                  {choice.text}
                </button>
              ))}
              {(!view.hub || view.decide) && view.leave ? (
                <button type="button" onClick={finish}>
                  {view.leave}
                </button>
              ) : null}
            </div>
          ) : null}
          {phase === 'hub' ? (
            <div className="dialogue__choices dialogue__choices--hub">
              {view.hub.map((topic) => (
                <button key={topic.id} type="button" className={asked.has(topic.id) ? 'is-asked' : ''} onClick={() => ask(topic)}>
                  {asked.has(topic.id) ? <Icon name="check" size={14} tone="plain" /> : null}
                  {topic.text}
                </button>
              ))}
              <button type="button" className="dialogue__bye" onClick={goodbye}>
                {view.bye?.text || 'Goodbye.'}
              </button>
            </div>
          ) : null}
          {phase === 'lines' ? (
            <div className="dialogue__controls" onClick={(event) => event.stopPropagation()}>
              <span className="dialogue__hint">{atLastLine && after.current === 'close' ? 'Tap to close' : 'Tap · hold = faster · swipe up = log'}</span>
              <button type="button" className={auto ? 'is-on' : ''} onClick={() => setAuto((value) => !value)} aria-pressed={auto}>
                Auto
              </button>
              <button type="button" onClick={skip}>
                Skip
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
