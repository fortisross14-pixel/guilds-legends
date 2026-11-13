// @ts-check
// Hero generation, XP and levels, relationships, party role ratings and estimates.
import { ULTIMATE_LEVEL, skillLabel, skillsUnlockedFor } from '../../data/skills.js';
import { CLASSES, normalizeClassId, FIRST_NAMES, PRIMAL_NAMES, FLAWS, HIDDEN_TRAITS, LAST_NAMES, ORIGINS, PERSONALITIES, DREAMS } from '../../data/content.js';
import { FORMATION_TYPES, PARTY_ROLES, formationForMission } from '../../data/formations.js';
import { LOCATION_BY_ID, PRIMAL_IDS, RARITIES, primalCombatModifier, primalDiplomacyModifier } from '../../data/world.js';
import { addHeroHistory, appointmentHolder, clamp, getHero, roomLevel, tallyHero, uid, pushMoment } from './core.js';
import { charterEstimate, charterOf, patronAtLeast } from './charter.js';
import { estimateBonus } from './reputation.js';

/** XP to the next level: level 2 comes after a fight or so, level 3 after a couple more; from 4 on it climbs steeply. */
/** The level cap (docs/design/STORY_DRAFT.md, Levels): the top guilds are 45–50. */
export const MAX_LEVEL = 60;

export function xpForNextLevel(level) {
  return level >= MAX_LEVEL ? 0 : Math.round(40 + 60 * level ** 1.6);
}

/** A training match is worth a fifth less than a wild fight (lives are at stake out there); a tournament bout the most. */
export const XP_KIND = { wild: 1, training: 0.8, tournament: 1.5 };

/**
 * How strong a fight was for the party: the foes' levels added up, shared by the
 * guild's fighters (4 + 4 + 3 against two fighters is 5.5).
 */
export function enemyStrength(enemyLevels, fighters) {
  return enemyLevels.reduce((sum, level) => sum + (level || 1), 0) / Math.max(1, fighters);
}

/**
 * Wild fights a hero needs for the next level against foes of that strength:
 * two when the strength is half a level under theirs, then about 1.65 times as
 * many per level further below (a 5.5 fight: 2 at level 6, 3-4 at 7, 5-6 at 8,
 * 9 at 9), never fewer than one for a fight above them. Casual: farming a little pays.
 */
export function fightsToLevel(heroLevel, strength) {
  return Math.max(0.75, 2 * 1.65 ** ((heroLevel || 1) - strength - 0.5));
}

