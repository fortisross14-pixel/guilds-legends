// The Phaser side of a walkable scene. Loaded lazily (dynamic import) by
// WalkableScene.jsx, so Phaser stays out of the main bundle.
//
// Phaser only draws and moves the walker. All input (taps, joystick, keys) and
// all text (names, prompts, HUD) live in React over the canvas, so text stays
// crisp and the game is created once per mount.
import Phaser from 'phaser';
import { loadAsset } from '../components/assetLoader.js';
import { buildGrid, findPath, isFree } from './pathfinding.js';

const SPEED = 190; // world px per second
const ARRIVE = 4;

/**
 * Camera zoom in CSS px per world px: fill the screen, a little closer on touch.
 * Rooms (`fit: 'contain'`) fit whole on one screen instead, leaving room for the HUD.
 */
function worldZoomFor(map, cssWidth, cssHeight, coarse) {
  if (map.fit === 'contain') return Math.min(2.6, Math.max(0.6, Math.min(cssWidth / map.size.width, (cssHeight - 150) / map.size.height) * 0.96));
  const fill = Math.max(cssWidth / map.size.width, cssHeight / map.size.height);
  const comfort = coarse ? 1.2 : 1;
  return Math.min(2.2, Math.max(fill, map.zoom ? map.zoom * comfort : comfort));
}

function targetHit(target) {
  if (target.hit) return target.hit;
  const w = target.w || 28;
  const h = target.h || 36;
  return { x: target.x - w / 2, y: target.y - h, w, h };
}

/**
 * Builds the game inside `parent`. `bridge.current` holds the React callbacks
 * ({ onNear, onInteract, onFrame }); it is read on every call, so React can
 * swap callbacks without recreating the game. Resolves to a controller.
 */
