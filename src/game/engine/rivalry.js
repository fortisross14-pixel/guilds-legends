// @ts-check
// Rivalries with AI guilds: scores, nemeses, rivals taking contracts the
// player passes on, and nemesis challenge matches.
import { LOCATION_BY_ID } from '../../data/world.js';
import { createDuelEncounter, createPartyEncounter } from '../combat.js';
import { addChronicle, campaignMonthSerial, campaignWeekSerial, clone, finalize, getHero, hashString, pushMoment } from './core.js';
import { battleItems } from './inventory.js';
import { guildLadder } from './rankings.js';

export const MAX_NEMESES = 2;
export const NEMESIS_MIN_SCORE = 20;
/** Score gained per event. */
export const RIVALRY_POINTS = { bout: 5, guildBout: 8, contract: 6, poach: 15, close: 1, challenge: 10 };
export const CHALLENGE_WINDOW_WEEKS = 4;

function emptyRecord() {
  return { score: 0, boutsWon: 0, boutsLost: 0, contractsTaken: 0, poachedFromUs: 0, poachedFromThem: 0, challengesWon: 0, challengesLost: 0 };
}

export function rivalRecord(state, rivalId) {
  return { ...emptyRecord(), ...(state.rivalries?.[rivalId] || {}) };
}

/** event: 'boutWon' | 'boutLost' | 'guildBoutWon' | 'guildBoutLost' | 'contract' | 'poachedFromUs' | 'poachedFromThem' | 'close' | 'challengeWon' | 'challengeLost' */
export function recordRivalryInPlace(state, rivalId, event) {
  if (!rivalId || rivalId === 'player' || !state.rivals.some((rival) => rival.id === rivalId)) return;
  state.rivalries ||= {};
  const record = (state.rivalries[rivalId] ||= emptyRecord());
  const bump = (points, field) => {
    record.score += points;
    if (field) record[field] = (record[field] || 0) + 1;
  };
  if (event === 'boutWon') bump(RIVALRY_POINTS.bout, 'boutsWon');
  else if (event === 'boutLost') bump(RIVALRY_POINTS.bout, 'boutsLost');
  else if (event === 'guildBoutWon') bump(RIVALRY_POINTS.guildBout, 'boutsWon');
  else if (event === 'guildBoutLost') bump(RIVALRY_POINTS.guildBout, 'boutsLost');
  else if (event === 'contract') bump(RIVALRY_POINTS.contract, 'contractsTaken');
  else if (event === 'poachedFromUs') bump(RIVALRY_POINTS.poach, 'poachedFromUs');
  else if (event === 'poachedFromThem') bump(RIVALRY_POINTS.poach, 'poachedFromThem');
  else if (event === 'close') bump(RIVALRY_POINTS.close);
  else if (event === 'challengeWon') bump(RIVALRY_POINTS.challenge, 'challengesWon');
  else if (event === 'challengeLost') bump(RIVALRY_POINTS.challenge, 'challengesLost');
}

export function nemesisIds(state) {
  return state.nemesisIds || [];
}

function rivalRegion(rival) {
  return LOCATION_BY_ID[rival.homeLocationId]?.region || null;
}

