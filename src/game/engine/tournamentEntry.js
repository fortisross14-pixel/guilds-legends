// @ts-check
// Arena sign-up and start days, the arena read model, and starting tournament combat.
import { LOCATION_BY_ID, travelDays } from '../../data/world.js';
import { INDIVIDUAL_TOURNAMENT_DEFINITIONS } from '../../data/universe.js';
import { inSlice } from '../../data/slice.js';
import { createDuelEncounter, createPartyEncounter } from '../combat.js';
import { addChronicle, addHeroHistory, campaignDaySerial, clamp, clone, dateDaySerial, ensureTournamentCareer, finalize, getHero, hashString, tallySpend } from './core.js';
import { formationSlotFor } from './heroes.js';
import { fulfillPromisesInPlace } from './candidates.js';
import { expectedFinishForSeed, getTournamentAccess, guildTournamentRating, heroTournamentRating, seedEntrants, tournamentRequirements } from './tournaments.js';
import { tournamentTeamEstimate } from './guildTournaments.js';
import { battleItems } from './inventory.js';

// Arenas (Phase 6a): sign up at the registrar of the hosting town, then be
// there on the start day. Present and ready: the tournament begins at the
// arena. Away or unavailable: a forfeit (the fee is lost, a little fame too).
const FORFEIT_FAME = 5;

/** The day a tournament starts: day 1 of its week. */
export function tournamentStartDay(tournament) {
  return dateDaySerial({ year: tournament.year, month: tournament.month, week: tournament.week || 0, day: 0 });
}

function presentAt(state, locationId) {
  return !state.world?.activeTravel && !state.world?.wildAreaId && (state.world?.currentLocationId || 'dunmere') === locationId;
}

/** Seeds the player's hero into the field and starts the bracket. */
function seatPlayerInPlace(next, tournament, hero) {
  tournament.playerHeroId = hero.id;
  const entrants = tournament.initialEntrants.filter((id) => id !== hero.id);
  if (entrants.length >= tournament.size) entrants.pop();
  entrants.push(hero.id);
  tournament.initialEntrants = seedEntrants(next, tournament, entrants, (id) => heroTournamentRating(getHero(next, id), tournament));
  tournament.activeEntrants = [...tournament.initialEntrants];
  tournament.currentRoundSize = tournament.activeEntrants.length;
  tournament.initialSeed = tournament.initialEntrants.indexOf(hero.id) + 1;
  tournament.expectedFinish = expectedFinishForSeed(tournament.initialSeed, tournament.size, hero.renown + hero.career.tournamentFame * 0.35, tournament.prestige);
  tournament.status = 'active';
  hero.status = 'tournament';
  ensureTournamentCareer(hero);
  hero.career.tournaments += 1;
  hero.career.individualTournaments += 1;
  addHeroHistory(hero, next, {
    type: 'tournament-entry',
    title: `Entered ${tournament.name}`,
    text: `Seeded #${tournament.initialSeed}; public expectation: top ${tournament.expectedFinish}.`,
  });
  fulfillPromisesInPlace(next, hero, 'tournament', { tournamentId: tournament.id });
  addChronicle(next, {
    type: 'tournament',
    importance: 1,
    title: `${hero.name} enters the ${tournament.name}`,
    text: `The ${hero.rarity.toLowerCase()} ${hero.classId.toLowerCase()} is seeded #${tournament.initialSeed} in a field of ${tournament.size}. The public expects a top-${tournament.expectedFinish} finish.`,
    heroIds: [hero.id],
    tags: ['tournament', 'entry', tournament.circuit],
  });
}

