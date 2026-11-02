// @ts-check
// Hero generation, XP and levels, relationships, party role ratings and estimates.
import { CLASSES, normalizeClassId, FIRST_NAMES, FLAWS, HIDDEN_TRAITS, LAST_NAMES, ORIGINS, PERSONALITIES, DREAMS } from '../../data/content.js';
import { FORMATION_TYPES, PARTY_ROLES, formationForMission } from '../../data/formations.js';
import { LOCATION_BY_ID, PRIMAL_IDS, RARITIES, primalCombatModifier, primalDiplomacyModifier } from '../../data/world.js';
import { addHeroHistory, appointmentHolder, clamp, getHero, uid } from './core.js';

export function xpForNextLevel(level) {
  return level >= 20 ? 0 : 70 + level * 30;
}

function rarityFromRoll(rng, bonus = 0) {
  const roll = rng.next() + bonus;
  if (roll > 1.03) return 'Legend';
  if (roll > 0.91) return 'Epic';
  if (roll > 0.72) return 'Rare';
  if (roll > 0.43) return 'Uncommon';
  return 'Common';
}

function levelBandForRarity(rarity, rng, veteran = false) {
  const bands = {
    Common: [1, 3],
    Uncommon: [2, 5],
    Rare: [4, 8],
    Epic: [7, 12],
    Legend: [10, 15],
  };
  const [min, max] = bands[rarity] || bands.Common;
  return clamp(rng.int(min, max) + (veteran ? 2 : 0), 1, 18);
}

function powerForLevel(level, rarity, rng) {
  const rarityBonus = { Common: 0, Uncommon: 2, Rare: 5, Epic: 8, Legend: 11 }[rarity] || 0;
  return clamp(38 + level * 2.25 + rarityBonus + rng.int(-3, 3), 38, 91);
}

export function choosePrimal(rng, locationId) {
  const locationPrimal = LOCATION_BY_ID[locationId]?.primal;
  if (locationPrimal && rng.chance(0.58)) return locationPrimal;
  return rng.pick(PRIMAL_IDS);
}

export function applyXpInPlace(hero, amount, state, source = 'experience') {
  if (!hero || hero.level >= 20 || amount <= 0) return [];
  const gains = [];
  hero.xp = (hero.xp || 0) + Math.round(amount);
  while (hero.level < 20) {
    const needed = xpForNextLevel(hero.level);
    if (hero.xp < needed) break;
    hero.xp -= needed;
    hero.level += 1;
    const classInfo = CLASSES[normalizeClassId(hero.classId)];
    const keys = Object.keys(hero.attributes);
    const primary = classInfo?.primary || keys[0];
    const secondary = classInfo?.secondary || keys[1];
    hero.attributes[primary] = clamp(hero.attributes[primary] + 2, 20, hero.potential);
    hero.attributes[secondary] = clamp(hero.attributes[secondary] + 1, 20, hero.potential);
    const extra = keys.filter((key) => key !== primary && key !== secondary);
    const randomKey = extra[(hero.level + hero.name.length) % extra.length];
    if (randomKey) hero.attributes[randomKey] = clamp(hero.attributes[randomKey] + 1, 20, hero.potential);
    hero.power = calculatePower(hero.attributes);
    hero.career.peakPower = Math.max(hero.career.peakPower || 0, hero.power);
    hero.renown += hero.level % 5 === 0 ? 2 : 1;
    gains.push(hero.level);
    if (state) {
      addHeroHistory(hero, state, { type: 'level', title: `Reached level ${hero.level}`, text: `${hero.name} advanced through ${source}.` });
      state.notifications.push({
        id: `level-${hero.id}-${hero.level}-${state.date.year}-${state.date.month}`,
        tone: hero.level >= 15 ? 'purple' : 'green',
        title: `${hero.name} reached level ${hero.level}`,
        text: `${hero.rarity} ${hero.classId} · power ${hero.power}`,
      });
    }
  }
  return gains;
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
  classId = normalizeClassId(classId);
  const classInfo = CLASSES[classId];
  attrs[classInfo.primary] = clamp(attrs[classInfo.primary] + 8, 20, 99);
  attrs[classInfo.secondary] = clamp(attrs[classInfo.secondary] + 4, 20, 99);
  return attrs;
}

export function calculatePower(attributes) {
  const values = Object.values(attributes);
  const sorted = [...values].sort((a, b) => b - a);
  return Math.round(sorted[0] * 0.25 + sorted[1] * 0.2 + (values.reduce((sum, v) => sum + v, 0) / values.length) * 0.55);
}

