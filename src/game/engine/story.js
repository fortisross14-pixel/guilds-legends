// @ts-check
// The Last Banner (src/data/story.js): story missions and their steps, scenes,
// story contracts and duels, evidence, the Lore codex and story recruits. Also
// the shared condition checker (dialogue, gates, wild areas). Progress runs
// after every engine action through the finalize hook, so gates open the
// moment their condition holds; nothing here runs on the calendar.
import { cleanBanner } from '../../data/banner.js';
import { CHAPTERS, EVIDENCE, PROLOGUE, REGIONAL_TOURNAMENTS, STORY_HEROES, STORY_MISSIONS, STORY_MISSION_BY_ID } from '../../data/story.js';
import { PATHS } from '../../data/charters.js';
import { DIALOGUES, SEASON_MONTHS, TOP_LEVEL_FLAGS } from '../../data/dialogue/index.js';
import { ASK_AROUND } from '../../data/dialogue/askAround.js';
import { LORE_BY_ID, PLACE_LORE } from '../../data/lore.js';
import { MISSION_TEMPLATES } from '../../data/content.js';
import { LOCATION_BY_ID } from '../../data/world.js';
import { TOWNS } from '../../data/towns/index.js';
import { WILD_AREAS } from '../../data/wilds/index.js';
import { PATRON_DELTAS } from '../../data/patrons.js';
import { createDuelEncounter } from '../combat.js';
import { artifactEffectFromPrestige } from '../legacy.js';
import {
  addChronicle,
  addHeroHistory,
  atHome,
  campaignDaySerial,
  campaignMonthSerial,
  clone,
  commitRng,
  earnGoldInPlace,
  finalize,
  freeBeds,
  hasHall,
  hashString,
  onFinalize,
  pushMoment,
  pushNewsInPlace,
  rngFor,
  tallyGuild,
} from './core.js';
import { adjustPatronInPlace, applyCharterInPlace, patronAtLeast, patronLevel } from './charter.js';
import { createHeroFromBase, generateHero } from './heroes.js';
import { addItemsInPlace, battleItems } from './inventory.js';
import { adjustRegionReputationInPlace, missionFamily, regionLevel, standingQuadrant } from './reputation.js';
import { instantiateMission } from './universe.js';
import { makeContract } from './contracts.js';
import { rentLotInPlace } from './hall.js';

// ---------------------------------------------------------------- state

/** The story record with defaults filled in (read-only use). */
export function storyState(state) {
  return {
    missions: {},
    evidence: {},
    codex: {},
    choices: {},
    scene: null,
    tutorial: 'active',
    prologue: 'house',
    chapter: 1,
    chapterDone: false,
    ...(state.story || {}),
  };
}

function storyInPlace(state) {
  state.story = storyState(state);
  return state.story;
}

function missionState(story, id) {
  story.missions[id] ||= { status: 'locked', step: 0, route: null };
  return story.missions[id];
}

export function storyDone(state, missionId) {
  return state.story?.missions?.[missionId]?.status === 'done';
}

function storyHero(state, id) {
  return state.heroes.find((hero) => hero.storyId === id && !['dead', 'retired'].includes(hero.status)) || null;
}

/** True when the guild won a tournament: `value` a circuit ('Initiation'), an event id, or 'any'. */
function tournamentWon(state, value) {
  return (state.tournamentHistory || []).some((record) => record.championGuildId === 'player' && (value === 'any' || record.circuit === value || record.definitionId === value));
}

/** True when the guild reached the final (finished first or second) of one of these events. */
function reachedFinal(state, ids) {
  const list = Array.isArray(ids) ? ids : [ids];
  return (state.tournamentHistory || []).some((record) => record.playerResult && record.playerResult.finish <= 2 && list.includes(record.definitionId));
}

function tournamentPlayed(state, definitionId) {
  return (state.tournamentHistory || []).some(
    (record) => record.playerResult && (definitionId === 'any' ? REGIONAL_TOURNAMENTS.includes(record.definitionId) : record.definitionId === definitionId),
  );
}

// ---------------------------------------------------------------- conditions

const oldRoadCleared = (state) => storyDone(state, 'm3') || (state.missionHistory || []).some((mission) => mission.templateId === 'wolves-old-road');

/**
 * True when every key of `condition` holds. Shared by dialogue, story gates,
 * wild-area unlocks and enemy groups (keys: src/data/dialogue/index.js).
 */
