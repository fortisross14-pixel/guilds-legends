// @ts-check
// Arena sign-up and start days, the arena read model, and tournament bouts
// (tournaments-circuits spec). Each tournament is open for sign-up for two
// weeks from its date (REGISTRATION_WEEKS), so somewhere in the world one is
// almost always open. Sign a fit team up at the registrar of the hosting town
// (up to the circuit's team size, fewer is fine) during that window and the
// tournament begins at once; each round is a team battle against another guild.
// When the window closes without the guild, it plays out on its own.
import { LOCATION_BY_ID, travelDays } from '../../data/world.js';
import { CIRCUITS, TOURNAMENTS, TOURNAMENT_BY_ID } from '../../data/tournaments.js';
import { inSlice } from '../../data/slice.js';
import { createPartyEncounter } from '../combat.js';
import { addChronicle, campaignDaySerial, clamp, clone, dateDaySerial, ensureTournamentCareer, finalize, getHero, hashString, tallySpend } from './core.js';
import { fulfillPromisesInPlace } from './candidates.js';
import { expectedFinishForSeed, getTournamentAccess, guildTournamentRating, seedEntrants, tournamentRequirements } from './tournaments.js';
import { tournamentTeamEstimate } from './guildTournaments.js';
import { battleItems } from './inventory.js';

/** How long sign-up stays open, in weeks from a tournament's date. */
export const REGISTRATION_WEEKS = 2;

/** The day sign-up opens: day 1 of the tournament's week. */
export function tournamentStartDay(tournament) {
  return dateDaySerial({ year: tournament.year, month: tournament.month, week: tournament.week || 0, day: 0 });
}

/** The first day sign-up is closed (two weeks after it opens). */
export function tournamentCloseDay(tournament) {
  return tournamentStartDay(tournament) + REGISTRATION_WEEKS * 7;
}

/**
 * The next tournament day worth resting to: the day sign-up opens for the next
 * tournament, or the day the guild's own tournament starts (sign-up closes). Null if none this year.
 */
export function nextTournamentStop(state) {
  const today = campaignDaySerial(state);
  return (
    (state.tournaments || [])
      .filter((tournament) => tournament.status === 'registration')
      .map((tournament) => {
        const signed = Boolean(tournament.signup?.heroIds?.length);
        return { tournament, day: signed ? tournamentCloseDay(tournament) : tournamentStartDay(tournament), what: signed ? 'starts' : 'sign-up opens' };
      })
      .filter((stop) => stop.day > today)
      .sort((a, b) => a.day - b.day)[0] || null
  );
}

/** Open for sign-up today. */
function registrationOpen(state, tournament) {
  const today = campaignDaySerial(state);
  return tournament?.status === 'registration' && today >= tournamentStartDay(tournament) && today < tournamentCloseDay(tournament);
}

function presentAt(state, locationId) {
  return !state.world?.activeTravel && !state.world?.wildAreaId && (state.world?.currentLocationId || 'dunmere') === locationId;
}

/** Seeds the player's team into the field and starts the bracket. */
function seatTeamInPlace(next, tournament, heroes) {
  tournament.assignments = heroes.map((hero) => ({ heroId: hero.id, role: 'Fighter' }));
  const estimate = tournamentTeamEstimate(next, tournament.assignments);
  const entrants = tournament.initialEntrants.filter((id) => id !== 'player');
  if (entrants.length >= tournament.size) entrants.pop();
  entrants.push('player');
  tournament.initialEntrants = seedEntrants(next, tournament, entrants, (id) => (id === 'player' ? estimate.power : guildTournamentRating(next, id)));
  tournament.activeEntrants = [...tournament.initialEntrants];
  tournament.currentRoundSize = tournament.activeEntrants.length;
  tournament.initialSeed = tournament.initialEntrants.indexOf('player') + 1;
  tournament.expectedFinish = expectedFinishForSeed(tournament.initialSeed, tournament.size, next.guild.fame, tournament.prestige);
  tournament.teamPowerAtEntry = estimate.power;
  tournament.status = 'active';
  heroes.forEach((hero) => {
    hero.status = 'tournament';
    ensureTournamentCareer(hero);
    hero.career.tournaments += 1;
    fulfillPromisesInPlace(next, hero, 'tournament', { tournamentId: tournament.id });
  });
  addChronicle(next, {
    type: 'tournament',
    importance: 2,
    title: `${next.guild.name} enters the ${tournament.name}`,
    text: `${heroes.map((hero) => hero.name).join(' and ')} fight for the guild, seeded #${tournament.initialSeed} of ${tournament.size}; the town expects a top-${tournament.expectedFinish} finish.`,
    heroIds: heroes.map((hero) => hero.id),
    tags: ['tournament', 'entry', tournament.circuit],
  });
}

