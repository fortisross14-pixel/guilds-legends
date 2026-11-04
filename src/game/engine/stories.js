// @ts-check
// Regional boss contracts and the shared effect rules for event cards (town
// events, festivals). The main story lives in story.js.
import { MISSION_TEMPLATES } from '../../data/content.js';
import { INJURY } from '../../data/rooms.js';
import { BOSSES } from '../../data/enemies.js';
import { LOCATION_BY_ID, unlockedLocations } from '../../data/world.js';
import { addChronicle, addHeroHistory, campaignMonthSerial, clamp, getHero, pushNewsInPlace } from './core.js';
import { applyXpInPlace, adjustRelationshipInPlace } from './heroes.js';
import { addItemsInPlace } from './inventory.js';
import { adjustRegionReputationInPlace, missionFamily, regionLevel } from './reputation.js';
import { recordRivalryInPlace } from './rivalry.js';
import { instantiateMission } from './universe.js';

// ---------------------------------------------------------------- shared event effects

/**
 * Applies an effects object from src/data/events.js or story.js.
 * ctx: { heroId, hero2Id, rivalId, townId, rng }
 */
export function applyEventEffectsInPlace(state, effects = {}, ctx = {}) {
  const hero = ctx.heroId ? state.heroes.find((item) => item.id === ctx.heroId) : null;
  const hero2 = ctx.hero2Id ? state.heroes.find((item) => item.id === ctx.hero2Id) : null;
  const home = state.heroes.filter((item) => !['dead', 'retired'].includes(item.status));
  const town = LOCATION_BY_ID[ctx.townId || state.world?.currentLocationId];
  if (effects.gold) state.guild.crowns += effects.gold;
  if (effects.fame) state.guild.fame = Math.max(0, state.guild.fame + effects.fame);
  if (effects.legacy) state.guild.legacy += effects.legacy;
  if (hero) {
    if (effects.loyalty) hero.loyalty = clamp(hero.loyalty + effects.loyalty, 0, 100);
    if (effects.xp) applyXpInPlace(hero, effects.xp, state, 'a town event');
    if (effects.fatigue) hero.fatigue = clamp((hero.fatigue || 0) + effects.fatigue, 0, 100);
    if (effects.health) hero.health = clamp((hero.health ?? 100) + effects.health, 1, 100);
    if (effects.injuryWeeks && hero.status === 'available') {
      hero.status = 'injured';
      hero.injury = 'Hurt during an errand';
      // A normal injury: a week (guild-hall-rooms spec).
      hero.injuryWeeks = INJURY.weeks;
    }
  }
  if (hero && hero2 && effects.relationship) {
    adjustRelationshipInPlace(hero, hero2.id, effects.relationship, 'A town event');
    adjustRelationshipInPlace(hero2, hero.id, effects.relationship, 'A town event');
  }
  if (effects.fatigueAll) home.forEach((item) => (item.fatigue = clamp((item.fatigue || 0) + effects.fatigueAll, 0, 100)));
  if (effects.loyaltyAll) home.forEach((item) => (item.loyalty = clamp(item.loyalty + effects.loyaltyAll, 0, 100)));
  if (effects.rest) home.forEach((item) => (item.fatigue = clamp((item.fatigue || 0) - 15, 0, 100)));
  if (effects.item) addItemsInPlace(state, effects.item);
  if (effects.regionRep && town) adjustRegionReputationInPlace(state, town.region, effects.regionRep);
  if (effects.familyRep) {
    state.reputation ||= { families: {}, regions: {} };
    const [family, amount] = effects.familyRep;
    state.reputation.families[family] = Math.max(0, (state.reputation.families[family] || 0) + amount);
  }
  if (effects.rivalry && ctx.rivalId) {
    state.rivalries ||= {};
    recordRivalryInPlace(state, ctx.rivalId, 'close');
    state.rivalries[ctx.rivalId].score += effects.rivalry - 1;
  }
  if (effects.localPay && town) {
    state.missions
      .filter((mission) => mission.locationId === town.id)
      .forEach((mission) => (mission.reward = Math.round(mission.reward * (1 + effects.localPay))));
  }
  if (effects.sideJob) state.flags.extraSideJob = (state.flags.extraSideJob || 0) + 1;
  if (effects.recruit) state.flags.extraRecruit = true;
}

