// World generation: rival guilds, historic legends, title records, artifacts and the contract board.
import { MISSION_TEMPLATES, TIERS } from '../../data/content.js';
import { formationForMission } from '../../data/formations.js';
import { LOCATION_BY_ID, LOCATIONS, PRIMAL_IDS, unlockedLocations } from '../../data/world.js';
import {
  GUILD_BLUEPRINTS,
  GUILD_TOURNAMENT_DEFINITIONS,
  HISTORIC_LEGENDS,
  INDIVIDUAL_TOURNAMENT_DEFINITIONS,
  WORLD_ARTIFACT_SEEDS,
} from '../../data/universe.js';
import { clamp, clone, ensureTournamentCareer, tierIndexByName, uid } from './core.js';
import { createHeroFromBase, generateHero } from './heroes.js';

function createRival(blueprint, state, rng, index) {
  const tierIndex = clamp(blueprint.tierIndex ?? 0, 0, TIERS.length - 1);
  const quality = tierIndex === 2 ? 'elite' : tierIndex === 1 ? (rng.chance(0.72) ? 'elite' : 'veteran') : index < 2 ? 'veteran' : 'normal';
  const home = LOCATION_BY_ID[blueprint.homeLocationId] || LOCATION_BY_ID.dunmere;
  const guildId = `rival-${index}`;
  const starRoll = rng.next();
  const starRarity =
    tierIndex === 2
      ? starRoll < 0.75
        ? 'Legend'
        : 'Epic'
      : tierIndex === 1
        ? starRoll < 0.25
          ? 'Legend'
          : starRoll < 0.9
            ? 'Epic'
            : 'Rare'
        : starRoll < 0.08
          ? 'Legend'
          : starRoll < 0.7
            ? 'Epic'
            : 'Rare';
  const starLevel = tierIndex === 2 ? rng.int(14, 19) : tierIndex === 1 ? rng.int(9, 15) : rng.int(4, 10);
  const star = ensureTournamentCareer(
    generateHero(state, rng, quality, {
      guildId,
      homeLocationId: home.id,
      classId: blueprint.specialty,
      rarity: starRarity,
      level: starLevel,
      age: clamp(rng.int(20, 31) + Math.floor(starLevel / 5), 20, 38),
    }),
  );
  star.status = 'active';
  star.renown += 8 + tierIndex * 18 + rng.int(0, 15);
  star.legacy += 12 + tierIndex * 38 + rng.int(0, 28);
  star.specializations.tournament = rng.int(5, 11) + tierIndex * 2;
  star.hook = `${blueprint.name} built its public identity around ${star.name}, a ${star.rarity.toLowerCase()} ${star.classId.toLowerCase()} with a reputation for tournament pressure.`;

  const rosterSize = tierIndex === 2 ? rng.int(6, 8) : tierIndex === 1 ? rng.int(5, 7) : rng.int(4, 6);
  const members = [];
  for (let memberIndex = 1; memberIndex < rosterSize; memberIndex += 1) {
    const memberQuality = tierIndex === 2 ? (rng.chance(0.55) ? 'elite' : 'veteran') : tierIndex === 1 ? 'veteran' : 'normal';
    const member = ensureTournamentCareer(
      generateHero(state, rng, memberQuality, {
        guildId,
        homeLocationId: home.id,
        level: tierIndex === 2 ? rng.int(10, 17) : tierIndex === 1 ? rng.int(6, 13) : rng.int(2, 8),
      }),
    );
    member.status = 'active';
    member.specializations.tournament = rng.chance(0.18 + tierIndex * 0.05) ? rng.int(4, 10) : rng.int(0, 3);
    member.specializations.missions = rng.int(1, 7);
    members.push(member);
  }

  const fameBand = tierIndex === 2 ? [1100, 2600] : tierIndex === 1 ? [260, 1050] : [22, 220];
  const legacyBand = tierIndex === 2 ? [850, 2400] : tierIndex === 1 ? [180, 850] : [20, 280];
  const power = Math.round(
    [star, ...members]
      .sort((a, b) => b.power - a.power)
      .slice(0, 5)
      .reduce((sum, hero) => sum + hero.power, 0) / Math.min(5, rosterSize),
  );
  return {
    id: guildId,
    name: blueprint.name,
    motto: blueprint.motto,
    archetype: blueprint.archetype,
    color: blueprint.color,
    strategy: blueprint.strategy,
    risk: blueprint.risk,
    specialty: blueprint.specialty,
    homeLocationId: home.id,
    region: home.region,
    founded: state.date.year - rng.int(tierIndex === 2 ? 45 : 3, tierIndex === 2 ? 180 : tierIndex === 1 ? 110 : 70),
    fame: rng.int(...fameBand),
    legacy: rng.int(...legacyBand),
    crowns: rng.int(900 + tierIndex * 1800, 3800 + tierIndex * 5200),
    tierIndex,
    leagueTierIndex: tierIndex,
    form: rng.int(45, 82),
    power,
    wins: rng.int(4 + tierIndex * 12, 20 + tierIndex * 32),
    losses: rng.int(2, 14 + tierIndex * 8),
    titles: rng.int(tierIndex, 2 + tierIndex * 4),
    prizeMoney: rng.int(tierIndex * 800, 1800 + tierIndex * 8000),
    seasonPoints: rng.int(10, 90) + tierIndex * 75,
    careerPoints: rng.int(40, 280) + tierIndex * 480,
    hostility: rng.int(5, 45),
    relationship: 0,
    star,
    members,
    recent: [],
    fallen: false,
  };
}