/** Signs a team up at this town's arena for its next tournament (up to the circuit's team size), for the entry fee. */
export function signUpForTournament(state, tournamentId, heroIds) {
  const tournament = state.tournaments.find((item) => item.id === tournamentId);
  if (!tournament || tournament.status !== 'registration') return { state, error: 'Registration for this tournament is closed.' };
  if (!presentAt(state, tournament.locationId)) return { state, error: `Sign up at the arena in ${tournament.location}.` };
  if (campaignDaySerial(state) < tournamentStartDay(tournament)) return { state, error: 'Sign-up has not opened yet.' };
  if (campaignDaySerial(state) >= tournamentCloseDay(tournament)) return { state, error: 'Sign-up has closed.' };
  if ((state.tournaments || []).some((item) => item.status === 'active' && item.assignments?.length)) return { state, error: 'The guild is already fighting in a tournament.' };
  const ids = [...new Set(Array.isArray(heroIds) ? heroIds : [heroIds])].filter(Boolean);
  if (!ids.length) return { state, error: 'Choose who fights for the guild.' };
  if (ids.length > tournament.teamSize) return { state, error: `Teams of up to ${tournament.teamSize} in the ${CIRCUITS[tournament.circuit]?.label || 'circuit'}.` };
  const heroes = ids.map((id) => state.heroes.find((hero) => hero.id === id));
  if (heroes.some((hero) => !hero || ['dead', 'retired'].includes(hero.status))) return { state, error: 'Choose your own heroes.' };
  if (heroes.some((hero) => hero.status !== 'available')) return { state, error: 'Everyone on the team must be fit and free to fight.' };
  const access = getTournamentAccess(state, tournament);
  if (!access.unlocked) return { state, error: 'The guild does not meet the entry rules yet.' };
  if (state.guild.crowns < tournament.entryFee) return { state, error: `Entry costs ${tournament.entryFee} gold.` };
  const next = clone(state);
  const entry = next.tournaments.find((item) => item.id === tournamentId);
  next.guild.crowns -= entry.entryFee;
  tallySpend(next, 'tournaments', entry.entryFee);
  // Signing up starts it: the team is seated and the referee waits at the fighting ground.
  seatTeamInPlace(next, entry, ids.map((id) => getHero(next, id)));
  next.notifications.push({ id: `begins-${entry.id}`, tone: 'gold', title: `The ${entry.name} begins`, text: `${heroes.map((hero) => hero.name).join(' and ')} fight for the guild. The referee is waiting at the fighting ground.` });
  return { state: finalize(next), error: null };
}

/** Sign-up starts a tournament at once; there is no start day to check any more. */
export function startScheduledTournamentsInPlace() {}

function upcomingDate(state, definition) {
  const thisYear = (state.tournaments || []).find((item) => item.definitionId === definition.id);
  // An event whose week has gone by (it resolves on its own at the next rollover) points to next year.
  const gone = thisYear && thisYear.status === 'registration' && campaignDaySerial(state) >= tournamentCloseDay(thisYear);
  if (thisYear && thisYear.status !== 'completed' && !gone) return { tournament: thisYear, date: { year: thisYear.year, month: thisYear.month, week: thisYear.week || 0 } };
  return { tournament: null, date: { year: state.date.year + 1, month: definition.month, week: definition.week } };
}

function roundLabel(size) {
  return size === 8 ? 'Quarterfinal' : size === 4 ? 'Semifinal' : 'Final';
}

function mirroredOpponentId(entrants, playerId) {
  const index = entrants.indexOf(playerId);
  if (index < 0) return null;
  const opponentIndex = entrants.length - 1 - index;
  if (opponentIndex < 0 || opponentIndex >= entrants.length || opponentIndex === index) return null;
  return entrants[opponentIndex];
}

/**
 * Everything the arena in a town shows: the fighting ground (a tournament under
 * way and the next opponent), the registrar (this town's next event, with the
 * team size and the rules; the other events the guild may enter; entries
 * elsewhere) and the history board (champions by year, repeat winners, the
 * guild's best finish).
 */
