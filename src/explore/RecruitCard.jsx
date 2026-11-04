import React from 'react';
import { CLASSES, normalizeClassId } from '../data/content.js';
import { candidateRanges } from '../game/engine.js';
import { HeroPortrait, PrimalBadge, RarityBadge } from '../components/UI.jsx';
import Icon, { CLASS_ICONS } from '../components/Icon.jsx';

/**
 * The recruit's ID card (battle-hiring spec), shown beside their conversation from
 * the first line: portrait, name, age, class, rarity, primal and level, and the
 * stats as ranges that narrow with "What can you do?" and with scouting.
 */
export default function RecruitCard({ state, candidate }) {
  if (!candidate) return null;
  const classId = normalizeClassId(candidate.classId);
  const ranges = candidateRanges(state, candidate);
  const span = ([low, high]) => (Math.round(low) === Math.round(high) ? `${Math.round(low)}` : `${Math.round(low)}–${Math.round(high)}`);
  const attributes = Object.entries(ranges.attributes || {}).slice(0, 6);
  return (
    <aside className="recruit-card" aria-label={`${candidate.name}, recruit`}>
      <HeroPortrait hero={candidate} size="sm" showStatus={false} />
      <div className="recruit-card__who">
        <strong>{candidate.name}</strong>
        <span className="recruit-card__line">
          <Icon name={CLASS_ICONS[classId] || 'party'} size={14} label={classId} />
          {classId} · Lv {candidate.level} · Age {candidate.age}
        </span>
        <span className="recruit-card__badges">
          <RarityBadge rarity={candidate.rarity} />
          <PrimalBadge primal={candidate.primal} compact />
        </span>
      </div>
      <dl className="recruit-card__stats">
        <div>
          <dt>Power</dt>
          <dd className="num">{span(ranges.power)}</dd>
        </div>
        <div>
          <dt>Potential</dt>
          <dd className="num">{span(ranges.potential)}</dd>
        </div>
        {attributes.map(([key, range]) => (
          <div key={key} title={CLASSES[classId]?.primary === key ? 'Main stat' : undefined}>
            <dt>{key.slice(0, 3)}</dt>
            <dd className="num">{span(range)}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
