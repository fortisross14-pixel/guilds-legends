import React, { useState } from 'react';
import { ARTIFACT_PREFIX, GEAR_SLOTS, ITEMS, canEquip, gearStats } from '../data/items.js';
import { normalizeClassId } from '../data/content.js';
import { Button, HeroPortrait, Panel } from '../components/UI.jsx';
import { gearUpgradeCost, patronAtLeast, roomLevel } from '../game/engine.js';
import { useDraggable } from '../components/useDraggable.js';
import { dragEnabled, haptic } from '../components/gestures.js';

function gearName(state, id) {
  if (!id) return '—';
  if (id.startsWith(ARTIFACT_PREFIX)) return `${state.artifacts.find((artifact) => artifact.id === id.slice(ARTIFACT_PREFIX.length))?.name || 'Artifact'} (artifact)`;
  return ITEMS[id]?.name || id;
}

const STAT_ORDER = ['atk', 'def', 'mag', 'spd', 'hp', 'mp'];

/** "ATK +5 · DEF −2": what equipping or using an item would change for a hero. */
export function itemPreview(hero, itemId) {
  const item = ITEMS[itemId];
  if (!item || !hero) return null;
  if (item.kind === 'consumable') return item.field ? item.description : 'Battle only';
  if (!canEquip(item, normalizeClassId(hero.classId))) return 'Can’t use this';
  if ((item.level || 1) > (hero.level || 1)) return `Needs level ${item.level}`;
  const before = gearStats(hero);
  const after = gearStats({ ...hero, gear: { ...(hero.gear || {}), [item.kind]: itemId } });
  const diff = STAT_ORDER.map((key) => [key, (after[key] || 0) - (before[key] || 0)]).filter(([, value]) => value);
  return diff.length ? diff.map(([key, value]) => `${key.toUpperCase()} ${value > 0 ? '+' : '−'}${Math.abs(value)}`).join(' · ') : 'No change';
}

/** An inventory item: drag it onto a hero (or tap it, then tap the hero). */
function ItemChip({ state, id, count, selected, onSelect, onHover, onDropOnHero }) {
  const drag = useDraggable({
    enabled: dragEnabled(state.settings),
    label: ITEMS[id].name,
    onMove: (target) => onHover(target?.kind === 'hero' ? target.id : null, id),
    onDrop: (target) => {
      onHover(null, null);
      if (target?.kind === 'hero') onDropOnHero(target.id, id);
    },
  });
  return (
    <button type="button" className={`item-chip is-draggable ${selected ? 'is-selected' : ''}`} onClick={() => onSelect(selected ? null : id)} aria-pressed={selected} {...drag}>
      <b>{ITEMS[id].name}</b>
      <small>×{count}</small>
    </button>
  );
}

// The Armory: drag gear onto a hero to equip it, a potion to use it. While
// hovering a hero the card shows what would change. Tap fallback: tap the
// item, then tap the hero.
export default function EquipmentScreen({ state, actions }) {
  const heroes = state.heroes.filter((hero) => !['dead', 'retired'].includes(hero.status));
  const inventory = Object.entries(state.inventory || {}).filter(([id, count]) => ITEMS[id] && count > 0 && (ITEMS[id].kind === 'consumable' ? ITEMS[id].field : GEAR_SLOTS.includes(ITEMS[id].kind)));
  const [picked, setPicked] = useState(null);
  const [hover, setHover] = useState({ heroId: null, itemId: null });

  const apply = (heroId, itemId) => {
    const hero = heroes.find((item) => item.id === heroId);
    const item = ITEMS[itemId];
    if (!hero || !item) return;
    if (item.kind === 'consumable') actions.useItem(itemId, heroId);
    else if (canEquip(item, normalizeClassId(hero.classId), hero.level || 1)) actions.equipItem(heroId, itemId);
    else {
      haptic('error', state.settings);
      return;
    }
    haptic('drop', state.settings);
    setPicked(null);
  };

  return (
    <div className="equipment">
      <Panel title="Gear and supplies" eyebrow={dragEnabled(state.settings) ? 'Drag onto a hero · or tap, then tap the hero' : 'Tap an item, then tap a hero'}>
        {inventory.length ? (
          <div className="item-chips">
            {inventory.map(([id, count]) => (
              <ItemChip key={id} state={state} id={id} count={count} selected={picked === id} onSelect={setPicked} onHover={(heroId, itemId) => setHover({ heroId, itemId })} onDropOnHero={apply} />
            ))}
          </div>
        ) : (
          <p className="muted">Nothing to equip or use. Visit a shop.</p>
        )}
      </Panel>

      <div className="equipment__heroes">
        {heroes.map((hero) => {
          const previewItem = hover.heroId === hero.id ? hover.itemId : picked;
          const preview = previewItem ? itemPreview(hero, previewItem) : null;
          return (
            <Panel key={hero.id} title={hero.name} eyebrow={`Lv ${hero.level} ${normalizeClassId(hero.classId)}`} className="equipment-card">
              <button
                type="button"
                className={`equipment-card__drop ${picked ? 'is-armed' : ''}`}
                data-drop="hero"
                data-drop-id={hero.id}
                onClick={() => picked && apply(hero.id, picked)}
                aria-label={picked ? `Give ${ITEMS[picked]?.name} to ${hero.name}` : hero.name}
              >
                <HeroPortrait hero={hero} size="sm" />
                <span className={`equipment-card__preview ${preview ? 'is-on' : ''}`}>{preview || 'Drop an item here'}</span>
              </button>
              {GEAR_SLOTS.map((slot) => {
                const current = hero.gear?.[slot] || null;
                const cost = current && (roomLevel(state, 'armory') >= 2 || patronAtLeast(state, 'smiths', 'contact')) ? gearUpgradeCost(state, current) : null;
                return (
                  <div key={slot} className="equipment-slot">
                    <span className="equipment-slot__name">{slot}</span>
                    <strong>{gearName(state, current)}</strong>
                    {current && !current.startsWith(ARTIFACT_PREFIX) ? (
                      <Button size="sm" onClick={() => actions.unequipItem(hero.id, slot)}>
                        Remove
                      </Button>
                    ) : null}
                    {cost !== null ? (
                      <Button size="sm" variant="primary" disabled={state.guild.crowns < cost} onClick={() => actions.upgradeGear(hero.id, slot)}>
                        Upgrade · {cost} G
                      </Button>
                    ) : null}
                  </div>
                );
              })}
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
