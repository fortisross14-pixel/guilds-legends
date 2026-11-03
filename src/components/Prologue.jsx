import React, { useState } from 'react';
import { PLAYER_HOUSE_MAP } from '../data/playerHouse.js';
import { PROLOGUE } from '../data/story.js';
import WalkableScene, { useCoarsePointer } from '../explore/WalkableScene.jsx';
import Asset from './Asset.jsx';
import { Button } from './UI.jsx';

// The prologue, "The knock at the door" (docs/STORY.md, Scene 01). The house
// is walkable; the scene's lines play in a dialogue box over it. Phases:
// knock (narration) → door (walk and open it) → rook (his confession) →
// choice (the four ways to answer danger) → after (the result, the mark on the
// door) → name (name the new guild). Nothing is saved until the end.
export default function Prologue({ state, onComplete }) {
  const coarse = useCoarsePointer();
  const [phase, setPhase] = useState('knock');
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState(null);
  const [name, setName] = useState(state.guild.name && state.guild.name !== 'The Broken Lantern' ? state.guild.name : '');

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

  const advance = () => {
    if (index < script.length - 1) {
      setIndex(index + 1);
      return;
    }
    setIndex(0);
    if (phase === 'knock') setPhase('door');
    else if (phase === 'rook') setPhase('choice');
    else if (phase === 'after') setPhase('name');
  };
  const interact = (target) => {
    if (phase === 'door' && target.id === 'door') {
      setIndex(0);
      setPhase('rook');
    }
  };
  const pick = (id) => {
    setChoice(id);
    setIndex(0);
    setPhase('after');
  };

  const objective = phase === 'door' ? 'Someone is knocking. Open the door.' : 'Dunmere, Year 1187. Night.';
  const hint = coarse ? 'Tap to walk. Tap the door to open it.' : 'Click to walk, or use the arrow keys.';
  return (
    <WalkableScene
      map={PLAYER_HOUSE_MAP}
      activeTargets={phase === 'door' ? ['door'] : phase === 'knock' ? [] : ['rook']}
      paused={phase !== 'door'}
      joystick={Boolean(state.settings?.joystick)}
      onInteract={interact}
      className="opening-exploration"
      label="Prologue: the knock at the door"
    >
      <header className="walk-hud">
        <div className="walk-hud__place">
          <span>{PROLOGUE.place}</span>
          <h1>{PROLOGUE.title}</h1>
          <small>
            {objective} {phase === 'door' ? hint : ''}
          </small>
        </div>
      </header>
      {line ? (
        <section className="dialogue prologue-dialogue" aria-live="polite" onClick={advance}>
          <div className="dialogue__box">
            {line.portrait ? (
              <div className="dialogue__portrait">
                <Asset id={line.portrait} alt="" />
              </div>
            ) : null}
            <div className="dialogue__body">
              <span className="dialogue__speaker">{line.speaker === 'Narration' ? '' : line.speaker}</span>
              <p className={`dialogue__text ${line.speaker === 'Narration' ? 'is-narration' : ''}`}>{line.text}</p>
              <div className="dialogue__controls">
                <span className="dialogue__hint">Tap to continue</span>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setIndex(script.length - 1);
                  }}
                >
                  Skip
                </button>
              </div>
            </div>
          </div>
        </section>
      ) : null}
      {phase === 'choice' ? (
        <section className="dialogue prologue-dialogue" aria-live="polite">
          <div className="dialogue__box">
            <div className="dialogue__body">
              <span className="dialogue__speaker">The footsteps stop. Someone tries the door.</span>
              <p className="dialogue__text is-narration">What do you do?</p>
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
            <span className="eyebrow">The Broken Lantern is gone</span>
            <h1>Name your guild</h1>
            <p>
              The banner stays with you as a relic of the old guild. The guild you found is new, and the name is yours to choose. {state.guild.founder} leads it.
            </p>
            <label className="opening-identity__field">
              Guild name
              <input value={name} maxLength={38} placeholder="The Ember Company" onChange={(event) => setName(event.target.value)} autoFocus />
            </label>
            <Button variant="primary" disabled={!name.trim() || name.trim().toLowerCase() === 'the broken lantern'} onClick={() => onComplete({ choice, guildName: name.trim() })}>
              Raise the banner
            </Button>
            {name.trim().toLowerCase() === 'the broken lantern' ? <small className="muted">That name belongs to the dead. Choose your own.</small> : null}
          </div>
        </section>
      ) : null}
    </WalkableScene>
  );
}