export async function createWalkGame({ parent, map, bridge, start, coarse = false }) {
  const ids = [...new Set([map.ground, map.tiles?.asset, map.player.asset, ...(map.props || []).map((prop) => prop.asset), ...map.targets.map((target) => target.asset)].filter(Boolean))];
  const loaded = await Promise.all(ids.map(loadAsset));
  const grid = buildGrid(map.size, map.blocks, { pad: map.pad ?? 10, edge: map.edge ?? 0 });
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const size = () => ({ width: Math.max(1, parent.clientWidth), height: Math.max(1, parent.clientHeight) });

  const state = {
    paused: false,
    stick: { x: 0, y: 0 },
    path: [],
    pendingTarget: null,
    active: new Set(map.targets.filter((target) => target.active !== false).map((target) => target.id)),
    nearId: null,
    worldZoom: 1,
    // Auto targets (enemy groups, exits) fire once when walked into; the lock
    // stops them firing again until the walker has stepped away.
    autoLock: new Set(),
    autoPrimed: false,
  };
  let scene = null;
  let dead = false;

  class WalkScene extends Phaser.Scene {
    constructor() {
      super(`walk-${map.id}`);
    }

    create() {
      scene = this;
      loaded.forEach((result) => {
        if (this.textures.exists(result.id)) return;
        if (result.image) this.textures.addImage(result.id, result.image);
        else if (result.canvas) this.textures.addCanvas(result.id, result.canvas);
      });
      this.cameras.main.setBackgroundColor(map.background || '#0b0c12');
      if (map.ground) this.add.image(0, 0, map.ground).setOrigin(0).setDisplaySize(map.size.width, map.size.height).setDepth(-10000);
      if (map.tiles) {
        const size = map.tiles.size;
        const tilemap = this.make.tilemap({ data: map.tiles.data, tileWidth: size, tileHeight: size });
        const tileset = tilemap.addTilesetImage(map.tiles.asset, map.tiles.asset, size, size, 0, 0);
        tilemap.createLayer(0, tileset, 0, 0).setDepth(-10000);
      }
      (map.props || []).forEach((prop) => {
        this.add.image(prop.x, prop.y, prop.asset).setOrigin(0).setDisplaySize(prop.w, prop.h).setDepth(prop.depth ?? prop.y + prop.h);
      });
      this.sprites = {};
      map.targets.forEach((target) => {
        if (!target.asset) return;
        const sprite = this.add.image(target.x, target.y, target.asset).setOrigin(0.5, 1).setDisplaySize(target.w, target.h).setDepth(target.y);
        if (target.bob && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
          this.tweens.add({ targets: sprite, y: target.y - 3, duration: 900 + (target.x % 380), yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        }
        this.sprites[target.id] = sprite;
      });
      const spawn = isFree(grid, start.x, start.y) ? start : findPath(grid, start, start)[0] || map.spawn;
      this.player = this.add.image(spawn.x, spawn.y, map.player.asset).setOrigin(0.5, 1).setDisplaySize(map.player.w, map.player.h).setDepth(spawn.y);
      this.marker = this.add.circle(0, 0, 9).setStrokeStyle(2, 0xf6d28c, 0.9).setVisible(false).setDepth(-9000);
      if (map.fit === 'contain') {
        applyZoom();
        this.cameras.main.centerOn(map.size.width / 2, map.size.height / 2 - 12);
      } else {
        this.cameras.main.setBounds(0, 0, map.size.width, map.size.height).startFollow(this.player, true, 0.14, 0.14);
        applyZoom();
        this.cameras.main.centerOn(spawn.x, spawn.y);
      }
      this.syncTargets();
    }

    syncTargets() {
      map.targets.forEach((target) => {
        if (target.hideWhenInactive) this.sprites[target.id]?.setVisible(state.active.has(target.id));
      });
    }

    update(_time, delta) {
      const player = this.player;
      if (!player) return;
      const step = (SPEED * Math.min(delta, 50)) / 1000;
      if (!state.paused && (state.stick.x || state.stick.y)) {
        const length = Math.hypot(state.stick.x, state.stick.y);
        const scale = Math.min(1, length) / length;
        moveBy(player, state.stick.x * scale * step, state.stick.y * scale * step);
      } else if (!state.paused && state.path.length) {
        const next = state.path[0];
        const dx = next.x - player.x;
        const dy = next.y - player.y;
        const distance = Math.hypot(dx, dy);
        if (distance <= Math.max(ARRIVE, step)) {
          player.setPosition(next.x, next.y);
          state.path.shift();
          if (!state.path.length) {
            this.marker.setVisible(false);
            arrive();
          }
        } else moveBy(player, (dx / distance) * step, (dy / distance) * step);
      }
      player.setDepth(player.y);
      updateNear();
    }
  }

  function moveBy(player, dx, dy) {
    if (isFree(grid, player.x + dx, player.y)) player.x += dx;
    if (isFree(grid, player.x, player.y + dy)) player.y += dy;
  }

  function activeTargets() {
    return map.targets.filter((target) => state.active.has(target.id));
  }

  function distanceTo(target) {
    const point = target.approach || target;
    return Math.hypot(scene.player.x - point.x, scene.player.y - point.y);
  }

  function nearestTarget() {
    let best = null;
    let bestDistance = Infinity;
    activeTargets().forEach((target) => {
      const distance = distanceTo(target);
      if (distance <= (target.reach || 44) && distance < bestDistance) {
        best = target;
        bestDistance = distance;
      }
    });
    return best;
  }

  function updateAuto() {
    if (state.paused) return;
    const inReach = activeTargets().filter((target) => target.auto && distanceTo(target) <= (target.reach || 44));
    const ids = new Set(inReach.map((target) => target.id));
    [...state.autoLock].forEach((id) => !ids.has(id) && state.autoLock.delete(id));
    if (!state.autoPrimed) {
      // Arriving next to an exit or a group must not trigger it.
      state.autoPrimed = true;
      ids.forEach((id) => state.autoLock.add(id));
      return;
    }
    const fresh = inReach.find((target) => !state.autoLock.has(target.id));
    if (fresh) {
      state.autoLock.add(fresh.id);
      interactWith(fresh);
    }
  }

  function updateNear() {
    updateAuto();
    const near = state.paused ? null : nearestTarget();
    const id = near?.id || null;
    if (id !== state.nearId) {
      state.nearId = id;
      if (!dead) bridge.current?.onNear?.(near);
    }
  }

  function arrive() {
    const target = state.pendingTarget;
    state.pendingTarget = null;
    if (target && state.active.has(target.id) && distanceTo(target) <= (target.reach || 44) + 6) interactWith(target);
  }

  function interactWith(target) {
    state.path = [];
    state.stick = { x: 0, y: 0 };
    state.pendingTarget = null;
    scene?.marker?.setVisible(false);
    if (target.auto) state.autoLock.add(target.id);
    if (!dead) bridge.current?.onInteract?.(target, { x: Math.round(scene.player.x), y: Math.round(scene.player.y) });
  }

  function walkTo(point, target = null) {
    if (!scene?.player) return;
    state.pendingTarget = target;
    state.path = findPath(grid, { x: scene.player.x, y: scene.player.y }, point);
    const end = state.path[state.path.length - 1];
    if (end) scene.marker.setPosition(end.x, end.y).setVisible(!target);
    if (!state.path.length && target) arrive();
  }

  function applyZoom() {
    if (!scene) return;
    const { width, height } = size();
    state.worldZoom = worldZoomFor(map, width, height, coarse);
    scene.cameras.main.setZoom(state.worldZoom * dpr);
    if (map.fit === 'contain') scene.cameras.main.centerOn(map.size.width / 2, map.size.height / 2 - 12);
  }

  const initial = size();
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: Math.round(initial.width * dpr),
    height: Math.round(initial.height * dpr),
    backgroundColor: map.background || '#0b0c12',
    banner: false,
    audio: { noAudio: true },
    input: { keyboard: false, mouse: false, touch: false, gamepad: false },
    render: { antialias: true, roundPixels: true },
    scale: { mode: Phaser.Scale.NONE, zoom: 1 / dpr },
    scene: [WalkScene],
  });

  // Project world → CSS pixels after each render, for the React labels.
  game.events.on('postrender', () => {
    if (dead || !scene?.player) return;
    const camera = scene.cameras.main;
    const view = camera.worldView;
    const zoom = state.worldZoom;
    bridge.current?.onFrame?.((x, y) => ({ x: (x - view.x) * zoom, y: (y - view.y) * zoom }));
  });

  return {
    /** A tap at CSS pixel (x, y) inside the canvas: walk there, or to a target and interact. */
    tap(cssX, cssY, { targets = true } = {}) {
      if (!scene?.player || state.paused) return null;
      const view = scene.cameras.main.worldView;
      const world = { x: view.x + cssX / state.worldZoom, y: view.y + cssY / state.worldZoom };
      if (!targets) {
        walkTo(world);
        return null;
      }
      // Every target gets a hit area of at least 44 CSS px.
      const minimum = 22 / state.worldZoom;
      const hit = activeTargets()
        .map((target) => {
          const box = targetHit(target);
          const cx = box.x + box.w / 2;
          const cy = box.y + box.h / 2;
          const hx = Math.max(box.w / 2, minimum);
          const hy = Math.max(box.h / 2, minimum);
          const inside = Math.abs(world.x - cx) <= hx && Math.abs(world.y - cy) <= hy;
          return inside ? { target, distance: Math.hypot(world.x - cx, world.y - cy) } : null;
        })
        .filter(Boolean)
        .sort((a, b) => a.distance - b.distance)[0];
      if (hit) {
        const target = hit.target;
        if (distanceTo(target) <= (target.reach || 44)) interactWith(target);
        else walkTo(target.approach || target, target);
        return target;
      }
      walkTo(world);
      return null;
    },
    /** Joystick or keyboard direction, each axis -1…1. Cancels any tap path. */
    setStick(x, y) {
      state.stick = { x, y };
      if (x || y) {
        state.path = [];
        state.pendingTarget = null;
        scene?.marker?.setVisible(false);
      }
    },
    /** Walk to a target by id and interact on arrival (tapping its name). */
    goTo(id) {
      const target = activeTargets().find((item) => item.id === id);
      if (!target || !scene?.player || state.paused) return null;
      if (distanceTo(target) <= (target.reach || 44)) interactWith(target);
      else walkTo(target.approach || target, target);
      return target;
    },
    /** Interact with whatever is in reach (the context button). */
    interact() {
      const target = scene?.player && !state.paused ? nearestTarget() : null;
      if (target) interactWith(target);
      return target;
    },
    setPaused(paused) {
      state.paused = Boolean(paused);
      if (paused) {
        state.path = [];
        state.stick = { x: 0, y: 0 };
        state.pendingTarget = null;
        scene?.marker?.setVisible(false);
      }
      state.nearId = undefined;
    },
    /** Which targets exist right now (e.g. the door only after the dialogue). */
    setActiveTargets(ids) {
      state.active = new Set(ids);
      state.nearId = undefined;
      scene?.syncTargets();
    },
    resize() {
      const { width, height } = size();
      game.scale.resize(Math.round(width * dpr), Math.round(height * dpr));
      applyZoom();
    },
    position() {
      return scene?.player ? { x: Math.round(scene.player.x), y: Math.round(scene.player.y) } : null;
    },
    /** Debug/test hook: a plain-text snapshot of the scene. */
    snapshot() {
      return { map: map.id, player: this.position(), near: state.nearId || null, path: state.path.length, paused: state.paused, active: [...state.active] };
    },
    destroy() {
      dead = true;
      game.destroy(true);
    },
  };
}