export function checkCondition(state, condition, context = {}) {
  if (!condition) return true;
  const exploration = state.world?.exploration || {};
  const flags = { ...(state.flags?.dialogue || {}), ...Object.fromEntries(TOP_LEVEL_FLAGS.map((name) => [name, state.flags?.[name]])) };
  const story = storyState(state);
  const list = (value) => (Array.isArray(value) ? value : [value]);
  return Object.entries(condition).every(([key, value]) => {
    switch (key) {
      case 'any':
        return value.some((item) => checkCondition(state, item, context));
      case 'talked':
        return Boolean(exploration.talked?.[context.conversationId]) === value;
      case 'oldRoadCleared':
        return oldRoadCleared(state) === value;
      case 'tierAtLeast':
        return (state.guild?.tierIndex || 0) >= value;
      case 'fameAtLeast':
        return (state.guild?.fame || 0) >= value;
      case 'goldAtLeast':
        return (state.guild?.crowns || 0) >= value;
      case 'season':
        return list(value).some((season) => (SEASON_MONTHS[season] || []).includes(state.date.month));
      case 'flag':
        return Boolean(flags[value]);
      case 'notFlag':
        return !flags[value];
      case 'candidateHere':
        return (state.candidates || []).some((candidate) => (candidate.locationId || 'dunmere') === (state.world?.currentLocationId || 'dunmere')) === value;
      case 'visitedArea':
        return Boolean(exploration.wild?.[value]?.visited);
      case 'bossDefeated':
        return (exploration.wild?.[value]?.bosses || 0) > 0;
      case 'wildBeaten': {
        // 'areaId:groupId': that group (a boss) has been beaten at least once.
        const [areaId, groupId] = String(value).split(':');
        return Boolean(exploration.wild?.[areaId]?.beaten?.[groupId]);
      }
      case 'levelAtLeast':
        return state.heroes.some((hero) => !['dead', 'retired'].includes(hero.status) && hero.level >= value);
      case 'gearEquipped':
        return state.heroes.some((hero) => !['dead', 'retired'].includes(hero.status) && Object.values(hero.gear || {}).some(Boolean)) === value;
      case 'charter':
        return list(value).includes(state.guild?.charter);
      case 'patronAtLeast':
        return Object.entries(value).every(([id, level]) => patronAtLeast(state, id, level));
      case 'patronBelow':
        return Object.entries(value).every(([id, level]) => !patronAtLeast(state, id, level));
      case 'patronRival':
        return patronLevel(state, value).index < 0;
      case 'patronGiftReady':
        return state.patrons?.[value]?.lastGift !== campaignMonthSerial(state) && (state.guild?.crowns || 0) >= PATRON_DELTAS.giftCost;
      // The story
      case 'prologueDone':
        return (story.prologue === 'done') === value;
      case 'tutorialSkipped':
        return (story.tutorial === 'skipped') === value;
      case 'tutorialDone':
        return (story.tutorial !== 'active') === value;
      case 'chapterAtLeast':
        return (story.chapter || 1) >= value;
      case 'storyDone':
        return list(value).every((id) => storyDone(state, id));
      case 'notStoryDone':
        return !storyDone(state, value);
      case 'storyStep':
        return atStoryStep(state, value);
      case 'visitedPlace':
        return (state.world?.visitedLocationIds || []).includes(value) || state.world?.currentLocationId === value;
      case 'storyActive':
        return story.missions?.[value]?.status === 'active';
      case 'evidence':
        return Boolean(story.evidence?.[value]);
      case 'evidenceAtLeast':
        return Object.keys(story.evidence || {}).length >= value;
      case 'codex':
        return Boolean(story.codex?.[value]);
      case 'choice':
        return Object.entries(value).every(([name, wanted]) => list(wanted).includes(story.choices?.[name]));
      case 'notChoice':
        return Object.entries(value).every(([name, unwanted]) => !list(unwanted).includes(story.choices?.[name]));
      case 'storyHero':
        return Boolean(storyHero(state, value));
      case 'notStoryHero':
        return !storyHero(state, value);
      case 'storyHeroLoyalty':
        return (storyHero(state, value.id)?.loyalty || 0) >= value.at;
      case 'contractsWon':
        return (state.stats?.missionsWon || 0) >= value;
      case 'regionLevel':
        return Object.entries(value).every(([region, level]) => regionLevel(state, region) >= level);
      case 'heroClass':
        return state.heroes.some((hero) => !['dead', 'retired'].includes(hero.status) && hero.classId === value.classId && hero.level >= (value.level || 1));
      case 'signedUp':
        return (state.tournaments || []).some((tournament) => tournament.definitionId === value && (tournament.signup || tournament.assignments?.length));
      case 'wonTournament':
        return tournamentWon(state, value);
      case 'reachedFinal':
        return reachedFinal(state, value);
      case 'tournamentPlayed':
        return tournamentPlayed(state, value);
      // Items (docs/design/ITEMS.md): { hasItem: { 'wolf-pelt': 3 } }.
      case 'hasItem':
        return Object.entries(value).every(([id, count]) => (state.inventory?.[id] || 0) >= count);
      case 'notItem':
        return list(value).every((id) => !(state.inventory?.[id] || 0));
      // Standing (docs/design/PILLARS.md): honor −100…100, dread 0…100, bands with a margin.
      case 'honorAtLeast':
        return (state.guild?.standing?.honor || 0) >= value;
      case 'honorBelow':
        return (state.guild?.standing?.honor || 0) < value;
      case 'dreadAtLeast':
        return (state.guild?.standing?.dread || 0) >= value;
      case 'quadrant':
        return list(value).includes(standingQuadrant(state));
      case 'honorBand':
        return list(value).includes(state.guild?.standing?.honorBand || 'neutral');
      case 'freeBed':
        return (freeBeds(state) > 0) === value;
      case 'atHome':
        return atHome(state) === value;
      case 'hallLeased':
        return hasHall(state) === value;
      default:
        return false;
    }
  });
}

// ---------------------------------------------------------------- codex, evidence, recruits

