import React, { useState } from 'react';
import { PLAYER_HOUSE } from '../data/playerHouse.js';
import { PROLOGUE } from '../data/story.js';
import { CHARTER_LIST, PATHS } from '../data/charters.js';
import { useCoarsePointer } from '../explore/WalkableScene.jsx';
import PaintedScene, { at, box } from '../explore/PaintedScene.jsx';
import Icon from './Icon.jsx';
import { PlaceTag } from '../hud/Hud.jsx';
import Asset from './Asset.jsx';
import { Button } from './UI.jsx';
import { prefersInstantText, useTypewriter } from '../explore/useTypewriter.js';
import TypedLine from '../explore/TypedLine.jsx';

// The prologue, "The knock at the door" (docs/STORY.md, Scene 01). The house
// is a painted scene; the scene's lines play in a dialogue box over it. Phases:
// knock (narration) → door (tap it, then "Open the door") → rook (his confession) →
// choice (the four ways to answer danger) → after (the result, the mark on the
// door) → name (found the guild with Rook's banner: name, motto, charter).
// Nothing is saved until the end. A skipped tutorial goes straight to the founding.
export default function Prologue({ state, onComplete }) {
  const coarse = useCoarsePointer();
  const skipping = Boolean(state.story?.skipRequested);
  const [phase, setPhase] = useState(skipping ? 'name' : 'knock');
  const [motto, setMotto] = useState('No light is lost forever.');
  const [charter, setCharter] = useState('free');
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState(null);
  // The guild has no name until the banner is raised (the engine's placeholder is never offered).
  const [name, setName] = useState('');

  const picked = PROLOGUE.choices.find((item) => item.id === choice);
  const script =
    phase === 'knock'
      ? PROLOGUE.lines
      : phase === 'rook'
        ? PROLOGUE.door
        : phase === 'after'
          ? [{ speaker: 'Narration', text: picked?.result || '' }, ...PROLOGUE.after]
          : [];
  const line = script[index] || null;
  const typing = useTypewriter(line?.text || '', prefersInstantText(state.settings));

  // The end of this part of the scene: walk to the door, the choice, or the founding.
  const endScript = () => {
    setIndex(0);
    if (phase === 'knock') setPhase('door');
    else if (phase === 'rook') setPhase('choice');
    else if (phase === 'after') setPhase('name');
  };
  // A tap finishes the line, then moves on.
  const advance = () => {
    if (!typing.done) typing.finish();
    else if (index < script.length - 1) setIndex(index + 1);
    else endScript();
  };
  // Skip finishes the line, then jumps to the next choice or the end (never past the choice).
  const skip = () => {
    if (!typing.done) typing.finish();
    else endScript();
  };
  // The door asks first (a bubble), like every door (playtest-1-feedback).
  const [ask, setAsk] = useState(false);
  const openDoor = () => {
    setAsk(false);
    if (phase !== 'door') return;
    setIndex(0);
    setPhase('rook');
  };
  const pick = (id) => {
    setChoice(id);
    setIndex(0);
    setPhase('after');
  };

  const objective = coarse ? 'Someone is knocking. Tap the door.' : 'Someone is knocking. Click the door.';
  return (
    <PaintedScene
      art={PLAYER_HOUSE.art}
      focusX={66}
      className="opening-exploration interior--house"
      label="Prologue: the knock at the door"
      onBackgroundTap={() => ask && setAsk(false)}
      overlay={
        <>
          <PlaceTag title={PROLOGUE.title} sub={PROLOGUE.place} goal={phase === 'door' ? <p className="goal-line goal-line--status">{objective}</p> : null} />
          {line ? (
            <section className="dialogue prologue-dialogue" aria-live="polite" onClick={advance}>
              <div className={`dialogue__box is-reading${line.portrait ? '' : ' is-narrated'}`}>
                {line.portrait ? (
                  <div className="dialogue__portrait">
                    <Asset id={line.portrait} alt="" />
                  </div>
                ) : null}
                <div className="dialogue__body">
                  {line.speaker && line.speaker !== 'Narration' ? <span className="dialogue__speaker">{line.speaker}</span> : null}
                  <TypedLine className={`dialogue__text${line.speaker === 'Narration' ? ' is-narration' : ''}`} text={line.text} shown={typing.shown} />
                </div>
                <div className="dialogue__controls">
                  <span className="dialogue__hint">Tap to continue</span>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      skip();
                    }}
                  >
                    Skip
                  </button>
                </div>
              </div>
            </section>
          ) : null}
          {phase === 'choice' ? (
            <section className="dialogue prologue-dialogue" aria-live="polite">
              <div className="dialogue__box">
                <div className="dialogue__body">
                  <p className="dialogue__text is-narration">The footsteps stop. Someone tries the door. What do you do?</p>
                  <div className="dialogue__choices">
                    {PROLOGUE.choices.map((item) => (
                      <button key={item.id} type="button" onClick={() => pick(item.id)}>
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          ) : null}
          {phase === 'name' ? (
            <section className="opening-identity">
              <div className="opening-identity__card panel">
                <Asset id="relic.banner" className="opening-identity__banner" alt="The torn banner with a golden lantern" />
                <h1>Found your guild</h1>
                <p>
                  {skipping
                    ? 'Rook’s banner is yours: a relic of the Broken Lantern, and the start of something new.'
                    : 'The Broken Lantern is gone. Its banner is in your hands now, a relic of the old guild.'}{' '}
                  The guild you found is new. {state.guild.founder} leads it.
                </p>
                <label className="opening-identity__field">
                  Guild name
                  <input value={name} maxLength={38} placeholder="The Ember Company" onChange={(event) => setName(event.target.value)} autoFocus />
                </label>
                {name.trim().toLowerCase() === 'the broken lantern' ? <small className="muted">That name belongs to the dead. Choose your own.</small> : null}
                <label className="opening-identity__field">
                  Motto
                  <input value={motto} maxLength={72} onChange={(event) => setMotto(event.target.value)} />
                </label>
                <fieldset className="charter-picker">
                  <legend>Charter: what kind of guild will this be?</legend>
                  <div className="charter-picker__options">
                    {CHARTER_LIST.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`charter-card ${charter === item.id ? 'is-selected' : ''}`}
                        aria-pressed={charter === item.id}
                        onClick={() => setCharter(item.id)}
                      >
                        <Asset id={item.crest} className="charter-card__crest" />
                        <strong>{item.name}</strong>
                      </button>
                    ))}
                  </div>
                  {/* Details for the chosen charter only (P-2): one panel, not four long cards. */}
                  {CHARTER_LIST.filter((item) => item.id === charter).map((item) => (
                    <div key={item.id} className="charter-detail" aria-live="polite">
                      <small>{item.pitch}</small>
                      <ul>
                        {item.modifiers.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                      <em>
                        {PATHS[item.path].name} path · {item.signature}
                      </em>
                    </div>
                  ))}
                </fieldset>
                <Button
                  variant="primary"
                  size="lg"
                  disabled={!name.trim() || name.trim().toLowerCase() === 'the broken lantern'}
                  why="Name your guild first."
                  onClick={() => onComplete({ choice, guildName: name.trim(), motto: motto.trim(), charter })}
                >
                  Raise the banner
                </Button>
              </div>
            </section>
          ) : null}
        </>
      }
    >
      <Asset id="char.founder" className="interior__sprite house__founder" style={at(PLAYER_HOUSE.founder)} alt="" />
      {['rook', 'choice', 'after', 'name'].includes(phase) ? (
        <Asset id="npc.house.rook" className="house__rook" style={at(PLAYER_HOUSE.rook)} alt="Cassian Rook, wounded on the floor" />
      ) : null}
      {phase === 'door' ? (
        <button
          type="button"
          className="interior__door house__door is-beacon"
          style={box(PLAYER_HOUSE.door)}
          onClick={(event) => {
            event.stopPropagation();
            setAsk(true);
          }}
          aria-label="The front door"
        >
          <span className="interior__tag">
            <Icon name="door" size={14} />
            The front door
          </span>
        </button>
      ) : null}
      {ask && phase === 'door' ? (
        <button
          type="button"
          className="walk__confirm interior__confirm"
          style={{ left: `${PLAYER_HOUSE.door[0] + PLAYER_HOUSE.door[2] / 2}%`, top: `${PLAYER_HOUSE.door[1]}%`, transform: "translate(-50%, -100%)" }}
          onClick={(event) => {
            event.stopPropagation();
            openDoor();
          }}
        >
          <Icon name="door" size={16} tone="plain" />
          Open the door
        </button>
      ) : null}
    </PaintedScene>
  );
}