/** One hero's XP from a won fight (`kind`: wild, training, tournament); half for a lost training match or bout. */
export function battleXp(hero, strength, kind = 'wild') {
  const needed = xpForNextLevel(hero.level);
  if (!needed) return 0;
  return Math.max(1, Math.round((needed / fightsToLevel(hero.level, strength)) * (XP_KIND[kind] || 1)));
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

/** A name that fits the element (src/data/content.js PRIMAL_NAMES), not already worn by a living hero or recruit. */
function heroName(state, rng, primal) {
  const pool = PRIMAL_NAMES[primal] || { first: FIRST_NAMES, last: LAST_NAMES };
  const taken = new Set([...(state?.heroes || []), ...(state?.candidates || []), ...(state?.freeAgents || []), ...(state?.rivals || []).flatMap((rival) => [rival.star, ...(rival.members || [])])].filter(Boolean).map((hero) => hero.name));
  let name = `${rng.pick(pool.first)} ${rng.pick(pool.last)}`;
  for (let tries = 0; tries < 12 && taken.has(name); tries += 1) name = `${rng.pick(pool.first)} ${rng.pick(pool.last)}`;
  return name;
}

export function choosePrimal(rng, locationId) {
  const locationPrimal = LOCATION_BY_ID[locationId]?.primal;
  // Most people share their town's element; the rest are drawn from all seven.
  if (locationPrimal && rng.chance(0.7)) return locationPrimal;
  return rng.pick(PRIMAL_IDS);
}

export function applyXpInPlace(hero, amount, state, source = 'experience') {
  if (!hero || hero.level >= MAX_LEVEL || amount <= 0) return [];
  const gains = [];
  const levelBefore = hero.level;
  const attributesBefore = { ...hero.attributes };
  hero.xp = (hero.xp || 0) + Math.round(amount);
  while (hero.level < MAX_LEVEL) {
    const needed = xpForNextLevel(hero.level);
    if (hero.xp < needed) break;
    hero.xp -= needed;
    hero.level += 1;
    if (state?.heroes?.includes(hero)) tallyHero(state, hero.id, 'levels');
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
  if (state && hero.guildId === 'player' && levelBefore < ULTIMATE_LEVEL && hero.level >= ULTIMATE_LEVEL && !hero.ultimate) {
    state.notifications.push({
      id: `ultimate-${hero.id}`,
      tone: 'purple',
      title: `${hero.name} can learn an ultimate`,
      text: 'Open their status and choose one of three ultimate skills.',
    });
  }
  if (state && gains.length && hero.guildId === 'player') {
    const statGains = Object.fromEntries(
      Object.keys(hero.attributes)
        .map((key) => [key, hero.attributes[key] - (attributesBefore[key] || 0)])
        .filter(([, delta]) => delta),
    );
    pushMoment(state, {
      type: 'levelUp',
      heroId: hero.id,
      name: hero.name,
      classId: hero.classId,
      levelBefore,
      levelAfter: hero.level,
      statGains,
      newSkills: skillsUnlockedFor({ ...hero, classId: normalizeClassId(hero.classId) }, levelBefore, hero.level).map((skill) => skillLabel(skill, hero.primal)),
    });
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
  const level = clamp(base.level || options.level || 1, 1, MAX_LEVEL);
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
    injuryWeeks: 0,
    salary: Math.max(12, Math.round((18 + level * 7 + Math.max(0, (base.potential || 70) - 70) * 0.45) * (RARITIES[rarity]?.salary || 1))),
    joinedYear: options.joinedYear ?? state.date.year,
    guildId: options.guildId || 'player',
    appointment: null,
    monthlyActivity: 'Rest',
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
    gear: base.gear || { weapon: null, armor: null, accessory: null },
    promises: base.promises || [],
    history: [],
  };
  return hero;
}

export function generateHero(state, rng, quality = 'normal', options = {}) {
  const locationId = options.homeLocationId || state.world?.currentLocationId || 'dunmere';
  const location = LOCATION_BY_ID[locationId];
  const scoutBonus = roomLevel(state, 'scouts') * 0.025;
  const qualityBonus = quality === 'elite' ? 0.24 : quality === 'veteran' ? 0.12 : 0;
  const rarity = options.rarity || rarityFromRoll(rng, scoutBonus + qualityBonus);
  const level = options.level || clamp(levelBandForRarity(rarity, rng, quality === 'veteran') + (options.levelOffset || 0), 1, 60);
  // Recruits reflect the guild: its charter draws certain classes, Temple friends bring clerics.
  const drawn = options.recruit ? [...(charterOf(state)?.recruitClasses || []), ...(patronAtLeast(state, 'temple', 'partner') ? ['Cleric'] : [])] : [];
  const classPool = (
    drawn.length && rng.chance(0.3) ? drawn : location?.specialties?.length && rng.chance(0.64) ? location.specialties : Object.keys(CLASSES)
  ).map(normalizeClassId);
  const classId = options.classId || rng.pick(classPool);
  const age = options.age ?? clamp(rng.int(17, 27) + Math.floor(level / 3) + (quality === 'veteran' ? 7 : 0), 16, 39);
  const powerBase = powerForLevel(level, rarity, rng);
  const rarityPotential = RARITIES[rarity]?.maxPotential || 72;
  const potential = clamp(powerBase + rng.int(5, 16), powerBase + 3, rarityPotential);
  const primal = options.primal || choosePrimal(rng, locationId);
  const name = options.name || heroName(state, rng, primal);
  return createHeroFromBase(
    {
      name,
      classId,
      age,
      level,
      rarity,
      primal,
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
  const mission = state.missions.find((item) => item.id === missionId);
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
  if (appointmentHolder(state, 'Questmaster')) partyPower += 2;
  if (formationType === 'Expedition') partyPower += roomLevel(state, 'scouts') * 2;
  if (formationType === 'Intrigue' && appointmentHolder(state, 'Spymaster')) partyPower += 5;
  if (formationType === 'Expedition' && breakdown.some((item) => item.role === 'Curator')) partyPower += mission.artifact ? 7 : 2;
  if (formationType === 'Combat' && !breakdown.some((item) => item.role === 'Combat Support') && mission.risk >= 3) partyPower -= 5;

  const difficultyModifier = state.settings.difficulty === 'Story' ? -6 : state.settings.difficulty === 'Harsh' ? 6 : 0;
  const delta = partyPower + estimateBonus(state, mission) - (mission.difficulty + difficultyModifier);
  // Charter: Scholars' Lodge is better at expeditions and investigations, worse in fights.
  const chance = clamp(Math.round(100 / (1 + Math.exp(-delta / 10))) + charterEstimate(state, formationType), 3, 97);
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
