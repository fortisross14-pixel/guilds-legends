import { primalDiplomacyModifier } from '../data/world.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const clone = (value) => (typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value)));

function hashString(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function random(game, salt = '') {
  game.rngStep = (game.rngStep || 0) + 1;
  let state = (game.seed ^ hashString(`${game.turn}:${game.rngStep}:${salt}`)) >>> 0;
  state += 0x6d2b79f5;
  let t = state;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function randomInt(game, min, max, salt = '') {
  return Math.floor(random(game, salt) * (max - min + 1)) + min;
}

function attr(hero, key, fallback = 50) {
  return Number(hero?.attributes?.[key] ?? fallback);
}

function heroSnapshot(hero, role = null) {
  return {
    id: hero.id,
    name: hero.name,
    classId: hero.classId,
    primal: hero.primal,
    rarity: hero.rarity,
    level: hero.level || 1,
    power: hero.power || 50,
    personality: hero.personality,
    flaw: hero.flaw,
    dream: hero.dream,
    role,
    attributes: { ...(hero.attributes || {}) },
  };
}

export const MISSION_GAME_ACTIONS = {
  Diplomacy: [
    { id: 'listen', label: 'Listen & Probe', icon: '◇', hint: 'Learn what actually matters. Builds insight and usually improves trust.' },
    { id: 'appeal', label: 'Make the Case', icon: '♛', hint: 'Use presence and cultural affinity to move the room toward agreement.' },
    { id: 'evidence', label: 'Present Evidence', icon: '▤', hint: 'Turn insight and preparation into a hard argument.' },
    {
      id: 'concede',
      label: 'Offer Concession',
      icon: '⚖',
      hint: 'Give something away to gain trust and agreement. Too many concessions weaken the final result.',
    },
    { id: 'pressure', label: 'Apply Pressure', icon: '▲', hint: 'Force movement quickly, but risk destroying trust.' },
  ],
  Expedition: [
    { id: 'survey', label: 'Survey Route', icon: '⌖', hint: 'Steady progress, clues and low exposure.' },
    { id: 'push', label: 'Push Forward', icon: '➶', hint: 'Cover ground quickly at the cost of supplies and hazard.' },
    { id: 'search', label: 'Search Thoroughly', icon: '◇', hint: 'Build evidence and discovery quality instead of raw distance.' },
    { id: 'verify', label: 'Verify Discovery', icon: '▤', hint: 'Curators and scholars turn evidence into certainty or artifact authenticity.' },
    { id: 'camp', label: 'Make Camp', icon: '✚', hint: 'Reduce hazard and reorganize, sacrificing tempo.' },
  ],
  Intrigue: [
    { id: 'observe', label: 'Observe', icon: '◉', hint: 'Learn patrols, habits and vulnerabilities while keeping Heat low.' },
    { id: 'infiltrate', label: 'Infiltrate', icon: '◈', hint: 'Make direct objective progress, but exposure rises.' },
    { id: 'distract', label: 'Create Distraction', icon: '♫', hint: 'Reduce Heat and create a small opening.' },
    { id: 'exploit', label: 'Exploit Intel', icon: '✦', hint: 'Spend gathered intel for a major objective push.' },
    { id: 'extract', label: 'Extract', icon: '➶', hint: 'Attempt to leave with the objective once enough progress has been made.' },
  ],
};

export const PERSONALITY_GAME_NOTES = {
  Brave: 'Excels when pressing the issue or accepting danger.',
  Vain: 'Performs better when taking center stage, but can create extra risk.',
  Patient: 'Excels at listening, observing and careful surveying.',
  Jealous: 'Can push hard when another hero shines, but relationships may suffer.',
  Merciful: 'Builds trust through appeals and restraint.',
  Obsessive: 'Excellent at searches, verification and exploiting a discovered thread.',
  Cautious: 'Reduces hazard and Heat; dislikes reckless tempo.',
  Witty: 'Creates openings in negotiation and covert distractions.',
  Honorable: 'Strong when presenting evidence or making a principled case; uncomfortable with covert shortcuts.',
  Restless: 'Thrives on forward movement and infiltration, but gets little from waiting.',
};

function personalityModifier(hero, gameType, actionId) {
  const table = {
    Brave: { Diplomacy: { pressure: 4 }, Expedition: { push: 4 }, Intrigue: { infiltrate: 3 } },
    Vain: { Diplomacy: { appeal: 3, pressure: 2 }, Expedition: { push: 2 }, Intrigue: { infiltrate: 2 } },
    Patient: { Diplomacy: { listen: 5, evidence: 2 }, Expedition: { survey: 5, search: 3 }, Intrigue: { observe: 5 } },
    Jealous: { Diplomacy: { pressure: 2 }, Expedition: { push: 2 }, Intrigue: { exploit: 2 } },
    Merciful: { Diplomacy: { appeal: 5, concede: 3 }, Expedition: { camp: 3 }, Intrigue: { distract: 2 } },
    Obsessive: { Diplomacy: { evidence: 4 }, Expedition: { search: 5, verify: 5 }, Intrigue: { exploit: 5 } },
    Cautious: { Diplomacy: { listen: 4 }, Expedition: { survey: 4, camp: 5 }, Intrigue: { observe: 4, distract: 3 } },
    Witty: { Diplomacy: { appeal: 4 }, Expedition: { search: 2 }, Intrigue: { distract: 5 } },
    Honorable: { Diplomacy: { appeal: 4, evidence: 4 }, Expedition: { verify: 3 }, Intrigue: { observe: 2, infiltrate: -2 } },
    Restless: { Diplomacy: { pressure: 3, listen: -2 }, Expedition: { push: 5, camp: -3 }, Intrigue: { infiltrate: 4, observe: -2 } },
  };
  return table[hero?.personality]?.[gameType]?.[actionId] || 0;
}

function flawModifier(hero, gameType, actionId) {
  const table = {
    Cowardice: { Diplomacy: { pressure: -4 }, Expedition: { push: -4 }, Intrigue: { infiltrate: -4 } },
    Greed: { Diplomacy: { concede: -3, pressure: 2 }, Expedition: { search: 2, verify: -2 }, Intrigue: { exploit: 2 } },
    Arrogance: { Diplomacy: { listen: -4, pressure: 2 }, Expedition: { survey: -2 }, Intrigue: { observe: -2 } },
    'Divided loyalty': { Diplomacy: { evidence: -2 }, Expedition: { verify: -2 }, Intrigue: { extract: -3 } },
    Recklessness: { Diplomacy: { pressure: 3 }, Expedition: { push: 3, camp: -3 }, Intrigue: { infiltrate: 3, observe: -2 } },
    Pride: { Diplomacy: { concede: -5, appeal: 2 }, Expedition: { camp: -2 }, Intrigue: { distract: -2 } },
    Superstition: { Expedition: { verify: -3, search: 2 }, Intrigue: { observe: -2 } },
    Melancholy: { Diplomacy: { appeal: -2 }, Expedition: { push: -2 }, Intrigue: { distract: -2 } },
    Addiction: { Diplomacy: { listen: -2 }, Expedition: { camp: -2 }, Intrigue: { observe: -2 } },
  };
  return table[hero?.flaw]?.[gameType]?.[actionId] || 0;
}

function roleBonus(hero, gameType) {
  const role = hero?.role;
  if (gameType === 'Diplomacy') {
    if (role === 'Negotiation Lead') return 6;
    if (role === 'Strategist') return 4;
    if (role === 'Advocate') return 4;
    return 0;
  }
  if (gameType === 'Expedition') {
    if (role === 'Expedition Lead') return 5;
    if (role === 'Searcher') return 5;
    if (role === 'Curator') return 6;
    if (role === 'Field Support') return 3;
    return 0;
  }
  if (role === 'Mastermind') return 6;
  if (role === 'Infiltrator') return 5;
  if (role === 'Lookout') return 4;
  if (role === 'Extraction') return 4;
  return 0;
}

function skillFor(hero, gameType, actionId, patronPrimal = null) {
  if (!hero) return 40;
  let skill = hero.power * 0.18 + (hero.level || 1) * 1.35 + roleBonus(hero, gameType);
  if (gameType === 'Diplomacy') {
    const actionWeights = {
      listen: ['Mind', 'Presence'],
      appeal: ['Presence', 'Spirit'],
      evidence: ['Mind', 'Presence'],
      concede: ['Spirit', 'Presence'],
      pressure: ['Presence', 'Might'],
    };
    const [a, b] = actionWeights[actionId] || ['Presence', 'Mind'];
    skill += attr(hero, a) * 0.42 + attr(hero, b) * 0.22;
    skill += primalDiplomacyModifier(hero.primal, patronPrimal) * 0.55;
  } else if (gameType === 'Expedition') {
    const actionWeights = {
      survey: ['Mind', 'Finesse'],
      push: ['Endurance', 'Might'],
      search: ['Finesse', 'Mind'],
      verify: ['Mind', 'Spirit'],
      camp: ['Endurance', 'Spirit'],
    };
    const [a, b] = actionWeights[actionId] || ['Mind', 'Finesse'];
    skill += attr(hero, a) * 0.4 + attr(hero, b) * 0.24;
  } else {
    const actionWeights = {
      observe: ['Mind', 'Finesse'],
      infiltrate: ['Finesse', 'Mind'],
      distract: ['Presence', 'Finesse'],
      exploit: ['Mind', 'Finesse'],
      extract: ['Endurance', 'Finesse'],
    };
    const [a, b] = actionWeights[actionId] || ['Finesse', 'Mind'];
    skill += attr(hero, a) * 0.4 + attr(hero, b) * 0.24;
  }
  skill += personalityModifier(hero, gameType, actionId) + flawModifier(hero, gameType, actionId);
  return skill;
}

function addLog(game, text, tone = 'neutral') {
  game.log.unshift({ turn: game.turn, text, tone });
  game.log = game.log.slice(0, 16);
}

function dispositionForMission(mission, seed) {
  const values = ['Honor', 'Security', 'Prosperity', 'Tradition', 'Mercy', 'Prestige'];
  return values[(seed + (mission.difficulty || 0)) % values.length];
}

export function createMissionGame({ mission, playerHeroes, seed }) {
  const gameType = mission.formationType;
  if (!['Diplomacy', 'Expedition', 'Intrigue'].includes(gameType)) return null;
  const roster = playerHeroes.map(({ hero, role }) => heroSnapshot(hero, role));
  const common = {
    id: `mission-game-${mission.id}`,
    sourceId: mission.id,
    sourceType: 'mission',
    type: gameType,
    title: mission.title,
    family: mission.family,
    locationName: mission.locationName,
    seed: seed >>> 0,
    rngStep: 0,
    turn: 1,
    status: 'active',
    difficulty: mission.difficulty,
    risk: mission.risk,
    patronPrimal: mission.patronPrimal,
    enemyPrimal: mission.enemyPrimal,
    roster,
    leadHeroId: roster[0]?.id || null,
    log: [],
    result: null,
    rewardModifier: 1,
  };

  if (gameType === 'Diplomacy') {
    const cultural = roster.reduce((sum, hero) => sum + primalDiplomacyModifier(hero.primal, mission.patronPrimal), 0) / Math.max(1, roster.length);
    common.maxTurns = 8;
    common.disposition = dispositionForMission(mission, seed);
    common.metrics = {
      agreement: 0,
      trust: clamp(Math.round(38 + cultural * 0.45 + roster.filter((hero) => ['Negotiation Lead', 'Advocate'].includes(hero.role)).length * 3), 22, 62),
      insight: 0,
      patience: 8,
      concessions: 0,
    };
    addLog(
      common,
      `The delegation enters the room. The other side values ${common.disposition.toLowerCase()}, but its exact priorities are still unclear.`,
      'blue',
    );
  } else if (gameType === 'Expedition') {
    common.maxTurns = 10;
    common.requiresVerification = Boolean(mission.artifact || ['Investigation', 'Legend Quest', 'Artifact Hunt'].includes(mission.family));
    common.metrics = { progress: 0, evidence: 0, certainty: 0, supplies: 100, hazard: clamp(8 + mission.risk * 5, 8, 32) };
    addLog(common, `${mission.stakes || 'The route ahead is uncertain.'} Supplies are counted and the first bearings are taken.`, 'blue');
  } else {
    common.maxTurns = 9;
    common.metrics = { progress: 0, heat: clamp(8 + mission.risk * 4, 8, 28), intel: 0, exitReady: false };
    addLog(common, 'The cell begins outside the protected boundary. The objective is possible, but every visible mistake will raise Heat.', 'blue');
  }
  return common;
}

function resolveDiplomacy(game, actionId, hero) {
  const m = game.metrics;
  const skill = skillFor(hero, 'Diplomacy', actionId, game.patronPrimal);
  const margin = skill - game.difficulty + randomInt(game, -10, 10, actionId);
  const quality = clamp(Math.round(8 + margin * 0.2), 2, 22);
  m.patience -= 1;
  if (actionId === 'listen') {
    const insight = clamp(12 + Math.round(quality * 0.75), 8, 28);
    m.insight = clamp(m.insight + insight, 0, 100);
    m.trust = clamp(m.trust + 3 + Math.round(Math.max(0, margin) / 15), 0, 100);
    m.agreement = clamp(m.agreement + 2 + Math.round(quality / 5), 0, 120);
    addLog(game, `${hero.name} listens for leverage and contradictions. Insight +${insight}; trust improves.`, 'green');
  } else if (actionId === 'appeal') {
    const insightBonus = Math.round(m.insight * 0.06);
    const gain = clamp(quality + insightBonus, 5, 28);
    m.agreement = clamp(m.agreement + gain, 0, 120);
    m.trust = clamp(m.trust + (margin >= 0 ? 3 : -3), 0, 100);
    addLog(
      game,
      `${hero.name} makes the guild’s case. Agreement +${gain}${margin < 0 ? ', but the argument strains trust.' : '.'}`,
      margin >= 0 ? 'green' : 'gold',
    );
  } else if (actionId === 'evidence') {
    const preparation = Math.round(m.insight * 0.12);
    const gain = clamp(5 + quality + preparation, 5, 34);
    m.agreement = clamp(m.agreement + gain, 0, 120);
    m.trust = clamp(m.trust + (m.insight >= 25 ? 4 : -2), 0, 100);
    m.insight = clamp(m.insight - 8, 0, 100);
    addLog(game, `${hero.name} turns preparation into a concrete argument. Agreement +${gain}.`, 'green');
  } else if (actionId === 'concede') {
    const gain = clamp(13 + Math.round(skill / 18), 13, 22);
    m.agreement = clamp(m.agreement + gain, 0, 120);
    m.trust = clamp(m.trust + 8, 0, 100);
    m.concessions += 1;
    game.rewardModifier = Math.max(0.6, game.rewardModifier - 0.1);
    addLog(game, `${hero.name} offers a real concession. The room warms, but the guild gives up value.`, 'gold');
  } else if (actionId === 'pressure') {
    const gain = clamp(11 + quality, 8, 32);
    m.agreement = clamp(m.agreement + gain, 0, 120);
    const trustLoss = margin >= 5 ? 5 : 10 + Math.round(Math.max(0, -margin) / 4);
    m.trust = clamp(m.trust - trustLoss, 0, 100);
    addLog(game, `${hero.name} applies pressure. Agreement +${gain}, trust -${trustLoss}.`, m.trust < 20 ? 'red' : 'gold');
  }

  if (m.agreement >= 100 && m.trust > 0) game.status = 'won';
  else if (m.trust <= 0 || m.patience <= 0 || game.turn >= game.maxTurns) game.status = m.agreement >= 72 ? 'partial' : 'lost';
}

function resolveExpedition(game, actionId, hero) {
  const m = game.metrics;
  const skill = skillFor(hero, 'Expedition', actionId);
  const margin = skill - game.difficulty + randomInt(game, -11, 11, actionId);
  const quality = clamp(Math.round(8 + margin * 0.19), 2, 22);
  if (actionId === 'survey') {
    const progress = clamp(9 + Math.round(quality * 0.55), 8, 22);
    const evidence = clamp(5 + Math.round(quality * 0.45), 4, 16);
    m.progress = clamp(m.progress + progress, 0, 120);
    m.evidence = clamp(m.evidence + evidence, 0, 100);
    m.supplies -= 6;
    m.hazard = clamp(m.hazard + (margin < -3 ? 5 : -2), 0, 100);
    addLog(game, `${hero.name} surveys the route: progress +${progress}, evidence +${evidence}.`, 'green');
  } else if (actionId === 'push') {
    const progress = clamp(18 + quality, 16, 38);
    m.progress = clamp(m.progress + progress, 0, 120);
    m.supplies -= 14;
    const hazard = clamp(7 + Math.round(Math.max(0, 6 - margin) / 2), 5, 17);
    m.hazard = clamp(m.hazard + hazard, 0, 100);
    addLog(game, `${hero.name} forces the pace: progress +${progress}, hazard +${hazard}.`, hazard >= 12 ? 'red' : 'gold');
  } else if (actionId === 'search') {
    const evidence = clamp(14 + quality, 12, 34);
    const progress = clamp(6 + Math.round(quality * 0.45), 5, 16);
    m.evidence = clamp(m.evidence + evidence, 0, 100);
    m.progress = clamp(m.progress + progress, 0, 120);
    m.supplies -= 9;
    m.hazard = clamp(m.hazard + (margin < 0 ? 4 : 1), 0, 100);
    addLog(game, `${hero.name} searches thoroughly: evidence +${evidence}, progress +${progress}.`, 'green');
  } else if (actionId === 'verify') {
    const evidenceBonus = Math.round(m.evidence * 0.12);
    const certainty = clamp(8 + quality + evidenceBonus, 6, 36);
    m.certainty = clamp(m.certainty + certainty, 0, 100);
    m.progress = clamp(m.progress + 4, 0, 120);
    m.supplies -= 5;
    addLog(game, `${hero.name} verifies what the company has found. Certainty +${certainty}.`, 'purple');
  } else if (actionId === 'camp') {
    const reduced = clamp(14 + Math.round(quality * 0.45), 12, 28);
    m.hazard = clamp(m.hazard - reduced, 0, 100);
    m.supplies -= 4;
    m.evidence = clamp(m.evidence + 2, 0, 100);
    addLog(game, `${hero.name} orders a careful camp. Hazard -${reduced}; the company gives up momentum.`, 'blue');
  }
  m.supplies = clamp(m.supplies, 0, 100);
  if (m.progress >= 100) game.status = 'won';
  else if (m.supplies <= 0 || m.hazard >= 100 || game.turn >= game.maxTurns) game.status = m.progress >= 70 ? 'partial' : 'lost';
}

function resolveIntrigue(game, actionId, hero) {
  const m = game.metrics;
  const skill = skillFor(hero, 'Intrigue', actionId);
  const margin = skill - game.difficulty + randomInt(game, -12, 12, actionId);
  const quality = clamp(Math.round(8 + margin * 0.2), 2, 23);
  if (actionId === 'observe') {
    const intel = clamp(13 + quality, 12, 34);
    m.intel = clamp(m.intel + intel, 0, 100);
    m.heat = clamp(m.heat - 3 + (margin < -5 ? 4 : 0), 0, 100);
    addLog(game, `${hero.name} observes the pattern of guards and witnesses. Intel +${intel}.`, 'green');
  } else if (actionId === 'infiltrate') {
    const progress = clamp(14 + quality, 12, 36);
    const heat = clamp(8 + Math.round(Math.max(0, 5 - margin) / 2), 6, 18);
    m.progress = clamp(m.progress + progress, 0, 120);
    m.heat = clamp(m.heat + heat, 0, 100);
    addLog(game, `${hero.name} crosses the boundary: progress +${progress}, Heat +${heat}.`, heat >= 13 ? 'red' : 'gold');
  } else if (actionId === 'distract') {
    const reduced = clamp(11 + quality, 10, 28);
    m.heat = clamp(m.heat - reduced, 0, 100);
    m.progress = clamp(m.progress + 3, 0, 120);
    addLog(game, `${hero.name} creates a believable distraction. Heat -${reduced}.`, 'blue');
  } else if (actionId === 'exploit') {
    if (m.intel < 15) {
      m.heat = clamp(m.heat + 6, 0, 100);
      addLog(game, `${hero.name} tries to exploit a weak theory without enough intel. Heat rises.`, 'red');
    } else {
      const progress = clamp(18 + quality + Math.round(m.intel * 0.08), 18, 42);
      m.progress = clamp(m.progress + progress, 0, 120);
      m.intel = clamp(m.intel - 15, 0, 100);
      m.heat = clamp(m.heat + 6, 0, 100);
      addLog(game, `${hero.name} exploits gathered intel: progress +${progress}.`, 'purple');
    }
  } else if (actionId === 'extract') {
    if (m.progress < 70) {
      m.heat = clamp(m.heat + 10, 0, 100);
      addLog(game, `${hero.name} attempts extraction before the objective is secure. The move draws attention.`, 'red');
    } else {
      const exitScore = skill + m.progress * 0.32 + m.intel * 0.12 - m.heat * 0.35 - game.difficulty + randomInt(game, -12, 12, 'extract');
      if (exitScore >= 8 || m.progress >= 105) {
        m.exitReady = true;
        game.status = 'won';
        addLog(game, `${hero.name} gets the cell and its prize out cleanly.`, 'green');
      } else {
        m.heat = clamp(m.heat + 18, 0, 100);
        addLog(game, `${hero.name} reaches for the exit, but the cordon tightens. Heat surges.`, 'red');
      }
    }
  }
  if (m.heat >= 100) game.status = m.progress >= 70 ? 'partial' : 'lost';
  else if (game.turn >= game.maxTurns && game.status === 'active') game.status = m.progress >= 70 ? 'partial' : 'lost';
}

function finalizeResult(game) {
  if (game.status === 'active') return;
  const grade = missionGradeFromMissionGame(game);
  game.result = {
    grade,
    won: ['won'].includes(game.status),
    partial: game.status === 'partial',
    turns: game.turn,
    rewardModifier: Number(game.rewardModifier.toFixed(2)),
    metrics: { ...game.metrics },
    log: game.log.slice(0, 10),
    performance: missionGamePerformance(game),
  };
}

export function performMissionGameAction(gameInput, actionId, leadHeroId = null) {
  const game = clone(gameInput);
  if (!game || game.status !== 'active') return { game: gameInput, error: 'This mission encounter is already resolved.' };
  const action = MISSION_GAME_ACTIONS[game.type]?.find((item) => item.id === actionId);
  if (!action) return { game: gameInput, error: 'Unknown mission action.' };
  const hero = game.roster.find((item) => item.id === leadHeroId) || game.roster.find((item) => item.id === game.leadHeroId) || game.roster[0];
  if (!hero) return { game: gameInput, error: 'No hero can lead this action.' };
  game.leadHeroId = hero.id;

  if (game.type === 'Diplomacy') resolveDiplomacy(game, actionId, hero);
  else if (game.type === 'Expedition') resolveExpedition(game, actionId, hero);
  else resolveIntrigue(game, actionId, hero);

  if (game.status === 'active') game.turn += 1;
  finalizeResult(game);
  return { game, error: null };
}

export function missionGamePerformance(game) {
  if (!game) return 0;
  const m = game.metrics || {};
  if (game.type === 'Diplomacy') return Math.round((m.agreement || 0) + (m.trust || 0) * 0.42 + (m.insight || 0) * 0.08 - (m.concessions || 0) * 8);
  if (game.type === 'Expedition')
    return Math.round((m.progress || 0) + (m.evidence || 0) * 0.18 + (m.certainty || 0) * 0.28 + (m.supplies || 0) * 0.08 - (m.hazard || 0) * 0.22);
  return Math.round((m.progress || 0) + (m.intel || 0) * 0.16 + (100 - (m.heat || 100)) * 0.28 + (m.exitReady ? 18 : 0));
}

export function missionGradeFromMissionGame(game) {
  const perf = missionGamePerformance(game);
  if (game.status === 'lost') return perf >= 72 ? 'Defeat' : 'Catastrophic';
  if (game.status === 'partial') return 'Partial';
  if (game.type === 'Diplomacy') {
    if (perf >= 145 && game.metrics.concessions === 0) return 'Legendary';
    if (perf >= 126) return 'Great Success';
    return 'Success';
  }
  if (game.type === 'Expedition') {
    if (perf >= 145 && (!game.requiresVerification || game.metrics.certainty >= 70)) return 'Legendary';
    if (perf >= 124 && (!game.requiresVerification || game.metrics.certainty >= 45)) return 'Great Success';
    if (game.requiresVerification && game.metrics.certainty < 25) return 'Partial';
    return 'Success';
  }
  if (perf >= 145 && game.metrics.heat <= 25) return 'Legendary';
  if (perf >= 124 && game.metrics.heat <= 45) return 'Great Success';
  return 'Success';
}

function chooseAutoAction(game) {
  const m = game.metrics;
  if (game.type === 'Diplomacy') {
    if (m.trust < 18) return 'concede';
    if (m.insight < 24) return 'listen';
    if (m.agreement >= 72 && m.trust >= 38) return 'evidence';
    if (m.patience <= 2) return m.trust >= 30 ? 'pressure' : 'concede';
    return m.insight >= 35 ? 'evidence' : 'appeal';
  }
  if (game.type === 'Expedition') {
    if (m.hazard >= 65) return 'camp';
    if (game.requiresVerification && m.progress >= 60 && m.certainty < 45 && m.evidence >= 25) return 'verify';
    if (m.evidence < 25) return 'search';
    if (m.supplies <= 28) return m.progress >= 72 ? 'push' : 'survey';
    return m.progress < 65 ? 'survey' : 'push';
  }
  if (m.progress >= 78 && m.heat < 75) return 'extract';
  if (m.heat >= 62) return 'distract';
  if (m.intel < 24) return 'observe';
  if (m.intel >= 35) return 'exploit';
  return 'infiltrate';
}

function bestLeadForAction(game, actionId) {
  return (
    [...game.roster].sort((a, b) => skillFor(b, game.type, actionId, game.patronPrimal) - skillFor(a, game.type, actionId, game.patronPrimal))[0]?.id ||
    game.leadHeroId
  );
}

export function autoResolveMissionGame(gameInput) {
  let game = clone(gameInput);
  let guard = 0;
  while (game.status === 'active' && guard < 20) {
    const actionId = chooseAutoAction(game);
    const lead = bestLeadForAction(game, actionId);
    const resolved = performMissionGameAction(game, actionId, lead);
    if (resolved.error) break;
    game = resolved.game;
    guard += 1;
  }
  return game;
}

export function missionGameActionPreview(game, actionId, heroId) {
  const hero = game?.roster?.find((item) => item.id === heroId) || game?.roster?.[0];
  if (!game || !hero) return null;
  const personality = personalityModifier(hero, game.type, actionId);
  const flaw = flawModifier(hero, game.type, actionId);
  return {
    score: Math.round(skillFor(hero, game.type, actionId, game.patronPrimal)),
    personality,
    flaw,
    netCharacter: personality + flaw,
    note: PERSONALITY_GAME_NOTES[hero.personality] || '',
  };
}
