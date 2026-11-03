import { travellingPartyIds } from '../game/engine.js';

const ACTIVITY_STATUS = {
  Training: { key: 'training', label: 'Training', icon: '⚔' },
  Rest: { key: 'resting', label: 'Resting', icon: '☾' },
  Infirmary: { key: 'infirmary', label: 'Infirmary', icon: '✚' },
  Scouting: { key: 'scouting', label: 'Scouting', icon: '⌖' },
  'Public Exhibition': { key: 'exhibition', label: 'Exhibition', icon: '✦' },
  'Guild Duty': { key: 'duty', label: 'Guild duty', icon: '♜' },
};

/** Where a hero is and what they are doing. away = cannot change rooms. */
export function heroStatus(state, hero) {
  if (hero.status === 'mission') return { key: 'mission', label: 'On mission', icon: '⌖', away: true };
  if (hero.status === 'tournament') return { key: 'tournament', label: 'In tournament', icon: '♛', away: true };
  if (hero.status === 'sidejob') return { key: 'sidejob', label: 'Side job', icon: '✎', away: true };
  if (hero.branchId) return { key: 'branch', label: 'Branch duty', icon: '⚑', away: true };
  if (travellingPartyIds(state).includes(hero.id)) return { key: 'traveling', label: state.world?.activeTravel ? 'On the road' : 'With you', icon: '➜', away: true };
  if (hero.status === 'injured')
    return { key: 'injured', label: hero.monthlyActivity === 'Infirmary' ? 'Injured · Infirmary' : 'Injured', icon: '✚', away: false };
  // An activity whose room is not built yet means the hero simply rests.
  const room = { Training: 'training', Infirmary: 'infirmary', Scouting: 'scouts' }[hero.monthlyActivity];
  const built = room ? Boolean(state.guild.hall?.rooms?.[room]) : hero.monthlyActivity !== 'Guild Duty' || Boolean(state.guild.hall?.owned);
  return { ...((built && ACTIVITY_STATUS[hero.monthlyActivity]) || ACTIVITY_STATUS.Rest), away: false };
}

/** Reasons a hero needs attention (shown as a warning dot). */
export function heroWarnings(state, hero) {
  const warnings = [];
  if (hero.status === 'injured' && hero.monthlyActivity !== 'Infirmary' && state.guild.hall?.rooms?.infirmary) warnings.push('Injured but not in the Infirmary');
  if ((hero.fatigue || 0) >= 70) warnings.push('Very tired');
  if ((hero.loyalty ?? 100) < 35) warnings.push('Loyalty is low');
  const nowMonth = state.date.year * 12 + state.date.month;
  if (hero.contract && hero.contract.endSerial - nowMonth <= 3) warnings.push('Contract ends soon');
  if (hero.poachApproach) warnings.push(`${hero.poachApproach.rivalName} is courting them`);
  if ((hero.promises || []).some((promise) => promise.status === 'active' && Number.isFinite(promise.dueSerial) && promise.dueSerial - nowMonth <= 2)) {
    warnings.push('A promise is due soon');
  }
  return warnings;
}

export function activeRoster(state) {
  return state.heroes.filter((hero) => !['dead', 'retired'].includes(hero.status));
}