export function getArenaView(state, locationId) {
  const today = campaignDaySerial(state);
  const here = state.world?.currentLocationId || 'dunmere';
  // A guild enters its own status tier or lower; the slice shows the reachable towns.
  const open = TOURNAMENTS.filter((definition) => definition.tierIndex <= Math.max(0, state.guild.tierIndex) && inSlice(definition.locationId));
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
      teamSize: definition.teamSize,
      rules: [`teams of ${definition.teamSize}`, requirements.fame ? `${requirements.fame} fame` : null, requirements.combatWins ? `${requirements.combatWins} battles won` : null, `fee ${(tournament || definition).entryFee} G`].filter(Boolean),
      signup: tournament?.signup || null,
      // Open now (sign-up is a two-week window), and the days left in it.
      openNow: Boolean(tournament && registrationOpen(state, tournament)),
      closesIn: tournament ? tournamentCloseDay(tournament) - today : null,
    };
  };
  const local = open.filter((definition) => definition.locationId === locationId).map(event).sort((x, y) => x.days - y.days);
  const next = local[0] || null;
  const active = (state.tournaments || []).find((item) => item.status === 'active' && item.locationId === locationId && item.assignments?.length) || null;
  const team = active ? active.assignments.map((assignment) => getHero(state, assignment.heroId)).filter(Boolean) : [];
  const opponentGuild = active ? state.rivals.find((guild) => guild.id === mirroredOpponentId(active.activeEntrants, 'player')) || null : null;
  const registration = next?.tournament && registrationOpen(state, next.tournament) ? next.tournament : null;
  const access = registration ? getTournamentAccess(state, registration) : null;
  const heroes = state.heroes.filter((hero) => !['dead', 'retired'].includes(hero.status)).map((hero) => ({ hero, fit: hero.status === 'available' }));
  const definitions = TOURNAMENTS.filter((definition) => definition.locationId === locationId);
  const history = definitions.map((definition) => {
    const record = state.titleRecords?.[definition.id] || null;
    const winners = record?.winners || [];
    const counts = {};
    winners.forEach((winner) => {
      const name = winner.guildName;
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
      best: best ? { year: best.year, finish: best.playerResult.finish, id: best.id } : null,
      appearances: results.length,
    };
  });
  return {
    location: LOCATION_BY_ID[locationId],
    present: presentAt(state, locationId),
    active,
    team,
    opponentGuild,
    next,
    open: registration,
    access,
    heroes,
    others: open.filter((definition) => definition.locationId !== locationId).map(event).sort((x, y) => x.days - y.days),
    elsewhere: open.map(event).filter((item) => item.signup && item.definition.locationId !== locationId),
    history,
  };
}

/** The next bout of the guild's tournament: a team battle against the guild across the bracket. */
export function beginTournamentBout(state, tournamentId) {
  const next = clone(state);
  if (next.activeEncounter) return { state, error: 'Another combat is already waiting for your command.' };
  const tournament = next.tournaments.find((item) => item.id === tournamentId);
  if (!tournament || tournament.status !== 'active' || !tournament.assignments?.length) return { state, error: 'No tournament under way.' };
  const opponent = next.rivals.find((guild) => guild.id === mirroredOpponentId(tournament.activeEntrants, 'player'));
  if (!opponent) return { state, error: 'The opposing guild could not be prepared.' };
  const playerHeroes = tournament.assignments.map((assignment) => ({ hero: getHero(next, assignment.heroId), role: assignment.role })).filter((item) => item.hero);
  // Both teams field the same number of heroes, up to the circuit's size.
  const size = clamp(playerHeroes.length, 1, tournament.teamSize || 5);
  // The opposing team at this event's level for this round (src/data/tournaments.js levels):
  // their best heroes, lifted to that level and to the strength of a hero of that level.
  const [low, high] = TOURNAMENT_BY_ID[tournament.definitionId]?.levels || [10, 14];
  const round = { 8: 0, 4: 1, 2: 2 }[tournament.currentRoundSize || tournament.activeEntrants.length] ?? 0;
  const level = Math.round(low + ((high - low) * round) / 2);
  const target = Math.min(98, Math.round(38 + 2.25 * level));
  const opponentRoster = [opponent.star, ...(opponent.members || [])]
    .filter((hero) => hero && !['dead', 'retired'].includes(hero.status))
    .sort((a, b) => (b.power || 0) - (a.power || 0))
    .slice(0, size)
    .map((hero) => {
      const lift = Math.max(0, target - (hero.power || 50));
      const attributes = Object.fromEntries(Object.entries(hero.attributes || {}).map(([key, value]) => [key, clamp(Math.round(value + lift), 20, 99)]));
      return { ...hero, level: Math.max(hero.level || 1, level), attributes, power: Math.max(hero.power || 50, target) };
    });
  if (!playerHeroes.length || !opponentRoster.length) return { state, error: 'Both teams need someone to fight.' };
  next.activeEncounter = createPartyEncounter({
    items: battleItems(next),
    canFlee: false,
    id: `bout-${tournament.id}-${tournament.currentRoundSize}`,
    seed: (next.rngState ^ hashString(`bout:${tournament.id}:${tournament.currentRoundSize}:${opponent.id}`)) >>> 0,
    sourceType: 'tournament',
    sourceId: tournament.id,
    title: tournament.name,
    roundName: roundLabel(tournament.currentRoundSize || tournament.activeEntrants.length),
    objective: `Beat ${opponent.name} to reach the next round.`,
    playerHeroes: playerHeroes.slice(0, size),
    opponentName: opponent.name,
    opponentPrimal: LOCATION_BY_ID[opponent.homeLocationId]?.primal || tournament.primal || 'Iron',
    opponentClassId: opponent.star?.classId || 'Guardian',
    opponentPower: opponent.power,
    opponentLevel: Math.round(opponentRoster.reduce((sum, hero) => sum + (hero.level || 1), 0) / opponentRoster.length),
    opponentRoster,
    enemyCount: opponentRoster.length,
    risk: tournament.circuit === 'Elite' ? 5 : tournament.circuit === 'Champion' ? 4 : 3,
    prestige: tournament.prestige,
  });
  next.activeEncounter.sourceMeta = { opponentGuildId: opponent.id, tournamentId: tournament.id };
  return { state: finalize(next), error: null, encounter: next.activeEncounter };
}
