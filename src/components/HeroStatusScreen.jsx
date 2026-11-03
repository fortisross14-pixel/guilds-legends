import React from 'react';
import { CLASSES, FLAW_PROFILES, PERSONALITY_PROFILES, APPOINTMENTS, normalizeClassId } from '../data/content.js';
import { MONTHLY_ACTIVITIES, TRAINING_FOCI, HALL_ROOMS } from '../data/activities.js';
import { ARTIFACT_PREFIX, GEAR_SLOTS, ITEMS, canEquip } from '../data/items.js';
import { CLASS_SKILLS, skillLabel } from '../data/skills.js';
import { MAIN_PARTY_SIZE, getHero, xpForNextLevel } from '../game/engine.js';
import { heroBattleStats } from '../game/combat.js';
import { Badge, Button, HeroPortrait, Modal, PrimalBadge, ProgressBar, RarityBadge } from './UI.jsx';
import { activeRoster, heroStatus, heroWarnings } from './heroStatus.js';

function gearName(state, id) {
  if (!id) return 'Empty';
  if (id.startsWith(ARTIFACT_PREFIX)) return `${state.artifacts.find((item) => item.id === id.slice(ARTIFACT_PREFIX.length))?.name || 'Artifact'} (artifact)`;
  return ITEMS[id]?.name || id;
}

const roomName = (activity) => HALL_ROOMS.find((room) => room.activity === activity)?.name || activity;

// JRPG-style status screen for one hero. Opens from anywhere; Prev/Next flip
// through the active roster. Non-roster heroes (rivals, legends) are read-only.
export default function HeroStatusScreen({ state, heroId, onClose, onSelect, actions }) {
  const hero = heroId ? getHero(state, heroId) : null;
  if (!hero) return null;
  const roster = activeRoster(state);
  const index = roster.findIndex((item) => item.id === hero.id);
  const own = index >= 0;
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
      <div className="hero-status">
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

        <section className="hero-status__identity">
          <HeroPortrait hero={hero} size="xl" />
          <div>
            <div className="dossier-taxonomy">
              <Badge tone={hero.status === 'dead' ? 'red' : 'green'}>{own ? status.label : hero.status}</Badge>
              <RarityBadge rarity={hero.rarity || 'Common'} />
              <PrimalBadge primal={hero.primal || 'Fire'} />
              {inMainParty ? <Badge tone="gold">★ Main party</Badge> : null}
            </div>
            <p>{CLASSES[classId]?.description}</p>
            {warnings.length ? <p className="hero-status__warnings">⚠ {warnings.join(' · ')}</p> : null}
            <ProgressBar
              value={hero.level >= 20 ? 1 : hero.xp || 0}
              max={hero.level >= 20 ? 1 : nextXp}
              tone="purple"
              compact
              label={hero.level >= 20 ? 'Level cap reached' : `XP ${hero.xp || 0}/${nextXp} to level ${(hero.level || 1) + 1}`}
            />
          </div>
        </section>

        <section className="hero-status__stats">
          <h3>Stats</h3>
          <div className="hero-status__grid">
            <span>HP {stats.maxHp}</span>
            <span>MP {stats.maxMp}</span>
            <span>ATK {stats.atk}</span>
            <span>DEF {stats.def}</span>
            <span>MAG {stats.mag}</span>
            <span>SPD {stats.spd}</span>
            <span>Power {hero.power}</span>
            <span>Health {hero.health ?? 100}</span>
            <span>Fatigue {hero.fatigue || 0}</span>
            <span>Loyalty {hero.loyalty ?? '—'}</span>
          </div>
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
              <li key={skill.id} className={skill.level <= (hero.level || 1) ? 'is-unlocked' : 'is-locked'}>
                <strong>{skillLabel(skill, hero.primal)}</strong> · {skill.mp} MP ·{' '}
                {skill.level <= (hero.level || 1) ? skill.description : `Unlocks at level ${skill.level}`}
              </li>
            ))}
          </ul>
        </section>

        {own ? (
          <section className="hero-status__room">
            <h3>Room</h3>
            {away ? (
              <p className="muted">{status.label}: away from the Guild Hall.</p>
            ) : (
              <div className="room-hero__controls">
                <label>
                  Room
                  <select value={hero.monthlyActivity || 'Training'} onChange={(event) => actions.setMonthlyActivity(hero.id, event.target.value)}>
                    {MONTHLY_ACTIVITIES.map((activity) => (
                      <option key={activity.id} value={activity.id}>
                        {roomName(activity.id)}
                      </option>
                    ))}
                  </select>
                </label>
                {(hero.monthlyActivity || 'Training') === 'Training' ? (
                  <label>
                    Focus
                    <select value={hero.training} onChange={(event) => actions.setTraining(hero.id, event.target.value)}>
                      {TRAINING_FOCI.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                ) : null}
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

        <section className="hero-status__career">
          <h3>Career</h3>
          <p>
            Missions {hero.career?.missions || 0} (wins {hero.career?.wins || 0}) · Titles {hero.career?.individualTitles || 0} · Bouts{' '}
            {hero.career?.tournamentBoutWins || 0}/{hero.career?.tournamentBouts || 0} · Legacy {hero.legacy} · Renown {hero.renown}
          </p>
          <div className="hero-history">
            {(hero.history || []).slice(0, 25).map((event, row) => (
              <article key={`${event.date}-${row}`}>
                <time>{event.date}</time>
                <div>
                  <strong>{event.title}</strong>
                  <p>{event.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {own ? (
          <section className="hero-status__actions">
            <Button
              variant={inMainParty ? 'secondary' : 'primary'}
              disabled={!inMainParty && (state.guild.mainParty || []).length >= MAIN_PARTY_SIZE}
              onClick={() => actions.toggleMainParty(hero.id)}
            >
              {inMainParty ? 'Remove from main party' : 'Add to main party'}
            </Button>
            {apprenticeOptions.length ? (
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
      </div>
    </Modal>
  );
}
