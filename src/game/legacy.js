import { LOCATION_BY_ID } from '../data/world.js';

export const BRANCH_RULES = {
  National: { max: 1, cost: 1800, minLevel: 6 },
  Global: { max: 3, cost: 3200, minLevel: 8 },
};

export const AMBITION_TEMPLATES = [
  { id: 'champion', label: 'Become a celebrated champion', metric: 'titles', target: 3, dream: /champion|surpass/i, rewardLegacy: 22 },
  { id: 'artifact-seeker', label: 'Claim two storied artifacts', metric: 'artifacts', target: 2, dream: /artifact|map/i, rewardLegacy: 24 },
  { id: 'legendary-deeds', label: 'Complete three legendary deeds', metric: 'legendary', target: 3, dream: /save|avenge|never lose/i, rewardLegacy: 26 },
  { id: 'master', label: 'Reach level 15', metric: 'level', target: 15, dream: /school|surpass/i, rewardLegacy: 20 },
  { id: 'veteran', label: 'Complete twenty missions', metric: 'missions', target: 20, dream: /.*/i, rewardLegacy: 18 },
];

export function ambitionMetric(hero, ambition) {
  if (!hero || !ambition) return 0;
  if (ambition.metric === 'level') return hero.level || 1;
  return hero.career?.[ambition.metric] || 0;
}

export function defaultAmbitionForHero(hero, serial = 0) {
  const matches = AMBITION_TEMPLATES.filter((template) => template.dream.test(hero?.dream || ''));
  const template = matches[serial % Math.max(1, matches.length)] || AMBITION_TEMPLATES[AMBITION_TEMPLATES.length - 1];
  return {
    id: `ambition-${hero.id}-${template.id}-${serial}`,
    templateId: template.id,
    label: template.label,
    metric: template.metric,
    target: template.target,
    rewardLegacy: template.rewardLegacy,
    status: 'active',
    inheritedFromHeroId: null,
    inheritedFromHeroName: null,
  };
}

export function artifactEffectFromPrestige(prestige = 0, name = '') {
  const styles = ['Combat', 'Diplomacy', 'Expedition', 'Intrigue'];
  const hash = [...String(name)].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const domain = styles[hash % styles.length];
  const bonus = Math.max(1, Math.min(6, Math.round(prestige / 18)));
  return { domain, bonus, label: `+${bonus} ${domain} aptitude while carried` };
}

export function branchName(locationId, guildName) {
  const location = LOCATION_BY_ID[locationId];
  return `${location?.name || 'Frontier'} Chapter of ${guildName}`;
}
