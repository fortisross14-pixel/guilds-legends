import GuildBanner from './GuildBanner.jsx';
import { BANNER_COLORS, BANNER_EMBLEMS, BANNER_PATTERNS, DEFAULT_BANNER, colorHex } from '../data/banner.js';
import React, { useMemo, useState } from 'react';
import { PROLOGUE } from '../data/story.js';
import { CHARTER_LIST, PATHS } from '../data/charters.js';
import { useCoarsePointer } from '../explore/WalkableScene.jsx';
import WalkableScene from '../explore/WalkableScene.jsx';
import { interiorMap } from '../explore/sceneMap.js';
import { interiorLayout } from '../data/interiors.js';
import Icon from './Icon.jsx';
import { PlaceTag } from '../hud/Hud.jsx';
import Asset from './Asset.jsx';
import { Button, founderArt } from './UI.jsx';
import { prefersInstantText, useTypewriter } from '../explore/useTypewriter.js';
import { useChoiceGuard } from './gestures.js';
import TypedLine from '../explore/TypedLine.jsx';

// The prologue, "The knock at the door" (docs/STORY.md, Scene 01). The house
// is one small walkable room (a bed, the hearth, a table, the door); the scene's
// lines play in a dialogue box over it. Phases:
// knock (narration) → door (walk to the door and open it) → rook (his confession) →
// choice (the four ways to answer danger) → after (the result, the mark on the
// door) → name (found the guild with Rook's banner: name, motto, charter).
// Nothing is saved until the end. A skipped tutorial goes straight to the founding.
export default function Prologue({ state, onComplete }) {
  const coarse = useCoarsePointer();
  const skipping = Boolean(state.story?.skipRequested);
  const [phase, setPhase] = useState(skipping ? 'name' : 'knock');
  const [motto, setMotto] = useState('No light is lost forever.');
  const [banner, setBanner] = useState(DEFAULT_BANNER);
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
  const choiceGuard = useChoiceGuard(phase);

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
  const openDoor = () => {
    if (phase !== 'door') return;
    setIndex(0);
    setPhase('rook');
  };
  const pick = (id) => {
    setChoice(id);
    setIndex(0);
    setPhase('after');
  };

  // The room: the founder by the bed; once the door is open, Rook lies on the floor inside it.
  const rookIn = phase === 'rook';
  const map = useMemo(() => {
    const layout = interiorLayout('house', 'dunmere');
    const people = rookIn ? [{ id: 'rook', spot: 'rook', sprite: 'npc.house.rook', name: 'Cassian Rook', role: 'Wounded stranger', met: true }] : [];
    const room = interiorMap({ id: 'prologue', layout, people, townName: 'the street' });
    const targets = room.targets.map((target) =>
      target.kind === 'exit' ? { ...target, name: 'The front door', verb: 'Open', confirm: 'Open the door' } : { ...target, label: false },
    );
    return {
      ...room,
      targets,
      founderAt: { x: ((layout.spots.founder?.[0] ?? 36) / 100) * room.size.width, y: ((layout.spots.founder?.[1] ?? 74) / 100) * room.size.height },
    };
  }, [rookIn]);

  const objective = coarse ? 'Someone is knocking. Walk to the door.' : 'Someone is knocking. Walk to the door (click it).';
  return (
    <WalkableScene
        playerAsset={founderArt(state)}
      key={rookIn ? 'rook' : 'alone'}
      map={map}
      start={map.founderAt}
      activeTargets={phase === 'door' ? ['exit'] : []}
      beacons={phase === 'door' ? ['exit'] : []}
      paused={phase !== 'door'}
      onInteract={(target) => target.kind === 'exit' && openDoor()}
      className="opening-exploration room room--house"
      label="Prologue: the knock at the door"
    >
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
                <div className="dialogue__choices" {...choiceGuard}>
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
              <fieldset className="banner-maker">
                <legend>Your banner</legend>
                <div className="banner-maker__preview">
                  <GuildBanner banner={banner} size={88} title={`The banner of ${name.trim() || 'your guild'}`} />
                </div>
                <div className="banner-maker__rows">
                  <div className="banner-maker__row" role="group" aria-label="Pattern">
                    <span>Pattern</span>
                    <div className="banner-maker__options">
                      {BANNER_PATTERNS.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className={`banner-maker__pattern${banner.pattern === item.id ? ' is-selected' : ''}`}
                          aria-pressed={banner.pattern === item.id}
                          aria-label={item.name}
                          title={item.name}
                          onClick={() => setBanner({ ...banner, pattern: item.id })}
                        >
                          <GuildBanner banner={{ ...banner, pattern: item.id }} plain size={26} title={item.name} />
                        </button>
                      ))}
                    </div>
                  </div>
                  {[0, 1].slice(0, BANNER_PATTERNS.find((item) => item.id === banner.pattern)?.colors || 1).map((slot) => (
                    <div key={slot} className="banner-maker__row" role="group" aria-label={slot ? 'Second colour' : 'First colour'}>
                      <span>{slot ? 'Second colour' : 'Colour'}</span>
                      <div className="banner-maker__options">
                        {BANNER_COLORS.map((color) => (
                          <button
                            key={color.id}
                            type="button"
                            className={`banner-maker__swatch${banner.colors[slot] === color.id ? ' is-selected' : ''}`}
                            style={{ background: color.hex }}
                            aria-pressed={banner.colors[slot] === color.id}
                            aria-label={color.name}
                            title={color.name}
                            onClick={() => setBanner({ ...banner, colors: slot ? [banner.colors[0], color.id] : [color.id, banner.colors[1]] })}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="banner-maker__row" role="group" aria-label="Emblem">
                    <span>Emblem</span>
                    <div className="banner-maker__options">
                      {BANNER_EMBLEMS.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className={`banner-maker__emblem${banner.emblem === item.id ? ' is-selected' : ''}`}
                          aria-pressed={banner.emblem === item.id}
                          aria-label={item.name}
                          title={item.name}
                          onClick={() => setBanner({ ...banner, emblem: item.id })}
                        >
                          <Icon name={item.id} size={22} tone="plain" />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="banner-maker__row" role="group" aria-label="Emblem colour">
                    <span>Emblem colour</span>
                    <div className="banner-maker__options">
                      {BANNER_COLORS.map((color) => (
                        <button
                          key={color.id}
                          type="button"
                          className={`banner-maker__swatch${banner.emblemColor === color.id ? ' is-selected' : ''}`}
                          style={{ background: colorHex(color.id) }}
                          aria-pressed={banner.emblemColor === color.id}
                          aria-label={color.name}
                          title={color.name}
                          onClick={() => setBanner({ ...banner, emblemColor: color.id })}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </fieldset>
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
                onClick={() => onComplete({ choice, guildName: name.trim(), motto: motto.trim(), charter, banner })}
              >
                Raise the banner
              </Button>
            </div>
          </section>
        ) : null}
      </>
    </WalkableScene>
  );
}
