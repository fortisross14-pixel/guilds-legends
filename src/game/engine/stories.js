// @ts-check
// The Blackwood story arc, regional boss contracts, and the shared effect
// rules for event cards (town events, festivals, story beats).
import { MISSION_TEMPLATES } from '../../data/content.js';
import { BOSSES, STORY_BOSS } from '../../data/enemies.js';
import { LOCATION_BY_ID, unlockedLocations } from '../../data/world.js';
import { STORY_BEATS, STORY_CHOICES, STORY_PACING } from '../../data/story.js';
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
      hero.injuryWeeks = effects.injuryWeeks;
      hero.monthlyActivity = 'Infirmary';
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

// ---------------------------------------------------------------- story arc

export function storyState(state) {
  return { step: 0, next: null, choice: null, rivalId: null, done: false, postedMissionId: null, ...(state.story || {}) };
}

export function currentBeat(state) {
  const story = storyState(state);
  return story.done ? null : STORY_BEATS[story.step] || null;
}

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

function postStoryContractInPlace(state, beat, rng) {
  const mission = instantiateMission(templateFor(beat.approach), state, rng, LOCATION_BY_ID[beat.locationId]);
  Object.assign(mission, {
    id: `story-${beat.id}-${campaignMonthSerial(state)}`,
    templateId: `story-${beat.id}`,
    title: beat.title,
    stakes: beat.stakes,
    approach: beat.approach,
    difficulty: beat.difficulty + state.guild.tierIndex * 6,
    risk: beat.risk,
    reward: beat.reward,
    fame: beat.fame,
    duration: 2,
    story: beat.id,
    bossId: beat.boss ? STORY_BOSS.id : null,
    availableUntil: farFuture(state),
  });
  state.missions.push(mission);
  state.story = { ...storyState(state), postedMissionId: mission.id };
  state.notifications.push({
    id: `story-${beat.id}`,
    tone: 'purple',
    title: `Story: ${beat.title}`,
    text: `A new lead in ${mission.locationName}. See the Quest Log.`,
  });
  pushNewsInPlace(state, { title: `Story: ${beat.title}`, text: `A special contract is posted in ${mission.locationName}.`, tone: 'purple' });
}

/** Story beat as an event card (the caller places it in pendingEvent). */
export function storyEventCard(state, beat, rng) {
  const rivalId = beat.id === 'rival-hunt' ? pickStoryRival(state, rng) : storyState(state).rivalId;
  return {
    source: 'story',
    beatId: beat.id,
    rivalId,
    title: beat.title,
    text: beat.text,
    options: beat.options.map(({ id, label, note }) => ({ id, label, note })),
  };
}

function pickStoryRival(state, rng) {
  const scored = Object.entries(state.rivalries || {}).sort((a, b) => b[1].score - a[1].score)[0]?.[0];
  if (scored) return scored;
  const regional = state.rivals.filter((rival) => (rival.leagueTierIndex ?? rival.tierIndex) <= state.guild.tierIndex);
  return rng.pick(regional.length ? regional : state.rivals).id;
}

/** Monthly: start the arc or post the next beat when its time comes. Returns an event card or null. */
export function checkStoryInPlace(state, rng) {
  const story = storyState(state);
  if (story.done || story.postedMissionId) return null;
  const now = campaignMonthSerial(state);
  if (story.step === 0 && story.next === null) {
    const monthsPlayed = (state.date.year - 1187) * 12 + state.date.month;
    const started =
      state.guild.contractsCompleted >= STORY_PACING.firstAfterContracts ||
      state.guild.fame >= STORY_PACING.firstAfterFame ||
      monthsPlayed >= STORY_PACING.firstAfterMonths;
    if (!started) return null;
  } else if (story.next !== null && now < story.next) return null;
  const beat = STORY_BEATS[story.step];
  if (!beat) return null;
  if (beat.kind === 'contract') {
    postStoryContractInPlace(state, beat, rng);
    return null;
  }
  return storyEventCard(state, beat, rng);
}