/** Signs a hero up at this town's arena for its next tournament, for the entry fee. */
export function signUpForTournament(state, tournamentId, heroId) {
  const tournament = state.tournaments.find((item) => item.id === tournamentId);
  if (!tournament || tournament.status !== 'registration') return { state, error: 'Registration for this tournament is closed.' };
  if (!presentAt(state, tournament.locationId)) return { state, error: `Sign up at the arena in ${tournament.location}.` };
  if (campaignDaySerial(state) >= tournamentStartDay(tournament)) return { state, error: 'The tournament has already begun.' };
  if (tournament.signup) return { state, error: 'The guild is already signed up for this tournament.' };
  const hero = state.heroes.find((item) => item.id === heroId);
  if (!hero || ['dead', 'retired'].includes(hero.status)) return { state, error: 'Choose one of your heroes.' };
  const access = getTournamentAccess(state, tournament, heroId);
  if (!access.unlocked) return { state, error: `${hero.name} does not meet the entry rules yet.` };
  if (state.guild.crowns < tournament.entryFee) return { state, error: `Entry costs ${tournament.entryFee} gold.` };
  const next = clone(state);
  const entry = next.tournaments.find((item) => item.id === tournamentId);
  next.guild.crowns -= entry.entryFee;
  tallySpend(next, 'tournaments', entry.entryFee);
  entry.signup = { heroId, fee: entry.entryFee, day: campaignDaySerial(next) };
  next.notifications.push({
    id: `signup-${entry.id}`,
    tone: 'blue',
    title: `Signed up: ${entry.name}`,
    text: `${hero.name} fights for the guild. Be in ${entry.location} on the start day, or forfeit the entry.`,
  });
  return { state: finalize(next), error: null };
}

/** On each tournament's start day: begin it if the guild is there and ready, else forfeit. */
export function startScheduledTournamentsInPlace(state) {
  const today = campaignDaySerial(state);
  (state.tournaments || []).forEach((tournament) => {
    if (tournament.status !== 'registration' || !tournament.signup || today < tournamentStartDay(tournament)) return;
    const hero = state.heroes.find((item) => item.id === tournament.signup.heroId);
    const present = presentAt(state, tournament.locationId);
    if (present && hero?.status === 'available' && !state.tournaments.some((item) => item.status === 'active')) {
      seatPlayerInPlace(state, tournament, hero);
      tournament.signup = null;
      state.notifications.push({
        id: `begins-${tournament.id}`,
        tone: 'gold',
        title: `The ${tournament.name} begins`,
        text: `Go to the arena: the referee is waiting for ${hero.name}.`,
      });
      return;
    }
    const reason = !present ? `the guild was not in ${tournament.location}` : !hero ? 'the entrant has left the guild' : `${hero.name} was not fit to fight`;
    tournament.signup = null;
    state.guild.fame = Math.max(0, state.guild.fame - FORFEIT_FAME);
    addChronicle(state, {
      type: 'tournament',
      importance: 1,
      title: `Forfeit at the ${tournament.name}`,
      text: `The guild's name was called and nobody answered: ${reason}. The entry fee is lost.`,
      tags: ['tournament', 'forfeit'],
    });
    state.notifications.push({ id: `forfeit-${tournament.id}`, tone: 'red', title: `Forfeit: ${tournament.name}`, text: `${reason[0].toUpperCase()}${reason.slice(1)}. −${FORFEIT_FAME} fame, fee lost.` });
  });
}

function upcomingDate(state, definition) {
  const thisYear = (state.tournaments || []).find((item) => item.definitionId === definition.id);
  if (thisYear && thisYear.status !== 'completed') return { tournament: thisYear, date: { year: thisYear.year, month: thisYear.month, week: thisYear.week || 0 } };
  const year = state.date.year + 1;
  return { tournament: null, date: { year, month: definition.month, week: definition.week ?? hashString(definition.id) % 4 } };
}

/**
 * Everything the arena in a town shows: the fighting ground (an active bout
 * or the next tournament), the registrar (this town's sign-up, the other
 * regional events, entries elsewhere) and the history board.
 */
