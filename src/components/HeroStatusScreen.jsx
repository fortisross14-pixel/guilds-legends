import React, { useRef, useState } from 'react';
import { LONG_PRESS_MS, useSwipe } from './gestures.js';
import { CLASSES, FLAW_PROFILES, PERSONALITY_PROFILES, APPOINTMENTS, normalizeClassId } from '../data/content.js';
import { MONTHLY_ACTIVITIES } from '../data/activities.js';
import { EQUIPMENT_BY_ID, TIER_NAMES } from '../data/rooms.js';
import { ARTIFACT_PREFIX, GEAR_SLOTS, ITEMS, canEquip } from '../data/items.js';
import { CLASS_SKILLS, skillLabel } from '../data/skills.js';
import { MAIN_PARTY_SIZE, activityAvailable, contractMonthsLeft, getHero, hallRooms, offerTerms, renewalTerms, xpForNextLevel } from '../game/engine.js';
import { heroBattleStats } from '../game/combat.js';
import { Badge, Button, HeroPortrait, Modal, PrimalBadge, ProgressBar, RarityBadge, Tabs } from './UI.jsx';
import { CareerTab } from '../screens/HistoryScreens.jsx';
import { activeRoster, heroStatus, heroWarnings } from './heroStatus.js';
import { sliceHides } from '../data/slice.js';
import Icon from './Icon.jsx';

const STAT_HELP = {
  HP: 'hit points. At 0 the hero is knocked out.',
  MP: 'mana for skills.',
  ATK: 'weapon damage.',
  DEF: 'reduces damage taken.',
  MAG: 'skill damage and healing.',
  SPD: 'acts earlier in the round.',
  Power: 'overall strength, used for estimates and rankings.',
  Loyalty: 'low loyalty heroes leave or listen to rivals.',
};

function gearName(state, id) {
  if (!id) return 'Empty';
  if (id.startsWith(ARTIFACT_PREFIX)) return `${state.artifacts.find((item) => item.id === id.slice(ARTIFACT_PREFIX.length))?.name || 'Artifact'} (artifact)`;
  return ITEMS[id]?.name || id;
}