/** Unlocks a Lore codex entry (quietly, or with a notification). */
export function unlockCodexInPlace(state, id, quiet = false) {
  const entry = LORE_BY_ID[id];
  const story = storyInPlace(state);
  if (!entry || story.codex[id]) return false;
  story.codex[id] = campaignDaySerial(state);
  if (!quiet) state.notifications.push({ id: `codex-${id}`, tone: 'purple', title: `Lore: ${entry.title}`, text: 'A new entry in the Lore codex (Chronicle menu).' });
  return true;
}

export function addEvidenceInPlace(state, id) {
  const story = storyInPlace(state);
  const item = EVIDENCE.find((entry) => entry.id === id);
  if (!item || story.evidence[id]) return false;
  story.evidence[id] = campaignDaySerial(state);
  state.notifications.push({ id: `evidence-${id}`, tone: 'gold', title: `Evidence: ${item.name}`, text: item.text });
  addChronicle(state, { type: 'story', importance: 3, title: `Evidence: ${item.name}`, text: item.text, tags: ['story', 'evidence'] });
  return true;
}

/** A story hero joins the guild (free, two-year contract). */
export function storyRecruitInPlace(state, id) {
  const base = STORY_HEROES[id];
  if (!base || state.heroes.some((hero) => hero.id === base.id)) return null;
  // No exceptions for story heroes: no hall or no free bed, no hire (the scenes offer to wait).
  if (!hasHall(state) || freeBeds(state) <= 0) return null;
  const rng = rngFor(state, `story-recruit-${id}`);
  const hero = createHeroFromBase({ ...base, homeLocationId: state.world?.currentLocationId || 'dunmere' }, state, rng, {});
  hero.storyId = id;
  hero.status = 'available';
  hero.guildId = 'player';
  hero.joinedYear = state.date.year;
  hero.contract = makeContract(state, base.salary, 2);
  hero.salary = hero.contract.salary;
  hero.signedFee = 0;
  hero.promises = [];
  addHeroHistory(hero, state, { type: 'joined', title: `Joined ${state.guild.name}`, text: base.hook });
  state.heroes.push(hero);
  tallyGuild(state, 'recruits');
  pushMoment(state, { type: 'recruit', heroId: hero.id, name: hero.name, classId: hero.classId, primal: hero.primal, rarity: hero.rarity, level: hero.level, personality: hero.personality, hook: hero.hook });
  addChronicle(state, { type: 'recruitment', importance: 4, title: `${hero.name} joins the guild`, text: base.hook, heroIds: [hero.id], tags: ['recruitment', 'story'] });
  commitRng(state, rng);
  return hero;
}

// ---------------------------------------------------------------- missions and steps

export function currentStep(state, missionId) {
  const mission = STORY_MISSION_BY_ID[missionId];
  const record = state.story?.missions?.[missionId];
  if (!mission || record?.status !== 'active') return null;
  return mission.steps[record.step] || null;
}

/** True when '<missionId>.<stepId>' is a mission's current step. */
export function atStoryStep(state, key) {
  const [missionId, stepId] = String(key).split('.');
  return currentStep(state, missionId)?.id === stepId;
}

/**
 * An "ask around" step current in this town (src/data/dialogue/askAround.js), or null:
 * { key, text, …entry }. Asked of anyone but the one who knows (the step's npc).
 */
export function askAroundHere(state, askerKey = '') {
  const here = state.world?.wildAreaId || state.world?.activeTravel ? null : state.world?.currentLocationId || 'dunmere';
  for (const [key, entry] of Object.entries(ASK_AROUND)) {
    if (entry.locationId !== here || !atStoryStep(state, key)) continue;
    const [missionId] = key.split('.');
    if (currentStep(state, missionId)?.npc === askerKey) continue;
    return { key, ...entry };
  }
  return null;
}

/** What someone says when asked around (the hint once enough people were asked). */
export function askAroundReply(state, entry, askerKey) {
  const asked = state.story?.asked?.[entry.key] || 0;
  const [low, high] = entry.after || [2, 4];
  const need = low + (hashString(`${state.seed}:${entry.key}`) % (high - low + 1));
  if (asked + 1 >= need) return entry.pointer;
  return entry.lines[hashString(`${entry.key}:${askerKey}`) % entry.lines.length];
}

/** Counts one more person asked (only the first time each one is asked). */
export function askedAroundInPlace(state, entry, askerKey) {
  state.story.asked ||= {};
  state.story.askedBy ||= {};
  const seen = (state.story.askedBy[entry.key] ||= []);
  if (seen.includes(askerKey)) return;
  seen.push(askerKey);
  state.story.asked[entry.key] = (state.story.asked[entry.key] || 0) + 1;
}

/** The active mission whose current step is `kind` with `field` = value, and that step. */
function activeStepWhere(state, test) {
  for (const mission of STORY_MISSIONS) {
    const step = currentStep(state, mission.id);
    if (step && test(step, mission)) return { mission, step };
  }
  return null;
}

function templateFor(approach) {
  return (
    MISSION_TEMPLATES.find((template) => template.tier === 'Regional' && (template.approach || '') === approach) ||
    MISSION_TEMPLATES.find((template) => missionFamily(template) === approach) ||
    MISSION_TEMPLATES[0]
  );
}

function stepVariant(state, mission, step) {
  const route = state.story?.missions?.[mission.id]?.route;
  return step.contracts?.[route] || step.contracts?.default || null;
}

