import React from 'react';
import { ICON_PATHS } from './iconPaths.js';

// One icon set for the whole game (DESIGN.md, Icons): game-icons.net shapes for game
// concepts, Phosphor for system icons, all drawn as engraved brass by default.
// Every icon goes through <Icon name>, so custom art can replace a shape later
// (swap its entry in iconPaths.js). Credits: CREDITS.md.

/** Older names that still appear in data, mapped onto the set. */
const ALIASES = { bed: 'moon', rooms: 'castle', guild: 'party', chronicle: 'book', ladder: 'trophy', gold: 'coin', fame: 'laurel', exit: 'door', hire: 'coin', mission: 'alert', challenge: 'swords', unknown: 'question', heal: 'potion', injured: 'bandage', travel: 'boot', news: 'letter', camp: 'rest', board: 'notice', records: 'trophy', system: 'gear', quests: 'quill', items: 'bag', contacts: 'contacts' };

// Older data still names some icons with a single symbol (primals, classes, rooms,
// events). They resolve to a drawn shape here, so no symbol ever reaches the screen.
const GLYPHS = {
  '⚔': 'swords', '♛': 'crown', '✦': 'star', '◆': 'gem', '⌖': 'pin', '✚': 'cross', '▤': 'scroll', '◇': 'gem', '◈': 'map', '♜': 'castle',
  '▲': 'up', '⚑': 'flag', '☠': 'skull', '☾': 'moon', '✎': 'quill', '➜': 'boot', '▼': 'down', '⌂': 'home', '▶': 'next', '♟': 'party',
  '⚙': 'gear', '◉': 'eye', '★': 'star', '➶': 'boot', '⚖': 'scroll', '✉': 'letter', '◷': 'hourglass', '○': 'question', '☝': 'alert',
  '⚠': 'alert', '▦': 'calendar', '✧': 'star', '♣': 'plant', '≈': 'water', '☀': 'fire', '⚡': 'air', '◌': 'question', '🜁': 'air', '🐾': 'animal',
  '↯': 'air', '☄': 'fire', '↺': 'undo', '▣': 'chest', '❄': 'water', '∞': 'psychic', '☼': 'fire', '⚒': 'anvil', '♨': 'fire', '✷': 'star',
  '🔥': 'fire', '💧': 'water', '🌿': 'plant', '♞': 'animal', '✤': 'plant', '⬢': 'iron', '☁': 'air', '🍺': 'mug', '📜': 'scroll',
  '📯': 'horn', '☰': 'menu', '♫': 'contacts', '⤢': 'map', '📍': 'pin', '↷': 'next', '⌛': 'hourglass', '❖': 'gem', '✓': 'check', '×': 'close',
};

const shapeFor = (name) => ICON_PATHS[ALIASES[name] || GLYPHS[name] || name];

/** Is there a shape for this name? */
export function hasIcon(name) {
  return Boolean(shapeFor(name));
}

/**
 * An icon. tone: 'brass' (engraved gold, default), 'ink' (dark, for parchment),
 * 'plain' (currentColor, for colored states). size in CSS px.
 */
export default function Icon({ name, size = 20, label = undefined, tone = 'brass', className = '' }) {
  const shape = shapeFor(name) || ICON_PATHS.question;
  return (
    <svg
      className={`icon icon--${tone} ${className}`}
      width={size}
      height={size}
      viewBox={`0 0 ${shape[0]} ${shape[0]}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <path d={shape[1]} />
    </svg>
  );
}

/** The shared gradients behind the engraved look. Rendered once at the app root. */
export function IconDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="icon-brass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f8e2a8" />
          <stop offset=".5" stopColor="#d6b071" />
          <stop offset="1" stopColor="#8e6a34" />
        </linearGradient>
        <linearGradient id="icon-ink" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a3822" />
          <stop offset="1" stopColor="#22180e" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Which icon stands for which place, building, room and Chronicle page.
export const PLACE_ICONS = { world: 'world', guild: 'castle', chronicle: 'book' };
export const BUILDING_ICONS = { guildHall: 'castle', tavern: 'mug', noticeBoard: 'notice', arena: 'swords', shop: 'bag', herald: 'horn' };
export const ROOM_ICONS = {
  training: 'sword',
  infirmary: 'cross',
  quarters: 'moon',
  bunks: 'moon',
  trophies: 'crown',
  scouts: 'eye',
  courtyard: 'star',
  office: 'crown',
  war: 'flag',
  treasury: 'coin',
  armory: 'shield',
  construction: 'hammer',
};
export const PAGE_ICONS = { calendar: 'calendar', news: 'letter', quests: 'quill', settings: 'gear', chronicle: 'book', log: 'scroll', seasons: 'crown', lore: 'book', codex: 'star' };
export const LADDER_ICONS = { strength: 'sword', legacy: 'scroll', official: 'crown' };
export const FORMATION_ICONS = { Combat: 'swords', Diplomacy: 'letter', Expedition: 'flag', Intrigue: 'eye' };
export const EVENT_ICONS = {
  tournament: 'crown',
  mission: 'pin',
  travel: 'flag',
  promise: 'quill',
  contract: 'scroll',
  challenge: 'swords',
  festival: 'star',
  boss: 'skull',
  story: 'book',
  wages: 'coin',
  season: 'star',
  construction: 'hammer',
  reputation: 'shield',
};
export const CLASS_ICONS = { Guardian: 'shield', Duelist: 'sword', Ranger: 'tree', Rogue: 'eye', Cleric: 'cross', Mage: 'star', Scholar: 'book', Artificer: 'anvil' };
export const STATUS_ICONS = { available: 'check', mission: 'flag', tournament: 'crown', injured: 'bandage', sidejob: 'hammer', dead: 'skull', retired: 'moon' };