export function fillEventText(text, ctx, state) {
  const name = (id) => state.heroes.find((hero) => hero.id === id)?.name || 'someone';
  return String(text || '')
    .replaceAll('{hero}', name(ctx.heroId))
    .replaceAll('{hero2}', name(ctx.hero2Id))
    .replaceAll('{rival}', state.rivals.find((rival) => rival.id === ctx.rivalId)?.name || 'a rival guild')
    .replaceAll('{town}', LOCATION_BY_ID[ctx.townId || state.world?.currentLocationId]?.name || 'town')
    .replaceAll('{festival}', ctx.festival || 'festival');
}

// ---------------------------------------------------------------- regional bosses

function templateFor(approach) {
  return (
    MISSION_TEMPLATES.find((template) => template.tier === 'Regional' && (template.approach || '') === approach) ||
    MISSION_TEMPLATES.find((template) => missionFamily(template) === approach) ||
    MISSION_TEMPLATES[0]
  );
}

function farFuture(state, years = 5) {
  return { year: state.date.year + years, month: state.date.month };
}

/** Called when any contract resolves: records a defeated regional boss. */
export function onContractResolvedInPlace(state, mission, grade, success) {
  if (mission.bossId && success) {
    const boss = Object.values(BOSSES).find((item) => item.id === mission.bossId);
    if (!boss) return;
    state.defeatedBosses = [...(state.defeatedBosses || []), { id: boss.id, name: boss.name, region: mission.region, year: state.date.year }];
    if (boss.trophy) addItemsInPlace(state, { [boss.trophy]: 1 });
    adjustRegionReputationInPlace(state, mission.region, 150);
    state.reputation.families.Combat = (state.reputation.families.Combat || 0) + 100;
    state.guild.legacy += 20;
    addChronicle(state, {
      type: 'boss',
      importance: 5,
      title: `${boss.name} falls`,
      text: `${state.guild.name} defeats ${boss.name} in ${mission.locationName}. Its trophy hangs in the guild hall.`,
      tags: ['boss', mission.region],
    });
    pushNewsInPlace(state, { title: `${boss.name} defeated`, text: `All of ${mission.region} is talking about it.`, tone: 'gold' });
  }
}

/** Monthly: post a boss contract in each region where the guild is Known and the boss lives. */
export function checkBossesInPlace(state, rng) {
  const defeated = new Set((state.defeatedBosses || []).map((item) => item.id));
  const reachable = unlockedLocations(state.guild.tierIndex);
  Object.entries(BOSSES).forEach(([region, boss]) => {
    if (defeated.has(boss.id) || regionLevel(state, region) < 1) return;
    if (state.missions.some((mission) => mission.bossId === boss.id) || state.activeMissions.some((mission) => mission.bossId === boss.id)) return;
    const location = reachable.find((item) => item.region === region) || null;
    if (!location) return;
    const mission = instantiateMission(templateFor('Combat'), state, rng, location);
    Object.assign(mission, {
      id: `boss-${boss.id}-${campaignMonthSerial(state)}`,
      templateId: boss.id,
      title: `Boss: ${boss.name}`,
      stakes: boss.intro,
      approach: 'Combat',
      difficulty: 62 + state.guild.tierIndex * 12,
      risk: 5,
      reward: 600 + state.guild.tierIndex * 300,
      fame: 30,
      duration: 2,
      bossId: boss.id,
      availableUntil: farFuture(state, 2),
    });
    state.missions.push(mission);
    state.notifications.push({ id: `boss-${boss.id}`, tone: 'red', title: `${boss.name} stirs`, text: `A boss contract is posted in ${location.name}.` });
    pushNewsInPlace(state, { title: `${boss.name} stirs`, text: `A boss contract is posted in ${location.name}.`, tone: 'red' });
  });
}

export function bossForMission(mission) {
  if (!mission?.bossId) return null;
  return Object.values(BOSSES).find((item) => item.id === mission.bossId) || null;
}

export function heroHistoryNote(state, heroId, title, text) {
  const hero = getHero(state, heroId);
  if (hero) addHeroHistory(hero, state, { type: 'event', title, text });
}