/** Posts the step's story contract on its notice board (once; again after a failure). */
function postStoryContractInPlace(state, mission, step, variant) {
  const key = `${mission.id}.${step.id}`;
  if (state.missions.some((item) => item.story === key)) return false;
  const record = missionState(storyInPlace(state), mission.id);
  if (record.retryDay && campaignDaySerial(state) < record.retryDay) return false;
  const rng = rngFor(state, `story-${key}-${record.attempts || 0}`);
  const location = LOCATION_BY_ID[variant.locationId || mission.locationId];
  const template = variant.templateId ? MISSION_TEMPLATES.find((item) => item.id === variant.templateId) : templateFor(variant.approach);
  const contract = instantiateMission(template, state, rng, location);
  if (!variant.templateId) {
    Object.assign(contract, {
      title: variant.title,
      stakes: variant.stakes,
      brief: `${variant.stakes} (Story: ${mission.title}.)`,
      approach: variant.approach,
      difficulty: variant.difficulty + state.guild.tierIndex * 6,
      risk: variant.risk,
      reward: variant.reward,
      fame: variant.fame,
      duration: variant.duration,
      patron: null,
    });
  }
  Object.assign(contract, { id: `story-${key}-${campaignDaySerial(state)}`, story: key, availableUntil: { year: state.date.year + 20, month: 0 } });
  state.missions.push(contract);
  commitRng(state, rng);
  state.notifications.push({ id: `story-contract-${key}`, tone: 'purple', title: `Story: ${contract.title}`, text: `Posted at the Notice Board in ${location?.name || 'town'}.` });
  return true;
}

function advanceStepInPlace(state, mission) {
  const record = missionState(storyInPlace(state), mission.id);
  record.step += 1;
  record.snooze = 0;
}

function completeMissionInPlace(state, mission) {
  const story = storyInPlace(state);
  const record = missionState(story, mission.id);
  record.status = 'done';
  record.doneDay = campaignDaySerial(state);
  const rewards = mission.rewards || {};
  if (rewards.gold) earnGoldInPlace(state, rewards.gold);
  if (rewards.fame) state.guild.fame += rewards.fame;
  if (rewards.legacy) state.guild.legacy += rewards.legacy;
  if (rewards.items) addItemsInPlace(state, rewards.items);
  if (rewards.patron) adjustPatronInPlace(state, rewards.patron.id, rewards.patron.amount, mission.title);
  if (rewards.region) adjustRegionReputationInPlace(state, rewards.region.id, rewards.region.amount);
  if (rewards.evidence) addEvidenceInPlace(state, rewards.evidence);
  (rewards.codex || []).forEach((id) => unlockCodexInPlace(state, id, true));
  addChronicle(state, { type: 'story', importance: 4, title: `Story: ${mission.title}`, text: mission.summary, tags: ['story', `act-${mission.act}`] });
  pushNewsInPlace(state, { title: `Story: ${mission.title} complete`, text: mission.summary, tone: 'purple' });
  state.notifications.push({ id: `story-done-${mission.id}`, tone: 'purple', title: `${mission.title}: complete`, text: 'See the Quest Log for what comes next.' });
  // The end of Chapter 1 (the Harvest Melee) is the end of the tutorial.
  if (mission.id === 'm4' && story.tutorial === 'active') {
    story.tutorial = 'done';
    pushMoment(state, { type: 'tutorialComplete', title: 'Tutorial complete' });
  }
  if (mission.endsChapter) {
    // A chapter ends; the next one opens (its missions are gated on chapterAtLeast or on this one).
    const chapter = mission.endsChapter;
    story.chapterDone = chapter;
    story.chapter = Math.max(story.chapter || 1, chapter + 1);
    pushMoment(state, { type: 'chapterEnd', chapter, title: `Chapter ${chapter} complete` });
    addChronicle(state, { type: 'story', importance: 5, title: `The end of ${CHAPTERS[chapter]?.title || `Chapter ${chapter}`}`, text: CHAPTERS[chapter]?.teaser || mission.summary, tags: ['story', 'chapter'] });
  }
}

function gateOpen(state, mission) {
  if (mission.locked) return false;
  return checkCondition(state, mission.gate?.if) || (mission.alternatives || []).some((alternative) => checkCondition(state, alternative.if));
}

/** One pass over the missions; true when something changed. */
function storyPassInPlace(state) {
  const story = storyInPlace(state);
  for (const mission of STORY_MISSIONS) {
    const record = missionState(story, mission.id);
    if (record.status === 'done') continue;
    if (record.status === 'locked') {
      if (!gateOpen(state, mission)) continue;
      record.status = 'active';
      record.step = 0;
      record.openDay = campaignDaySerial(state);
      if (mission.act > 1) {
        state.notifications.push({ id: `story-open-${mission.id}`, tone: 'purple', title: `New story mission: ${mission.title}`, text: mission.summary });
        pushNewsInPlace(state, { title: `Story: ${mission.title}`, text: mission.summary, tone: 'purple' });
      }
      return true;
    }
    const step = mission.steps[record.step];
    if (!step) {
      completeMissionInPlace(state, mission);
      return true;
    }
    if (step.skipIf && checkCondition(state, step.skipIf)) {
      advanceStepInPlace(state, mission);
      return true;
    }
    if (step.kind === 'check' && checkCondition(state, step.if)) {
      advanceStepInPlace(state, mission);
      return true;
    }
    if (step.kind === 'contract') {
      const variant = stepVariant(state, mission, step);
      if (variant?.skip) {
        advanceStepInPlace(state, mission);
        return true;
      }
      if (variant) postStoryContractInPlace(state, mission, step, variant);
    }
  }
  return false;
}

