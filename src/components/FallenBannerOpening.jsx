import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { Button } from './UI.jsx';

const WORLD = { width: 960, height: 540 };

function makeHouseScene({ getPhase, onPrompt, onInteract, movement }) {
  return class FallenBannerHouse extends Phaser.Scene {
    constructor() {
      super('fallen-banner-house');
    }

    create() {
      const { width, height } = WORLD;
      this.cameras.main.setBackgroundColor('#171116');
      const floor = this.add.graphics();
      floor.fillStyle(0x3b2730, 1).fillRect(0, 0, width, height);
      floor.lineStyle(2, 0x6d4650, 0.55);
      for (let x = 24; x < width; x += 96) floor.lineBetween(x, 0, x, height);
      for (let y = 20; y < height; y += 72) floor.lineBetween(0, y, width, y);
      const wall = this.add.graphics();
      wall.fillStyle(0x180f14, 1).fillRect(0, 0, width, 54).fillRect(0, height - 54, width, 54).fillRect(0, 0, 54, height).fillRect(width - 54, 0, 54, height);
      wall.fillStyle(0x6a3c2d, 1).fillRect(70, 72, 224, 22).fillRect(666, 72, 218, 22).fillRect(70, 404, 255, 20);
      wall.fillStyle(0x9d7545, 1).fillRect(768, 414, 110, 36);
      const candle = this.add.graphics();
      candle.fillStyle(0xffbd62, .16).fillCircle(175, 165, 80).fillCircle(770, 178, 95);
      this.tweens.add({ targets: candle, alpha: .55, duration: 1250, yoyo: true, repeat: -1 });
      const obstacles = this.physics.add.staticGroup();
      [[0, 27, width, 54], [0, height - 27, width, 54], [27, 0, 54, height], [width - 27, 0, 54, height], [182, 82, 224, 22], [775, 82, 218, 22], [197, 414, 255, 20]].forEach(([x, y, w, h]) => {
        const body = this.add.rectangle(x, y, w, h, 0x000000, 0);
        obstacles.add(body);
        body.body.setSize(w, h);
      });

      this.player = this.add.rectangle(218, 276, 24, 32, 0xdcae62).setStrokeStyle(2, 0xffe1a0);
      this.physics.add.existing(this.player);
      this.player.body.setCollideWorldBounds(true).setMaxVelocity(190, 190).setDrag(1300, 1300);
      this.physics.add.collider(this.player, obstacles);
      this.stranger = this.add.rectangle(584, 292, 29, 20, 0x8c4d4d).setStrokeStyle(2, 0xd5a291);
      this.add.text(554, 324, 'Wounded stranger', { fontFamily: 'Manrope, sans-serif', fontSize: '13px', color: '#e8d6bd' }).setOrigin(.5);
      this.door = this.add.rectangle(910, 270, 26, 84, 0x8f693e).setStrokeStyle(2, 0xe7c773);
      this.add.text(910, 330, 'Dunmere', { fontFamily: 'Manrope, sans-serif', fontSize: '12px', color: '#e8d6bd' }).setOrigin(.5);
      this.cameras.main.setBounds(0, 0, width, height).startFollow(this.player, true, .12, .12).setZoom(1.1);
      this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,ENTER');
      this.target = null;
      this.input.on('pointerdown', (pointer) => {
        const point = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        this.target = { x: Phaser.Math.Clamp(point.x, 70, width - 70), y: Phaser.Math.Clamp(point.y, 70, height - 70) };
      });
      this.input.keyboard.on('keydown-SPACE', () => this.tryInteract());
      this.input.keyboard.on('keydown-ENTER', () => this.tryInteract());
      this.events.once('shutdown', () => this.input.removeAllListeners());
    }

    tryInteract() {
      const phase = getPhase();
      if (phase === 'identity') return;
      const point = phase === 'door' ? this.door : this.stranger;
      if (Phaser.Math.Distance.BetweenPoints(this.player, point) < 62) onInteract(phase === 'door' ? 'door' : 'stranger');
    }

    update() {
      const phase = getPhase();
      const keys = this.keys;
      const input = movement.current;
      const x = (keys.D.isDown || keys.RIGHT.isDown ? 1 : 0) - (keys.A.isDown || keys.LEFT.isDown ? 1 : 0) + (input.right ? 1 : 0) - (input.left ? 1 : 0);
      const y = (keys.S.isDown || keys.DOWN.isDown ? 1 : 0) - (keys.W.isDown || keys.UP.isDown ? 1 : 0) + (input.down ? 1 : 0) - (input.up ? 1 : 0);
      if (x || y) {
        this.target = null;
        this.player.body.setVelocity(x * 180, y * 180).velocity.normalize().scale(180);
      } else if (this.target) {
        this.physics.moveTo(this.player, this.target.x, this.target.y, 180);
        if (Phaser.Math.Distance.BetweenPoints(this.player, this.target) < 8) this.target = null;
      } else this.player.body.setVelocity(0);
      const target = phase === 'door' ? this.door : this.stranger;
      const near = Phaser.Math.Distance.BetweenPoints(this.player, target) < 62;
      onPrompt(near ? (phase === 'door' ? 'Enter Dunmere' : 'Speak') : 'Walk to the wounded stranger');
    }
  };
}