export function createHeroFromBase(base, state, rng, options = {}) {
  const rarity = base.rarity || options.rarity || 'Common';
  const level = clamp(base.level || options.level || 1, 1, 20);
  const primal = base.primal || options.primal || choosePrimal(rng, options.homeLocationId || state.world?.currentLocationId || 'dunmere');
  const basePower = base.power || powerForLevel(level, rarity, rng);
  const attributes = base.attributes || baseAttributes(basePower, base.classId, rng);
  const hero = {
    id: base.id || uid('hero', rng),
    name: base.name,
    classId: base.classId,
    primal,
    rarity,
    level,
    xp: base.xp || 0,
    age: base.age,
    power: calculatePower(attributes),
    potential: Math.max(calculatePower(attributes) + 3, base.potential || RARITIES[rarity]?.maxPotential || 72),
    attributes,
    personality: base.personality,
    flaw: base.flaw,
    dream: base.dream,
    origin: base.origin,
    homeLocationId: base.homeLocationId || options.homeLocationId || state.world?.currentLocationId || 'dunmere',
    hiddenTrait: base.hiddenTrait || rng.pick(HIDDEN_TRAITS),
    hiddenRevealed: false,
    hook:
      base.hook ||
      `${base.personality} ${rarity.toLowerCase()} ${primal.toLowerCase()} ${base.classId.toLowerCase()} from a ${base.origin.toLowerCase()} background.`,
    loyalty: base.loyalty ?? rng.int(48, 82),
    morale: rng.int(62, 82),
    form: rng.int(58, 76),
    fatigue: 0,
    health: 100,
    status: 'available',
    injury: null,
    injuryMonths: 0,
    salary: Math.max(12, Math.round((18 + level * 7 + Math.max(0, (base.potential || 70) - 70) * 0.45) * (RARITIES[rarity]?.salary || 1))),
    joinedYear: options.joinedYear ?? state.date.year,
    guildId: options.guildId || 'player',
    appointment: null,
    training: 'Fundamentals',
    monthlyActivity: 'Training',
    roleExperience: Object.fromEntries(PARTY_ROLES.map((role) => [role.id, 0])),
    career: {
      missions: 0,
      wins: 0,
      partials: 0,
      defeats: 0,
      legendary: 0,
      tournaments: 0,
      individualTournaments: 0,
      tournamentBouts: 0,
      tournamentBoutWins: 0,
      titles: 0,
      individualTitles: 0,
      guildTitles: 0,
      runnerUps: 0,
      semifinals: 0,
      bestTournamentFinish: 99,
      titleWins: {},
      prizeMoney: 0,
      tournamentFame: 0,
      injuries: 0,
      rescues: 0,
      kills: 0,
      artifacts: 0,
      artifactPrestige: 0,
      fame: 0,
      earnings: 0,
      bestMission: null,
      peakPower: calculatePower(attributes),
      serviceYears: 0,
      xpEarned: 0,
    },
    renown: options.renown ?? Math.max(0, level - 1 + Math.round(basePower / 14 - 2)),
    legacy: options.legacy ?? 0,
    relationships: base.relationships || [],
    mentorId: base.mentorId || null,
    apprenticeIds: base.apprenticeIds || [],
    ambitions: base.ambitions || [],
    artifactIds: base.artifactIds || [],
    artifactPowerBonus: base.artifactPowerBonus || 0,
    promises: base.promises || [],
    history: [],
  };
  return hero;
}

export function generateHero(state, rng, quality = 'normal', options = {}) {
  const locationId = options.homeLocationId || state.world?.currentLocationId || 'dunmere';
  const location = LOCATION_BY_ID[locationId];
  const scoutBonus = (state.guild?.facilities?.['scout-office'] || 0) * 0.025;
  const qualityBonus = quality === 'elite' ? 0.24 : quality === 'veteran' ? 0.12 : 0;
  const rarity = options.rarity || rarityFromRoll(rng, scoutBonus + qualityBonus);
  const level = options.level || levelBandForRarity(rarity, rng, quality === 'veteran');
  const classPool = (location?.specialties?.length && rng.chance(0.64) ? location.specialties : Object.keys(CLASSES)).map(normalizeClassId);
  const classId = options.classId || rng.pick(classPool);
  const age = options.age ?? clamp(rng.int(17, 27) + Math.floor(level / 3) + (quality === 'veteran' ? 7 : 0), 16, 39);
  const powerBase = powerForLevel(level, rarity, rng);
  const rarityPotential = RARITIES[rarity]?.maxPotential || 72;
  const potential = clamp(powerBase + rng.int(5, 16), powerBase + 3, rarityPotential);
  const name = options.name || `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`;
  return createHeroFromBase(
    {
      name,
      classId,
      age,
      level,
      rarity,
      primal: options.primal || choosePrimal(rng, locationId),
      homeLocationId: locationId,
      power: powerBase,
      potential,
      personality: rng.pick(PERSONALITIES),
      flaw: rng.pick(FLAWS),
      dream: rng.pick(DREAMS),
      origin: `${rng.pick(ORIGINS)} of ${location?.name || 'the road'}`,
      loyalty: rng.int(45, 78),
    },
    state,
    rng,
    { ...options, homeLocationId: locationId },
  );
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
      affinity +
      experience +
      (hero.artifactPowerBonus || 0) -
      hero.fatigue * 0.2 -
      healthPenalty,
  );
}