function walkable(locationId) {
  return Boolean(TOWNS[locationId] || WILD_AREAS[locationId]);
}

function stepPlaceHere(state, step) {
  if (state.world?.activeTravel) return false;
  // A step can happen in a wild area (Dawnwatch Temple stands at the end of the Old Road).
  if (state.world?.wildAreaId) return step.at === state.world.wildAreaId;
  if (step.at === 'hall') return atHome(state);
  return (state.world?.currentLocationId || 'dunmere') === step.at;
}

/** Queues the scene of a step that plays on arrival (no NPC, or a town without streets). */
function triggerSceneInPlace(state) {
  const story = storyInPlace(state);
  if (story.scene || state.activeEncounter || state.pendingRoadEvent || state.pendingEvent) return;
  const today = campaignDaySerial(state);
  const found = activeStepWhere(
    state,
    (step, mission) =>
      step.kind === 'scene' &&
      Boolean(DIALOGUES[step.scene]) &&
      (!step.npc || !walkable(step.at)) &&
      stepPlaceHere(state, step) &&
      (story.missions[mission.id]?.snooze || 0) <= today,
  );
  if (found) {
    story.scene = { conversation: found.step.scene, missionId: found.mission.id, stepId: found.step.id };
    return;
  }
  // A contract whose work is done waits on its verdict (src/data/dialogue/verdicts.js): it plays next.
  const verdict = (state.missions || []).find((mission) => mission.accepted && mission.site?.verdict && !mission.site.verdictDone && DIALOGUES[mission.site.verdict]);
  if (verdict) story.scene = { conversation: verdict.site.verdict, verdictFor: verdict.id };
}

/** Runs after every engine action: opens gates, walks steps, posts contracts, queues scenes. */
export function progressStoryInPlace(state) {
  if (!state?.story || !Array.isArray(state.heroes) || state.story.prologue !== 'done') return;
  (state.world?.visitedLocationIds || []).forEach((id) => PLACE_LORE[id] && unlockCodexInPlace(state, PLACE_LORE[id], true));
  if (state.world?.exploration?.wild?.blackwood?.visited) unlockCodexInPlace(state, 'blackwood', true);
  for (let guard = 0; guard < 40; guard += 1) if (!storyPassInPlace(state)) break;
  triggerSceneInPlace(state);
}

onFinalize(progressStoryInPlace);

// ---------------------------------------------------------------- scenes

/** A town NPC whose conversation is the current story scene plays the scene instead. */
export function storyConversationFor(state, conversationId) {
  const found = activeStepWhere(state, (step) => step.kind === 'scene' && step.npc === conversationId && stepPlaceHere(state, step) && Boolean(DIALOGUES[step.scene]));
  return found ? found.step.scene : conversationId;
}

/** Town NPC dialogue ids that hold a story scene right now (quest markers). */
export function storyNpcsHere(state) {
  return STORY_MISSIONS.map((mission) => currentStep(state, mission.id))
    .filter((step) => step?.kind === 'scene' && step.npc && stepPlaceHere(state, step))
    .map((step) => step.npc);
}

/**
 * A story scene's choice was taken: the step is done (or, with { wait: true },
 * snoozed until tomorrow). Called by chooseDialogueOption.
 */
export function storySceneChoiceInPlace(state, conversationId, wait = false) {
  const found = activeStepWhere(state, (step) => step.kind === 'scene' && step.scene === conversationId);
  const story = storyInPlace(state);
  if (story.scene?.conversation === conversationId) story.scene = null;
  if (!found) return false;
  if (wait) {
    missionState(story, found.mission.id).snooze = campaignDaySerial(state) + 1;
    return false;
  }
  advanceStepInPlace(state, found.mission);
  return true;
}

/** Sets the route for the mission whose current scene this is (story contracts and skips). */
export function storyRouteInPlace(state, conversationId, route) {
  const found = activeStepWhere(state, (step) => step.kind === 'scene' && step.scene === conversationId);
  if (found) missionState(storyInPlace(state), found.mission.id).route = route;
}

export function storyChoiceInPlace(state, choices) {
  Object.assign(storyInPlace(state).choices, choices);
}

/** The modal story scene was closed. Scenes without choices complete here; leaving one with choices snoozes it a day. */
export function finishStoryScene(state, conversationId) {
  if (state.story?.scene?.conversation !== conversationId) return state;
  const next = clone(state);
  const verdictFor = next.story.scene.verdictFor;
  next.story.scene = null;
  if (verdictFor) {
    const mission = next.missions.find((item) => item.id === verdictFor);
    if (mission?.site) mission.site.verdictDone = true;
    return finalize(next);
  }
  const found = activeStepWhere(next, (step) => step.kind === 'scene' && step.scene === conversationId);
  if (found) {
    const variant = DIALOGUES[conversationId]?.variants?.find((item) => checkCondition(next, item.if, { conversationId }));
    if (!variant?.choices?.length) advanceStepInPlace(next, found.mission);
    else missionState(next.story, found.mission.id).snooze = campaignDaySerial(next) + 1;
  }
  return finalize(next);
}