export default function FallenBannerOpening({ state, onComplete }) {
  const mount = useRef(null);
  const game = useRef(null);
  const phase = useRef(state.flags.opening?.phase || 'house');
  const movement = useRef({ up: false, down: false, left: false, right: false });
  const [prompt, setPrompt] = useState('Walk to the wounded stranger');
  const [dialogue, setDialogue] = useState(null);
  const [choices, setChoices] = useState([]);
  const [inheritance, setInheritance] = useState(false);

  useEffect(() => {
    if (!mount.current || game.current) return undefined;
    const Scene = makeHouseScene({ getPhase: () => phase.current, onPrompt: setPrompt, movement, onInteract: (kind) => {
      if (kind === 'door') onComplete(choices);
      else setDialogue(0);
    } });
    game.current = new Phaser.Game({ type: Phaser.AUTO, parent: mount.current, width: WORLD.width, height: WORLD.height, backgroundColor: '#171116', physics: { default: 'arcade', arcade: { debug: false } }, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }, scene: [Scene] });
    return () => { game.current?.destroy(true); game.current = null; };
  }, [choices, onComplete]);

  const choose = (answer) => {
    setChoices((previous) => [...previous, answer]);
    if (dialogue === 2) { setDialogue(null); phase.current = 'identity'; setInheritance(true); }
    else setDialogue((step) => step + 1);
  };
  const press = (direction, pressed) => { movement.current[direction] = pressed; };

  const lines = [
    { text: 'You… still carry yourself like someone who has not learned to run. Good. The others never made it out.', options: ['Who are you?', 'What happened in the Blackwood?'] },
    { text: 'A lantern-bearer. Or I was. Do not trust what they say happened in the Blackwood. We were not lost.', options: ['What did you find?', 'Why give this to me?'] },
    { text: 'A banner is only cloth… until someone carries it. Let it mean more than our last mistake.', options: ['I will carry it forward.'] },
  ];
  const current = dialogue === null ? null : lines[dialogue];
  return <main className="opening-exploration" aria-label="The Fallen Banner prologue">
    <div className="opening-exploration__stage" ref={mount} />
    <header className="opening-exploration__title"><span>Year 1187 · A room above the old road</span><strong>The Fallen Banner</strong></header>
    <div className="opening-prompt">{prompt} · <b>Space</b></div>
    <div className="opening-controls" aria-label="Movement controls">
      <div className="opening-dpad">{[['up', '▲'], ['left', '◀'], ['right', '▶'], ['down', '▼']].map(([direction, mark]) => <button key={direction} aria-label={`Move ${direction}`} onPointerDown={() => press(direction, true)} onPointerUp={() => press(direction, false)} onPointerLeave={() => press(direction, false)}>{mark}</button>)}</div>
      <button className="opening-interact" onClick={() => { if (phase.current !== 'identity') game.current?.scene.getScene('fallen-banner-house').tryInteract(); }}>ACT</button>
    </div>
    {current ? <section className="opening-dialogue" aria-live="polite"><div className="opening-dialogue__box"><span className="opening-dialogue__speaker">The messenger</span><p>{current.text}</p><div className="opening-dialogue__choices">{current.options.map((option) => <button key={option} onClick={() => choose(option)}>{option}</button>)}</div></div></section> : null}
    {inheritance ? <section className="opening-identity"><div className="opening-identity__card panel"><span className="eyebrow">The room falls quiet</span><h1>A name to carry</h1><p>The banner is yours. {state.guild.name}, led by {state.guild.founder}, will be remembered in Dunmere.</p><Button variant="primary" onClick={() => { phase.current = 'door'; setInheritance(false); setPrompt('The door to Dunmere is open'); }}>Take the banner to Dunmere</Button></div></section> : null}
  </main>;
}
