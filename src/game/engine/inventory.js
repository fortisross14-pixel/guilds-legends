// @ts-check
// Guild inventory, equipment, shops and loot.
import { ARTIFACT_PREFIX, GEAR_SLOTS, GEAR_UPGRADES, ITEMS, ITEM_LIST, canEquip } from '../../data/items.js';
import { LOCATION_BY_ID, locationBuildings } from '../../data/world.js';

import { chestCapacity, clamp, clone, finalize, hashString, roomLevel } from './core.js';

/** Shop price after the Armory's 10% discount. */
export function shopPrice(state, itemId) {
  const price = ITEMS[itemId]?.price || 0;
  return roomLevel(state, 'armory') ? Math.round(price * 0.9) : price;
}

/** Items in the guild chest (equipped gear does not count). */
export function chestUsed(state) {
  return Object.values(state.inventory || {}).reduce((sum, count) => sum + count, 0);
}

const TIER_INDEX_BY_NAME = { Regional: 0, National: 1, Global: 2 };

export const SELL_RATE = 0.5;

/** Items a town's shop sells: everything up to the town's tier, varied per town. */
export function shopStock(locationId) {
  const location = LOCATION_BY_ID[locationId];
  if (!location || !locationBuildings(locationId).includes('shop')) return [];
  const maxTier = (TIER_INDEX_BY_NAME[location.tier] ?? 0) + 1;
  return ITEM_LIST.filter((item) => item.tier <= maxTier)
    .filter((item) => ['potion', 'antidote'].includes(item.id) || hashString(`${locationId}:${item.id}`) % 3 !== 0)
    .map((item) => item.id);
}

function shopError(state) {
  if (state.world?.activeTravel) return 'The guild is on the road. Shops open on arrival.';
  if (!shopStock(state.world?.currentLocationId).length) return 'There is no shop in this town.';
  return null;
}

export function addItemsInPlace(state, items) {
  state.inventory ||= {};
  Object.entries(items).forEach(([id, count]) => {
    if (!ITEMS[id] || !count) return;
    state.inventory[id] = Math.max(0, (state.inventory[id] || 0) + count);
    if (!state.inventory[id]) delete state.inventory[id];
  });
}

export function buyItem(state, itemId, quantity = 1) {
  const error = shopError(state);
  if (error) return { state, error };
  const item = ITEMS[itemId];
  const count = Math.max(1, Math.round(quantity));
  if (!item || !shopStock(state.world.currentLocationId).includes(itemId)) return { state, error: 'This shop does not sell that.' };
  const cost = shopPrice(state, itemId) * count;
  if (state.guild.crowns < cost) return { state, error: `That costs ${cost} gold.` };
  if (chestUsed(state) + count > chestCapacity(state))
    return { state, error: `The chest is full (${chestUsed(state)}/${chestCapacity(state)}). Sell something${roomLevel(state, 'armory') ? '' : ' or build an Armory'}.` };
  const next = clone(state);
  next.guild.crowns -= cost;
  addItemsInPlace(next, { [itemId]: count });
  return { state: finalize(next), error: null };
}

export function sellItem(state, itemId, quantity = 1) {
  const error = shopError(state);
  if (error) return { state, error };
  const count = Math.max(1, Math.round(quantity));
  if (!ITEMS[itemId] || (state.inventory?.[itemId] || 0) < count) return { state, error: 'You do not have that many.' };
  const next = clone(state);
  next.guild.crowns += Math.floor(ITEMS[itemId].price * SELL_RATE) * count;
  addItemsInPlace(next, { [itemId]: -count });
  return { state: finalize(next), error: null };
}

/** Price to take an equipped item one step up its line at the Armory (null when it cannot be upgraded). */
export function gearUpgradeCost(state, itemId) {
  const target = GEAR_UPGRADES[itemId];
  if (!target || !ITEMS[target] || !ITEMS[itemId]) return null;
  return Math.max(40, ITEMS[target].price - ITEMS[itemId].price);
}

/** The Armory's smith reforges a hero's equipped item into the next tier of its line. */
export function upgradeGear(state, heroId, slot) {
  if (!roomLevel(state, 'armory')) return { state, error: 'Build an Armory to upgrade gear.' };
  const hero = playerHero(state, heroId);
  const itemId = hero?.gear?.[slot];
  const cost = itemId ? gearUpgradeCost(state, itemId) : null;
  if (!hero || cost === null) return { state, error: 'That cannot be upgraded.' };
  if (state.guild.crowns < cost) return { state, error: `The upgrade costs ${cost} crowns.` };
  const next = clone(state);
  next.guild.crowns -= cost;
  next.heroes.find((item) => item.id === heroId).gear[slot] = GEAR_UPGRADES[itemId];
  return { state: finalize(next), error: null };
}

function playerHero(state, heroId) {
  const hero = state.heroes.find((item) => item.id === heroId);
  return hero && !['dead', 'retired'].includes(hero.status) ? hero : null;
}