export function getArenaView(state, locationId) {
  const today = campaignDaySerial(state);
  const here = state.world?.currentLocationId || 'dunmere';
  const regional = INDIVIDUAL_TOURNAMENT_DEFINITIONS.filter((definition) => (definition.tierIndex || 0) <= Math.max(0, state.guild.tierIndex) && inSlice(definition.locationId));
  const daysUntil = (date) => dateDaySerial({ ...date, day: 0 }) - today;
  const event = (definition) => {
    const { tournament, date } = upcomingDate(state, definition);
    const requirements = tournamentRequirements(tournament || definition);
    return {
      definition,
      tournament,
      date,
      days: daysUntil(date),
      town: LOCATION_BY_ID[definition.locationId]?.name || definition.locationId,
      travelDays: travelDays(here, definition.locationId),
      rules: [requirements.level ? `Lv ${requirements.level}+` : null, requirements.fame ? `${requirements.fame} fame` : null, requirements.combatWins ? `${requirements.combatWins} combat wins` : null, `fee ${(tournament || definition).entryFee} G`].filter(Boolean),
      signup: tournament?.signup || null,
    };
  };
  const local = regional.filter((definition) => definition.locationId === locationId).map(event).sort((x, y) => x.days - y.days);
  const next = local[0] || null;
  const active = (state.tournaments || []).find((item) => item.status === 'active' && item.locationId === locationId && item.playerHeroId) || null;
  const player = active ? getHero(state, active.playerHeroId) : null;
  const opponent = active && player ? getHero(state, mirroredOpponentId(active.activeEntrants, player.id)) : null;
  // The registrar signs up for this town's next tournament only.
  const open = next?.tournament && next.tournament.status === 'registration' && today < tournamentStartDay(next.tournament) ? next.tournament : null;
  const heroes = state.heroes
    .filter((hero) => !['dead', 'retired'].includes(hero.status))
    .map((hero) => ({ hero, access: open ? getTournamentAccess(state, open, hero.id) : null }))
    .map((row) => ({ ...row, meets: Boolean(row.access?.unlocked) }));
  const definitions = INDIVIDUAL_TOURNAMENT_DEFINITIONS.filter((definition) => definition.locationId === locationId);
  const history = definitions.map((definition) => {
    const record = state.titleRecords?.[definition.id] || null;
    const winners = record?.winners || [];
    const counts = {};
    winners.forEach((winner) => {
      const name = winner.heroName || winner.guildName;
      counts[name] = (counts[name] || 0) + 1;
    });
    const results = (state.tournamentHistory || []).filter((item) => item.definitionId === definition.id && item.playerResult);
    const best = [...results].sort((x, y) => x.playerResult.finish - y.playerResult.finish)[0] || null;
    return {
      definition,
      record,
      winners: winners.slice(0, 12),
      repeat: Object.entries(counts)
        .filter(([, count]) => count > 1)
        .sort((x, y) => y[1] - x[1])
        .map(([name, count]) => ({ name, count })),
      best: best ? { year: best.year, finish: best.playerResult.finish, hero: best.playerResult.heroName, id: best.id } : null,
      appearances: results.length,
    };
  });
  return {
    location: LOCATION_BY_ID[locationId],
    present: presentAt(state, locationId),
    active,
    player,
    opponent,
    next,
    open,
    heroes,
    others: regional.filter((definition) => definition.locationId !== locationId).map(event).sort((x, y) => x.days - y.days),
    elsewhere: regional
      .map(event)
      .filter((item) => item.signup && item.definition.locationId !== locationId),
    history,
  };
}

function individualRoundLabel(size) {
  return size === 16 ? 'Round of 16' : size === 8 ? 'Quarterfinal' : size === 4 ? 'Semifinal' : 'Final';
}

function guildRoundLabel(size) {
  return size === 8 ? 'Quarterfinal' : size === 4 ? 'Semifinal' : 'Final';
}

function mirroredOpponentId(entrants, playerId) {
  const index = entrants.indexOf(playerId);
  if (index < 0) return null;
  const opponentIndex = entrants.length - 1 - index;
  if (opponentIndex < 0 || opponentIndex >= entrants.length || opponentIndex === index) return null;
  return entrants[opponentIndex];
}