function createHistoricHero(base, state, rng) {
  const hero = ensureTournamentCareer(
    createHeroFromBase(
      {
        id: base.id,
        name: base.name,
        classId: base.classId,
        primal: base.primal,
        rarity: base.rarity,
        level: base.level,
        age: base.age,
        power: base.peakPower,
        potential: base.peakPower,
        personality: 'Driven',
        flaw: 'Pride',
        dream: 'Become champion',
        origin: `${base.guildName} legend`,
        loyalty: 70,
        hook: `${base.name} is remembered as one of the defining tournament figures before the Broken Lantern was restored.`,
        hiddenTrait: 'Legendary lineage',
      },
      state,
      rng,
      { guildId: `historic-${base.guildName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` },
    ),
  );
  hero.status = base.status;
  hero.renown = base.renown;
  hero.legacy = base.legacy;
  hero.guildName = base.guildName;
  hero.career.tournaments = base.titles * 4 + 4;
  hero.career.individualTournaments = hero.career.tournaments;
  hero.career.titles = base.titles;
  hero.career.individualTitles = base.titles;
  hero.career.tournamentBouts = base.titles * 12 + 18;
  hero.career.tournamentBoutWins = base.titles * 9 + 11;
  hero.career.prizeMoney = base.prizeMoney;
  hero.career.tournamentFame = Math.round(base.renown * 0.72);
  hero.career.bestTournamentFinish = 1;
  hero.career.peakPower = base.peakPower;
  hero.specializations.tournament = 12;
  hero.history = [
    {
      year: 1186,
      month: 11,
      date: 'Before the campaign',
      type: 'legacy',
      title: `${base.titles} major titles`,
      text: `${base.name} entered the historical record with ${base.prizeMoney} crowns in prize money and a peak power of ${base.peakPower}.`,
    },
  ];
  return hero;
}

export function createTitleRecords() {
  return Object.fromEntries([
    ...INDIVIDUAL_TOURNAMENT_DEFINITIONS.map((definition) => [
      definition.id,
      {
        id: definition.id,
        name: definition.name,
        kind: 'individual',
        circuit: definition.circuit,
        locationId: definition.locationId,
        recordHolderName: definition.record.name,
        recordWins: definition.record.wins,
        winners: definition.record.years.map((year) => ({
          year,
          heroId: null,
          heroName: definition.record.name,
          guildName: 'Historical record',
          player: false,
        })),
        winsByHero: { [`historic:${definition.record.name}`]: definition.record.wins },
      },
    ]),
    ...GUILD_TOURNAMENT_DEFINITIONS.map((definition) => [
      definition.id,
      {
        id: definition.id,
        name: definition.name,
        kind: 'guild',
        circuit: definition.circuit,
        locationId: definition.locationId,
        recordHolderName: definition.record.name,
        recordWins: definition.record.wins,
        winners: [],
        winsByGuild: { [`historic:${definition.record.name}`]: definition.record.wins },
      },
    ]),
  ]);
}

export function createWorldArtifactsInPlace(state, rng) {
  state.worldArtifacts = WORLD_ARTIFACT_SEEDS.map((seed, index) => {
    const rival = state.rivals[(index * 5 + 3) % state.rivals.length];
    const owner = index % 2 === 0 ? rival.star : rival.members[index % Math.max(1, rival.members.length)];
    if (owner) {
      owner.career.artifacts += 1;
      owner.career.artifactPrestige += seed.prestige;
    }
    return {
      id: `world-artifact-${index}`,
      name: seed.name,
      prestige: seed.prestige,
      legend: seed.legend,
      ownerId: owner?.id || null,
      ownerGuildId: rival.id,
      discoveredYear: state.date.year - rng.int(8, 90),
      history: [
        { year: state.date.year - rng.int(8, 90), ownerId: owner?.id || null, ownerName: owner?.name || rival.name, guildId: rival.id, guildName: rival.name },
      ],
    };
  });
}