/** Plays the current scene of a mission now (from the quest log, when at its place). */
export function playStoryScene(state, missionId) {
  const step = currentStep(state, missionId);
  if (!step || step.kind !== 'scene' || !DIALOGUES[step.scene]) return { state, error: 'Nothing to talk about yet.' };
  if (!stepPlaceHere(state, step)) return { state, error: step.at === 'hall' ? 'Go home to the Guild Hall in Dunmere.' : `Go to ${LOCATION_BY_ID[step.at]?.name || 'that place'} first.` };
  const next = clone(state);
  next.story.scene = { conversation: step.scene, missionId, stepId: step.id };
  return { state: finalize(next), error: null };
}

// ---------------------------------------------------------------- duels

/** Starts the story duel of the current step (one hero against a named opponent). */
export function startStoryDuel(state, missionId, heroId = null) {
  const mission = STORY_MISSION_BY_ID[missionId];
  const step = currentStep(state, missionId);
  if (!mission || step?.kind !== 'duel') return { state, error: 'There is no duel to fight.' };
  if (state.activeEncounter) return { state, error: 'Another fight is already waiting.' };
  if (!stepPlaceHere(state, step)) return { state, error: `The duel is in ${LOCATION_BY_ID[step.at]?.name}.` };
  const ready = state.heroes.filter((hero) => hero.status === 'available');
  const champion = (heroId && ready.find((hero) => hero.id === heroId)) || [...ready].sort((a, b) => b.power - a.power)[0];
  if (!champion) return { state, error: 'Nobody is fit to fight.' };
  const next = clone(state);
  const rng = rngFor(next, `story-duel-${missionId}-${next.story.missions[missionId].duelLosses || 0}`);
  // `easierIf` (a story choice, like fighting Bram dirty): the opponent starts two levels down.
  const easier = step.easierIf && checkCondition(next, step.easierIf);
  const opponent = generateHero(next, rng, 'veteran', { ...step.opponent, level: Math.max(1, (step.opponent.level || 1) - (easier ? 2 : 0)), guildId: null, homeLocationId: step.at });
  opponent.id = step.opponent.id;
  next.activeEncounter = createDuelEncounter({
    id: `story-duel-${missionId}-${campaignDaySerial(next)}`,
    seed: (next.rngState ^ hashString(`story-duel:${missionId}:${campaignDaySerial(next)}`)) >>> 0,
    sourceType: 'story-duel',
    sourceId: missionId,
    title: `${mission.title}: ${opponent.name}`,
    roundName: 'A duel for the truth',
    playerHero: next.heroes.find((hero) => hero.id === champion.id),
    opponentHero: opponent,
    prestige: 20,
    items: battleItems(next),
  });
  commitRng(next, rng);
  return { state: finalize(next), error: null };
}

/** A story duel ended (encounters.js). Winning completes the step; losing can be retried. */
export function storyDuelResultInPlace(state, missionId, won) {
  const mission = STORY_MISSION_BY_ID[missionId];
  const record = missionState(storyInPlace(state), missionId);
  if (!mission || currentStep(state, missionId)?.kind !== 'duel') return;
  if (won) {
    advanceStepInPlace(state, mission);
    addChronicle(state, { type: 'story', importance: 3, title: `${mission.title}: the duel is won`, text: 'The old champion lowers his blade and nods.', tags: ['story', 'duel'] });
  } else {
    record.duelLosses = (record.duelLosses || 0) + 1;
    state.notifications.push({ id: `duel-lost-${missionId}-${record.duelLosses}`, tone: 'red', title: 'The duel is lost', text: 'Rest, train and try again from the Quest Log.' });
  }
}

// ---------------------------------------------------------------- contracts

/** A story contract resolved (outcomes.js): success completes its step; failure re-posts it in a week. */
export function storyContractResolvedInPlace(state, contract, success) {
  if (!contract?.story) return;
  const [missionId, stepId] = contract.story.split('.');
  const mission = STORY_MISSION_BY_ID[missionId];
  const step = currentStep(state, missionId);
  if (!mission || step?.id !== stepId) return;
  const record = missionState(storyInPlace(state), missionId);
  if (success) {
    advanceStepInPlace(state, mission);
    return;
  }
  record.attempts = (record.attempts || 0) + 1;
  record.retryDay = campaignDaySerial(state) + 7;
  pushNewsInPlace(state, { title: `Story setback: ${contract.title}`, text: 'The lead goes cold for a week. The contract will be posted again.', tone: 'red' });
}

// ---------------------------------------------------------------- the prologue

/** The banner as a relic of the old guild, with its provenance. */
function bannerRelic(state) {
  return {
    id: 'artifact-last-banner',
    name: 'The Last Banner',
    relic: true,
    discoveredYear: state.date.year,
    originMission: PROLOGUE.title,
    ownerId: null,
    legend: `Carried by the Broken Lantern. Brought to Dunmere by a stranger called Rook, Year ${state.date.year}. Carried now by the founder of ${state.guild.name}.`,
    prestige: 12,
    effect: artifactEffectFromPrestige(12, 'The Last Banner'),
    ownerHistory: [{ year: state.date.year, month: state.date.month, heroId: null, heroName: 'Guild Vault', action: 'inherited' }],
  };
}

