import React, { useEffect, useRef, useState } from 'react';
import { freeBeds, getDialogueReply, getDialogueView, getHallView, recruitObjection } from '../game/engine.js';
import Asset from '../components/Asset.jsx';
import { Button } from '../components/UI.jsx';

const AUTO_MS = 2600;

/**
 * A conversation over a walkable scene. The view is taken once when it opens
 * (so lines do not change under the player while effects land in state).
 * Tap anywhere to advance; Skip jumps to the choices; Auto advances on a timer.
 *
 * `visit` ({ sceneId, targetId, position }) is recorded with the conversation.
 */
export default function DialogueBox({ state, actions, conversationId, visit = null, onClose, onOpenBuilding }) {
  const [view] = useState(() => getDialogueView(state, conversationId));
  // A story scene can stand in for an NPC's usual talk; its id drives everything after.
  const id = view?.id || conversationId;
  const [lines, setLines] = useState(() => view?.lines || []);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState('lines'); // lines → choices → (reply lines) → done
  const [auto, setAuto] = useState(false);
  const [recruit, setRecruit] = useState(false);
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
    if (next.recruit) {
      setRecruit(true);
      setPhase('recruit');
      return;
    }
    onClose();
    if (next.open) onOpenBuilding?.(next.open);
  };

  const atLastLine = index >= lines.length - 1;
  const advance = () => {
    if (phase === 'lines') {
      if (!atLastLine) setIndex((value) => value + 1);
      else if (phase === 'lines' && view.choices.length && !followUp.current.replied) setPhase('choices');
      else finish();
    }
  };
  const skip = () => {
    if (phase !== 'lines') return;
    setIndex(Math.max(0, lines.length - 1));
    if (view.choices.length && !followUp.current.replied) setPhase('choices');
  };

  useEffect(() => {
    if (!auto || phase !== 'lines') return undefined;
    const timer = window.setTimeout(advance, AUTO_MS);
    return () => window.clearTimeout(timer);
  });

  const choose = (choice) => {
    const reply = getDialogueReply(state, id, view.variantIndex, choice.index);
    const ui = actions.chooseDialogue(id, view.variantIndex, choice.index);
    if (!ui) return;
    followUp.current = { ...followUp.current, ...ui, replied: true };
    if (reply.length) {
      setLines(reply);
      setIndex(0);
      setPhase('lines');
    } else finish();
  };

  if (!view) return null;
  const line = lines[index] || { speaker: view.speaker, portrait: view.portrait, text: '' };
  const here = state.world?.currentLocationId || 'dunmere';
  const recruits = recruit ? state.candidates.filter((candidate) => (candidate.locationId || 'dunmere') === here).slice(0, 3) : [];

  return (
    <section className="dialogue" aria-live="polite" onClick={phase === 'lines' ? advance : undefined}>
      <div className="dialogue__box" onClick={(event) => phase !== 'lines' && event.stopPropagation()}>
        <div className="dialogue__portrait">
          <Asset id={line.portrait || 'portrait.poi'} alt="" />
        </div>
        <div className="dialogue__body">
          <span className="dialogue__speaker">{line.speaker}</span>
          {phase === 'recruit' ? (
            <div className="dialogue__recruits">
              <p>{recruits.length ? 'They point out who is looking for work:' : 'Nobody here is looking for work right now.'}</p>
              {recruits.length && freeBeds(state) <= 0 ? (
                <p className="dialogue__note">
                  Every bed is taken.{' '}
                  {getHallView(state).owned ? 'Build bunks in the Guild Hall first.' : 'Rent the old stable on Banner Plaza first.'}
                </p>
              ) : null}
              {recruits.map((candidate) => (
                <div key={candidate.id} className="dialogue__recruit">
                  <span>
                    <strong>{candidate.name}</strong>
                    <small>
                      {candidate.classId} · {candidate.primal} · fee {candidate.signingFee} crowns
                    </small>
                    {recruitObjection(state, candidate) ? <small className="dialogue__refusal">“{recruitObjection(state, candidate)}”</small> : null}
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={state.guild.crowns < candidate.signingFee || freeBeds(state) <= 0 || Boolean(recruitObjection(state, candidate))}
                    onClick={() => {
                      actions.recruit(candidate.id);
                      onClose();
                    }}
                  >
                    Invite
                  </Button>
                </div>
              ))}
              <div className="dialogue__choices">
                <button type="button" onClick={() => onOpenBuilding?.('tavern')}>
                  Meet them at the tavern
                </button>
                <button type="button" onClick={onClose}>
                  Leave
                </button>
              </div>
            </div>
          ) : (
            <p className="dialogue__text">{line.text}</p>
          )}
          {phase === 'choices' ? (
            <div className="dialogue__choices">
              {view.choices.map((choice) => (
                <button key={choice.index} type="button" onClick={() => choose(choice)}>
                  {choice.text}
                </button>
              ))}
              <button type="button" onClick={finish}>
                Leave
              </button>
            </div>
          ) : null}
          {phase === 'lines' ? (
            <div className="dialogue__controls" onClick={(event) => event.stopPropagation()}>
              <span className="dialogue__hint">{atLastLine && !(view.choices.length && !followUp.current.replied) ? 'Tap to close' : 'Tap to continue'}</span>
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
