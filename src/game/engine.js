import {
  ACHIEVEMENTS,
  APPOINTMENTS,
  CHAPTER_GOALS,
  CLASSES,
  FACILITIES,
  FIRST_NAMES,
  FLAWS,
  HIDDEN_TRAITS,
  LAST_NAMES,
  MISSION_TEMPLATES,
  MONTHS,
  ONBOARDING_STEPS,
  ORIGINS,
  PERSONALITIES,
  REGIONS,
  RIVAL_ARCHETYPES,
  SAGA_DEFINITIONS,
  STARTING_HEROES,
  TIERS,
  DREAMS,
} from '../data/content.js';
import {
  FORMATION_TYPES,
  PARTY_ROLES,
  TOURNAMENT_DIVISIONS,
  emptyFormations,
  formationForMission,
} from '../data/formations.js';

const SCHEMA_VERSION = 6;
const MAX_CHRONICLE = 1400;
const MAX_HERO_HISTORY = 120;
const MAX_HEROES = 480;
const MAX_MISSION_HISTORY = 900;
const MAX_TOURNAMENT_HISTORY = 260;

export function clone(value) {
  return typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

export function hashString(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function makeRng(seed) {
  let state = seed >>> 0 || 1;
  return {
    next() {
      state += 0x6d2b79f5;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    int(min, max) {
      return Math.floor(this.next() * (max - min + 1)) + min;
    },
    pick(list) {
      return list[Math.floor(this.next() * list.length)];
    },
    chance(probability) {
      return this.next() < probability;
    },
    getState() {
      return state >>> 0;
    },
  };
}

function rngFor(state, salt = '') {
  const rng = makeRng((state.rngState ^ hashString(`${salt}:${state.date.year}:${state.date.month}`)) >>> 0);
  return rng;
}

function commitRng(state, rng) {
  state.rngState = rng.getState();
}

function uid(prefix, rng) {
  return `${prefix}-${Math.floor(rng.next() * 1e9).toString(36)}-${Date.now().toString(36).slice(-5)}`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function tierIndexByName(name) {
  return Math.max(0, TIERS.findIndex((tier) => tier.id === name));
}

function dateLabel(state) {
  return `${MONTHS[state.date.month]} ${state.date.year}`;
}

function addChronicle(state, event) {
  const record = {
    id: event.id || `event-${state.date.year}-${state.date.month}-${state.stats.eventSerial++}`,
    year: state.date.year,
    month: state.date.month,
    date: dateLabel(state),
    type: event.type || 'news',
    importance: event.importance ?? 1,
    title: event.title,
    facts: event.facts || {},
    text: event.text || '',
    heroIds: event.heroIds || [],
    guildIds: event.guildIds || [],
    tags: event.tags || [],
    missionRecordId: event.missionRecordId || null,
    tournamentRecordId: event.tournamentRecordId || null,
  };
  state.chronicle.unshift(record);
  if (state.chronicle.length > MAX_CHRONICLE) {
    state.chronicle.length = MAX_CHRONICLE;
  }
  return record;
}

function addHeroHistory(hero, state, entry) {
  hero.history.unshift({
    year: state.date.year,
    month: state.date.month,
    date: dateLabel(state),
    ...entry,
  });
  if (hero.history.length > MAX_HERO_HISTORY) hero.history.length = MAX_HERO_HISTORY;
}

function baseAttributes(power, classId, rng) {
  const attrs = {
    Might: clamp(power + rng.int(-9, 9), 20, 95),
    Finesse: clamp(power + rng.int(-9, 9), 20, 95),
    Mind: clamp(power + rng.int(-9, 9), 20, 95),
    Spirit: clamp(power + rng.int(-9, 9), 20, 95),
    Presence: clamp(power + rng.int(-9, 9), 20, 95),
    Endurance: clamp(power + rng.int(-9, 9), 20, 95),
  };
  const classInfo = CLASSES[classId];
  attrs[classInfo.primary] = clamp(attrs[classInfo.primary] + 8, 20, 99);
  attrs[classInfo.secondary] = clamp(attrs[classInfo.secondary] + 4, 20, 99);
  return attrs;
}

export function calculatePower(attributes) {
  const values = Object.values(attributes);
  const sorted = [...values].sort((a, b) => b - a);
  return Math.round(sorted[0] * 0.25 + sorted[1] * 0.2 + values.reduce((sum, v) => sum + v, 0) / values.length * 0.55);
}

function createHeroFromBase(base, state, rng, options = {}) {
  const attributes = base.attributes || baseAttributes(base.power, base.classId, rng);
  const hero = {
    id: base.id || uid('hero', rng),
    name: base.name,
    classId: base.classId,
    age: base.age,
    power: calculatePower(attributes),
    potential: base.potential,
    attributes,
    personality: base.personality,
    flaw: base.flaw,
    dream: base.dream,
    origin: base.origin,
    hiddenTrait: base.hiddenTrait || rng.pick(HIDDEN_TRAITS),
    hiddenRevealed: false,
    hook: base.hook || `${base.personality} ${base.classId.toLowerCase()} from a ${base.origin.toLowerCase()} background.`,
    loyalty: base.loyalty ?? rng.int(48, 82),
    morale: rng.int(62, 82),
    form: rng.int(58, 76),
    fatigue: 0,
    health: 100,
    status: 'available',
    injury: null,
    injuryMonths: 0,
    salary: Math.max(18, Math.round(base.power * 0.55 + Math.max(0, base.potential - 70) * 0.25)),
    joinedYear: options.joinedYear ?? state.date.year,
    guildId: options.guildId || 'player',
    appointment: null,
    training: 'Fundamentals',
    roleExperience: Object.fromEntries(PARTY_ROLES.map((role) => [role.id, 0])),
    career: {
      missions: 0,
      wins: 0,
      partials: 0,
      defeats: 0,
      legendary: 0,
      tournaments: 0,
      titles: 0,
      injuries: 0,
      rescues: 0,
      kills: 0,
      artifacts: 0,
      fame: 0,
      earnings: 0,
      bestMission: null,
      peakPower: calculatePower(attributes),
      serviceYears: 0,
    },
    renown: options.renown ?? Math.max(0, Math.round(base.power / 10 - 3)),
    legacy: options.legacy ?? 0,
    relationships: [],
    history: [],
  };
  return hero;
}

export function generateHero(state, rng, quality = 'normal', options = {}) {
  const classId = options.classId || rng.pick(Object.keys(CLASSES));
  const age = options.age ?? rng.int(16, quality === 'veteran' ? 36 : 28);
  let powerBase = quality === 'elite' ? rng.int(58, 72) : quality === 'veteran' ? rng.int(55, 68) : rng.int(38, 60);
  if (age < 20) powerBase -= rng.int(2, 7);
  const potentialBoost = quality === 'elite' ? rng.int(12, 24) : rng.int(8, 26);
  const potential = clamp(powerBase + potentialBoost + (age < 21 ? 5 : 0), powerBase + 3, 96);
  const name = options.name || `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`;
  return createHeroFromBase({
    name,
    classId,
    age,
    power: powerBase,
    potential,
    personality: rng.pick(PERSONALITIES),
    flaw: rng.pick(FLAWS),
    dream: rng.pick(DREAMS),
    origin: rng.pick(ORIGINS),
    loyalty: rng.int(45, 78),
  }, state, rng, options);
}

function makeCandidate(state, rng, forcedQuality) {
  const academyLevel = state.guild.facilities['academy'] || 0;
  const scoutLevel = state.guild.facilities['scout-office'] || 0;
  const spymasterBonus = state.guild.appointments?.Spymaster ? 0.08 : 0;
  const qualityRoll = rng.next() + academyLevel * 0.08 + scoutLevel * 0.05 + spymasterBonus;
  const quality = forcedQuality || (qualityRoll > 1.12 ? 'elite' : qualityRoll > 0.92 ? 'veteran' : 'normal');
  const hero = generateHero(state, rng, quality);
  const signingFee = Math.round(hero.power * 6 + Math.max(0, hero.potential - 70) * 8 + (quality === 'elite' ? 180 : 0));
  return {
    ...hero,
    status: 'candidate',
    channel: academyLevel > 0 && hero.age <= 20 && rng.chance(0.35) ? 'Academy' : scoutLevel > 0 && rng.chance(0.35) ? 'Scout network' : rng.pick(['Tavern board', 'Mercenary market', 'Defector rumor']),
    signingFee,
    expiresYear: state.date.year + 1,
    interest: clamp(55 + state.guild.tierIndex * 8 + Math.round(state.guild.fame / 100) - Math.round(signingFee / 100), 20, 96),
  };
}

function createRival(archetype, state, rng, index) {
  const star = generateHero(state, rng, index < 2 ? 'elite' : 'veteran', { guildId: `rival-${index}` });
  star.renown += rng.int(5, 15);
  star.legacy += rng.int(8, 25);
  return {
    id: `rival-${index}`,
    ...archetype,
    founded: state.date.year - rng.int(3, 70),
    fame: rng.int(18, 115),
    legacy: rng.int(10, 180),
    crowns: rng.int(700, 3200),
    tierIndex: rng.chance(0.25) ? 1 : 0,
    form: rng.int(45, 78),
    power: rng.int(50, 69),
    wins: rng.int(2, 18),
    losses: rng.int(1, 12),
    titles: rng.int(0, 3),
    hostility: rng.int(5, 45),
    relationship: 0,
    star,
    recent: [],
    fallen: false,
  };
}

function facilityLevels() {
  return Object.fromEntries(FACILITIES.map((facility) => [facility.id, facility.id === 'great-hall' ? 1 : facility.id === 'training-yard' || facility.id === 'infirmary' || facility.id === 'archive' ? 1 : 0]));
}

function initialStats() {
  return {
    eventSerial: 1,
    missionsCompleted: 0,
    missionsWon: 0,
    missionsLost: 0,
    combatWins: 0,
    tournamentBest: 99,
    tournamentsWon: 0,
    localTournamentWins: 0,
    professionalTournamentWins: 0,
    eliteTournamentWins: 0,
    perfectHardMission: 0,
    upsets: 0,
    inheritedWill: 0,
    rivalries: 0,
    mythicFeats: 0,
    signatureFeats: 0,
    alignmentChosen: 0,
    births: 0,
    deaths: 0,
    retirements: 0,
    highestPower: 0,
    yearsPlayed: 0,
    bankruptMonths: 0,
  };
}

export function createNewGame(options = {}) {
  const seed = options.seed ?? hashString(`${options.guildName || 'Broken Lantern'}-${Date.now()}`);
  const rng = makeRng(seed);
  const founderName = (options.founderName || options.founder || 'Rowan Vale').replace(/^Guildmaster\s+/i, '').trim() || 'Rowan Vale';
  const founderClass = CLASSES[options.founderClass] ? options.founderClass : 'Guardian';
  const state = {
    schemaVersion: SCHEMA_VERSION,
    id: options.id || `campaign-${seed.toString(36)}`,
    seed,
    rngState: seed,
    createdAt: new Date().toISOString(),
    lastPlayedAt: new Date().toISOString(),
    date: { year: 1187, month: 0 },
    guild: {
      id: 'player',
      name: options.guildName || 'The Broken Lantern',
      motto: options.motto || 'No light is lost forever.',
      crest: options.crest || 'lantern',
      founder: founderName,
      founderHeroId: 'founder-player',
      tierIndex: 0,
      tier: 'Local',
      fame: 4,
      legacy: 2,
      crowns: 650,
      alignment: 'Undeclared',
      rank: 18,
      contractsCompleted: 0,
      wins: 0,
      losses: 0,
      deaths: 0,
      fallen: false,
      charter: false,
      facilities: facilityLevels(),
      appointments: {},
      formations: emptyFormations(),
      policies: { retreat: 'Measured', treasure: 'Guild Share', publicity: 'Truthful' },
      obligations: [],
      rivalries: [],
    },
    heroes: [],
    historicHeroes: [],
    candidates: [],
    rivals: [],
    missions: [],
    activeMissions: [],
    pendingDecisions: [],
    missionHistory: [],
    tournamentHistory: [],
    pendingReports: [],
    chronicle: [],
    artifacts: [],
    sagas: SAGA_DEFINITIONS.map((saga) => ({ ...saga, progress: 0, completed: false, discovered: saga.tier === 'Local' })),
    tournaments: [],
    tutorial: { step: 0, completed: false, acknowledged: false },
    goals: CHAPTER_GOALS.map((goal) => ({ ...goal, completed: false, claimed: false })),
    achievements: ACHIEVEMENTS.map((achievement) => ({ ...achievement, unlocked: false, unlockedDate: null })),
    stats: initialStats(),
    notifications: [],
    settings: { autosave: true, reducedMotion: false, compactMode: false, difficulty: 'Standard' },
    flags: { firstMissionInspected: false, firstHeroInspected: false, goalsInspected: false, politicalChoiceOffered: false, firstCompanionHired: false },
  };

  const founder = createHeroFromBase({
    id: 'founder-player',
    name: founderName,
    classId: founderClass,
    age: 27,
    power: 52,
    potential: 82,
    personality: 'Determined',
    flaw: 'Pride',
    dream: 'Build a guild that outlives me',
    origin: 'Founder of the Broken Lantern',
    loyalty: 100,
    hook: `You raised the banner yourself. Every triumph and failure will become part of ${founderName}’s own career.`,
    hiddenTrait: 'None',
  }, state, rng);
  founder.salary = 0;
  founder.renown = 2;
  founder.legacy = 1;
  state.heroes = [founder];
  addHeroHistory(founder, state, { type: 'founding', title: `Founded ${state.guild.name}`, text: 'Signed the Dunmere charter with no company yet standing behind the banner.' });

  const openingPool = [...STARTING_HEROES];
  while (state.candidates.length < 3 && openingPool.length) {
    const index = rng.int(0, openingPool.length - 1);
    const base = openingPool.splice(index, 1)[0];
    const candidate = createHeroFromBase(base, state, rng);
    candidate.status = 'candidate';
    candidate.channel = 'Founding appeal';
    candidate.signingFee = 0;
    candidate.expiresYear = state.date.year + 1;
    candidate.interest = 100;
    candidate.hook = `${candidate.hook} Will join the founding pair without a signing fee.`;
    state.candidates.push(candidate);
  }

  state.rivals = RIVAL_ARCHETYPES.map((archetype, index) => createRival(archetype, state, rng, index));
  refreshMissionsInPlace(state, rng, true);
  createTournamentsInPlace(state, rng);
  commitRng(state, rng);

  addChronicle(state, {
    type: 'founding', importance: 5, title: `${founderName} raises the banner of ${state.guild.name}`,
    text: 'The previous guild vanished in the Blackwood. One founder now stands in a rented hall, searching for the first companion willing to rebuild it.',
    heroIds: [founder.id], tags: ['founding', 'broken-lantern'],
  });
  state.notifications.push({ id: 'welcome', tone: 'gold', title: 'A banner, not yet a company', text: 'Your first order is to hire the person who will stand beside you.' });
  evaluateStateInPlace(state);
  return state;
}

function availableTemplatePool(state) {
  const currentTier = state.guild.tierIndex;
  return MISSION_TEMPLATES.filter((template) => {
    const templateTier = tierIndexByName(template.tier);
    const region = REGIONS.find((r) => r.id === template.region);
    const regionTier = tierIndexByName(region?.unlock || 'Local');
    return templateTier <= currentTier + 1 && regionTier <= currentTier;
  });
}

function instantiateMission(template, state, rng) {
  const rewardVariance = rng.int(template.reward[0], template.reward[1]);
  const fameVariance = rng.int(template.fame[0], template.fame[1]);
  const issuer = rng.pick(['Dunmere Council', 'Temple of Saint Orra', 'Border Baron', 'Merchant League', 'Anonymous petitioner', 'Village moot', 'Royal bailiff']);
  return {
    id: uid('mission', rng),
    templateId: template.id,
    title: template.title,
    family: template.family,
    tier: template.tier,
    region: template.region,
    risk: template.risk,
    duration: template.duration,
    difficulty: clamp(template.difficulty + rng.int(-4, 5), 30, 99),
    reward: rewardVariance,
    fame: fameVariance,
    roles: [...template.roles],
    approach: template.approach || formationForMission(template),
    brief: template.brief,
    stakes: template.stakes,
    choice: clone(template.choice),
    saga: template.saga || null,
    artifact: template.artifact || null,
    tournament: Boolean(template.tournament),
    issuer,
    availableUntil: { year: state.date.year, month: Math.min(11, state.date.month + rng.int(2, 4)) },
    inspected: false,
  };
}

function refreshMissionsInPlace(state, rng, initial = false) {
  state.missions = state.missions.filter((mission) => {
    if (mission.templateId === 'wolves-old-road' && !state.tutorial.completed && state.tutorial.step < 4) return true;
    return mission.availableUntil.year > state.date.year || (mission.availableUntil.year === state.date.year && mission.availableUntil.month >= state.date.month);
  });
  const pool = availableTemplatePool(state);
  const targetCount = 5 + Math.min(3, state.guild.tierIndex) + (appointmentHolder(state, 'Questmaster') ? 1 : 0);
  if (initial && !state.missions.some((m) => m.templateId === 'wolves-old-road')) {
    const tutorialTemplate = MISSION_TEMPLATES.find((m) => m.id === 'wolves-old-road');
    state.missions.push(instantiateMission(tutorialTemplate, state, rng));
  }
  let safety = 0;
  while (state.missions.length < targetCount && safety < 30) {
    safety += 1;
    const template = rng.pick(pool);
    const duplicateCount = state.missions.filter((m) => m.templateId === template.id).length;
    if (duplicateCount >= 2) continue;
    state.missions.push(instantiateMission(template, state, rng));
  }
}

export function getHero(state, heroId) {
  return state.heroes.find((hero) => hero.id === heroId) || state.historicHeroes.find((hero) => hero.id === heroId) || null;
}

export function heroCapacity(state) {
  return 6 + (state.guild.facilities['great-hall'] || 0) * 2 + state.guild.tierIndex * 2;
}

export function headquartersRoomCapacity(state) {
  // The rented Local hall begins with four usable rooms. Social promotion and
  // investment in the Great Hall expand the physical footprint gradually.
  const tierRooms = [4, 6, 8, 10, 12][state.guild.tierIndex] || 12;
  const hallExpansion = Math.max(0, (state.guild.facilities['great-hall'] || 0) - 1);
  return tierRooms + hallExpansion;
}

export function usedFacilityRooms(state) {
  return Object.entries(state.guild.facilities || {}).filter(([, level]) => Number(level) > 0).length;
}

export function activeHeroCount(state) {
  return state.heroes.filter((hero) => !['retired', 'dead'].includes(hero.status)).length;
}

export function partyCapacity(state) {
  const greatHallBonus = (state.guild.facilities['great-hall'] || 0) >= 3 ? 1 : 0;
  return 1 + Math.min(2, state.guild.tierIndex) + greatHallBonus;
}

function appointmentHolder(state, appointmentId) {
  const heroId = state.guild.appointments?.[appointmentId];
  const hero = heroId ? getHero(state, heroId) : null;
  return hero && !['dead', 'retired'].includes(hero.status) ? hero : null;
}

function clearHeroAppointmentInPlace(state, hero) {
  Object.entries(state.guild.appointments || {}).forEach(([appointmentId, heroId]) => {
    if (heroId === hero.id) delete state.guild.appointments[appointmentId];
  });
  hero.appointment = null;
}

export function roleRating(hero, roleId) {
  const role = PARTY_ROLES.find((item) => item.id === roleId);
  if (!role || !hero) return hero?.power || 0;
  const primary = hero.attributes?.[role.key] ?? hero.power;
  const secondary = hero.attributes?.[role.secondaryKey] ?? hero.power;
  const affinity = role.affinities?.includes(hero.classId) ? 10 : -9;
  const experience = Math.min(9, (hero.roleExperience?.[roleId] || 0) * 0.4);
  const healthPenalty = hero.health < 80 ? (80 - hero.health) * 0.18 : 0;
  return Math.round(
    hero.power * 0.3 +
    primary * 0.36 +
    secondary * 0.18 +
    hero.form * 0.08 +
    hero.morale * 0.05 +
    affinity + experience -
    hero.fatigue * 0.2 -
    healthPenalty,
  );
}

function normalizedFormationType(mission, formationType) {
  return FORMATION_TYPES[formationType] ? formationType : formationForMission(mission);
}

function formationSlotFor(formationType, assignment) {
  const formation = FORMATION_TYPES[formationType];
  return formation?.slots.find((slot) => slot.id === assignment.slotId) || formation?.slots.find((slot) => slot.role === assignment.role) || null;
}

function formationCompatibility(mission, formationType) {
  const recommended = formationForMission(mission);
  if (formationType === recommended) return 8;
  const flexible = {
    Investigation: { Intrigue: -2, Diplomacy: -5 },
    Political: { Intrigue: -4, Expedition: -7 },
    Infiltration: { Expedition: -6, Diplomacy: -8 },
    Exploration: { Combat: -6 },
    Rescue: { Expedition: -5 },
    'Legend Quest': { Combat: -5, Diplomacy: -7 },
  };
  return flexible[mission.family]?.[formationType] ?? -12;
}

export function partyEstimate(state, missionId, formationTypeOrAssignments, maybeAssignments) {
  const mission = state.missions.find((item) => item.id === missionId) || state.activeMissions.find((item) => item.id === missionId);
  const legacyCall = Array.isArray(formationTypeOrAssignments);
  const formationType = normalizedFormationType(mission, legacyCall ? mission?.formationType || mission?.approach : formationTypeOrAssignments);
  const assignments = legacyCall ? formationTypeOrAssignments : (maybeAssignments || []);
  const formation = FORMATION_TYPES[formationType];
  if (!mission || !formation || !assignments.length) {
    return { chance: 0, power: 0, formationType, recommended: formationForMission(mission), missingRoles: [], missingSlots: formation?.slots.filter((slot) => slot.required).map((slot) => slot.label) || [], warnings: ['Fill the required formation slots.'], breakdown: [] };
  }

  const breakdown = [];
  const usedHeroes = new Set();
  let total = 0;
  let validCount = 0;
  assignments.forEach((assignment) => {
    const hero = getHero(state, assignment.heroId);
    const slot = formationSlotFor(formationType, assignment);
    if (!hero || !slot || usedHeroes.has(hero.id)) return;
    usedHeroes.add(hero.id);
    let rating = roleRating(hero, slot.role);
    if (slot.role === 'Commander' && state.guild.appointments?.['Guild Captain'] === hero.id) rating += 5;
    if (['Training Master', 'Questmaster', 'Quartermaster', 'Master Healer', 'Spymaster', 'Chronicler'].includes(hero.appointment)) rating -= 4;
    total += rating;
    validCount += 1;
    breakdown.push({ heroId: hero.id, heroName: hero.name, role: slot.role, slotId: slot.id, slotLabel: slot.label, rating, classId: hero.classId });
  });

  const filledSlotIds = new Set(breakdown.map((item) => item.slotId));
  const missingSlots = formation.slots.filter((slot) => slot.required && !filledSlotIds.has(slot.id));
  let partyPower = validCount ? total / validCount : 0;
  partyPower += formationCompatibility(mission, formationType);
  partyPower += Math.max(0, validCount - 2) * 2.4;
  partyPower -= missingSlots.length * 18;
  partyPower += (state.guild.facilities.armory || 0) * (formationType === 'Combat' ? 3 : 1.3);
  if (appointmentHolder(state, 'Questmaster')) partyPower += 2;
  if (formationType === 'Expedition') partyPower += (state.guild.facilities['scout-office'] || 0) * 2;
  if (formationType === 'Intrigue' && appointmentHolder(state, 'Spymaster')) partyPower += 5;
  if (formationType === 'Diplomacy' && state.guild.alignment !== 'Undeclared') partyPower += 2;
  if (formationType === 'Expedition' && breakdown.some((item) => item.role === 'Curator')) partyPower += mission.artifact ? 7 : 2;
  if (formationType === 'Combat' && !breakdown.some((item) => item.role === 'Combat Support') && mission.risk >= 3) partyPower -= 5;

  const difficultyModifier = state.settings.difficulty === 'Story' ? -6 : state.settings.difficulty === 'Harsh' ? 6 : 0;
  const delta = partyPower - (mission.difficulty + difficultyModifier);
  const chance = clamp(Math.round(100 / (1 + Math.exp(-delta / 10))), 3, 97);
  const warnings = [];
  if (validCount < 2) warnings.push('Every field arrangement needs at least two people.');
  if (validCount > 5) warnings.push('No arrangement can exceed five people.');
  if (missingSlots.length) warnings.push(`Required slots empty: ${missingSlots.map((slot) => slot.label).join(', ')}.`);
  if (formationType !== formationForMission(mission)) warnings.push(`${formation.label} is an unconventional approach for a ${mission.family.toLowerCase()} mission.`);
  const tired = breakdown.map((item) => getHero(state, item.heroId)).filter((hero) => hero?.fatigue >= 60);
  if (tired.length) warnings.push(`${tired.map((hero) => hero.name).join(', ')} will enter heavily fatigued.`);
  const severeMisfits = breakdown.filter((item) => roleRating(getHero(state, item.heroId), item.role) < getHero(state, item.heroId).power - 5);
  if (severeMisfits.length) warnings.push(`${severeMisfits.map((item) => `${item.heroName} as ${item.role}`).join(', ')} is a poor class-role fit.`);
  return {
    chance,
    power: Math.round(partyPower),
    formationType,
    recommended: formationForMission(mission),
    missingRoles: missingSlots.map((slot) => slot.role),
    missingSlots: missingSlots.map((slot) => slot.label),
    warnings,
    breakdown,
  };
}

function completeTutorialTargetInPlace(state, target) {
  if (state.tutorial.completed) return;
  const step = ONBOARDING_STEPS[state.tutorial.step];
  if (!step || step.target !== target) return;
  state.guild.crowns += step.reward;
  state.notifications.push({ id: `tutorial-${step.id}`, tone: 'gold', title: `Order completed: ${step.title}`, text: `The guild receives ${step.reward} crowns.` });
  state.tutorial.step += 1;
  if (state.tutorial.step >= ONBOARDING_STEPS.length) {
    state.tutorial.completed = true;
    addChronicle(state, { type: 'milestone', importance: 3, title: 'The Broken Lantern stands on its own', text: 'The guildmaster no longer needs the council’s step-by-step orders. The first year is now theirs to shape.', tags: ['tutorial'] });
  }
}

export function acknowledgeWelcome(state) {
  const next = clone(state);
  next.tutorial.acknowledged = true;
  completeTutorialTargetInPlace(next, 'acknowledgeWelcome');
  return finalize(next);
}

export function inspectMission(state, missionId) {
  const next = clone(state);
  const mission = next.missions.find((item) => item.id === missionId);
  if (mission) {
    mission.inspected = true;
    next.flags.firstMissionInspected = true;
    if (mission.templateId === 'wolves-old-road') completeTutorialTargetInPlace(next, 'inspectMission');
  }
  return finalize(next);
}

export function notePartySelection(state, missionId, formationTypeOrAssignments, maybeAssignments) {
  const next = clone(state);
  const mission = next.missions.find((item) => item.id === missionId);
  const legacyCall = Array.isArray(formationTypeOrAssignments);
  const formationType = normalizedFormationType(mission, legacyCall ? mission?.formationType || mission?.approach : formationTypeOrAssignments);
  const assignments = legacyCall ? formationTypeOrAssignments : (maybeAssignments || []);
  const estimate = partyEstimate(next, missionId, formationType, assignments);
  if (mission?.templateId === 'wolves-old-road' && assignments.length >= 2 && estimate.missingSlots.length === 0) {
    completeTutorialTargetInPlace(next, 'selectParty');
  }
  return finalize(next);
}

export function saveFormation(state, formationType, assignments) {
  const next = clone(state);
  if (!FORMATION_TYPES[formationType]) return { state, error: 'Unknown arrangement type.' };
  const availableIds = new Set(next.heroes.filter((hero) => !['dead', 'retired'].includes(hero.status)).map((hero) => hero.id));
  next.guild.formations ||= emptyFormations();
  next.guild.formations[formationType] = clone(assignments.filter((assignment) => availableIds.has(assignment.heroId)).map((assignment) => ({
    slotId: assignment.slotId,
    role: formationSlotFor(formationType, assignment)?.role || assignment.role,
    heroId: assignment.heroId,
  })));
  next.notifications.push({ id: `formation-${formationType}-${Date.now()}`, tone: 'blue', title: `${FORMATION_TYPES[formationType].label} saved`, text: 'The arrangement can be loaded for future missions and tournaments.' });
  return { state: finalize(next), error: null };
}

export function launchMission(state, missionId, formationTypeOrAssignments, maybeAssignments) {
  const next = clone(state);
  const missionIndex = next.missions.findIndex((item) => item.id === missionId);
  if (missionIndex < 0) return { state, error: 'This contract is no longer available.' };
  const mission = next.missions[missionIndex];
  const legacyCall = Array.isArray(formationTypeOrAssignments);
  const selectedFormation = normalizedFormationType(mission, legacyCall ? mission?.formationType || mission?.approach : formationTypeOrAssignments);
  const assignments = legacyCall ? formationTypeOrAssignments : (maybeAssignments || []);
  if (next.activeMissions.length >= partyCapacity(next)) {
    return { state, error: `Every field company is already deployed (${partyCapacity(next)} maximum at ${next.guild.tier} tier).` };
  }
  const uniqueHeroIds = new Set(assignments.map((assignment) => assignment.heroId));
  if (assignments.length < 2 || assignments.length > 5 || uniqueHeroIds.size !== assignments.length) {
    return { state, error: 'Choose between two and five different heroes.' };
  }
  const estimate = partyEstimate(next, missionId, selectedFormation, assignments);
  if (estimate.missingSlots.length) return { state, error: `Fill the required ${estimate.missingSlots.join(' and ')} slot${estimate.missingSlots.length === 1 ? '' : 's'}.` };
  const unavailable = assignments.map((assignment) => getHero(next, assignment.heroId)).filter((hero) => !hero || hero.status !== 'available');
  if (unavailable.length) return { state, error: 'Every assigned hero must be available.' };
  const baseSupplyCost = 25 + mission.risk * 18 + mission.duration * 12 + (selectedFormation === 'Expedition' ? 12 : 0);
  const supplyCost = Math.max(20, Math.round(baseSupplyCost * (appointmentHolder(next, 'Quartermaster') ? 0.88 : 1)));
  if (next.guild.crowns < supplyCost) return { state, error: `The guild needs ${supplyCost} crowns for supplies.` };

  next.guild.crowns -= supplyCost;
  const normalizedAssignments = assignments.map((assignment) => {
    const slot = formationSlotFor(selectedFormation, assignment);
    return { heroId: assignment.heroId, slotId: slot.id, role: slot.role };
  });
  const active = {
    ...mission,
    formationType: selectedFormation,
    assignments: clone(normalizedAssignments),
    remaining: mission.duration,
    startedYear: next.date.year,
    startedMonth: next.date.month,
    estimateAtLaunch: estimate.chance,
    powerAtLaunch: estimate.power,
    supplyCost,
  };
  normalizedAssignments.forEach((assignment) => {
    const hero = getHero(next, assignment.heroId);
    hero.status = 'mission';
    hero.fatigue = clamp(hero.fatigue + 10 + mission.risk * 4, 0, 100);
    hero.roleExperience[assignment.role] = (hero.roleExperience[assignment.role] || 0) + 1;
    addHeroHistory(hero, next, { type: 'mission-start', title: `Departed for ${mission.title}`, text: `Assigned as ${assignment.role} in a ${selectedFormation} arrangement.` });
  });
  next.activeMissions.push(active);
  next.missions.splice(missionIndex, 1);
  addChronicle(next, {
    type: 'departure', importance: mission.risk >= 3 ? 2 : 1, title: `${mission.title} begins`,
    text: `${normalizedAssignments.map((assignment) => `${getHero(next, assignment.heroId)?.name} (${assignment.role})`).join(', ')} depart as a ${FORMATION_TYPES[selectedFormation].label}.`,
    heroIds: normalizedAssignments.map((assignment) => assignment.heroId), tags: [mission.family, selectedFormation],
  });
  if (mission.templateId === 'wolves-old-road') completeTutorialTargetInPlace(next, 'launchMission');
  evaluateStateInPlace(next);
  return { state: finalize(next), error: null };
}

function missionDecision(activeMission) {
  return {
    id: `decision-${activeMission.id}`,
    type: 'mission',
    missionId: activeMission.id,
    title: activeMission.title,
    prompt: activeMission.choice.prompt,
    options: activeMission.choice.options,
    createdAt: Date.now(),
  };
}

function monthlyUpkeep(state) {
  const wages = state.heroes.filter((hero) => !['retired', 'dead', 'candidate'].includes(hero.status)).reduce((sum, hero) => sum + hero.salary, 0);
  const facilityUpkeep = Object.values(state.guild.facilities).reduce((sum, level) => sum + level * 8, 0);
  const appointmentUpkeep = Object.keys(state.guild.appointments).length * 7;
  return wages + facilityUpkeep + appointmentUpkeep;
}

function trainAndRecoverHeroes(state, rng) {
  const trainingLevel = state.guild.facilities['training-yard'] || 0;
  const trainingMasterBonus = appointmentHolder(state, 'Training Master') ? 0.025 : 0;
  const infirmaryLevel = (state.guild.facilities.infirmary || 0) + (appointmentHolder(state, 'Master Healer') ? 1 : 0);
  state.heroes.forEach((hero) => {
    if (['dead', 'retired'].includes(hero.status)) return;
    if (hero.status === 'injured') {
      hero.injuryMonths -= 1 + (infirmaryLevel >= 3 && rng.chance(0.25) ? 1 : 0);
      hero.health = clamp(hero.health + 5 + infirmaryLevel * 3, 0, 100);
      hero.fatigue = clamp(hero.fatigue - 12, 0, 100);
      if (hero.injuryMonths <= 0) {
        hero.status = 'available';
        hero.injury = null;
        hero.health = Math.max(hero.health, 72);
        state.notifications.push({ id: `recover-${hero.id}-${state.date.year}-${state.date.month}`, tone: 'green', title: `${hero.name} returns`, text: 'Recovery is complete and the hero is available again.' });
        addHeroHistory(hero, state, { type: 'recovery', title: 'Returned from injury', text: 'Cleared by the guild infirmary.' });
      }
      return;
    }
    if (hero.status === 'mission') return;
    hero.fatigue = clamp(hero.fatigue - (11 + infirmaryLevel * 2), 0, 100);
    hero.health = clamp(hero.health + 2 + infirmaryLevel, 0, 100);
    hero.form = clamp(hero.form + rng.int(-2, 2), 35, 92);
    const ageFactor = hero.age <= 24 ? 1.35 : hero.age <= 31 ? 1 : hero.age <= 36 ? 0.55 : 0.2;
    const potentialGap = Math.max(0, hero.potential - hero.power);
    if (potentialGap > 0 && rng.chance(clamp(0.08 + trainingLevel * 0.025 + trainingMasterBonus + potentialGap * 0.002, 0.05, 0.38) * ageFactor)) {
      const classInfo = CLASSES[hero.classId];
      const keys = hero.training === 'Fundamentals'
        ? Object.keys(hero.attributes)
        : hero.training === 'Role Drills'
          ? [classInfo.primary, classInfo.secondary]
          : hero.training === 'Study'
            ? ['Mind', 'Spirit']
            : hero.training === 'Public Exhibition'
              ? ['Presence']
              : [classInfo.primary];
      const key = rng.pick(keys);
      hero.attributes[key] = clamp(hero.attributes[key] + 1, 20, 99);
      hero.power = calculatePower(hero.attributes);
      hero.career.peakPower = Math.max(hero.career.peakPower, hero.power);
      state.stats.highestPower = Math.max(state.stats.highestPower, hero.power);
    }
  });
}

function simulateRivals(state, rng) {
  state.rivals.forEach((rival) => {
    const activityChance = 0.52 + rival.risk * 0.28;
    if (rng.chance(activityChance)) {
      const difficulty = 48 + rival.tierIndex * 10 + rng.int(-8, 12);
      const effective = rival.power + rival.form * 0.12 + (rival.strategy === 'spend' ? 4 : 0) + rng.int(-9, 9);
      const winChance = clamp(1 / (1 + Math.exp(-(effective - difficulty) / 10)), 0.12, 0.9);
      const won = rng.chance(winChance);
      if (won) {
        const fameGain = rng.int(3, 9) + rival.tierIndex * 2;
        rival.fame += fameGain;
        rival.legacy += Math.max(1, Math.round(fameGain * 0.4));
        rival.crowns += rng.int(90, 300) * (rival.tierIndex + 1);
        rival.wins += 1;
        rival.form = clamp(rival.form + rng.int(1, 4), 35, 90);
        rival.star.renown += rng.int(1, 3);
        rival.star.career.wins += 1;
        rival.star.career.missions += 1;
        if (rng.chance(0.035 + rival.risk * 0.03)) {
          rival.titles += 1;
          rival.star.career.titles += 1;
          rival.star.legacy += 12;
          addChronicle(state, { type: 'rival', importance: 3, title: `${rival.name} claims a major victory`, text: `${rival.star.name} leads the ${rival.archetype.toLowerCase()} to another title.`, guildIds: [rival.id], tags: ['rival', 'title'] });
        }
      } else {
        rival.losses += 1;
        rival.form = clamp(rival.form - rng.int(1, 5), 25, 90);
        rival.crowns -= rng.int(35, 140);
        rival.star.career.defeats += 1;
        rival.star.career.missions += 1;
        if (rng.chance(0.025 * rival.risk)) {
          addChronicle(state, { type: 'rival', importance: 2, title: `${rival.name} returns bloodied`, text: `${rival.star.name} survives a disastrous contract that weakens the guild’s standing.`, guildIds: [rival.id], tags: ['rival', 'defeat'] });
        }
      }
    }
    rival.crowns -= 25 + rival.tierIndex * 15;
    if (rival.crowns < -500) rival.fallen = true;
    if (rival.fallen && rival.crowns > 300) rival.fallen = false;
    if (rival.fame >= TIERS[Math.min(TIERS.length - 1, rival.tierIndex + 1)].fame && rng.chance(0.04)) {
      rival.tierIndex = Math.min(TIERS.length - 2, rival.tierIndex + 1);
      addChronicle(state, { type: 'rival', importance: 3, title: `${rival.name} rises to ${TIERS[rival.tierIndex].id} status`, text: `The guild’s reach now extends across ${TIERS[rival.tierIndex].scope.toLowerCase()}.`, guildIds: [rival.id], tags: ['rival', 'promotion'] });
    }
  });
}

function ageHeroes(state, rng) {
  state.heroes.forEach((hero) => {
    if (['dead', 'retired'].includes(hero.status)) return;
    hero.age += 1;
    hero.career.serviceYears = Math.max(0, state.date.year - hero.joinedYear);
    if (hero.age >= 35) {
      const declineChance = clamp(0.08 + (hero.age - 35) * 0.025, 0.08, 0.6);
      if (rng.chance(declineChance)) {
        const physical = rng.pick(['Might', 'Finesse', 'Endurance']);
        hero.attributes[physical] = clamp(hero.attributes[physical] - rng.int(1, 2), 20, 99);
        hero.power = calculatePower(hero.attributes);
      }
    }
    if (!['available', 'injured'].includes(hero.status)) return;
    const retirementChance = hero.age < 36 ? 0 : clamp(0.03 + (hero.age - 36) * 0.035 + hero.career.injuries * 0.01 - hero.loyalty * 0.0008, 0.01, 0.65);
    if (rng.chance(retirementChance)) retireHeroInPlace(state, hero, rng, 'voluntary');
  });

  state.rivals.forEach((rival) => {
    rival.star.age += 1;
    if (rival.star.age > 38 && rng.chance(0.12 + (rival.star.age - 38) * 0.05)) {
      const oldStar = rival.star;
      oldStar.status = 'retired';
      rival.legacy += oldStar.legacy;
      rival.star = generateHero(state, rng, rng.chance(0.35) ? 'elite' : 'veteran', { guildId: rival.id });
      addChronicle(state, { type: 'rival', importance: 2, title: `${oldStar.name} leaves ${rival.name}`, text: `The ${oldStar.classId.toLowerCase()} retires with ${oldStar.career.titles} titles. ${rival.star.name} becomes the guild’s new public face.`, guildIds: [rival.id], tags: ['rival', 'retirement'] });
    }
  });
}

function retireHeroInPlace(state, hero, rng, reason) {
  if (['dead', 'retired'].includes(hero.status)) return;
  hero.status = 'retired';
  clearHeroAppointmentInPlace(state, hero);
  hero.retiredYear = state.date.year;
  hero.retirementReason = reason;
  hero.legacy += Math.round(hero.renown * 0.7 + hero.career.titles * 15 + hero.career.legendary * 10 + hero.career.missions * 0.8);
  state.stats.retirements += 1;
  state.guild.legacy += Math.max(2, Math.round(hero.legacy * 0.1));
  addHeroHistory(hero, state, { type: 'retirement', title: 'Retired from active service', text: `${hero.name} leaves the field after ${hero.career.serviceYears} years beneath the banner.` });
  addChronicle(state, { type: 'retirement', importance: hero.legacy >= 80 ? 4 : 2, title: `${hero.name} retires`, text: `${hero.name} ends a career of ${hero.career.missions} missions, ${hero.career.titles} titles and ${hero.legacy} legacy.`, heroIds: [hero.id], tags: ['retirement'] });
  if (hero.dream && hero.career.legendary === 0 && rng.chance(0.45)) {
    state.flags.inheritedDream = { fromHeroId: hero.id, fromHeroName: hero.name, dream: hero.dream, completed: false };
  }
}

function annualCycle(state, rng) {
  state.stats.yearsPlayed += 1;
  ageHeroes(state, rng);
  state.candidates = state.candidates.filter((candidate) => candidate.expiresYear >= state.date.year);
  const intake = 3 + Math.min(3, state.guild.facilities.academy || 0);
  for (let i = 0; i < intake; i += 1) state.candidates.push(makeCandidate(state, rng));
  state.candidates.sort((a, b) => b.potential - a.potential);
  state.candidates = state.candidates.slice(0, 10);
  createTournamentsInPlace(state, rng);
  archiveOldHeroesInPlace(state);
  addChronicle(state, { type: 'year', importance: 1, title: `Year ${state.date.year} begins`, text: `${state.guild.name} enters the year ranked ${state.guild.rank}, with ${state.guild.fame} fame and ${activeHeroCount(state)} active heroes.`, tags: ['year'] });
}

function archiveOldHeroesInPlace(state) {
  if (state.heroes.length <= MAX_HEROES) return;
  const archival = state.heroes
    .filter((hero) => ['retired', 'dead'].includes(hero.status) && (state.date.year - (hero.retiredYear || hero.deathYear || state.date.year)) > 8)
    .sort((a, b) => b.legacy - a.legacy);
  while (state.heroes.length > MAX_HEROES && archival.length) {
    const hero = archival.pop();
    state.historicHeroes.push(compactHero(hero));
    state.heroes = state.heroes.filter((item) => item.id !== hero.id);
  }
  if (state.historicHeroes.length > 800) {
    state.historicHeroes.sort((a, b) => b.legacy - a.legacy);
    state.historicHeroes.length = 800;
  }
}

function compactHero(hero) {
  return {
    id: hero.id,
    name: hero.name,
    classId: hero.classId,
    age: hero.age,
    status: hero.status,
    power: hero.power,
    potential: hero.potential,
    renown: hero.renown,
    legacy: hero.legacy,
    dream: hero.dream,
    flaw: hero.flaw,
    origin: hero.origin,
    joinedYear: hero.joinedYear,
    retiredYear: hero.retiredYear,
    deathYear: hero.deathYear,
    career: hero.career,
    history: hero.history.slice(0, 30),
  };
}

export function advanceMonths(state, count = 1) {
  if (state.pendingDecisions.length) return { state, error: 'Resolve the critical decision before advancing time.' };
  let next = clone(state);
  for (let step = 0; step < count; step += 1) {
    if (next.pendingDecisions.length) break;
    const rng = rngFor(next, `advance-${step}`);
    const upkeep = monthlyUpkeep(next);
    next.guild.crowns -= upkeep;
    if (next.guild.crowns < 0) {
      next.stats.bankruptMonths += 1;
      next.guild.fallen = next.guild.crowns < -900 || next.stats.bankruptMonths >= 6;
    } else {
      next.stats.bankruptMonths = Math.max(0, next.stats.bankruptMonths - 1);
      if (next.guild.fallen && next.guild.crowns > 300) next.guild.fallen = false;
    }
    trainAndRecoverHeroes(next, rng);
    simulateRivals(next, rng);

    next.activeMissions.forEach((mission) => {
      mission.remaining -= 1;
      if (mission.remaining <= 0 && !next.pendingDecisions.some((decision) => decision.missionId === mission.id)) {
        next.pendingDecisions.push(missionDecision(mission));
      }
    });

    next.date.month += 1;
    if (next.date.month >= 12) {
      next.date.month = 0;
      next.date.year += 1;
      annualCycle(next, rng);
    }
    refreshMissionsInPlace(next, rng);
    if (!next.tournaments?.length || next.tournaments[0].year < next.date.year) createTournamentsInPlace(next, rng);
    commitRng(next, rng);
    if (!next.tutorial.completed && ONBOARDING_STEPS[next.tutorial.step]?.target === 'advanceMonth') completeTutorialTargetInPlace(next, 'advanceMonth');
    evaluateStateInPlace(next);
  }
  return { state: finalize(next), error: null };
}

export function advanceToNextEvent(state) {
  if (state.pendingDecisions.length) return { state, error: 'Resolve the critical decision before advancing time.' };
  if (!state.activeMissions.length) return advanceMonths(state, 1);
  const months = Math.max(1, Math.min(...state.activeMissions.map((mission) => mission.remaining)));
  return advanceMonths(state, months);
}

function gradeFromMargin(margin, roll, chance) {
  if (roll < 0.04 && chance >= 25) return 'Legendary';
  if (margin >= 35) return 'Legendary';
  if (margin >= 18) return 'Great Success';
  if (margin >= 0) return 'Success';
  if (margin >= -14) return 'Partial';
  if (margin >= -30) return 'Defeat';
  return 'Catastrophic';
}

function gradeMultiplier(grade) {
  return {
    Legendary: 1.65,
    'Great Success': 1.3,
    Success: 1,
    Partial: 0.58,
    Defeat: 0.12,
    Catastrophic: 0,
  }[grade] ?? 0;
}

function injureHero(state, hero, mission, grade, rng, extraRisk = 0) {
  const supportPresent = mission.assignments.some((assignment) => ['Combat Support', 'Field Support', 'Advocate'].includes(assignment.role));
  const infirmary = (state.guild.facilities.infirmary || 0) + (appointmentHolder(state, 'Master Healer') ? 1 : 0);
  const gradeRisk = { Legendary: 0.01, 'Great Success': 0.02, Success: 0.04, Partial: 0.1, Defeat: 0.2, Catastrophic: 0.34 }[grade];
  const baseRisk = gradeRisk + mission.risk * 0.018 + extraRisk - (supportPresent ? 0.025 : 0) - infirmary * 0.012 + (hero.flaw === 'Injury-prone' ? 0.07 : 0);
  if (!rng.chance(clamp(baseRisk, 0.005, 0.7))) return { injured: false, died: false };

  const fatalBase = grade === 'Catastrophic' ? 0.025 + mission.risk * 0.009 : grade === 'Defeat' && mission.risk >= 4 ? 0.008 : 0.001;
  const policyFatalityFactor = 1 + clamp(extraRisk * 4, -0.3, 0.5);
  const fatality = fatalBase * (1 - infirmary * 0.13) * (supportPresent ? 0.72 : 1) * (hero.health < 65 ? 1.4 : 1) * policyFatalityFactor;
  if (rng.chance(clamp(fatality, 0, 0.12))) {
    hero.status = 'dead';
    clearHeroAppointmentInPlace(state, hero);
    hero.deathYear = state.date.year;
    hero.health = 0;
    hero.legacy += 20 + mission.risk * 6;
    state.guild.deaths += 1;
    state.stats.deaths += 1;
    addHeroHistory(hero, state, { type: 'death', title: `Died during ${mission.title}`, text: `The guild recovered ${hero.name}’s name, but not their future.` });
    addChronicle(state, { type: 'death', importance: 5, title: `${hero.name} dies beneath the banner`, text: `${hero.name} is killed during ${mission.title}. The guild’s history will divide into before and after this day.`, heroIds: [hero.id], tags: ['death', mission.family] });
    return { injured: true, died: true };
  }

  const injuries = ['Broken ribs', 'Deep blade wound', 'Crushed shoulder', 'Fevered wound', 'Shattered ankle', 'Arcane burn', 'Severe concussion'];
  hero.status = 'injured';
  hero.injury = rng.pick(injuries);
  hero.injuryMonths = rng.int(1, 2 + mission.risk);
  hero.health = clamp(hero.health - rng.int(14, 30), 20, 95);
  hero.career.injuries += 1;
  addHeroHistory(hero, state, { type: 'injury', title: hero.injury, text: `Suffered during ${mission.title}; expected recovery ${hero.injuryMonths} month${hero.injuryMonths === 1 ? '' : 's'}.` });
  return { injured: true, died: false };
}

function assignmentForLegacyCheck(assignments, roleCheck) {
  const equivalents = {
    Captain: ['Commander', 'Negotiation Lead', 'Expedition Lead', 'Mastermind'],
    Vanguard: ['Fighter', 'Delegation Guard', 'Field Support', 'Extraction'],
    Striker: ['Fighter', 'Infiltrator'],
    Support: ['Combat Support', 'Field Support', 'Advocate'],
    Scout: ['Searcher', 'Lookout', 'Infiltrator'],
    Specialist: ['Curator', 'Strategist', 'Mastermind', 'Infiltrator'],
  };
  return assignments.find((assignment) => assignment.role === roleCheck || equivalents[roleCheck]?.includes(assignment.role));
}

export function resolveDecision(state, decisionId, optionId) {
  const next = clone(state);
  const decisionIndex = next.pendingDecisions.findIndex((decision) => decision.id === decisionId);
  if (decisionIndex < 0) return { state, error: 'This decision is no longer pending.' };
  const decision = next.pendingDecisions[decisionIndex];
  const missionIndex = next.activeMissions.findIndex((mission) => mission.id === decision.missionId);
  if (missionIndex < 0) return { state, error: 'The expedition could not be found.' };
  const mission = next.activeMissions[missionIndex];
  const option = decision.options.find((item) => item.id === optionId);
  if (!option) return { state, error: 'Choose one of the available responses.' };

  const rng = rngFor(next, `resolve-${mission.id}-${option.id}`);
  const estimate = partyEstimate(next, mission.id, mission.formationType, mission.assignments);
  let adjustedChance = estimate.chance + (option.power || 0);
  if (next.guild.policies.retreat === 'Never retreat') adjustedChance += 4;
  if (next.guild.policies.retreat === 'Protect the wounded') adjustedChance -= 2;
  if (option.roleCheck) {
    const roleAssignment = assignmentForLegacyCheck(mission.assignments, option.roleCheck);
    if (roleAssignment) adjustedChance += Math.round((roleRating(getHero(next, roleAssignment.heroId), roleAssignment.role) - 55) * 0.2);
    else adjustedChance -= 8;
  }
  adjustedChance = clamp(adjustedChance, 3, 97);
  const roll = rng.next() * 100;
  const margin = adjustedChance - roll;
  const grade = gradeFromMargin(margin, roll / 100, adjustedChance);
  const success = ['Partial', 'Success', 'Great Success', 'Legendary'].includes(grade);
  const cleanSuccess = ['Success', 'Great Success', 'Legendary'].includes(grade);
  const multiplier = gradeMultiplier(grade);
  let rewardMultiplier = next.guild.policies.treasure === 'Equal Shares' ? 0.9 : next.guild.policies.treasure === "Captain's Discretion" ? 1.04 : next.guild.policies.treasure === 'Public Trust' ? 0.82 : 1;
  if (next.guild.alignment === 'Baron' && ['Political Mission', 'War Operation'].includes(mission.family)) rewardMultiplier += 0.1;
  const reward = Math.max(0, Math.round((mission.reward + (option.reward || 0)) * multiplier * rewardMultiplier));
  const rawFame = Math.round((mission.fame + (option.fame || 0)) * multiplier);
  let fameMultiplier = 1 + (next.guild.facilities.archive || 0) * 0.04 + (appointmentHolder(next, 'Chronicler') ? 0.08 : 0);
  if (next.guild.policies.treasure === 'Public Trust') fameMultiplier += 0.18;
  if (next.guild.policies.publicity === 'Heroic') fameMultiplier += 0.12;
  if (next.guild.policies.publicity === 'Private') fameMultiplier -= 0.35;
  if (next.guild.policies.publicity === 'Propaganda') fameMultiplier += cleanSuccess ? 0.25 : 0.4;
  if (next.guild.alignment === 'Council' && ['Rescue', 'Investigation', 'Escort'].includes(mission.family)) fameMultiplier += 0.1;
  if (next.guild.alignment === 'Independent' && ['Exploration', 'Monster Hunt', 'Legend Quest'].includes(mission.family)) fameMultiplier += 0.08;
  const fame = Math.max(-8, rawFame > 0 ? Math.round(rawFame * Math.max(0.4, fameMultiplier)) : Math.round(rawFame * (next.guild.policies.publicity === 'Propaganda' ? 1.4 : 1)));

  const teamSnapshot = mission.assignments.map((assignment) => {
    const hero = getHero(next, assignment.heroId);
    return hero ? {
      heroId: hero.id,
      name: hero.name,
      classId: hero.classId,
      role: assignment.role,
      slotId: assignment.slotId,
      power: hero.power,
      roleRating: roleRating(hero, assignment.role),
      form: hero.form,
      fatigueAtResolution: hero.fatigue,
    } : null;
  }).filter(Boolean);

  const injuries = [];
  const deaths = [];
  const heroEffects = [];
  const expeditionHeroes = mission.assignments.map((assignment) => getHero(next, assignment.heroId)).filter(Boolean);
  const protectedStar = [...expeditionHeroes].sort((a, b) => b.renown - a.renown)[0];

  mission.assignments.forEach((assignment) => {
    const hero = getHero(next, assignment.heroId);
    if (!hero || hero.status === 'dead') return;
    const before = { form: hero.form, morale: hero.morale, renown: hero.renown, legacy: hero.legacy, health: hero.health };
    hero.career.missions += 1;
    hero.career.earnings += Math.round(reward / mission.assignments.length);
    hero.fatigue = clamp(hero.fatigue + 12 + mission.risk * 5, 0, 100);
    hero.form = clamp(hero.form + (cleanSuccess ? rng.int(2, 7) : grade === 'Partial' ? rng.int(-1, 3) : rng.int(-8, -2)), 25, 96);
    hero.morale = clamp(hero.morale + (cleanSuccess ? rng.int(2, 6) : grade === 'Catastrophic' ? -10 : -3), 15, 100);
    if (next.guild.policies.treasure === 'Equal Shares') { hero.morale = clamp(hero.morale + 3, 15, 100); hero.loyalty = clamp(hero.loyalty + 1, 0, 100); }
    if (next.guild.policies.treasure === "Captain's Discretion") hero.loyalty = clamp(hero.loyalty + (['Commander', 'Negotiation Lead', 'Expedition Lead', 'Mastermind'].includes(assignment.role) ? 2 : -1), 0, 100);
    if (next.guild.policies.treasure === 'Public Trust') hero.legacy += 1;
    hero.renown = Math.max(0, hero.renown + Math.round(fame / mission.assignments.length) + (grade === 'Legendary' ? 6 : 0));
    hero.legacy += Math.max(0, Math.round(fame * 0.35) + (grade === 'Legendary' ? 12 : 0));
    if (cleanSuccess) hero.career.wins += 1;
    else if (grade === 'Partial') hero.career.partials += 1;
    else hero.career.defeats += 1;
    if (grade === 'Legendary') hero.career.legendary += 1;
    hero.career.fame += Math.max(0, Math.round(fame / mission.assignments.length));
    if (!hero.career.bestMission || gradeMultiplier(grade) > gradeMultiplier(hero.career.bestMission.grade)) {
      hero.career.bestMission = { title: mission.title, grade, year: next.date.year };
    }
    let policyInjuryRisk = next.guild.policies.retreat === 'Never retreat' ? 0.04 : next.guild.policies.retreat === 'Protect the wounded' ? -0.03 : 0;
    if (next.guild.policies.retreat === 'Preserve the stars') policyInjuryRisk += hero.id === protectedStar?.id ? -0.045 : 0.015;
    const injury = injureHero(next, hero, mission, grade, rng, (option.injury || 0) + policyInjuryRisk);
    if (injury.injured) injuries.push(hero.name);
    if (injury.died) deaths.push(hero.name);
    if (!injury.died && hero.status !== 'injured') hero.status = 'available';
    addHeroHistory(hero, next, { type: 'mission-result', title: `${grade}: ${mission.title}`, text: `${option.label}. Served as ${assignment.role}; earned ${Math.max(0, Math.round(fame / mission.assignments.length))} renown.` });
    heroEffects.push({
      heroId: hero.id,
      name: hero.name,
      role: assignment.role,
      status: hero.status,
      injury: hero.injury,
      formChange: hero.form - before.form,
      moraleChange: hero.morale - before.morale,
      renownChange: hero.renown - before.renown,
      legacyChange: hero.legacy - before.legacy,
      healthChange: hero.health - before.health,
    });
  });

  next.guild.crowns += reward;
  next.guild.fame = Math.max(0, next.guild.fame + fame);
  next.guild.legacy += Math.max(0, Math.round(fame * 0.25) + (grade === 'Legendary' ? 8 : 0) + (next.guild.policies.publicity === 'Private' && cleanSuccess ? 3 : 0));
  if (next.guild.policies.publicity === 'Propaganda' && !success) {
    next.guild.legacy = Math.max(0, next.guild.legacy - 3);
    next.notifications.push({ id: `scandal-${mission.id}`, tone: 'red', title: 'The heroic account collapses', text: 'Witnesses contradict the guild’s public version of the failed expedition.' });
  }
  next.stats.missionsCompleted += 1;
  if (cleanSuccess) {
    next.stats.missionsWon += 1;
    next.guild.wins += 1;
    next.guild.contractsCompleted += 1;
    if (mission.formationType === 'Combat') next.stats.combatWins += 1;
  } else {
    next.stats.missionsLost += 1;
    next.guild.losses += 1;
  }
  if (mission.risk >= 3 && cleanSuccess && injuries.length === 0) next.stats.perfectHardMission += 1;
  if (cleanSuccess && mission.estimateAtLaunch < 40) next.stats.upsets += 1;
  if (option.alignment) { next.guild.alignment = option.alignment; next.stats.alignmentChosen = 1; }
  if (option.rivalry && !next.guild.rivalries.includes(option.rivalry)) {
    next.guild.rivalries.push(option.rivalry);
    next.stats.rivalries += 1;
    const rival = next.rivals.find((item) => item.name === option.rivalry);
    if (rival) rival.hostility = clamp(rival.hostility + 35, 0, 100);
  }
  if (option.obligation) next.guild.obligations.push(option.obligation);
  if (option.clue && mission.saga) progressSagaInPlace(next, mission.saga, option.clue);
  if (mission.saga && cleanSuccess) progressSagaInPlace(next, mission.saga, grade === 'Legendary' ? 2 : 1);
  if (option.tag?.includes('feat') || grade === 'Legendary' || (mission.risk >= 4 && cleanSuccess)) next.stats.signatureFeats += 1;
  if (option.tag === 'mythic-feat') next.stats.mythicFeats += 1;
  if (option.tag === 'inherited-will' && next.flags.inheritedDream && !next.flags.inheritedDream.completed) {
    next.flags.inheritedDream.completed = true;
    next.stats.inheritedWill += 1;
  }

  const workshopLevel = next.guild.facilities.workshop || 0;
  const recoveredMissionArtifact = mission.artifact && (grade === 'Legendary' || (grade === 'Great Success' && rng.chance(0.12 + workshopLevel * 0.1)));
  const artifactName = option.artifact || (recoveredMissionArtifact ? mission.artifact : null);
  if (artifactName && cleanSuccess && !next.artifacts.some((artifact) => artifact.name === artifactName)) {
    const owner = mission.assignments.map((assignment) => getHero(next, assignment.heroId)).filter(Boolean).sort((a, b) => b.renown - a.renown)[0];
    next.artifacts.push({ id: uid('artifact', rng), name: artifactName, discoveredYear: next.date.year, originMission: mission.title, ownerId: owner?.id || null, legend: `${artifactName} entered the guild vault after ${mission.title}.`, prestige: mission.risk * 12 + (grade === 'Legendary' ? 20 : 0) });
    if (owner) { owner.career.artifacts += 1; owner.legacy += 10; }
  }

  const narrative = resultNarrative(mission, option, grade, reward, fame, injuries, deaths);
  const record = {
    id: `mission-record-${mission.id}`,
    kind: 'mission',
    missionId: mission.id,
    templateId: mission.templateId,
    title: mission.title,
    family: mission.family,
    region: mission.region,
    issuer: mission.issuer,
    risk: mission.risk,
    difficulty: mission.difficulty,
    formationType: mission.formationType || formationForMission(mission),
    startedYear: mission.startedYear,
    startedMonth: mission.startedMonth,
    completedYear: next.date.year,
    completedMonth: next.date.month,
    completedDate: dateLabel(next),
    duration: mission.duration,
    grade,
    reward,
    fame,
    supplyCost: mission.supplyCost,
    estimateAtLaunch: mission.estimateAtLaunch,
    finalChance: adjustedChance,
    roll: Math.round(roll),
    decision: { prompt: decision.prompt, optionId: option.id, label: option.label, note: option.note },
    team: teamSnapshot,
    heroEffects,
    injuries,
    deaths,
    artifact: artifactName && cleanSuccess ? artifactName : null,
    narrative,
    consequences: [option.obligation ? `Obligation: ${option.obligation}` : null, option.rivalry ? `Rivalry: ${option.rivalry}` : null, option.alignment ? `Alignment: ${option.alignment}` : null].filter(Boolean),
  };
  next.missionHistory.unshift(record);
  if (next.missionHistory.length > MAX_MISSION_HISTORY) next.missionHistory.length = MAX_MISSION_HISTORY;
  next.pendingReports.unshift({ kind: 'mission', id: record.id });

  addChronicle(next, {
    type: cleanSuccess ? 'victory' : grade === 'Partial' ? 'mixed' : 'defeat',
    importance: grade === 'Legendary' || deaths.length ? 5 : mission.risk >= 3 ? 3 : 2,
    title: `${grade}: ${mission.title}`,
    text: narrative,
    heroIds: mission.assignments.map((assignment) => assignment.heroId),
    tags: [mission.family, grade, option.tag, mission.formationType].filter(Boolean),
    facts: { grade, reward, fame, chance: adjustedChance, roll: Math.round(roll), option: option.label },
    missionRecordId: record.id,
  });

  next.notifications.push({
    id: `result-${mission.id}`,
    tone: cleanSuccess ? 'green' : grade === 'Partial' ? 'gold' : 'red',
    title: `${grade}: ${mission.title}`,
    text: `${reward} crowns · ${fame >= 0 ? '+' : ''}${fame} fame${injuries.length ? ` · ${injuries.length} injured` : ''}`,
  });
  next.activeMissions.splice(missionIndex, 1);
  next.pendingDecisions.splice(decisionIndex, 1);
  if (!next.tutorial.completed && ONBOARDING_STEPS[next.tutorial.step]?.target === 'resolveChoice') completeTutorialTargetInPlace(next, 'resolveChoice');
  commitRng(next, rng);
  evaluateStateInPlace(next);
  return { state: finalize(next), error: null, result: record };
}

function resultNarrative(mission, option, grade, reward, fame, injuries, deaths) {
  const opening = {
    Legendary: `The decision to “${option.label}” becomes the version sung in halls far beyond ${mission.region}.`,
    'Great Success': `The party executes “${option.label}” with authority and returns in triumph.`,
    Success: `The plan holds. The central objective is achieved without changing the age.`,
    Partial: `The mission succeeds in part, but the guild pays for every compromise.`,
    Defeat: `The party survives a failed attempt and returns with hard questions.`,
    Catastrophic: `The expedition collapses around the choice to “${option.label}.”`,
  }[grade];
  const consequence = deaths.length
    ? ` ${deaths.join(', ')} ${deaths.length === 1 ? 'does' : 'do'} not return.`
    : injuries.length
      ? ` ${injuries.join(', ')} return wounded.`
      : ' Every hero returns alive.';
  return `${opening}${consequence} The guild receives ${reward} crowns and ${fame} fame.`;
}

export function getReport(state, reference) {
  if (!reference) return null;
  const kind = typeof reference === 'string' ? (reference.startsWith('tournament-record-') ? 'tournament' : 'mission') : reference.kind;
  const id = typeof reference === 'string' ? reference : reference.id;
  return kind === 'tournament'
    ? state.tournamentHistory?.find((record) => record.id === id) || null
    : state.missionHistory?.find((record) => record.id === id) || null;
}

export function acknowledgeReport(state, reference) {
  const next = clone(state);
  const id = typeof reference === 'string' ? reference : reference?.id;
  next.pendingReports = (next.pendingReports || []).filter((item) => item.id !== id);
  completeTutorialTargetInPlace(next, 'viewMissionReport');
  return finalize(next);
}

function progressSagaInPlace(state, sagaId, amount) {
  const saga = state.sagas.find((item) => item.id === sagaId);
  if (!saga || saga.completed) return;
  saga.discovered = true;
  saga.progress = Math.min(saga.stages, saga.progress + amount);
  if (saga.progress >= saga.stages) {
    saga.completed = true;
    state.stats.signatureFeats += 1;
    state.guild.legacy += 40 + tierIndexByName(saga.tier) * 20;
    addChronicle(state, { type: 'saga', importance: 5, title: `${saga.id} concludes`, text: `The guild’s choices become the accepted ending of ${saga.id}.`, tags: ['saga', 'signature-feat'] });
  }
}

export function recruitCandidate(state, candidateId) {
  const next = clone(state);
  const index = next.candidates.findIndex((candidate) => candidate.id === candidateId);
  if (index < 0) return { state, error: 'This candidate has left the region.' };
  const candidate = next.candidates[index];
  if (activeHeroCount(next) >= heroCapacity(next)) return { state, error: 'The Great Hall has no room for another active hero.' };
  if (next.guild.crowns < candidate.signingFee) return { state, error: `Recruitment requires ${candidate.signingFee} crowns.` };
  if (candidate.interest < 35 && next.guild.tierIndex === 0) return { state, error: `${candidate.name} does not believe the guild can fulfill their ambitions yet.` };
  next.guild.crowns -= candidate.signingFee;
  const hero = clone(candidate);
  delete hero.signingFee;
  delete hero.channel;
  delete hero.expiresYear;
  delete hero.interest;
  hero.status = 'available';
  hero.guildId = 'player';
  hero.joinedYear = next.date.year;
  addHeroHistory(hero, next, { type: 'joined', title: `Joined ${next.guild.name}`, text: `Recruited through ${candidate.channel}.` });
  const wasFoundingSolo = activeHeroCount(next) === 1 && !next.flags.firstCompanionHired;
  next.heroes.push(hero);
  next.candidates.splice(index, 1);
  if (wasFoundingSolo) {
    next.flags.firstCompanionHired = true;
    next.candidates.forEach((remaining) => {
      remaining.signingFee = Math.max(120, Math.round(remaining.power * 5 + Math.max(0, remaining.potential - 70) * 5));
      remaining.channel = 'Tavern board';
      remaining.hook = remaining.hook.replace(' Will join the founding pair without a signing fee.', '');
    });
    completeTutorialTargetInPlace(next, 'recruitCompanion');
  }
  addChronicle(next, { type: 'recruitment', importance: wasFoundingSolo ? 4 : hero.potential >= 88 ? 3 : 1, title: `${hero.name} joins the guild`, text: wasFoundingSolo ? `${hero.name} becomes ${next.guild.founder}’s first companion and the Broken Lantern becomes a company of two.` : `The ${hero.age}-year-old ${hero.classId.toLowerCase()} signs for ${candidate.signingFee} crowns, carrying the dream to ${hero.dream.toLowerCase()}.`, heroIds: [hero.id, ...(wasFoundingSolo ? [next.guild.founderHeroId] : [])], tags: ['recruitment', ...(wasFoundingSolo ? ['founding-companion'] : [])] });
  evaluateStateInPlace(next);
  return { state: finalize(next), error: null };
}

export function releaseHero(state, heroId) {
  const next = clone(state);
  const hero = getHero(next, heroId);
  if (!hero || ['dead', 'retired', 'mission', 'tournament'].includes(hero.status)) return { state, error: 'This hero cannot be released now.' };
  if (hero.id === next.guild.founderHeroId) return { state, error: 'The active founder cannot be released from their own guild.' };
  hero.status = 'retired';
  clearHeroAppointmentInPlace(next, hero);
  hero.retiredYear = next.date.year;
  hero.retirementReason = 'released';
  next.stats.retirements += 1;
  addHeroHistory(hero, next, { type: 'departure', title: `Released by ${next.guild.name}`, text: 'The hero’s career may continue elsewhere.' });
  addChronicle(next, { type: 'departure', importance: 1, title: `${hero.name} leaves the guild`, text: `The contract ends after ${hero.career.serviceYears} years of service.`, heroIds: [hero.id], tags: ['departure'] });
  return { state: finalize(next), error: null };
}

export function setHeroTraining(state, heroId, training) {
  const next = clone(state);
  const hero = getHero(next, heroId);
  if (!hero || ['dead', 'retired'].includes(hero.status)) return next;
  hero.training = training;
  return finalize(next);
}

export function appointHero(state, heroId, appointmentId) {
  const next = clone(state);
  const hero = getHero(next, heroId);
  if (!hero || hero.status !== 'available') return { state, error: 'Only an available active hero can receive an appointment.' };
  if (!APPOINTMENTS.some((item) => item.id === appointmentId)) return { state, error: 'Unknown appointment.' };
  if (appointmentId === 'Master Healer' && (next.guild.facilities.infirmary || 0) < 2) return { state, error: 'Master Healer requires Infirmary level 2.' };
  Object.entries(next.guild.appointments).forEach(([key, value]) => {
    if (value === heroId) delete next.guild.appointments[key];
  });
  const previousHeroId = next.guild.appointments[appointmentId];
  if (previousHeroId) {
    const previous = getHero(next, previousHeroId);
    if (previous) previous.appointment = null;
  }
  next.guild.appointments[appointmentId] = heroId;
  hero.appointment = appointmentId;
  addHeroHistory(hero, next, { type: 'appointment', title: `Appointed ${appointmentId}`, text: 'The hero now carries an institutional responsibility between missions.' });
  return { state: finalize(next), error: null };
}

export function upgradeFacility(state, facilityId) {
  const next = clone(state);
  const facility = FACILITIES.find((item) => item.id === facilityId);
  if (!facility) return { state, error: 'Unknown facility.' };
  if (facility.unlock && next.guild.tierIndex < tierIndexByName(facility.unlock)) return { state, error: `${facility.name} unlocks at ${facility.unlock} tier.` };
  const level = next.guild.facilities[facilityId] || 0;
  if (level >= facility.max) return { state, error: `${facility.name} is already fully upgraded.` };
  if (level === 0 && usedFacilityRooms(next) >= headquartersRoomCapacity(next)) {
    return { state, error: `The headquarters has no free room. Reach a higher guild tier or expand the Great Hall first (${usedFacilityRooms(next)}/${headquartersRoomCapacity(next)} rooms occupied).` };
  }
  const cost = Math.round(facility.baseCost * (1 + level * 0.72));
  if (next.guild.crowns < cost) return { state, error: `The upgrade requires ${cost} crowns.` };
  next.guild.crowns -= cost;
  next.guild.facilities[facilityId] = level + 1;
  next.guild.legacy += 2 + level;
  addChronicle(next, { type: 'facility', importance: level + 1 >= 3 ? 2 : 1, title: `${facility.name} reaches level ${level + 1}`, text: `${facility.description} ${facility.effect}.`, tags: ['facility'] });
  evaluateStateInPlace(next);
  return { state: finalize(next), error: null };
}

export function chooseAlignment(state, alignment) {
  const allowed = ['Council', 'Baron', 'Independent'];
  if (!allowed.includes(alignment)) return { state, error: 'Choose the council, the baron or independence.' };
  const next = clone(state);
  if (next.guild.alignment !== 'Undeclared') return { state, error: 'The guild has already made its first political commitment.' };
  next.guild.alignment = alignment;
  next.stats.alignmentChosen = 1;
  const effects = {
    Council: { crowns: 160, fame: 4, text: 'Town contracts pay modestly but local trust grows faster.' },
    Baron: { crowns: 320, fame: 1, text: 'Noble contracts and political obligations arrive together.' },
    Independent: { crowns: 60, fame: 8, text: 'The guild keeps its freedom and earns popular respect.' },
  }[alignment];
  next.guild.crowns += effects.crowns;
  next.guild.fame += effects.fame;
  addChronicle(next, { type: 'politics', importance: 3, title: `${next.guild.name} chooses ${alignment === 'Independent' ? 'independence' : `the ${alignment.toLowerCase()}`}`, text: effects.text, tags: ['politics', alignment] });
  evaluateStateInPlace(next);
  return { state: finalize(next), error: null };
}

export function inspectHero(state, heroId) {
  const next = clone(state);
  if (getHero(next, heroId)) {
    next.flags.firstHeroInspected = true;
    completeTutorialTargetInPlace(next, 'inspectHero');
  }
  return finalize(next);
}

export function inspectGoals(state) {
  const next = clone(state);
  next.flags.goalsInspected = true;
  completeTutorialTargetInPlace(next, 'inspectGoals');
  return finalize(next);
}

function tournamentRequirements(divisionId) {
  return TOURNAMENT_DIVISIONS.find((division) => division.id === divisionId)?.requirements || TOURNAMENT_DIVISIONS[0].requirements;
}

export function getTournamentAccess(state, tournament) {
  const requirements = tournamentRequirements(tournament.division);
  const checks = [
    { id: 'fame', label: 'Fame', current: state.guild.fame, target: requirements.fame, met: state.guild.fame >= requirements.fame },
    { id: 'combatWins', label: 'Combat mission wins', current: state.stats.combatWins || 0, target: requirements.combatWins, met: (state.stats.combatWins || 0) >= requirements.combatWins },
    { id: 'localTitles', label: 'Local titles', current: state.stats.localTournamentWins || 0, target: requirements.localTitles, met: (state.stats.localTournamentWins || 0) >= requirements.localTitles },
    { id: 'professionalTitles', label: 'Professional titles', current: state.stats.professionalTournamentWins || 0, target: requirements.professionalTitles, met: (state.stats.professionalTournamentWins || 0) >= requirements.professionalTitles },
    { id: 'tierIndex', label: 'Guild tier', current: state.guild.tierIndex, target: requirements.tierIndex, met: state.guild.tierIndex >= requirements.tierIndex },
  ].filter((check) => check.target > 0);
  return { unlocked: checks.every((check) => check.met), checks };
}

function createTournamentOpponents(state, rng, division, count = 7) {
  const base = division === 'Elite' ? 76 : division === 'Professional' ? 64 : 51;
  const names = division === 'Elite'
    ? ['Royal Wardens', 'Storm Banner', 'Sunblade Company', 'Ivory Griffins', 'Crown Champions', 'The Last Oath', 'Ember Lions']
    : division === 'Professional'
      ? ['Iron Hart Company', 'Silver Concord', 'Greencloak Lodge', 'Red Pike Company', 'Temple Blades', 'Western Spears', 'Blackwood Wardens']
      : ['Mill Gate Watch', 'Dunmere Blades', 'Old Road Company', 'Barley Crown', 'Saint Orra Wardens', 'Northbridge Crew', 'Fox & Pike'];
  return Array.from({ length: count }, (_, index) => ({
    id: `${division.toLowerCase()}-opponent-${state.date.year}-${index}`,
    name: names[index] || `Company ${index + 1}`,
    power: clamp(base + rng.int(-6, 7), 38, 94),
    eliminated: false,
  }));
}

function createTournamentsInPlace(state, rng) {
  const configs = [
    { division: 'Local', name: 'Dunmere Harvest Melee', location: 'Dunmere', entryFee: 45, prize: 360, famePrize: 18, rounds: 8 },
    { division: 'Professional', name: 'Provincial Companies Circuit', location: 'High Valedorn', entryFee: 180, prize: 980, famePrize: 42, rounds: 8 },
    { division: 'Elite', name: "King's Shield", location: 'Crownspire', entryFee: 480, prize: 2600, famePrize: 95, rounds: 8 },
  ];
  state.tournaments = configs.map((config) => ({
    id: `tournament-${config.division.toLowerCase()}-${state.date.year}`,
    year: state.date.year,
    ...config,
    tier: config.division,
    format: 'Team Combat',
    status: 'registration',
    formationType: 'Combat',
    assignments: [],
    currentRound: config.rounds,
    finish: null,
    opponents: createTournamentOpponents(state, rng, config.division, config.rounds - 1),
    bracket: [],
    champion: null,
    teamPowerAtEntry: null,
  }));
}

function tournamentTeamEstimate(state, assignments) {
  const formation = FORMATION_TYPES.Combat;
  const filled = assignments.map((assignment) => ({ ...assignment, slot: formationSlotFor('Combat', assignment) })).filter((assignment) => assignment.slot);
  const ids = new Set(filled.map((assignment) => assignment.heroId));
  const requiredMissing = formation.slots.filter((slot) => slot.required && !filled.some((assignment) => assignment.slot.id === slot.id));
  const breakdown = filled.map((assignment) => {
    const hero = getHero(state, assignment.heroId);
    return hero ? { heroId: hero.id, heroName: hero.name, classId: hero.classId, role: assignment.slot.role, slotId: assignment.slot.id, rating: roleRating(hero, assignment.slot.role) } : null;
  }).filter(Boolean);
  const power = breakdown.length ? Math.round(breakdown.reduce((sum, item) => sum + item.rating, 0) / breakdown.length + Math.max(0, breakdown.length - 2) * 2.5) : 0;
  return { power, breakdown, requiredMissing, valid: breakdown.length >= 2 && breakdown.length <= 5 && ids.size === breakdown.length && requiredMissing.length === 0 };
}

export function enterTournament(state, tournamentId, formationType, assignments) {
  const next = clone(state);
  const tournament = next.tournaments?.find((item) => item.id === tournamentId);
  if (!tournament || tournament.status !== 'registration') return { state, error: 'Tournament registration is closed.' };
  if (next.tournaments.some((item) => item.status === 'active')) return { state, error: 'The guild is already competing in another tournament.' };
  const access = getTournamentAccess(next, tournament);
  if (!access.unlocked) return { state, error: `The ${tournament.division} circuit is still locked. Complete the listed qualification requirements first.` };
  if (formationType !== 'Combat') return { state, error: 'Team tournaments require a Combat Company arrangement.' };
  const estimate = tournamentTeamEstimate(next, assignments);
  if (!estimate.valid) return { state, error: `A tournament company needs a Commander, a Fighter and no duplicate heroes.` };
  const unavailable = assignments.map((assignment) => getHero(next, assignment.heroId)).filter((hero) => !hero || hero.status !== 'available');
  if (unavailable.length) return { state, error: 'Every tournament team member must be available.' };
  if (next.guild.crowns < tournament.entryFee) return { state, error: `Entry costs ${tournament.entryFee} crowns.` };

  next.guild.crowns -= tournament.entryFee;
  tournament.assignments = assignments.map((assignment) => {
    const slot = formationSlotFor('Combat', assignment);
    return { heroId: assignment.heroId, slotId: slot.id, role: slot.role };
  });
  tournament.status = 'active';
  tournament.currentRound = 8;
  tournament.teamPowerAtEntry = estimate.power;
  tournament.assignments.forEach((assignment) => {
    const hero = getHero(next, assignment.heroId);
    hero.status = 'tournament';
    hero.career.tournaments += 1;
    hero.roleExperience[assignment.role] = (hero.roleExperience[assignment.role] || 0) + 1;
  });
  addChronicle(next, {
    type: 'tournament', importance: 1, title: `${next.guild.name} enters the ${tournament.name}`,
    text: `${tournament.assignments.map((assignment) => `${getHero(next, assignment.heroId)?.name} (${assignment.role})`).join(', ')} enter the ${tournament.division.toLowerCase()} circuit.`,
    heroIds: tournament.assignments.map((assignment) => assignment.heroId), tags: ['tournament', tournament.division, 'Combat'],
  });
  return { state: finalize(next), error: null };
}

function completeTournamentInPlace(state, tournament, wonTitle, rng) {
  const team = tournament.assignments.map((assignment) => {
    const hero = getHero(state, assignment.heroId);
    if (!hero) return null;
    hero.status = 'available';
    if (wonTitle) {
      hero.career.titles += 1;
      hero.legacy += tournament.division === 'Elite' ? 32 : tournament.division === 'Professional' ? 22 : 14;
      hero.renown += tournament.division === 'Elite' ? 18 : tournament.division === 'Professional' ? 11 : 7;
    }
    return { heroId: hero.id, name: hero.name, classId: hero.classId, role: assignment.role, power: hero.power, roleRating: roleRating(hero, assignment.role) };
  }).filter(Boolean);
  const record = {
    id: `tournament-record-${tournament.id}`,
    kind: 'tournament',
    tournamentId: tournament.id,
    title: tournament.name,
    division: tournament.division,
    location: tournament.location,
    year: state.date.year,
    finish: tournament.finish,
    champion: wonTitle,
    reward: wonTitle ? tournament.prize : 0,
    fame: wonTitle ? tournament.famePrize : Math.max(2, Math.round((8 - tournament.finish) * 1.5)),
    team,
    bracket: clone(tournament.bracket),
    narrative: wonTitle
      ? `${state.guild.name} wins the ${tournament.name}, completing every round with the same Combat Company.`
      : `${state.guild.name} leaves the ${tournament.name} in the top ${tournament.finish}. The full run remains in the competitive record.`,
  };
  state.tournamentHistory.unshift(record);
  if (state.tournamentHistory.length > MAX_TOURNAMENT_HISTORY) state.tournamentHistory.length = MAX_TOURNAMENT_HISTORY;
  state.pendingReports.unshift({ kind: 'tournament', id: record.id });
  addChronicle(state, {
    type: 'tournament', importance: wonTitle ? 5 : tournament.finish <= 4 ? 2 : 1,
    title: wonTitle ? `${state.guild.name} wins the ${tournament.name}` : `${state.guild.name} exits the ${tournament.name}`,
    text: record.narrative,
    heroIds: team.map((hero) => hero.heroId),
    tags: ['tournament', tournament.division, wonTitle ? 'title' : 'defeat'],
    tournamentRecordId: record.id,
  });
  return record;
}

export function fightTournamentRound(state, tournamentId, tactic = 'Measured') {
  const next = clone(state);
  const tournament = next.tournaments?.find((item) => item.id === tournamentId);
  if (!tournament || tournament.status !== 'active' || !tournament.assignments?.length) return { state, error: 'No active tournament entry.' };
  const teamHeroes = tournament.assignments.map((assignment) => getHero(next, assignment.heroId)).filter(Boolean);
  if (teamHeroes.length < 2) return { state, error: 'The entered company is no longer available.' };
  const rng = rngFor(next, `tournament-${tournament.id}-${tournament.currentRound}-${tactic}`);
  const availableOpponents = tournament.opponents.filter((opponent) => !opponent.eliminated);
  const opponent = rng.pick(availableOpponents);
  const currentEstimate = tournamentTeamEstimate(next, tournament.assignments);
  const tacticMod = tactic === 'Aggressive' ? 4 : tactic === 'Defensive' ? 0 : tactic === 'Showmanship' ? -2 : 2;
  const fatigue = teamHeroes.reduce((sum, hero) => sum + hero.fatigue, 0) / teamHeroes.length;
  const chance = clamp(Math.round(100 / (1 + Math.exp(-((currentEstimate.power + tacticMod - fatigue * 0.08) - opponent.power) / 8))), 8, 92);
  const won = rng.next() * 100 < chance;
  const roundName = tournament.currentRound === 8 ? 'Quarterfinal' : tournament.currentRound === 4 ? 'Semifinal' : 'Final';
  teamHeroes.forEach((hero) => {
    hero.fatigue = clamp(hero.fatigue + (tactic === 'Aggressive' ? 17 : tactic === 'Defensive' ? 10 : 13), 0, 100);
    hero.form = clamp(hero.form + (won ? 2 : -3), 25, 96);
    if (won) hero.career.wins += 1;
    else hero.career.defeats += 1;
    addHeroHistory(hero, next, { type: 'tournament', title: `${roundName} ${won ? 'victory' : 'defeat'}: ${tournament.name}`, text: `${won ? 'Defeated' : 'Lost to'} ${opponent.name} using a ${tactic.toLowerCase()} team plan.` });
  });
  const record = { round: roundName, opponent: opponent.name, opponentPower: opponent.power, teamPower: currentEstimate.power, chance, won, tactic };
  tournament.bracket.push(record);
  opponent.eliminated = won;
  let report = null;

  if (won) {
    if (tournament.currentRound === 2) {
      tournament.status = 'completed';
      tournament.finish = 1;
      tournament.champion = next.guild.name;
      next.guild.crowns += tournament.prize;
      next.guild.fame += tournament.famePrize;
      next.guild.legacy += tournament.division === 'Elite' ? 28 : tournament.division === 'Professional' ? 18 : 10;
      next.stats.tournamentsWon += 1;
      next.stats.tournamentBest = 1;
      next.stats.signatureFeats += 1;
      if (tournament.division === 'Local') next.stats.localTournamentWins += 1;
      if (tournament.division === 'Professional') next.stats.professionalTournamentWins += 1;
      if (tournament.division === 'Elite') next.stats.eliteTournamentWins += 1;
      report = completeTournamentInPlace(next, tournament, true, rng);
    } else {
      tournament.currentRound /= 2;
      next.stats.tournamentBest = Math.min(next.stats.tournamentBest, tournament.currentRound);
    }
  } else {
    tournament.status = 'completed';
    tournament.finish = tournament.currentRound;
    next.stats.tournamentBest = Math.min(next.stats.tournamentBest, tournament.currentRound);
    report = completeTournamentInPlace(next, tournament, false, rng);
  }
  commitRng(next, rng);
  evaluateStateInPlace(next);
  return { state: finalize(next), error: null, result: record, report };
}

function guildRankings(state) {
  const rows = [
    { id: 'player', name: state.guild.name, fame: state.guild.fame, legacy: state.guild.legacy, tierIndex: state.guild.tierIndex, form: state.heroes.filter((h) => !['dead', 'retired'].includes(h.status)).reduce((sum, h) => sum + h.form, 0) / Math.max(1, activeHeroCount(state)), player: true },
    ...state.rivals.map((rival) => ({ id: rival.id, name: rival.name, fame: rival.fame, legacy: rival.legacy, tierIndex: rival.tierIndex, form: rival.form, player: false })),
  ];
  return rows.sort((a, b) => {
    const scoreA = a.tierIndex * 10000 + a.fame * 12 + a.legacy * 4 + a.form;
    const scoreB = b.tierIndex * 10000 + b.fame * 12 + b.legacy * 4 + b.form;
    return scoreB - scoreA;
  }).map((row, index) => ({ ...row, rank: index + 1 }));
}

export function getGuildRankings(state) {
  return guildRankings(state);
}

export function getHeroRankings(state) {
  return [...state.heroes, ...state.historicHeroes]
    .filter((hero) => hero.career?.missions > 0 || hero.renown > 8)
    .map((hero) => ({
      ...hero,
      historicalScore: Math.round(hero.legacy * 1.8 + hero.renown * 0.8 + (hero.career?.titles || 0) * 20 + (hero.career?.legendary || 0) * 14 + (hero.career?.missions || 0) * 0.5),
    }))
    .sort((a, b) => b.historicalScore - a.historicalScore);
}

export function getGoalMetric(state, metric) {
  switch (metric) {
    case 'missionsWon': return state.stats.missionsWon;
    case 'missionsCompleted': return state.stats.missionsCompleted;
    case 'tournamentBest': return state.stats.tournamentBest;
    case 'fame': return state.guild.fame;
    case 'alignmentChosen': return state.stats.alignmentChosen;
    case 'tierIndex': return state.guild.tierIndex;
    case 'greatHallLevel': return state.guild.facilities['great-hall'] || 0;
    case 'legendHero': return state.heroes.some((hero) => hero.power >= 80 || hero.legacy >= 150) ? 1 : 0;
    case 'artifacts': return state.artifacts.length;
    case 'years': return state.stats.yearsPlayed;
    case 'perfectHardMission': return state.stats.perfectHardMission;
    case 'upsets': return state.stats.upsets;
    case 'tournamentsWon': return state.stats.tournamentsWon;
    case 'longService': return Math.max(0, ...state.heroes.map((hero) => hero.career.serviceYears || 0), ...state.historicHeroes.map((hero) => hero.career?.serviceYears || 0));
    case 'inheritedWill': return state.stats.inheritedWill;
    case 'rivalries': return state.stats.rivalries;
    case 'mythicFeats': return state.stats.mythicFeats;
    default: return 0;
  }
}

function evaluateGoalsInPlace(state) {
  state.goals.forEach((goal) => {
    if (goal.completed) return;
    const value = getGoalMetric(state, goal.metric);
    const met = goal.comparator === 'lte' ? value <= goal.target : value >= goal.target;
    if (met) {
      goal.completed = true;
      goal.claimed = true;
      state.guild.crowns += goal.reward.crowns;
      state.guild.fame += goal.reward.fame;
      state.notifications.push({ id: `goal-${goal.id}`, tone: 'gold', title: `Objective complete: ${goal.title}`, text: `Reward: ${goal.reward.crowns} crowns${goal.reward.fame ? ` and ${goal.reward.fame} fame` : ''}.` });
      addChronicle(state, { type: 'goal', importance: 3, title: goal.title, text: `${goal.description} The guild receives ${goal.reward.crowns} crowns.`, tags: ['goal'] });
    }
  });
}

function evaluateAchievementsInPlace(state) {
  state.achievements.forEach((achievement) => {
    if (achievement.unlocked) return;
    const value = getGoalMetric(state, achievement.metric);
    if (value >= achievement.target) {
      achievement.unlocked = true;
      achievement.unlockedDate = dateLabel(state);
      state.guild.legacy += 5;
      state.notifications.push({ id: `achievement-${achievement.id}`, tone: 'purple', title: `Achievement: ${achievement.name}`, text: achievement.description });
    }
  });
}

function promotionRequirement(state) {
  const current = state.guild.tierIndex;
  if (current >= TIERS.length - 1) return null;
  const threshold = TIERS[current];
  const target = TIERS[current + 1];
  const rank = state.guild.rank;
  return {
    target,
    fame: { current: state.guild.fame, target: threshold.fame, met: state.guild.fame >= threshold.fame },
    contracts: { current: state.guild.contractsCompleted, target: threshold.contracts, met: state.guild.contractsCompleted >= threshold.contracts },
    rank: { current: rank, target: threshold.rank, met: rank <= threshold.rank },
    feat: { current: state.stats.signatureFeats, target: current + 1, met: state.stats.signatureFeats >= current + 1 },
    time: { current: state.stats.yearsPlayed, target: target.minYears || 0, met: state.stats.yearsPlayed >= (target.minYears || 0) },
  };
}

export function getPromotionRequirement(state) {
  return promotionRequirement(state);
}

function evaluatePromotionInPlace(state) {
  const requirement = promotionRequirement(state);
  if (!requirement) return;
  if (requirement.fame.met && requirement.contracts.met && requirement.rank.met && requirement.feat.met && requirement.time.met) {
    state.guild.tierIndex += 1;
    state.guild.tier = TIERS[state.guild.tierIndex].id;
    state.guild.charter = true;
    state.guild.crowns += 400 * state.guild.tierIndex;
    state.guild.legacy += 25 * state.guild.tierIndex;
    REGIONS.forEach((region) => {
      if (tierIndexByName(region.unlock) <= state.guild.tierIndex) {
        const saga = state.sagas.find((item) => item.tier === region.unlock);
        if (saga) saga.discovered = true;
      }
    });
    addChronicle(state, { type: 'promotion', importance: 5, title: `${state.guild.name} earns ${state.guild.tier} status`, text: `The guild’s social scale changes. New routes, obligations and rivals replace the old boundaries of Dunmere.`, tags: ['promotion', state.guild.tier] });
    state.notifications.push({ id: `promotion-${state.guild.tierIndex}`, tone: 'gold', title: `${state.guild.tier} status achieved`, text: `${TIERS[state.guild.tierIndex].scope} is now open to the banner.` });
    const rng = rngFor(state, `promotion-${state.guild.tierIndex}`);
    refreshMissionsInPlace(state, rng);
    commitRng(state, rng);
  }
}

function evaluateStateInPlace(state) {
  const rankings = guildRankings(state);
  state.guild.rank = rankings.find((row) => row.id === 'player')?.rank || state.guild.rank;
  evaluateGoalsInPlace(state);
  evaluateAchievementsInPlace(state);
  evaluatePromotionInPlace(state);
  state.stats.highestPower = Math.max(state.stats.highestPower, ...state.heroes.map((hero) => hero.power));
}

function finalize(state) {
  state.lastPlayedAt = new Date().toISOString();
  state.guild.tier = TIERS[state.guild.tierIndex]?.id || state.guild.tier;
  state.notifications = state.notifications.slice(-12);
  return state;
}

export function dismissNotification(state, notificationId) {
  const next = clone(state);
  next.notifications = next.notifications.filter((notification) => notification.id !== notificationId);
  return finalize(next);
}

export function clearNotifications(state) {
  const next = clone(state);
  next.notifications = [];
  return finalize(next);
}

export function updateSettings(state, patch) {
  const next = clone(state);
  next.settings = { ...next.settings, ...patch };
  return finalize(next);
}

export function getNextAction(state) {
  if (!state.tutorial.completed) {
    return { kind: 'tutorial', ...ONBOARDING_STEPS[state.tutorial.step], step: state.tutorial.step + 1, total: ONBOARDING_STEPS.length };
  }
  if (state.pendingDecisions.length) {
    return { kind: 'critical', title: 'A critical decision is waiting', body: state.pendingDecisions[0].prompt, screen: 'hall', action: 'resolve' };
  }
  if (state.pendingReports?.length) {
    const report = getReport(state, state.pendingReports[0]);
    return { kind: 'critical', title: report ? `Read the report: ${report.title}` : 'An expedition report is waiting', body: 'Review the full team, formation, odds, rewards and consequences before continuing.', screen: 'chronicle', action: 'report' };
  }
  if (state.guild.crowns < monthlyUpkeep(state) * 1.5) {
    return { kind: 'warning', title: 'Treasury under pressure', body: `You have ${state.guild.crowns} crowns. Monthly upkeep is ${monthlyUpkeep(state)}. Take a contract before expanding.`, screen: 'missions' };
  }
  const activeGoal = state.goals.find((goal) => !goal.completed && tierIndexByName(goal.tier) <= state.guild.tierIndex);
  if (activeGoal) {
    const current = getGoalMetric(state, activeGoal.metric);
    const screenByMetric = {
      missionsWon: 'missions', missionsCompleted: 'missions', tournamentBest: 'tournaments',
      fame: 'missions', alignmentChosen: 'headquarters', tierIndex: 'goals',
      greatHallLevel: 'headquarters', legendHero: 'heroes', artifacts: 'chronicle', years: 'hall',
    };
    const actionByMetric = {
      missionsWon: 'Choose a contract you can cover with the recommended roles.',
      tournamentBest: 'Build a Combat Company, qualify for the next circuit and enter this year’s tournament.',
      fame: 'Favor high-fame contracts, saga choices and public victories.',
      alignmentChosen: 'Open Headquarters and decide who the guild will serve.',
      tierIndex: 'Review the promotion checklist and complete its next missing condition.',
      greatHallLevel: 'Save enough crowns to upgrade the Great Hall.',
      legendHero: 'Give a high-potential hero missions, training and meaningful roles.',
      artifacts: 'Pursue missions that display an artifact possibility.',
      years: 'Keep the institution solvent and advance the chronicle.',
    };
    return { kind: 'goal', title: activeGoal.title, body: `${activeGoal.description} ${actionByMetric[activeGoal.metric] || ''}`.trim(), screen: screenByMetric[activeGoal.metric] || 'goals', progress: current, target: activeGoal.target };
  }
  const requirement = promotionRequirement(state);
  if (requirement) {
    const checks = [
      ['fame', requirement.fame], ['successful contracts', requirement.contracts], ['guild rank', requirement.rank],
      ['signature achievements', requirement.feat], ['campaign years', requirement.time],
    ];
    const [label, missing] = checks.find(([, item]) => !item.met) || checks[0];
    const display = label === 'guild rank' ? `rank #${missing.current}; need #${missing.target} or better` : `${missing.current}/${missing.target} ${label}`;
    return { kind: 'promotion', title: `Path to ${requirement.target.id}`, body: `Next threshold: ${display}. Open the full checklist to choose how to achieve it.`, screen: 'goals' };
  }
  return { kind: 'legacy', title: 'Write the next chapter', body: 'Choose a dangerous contract, develop a successor or pursue a saga that history will remember.', screen: 'missions' };
}

export function getDashboardSummary(state) {
  return {
    date: dateLabel(state),
    tier: state.guild.tier,
    rank: state.guild.rank,
    crowns: state.guild.crowns,
    fame: state.guild.fame,
    legacy: state.guild.legacy,
    upkeep: monthlyUpkeep(state),
    activeHeroes: activeHeroCount(state),
    capacity: heroCapacity(state),
    activeMissions: state.activeMissions.length,
    partyCapacity: partyCapacity(state),
    decisions: state.pendingDecisions.length,
  };
}

export function compactForSave(state, aggressive = false) {
  const saved = clone(state);
  saved.notifications = saved.notifications.slice(-6);
  saved.pendingReports = (saved.pendingReports || []).slice(0, 6);
  saved.chronicle = saved.chronicle.slice(0, aggressive ? 550 : MAX_CHRONICLE);
  saved.missionHistory = (saved.missionHistory || []).slice(0, aggressive ? 350 : MAX_MISSION_HISTORY);
  saved.tournamentHistory = (saved.tournamentHistory || []).slice(0, aggressive ? 120 : MAX_TOURNAMENT_HISTORY);
  saved.heroes.forEach((hero) => {
    hero.history = hero.history.slice(0, aggressive ? 50 : MAX_HERO_HISTORY);
    if (aggressive) hero.relationships = hero.relationships.slice(-12);
  });
  saved.historicHeroes = saved.historicHeroes
    .sort((a, b) => b.legacy - a.legacy)
    .slice(0, aggressive ? 350 : 800)
    .map((hero) => ({ ...hero, history: (hero.history || []).slice(0, aggressive ? 12 : 30) }));
  saved.rivals.forEach((rival) => {
    rival.recent = (rival.recent || []).slice(-10);
    if (rival.star?.history) rival.star.history = rival.star.history.slice(0, 20);
  });
  return saved;
}

export function migrateGame(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('Invalid save data.');
  if (!raw.schemaVersion) raw.schemaVersion = 1;
  const next = clone(raw);
  next.schemaVersion = SCHEMA_VERSION;
  next.notifications ||= [];
  next.historicHeroes ||= [];
  next.pendingDecisions ||= [];
  next.missionHistory ||= [];
  next.tournamentHistory ||= [];
  next.pendingReports ||= [];
  next.artifacts ||= [];
  next.sagas ||= SAGA_DEFINITIONS.map((saga) => ({ ...saga, progress: 0, completed: false, discovered: saga.tier === 'Local' }));
  next.stats = { ...initialStats(), ...(next.stats || {}) };
  next.settings = { autosave: true, reducedMotion: false, compactMode: false, difficulty: 'Standard', ...(next.settings || {}) };
  next.flags ||= {};
  next.guild.facilities = { ...facilityLevels(), ...(next.guild.facilities || {}) };
  next.guild.appointments ||= {};
  next.guild.obligations ||= [];
  next.guild.rivalries ||= [];
  next.guild.formations = { ...emptyFormations(), ...(next.guild.formations || {}) };
  next.guild.founderHeroId ||= next.heroes?.[0]?.id || null;

  next.heroes.forEach((hero) => {
    hero.history ||= [];
    hero.roleExperience = { ...Object.fromEntries(PARTY_ROLES.map((role) => [role.id, 0])), ...(hero.roleExperience || {}) };
    hero.career ||= { missions: 0, wins: 0, partials: 0, defeats: 0, legendary: 0, tournaments: 0, titles: 0, injuries: 0, rescues: 0, kills: 0, artifacts: 0, fame: 0, earnings: 0, bestMission: null, peakPower: hero.power || 0, serviceYears: 0 };
  });
  (next.candidates || []).forEach((hero) => {
    hero.roleExperience = { ...Object.fromEntries(PARTY_ROLES.map((role) => [role.id, 0])), ...(hero.roleExperience || {}) };
  });
  (next.missions || []).forEach((mission) => { mission.approach ||= formationForMission(mission); });
  (next.activeMissions || []).forEach((mission) => {
    mission.approach ||= formationForMission(mission);
    mission.formationType ||= mission.approach;
    const slots = FORMATION_TYPES[mission.formationType]?.slots || FORMATION_TYPES.Combat.slots;
    mission.assignments = (mission.assignments || []).slice(0, 5).map((assignment, index) => ({
      heroId: assignment.heroId,
      slotId: slots[index]?.id || slots[slots.length - 1].id,
      role: slots[index]?.role || slots[slots.length - 1].role,
    }));
  });

  // The old build had one individual tournament. New seasons use three team circuits.
  next.heroes.filter((hero) => hero.status === 'tournament').forEach((hero) => { hero.status = 'available'; });
  if (!Array.isArray(next.tournaments) || !next.tournaments.length) {
    const rng = rngFor(next, 'migrate-tournaments');
    createTournamentsInPlace(next, rng);
    commitRng(next, rng);
  }
  delete next.tournament;
  evaluateStateInPlace(next);
  return finalize(next);
}

export function validateGame(state) {
  const errors = [];
  if (!state || state.schemaVersion !== SCHEMA_VERSION) errors.push('Schema version mismatch.');
  if (!state.guild?.name) errors.push('Guild name is missing.');
  if (!Array.isArray(state.heroes) || state.heroes.length < 1) errors.push('No heroes exist.');
  if (!Array.isArray(state.rivals) || state.rivals.length < 5) errors.push('Too few rival guilds.');
  if (!Number.isFinite(state.guild?.crowns)) errors.push('Treasury is invalid.');
  if (!Number.isFinite(state.rngState)) errors.push('RNG state is invalid.');
  const ids = new Set();
  state.heroes.forEach((hero) => {
    if (ids.has(hero.id)) errors.push(`Duplicate hero id: ${hero.id}`);
    ids.add(hero.id);
    if (!CLASSES[hero.classId]) errors.push(`Unknown class: ${hero.classId}`);
    if (!Number.isFinite(hero.power)) errors.push(`Invalid power for ${hero.name}`);
    if (!Number.isFinite(hero.age) || hero.age < 0) errors.push(`Invalid age for ${hero.name}`);
  });
  if (!TIERS[state.guild?.tierIndex]) errors.push('Guild tier index is invalid.');
  const deployed = new Set();
  (state.activeMissions || []).forEach((mission) => {
    (mission.assignments || []).forEach((assignment) => {
      if (deployed.has(assignment.heroId)) errors.push(`Hero is deployed twice: ${assignment.heroId}`);
      deployed.add(assignment.heroId);
      const hero = state.heroes.find((item) => item.id === assignment.heroId);
      if (!hero) errors.push(`Mission references missing hero: ${assignment.heroId}`);
      else if (hero.status !== 'mission') errors.push(`Deployed hero has invalid status: ${hero.name}`);
    });
  });
  (state.tournaments || []).filter((tournament) => tournament.status === 'active').forEach((tournament) => {
    (tournament.assignments || []).forEach((assignment) => {
      if (deployed.has(assignment.heroId)) errors.push(`Hero is deployed twice: ${assignment.heroId}`);
      deployed.add(assignment.heroId);
      const hero = state.heroes.find((item) => item.id === assignment.heroId);
      if (!hero) errors.push(`Tournament references missing hero: ${assignment.heroId}`);
      else if (hero.status !== 'tournament') errors.push(`Tournament hero has invalid status: ${hero.name}`);
    });
  });
  if (!Array.isArray(state.missionHistory)) errors.push('Mission history is missing.');
  if (!Array.isArray(state.tournamentHistory)) errors.push('Tournament history is missing.');
  if (!state.guild?.formations || Object.keys(FORMATION_TYPES).some((type) => !Array.isArray(state.guild.formations[type]))) errors.push('Saved formations are invalid.');
  Object.entries(state.guild?.appointments || {}).forEach(([appointmentId, heroId]) => {
    if (!APPOINTMENTS.some((item) => item.id === appointmentId)) errors.push(`Unknown appointment: ${appointmentId}`);
    const hero = state.heroes.find((item) => item.id === heroId);
    if (!hero || ['dead', 'retired'].includes(hero.status)) errors.push(`Appointment references inactive hero: ${appointmentId}`);
  });
  (state.pendingDecisions || []).forEach((decision) => {
    if (decision.missionId && !state.activeMissions.some((mission) => mission.id === decision.missionId)) errors.push(`Decision references missing mission: ${decision.id}`);
  });
  return errors;
}

function autoplayAssignments(state, mission) {
  const formationType = formationForMission(mission);
  const formation = FORMATION_TYPES[formationType];
  const heroes = state.heroes
    .filter((hero) => hero.status === 'available')
    .sort((a, b) => b.power - a.power);
  const used = new Set();
  const assignments = [];
  formation.slots.forEach((slot) => {
    if (assignments.length >= Math.min(5, heroes.length)) return;
    const candidates = heroes
      .filter((hero) => !used.has(hero.id))
      .map((hero) => ({ hero, score: roleRating(hero, slot.role) }))
      .sort((a, b) => b.score - a.score);
    const chosen = candidates[0]?.hero;
    if (chosen && (slot.required || assignments.length < Math.min(4, heroes.length))) {
      used.add(chosen.id);
      assignments.push({ heroId: chosen.id, slotId: slot.id, role: slot.role });
    }
  });
  return { formationType, assignments };
}

export function simulateAutoplay(initialState, months = 240) {
  let state = clone(initialState);
  for (let i = 0; i < months; i += 1) {
    while (state.pendingReports?.length) state = acknowledgeReport(state, state.pendingReports[0]);
    if (state.pendingDecisions.length) {
      const decision = state.pendingDecisions[0];
      const option = decision.options[0];
      state = resolveDecision(state, decision.id, option.id).state;
      while (state.pendingReports?.length) state = acknowledgeReport(state, state.pendingReports[0]);
    }
    if (activeHeroCount(state) < 2 && state.candidates.length) {
      const candidate = [...state.candidates].sort((a, b) => b.potential - a.potential)[0];
      const recruited = recruitCandidate(state, candidate.id);
      if (!recruited.error) state = recruited.state;
    }
    const available = state.heroes.filter((hero) => hero.status === 'available');
    if (available.length >= 2 && state.activeMissions.length < 1 && state.missions.length) {
      const mission = [...state.missions].sort((a, b) => a.difficulty - b.difficulty)[0];
      const { formationType, assignments } = autoplayAssignments(state, mission);
      const launched = launchMission(state, mission.id, formationType, assignments);
      if (!launched.error) state = launched.state;
    }
    const advanced = advanceMonths(state, 1);
    state = advanced.state;
  }
  while (state.pendingReports?.length) state = acknowledgeReport(state, state.pendingReports[0]);
  return state;
}