// JRPG-style status screen for one hero. Opens from anywhere; Prev/Next flip
// through the active roster. Non-roster heroes (rivals, legends) are read-only.
export default function HeroStatusScreen({ state, heroId, onClose, onSelect, actions }) {
  const [tab, setTab] = useState('status');
  // Long-press a stat or a skill for what it means.
  const [detail, setDetail] = useState(null);
  const pressTimer = useRef(0);
  // Swipe left/right through the roster.
  const nav = useRef({});
  const swipe = useSwipe({ onLeft: () => nav.current.next?.(), onRight: () => nav.current.prev?.() });
  const inspect = (text) => ({
    onPointerDown: () => {
      window.clearTimeout(pressTimer.current);
      pressTimer.current = window.setTimeout(() => setDetail(text), LONG_PRESS_MS);
    },
    onPointerUp: () => window.clearTimeout(pressTimer.current),
    onPointerLeave: () => window.clearTimeout(pressTimer.current),
    onContextMenu: (event) => event.preventDefault(),
  });
  const hero = heroId ? getHero(state, heroId) : null;
  if (!hero) return null;
  const roster = activeRoster(state);
  const index = roster.findIndex((item) => item.id === hero.id);
  const own = index >= 0;
  nav.current = own && roster.length > 1 ? { next: () => onSelect(roster[(index + 1) % roster.length].id), prev: () => onSelect(roster[(index - 1 + roster.length) % roster.length].id) } : {};
  const classId = normalizeClassId(hero.classId);
  const stats = heroBattleStats(hero);
  const status = heroStatus(state, hero);
  const warnings = own ? heroWarnings(state, hero) : [];
  const away = own && status.away;
  const inMainParty = (state.guild.mainParty || []).includes(hero.id);
  const nextXp = xpForNextLevel(hero.level || 1);
  const inventory = Object.entries(state.inventory || {}).filter(([id, count]) => ITEMS[id] && count > 0);
  const apprenticeOptions = roster.filter((item) => item.id !== hero.id && !(hero.apprenticeIds || []).includes(item.id));

  return (
    <Modal open title={hero.name} eyebrow={`Lv ${hero.level || 1} ${hero.rarity || 'Common'} ${hero.primal || ''} ${classId}`} onClose={onClose} width="wide">
      <div className="hero-status" {...swipe}>
        {own && roster.length > 1 ? (
          <nav className="hero-status__nav">
            <Button size="sm" onClick={() => onSelect(roster[(index - 1 + roster.length) % roster.length].id)}>
              ‹ Previous
            </Button>
            <span>
              {index + 1}/{roster.length}
            </span>
            <Button size="sm" onClick={() => onSelect(roster[(index + 1) % roster.length].id)}>
              Next ›
            </Button>
          </nav>
        ) : null}

        {detail ? (
          <p className="inspect-toast" role="status" onClick={() => setDetail(null)}>
            {detail}
          </p>
        ) : null}
        <section className="hero-status__identity">
          <HeroPortrait hero={hero} size="xl" />
          <div className="hero-status__vitals">
            <span className="hero-status__class">
              Lv {hero.level || 1} {classId}
              <small>{hero.personality}</small>
            </span>
            <div className="dossier-taxonomy">
              <Badge tone={hero.status === 'dead' ? 'red' : 'green'}>{own ? status.label : hero.status}</Badge>
              <RarityBadge rarity={hero.rarity || 'Common'} />
              <PrimalBadge primal={hero.primal || 'Fire'} />
              {inMainParty ? <Badge tone="gold"><Icon name="star" size={12} tone="plain" /> Main party</Badge> : null}
            </div>
            <p>{CLASSES[classId]?.description}</p>
            {warnings.length ? <p className="hero-status__warnings"><Icon name="alert" size={14} tone="plain" /> {warnings.join(' · ')}</p> : null}
            <ProgressBar
              value={hero.level >= 20 ? 1 : hero.xp || 0}
              max={hero.level >= 20 ? 1 : nextXp}
              tone="purple"
              compact
              label={hero.level >= 20 ? 'Level cap reached' : `XP ${hero.xp || 0}/${nextXp} to level ${(hero.level || 1) + 1}`}
            />
            <ProgressBar value={hero.health ?? 100} max={100} tone={(hero.health ?? 100) >= 50 ? 'green' : 'red'} compact label="Health" />
            <ProgressBar value={hero.fatigue || 0} max={100} tone={(hero.fatigue || 0) >= 60 ? 'red' : 'gold'} compact label="Fatigue" />
          </div>
          <dl className="hero-status__grid" aria-label="Battle stats">
            {[
              ['HP', stats.maxHp],
              ['MP', stats.maxMp],
              ['ATK', stats.atk],
              ['DEF', stats.def],
              ['MAG', stats.mag],
              ['SPD', stats.spd],
              ['Power', hero.power],
              ['Loyalty', hero.loyalty ?? '—'],
            ].map(([label, value]) => (
              <div key={label} {...inspect(`${label}: ${STAT_HELP[label]}`)}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="hero-status__tabs">
          <Tabs
            active={tab}
            onChange={setTab}
            ariaLabel="Hero pages"
            items={[
              { id: 'status', label: 'Status', icon: '♟' },
              { id: 'career', label: 'Career', icon: '✦' },
            ]}
          />
        </div>

        {tab === 'career' ? <CareerTab state={state} hero={hero} actions={actions} /> : null}
        {tab === 'status' ? (
          <>
            <section className="hero-status__stats">
              <h3>Attributes</h3>
              <div className="attribute-grid">
                {Object.entries(hero.attributes || {}).map(([name, value]) => (
                  <ProgressBar
                    key={name}
                    value={value}
                    max={100}
                    label={`${name} ${value}`}
                    compact
                    tone={name === CLASSES[classId]?.primary ? 'gold' : 'neutral'}
                  />
                ))}
              </div>
            </section>

            <section className="hero-status__gear">
              <h3>Equipment</h3>
              {GEAR_SLOTS.map((slot) => {
                const current = hero.gear?.[slot] || null;
                const options = inventory.filter(([id]) => ITEMS[id].kind === slot && canEquip(ITEMS[id], classId));
                return (
                  <div key={slot} className="equipment-slot">
                    <span className="equipment-slot__name">{slot}</span>
                    <strong>{gearName(state, current)}</strong>
                    {own ? (
                      <>
                        <select value="" disabled={!options.length} onChange={(event) => event.target.value && actions.equipItem(hero.id, event.target.value)}>
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
                      </>
                    ) : null}
                  </div>
                );
              })}
            </section>

            <section className="hero-status__skills">
              <h3>Skills</h3>
              <ul>
                {(CLASS_SKILLS[classId] || []).map((skill) => (
                  <li key={skill.id} className={skill.level <= (hero.level || 1) ? 'is-unlocked' : 'is-locked'} {...inspect(`${skillLabel(skill, hero.primal)}: ${skill.description}`)}>
                    <strong>{skillLabel(skill, hero.primal)}</strong> · {skill.mp} MP{skill.level <= (hero.level || 1) ? '' : ` · Lv ${skill.level}`}
                  </li>
                ))}
              </ul>
            </section>

            {own ? (
              <section className="hero-status__contract">
                <h3>Contract</h3>
                {hero.contract ? (
                  (() => {
                    const left = contractMonthsLeft(state, hero);
                    const terms = renewalTerms(state, hero);
                    return (
                      <>
                        <p>
                          {hero.salary} gold a month · {left > 0 ? `${left} month${left === 1 ? '' : 's'} left` : 'ends now'} ({hero.contract.years}-year deal)
                        </p>
                        {terms.open ? (
                          terms.refuses ? (
                            <p className="hero-status__warnings">{hero.name} refuses to discuss renewal. Raise their loyalty first.</p>
                          ) : (
                            <div className="contract-options">
                              {terms.options.map((option) => (
                                <Button
                                  key={option.years}
                                  size="sm"
                                  disabled={state.guild.crowns < option.bonus}
                                  onClick={() => actions.renewContract(hero.id, option.years)}
                                >
                                  Renew {option.years}y · {option.salary}/month · bonus {option.bonus}
                                </Button>
                              ))}
                            </div>
                          )
                        ) : (
                          <p className="muted">Renewal talks open in the last 12 months.</p>
                        )}
                      </>
                    );
                  })()
                ) : (
                  <p className="muted">No contract: the founder serves for life.</p>
                )}
                {hero.poachApproach ? (
                  <p className="hero-status__warnings">
                    {hero.poachApproach.rivalName} is courting {hero.name}.{' '}
                    <Button size="sm" variant="primary" onClick={() => actions.counterOffer(hero.id)}>
                      Counter-offer (+20% salary)
                    </Button>
                  </p>
                ) : null}
              </section>
            ) : null}

            {!own && offerTerms(state, hero.id).fee ? (
              <section className="hero-status__offer">
                <h3>Make an offer</h3>
                {(() => {
                  const terms = offerTerms(state, hero.id);
                  return (
                    <p>
                      {terms.rival ? `Plays for ${terms.rival.name}.` : 'Free agent.'} Fee {terms.fee} gold · about {Math.round(terms.chance * 100)}% chance
                      they accept.{' '}
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={!terms.available || state.guild.crowns < terms.fee}
                        onClick={() => actions.makeOffer(hero.id)}
                        title={terms.reason || ''}
                      >
                        {terms.available ? 'Make offer' : 'Refused this year'}
                      </Button>
                    </p>
                  );
                })()}
              </section>
            ) : null}

            {own ? (
              <section className="hero-status__room">
                <h3>Room</h3>
                {away ? (
                  <p className="muted">{status.label}: away from the Guild Hall.</p>
                ) : (
                  <div className="room-hero__controls">
                    <label>
                      Room
                      <select value={hallRooms(state).find((room) => room.heroId === hero.id)?.id || ''} onChange={(event) => actions.assignRoom(hero.id, event.target.value || null)}>
                        <option value="">None</option>
                        {hallRooms(state)
                          .filter((room) => (hero.status === 'injured' ? room.type === 'infirmary' : room.type === 'training'))
                          .map((room) => (
                            <option key={room.id} value={room.id}>
                              {room.type === 'training' ? `${EQUIPMENT_BY_ID[room.equipment || 'dummy'].stat} training (${TIER_NAMES[room.tier - 1]})` : `Infirmary (${TIER_NAMES[room.tier - 1]})`}
                              {room.heroId && room.heroId !== hero.id ? ` · ${state.heroes.find((item) => item.id === room.heroId)?.name}` : ''}
                            </option>
                          ))}
                      </select>
                    </label>
                    <label>
                      Task
                      <select value={hero.monthlyActivity || 'Rest'} onChange={(event) => actions.setMonthlyActivity(hero.id, event.target.value)}>
                        {MONTHLY_ACTIVITIES.filter((activity) => activityAvailable(state, activity.id)).map((activity) => (
                          <option key={activity.id} value={activity.id}>
                            {activity.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                )}
              </section>
            ) : null}

            <section className="hero-status__character">
              <h3>Character</h3>
              <p>
                <b>{hero.personality}:</b> {PERSONALITY_PROFILES[hero.personality] || ''}
              </p>
              <p>
                <b>Flaw — {hero.flaw}:</b> {FLAW_PROFILES[hero.flaw] || ''}
              </p>
              <p>
                <b>Dream:</b> {hero.dream}
              </p>
              {(hero.promises || []).map((promise) => (
                <p key={promise.id}>
                  <Badge tone={promise.status === 'fulfilled' ? 'green' : promise.status === 'broken' ? 'red' : 'gold'}>{promise.status}</Badge> {promise.label}
                  {promise.status === 'active' ? ` · due ${promise.dueLabel}` : ''}
                </p>
              ))}
            </section>

            {hero.relationships?.length ? (
              <section className="hero-status__relationships">
                <h3>Relationships</h3>
                {[...hero.relationships]
                  .sort((a, b) => Math.abs(b.value || 0) - Math.abs(a.value || 0))
                  .slice(0, 8)
                  .map((relation) => (
                    <p key={relation.heroId}>
                      {getHero(state, relation.heroId)?.name || 'Former companion'}: {relation.value > 0 ? '+' : ''}
                      {relation.value} <small>{relation.lastReason || ''}</small>
                    </p>
                  ))}
              </section>
            ) : null}

            {own ? (
              <section className="hero-status__actions">
                <Button
                  variant={inMainParty ? 'secondary' : 'primary'}
                  disabled={!inMainParty && (state.guild.mainParty || []).length >= MAIN_PARTY_SIZE}
                  why="The main party is full: a lead and three companions."
                  onClick={() => actions.toggleMainParty(hero.id)}
                >
                  {inMainParty ? 'Remove from main party' : 'Add to main party'}
                </Button>
                {(state.guild.mainParty || [])[0] !== hero.id ? (
                  <Button
                    disabled={!inMainParty && (state.guild.mainParty || []).length >= MAIN_PARTY_SIZE}
                    why="The main party is full: remove someone first."
                    onClick={() => actions.makeLead(hero.id)}
                  >
                    Make party lead
                  </Button>
                ) : (
                  <Badge tone="gold">Party lead</Badge>
                )}
                {apprenticeOptions.length && !sliceHides('mentorship') ? (
                  <label>
                    Mentor
                    <select value="" onChange={(event) => event.target.value && actions.assignMentor(hero.id, event.target.value)}>
                      <option value="">Take an apprentice…</option>
                      {apprenticeOptions.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} (Lv {item.level})
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                <label>
                  Appoint
                  <select
                    value={hero.appointment || ''}
                    disabled={hero.status !== 'available'}
                    onChange={(event) => event.target.value && actions.appointHero(hero.id, event.target.value)}
                  >
                    <option value="">No appointment</option>
                    {APPOINTMENTS.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.id}
                      </option>
                    ))}
                  </select>
                </label>
                <Button variant="danger" size="sm" disabled={away} onClick={() => actions.releaseHero(hero.id)}>
                  Release
                </Button>
              </section>
            ) : null}
          </>
        ) : null}
      </div>
    </Modal>
  );
}
