import React, { useState } from 'react';
import { normalizeClassId } from '../data/content.js';
import { ARTIFACT_PREFIX, GEAR_SLOTS, ITEMS, canEquip } from '../data/items.js';
import { shopStock } from '../game/engine.js';
import { Badge, Button, EmptyState, HeroPortrait } from '../components/UI.jsx';
import PixelIcon from '../components/PixelIcon.jsx';

const KIND_GLYPHS = { consumable: '✚', weapon: '⚔', armor: '◆', accessory: '◇' };
const STAT_ORDER = ['atk', 'def', 'mag', 'spd', 'hp', 'mp'];

function statText(item) {
  if (item.stats)
    return Object.entries(item.stats)
      .map(([key, value]) => `${key.toUpperCase()} ${value > 0 ? '+' : ''}${value}`)
      .join(' · ');
  return item.description || '';
}

// Stat changes if this hero swapped the item in that slot for `item`.
function compareFor(hero, item) {
  const currentId = hero.gear?.[item.kind];
  const current = currentId && !currentId.startsWith(ARTIFACT_PREFIX) ? ITEMS[currentId] : null;
  const keys = STAT_ORDER.filter((key) => item.stats?.[key] || current?.stats?.[key]);
  return { current, deltas: keys.map((key) => ({ key, delta: (item.stats?.[key] || 0) - (current?.stats?.[key] || 0) })) };
}

// Town shop, classic layout: item list on the left, details and stat comparison
// on the right, gold at the bottom. Buy from the town's stock, sell at half price.
export default function ShopScreen({ state, actions }) {
  const stock = shopStock(state.world?.currentLocationId);
  const owned = Object.entries(state.inventory || {}).filter(([id, count]) => ITEMS[id] && count > 0);
  const [mode, setMode] = useState('buy');
  const [selectedId, setSelectedId] = useState(null);
  if (!stock.length) return <EmptyState icon="⚖" title="No shop here" text="Larger towns have shops." />;

  const rows = mode === 'buy' ? stock.map((id) => [id, null]) : owned;
  const selected = ITEMS[rows.find(([id]) => id === selectedId)?.[0] || rows[0]?.[0]] || null;
  const ownedCount = selected ? state.inventory?.[selected.id] || 0 : 0;
  const heroes = state.heroes.filter((hero) => !['dead', 'retired'].includes(hero.status));
  const wearers = selected && GEAR_SLOTS.includes(selected.kind) ? heroes.filter((hero) => canEquip(selected, normalizeClassId(hero.classId))) : [];
  const price = selected ? (mode === 'buy' ? selected.price : Math.floor(selected.price / 2)) : 0;

  return (
    <div className="shop">
      <div className="shop-layout">
        <section className="shop-list" aria-label={mode === 'buy' ? 'Items for sale' : 'Your items'}>
          <div className="tabs" role="tablist" aria-label="Shop mode">
            {[
              ['buy', 'Buy'],
              ['sell', 'Sell'],
            ].map(([id, label]) => (
              <button
                key={id}
                role="tab"
                aria-selected={mode === id}
                className={mode === id ? 'is-active' : ''}
                onClick={() => {
                  setMode(id);
                  setSelectedId(null);
                }}
              >
                {label}
              </button>
            ))}
          </div>
          {rows.length ? (
            <ul className="cmd-menu" data-menu>
              {rows.map(([id, count]) => {
                const item = ITEMS[id];
                return (
                  <li key={id}>
                    <button
                      className={`shop-item shop-item--${item.kind} ${selected?.id === id ? 'is-selected' : ''}`}
                      onClick={() => setSelectedId(id)}
                      onFocus={() => setSelectedId(id)}
                      aria-pressed={selected?.id === id}
                    >
                      <span className="shop-item__icon" aria-hidden="true">
                        {KIND_GLYPHS[item.kind] || '◇'}
                      </span>
                      <span className="shop-item__name">
                        {item.name}
                        {count ? <span className="shop-item__count"> ×{count}</span> : null}
                      </span>
                      <span className="shop-item__price num">{mode === 'buy' ? item.price : Math.floor(item.price / 2)} G</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="muted shop-empty">The guild inventory is empty.</p>
          )}
        </section>

        <section className="shop-detail" aria-live="polite">
          {selected ? (
            <>
              <div className="shop-detail__head">
                <div>
                  <h2>{selected.name}</h2>
                  <small>
                    {selected.kind}
                    {selected.tier ? ` · tier ${selected.tier}` : ''}
                    {selected.classes ? ` · ${selected.classes.join(', ')}` : ''}
                  </small>
                </div>
                <span className="shop-detail__price num">{price} G</span>
              </div>
              {selected.stats ? (
                <div className="shop-stats">
                  {Object.entries(selected.stats).map(([key, value]) => (
                    <Badge key={key} tone="blue">
                      {key.toUpperCase()} {value > 0 ? '+' : ''}
                      {value}
                    </Badge>
                  ))}
                </div>
              ) : null}
              {selected.description ? <p>{selected.description}</p> : !selected.stats ? <p>{statText(selected)}</p> : null}
              {wearers.length ? (
                <table className="shop-compare">
                  <caption>Compared with what each hero wears now</caption>
                  <tbody>
                    {wearers.map((hero) => {
                      const { current, deltas } = compareFor(hero, selected);
                      return (
                        <tr key={hero.id}>
                          <th scope="row">
                            <HeroPortrait hero={hero} size="xs" showStatus={false} />
                            {hero.name}
                          </th>
                          <td>{current ? current.name : 'Nothing'}</td>
                          <td>
                            {deltas.length
                              ? deltas.map(({ key, delta }) => (
                                  <span key={key} className={delta > 0 ? 'is-up' : delta < 0 ? 'is-down' : 'is-same'}>
                                    {key.toUpperCase()} {delta > 0 ? `▲${delta}` : delta < 0 ? `▼${-delta}` : '='}{' '}
                                  </span>
                                ))
                              : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : selected && GEAR_SLOTS.includes(selected.kind) ? (
                <p className="muted">Nobody in the guild can use this.</p>
              ) : null}
              <div className="shop-detail__actions">
                {mode === 'buy' ? (
                  <Button variant="primary" disabled={state.guild.crowns < selected.price} onClick={() => actions.buyItem(selected.id)}>
                    Buy for {selected.price} G
                  </Button>
                ) : (
                  <Button variant="primary" disabled={!ownedCount} onClick={() => actions.sellItem(selected.id)}>
                    Sell for {Math.floor(selected.price / 2)} G
                  </Button>
                )}
                <small>You own {ownedCount}.</small>
              </div>
            </>
          ) : (
            <p className="muted">Pick an item to see its details.</p>
          )}
        </section>

        <footer className="shop-gold win">
          <span>{mode === 'buy' ? 'Gold' : 'Shops pay half price'}</span>
          <strong className="num">
            <PixelIcon name="coin" size={24} />
            {state.guild.crowns.toLocaleString()} G
          </strong>
        </footer>
      </div>
    </div>
  );
}