/** Writes the founding into the founder's history and the chronicle (after the guild is named). */
export function foundGuildInPlace(state, guildName) {
  if (guildName) state.guild.name = String(guildName).trim().slice(0, 38) || state.guild.name;
  const founder = state.heroes.find((hero) => hero.id === state.guild.founderHeroId);
  if (founder) {
    founder.origin = `Founder of ${state.guild.name}`;
    addHeroHistory(founder, state, { type: 'founding', title: `Founded ${state.guild.name}`, text: 'Raised a new guild under the Broken Lantern’s last banner, the morning after a stranger called Rook brought it in from the storm.' });
  }
  if (!state.artifacts.some((artifact) => artifact.id === 'artifact-last-banner')) state.artifacts.push(bannerRelic(state));
  // The bearer's medal came tied to the banner's pole (a keepsake: some doors open to it).
  if (!state.inventory?.['lantern-medal']) addItemsInPlace(state, { 'lantern-medal': 1 });
  ['broken-lantern', 'the-banner', 'cassian-rook', 'door-emblem'].forEach((id) => unlockCodexInPlace(state, id, true));
  addChronicle(state, {
    type: 'founding',
    importance: 5,
    title: `${state.guild.founder} raises the banner of ${state.guild.name}`,
    text: 'A wounded stranger brought the Broken Lantern’s banner to a house in Dunmere, and a promise. The next morning, a new guild had a name.',
    heroIds: founder ? [founder.id] : [],
    tags: ['founding', 'story'],
  });
}

/**
 * The prologue's end, when Rook's banner is in the founder's hands: the first
 * choice gives its clue (src/data/story.js PROLOGUE.rewards), and the guild is
 * founded: its name, motto and charter. Then Act I begins (or, when the player
 * asked to skip the tutorial at new game, the skipped state).
 */
export function completePrologue(state, { choice, guildName, motto, charter, banner } = {}) {
  if (storyState(state).prologue === 'done') return { state, error: null };
  if (!String(guildName || '').trim()) return { state, error: 'Name your guild.' };
  const next = clone(state);
  const story = storyInPlace(next);
  applyCharterInPlace(next, charter);
  // The banner the founder designed (src/data/banner.js).
  next.guild.banner = cleanBanner(banner);
  // The founder wakes in the house; stepping out puts them at its door in Dunmere.
  const house = TOWNS.dunmere?.buildings.find((building) => building.building === 'house');
  if (house) {
    next.world.exploration ||= {};
    next.world.exploration.positions ||= {};
    next.world.exploration.positions.dunmere = { x: (house.door[0] + 0.5) * 32, y: (house.door[1] + 1) * 32 + 6 };
  }
  if (String(motto || '').trim()) next.guild.motto = String(motto).trim().slice(0, 72);
  if (story.skipRequested) {
    delete story.skipRequested;
    skipTutorialInPlace(next, guildName);
    return { state: finalize(next), error: null };
  }
  const pick = PROLOGUE.choices.some((item) => item.id === choice) ? choice : 'banner';
  story.prologue = 'done';
  story.choices.prologue = pick;
  const reward = PROLOGUE.rewards[pick] || {};
  if (reward.flag) {
    next.flags.dialogue ||= {};
    next.flags.dialogue[reward.flag] = true;
  }
  if (reward.evidence) addEvidenceInPlace(next, reward.evidence);
  (reward.codex || []).forEach((id) => unlockCodexInPlace(next, id, true));
  foundGuildInPlace(next, guildName);
  return { state: finalize(next), error: null };
}

/**
 * "Skip tutorial" at new game: the same end state without the guidance. The
 * prologue is seen (the banner inspected), the stable yard is rented, Nessa is
 * hired and the Old Road is clear (missions 1–3 done); the Melee is next.
 */
export function skipTutorialInPlace(state, guildName) {
  const story = storyInPlace(state);
  story.prologue = 'done';
  story.tutorial = 'skipped';
  story.choices.prologue = 'banner';
  state.flags.dialogue ||= {};
  state.flags.dialogue.knowsSeven = true;
  state.flags.oldRoadIntroduced = true;
  state.flags.openingPeddler = true;
  foundGuildInPlace(state, guildName);
  rentLotInPlace(state, undefined, 0);
  storyRecruitInPlace(state, 'nessa');
  ['c1-ask', 'm1', 'm2', 'c1-road', 'm3', 'temple'].forEach((id) => {
    const record = missionState(story, id);
    record.status = 'done';
    record.step = STORY_MISSION_BY_ID[id].steps.length;
  });
  ['seven-names', 'official-story', 'mara-fen', 'nessa-thornfield'].forEach((id) => unlockCodexInPlace(state, id, true));
  state.moments = [];
  addChronicle(state, { type: 'story', importance: 2, title: 'A guild of nobodies', text: 'A rented stable, a hunter called Nessa and a cleared Old Road: the new guild finds its feet in Dunmere.', tags: ['story'] });
}

// ---------------------------------------------------------------- read models

