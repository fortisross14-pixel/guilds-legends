import React from 'react';
import { INVENTORY_KINDS, ITEMS, sellValue } from '../data/items.js';
import { Panel } from '../components/UI.jsx';
import Icon from '../components/Icon.jsx';

const GROUP_ICONS = { consumable: 'potion', good: 'bag', keepsake: 'gem' };
const EMPTY = {
  consumable: 'No supplies. Shops sell potions and ethers.',
  good: 'Nothing to sell yet. Beaten foes leave things behind: pelts, daggers, bottles.',
  keepsake: 'No keepsakes yet. The story gives them.',
};

// Items → Inventory (docs/design/ITEMS.md): supplies, goods to sell or hand in, and keepsakes.
// Gear is on the Equipment tab. Selling happens at a shop.
export default function InventoryScreen({ state }) {
  const held = Object.entries(state.inventory || {}).filter(([id, count]) => ITEMS[id] && count > 0);
  return (
    <div className="inventory">
      {Object.entries(INVENTORY_KINDS).map(([kind, title]) => {
        const rows = held.filter(([id]) => ITEMS[id].kind === kind);
        return (
          <Panel key={kind} title={title}>
            {rows.length ? (
              <ul className="inventory__list">
                {rows.map(([id, count]) => {
                  const item = ITEMS[id];
                  const value = sellValue(item);
                  return (
                    <li key={id} className="inventory__item">
                      <Icon name={item.icon || GROUP_ICONS[kind]} size={20} />
                      <span className="inventory__text">
                        <strong>
                          {item.name} <small className="num">×{count}</small>
                        </strong>
                        <small>{item.for || item.use || item.description || ''}</small>
                      </span>
                      <span className="inventory__value num">{kind === 'keepsake' ? 'Not for sale' : `${value} gold each`}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="muted">{EMPTY[kind]}</p>
            )}
          </Panel>
        );
      })}
    </div>
  );
}