/** A rival takes a contract the player passed on: fame, legacy and a few official points. */
export function rivalTakesContractInPlace(state, mission, reason, rng = null) {
  const nemeses = nemesisIds(state)
    .map((id) => state.rivals.find((rival) => rival.id === id))
    .filter((rival) => rival && rivalRegion(rival) === mission.region);
  const regional = state.rivals.filter((rival) => rivalRegion(rival) === mission.region);
  const pool = nemeses.length
    ? nemeses
    : regional.length
      ? regional
      : state.rivals.filter((rival) => (rival.leagueTierIndex ?? rival.tierIndex) <= state.guild.tierIndex + 1);
  if (!pool.length) return null;
  const rival = rng ? rng.pick(pool) : pool[hashString(mission.id) % pool.length];
  rival.fame = (rival.fame || 0) + Math.max(1, Math.round((mission.fame || 4) * 0.8));
  rival.legacyPoints = (rival.legacyPoints ?? rival.careerPoints ?? 0) + Math.round(mission.difficulty || 0);
  state.officialLedger ||= [];
  state.officialLedger.push({
    serial: campaignMonthSerial(state),
    tournamentId: null,
    heroId: null,
    guildId: rival.id,
    points: Math.round((mission.difficulty || 0) * 0.5),
    source: 'contract',
  });
  recordRivalryInPlace(state, rival.id, 'contract');
  const verb = reason === 'declined' ? 'took the contract you declined' : reason === 'outbid' ? 'outbid you for' : 'took the unclaimed contract';
  addChronicle(state, {
    type: 'rival',
    importance: 1,
    title: `${rival.name} took “${mission.title}”`,
    text: `${rival.name} ${verb} in ${mission.locationName || mission.region}.`,
    guildIds: [rival.id],
    tags: ['rival', 'contract', reason],
  });
  return rival;
}

/** Rivalry scores from closeness in the official ladder, then the top 1–2 become nemeses. */
export function updateNemesesInPlace(state) {
  const ladder = guildLadder(state, 'official');
  const index = ladder.findIndex((row) => row.player);
  ladder.forEach((row, rowIndex) => {
    if (!row.player && Math.abs(rowIndex - index) <= 2) recordRivalryInPlace(state, row.id, 'close');
  });
  const ranked = Object.entries(state.rivalries || {})
    .filter(([id, record]) => record.score >= NEMESIS_MIN_SCORE && state.rivals.some((rival) => rival.id === id))
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, MAX_NEMESES)
    .map(([id]) => id);
  const before = new Set(nemesisIds(state));
  state.nemesisIds = ranked;
  ranked
    .filter((id) => !before.has(id))
    .forEach((id) => {
      const rival = state.rivals.find((item) => item.id === id);
      pushMoment(state, {
        type: 'nemesis',
        title: rival.name,
        rivalId: id,
        text: `${rival.name} now sees ${state.guild.name} as its rival. Expect challenges and competition for contracts.`,
      });
      addChronicle(state, {
        type: 'rival',
        importance: 3,
        title: `${rival.name} becomes a nemesis`,
        text: `A rivalry with ${rival.name} turns personal.`,
        guildIds: [id],
        tags: ['rival', 'nemesis'],
      });
    });
}

/** Nemeses outbid the player for contracts in their home region (monthly). */
export function nemesisBidsInPlace(state, rng) {
  nemesisIds(state).forEach((id) => {
    const rival = state.rivals.find((item) => item.id === id);
    const region = rival && rivalRegion(rival);
    const target = state.missions.find((mission) => mission.region === region && mission.templateId !== 'wolves-old-road');
    if (!target || !rng.chance(0.25)) return;
    state.missions = state.missions.filter((mission) => mission.id !== target.id);
    rivalTakesContractInPlace(state, target, 'outbid');
    if (operationalHere(state, target))
      state.notifications.push({ id: `outbid-${target.id}`, tone: 'red', title: `${rival.name} outbid you`, text: `They took “${target.title}”.` });
  });
}

function operationalHere(state, mission) {
  return (mission.locationId || 'dunmere') === state.world?.currentLocationId;
}

// ---------------------------------------------------------------- challenge matches

function seasonIndex(state) {
  return Math.floor(campaignMonthSerial(state) / 3);
}

function challengeStakes(state) {
  const tier = state.guild.tierIndex + 1;
  return { gold: 120 * tier, fame: 6 * tier, points: 60 * tier };
}

/** A nemesis may issue a challenge once per season (called at the start of a season). */
export function maybeIssueChallengeInPlace(state, rng) {
  if (state.challenge?.status === 'pending') return;
  const season = seasonIndex(state);
  const eligible = nemesisIds(state).filter((id) => (state.rivalries?.[id]?.lastChallengeSeason ?? -1) < season);
  if (!eligible.length || !rng.chance(0.5)) return;
  issueChallengeInPlace(state, rng.pick(eligible), 'them');
}