function dominantRosterPrimal(heroes, fallback = 'Iron') {
  const counts = {};
  heroes.filter(Boolean).forEach((hero) => {
    counts[hero.primal] = (counts[hero.primal] || 0) + 1;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || fallback;
}

export function beginHeroTournamentCombat(state, tournamentId) {
  const next = clone(state);
  if (next.activeEncounter) return { state, error: 'Another combat is already waiting for your command.' };
  const tournament = next.tournaments.find((item) => item.id === tournamentId);
  if (!tournament || tournament.status !== 'active' || !tournament.playerHeroId) return { state, error: 'No active hero tournament entry.' };
  const player = getHero(next, tournament.playerHeroId);
  const opponentId = mirroredOpponentId(tournament.activeEntrants, tournament.playerHeroId);
  const opponent = getHero(next, opponentId);
  if (!player || !opponent) return { state, error: 'The next tournament opponent could not be prepared.' };
  const roundName = individualRoundLabel(tournament.currentRoundSize || tournament.activeEntrants.length);
  next.activeEncounter = createDuelEncounter({
    items: battleItems(next),
    id: `duel-${tournament.id}-${tournament.currentRoundSize}`,
    seed: (next.rngState ^ hashString(`duel:${tournament.id}:${tournament.currentRoundSize}:${player.id}:${opponent.id}`)) >>> 0,
    sourceType: 'hero-tournament',
    sourceId: tournament.id,
    title: tournament.name,
    roundName,
    playerHero: player,
    opponentHero: opponent,
    prestige: tournament.prestige,
  });
  next.activeEncounter.sourceMeta = { playerHeroId: player.id, opponentHeroId: opponent.id, tournamentId: tournament.id };
  return { state: finalize(next), error: null, encounter: next.activeEncounter };
}

export function beginGuildTournamentCombat(state, tournamentId) {
  const next = clone(state);
  if (next.activeEncounter) return { state, error: 'Another combat is already waiting for your command.' };
  const tournament = next.guildTournaments.find((item) => item.id === tournamentId);
  if (!tournament || tournament.status !== 'active' || !tournament.assignments?.length) return { state, error: 'No active guild championship entry.' };
  const opponentGuildId = mirroredOpponentId(tournament.activeEntrants, 'player');
  const opponent = next.rivals.find((guild) => guild.id === opponentGuildId);
  if (!opponent) return { state, error: 'The opposing guild could not be prepared.' };
  const playerHeroes = tournament.assignments
    .map((assignment) => ({ hero: getHero(next, assignment.heroId), role: assignment.role }))
    .filter((item) => item.hero);
  const rosterTarget = clamp(playerHeroes.length, 2, 5);
  const opponentRoster = [opponent.star, ...(opponent.members || [])]
    .filter((hero) => hero && !['dead', 'retired'].includes(hero.status))
    .sort((a, b) => (b.power || 0) - (a.power || 0))
    .slice(0, rosterTarget);
  if (playerHeroes.length < 2 || opponentRoster.length < 2) return { state, error: 'Both companies need at least two active heroes.' };
  const roundName = guildRoundLabel(tournament.currentRoundSize || tournament.activeEntrants.length);
  next.activeEncounter = createPartyEncounter({
    items: battleItems(next),
    canFlee: false,
    id: `guild-battle-${tournament.id}-${tournament.currentRoundSize}`,
    seed: (next.rngState ^ hashString(`guild-battle:${tournament.id}:${tournament.currentRoundSize}:${opponent.id}`)) >>> 0,
    sourceType: 'guild-tournament',
    sourceId: tournament.id,
    title: tournament.name,
    roundName,
    objective: `Break ${opponent.name}'s formation and carry the banner into the next round.`,
    playerHeroes,
    opponentName: opponent.name,
    opponentPrimal: dominantRosterPrimal(opponentRoster, LOCATION_BY_ID[opponent.homeLocationId]?.primal || tournament.primal || 'Iron'),
    opponentClassId: opponent.star?.classId || 'Guardian',
    opponentPower: opponent.power,
    opponentLevel: Math.round(opponentRoster.reduce((sum, hero) => sum + (hero.level || 1), 0) / opponentRoster.length),
    opponentRoster,
    risk: tournament.circuit === 'Global' ? 5 : 4,
    prestige: tournament.prestige,
  });
  next.activeEncounter.sourceMeta = { opponentGuildId: opponent.id, tournamentId: tournament.id };
  return { state: finalize(next), error: null, encounter: next.activeEncounter };
}

export function enterGuildTournament(state, tournamentId, formationType, assignments) {
  const next = clone(state);
  const tournament = next.guildTournaments.find((item) => item.id === tournamentId);
  if (!tournament || tournament.status !== 'registration') return { state, error: 'Guild championship registration is closed.' };
  const access = getTournamentAccess(next, tournament);
  if (!access.registrationOpen) return { state, error: 'This year’s registration window has closed.' };
  if (!access.locationMet) return { state, error: `Travel to ${tournament.location} before registering.` };
  if (!access.unlocked) return { state, error: 'The guild has not earned this championship license.' };
  if (formationType !== 'Combat') return { state, error: 'Guild championships require a Combat Company.' };
  const estimate = tournamentTeamEstimate(next, assignments);
  if (!estimate.valid) return { state, error: 'A guild championship company needs a Commander, a Fighter and no duplicate heroes.' };
  const unavailable = assignments.map((assignment) => getHero(next, assignment.heroId)).filter((hero) => !hero || hero.status !== 'available');
  if (unavailable.length) return { state, error: 'Every company member must be available.' };
  if (next.guild.crowns < tournament.entryFee) return { state, error: `Entry costs ${tournament.entryFee} gold.` };
  if (next.tournaments.some((item) => item.status === 'active') || next.guildTournaments.some((item) => item.status === 'active'))
    return { state, error: 'Finish the current tournament before entering another.' };
  next.guild.crowns -= tournament.entryFee;
  tournament.assignments = assignments.map((assignment) => {
    const slot = formationSlotFor('Combat', assignment);
    return { heroId: assignment.heroId, slotId: slot.id, role: slot.role };
  });
  const entrants = tournament.initialEntrants.filter((id) => id !== 'player');
  if (entrants.length >= tournament.size) entrants.pop();
  entrants.push('player');
  tournament.initialEntrants = seedEntrants(next, tournament, entrants, (id) => (id === 'player' ? estimate.power : guildTournamentRating(next, id)));
  tournament.activeEntrants = [...tournament.initialEntrants];
  tournament.initialSeed = tournament.initialEntrants.indexOf('player') + 1;
  tournament.expectedFinish = expectedFinishForSeed(tournament.initialSeed, tournament.size, next.guild.fame, tournament.prestige);
  tournament.status = 'active';
  tournament.teamPowerAtEntry = estimate.power;
  tournament.assignments.forEach((assignment) => {
    const hero = getHero(next, assignment.heroId);
    hero.status = 'tournament';
    ensureTournamentCareer(hero);
    hero.career.tournaments += 1;
    hero.roleExperience[assignment.role] = (hero.roleExperience[assignment.role] || 0) + 1;
    fulfillPromisesInPlace(next, hero, 'tournament', { tournamentId: tournament.id, guildTournament: true });
  });
  addChronicle(next, {
    type: 'tournament',
    importance: 2,
    title: `${next.guild.name} enters ${tournament.name}`,
    text: `The Combat Company is seeded #${tournament.initialSeed}; the expected finish is top ${tournament.expectedFinish}.`,
    heroIds: tournament.assignments.map((assignment) => assignment.heroId),
    tags: ['tournament', 'guild', tournament.circuit],
  });
  return { state: finalize(next), error: null };
}

export function enterTournament(state, tournamentId, formationType, assignments) {
  return enterGuildTournament(state, tournamentId, formationType, assignments);
}