function stepView(state, mission, step, index, record) {
  const done = record.status === 'done' || index < record.step;
  return {
    id: step.id,
    kind: step.kind,
    text: step.text,
    hint: step.hint || null,
    screen: step.screen || null,
    at: step.at || mission.locationId,
    done,
    current: record.status === 'active' && index === record.step,
    skipped: done && step.skipIf ? checkCondition(state, step.skipIf) : false,
    here: step.at ? stepPlaceHere(state, step) : false,
    canTalk: record.status === 'active' && index === record.step && step.kind === 'scene' && Boolean(DIALOGUES[step.scene]) && stepPlaceHere(state, step),
    canDuel: record.status === 'active' && index === record.step && step.kind === 'duel' && stepPlaceHere(state, step),
  };
}

/** Everything the Quest Log, the map marker and the objective ribbon need. */
export function getStoryView(state) {
  const story = storyState(state);
  const missions = STORY_MISSIONS.map((mission) => {
    const record = story.missions[mission.id] || { status: 'locked', step: 0 };
    const steps = mission.steps.map((step, index) => stepView(state, mission, step, index, record));
    const current = steps.find((step) => step.current) || null;
    return {
      ...mission,
      status: record.status,
      route: record.route || null,
      steps,
      current,
      // The map pin is a town; a step in a wild area pins the mission's town.
      pin: current?.at === 'hall' ? 'dunmere' : LOCATION_BY_ID[current?.at] ? current.at : mission.locationId,
      gateMet: record.status !== 'locked' || gateOpen(state, mission),
    };
  });
  // Primary: the story lead (one at a time). Secondary: the guild tasks the story asks for (rent a hall, hire).
  const active = missions.find((mission) => mission.status === 'active' && !mission.secondary) || null;
  const secondary = missions.filter((mission) => mission.status === 'active' && mission.secondary);
  const next = active ? null : missions.find((mission) => mission.status === 'locked' && !mission.locked && !mission.secondary) || null;
  return {
    missions,
    active,
    secondary,
    next,
    chapter: story.chapter || 1,
    pin: active?.pin || null,
    tutorial: story.tutorial,
    prologue: story.prologue,
    chapterDone: story.chapterDone,
    doneCount: missions.filter((mission) => mission.status === 'done').length,
    evidence: EVIDENCE.map((item) => ({ ...item, found: Boolean(story.evidence[item.id]) })),
    choices: story.choices,
    // What the guild chose (verdicts and story choices with a { ledger }), newest first.
    ledger: story.ledger || [],
  };
}

const OUTCOME_TEXT = {
  prologue: { hide: 'You hid the body and kept your head.', banner: 'You read the seven names in the hem.', search: 'You found Rook’s confession.', flee: 'You ran, and saw the face at the door.' },
  wrenOutcome: { companion: 'Wren joined the guild.', ally: 'Wren fights beside you, not in your colors.', helper: 'Wren will help, then disappear.' },
  bram: { joined: 'Bram Calder joined the guild.', rival: 'Bram Calder stays a rival.', respect: 'Bram Calder respects you.' },
  nessa: { together: 'Nessa trusts you with her brother’s story.', hurt: 'Nessa told you late; you told her so.' },
};

/** The end of a chapter, season-review style: what the guild did and chose, and what comes next. */
export function getChapterSummary(state, chapter = null) {
  const story = storyState(state);
  const number = chapter || (typeof story.chapterDone === 'number' ? story.chapterDone : 1);
  const years = state.date.year - 1187;
  return {
    title: CHAPTERS[number]?.title || `Chapter ${number}`,
    span: `${MONTHS_SHORT[5]} 1187 → ${MONTHS_SHORT[state.date.month]} ${state.date.year}${years ? ` (${years} year${years === 1 ? '' : 's'})` : ''}`,
    missions: STORY_MISSIONS.filter((mission) => mission.chapter === number && !mission.secondary).map((mission) => ({ number: mission.number, title: mission.title, done: storyDone(state, mission.id) })),
    evidence: EVIDENCE.filter((item) => story.evidence[item.id]).map((item) => item.name),
    recruits: Object.keys(STORY_HEROES).filter((id) => storyHero(state, id)).map((id) => STORY_HEROES[id].name),
    choices: Object.entries(OUTCOME_TEXT).map(([key, texts]) => texts[story.choices[key]]).filter(Boolean),
    stats: {
      contracts: state.stats?.missionsWon || 0,
      titles: (state.stats?.tournamentsWon || 0),
      fame: state.guild.fame,
      legacy: state.guild.legacy,
      heroes: state.heroes.filter((hero) => !['dead', 'retired'].includes(hero.status)).length,
    },
    path: PATHS[state.paths?.best]?.name || null,
    codex: Object.keys(story.codex).length,
    teaser: { title: CHAPTERS[number + 1]?.title || 'What comes next', text: CHAPTERS[number]?.teaser || '' },
  };
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** The Lore codex: unlocked entries by category. */
export function getLoreCodex(state) {
  const unlocked = storyState(state).codex;
  return Object.keys(unlocked)
    .map((id) => ({ ...LORE_BY_ID[id], unlockedDay: unlocked[id] }))
    .filter((entry) => entry.id);
}

/** Reading an arena's history board unlocks its tournaments' lore. */
export function readHistoryBoard(state, loreIds = []) {
  const fresh = loreIds.filter((id) => LORE_BY_ID[id] && !state.story?.codex?.[id]);
  if (!fresh.length) return state;
  const next = clone(state);
  fresh.forEach((id) => unlockCodexInPlace(next, id));
  return finalize(next);
}

export { PROLOGUE };
