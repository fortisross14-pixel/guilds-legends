// The Phaser side of a walkable scene. Loaded lazily (dynamic import) by
// WalkableScene.jsx, so Phaser stays out of the main bundle.
//
// Phaser only draws and moves the walker. All input (taps, joystick, keys) and
// all text (names, prompts, HUD) live in React over the canvas, so text stays
// crisp and the game is created once per mount.
import Phaser from 'phaser';
import { loadAsset } from '../components/assetLoader.js';
import { buildGrid, findPath, isFree } from './pathfinding.js';
import { paintGround } from './groundPaint.js';

const SPEED = 190; // world px per second
const ARRIVE = 4;
// Rows of a walker sheet (3 frames each, the middle one standing).
const FACE = { down: 0, left: 1, right: 2, up: 3 };

/**
 * The sheet row for a facing. Side-only walkers (HeroEditor characters, drawn
 * from the side) keep their last left or right while walking up or down.
 */
function sideRow(asset, facing, side) {
  if (!asset?.sideOnly || facing === 'left' || facing === 'right') return FACE[facing];
  return FACE[side || 'right'];
}

function isSheet(scene, key) {
  return Boolean(key && scene.textures.exists(key) && scene.textures.get(key).frameTotal > 2);
}

/**
 * Camera zoom in CSS px per world px: fill the screen, a little closer on touch.
 * Rooms (`fit: 'contain'`) fit whole on one screen instead, leaving room for the HUD.
 */
/**
 * Where a small room (fit: 'contain') stands on screen: below the HUD, above the bottom band the
 * dialogue box takes. Landscape screens keep the room up top (the box is shorter than tall).
 */
function roomBand(cssWidth, cssHeight) {
  const landscape = cssWidth > cssHeight * 1.15;
  const top = landscape ? 64 : 70;
  const bottom = landscape ? Math.max(130, Math.min(240, cssHeight * 0.26)) : 150;
  return { top, height: Math.max(120, cssHeight - top - bottom) };
}

function worldZoomFor(map, cssWidth, cssHeight, coarse) {
  // Rooms stay at a person's scale: walkers about 60 px tall on a phone, not the whole height of the screen.
  if (map.room) return Math.max(cssWidth / map.size.width, Math.min(Math.max(cssWidth / map.size.width, cssHeight / map.size.height), coarse ? 1.15 : 1.35));
  if (map.fit === 'contain') return Math.min(2.6, Math.max(0.6, Math.min(cssWidth / map.size.width, roomBand(cssWidth, cssHeight).height / map.size.height) * 0.96));
  const fill = Math.max(cssWidth / map.size.width, cssHeight / map.size.height);
  const comfort = coarse ? 1.2 : 1;
  // Big screens: about 30 tiles across at most, so a town or road is explored, not seen whole.
  const explore = (cssWidth / (30 * 32)) * (map.zoom || 1);
  return Math.min(2.2, Math.max(fill, explore, map.zoom ? map.zoom * comfort : comfort));
}

