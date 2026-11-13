import React, { useEffect, useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { ASSETS } from '../data/assets.js';
import { personSize } from './sceneMap.js';

const JOYSTICK_RADIUS = 48;

/** What a door's or exit's bubble says: "Enter The Wayfarer", "Leave to Dunmere", "Travel: The Old Road". */
export function confirmText(target) {
  if (target.confirm) return target.confirm;
  if (target.kind === 'door') return `Enter ${target.name}`;
  const back = /^(Back|Out) to (.+)$/.exec(target.name || '');
  if (back) return `Leave to ${back[2]}`;
  return `Travel: ${target.name}`;
}
const DRAG_THRESHOLD = 12;
const KEY_DIRECTIONS = {
  ArrowUp: [0, -1],
  KeyW: [0, -1],
  ArrowDown: [0, 1],
  KeyS: [0, 1],
  ArrowLeft: [-1, 0],
  KeyA: [-1, 0],
  ArrowRight: [1, 0],
  KeyD: [1, 0],
};

/** True on touch-first devices; keyboard hints are hidden there. */
export function useCoarsePointer() {
  const query = '(pointer: coarse)';
  const [coarse, setCoarse] = useState(() => typeof window !== 'undefined' && Boolean(window.matchMedia?.(query).matches));
  useEffect(() => {
    const media = window.matchMedia?.(query);
    if (!media) return undefined;
    const update = () => setCoarse(media.matches);
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);
  return coarse;
}

/**
 * A walkable Phaser scene with the shared touch-first controls:
 * tap to walk (with pathfinding), tap a target to walk there and interact,
 * one context button when something is in reach, an optional drag-anywhere
 * joystick, and keyboard on desktop. Names are rendered here, over the canvas.
 *
 * The game is created once per mount: `map` and `start` are read only then.
 * Changing props (`activeTargets`, `paused`, `onInteract`) never rebuilds it.
 */
export default function WalkableScene({ map, start, playerAsset = null, activeTargets, beacons = [], paused = false, joystick = false, onInteract, onPeek = null, onWander = null, className = '', label, apiRef = null, children }) {
  // Long-press a label to peek (who is inside, what is for sale…) without walking there.
  const peekTimer = useRef(0);
  const peeked = useRef(false);
  // Quest markers: targets pinned to the screen edge like beacons, which can change at any time.
  const beaconsRef = useRef(beacons);
  beaconsRef.current = beacons;
  const stageRef = useRef(null);
  const controllerRef = useRef(null);
  const bridge = useRef({});
  const labelRefs = useRef({});
  const sizes = useRef(new Map());
  const frame = useRef(0);
  const pointer = useRef(null);
  const keys = useRef(new Set());
  const stickBase = useRef(null);
  const stickKnob = useRef(null);
  const viewport = useRef({ width: 0, height: 0 });
  // Where the HUD sits (place tag, ledger, orbs): names over the world never collide with it.
  const hudRects = useRef([]);
  useEffect(() => {
    const read = () => {
      hudRects.current = [...document.querySelectorAll('.place-tag > *, .ledger, .orb')].map((element) => element.getBoundingClientRect()).filter((rect) => rect.width);
    };
    read();
    const timer = window.setInterval(read, 500);
    return () => window.clearInterval(timer);
  }, []);
  // `playerAsset`: the founder's drawing for their class (src/components/UI.jsx founderArt).
  const initial = useRef({ map: playerAsset && ASSETS[playerAsset] ? { ...map, player: { ...map.player, asset: playerAsset, ...personSize(playerAsset) } } : map, start: start || map.spawn });
  const coarse = useCoarsePointer();
  const coarseRef = useRef(coarse);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [near, setNear] = useState(null);
  // A door or exit asking "Enter …?" (one bubble at a time; any other tap closes it).
  const [ask, setAsk] = useState(null);
  const askRef = useRef(null);
  const askTarget = useRef(null);
  askTarget.current = ask;
  const [stick, setStick] = useState(null);
  const active = activeTargets || map.targets.filter((target) => target.active !== false).map((target) => target.id);
  const activeKey = active.join('|');
  const activeRef = useRef(active);
  activeRef.current = active;

  // Fresh callbacks every render, read by the game through the ref.
  bridge.current = {
    onNear: (target) => setNear(target || null),
    onConfirm: (target) => setAsk(target),
    onInteract: (target, position) => onInteract?.(target, position),
    // Enough steps off the road (map.offRoad): something jumps the party (wild areas).
    onWander: (position) => onWander?.(position),
    onFrame: (project) => {
      const { width, height } = viewport.current;
      // Place labels by priority (quest beacons, then the near target, then the rest);
      // one that would overlap a label already placed, or the HUD, fades out.
      const placed = [];
      const nearId = near?.id;
      const order = [...initial.current.map.targets].sort((a, b) => rank(b) - rank(a));
      function rank(target) {
        return (beaconsRef.current.includes(target.id) ? 4 : 0) + (target.beacon ? 2 : 0) + (target.id === nearId ? 1 : 0);
      }
      // Label sizes are read once and cached (re-read every couple of seconds): reading them
      // every frame, between writes, forced a layout per label and slowed big screens to a crawl.
      frame.current += 1;
      if (frame.current % 120 === 1) sizes.current = new Map();
      order.forEach((target) => {
        const element = labelRefs.current[target.id];
        if (!element) return;
        let size = sizes.current.get(target.id);
        if (!size) {
          size = { w: element.offsetWidth || 80, h: element.offsetHeight || 28 };
          sizes.current.set(target.id, size);
        }
        const point = project(target.labelAt?.x ?? target.x, target.labelAt?.y ?? target.y + 6);
        let { x, y } = point;
        let edge = '';
        // Beacons stay on screen, pinned to the nearest edge with an arrow.
        if ((target.beacon || beaconsRef.current.includes(target.id)) && width) {
          const half = size.w / 2 + 10;
          const top = 132;
          const bottom = height - 104;
          if (x < half) [x, edge] = [half, 'left'];
          else if (x > width - half) [x, edge] = [width - half, 'right'];
          if (y < top) [y, edge] = [top, edge || 'up'];
          else if (y > bottom) [y, edge] = [bottom, edge || 'down'];
        }
        if (element.dataset.edge !== edge) element.dataset.edge = edge;
        const { w, h } = size;
        const hits = (rect) => x + w / 2 > rect.left - 4 && x - w / 2 < rect.right + 4 && y + h > rect.top - 2 && y < rect.bottom + 2;
        const under = (!edge && hudRects.current.some(hits)) || placed.some(hits);
        if (!under) placed.push({ left: x - w / 2, right: x + w / 2, top: y, bottom: y + h });
        if ((element.dataset.underHud === '1') !== under) element.dataset.underHud = under ? '1' : '';
        element.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0) translateX(-50%)`;
      });
      if (askRef.current && askTarget.current) {
        const target = askTarget.current;
        const point = project(target.labelAt?.x ?? target.x, target.labelAt?.y ?? target.y + 6);
        const x = Math.min(Math.max(point.x, 110), (width || 400) - 110);
        const y = Math.min(Math.max(point.y - 52, 120), (height || 800) - 160);
        askRef.current.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0) translateX(-50%)`;
      }
    },
  };

  // Create the game once per mount; Phaser is downloaded on first use.
  useEffect(() => {
    let cancelled = false;
    let controller = null;
    let observer = null;
    import('./walkGame.js')
      // The scene may be gone before Phaser arrives (a quick place change): build nothing then.
      .then(({ createWalkGame }) =>
        cancelled || !stageRef.current ? null : createWalkGame({ parent: stageRef.current, map: initial.current.map, start: initial.current.start, bridge, coarse: coarseRef.current }),
      )
      .then((created) => {
        if (!created) return;
        controller = created;
        if (cancelled) {
          created.destroy();
          return;
        }
        controllerRef.current = created;
        if (apiRef) apiRef.current = created;
        created.setActiveTargets(activeRef.current);
        const measure = () => {
          viewport.current = { width: stageRef.current?.clientWidth || 0, height: stageRef.current?.clientHeight || 0 };
        };
        measure();
        observer = new ResizeObserver(() => {
          measure();
          created.resize();
        });
        observer.observe(stageRef.current);
        window.render_game_to_text = () => JSON.stringify(created.snapshot());
        setReady(true);
      })
      .catch((error) => {
        console.error('Walkable scene failed to load', error);
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      observer?.disconnect();
      controller?.destroy();
      controllerRef.current = null;
      if (apiRef) apiRef.current = null;
      if (window.render_game_to_text) delete window.render_game_to_text;
    };
  }, []);

  useEffect(() => {
    controllerRef.current?.setActiveTargets(activeRef.current);
  }, [activeKey, ready]);

  useEffect(() => {
    controllerRef.current?.setPaused(paused);
    if (paused) setNear(null);
  }, [paused, ready]);

  // Keyboard (desktop extra): arrows/WASD to walk, Space/Enter/E to interact.
  useEffect(() => {
    const typing = (event) => /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(event.target?.tagName || '');
    const push = () => {
      let x = 0;
      let y = 0;
      keys.current.forEach((code) => {
        x += KEY_DIRECTIONS[code][0];
        y += KEY_DIRECTIONS[code][1];
      });
      controllerRef.current?.setStick(Math.sign(x), Math.sign(y));
    };
    const down = (event) => {
      if (paused || typing(event)) return;
      if (KEY_DIRECTIONS[event.code]) {
        event.preventDefault();
        keys.current.add(event.code);
        push();
      } else if (['Space', 'Enter', 'KeyE'].includes(event.code) && !event.repeat) {
        event.preventDefault();
        controllerRef.current?.interact();
      }
    };
    const up = (event) => {
      if (!KEY_DIRECTIONS[event.code]) return;
      keys.current.delete(event.code);
      push();
    };
    const blur = () => {
      keys.current.clear();
      push();
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, [paused]);

  const local = (event) => {
    const rect = stageRef.current.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const onPointerDown = (event) => {
    if (event.button > 0 || !controllerRef.current) return;
    // Any tap away from the bubble closes it (a tap on another door opens that one's).
    if (ask) setAsk(null);
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const point = local(event);
    pointer.current = { id: event.pointerId, start: point, last: point, lastAt: performance.now(), mode: joystick ? 'pending' : 'steer' };
    // Without the joystick a press walks at once; holding and dragging steers.
    if (!joystick) controllerRef.current.tap(point.x, point.y);
  };

  const onPointerMove = (event) => {
    const current = pointer.current;
    if (!current || current.id !== event.pointerId) return;
    const point = local(event);
    const dx = point.x - current.start.x;
    const dy = point.y - current.start.y;
    if (current.mode === 'pending' && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      current.mode = 'stick';
      setStick({ x: current.start.x, y: current.start.y });
    }
    if (current.mode === 'stick') {
      const length = Math.hypot(dx, dy);
      const clamped = Math.min(length, JOYSTICK_RADIUS);
      const kx = length ? (dx / length) * clamped : 0;
      const ky = length ? (dy / length) * clamped : 0;
      controllerRef.current?.setStick(kx / JOYSTICK_RADIUS, ky / JOYSTICK_RADIUS);
      if (stickKnob.current) stickKnob.current.style.transform = `translate(${kx}px, ${ky}px)`;
    } else if (current.mode === 'steer' && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      const now = performance.now();
      if (now - current.lastAt > 110 && Math.hypot(point.x - current.last.x, point.y - current.last.y) > 10) {
        controllerRef.current?.tap(point.x, point.y, { targets: false });
        current.last = point;
        current.lastAt = now;
      }
    }
  };

  const onPointerEnd = (event) => {
    const current = pointer.current;
    if (!current || current.id !== event.pointerId) return;
    pointer.current = null;
    if (current.mode === 'pending' && event.type === 'pointerup') {
      const point = local(event);
      controllerRef.current?.tap(point.x, point.y);
    }
    if (current.mode === 'stick') {
      controllerRef.current?.setStick(0, 0);
      setStick(null);
    }
  };

  return (
    <main className={`walk ${className}`} aria-label={label}>
      <div className="walk__stage" ref={stageRef} />
      <div
        className="walk__touch"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onContextMenu={(event) => event.preventDefault()}
        aria-hidden="true"
      />
      {ask && ready ? (
        <button
          type="button"
          ref={askRef}
          className="walk__confirm"
          onClick={() => {
            const id = ask.id;
            setAsk(null);
            controllerRef.current?.goTo(id, { confirmed: true });
          }}
        >
          <Icon name={ask.kind === 'door' ? 'door' : 'boot'} size={16} tone="plain" />
          {confirmText(ask)}
        </button>
      ) : null}
      <div className="walk__labels">
        {ready
          ? map.targets
              .filter((target) => target.label !== false && active.includes(target.id))
              .map((target) => (
                <button
                  type="button"
                  key={target.id}
                  ref={(element) => {
                    labelRefs.current[target.id] = element;
                  }}
                  className={`walk__label walk__label--${target.kind}${near?.id === target.id ? ' is-near' : ''}${target.beacon || beacons.includes(target.id) ? ' walk__label--beacon' : ''}${beacons.includes(target.id) ? ' walk__label--quest' : ''}`}
                  onClick={() => {
                    if (peeked.current) {
                      peeked.current = false;
                      return;
                    }
                    if (ask && ask.id !== target.id) setAsk(null);
                    controllerRef.current?.goTo(target.id);
                  }}
                  onPointerDown={() => {
                    peeked.current = false;
                    window.clearTimeout(peekTimer.current);
                    if (onPeek) {
                      peekTimer.current = window.setTimeout(() => {
                        peeked.current = true;
                        onPeek(target);
                      }, 400);
                    }
                  }}
                  onPointerUp={() => window.clearTimeout(peekTimer.current)}
                  onPointerLeave={() => window.clearTimeout(peekTimer.current)}
                  onContextMenu={(event) => event.preventDefault()}
                  onMouseDown={(event) => event.preventDefault()}
                  tabIndex={-1}
                  aria-label={`${target.verb}: ${target.name}`}
                >
                  {target.unknown ? (
                    <b className="walk__unknown" aria-label="Someone you have not met">
                      ?
                    </b>
                  ) : null}
                  {(target.badges || []).map((badge, index) => (
                    <Icon key={`${badge}-${index}`} name={badge} size={14} tone="plain" className={`walk__offer walk__offer--${badge}`} />
                  ))}
                  {target.icon ? <Icon name={target.icon} size={16} /> : null}
                  {target.labelText || target.name}
                </button>
              ))
          : null}
      </div>
      {stick ? (
        <div className="walk__stick" ref={stickBase} style={{ left: stick.x, top: stick.y }} aria-hidden="true">
          <span ref={stickKnob} />
        </div>
      ) : null}
      {!ready ? <div className="walk__loading">{failed ? 'This place could not be drawn. Reload to try again.' : 'Setting the scene…'}</div> : null}
      {children}
    </main>
  );
}