function issueChallengeInPlace(state, rivalId, by) {
  const rival = state.rivals.find((item) => item.id === rivalId);
  state.rivalries ||= {};
  (state.rivalries[rivalId] ||= emptyRecord()).lastChallengeSeason = seasonIndex(state);
  state.challenge = {
    rivalId,
    rivalName: rival.name,
    by,
    status: 'pending',
    issuedWeek: campaignWeekSerial(state),
    expiresWeek: campaignWeekSerial(state) + CHALLENGE_WINDOW_WEEKS,
    stakes: challengeStakes(state),
  };
  if (by === 'them') {
    state.notifications.push({
      id: `challenge-${rivalId}-${seasonIndex(state)}`,
      tone: 'red',
      title: `${rival.name} challenges you`,
      text: 'Accept from the Herald (nemesis page) within 4 weeks, or lose a little fame.',
    });
  }
}

/** The player challenges a nemesis (once per season per nemesis). */
export function challengeNemesis(state, rivalId) {
  if (!nemesisIds(state).includes(rivalId)) return { state, error: 'You can only challenge a nemesis.' };
  if (state.challenge?.status === 'pending') return { state, error: 'A challenge is already pending.' };
  if ((state.rivalries?.[rivalId]?.lastChallengeSeason ?? -1) >= seasonIndex(state)) return { state, error: 'One challenge per nemesis per season.' };
  const next = clone(state);
  issueChallengeInPlace(next, rivalId, 'us');
  return { state: finalize(next), error: null };
}

/** Accept the pending challenge: a party battle (or a duel with only one hero ready). */
export function acceptChallenge(state) {
  const challenge = state.challenge;
  if (challenge?.status !== 'pending') return { state, error: 'No challenge is pending.' };
  if (state.activeEncounter) return { state, error: 'Finish the current battle first.' };
  const rival = state.rivals.find((item) => item.id === challenge.rivalId);
  const ready = state.heroes.filter((hero) => hero.status === 'available');
  if (!ready.length) return { state, error: 'Nobody is available to fight.' };
  const party = [
    ...(state.guild.mainParty || []).map((id) => ready.find((hero) => hero.id === id)).filter(Boolean),
    ...ready.filter((hero) => !(state.guild.mainParty || []).includes(hero.id)),
  ].slice(0, 4);
  const roster = [rival.star, ...(rival.members || [])]
    .filter(Boolean)
    .sort((a, b) => b.power - a.power)
    .slice(0, Math.max(1, party.length));
  const next = clone(state);
  const seed = (next.rngState ^ hashString(`challenge:${rival.id}:${challenge.issuedWeek}`)) >>> 0;
  const common = {
    id: `challenge-${rival.id}-${challenge.issuedWeek}`,
    seed,
    sourceType: 'challenge',
    sourceId: rival.id,
    title: `Challenge: ${rival.name}`,
    roundName: 'Nemesis challenge',
    items: battleItems(next),
  };
  next.activeEncounter =
    party.length === 1
      ? createDuelEncounter({ ...common, playerHero: party[0], opponentHero: roster[0] })
      : createPartyEncounter({
          ...common,
          objective: `Beat ${rival.name}'s best.`,
          playerHeroes: party.map((hero) => ({ hero, role: 'Fighter' })),
          opponentName: rival.name,
          opponentPrimal: rival.star?.primal || 'Iron',
          opponentRoster: roster,
          canFlee: false,
        });
  next.challenge = { ...challenge, status: 'accepted' };
  return { state: finalize(next), error: null };
}

/** Decline (or let expire): costs a little fame. */
export function declineChallenge(state) {
  if (state.challenge?.status !== 'pending') return { state, error: 'No challenge is pending.' };
  const next = clone(state);
  declineChallengeInPlace(next, 'declined');
  return { state: finalize(next), error: null };
}