/** Doors and exits ask first (playtest-1-feedback): a tap opens a bubble, the bubble's tap goes through. */
export function needsConfirm(target) {
  // Real doors (Enter) and exits; a board or a sign standing in town is simply used.
  return (target?.kind === 'door' && (target.verb || 'Enter') === 'Enter') || target?.kind === 'exit';
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
  const ids = [...new Set([map.ground, map.tiles?.asset, map.groundPaint?.asset, map.player.asset, ...(map.props || []).map((prop) => prop.asset), ...map.targets.map((target) => target.asset)].filter(Boolean))];
  const loaded = await Promise.all(ids.map(loadAsset));
  // Images made at run time (the guild's banner post): { key, url } in map.images.
  const extra = await Promise.all(
    (map.images || []).map(
      (item) =>
        new Promise((resolve) => {
          const image = new Image();
          image.onload = () => resolve({ key: item.key, image });
          image.onerror = () => resolve(null);
          image.src = item.url;
        }),
    ),
  );
  const grid = buildGrid(map.size, map.blocks, { pad: map.pad ?? 10, edge: map.edge ?? 0, ground: map.offRoad || null });
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
        // Sprite sheets (asset.sheet: frame size): walkers turn and step, doors open.
        if (result.image && result.asset?.sheet) this.textures.addSpriteSheet(result.id, result.image, result.asset.sheet);
        else if (result.image) this.textures.addImage(result.id, result.image);
        else if (result.canvas) this.textures.addCanvas(result.id, result.canvas);
      });
      extra.filter(Boolean).forEach(({ key, image }) => {
        if (this.textures.exists(key)) this.textures.remove(key);
        this.textures.addImage(key, image);
      });
      this.cameras.main.setBackgroundColor(map.background || '#0b0c12');
      const atlas = map.groundPaint && loaded.find((result) => result.id === map.groundPaint.asset);
      if (atlas?.image) {
        const key = `ground:${map.id}`;
        if (this.textures.exists(key)) this.textures.remove(key);
        this.textures.addCanvas(key, paintGround({ image: atlas.image, atlas: atlas.asset, rows: map.groundPaint.rows, tileSize: map.groundPaint.tileSize, tone: map.groundPaint.tone, wild: map.groundPaint.wild }));
        this.add.image(0, 0, key).setOrigin(0).setDisplaySize(map.size.width, map.size.height).setDepth(-10000);
      }
      if (map.ground) this.add.image(0, 0, map.ground).setOrigin(0).setDisplaySize(map.size.width, map.size.height).setDepth(-10000);
      if (map.tiles) {
        const size = map.tiles.size;
        const tilemap = this.make.tilemap({ data: map.tiles.data, tileWidth: size, tileHeight: size });
        const tileset = tilemap.addTilesetImage(map.tiles.asset, map.tiles.asset, size, size, 0, 0);
        tilemap.createLayer(0, tileset, 0, 0).setDepth(-10000);
      }
      // Trees fade while the walker is behind their crown (see update), so nobody is lost behind one.
      this.trees = [];
      (map.props || []).forEach((prop) => {
        const image = this.add.image(prop.x, prop.y, prop.asset).setOrigin(0).setDisplaySize(prop.w, prop.h).setDepth(prop.depth ?? prop.y + prop.h);
        if (prop.tree) this.trees.push({ image, prop });
      });
      this.sprites = {};
      map.targets.forEach((target) => {
        if (!target.asset) return;
        const sheet = isSheet(this, target.asset);
        const sprite = (sheet ? this.add.sprite(target.x, target.y, target.asset, target.opens ? 0 : FACE.down * 3 + 1) : this.add.image(target.x, target.y, target.asset))
          .setOrigin(0.5, 1)
          .setDisplaySize(target.w, target.h)
          .setDepth(target.y + (target.depthBias || 0));
        if (target.bob && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
          this.tweens.add({ targets: sprite, y: target.y - 3, duration: 900 + (target.x % 380), yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        }
        this.sprites[target.id] = sprite;
      });
      const spawn = isFree(grid, start.x, start.y) ? start : findPath(grid, start, start)[0] || map.spawn;
      this.walker = isSheet(this, map.player.asset);
      this.walkerAsset = loaded.find((result) => result.id === map.player.asset)?.asset;
      this.side = 'right';
      this.player = (this.walker ? this.add.sprite(spawn.x, spawn.y, map.player.asset, FACE.down * 3 + 1) : this.add.image(spawn.x, spawn.y, map.player.asset))
        .setOrigin(0.5, 1)
        .setDisplaySize(map.player.w, map.player.h)
        .setDepth(spawn.y);
      if (this.walker) {
        Object.entries(FACE).forEach(([name, row]) => {
          const key = `${map.player.asset}:walk-${name}`;
          if (!this.anims.exists(key)) this.anims.create({ key, frames: [0, 1, 2, 1].map((frame) => ({ key: map.player.asset, frame: row * 3 + frame })), frameRate: 8, repeat: -1 });
        });
        this.facing = 'down';
        this.last = { x: spawn.x, y: spawn.y };
      }
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

    update() {
      const player = this.player;
      if (!player) return;
      // Real elapsed time (Phaser smooths and clamps its own delta, which made walking crawl on slow
      // frames); a long frame is capped so nobody jumps through a wall.
      const now = performance.now();
      const delta = Math.min(120, now - (this.lastTick || now));
      this.lastTick = now;
      const step = (SPEED * delta) / 1000;
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
      if (this.walker) animateWalker(this, player);
      // In a wild area: every so often a band jumps a party off the road (src/explore/WildScene.jsx).
      if (map.offRoad && !state.paused) {
        const moved = Math.hypot(player.x - (this.wanderFrom?.x ?? player.x), player.y - (this.wanderFrom?.y ?? player.y));
        this.wanderFrom = { x: player.x, y: player.y };
        const col = Math.floor(player.x / map.offRoad.tile);
        const row = Math.floor(player.y / map.offRoad.tile);
        // On the road: never. Right beside it ('2'): a quarter as often. Out in the open: in full.
        const ground = map.offRoad.rows[row]?.[col];
        if (moved > 0 && (ground === '1' || ground === '2')) {
          this.wandered = (this.wandered || 0) + moved * (ground === '1' ? 1 : 0.25);
          this.wanderAt ||= map.offRoad.tile * (10 + Math.random() * 14);
          if (this.wandered >= this.wanderAt) {
            this.wandered = 0;
            this.wanderAt = 0;
            state.path = [];
            this.marker?.setVisible(false);
            bridge.current?.onWander?.({ x: Math.round(player.x), y: Math.round(player.y) });
          }
        }
      }
      this.trees.forEach(({ image, prop }) => {
        const behind = player.x > prop.x + 8 && player.x < prop.x + prop.w - 8 && player.y < prop.y + prop.h - 4 && player.y > prop.y + 10;
        const alpha = behind ? 0.45 : 1;
        if (image.alpha !== alpha) image.setAlpha(alpha);
      });
      updateNear();
    }
  }

  function animateWalker(walkScene, player) {
    const dx = player.x - walkScene.last.x;
    const dy = player.y - walkScene.last.y;
    walkScene.last = { x: player.x, y: player.y };
    if (Math.abs(dx) + Math.abs(dy) > 0.05) {
      walkScene.facing = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down';
      if (walkScene.facing === 'left' || walkScene.facing === 'right') walkScene.side = walkScene.facing;
      const shown = walkScene.walkerAsset?.sideOnly && (walkScene.facing === 'up' || walkScene.facing === 'down') ? walkScene.side : walkScene.facing;
      const key = `${map.player.asset}:walk-${shown}`;
      if (player.anims.currentAnim?.key !== key || !player.anims.isPlaying) player.play(key);
    } else if (player.anims.isPlaying) {
      player.stop();
      player.setFrame(sideRow(walkScene.walkerAsset, walkScene.facing, walkScene.side) * 3 + 1);
    }
  }

  /** A townsperson turns toward the walker when they come close. */
  function faceWalker(target) {
    const sprite = scene?.sprites?.[target.id];
    if (!target.faceWalker || !sprite?.setFrame || !scene.player) return;
    const dx = scene.player.x - target.x;
    const dy = scene.player.y - target.y;
    const facing = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down';
    const asset = loaded.find((result) => result.id === target.asset)?.asset;
    sprite.setFrame(sideRow(asset, facing, dx < 0 ? 'left' : 'right') * 3 + 1);
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
      if (near) faceWalker(near);
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
    const at = { x: Math.round(scene.player.x), y: Math.round(scene.player.y) };
    const doorSprite = target.opens ? scene?.sprites?.[target.id] : null;
    if (doorSprite?.setFrame) {
      // The door swings open (4 frames), then the building opens.
      state.paused = true;
      [1, 2, 3].forEach((frame, index) => scene.time.delayedCall(70 * (index + 1), () => doorSprite.setFrame(frame)));
      scene.time.delayedCall(300, () => {
        state.paused = false;
        if (!dead) bridge.current?.onInteract?.(target, at);
        scene.time.delayedCall(400, () => doorSprite.setFrame(0));
      });
      return;
    }
    if (!dead) bridge.current?.onInteract?.(target, at);
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
    // Pixel art stays crisp at whole device pixels per art pixel (the art is drawn at 2x).
    if (map.pixelArt) state.worldZoom = Math.max(1, Math.round(state.worldZoom * dpr * 2)) / (dpr * 2);
    scene.cameras.main.setZoom(state.worldZoom * dpr);
    if (map.fit === 'contain') {
      // The room's middle sits in the middle of its band (world units: CSS pixels / zoom).
      const band = roomBand(width, height);
      const offset = (height / 2 - (band.top + band.height / 2)) / state.worldZoom;
      scene.cameras.main.centerOn(map.size.width / 2, map.size.height / 2 + offset);
    }
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
    render: map.pixelArt ? { antialias: false, pixelArt: true, roundPixels: true } : { antialias: true, roundPixels: true },
    scale: { mode: Phaser.Scale.NONE, zoom: 1 / dpr },
    scene: [WalkScene],
  });

  // While a menu, a talk or a fight covers the scene, it stops drawing (after a few last frames):
  // a canvas redrawn 60 times a second under a panel made every menu slow. Phaser's TimeStep
  // has no "sleeping" flag (only `running`), so the scene keeps its own.
  const sleepSoon = () => {
    window.clearTimeout(state.sleepTimer);
    state.sleepTimer = window.setTimeout(() => {
      if (!dead && state.paused && scene?.player && game.loop.running) {
        game.loop.sleep();
        state.asleep = true;
      }
    }, 250);
  };
  const wakeUp = () => {
    window.clearTimeout(state.sleepTimer);
    if (state.asleep && !dead) {
      state.asleep = false;
      game.loop.wake(true);
    }
  };

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
        // People and objects beat a door they stand by; then the nearest.
        .sort((a, b) => Number(needsConfirm(a.target)) - Number(needsConfirm(b.target)) || a.distance - b.distance)[0];
      if (hit) {
        const target = hit.target;
        if (needsConfirm(target)) {
          bridge.current?.onConfirm?.(target);
          return target;
        }
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
    goTo(id, { confirmed = false } = {}) {
      const target = activeTargets().find((item) => item.id === id);
      if (!target || !scene?.player || state.paused) return null;
      if (needsConfirm(target) && !confirmed) {
        bridge.current?.onConfirm?.(target);
        return target;
      }
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
      // While a menu, a talk or a fight covers the scene, stop drawing it (after one last
      // frame): a canvas redrawn 60 times a second under a blurred panel made every menu slow.
      if (paused) sleepSoon();
      else wakeUp();
    },
    /** Which targets exist right now (e.g. the door only after the dialogue). */
    setActiveTargets(ids) {
      state.active = new Set(ids);
      state.nearId = undefined;
      scene?.syncTargets();
    },
    resize() {
      const { width, height } = size();
      // A resize while the scene sleeps: draw it again at the new size, then sleep again.
      wakeUp();
      game.scale.resize(Math.round(width * dpr), Math.round(height * dpr));
      applyZoom();
      if (state.paused) sleepSoon();
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
      window.clearTimeout(state.sleepTimer);
      game.destroy(true);
    },
  };
}
