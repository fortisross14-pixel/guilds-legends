// Retro sound effects generated with the Web Audio API (no audio files).
// Audio starts only after the first user gesture (browser autoplay rule).

let context = null;
let unlocked = false;
let enabled = true;
let volume = 0.6;

export function configureSound({ sound = true, volume: level = 0.6 } = {}) {
  enabled = sound !== false;
  volume = Math.max(0, Math.min(1, Number(level) || 0));
}

export function unlockAudio() {
  if (unlocked || typeof window === 'undefined') return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  context = new AudioContext();
  unlocked = true;
}

// [frequency Hz, duration s, wave] steps played in sequence.
const SOUNDS = {
  click: [[880, 0.03, 'square']],
  confirm: [
    [660, 0.05, 'square'],
    [990, 0.07, 'square'],
  ],
  hit: [[180, 0.07, 'sawtooth']],
  crit: [
    [240, 0.05, 'sawtooth'],
    [120, 0.12, 'sawtooth'],
  ],
  heal: [
    [523, 0.06, 'triangle'],
    [659, 0.06, 'triangle'],
    [784, 0.1, 'triangle'],
  ],
  levelUp: [
    [523, 0.08, 'square'],
    [659, 0.08, 'square'],
    [784, 0.08, 'square'],
    [1047, 0.18, 'square'],
  ],
  victory: [
    [523, 0.1, 'square'],
    [523, 0.1, 'square'],
    [523, 0.1, 'square'],
    [415, 0.15, 'square'],
    [466, 0.15, 'square'],
    [523, 0.3, 'square'],
  ],
  defeat: [
    [392, 0.15, 'triangle'],
    [349, 0.15, 'triangle'],
    [262, 0.35, 'triangle'],
  ],
  coin: [
    [988, 0.05, 'square'],
    [1319, 0.12, 'square'],
  ],
  fanfare: [
    [392, 0.1, 'square'],
    [523, 0.1, 'square'],
    [659, 0.1, 'square'],
    [784, 0.25, 'square'],
    [659, 0.1, 'square'],
    [784, 0.35, 'square'],
  ],
};

export function playSound(name) {
  if (!enabled || !unlocked || !context || !SOUNDS[name] || volume <= 0) return;
  let time = context.currentTime + 0.01;
  SOUNDS[name].forEach(([frequency, duration, wave]) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(frequency, time);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.18 * volume, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(time);
    oscillator.stop(time + duration + 0.02);
    time += duration;
  });
}
