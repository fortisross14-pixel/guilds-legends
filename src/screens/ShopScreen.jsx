import React from 'react';
import { ITEMS } from '../data/items.js';
import { shopStock } from '../game/engine.js';
import { Badge, Button, EmptyState, Panel } from '../components/UI.jsx';

function statText(item) {
  if (item.stats)
    return Object.entries(item.stats)
      .map(([key, value]) => `${key.toUpperCase()} ${value > 0 ? '+' : ''}${value}`)
      .join(' · ');
  return item.description || '';
}

// Town shop: buy from the town's stock, sell from the guild inventory at half price.
export default function ShopScreen({ state, actions }) {
  const stock = shopStock(state.world?.currentLocationId);
  const owned = Object.entries(state.inventory || {}).filter(([id, count]) => ITEMS[id] && count > 0);
  if (!stock.length) return <EmptyState icon="⚖" title="No shop here" text="Larger towns have shops." />;
  return (
    <div className="shop">
      <Panel title="For sale" eyebrow={`You have ${state.guild.crowns.toLocaleString()} gold`}>
        <div className="item-list">
          {stock.map((id) => {
            const item = ITEMS[id];
            return (
              <article key={id} className={`item-row item-row--${item.kind}`}>
                <div>
                  <strong>{item.name}</strong>
                  <small>
                    {item.kind} · {statText(item)}
                    {item.classes ? ` · ${item.classes.join(', ')}` : ''}
                  </small>
                </div>
                <Badge tone="gold">{item.price}g</Badge>
                <Button size="sm" disabled={state.guild.crowns < item.price} onClick={() => actions.buyItem(id)}>
                  Buy
                </Button>
              </article>
            );
          })}
        </div>
      </Panel>
      <Panel title="Sell" eyebrow="Shops pay half price">
        {owned.length ? (
          <div className="item-list">
            {owned.map(([id, count]) => (
              <article key={id} className="item-row">
                <div>
                  <strong>
                    {ITEMS[id].name} ×{count}
                  </strong>
                  <small>{statText(ITEMS[id])}</small>
                </div>
                <Badge>{Math.floor(ITEMS[id].price / 2)}g</Badge>
                <Button size="sm" onClick={() => actions.sellItem(id)}>
                  Sell
                </Button>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted">The guild inventory is empty.</p>
        )}
      </Panel>
    </div>
  );
}