export function normalizedFormationType(mission, formationType) {
  return FORMATION_TYPES[formationType] ? formationType : formationForMission(mission);
}

export function formationSlotFor(formationType, assignment) {
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
  const assignments = legacyCall ? formationTypeOrAssignments : maybeAssignments || [];
  const formation = FORMATION_TYPES[formationType];
  if (!mission || !formation || !assignments.length) {
    return {
      chance: 0,
      power: 0,
      primalEdge: 0,
      formationType,
      recommended: formationForMission(mission),
      missingRoles: [],
      missingSlots: formation?.slots.filter((slot) => slot.required).map((slot) => slot.label) || [],
      warnings: ['Fill the required formation slots.'],
      breakdown: [],
    };
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
    const elementalRelation =
      formationType === 'Diplomacy' ? primalDiplomacyModifier(hero.primal, mission.patronPrimal) : primalCombatModifier(hero.primal, mission.enemyPrimal);
    const primalModifier = Math.round(elementalRelation * (formationType === 'Combat' ? 9 : formationType === 'Diplomacy' ? 8 : 5));
    rating += primalModifier;
    total += rating;
    validCount += 1;
    breakdown.push({
      heroId: hero.id,
      heroName: hero.name,
      role: slot.role,
      slotId: slot.id,
      slotLabel: slot.label,
      rating,
      classId: hero.classId,
      level: hero.level,
      rarity: hero.rarity,
      primal: hero.primal,
      primalModifier,
    });
  });

  const filledSlotIds = new Set(breakdown.map((item) => item.slotId));
  const missingSlots = formation.slots.filter((slot) => slot.required && !filledSlotIds.has(slot.id));
  const primalEdge = breakdown.reduce((sum, item) => sum + item.primalModifier, 0);
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
  if (formationType !== formationForMission(mission))
    warnings.push(`${formation.label} is an unconventional approach for a ${mission.family.toLowerCase()} mission.`);
  const tired = breakdown.map((item) => getHero(state, item.heroId)).filter((hero) => hero?.fatigue >= 60);
  if (tired.length) warnings.push(`${tired.map((hero) => hero.name).join(', ')} will enter heavily fatigued.`);
  const severeMisfits = breakdown.filter((item) => roleRating(getHero(state, item.heroId), item.role) < getHero(state, item.heroId).power - 5);
  if (severeMisfits.length) warnings.push(`${severeMisfits.map((item) => `${item.heroName} as ${item.role}`).join(', ')} is a poor class-role fit.`);
  if (primalEdge <= -8)
    warnings.push(`The company is primally disadvantaged against ${formationType === 'Diplomacy' ? mission.patronPrimal : mission.enemyPrimal}.`);
  if (primalEdge >= 8)
    warnings.push(`Primal composition creates a meaningful edge against ${formationType === 'Diplomacy' ? mission.patronPrimal : mission.enemyPrimal}.`);
  return {
    chance,
    power: Math.round(partyPower),
    primalEdge,
    formationType,
    recommended: formationForMission(mission),
    missingRoles: missingSlots.map((slot) => slot.role),
    missingSlots: missingSlots.map((slot) => slot.label),
    warnings,
    breakdown,
  };
}

export function relationshipEntry(hero, otherId) {
  hero.relationships ||= [];
  let entry = hero.relationships.find((item) => item.heroId === otherId);
  if (!entry) {
    entry = { heroId: otherId, value: 0, lastReason: '' };
    hero.relationships.push(entry);
  }
  return entry;
}

export function adjustRelationshipInPlace(hero, otherId, delta, reason) {
  if (!hero || hero.id === otherId || !delta) return null;
  const entry = relationshipEntry(hero, otherId);
  const before = entry.value || 0;
  entry.value = clamp(before + delta, -100, 100);
  entry.lastReason = reason;
  return { heroId: hero.id, otherId, delta: entry.value - before, value: entry.value, reason };
}
