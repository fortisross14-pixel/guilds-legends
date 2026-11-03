import React, { useState } from 'react';
import { ARTIFACT_PREFIX, GEAR_SLOTS, ITEMS, canEquip, gearStats } from '../data/items.js';
import { SKILLS, skillLabel, skillsForLevel } from '../data/skills.js';
import { normalizeClassId } from '../data/content.js';
import { Button, HeroPortrait, Panel } from '../components/UI.jsx';
import { gearUpgradeCost, roomLevel } from '../game/engine.js';

function gearName(state, id) {
  if (!id) return 'Empty';
  if (id.startsWith(ARTIFACT_PREFIX))
    return `${state.artifacts.find((artifact) => artifact.id === id.slice(ARTIFACT_PREFIX.length))?.name || 'Artifact'} (artifact)`;
  return ITEMS[id]?.name || id;
}

// Guild Hall: equip gear from the guild inventory and use consumables.
export default function EquipmentScreen({ state, actions }) {
  const heroes = state.heroes.filter((hero) => !['dead', 'retired'].includes(hero.status));
  const [useTarget, setUseTarget] = useState(heroes[0]?.id || '');
  const inventory = Object.entries(state.inventory || {}).filter(([id, count]) => ITEMS[id] && count > 0);
  const consumables = inventory.filter(([id]) => ITEMS[id].kind === 'consumable');

  return (
    <div className="equipment">
      <Panel title="Items" eyebrow="Potions can be used here; the rest only in battle">
        {consumables.length ? (
          <div className="item-list">
            <label className="equipment__use-target">
              Use on
              <select value={useTarget} onChange={(event) => setUseTarget(event.target.value)}>
                {heroes.map((hero) => (
                  <option key={hero.id} value={hero.id}>
                    {hero.name}
                  </option>
                ))}
              </select>
            </label>
            {consumables.map(([id, count]) => (
              <article key={id} className="item-row">
                <div>
                  <strong>
                    {ITEMS[id].name} ×{count}
                  </strong>
                  <small>{ITEMS[id].description}</small>
                </div>
                <Button size="sm" disabled={!ITEMS[id].field || !useTarget} onClick={() => actions.useItem(id, useTarget)}>
                  Use
                </Button>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted">No consumables. Visit a shop.</p>
        )}
      </Panel>

      <div className="equipment__heroes">
        {heroes.map((hero) => {
          const classId = normalizeClassId(hero.classId);
          const bonus = gearStats(hero);
          return (
            <Panel key={hero.id} title={hero.name} eyebrow={`Lv ${hero.level} ${classId}`} className="equipment-card">
              <div className="equipment-card__head">
                <HeroPortrait hero={hero} size="sm" />
                <small>
                  Gear bonus:{' '}
                  {Object.entries(bonus)
                    .filter(([, value]) => value)
                    .map(([key, value]) => `${key.toUpperCase()} ${value > 0 ? '+' : ''}${value}`)
                    .join(' · ') || 'none'}
                </small>
              </div>
              {GEAR_SLOTS.map((slot) => {
                const current = hero.gear?.[slot] || null;
                const options = inventory.filter(([id]) => ITEMS[id].kind === slot && canEquip(ITEMS[id], classId));
                return (
                  <div key={slot} className="equipment-slot">
                    <span className="equipment-slot__name">{slot}</span>
                    <strong>{gearName(state, current)}</strong>
                    <select value="" onChange={(event) => event.target.value && actions.equipItem(hero.id, event.target.value)} disabled={!options.length}>
                      <option value="">{options.length ? 'Equip…' : 'Nothing to equip'}</option>
                      {options.map(([id]) => (
                        <option key={id} value={id}>
                          {ITEMS[id].name}
                        </option>
                      ))}
                    </select>
                    {current && !current.startsWith(ARTIFACT_PREFIX) ? (
                      <Button size="sm" onClick={() => actions.unequipItem(hero.id, slot)}>
                        Remove
                      </Button>
                    ) : null}
                    {current && roomLevel(state, 'armory') && gearUpgradeCost(state, current) !== null ? (
                      <Button size="sm" variant="primary" disabled={state.guild.crowns < gearUpgradeCost(state, current)} onClick={() => actions.upgradeGear(hero.id, slot)}>
                        Upgrade · {gearUpgradeCost(state, current)} G
                      </Button>
                    ) : null}
                  </div>
                );
              })}
              <p className="equipment-card__skills">
                Skills:{' '}
                {skillsForLevel(classId, hero.level)
                  .map((skill) => skillLabel(SKILLS[skill.id], hero.primal))
                  .join(', ')}
              </p>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