function declineChallengeInPlace(state, how) {
  const challenge = state.challenge;
  const cost = Math.max(1, Math.round(challenge.stakes.fame / 2));
  state.guild.fame = Math.max(0, state.guild.fame - cost);
  addChronicle(state, {
    type: 'rival',
    importance: 1,
    title: `${state.guild.name} ${how === 'expired' ? 'ignored' : 'declined'} ${challenge.rivalName}'s challenge`,
    text: `The guild loses ${cost} fame.`,
    guildIds: [challenge.rivalId],
    tags: ['rival', 'challenge'],
  });
  state.challenge = null;
}

/** Weekly: an unanswered challenge expires. */
export function expireChallengeInPlace(state) {
  if (state.challenge?.status === 'pending' && campaignWeekSerial(state) > state.challenge.expiresWeek) declineChallengeInPlace(state, 'expired');
}

/** Settles a finished challenge battle (called when the encounter is concluded). */
export function settleChallengeInPlace(state, rivalId, playerWon) {
  const challenge = state.challenge || { stakes: challengeStakes(state), rivalName: state.rivals.find((item) => item.id === rivalId)?.name };
  const rival = state.rivals.find((item) => item.id === rivalId);
  const { gold, fame, points } = challenge.stakes;
  state.officialLedger ||= [];
  if (playerWon) {
    state.guild.crowns += gold;
    state.guild.fame += fame;
    state.officialLedger.push({ serial: campaignMonthSerial(state), tournamentId: null, heroId: null, guildId: 'player', points, source: 'challenge' });
    if (rival) rival.fame = Math.max(0, (rival.fame || 0) - Math.round(fame / 2));
    recordRivalryInPlace(state, rivalId, 'challengeWon');
    pushMoment(state, {
      type: 'victory',
      title: `Challenge won against ${challenge.rivalName}`,
      grade: 'Challenge',
      gold,
      xp: [],
      loot: [`+${points} official points`, `+${fame} fame`],
    });
  } else {
    const lost = Math.min(Math.max(0, state.guild.crowns), gold);
    state.guild.crowns -= lost;
    state.guild.fame = Math.max(0, state.guild.fame - Math.round(fame / 2));
    state.officialLedger.push({ serial: campaignMonthSerial(state), tournamentId: null, heroId: null, guildId: rivalId, points, source: 'challenge' });
    if (rival) rival.fame = (rival.fame || 0) + fame;
    recordRivalryInPlace(state, rivalId, 'challengeLost');
    state.notifications.push({
      id: `challenge-lost-${rivalId}-${campaignWeekSerial(state)}`,
      tone: 'red',
      title: `Challenge lost to ${challenge.rivalName}`,
      text: `You pay ${lost} gold.`,
    });
  }
  addChronicle(state, {
    type: 'rival',
    importance: 3,
    title: `${playerWon ? 'Victory over' : 'Defeat by'} ${challenge.rivalName}`,
    text: `A nemesis challenge, settled in battle.`,
    guildIds: [rivalId],
    tags: ['rival', 'challenge'],
  });
  state.challenge = null;
}

/** Nemesis page data. */
export function getNemesisView(state, rivalId) {
  const rival = state.rivals.find((item) => item.id === rivalId);
  if (!rival) return null;
  const ladders = ['strength', 'legacy', 'official'].map((ladder) => {
    const rows = guildLadder(state, ladder, 'Global');
    return { ladder, theirs: rows.find((row) => row.id === rivalId)?.rank, ours: rows.find((row) => row.player)?.rank, total: rows.length };
  });
  return {
    rival,
    record: rivalRecord(state, rivalId),
    nemesis: nemesisIds(state).includes(rivalId),
    star: rival.star ? getHero(state, rival.star.id) || rival.star : null,
    ladders,
    canChallenge:
      nemesisIds(state).includes(rivalId) &&
      state.challenge?.status !== 'pending' &&
      (state.rivalries?.[rivalId]?.lastChallengeSeason ?? -1) < seasonIndex(state),
  };
}
