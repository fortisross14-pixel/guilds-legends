import type { GameState } from '../types/game';

const KEY='guilds-of-legend-v3';
export function loadGame():GameState|null{try{const raw=localStorage.getItem(KEY);return raw?JSON.parse(raw) as GameState:null;}catch{return null;}}
export function saveGame(state:GameState){localStorage.setItem(KEY,JSON.stringify(state));}
export function clearGame(){localStorage.removeItem(KEY);}
