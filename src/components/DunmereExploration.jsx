import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { DUNMERE_DOORS, DUNMERE_NPCS, DUNMERE_SIZE, dialogueForDunmereNpc } from '../data/dunmere.js';
import { getLivingHistory } from '../game/engine.js';
import { Button } from './UI.jsx';

function TownScene({ state, getDialogueTarget, onPrompt, onTarget }) {
  return class DunmereScene extends Phaser.Scene {
    constructor() { super('dunmere-square'); }

    create() {
      const { width, height } = DUNMERE_SIZE;
      const origin = state.world?.exploration?.dunmere || { x: 224, y: 404 };
      const scene = this.add.graphics();
      scene.fillStyle(0x34505b, 1).fillRect(0, 0, width, height);
      scene.fillStyle(0x547050, 1).fillRect(70, 78, width - 140, height - 156);
      scene.fillStyle(0x9a8463, 1).fillRoundedRect(90, 365, width - 180, 110, 18).fillRoundedRect(610, 100, 115, height - 200, 18);
      scene.fillStyle(0x2a444b, 1).fillRect(0, 672, width, 168).fillRect(0, 0, 106, height);
      // Houses are deliberately modular placeholders, all centered on their real door coordinates.
      DUNMERE_DOORS.forEach((door) => {
        if (door.id === 'noticeBoard') return;
        scene.fillStyle(0x3c2b32, 1).fillRoundedRect(door.x - 78, door.y - 125, 156, 112, 8);
        scene.fillStyle(door.color, 1).fillTriangle(door.x - 94, door.y - 122, door.x, door.y - 192, door.x + 94, door.y - 122);
        scene.fillStyle(0x211820, 1).fillRect(door.x - 15, door.y - 50, 30, 37);
      });
      const board = DUNMERE_DOORS.find((item) => item.id === 'noticeBoard');
      scene.fillStyle(0x5a3a28, 1).fillRect(board.x - 24, board.y - 95, 48, 95).fillStyle(0xd7c18d, 1).fillRect(board.x - 17, board.y - 85, 34, 56);
      scene.fillStyle(0x587f86, .75).fillCircle(700, 420, 80).fillStyle(0x7ca8a6, .9).fillCircle(700, 420, 54);
      for (let x = 145; x < width; x += 130) scene.fillStyle(0x2e593f, 1).fillCircle(x, x % 3 ? 150 : 690, 23).fillStyle(0x3f794e, 1).fillCircle(x + 11, x % 3 ? 136 : 676, 19);
      const obstacles = this.physics.add.staticGroup();
      [[53, height / 2, 106, height], [width / 2, 28, width, 56], [width / 2, height - 28, width, 56]].forEach(([x, y, w, h]) => {
        const body = this.add.rectangle(x, y, w, h, 0, 0); obstacles.add(body); body.body.setSize(w, h);
      });
      DUNMERE_DOORS.forEach((door) => {
        const label = this.add.text(door.x, door.y + 9, door.label, { fontFamily: 'Manrope, sans-serif', fontSize: '13px', color: '#f1dfbc', stroke: '#11101a', strokeThickness: 4 }).setOrigin(.5);
        label.setDepth(4);
      });
      this.targets = [...DUNMERE_DOORS.map((door) => ({ ...door, kind: 'door' })), ...DUNMERE_NPCS.map((npc) => ({ ...npc, kind: 'npc' }))];
      DUNMERE_NPCS.forEach((npc) => {
        const body = this.add.rectangle(npc.x, npc.y, 23, 31, npc.color).setStrokeStyle(2, 0xf0d6b6).setDepth(5);
        this.tweens.add({ targets: body, y: npc.y - 3, duration: 900 + npc.x % 380, yoyo: true, repeat: -1 });
        this.add.text(npc.x, npc.y + 29, npc.name.split(' ')[0], { fontFamily: 'Manrope, sans-serif', fontSize: '12px', color: '#f0e0c1', stroke: '#11101a', strokeThickness: 4 }).setOrigin(.5).setDepth(5);
      });
      this.player = this.add.rectangle(origin.x, origin.y, 24, 32, 0xdcae62).setStrokeStyle(2, 0xffe1a0).setDepth(6);
      this.physics.add.existing(this.player);
      this.player.body.setCollideWorldBounds(true).setMaxVelocity(210, 210).setDrag(1450, 1450);
      this.physics.add.collider(this.player, obstacles);
      this.cameras.main.setBounds(0, 0, width, height).startFollow(this.player, true, .12, .12).setZoom(1.12);
      this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,ENTER');
      this.input.on('pointerdown', (pointer) => {
        const point = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const target = this.closestTarget(point, 40);
        this.destination = target ? { x: target.x - 38, y: target.y, target } : { x: Phaser.Math.Clamp(point.x, 72, width - 72), y: Phaser.Math.Clamp(point.y, 72, height - 72), target: null };
      });
      this.input.keyboard.on('keydown-SPACE', () => this.interact());
      this.input.keyboard.on('keydown-ENTER', () => this.interact());
      this.events.once('shutdown', () => this.input.removeAllListeners());
    }

    closestTarget(point, radius) { return this.targets.find((target) => Phaser.Math.Distance.Between(point.x, point.y, target.x, target.y) < radius); }
    nearestTarget() { return this.targets.reduce((best, target) => (!best || Phaser.Math.Distance.BetweenPoints(this.player, target) < Phaser.Math.Distance.BetweenPoints(this.player, best) ? target : best), null); }
    interact() { const target = this.nearestTarget(); if (target && Phaser.Math.Distance.BetweenPoints(this.player, target) < 62) onTarget(target, { x: this.player.x, y: this.player.y }); }
    update() {
      const input = getDialogueTarget();
      const x = (this.keys.D.isDown || this.keys.RIGHT.isDown ? 1 : 0) - (this.keys.A.isDown || this.keys.LEFT.isDown ? 1 : 0) + (input.right ? 1 : 0) - (input.left ? 1 : 0);
      const y = (this.keys.S.isDown || this.keys.DOWN.isDown ? 1 : 0) - (this.keys.W.isDown || this.keys.UP.isDown ? 1 : 0) + (input.down ? 1 : 0) - (input.up ? 1 : 0);
      if (x || y) { this.destination = null; this.player.body.setVelocity(x * 190, y * 190).velocity.normalize().scale(190); }
      else if (this.destination) {
        this.physics.moveTo(this.player, this.destination.x, this.destination.y, 190);
        if (Phaser.Math.Distance.BetweenPoints(this.player, this.destination) < 8) { const target = this.destination.target; this.destination = null; if (target) onTarget(target, { x: this.player.x, y: this.player.y }); }
      } else this.player.body.setVelocity(0);
      const near = this.nearestTarget();
      onPrompt(near && Phaser.Math.Distance.BetweenPoints(this.player, near) < 62 ? `${near.kind === 'npc' ? 'Speak to' : 'Enter'} ${near.name || near.label}` : 'Explore Dunmere · tap to walk');
    }
  };
}