export function createUniverseInPlace(state, rng) {
  state.rivals = GUILD_BLUEPRINTS.map((blueprint, index) => createRival(blueprint, state, rng, index));
  state.worldHistoricHeroes = HISTORIC_LEGENDS.map((legend) => createHistoricHero(legend, state, rng));
  state.freeAgents = [];
  const freeAgentCount = 22;
  for (let index = 0; index < freeAgentCount; index += 1) {
    const location = LOCATIONS[index % LOCATIONS.length];
    const quality = index < 2 ? 'elite' : index < 8 ? 'veteran' : 'normal';
    const hero = ensureTournamentCareer(generateHero(state, rng, quality, { guildId: null, homeLocationId: location.id }));
    hero.status = 'free-agent';
    hero.guildId = null;
    hero.specializations.tournament = rng.chance(0.32) ? rng.int(5, 11) : rng.int(0, 3);
    hero.hook = `${hero.name} competes without a permanent banner and may become known through the open tournament circuit.`;
    state.freeAgents.push(hero);
  }
  state.titleRecords = createTitleRecords();
  createWorldArtifactsInPlace(state, rng);
  state.universeStats = { individualTournamentsResolved: 0, guildTournamentsResolved: 0, boutsResolved: 0, seasonsSimulated: 0 };
}

function availableTemplatePool(state, location = null) {
  const currentTier = state.guild.tierIndex;
  const eligible = MISSION_TEMPLATES.filter((template) => tierIndexByName(template.tier) <= currentTier);
  if (!location) return eligible;
  const regional = eligible.filter((template) => template.region === location.region);
  return regional.length ? regional : eligible;
}

function instantiateMission(template, state, rng, forcedLocation = null) {
  const location = forcedLocation || LOCATION_BY_ID[state.world?.currentLocationId] || LOCATIONS[0];
  const rewardVariance = rng.int(template.reward[0], template.reward[1]) + tierIndexByName(location.tier) * 80;
  const fameVariance = rng.int(template.fame[0], template.fame[1]) + tierIndexByName(location.tier) * 2;
  const issuerNames = [
    `${location.name} Council`,
    `${location.name} Temple`,
    `${location.name} Trade House`,
    `${location.name} Watch`,
    'Anonymous petitioner',
    'A local noble house',
  ];
  const approach = template.approach || formationForMission(template);
  const openingDunmere = state.date.year <= 1188 && location.id === 'dunmere';
  const enemyPrimal = rng.chance(openingDunmere ? 0.42 : 0.58) ? location.primal : rng.pick(PRIMAL_IDS);
  const patronPrimal = rng.chance(openingDunmere ? 0.6 : 0.72) ? location.primal : rng.pick(PRIMAL_IDS);
  return {
    id: uid('mission', rng),
    templateId: template.id,
    title: template.id === 'wolves-old-road' ? template.title : `${template.title}`,
    family: template.family,
    tier: template.tier,
    region: location.region,
    locationId: location.id,
    locationName: location.name,
    risk: template.risk,
    duration: template.duration,
    difficulty: clamp(template.difficulty + rng.int(-4, 5) + tierIndexByName(location.tier) * 2, 30, 99),
    reward: rewardVariance,
    fame: fameVariance,
    roles: [...template.roles],
    approach,
    brief: `${template.brief} The contract originates in ${location.name}, a ${location.primal.toLowerCase()}-aligned settlement.`,
    stakes: template.stakes,
    choice: clone(template.choice),
    saga: template.saga || null,
    artifact: template.artifact || null,
    tournament: Boolean(template.tournament),
    issuer: rng.pick(issuerNames),
    enemyPrimal,
    patronPrimal,
    availableUntil: { year: state.date.year + (state.date.month >= 9 ? 1 : 0), month: (state.date.month + rng.int(2, 5)) % 12 },
    inspected: false,
  };
}

export function refreshMissionsInPlace(state, rng, initial = false) {
  const currentYearMonth = state.date.year * 12 + state.date.month;
  state.missions = (state.missions || []).filter((mission) => {
    if (mission.templateId === 'wolves-old-road' && !state.tutorial.completed && state.tutorial.step < 4) return true;
    const expiry = mission.availableUntil.year * 12 + mission.availableUntil.month;
    return expiry >= currentYearMonth;
  });
  const locations = unlockedLocations(state.guild.tierIndex);
  if (initial && !state.missions.some((mission) => mission.templateId === 'wolves-old-road')) {
    const tutorialTemplate = MISSION_TEMPLATES.find((mission) => mission.id === 'wolves-old-road');
    state.missions.push(instantiateMission(tutorialTemplate, state, rng, LOCATION_BY_ID.dunmere));
  }
  locations.forEach((location) => {
    const desired = location.id === state.world?.currentLocationId ? 5 : 3;
    let count = state.missions.filter((mission) => mission.locationId === location.id).length;
    const pool = availableTemplatePool(state, location);
    let safety = 0;
    while (count < desired && safety < 40 && pool.length) {
      safety += 1;
      const template = rng.pick(pool);
      const duplicateCount = state.missions.filter((mission) => mission.locationId === location.id && mission.templateId === template.id).length;
      if (duplicateCount >= 1 && pool.length > desired) continue;
      state.missions.push(instantiateMission(template, state, rng, location));
      count += 1;
    }
  });
  const unlockedIds = new Set(locations.map((location) => location.id));
  state.missions = state.missions.filter((mission) => unlockedIds.has(mission.locationId || 'dunmere')).slice(0, 70);
}