function scheduleNextInPlace(state, rng) {
  const story = storyState(state);
  const gap = rng ? rng.int(STORY_PACING.minMonthsBetween, STORY_PACING.maxMonthsBetween) : STORY_PACING.minMonthsBetween;
  state.story = { ...story, step: story.step + 1, next: campaignMonthSerial(state) + gap, postedMissionId: null };
}

/** A story event card was answered. */
export function advanceStoryEventInPlace(state, beatId, optionId, ctx, rng) {
  const beat = STORY_BEATS.find((item) => item.id === beatId);
  const option = beat?.options.find((item) => item.id === optionId);
  if (!beat || !option) return null;
  applyEventEffectsInPlace(state, option.effects, ctx);
  const story = storyState(state);
  state.story = { ...story, rivalId: ctx.rivalId || story.rivalId, choice: beat.id === 'truth' ? optionId : story.choice };
  addChronicle(state, {
    type: 'story',
    importance: 4,
    title: beat.title,
    text: fillEventText(option.result || beat.text, ctx, state),
    tags: ['story', 'blackwood'],
  });
  scheduleNextInPlace(state, rng);
  return fillEventText(option.result, ctx, state);
}

/** Called when any contract resolves. Advances story beats and records bosses. */
export function onContractResolvedInPlace(state, mission, grade, success, rng) {
  if (mission.story) {
    const beat = STORY_BEATS.find((item) => item.id === mission.story);
    if (!success) {
      state.story = { ...storyState(state), postedMissionId: null, next: campaignMonthSerial(state) + STORY_PACING.retryMonths };
      pushNewsInPlace(state, { title: `Story setback: ${beat.title}`, text: 'The lead goes cold for now. It will come back next month.', tone: 'red' });
      return;
    }
    addChronicle(state, { type: 'story', importance: 5, title: beat.title, text: beat.resultText, tags: ['story', 'blackwood'] });
    state.notifications.push({ id: `story-done-${beat.id}`, tone: 'purple', title: beat.title, text: beat.resultText });
    if (beat.id === 'finale') {
      const choice = STORY_CHOICES[storyState(state).choice] || STORY_CHOICES.restore;
      state.story = { ...storyState(state), done: true, postedMissionId: null, step: STORY_BEATS.length };
      state.guild.honorific = choice.title;
      state.guild.legacy += 60;
      addItemsInPlace(state, { 'lantern-of-the-lost': 1 });
      state.defeatedBosses = [...(state.defeatedBosses || []), { id: STORY_BOSS.id, name: STORY_BOSS.name, year: state.date.year }];
      addChronicle(state, {
        type: 'story',
        importance: 5,
        title: `${state.guild.name} become the ${choice.title}`,
        text: `The Blackwood is quiet. Permanent perk: ${choice.perk}.`,
        tags: ['story', 'blackwood', 'finale'],
      });
      return;
    }
    scheduleNextInPlace(state, rng);
    return;
  }
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

// ---------------------------------------------------------------- regional bosses

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
  return mission.bossId === STORY_BOSS.id ? STORY_BOSS : Object.values(BOSSES).find((item) => item.id === mission.bossId) || null;
}

/** Quest Log / map data for the arc. */
export function getStoryView(state) {
  const story = storyState(state);
  const beat = currentBeat(state);
  const posted = story.postedMissionId
    ? state.missions.find((mission) => mission.id === story.postedMissionId) || state.activeMissions.find((mission) => mission.id === story.postedMissionId)
    : null;
  return {
    started: story.step > 0 || story.next !== null || Boolean(posted),
    done: story.done,
    step: story.step,
    total: STORY_BEATS.length,
    beat,
    posted,
    pin: posted?.locationId || beat?.pin || beat?.locationId || null,
    choice: story.choice ? STORY_CHOICES[story.choice] : null,
    honorific: state.guild.honorific || null,
    blackwoodOpen: story.done || beat?.id === 'finale',
  };
}

export function heroHistoryNote(state, heroId, title, text) {
  const hero = getHero(state, heroId);
  if (hero) addHeroHistory(hero, state, { type: 'event', title, text });
}