export default function DunmereExploration({ state, actions, openBuilding }) {
  const mount = useRef(null); const game = useRef(null); const movement = useRef({ up: false, down: false, left: false, right: false });
  const [prompt, setPrompt] = useState('Explore Dunmere · tap to walk');
  const [conversation, setConversation] = useState(null);
  const [line, setLine] = useState(0);
  useEffect(() => {
    if (!mount.current || game.current) return undefined;
    const Scene = TownScene({ state, getDialogueTarget: () => movement.current, onPrompt: setPrompt, onTarget: (target, position) => {
      actions.recordDunmereExploration(`${target.kind}:${target.id}`, position);
      if (target.kind === 'door') openBuilding(target.building);
      else { setConversation(target); setLine(0); }
    } });
    game.current = new Phaser.Game({ type: Phaser.AUTO, parent: mount.current, width: DUNMERE_SIZE.width, height: DUNMERE_SIZE.height, backgroundColor: '#34505b', physics: { default: 'arcade', arcade: { debug: false } }, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }, scene: [Scene] });
    return () => { game.current?.destroy(true); game.current = null; };
  }, [actions, openBuilding, state]);
  const move = (direction, pressed) => { movement.current[direction] = pressed; };
  const livingHistory = getLivingHistory(state);
  const dialogue = conversation ? dialogueForDunmereNpc(conversation.id, state) : null;
  const availableCompanion = conversation?.id === 'innkeeper' ? state.candidates.find((candidate) => (candidate.locationId || 'dunmere') === 'dunmere') : null;
  const advance = () => { if (line < dialogue.lines.length - 1) setLine((value) => value + 1); else setConversation(null); };
  return <main className="dunmere-exploration" aria-label="Explore Dunmere">
    <div className="dunmere-exploration__stage" ref={mount} />
    <header className="exploration-hud"><div className="exploration-hud__place"><span>Regional capital · your first home</span><h1>Dunmere</h1></div><Button size="sm" onClick={() => openBuilding('guildHall')}>Guild Hall</Button></header>
    <div className="exploration-prompt">{prompt} · <b>Space</b></div>
    <div className="exploration-controls"><div className="exploration-dpad">{[['up','▲'],['left','◀'],['right','▶'],['down','▼']].map(([direction, mark]) => <button key={direction} aria-label={`Move ${direction}`} onPointerDown={() => move(direction, true)} onPointerUp={() => move(direction, false)} onPointerLeave={() => move(direction, false)}>{mark}</button>)}</div><button className="exploration-action" onClick={() => game.current?.scene.getScene('dunmere-square').interact()}>ACT</button></div>
    {dialogue ? <section className="town-dialogue" aria-live="polite"><div className="town-dialogue__box"><span className="town-dialogue__speaker">{dialogue.speaker}</span><p>{dialogue.lines[line]}</p><div className="town-dialogue__actions">{line < dialogue.lines.length - 1 ? <Button variant="primary" onClick={advance}>Continue</Button> : <><Button variant="primary" onClick={advance}>Leave</Button>{availableCompanion ? <Button variant="primary" onClick={() => { actions.recruit(availableCompanion.id); setConversation(null); }}>Invite {availableCompanion.name}</Button> : null}{dialogue.door ? <Button onClick={() => openBuilding(dialogue.door)}>Go to {DUNMERE_DOORS.find((door) => door.id === dialogue.door)?.label}</Button> : null}</>}</div></div></section> : null}
    {livingHistory.spotlight ? <div className={`exploration-history exploration-history--${livingHistory.spotlight.tone}`}>{livingHistory.spotlight.title}</div> : null}
  </main>;
}
