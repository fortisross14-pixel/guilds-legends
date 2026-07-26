import { compactForSave, migrateGame } from './engine.js';

const DB_NAME = 'guilds-of-legend';
const DB_VERSION = 1;
const STORE_NAME = 'save-slots';
const LAST_SLOT_KEY = 'guilds-of-legend-last-slot';
const LEGACY_OVERSIZED_KEYS = ['guilds-of-legend-v3', 'guilds-of-legend-v2'];

function openDb() {
  // Older prototypes stored the complete world in localStorage and could exceed its quota.
  // Remove only those known legacy keys; all current campaign data lives in IndexedDB.
  try {
    LEGACY_OVERSIZED_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Storage cleanup is optional and must never block play.
  }
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error || new Error('Could not open the save database.'));
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'slot' });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

function requestPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Save operation failed.'));
  });
}

async function withStore(mode, callback) {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    const result = await callback(store);
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error || new Error('Database transaction failed.'));
      tx.onabort = () => reject(tx.error || new Error('Database transaction was aborted.'));
    });
    return result;
  } finally {
    db.close();
  }
}

export async function listSaveSlots() {
  try {
    const records = await withStore('readonly', (store) => requestPromise(store.getAll()));
    return records
      .map((record) => record.meta)
      .sort((a, b) => a.slot - b.slot);
  } catch (error) {
    console.warn('Could not list save slots:', error);
    return [];
  }
}

export async function loadGame(slot) {
  try {
    const record = await withStore('readonly', (store) => requestPromise(store.get(slot)));
    if (!record?.data) return null;
    const state = migrateGame(record.data);
    try {
      localStorage.setItem(LAST_SLOT_KEY, String(slot));
    } catch {
      // This tiny preference is optional. Never let browser storage break the game.
    }
    return state;
  } catch (error) {
    console.error('Could not load game:', error);
    throw new Error('The save could not be loaded. It may be damaged or blocked by the browser.');
  }
}

function metadata(slot, state) {
  return {
    slot,
    id: state.id,
    guildName: state.guild.name,
    tier: state.guild.tier,
    year: state.date.year,
    month: state.date.month,
    fame: state.guild.fame,
    legacy: state.guild.legacy,
    rank: state.guild.rank,
    activeHeroes: state.heroes.filter((hero) => !['dead', 'retired'].includes(hero.status)).length,
    lastPlayedAt: new Date().toISOString(),
  };
}

async function writeRecord(slot, state, aggressive) {
  const data = compactForSave(state, aggressive);
  const record = { slot, meta: metadata(slot, data), data };
  await withStore('readwrite', (store) => requestPromise(store.put(record)));
  return record.meta;
}

export async function saveGame(slot, state) {
  try {
    const meta = await writeRecord(slot, state, false);
    try {
      localStorage.setItem(LAST_SLOT_KEY, String(slot));
    } catch {
      // Ignore localStorage entirely; IndexedDB is the save source of truth.
    }
    return { ok: true, meta, compacted: false };
  } catch (firstError) {
    console.warn('Normal save failed; retrying with compact history.', firstError);
    try {
      const meta = await writeRecord(slot, state, true);
      return { ok: true, meta, compacted: true };
    } catch (secondError) {
      console.error('Compacted save failed:', secondError);
      return {
        ok: false,
        error: 'The browser could not write the save. Export the campaign and check private-browsing or storage settings.',
      };
    }
  }
}

export async function deleteGame(slot) {
  try {
    await withStore('readwrite', (store) => requestPromise(store.delete(slot)));
    return true;
  } catch (error) {
    console.error('Could not delete save:', error);
    return false;
  }
}

export async function duplicateGame(fromSlot, toSlot) {
  const state = await loadGame(fromSlot);
  if (!state) return { ok: false, error: 'Source slot is empty.' };
  state.id = `${state.id}-copy-${Date.now().toString(36)}`;
  return saveGame(toSlot, state);
}

export function exportGame(state) {
  const data = compactForSave(state, false);
  return JSON.stringify({ kind: 'guilds-of-legend-save', version: 1, exportedAt: new Date().toISOString(), data }, null, 2);
}

export function importGame(text) {
  const parsed = JSON.parse(text);
  const raw = parsed?.kind === 'guilds-of-legend-save' ? parsed.data : parsed;
  return migrateGame(raw);
}

export function getLastSlot() {
  try {
    const value = Number(localStorage.getItem(LAST_SLOT_KEY));
    return [1, 2, 3].includes(value) ? value : null;
  } catch {
    return null;
  }
}