/** Equip an item from the guild inventory. The previous item goes back to the inventory. */
export function equipItem(state, heroId, itemId) {
  const item = ITEMS[itemId];
  const target = playerHero(state, heroId);
  if (!target) return { state, error: 'Choose an active hero.' };
  if (!item || !GEAR_SLOTS.includes(item.kind)) return { state, error: 'That cannot be equipped.' };
  if (!canEquip(item, target.classId)) return { state, error: `A ${target.classId} cannot use ${item.name}.` };
  if (!(state.inventory?.[itemId] > 0)) return { state, error: `The guild has no ${item.name}.` };
  if (target.gear?.[item.kind]?.startsWith(ARTIFACT_PREFIX)) return { state, error: 'Return the artifact to the vault before using that slot.' };
  const next = clone(state);
  const hero = playerHero(next, heroId);
  hero.gear ||= { weapon: null, armor: null, accessory: null };
  const previous = hero.gear[item.kind];
  addItemsInPlace(next, { [itemId]: -1, ...(previous ? { [previous]: 1 } : {}) });
  hero.gear[item.kind] = itemId;
  return { state: finalize(next), error: null };
}

export function unequipItem(state, heroId, slot) {
  const target = playerHero(state, heroId);
  const current = target?.gear?.[slot];
  if (!current) return { state, error: 'Nothing is equipped there.' };
  if (current.startsWith(ARTIFACT_PREFIX)) return { state, error: 'Return the artifact to the vault from the Codex.' };
  const next = clone(state);
  const hero = playerHero(next, heroId);
  hero.gear[slot] = null;
  addItemsInPlace(next, { [current]: 1 });
  return { state: finalize(next), error: null };
}

/** Use a consumable at the Guild Hall (potions restore health and fatigue, ethers morale). */
export function useItemOnHero(state, itemId, heroId) {
  const item = ITEMS[itemId];
  if (!item?.field) return { state, error: `${item?.name || 'That item'} can only be used in battle.` };
  if (!(state.inventory?.[itemId] > 0)) return { state, error: `The guild has no ${item.name}.` };
  if (!playerHero(state, heroId)) return { state, error: 'Choose an active hero.' };
  const next = clone(state);
  const hero = playerHero(next, heroId);
  if (item.field.health) hero.health = clamp((hero.health ?? 100) + item.field.health, 0, 100);
  if (item.field.fatigue) hero.fatigue = clamp((hero.fatigue || 0) + item.field.fatigue, 0, 100);
  if (item.field.morale) hero.morale = clamp((hero.morale || 0) + item.field.morale, 0, 100);
  addItemsInPlace(next, { [itemId]: -1 });
  return { state: finalize(next), error: null };
}

/** Consumables available to a battle (a snapshot; written back when it ends). */
export function battleItems(state) {
  return Object.fromEntries(Object.entries(state.inventory || {}).filter(([id, count]) => ITEMS[id]?.kind === 'consumable' && count > 0));
}

/** Apply a finished battle's item usage (negative = gained, e.g. stolen) to the inventory. */
export function settleBattleItemsInPlace(state, itemsUsed) {
  addItemsInPlace(state, Object.fromEntries(Object.entries(itemsUsed || {}).map(([id, used]) => [id, -used])));
}

/** @type {[string, number][]} */
const CONSUMABLE_WEIGHTS = [
  ['potion', 6],
  ['ether', 2],
  ['antidote', 2],
  ['fire-bomb', 1],
  ['hi-potion', 1],
  ['phoenix-feather', 1],
];

/**
 * Rolls loot for a victory. tierIndex: 0 Regional, 1 National, 2 Global.
 * quality: 0 normal, 1 great, 2 legendary. Returns { itemId: count }.
 */
export function rollLoot(rng, tierIndex = 0, quality = 0) {
  const loot = {};
  const add = (id) => {
    loot[id] = (loot[id] || 0) + 1;
  };
  const drops = 1 + quality;
  for (let index = 0; index < drops; index += 1) {
    if (rng.next() < 0.75) {
      const pool = CONSUMABLE_WEIGHTS.filter(([id]) => ITEMS[id].tier <= tierIndex + 1);
      const total = pool.reduce((sum, [, weight]) => sum + weight, 0);
      let roll = rng.next() * total;
      const pick = pool.find(([, weight]) => (roll -= weight) < 0) || pool[0];
      add(pick[0]);
    }
    if (rng.next() < 0.18 + quality * 0.15) {
      const gear = ITEM_LIST.filter((item) => GEAR_SLOTS.includes(item.kind) && item.tier <= tierIndex + 1 && item.tier >= tierIndex);
      if (gear.length) add(gear[Math.floor(rng.next() * gear.length)].id);
    }
  }
  return loot;
}

export function lootNames(loot) {
  return Object.entries(loot || {}).map(([id, count]) => `${ITEMS[id]?.name || id}${count > 1 ? ` ×${count}` : ''}`);
}
