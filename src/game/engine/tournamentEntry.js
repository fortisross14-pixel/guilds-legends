// @ts-check
// Player tournament entry and starting tournament combat.
import { LOCATION_BY_ID } from '../../data/world.js';
import { createDuelEncounter, createPartyEncounter } from '../combat.js';
import { addChronicle, addHeroHistory, clamp, clone, ensureTournamentCareer, finalize, getHero, hashString } from './core.js';
import { formationSlotFor } from './heroes.js';
import { fulfillPromisesInPlace } from './candidates.js';
import { expectedFinishForSeed, getTournamentAccess, guildTournamentRating, heroTournamentRating, seedEntrants } from './tournaments.js';
import { tournamentTeamEstimate } from './guildTournaments.js';

export function enterHeroTournament(state, tournamentId, heroId) {
  const next = clone(state);
  const tournament = next.tournaments.find((item) => item.id === tournamentId);
  const hero = getHero(next, heroId);
  if (!tournament || tournament.status !== 'registration') return { state, error: 'Tournament registration is closed.' };
  if (!hero || !next.heroes.some((item) => item.id === heroId)) return { state, error: 'Choose one of your active heroes.' };
  const access = getTournamentAccess(next, tournament, heroId);
  if (!access.registrationOpen) return { state, error: 'This year’s registration window has closed.' };
  if (!access.locationMet) return { state, error: `Travel to ${tournament.location} before entering.` };
  if (!access.unlocked) return { state, error: 'The selected hero or guild does not meet the entry requirements.' };
  if (hero.status !== 'available') return { state, error: `${hero.name} is not currently available.` };
  if (next.guild.crowns < tournament.entryFee) return { state, error: `Entry costs ${tournament.entryFee} crowns.` };
  if (next.tournaments.some((item) => item.status === 'active') || next.guildTournaments.some((item) => item.status === 'active'))
    return { state, error: 'Finish the current tournament before entering another.' };
  next.guild.crowns -= tournament.entryFee;
  tournament.playerHeroId = heroId;
  const entrants = tournament.initialEntrants.filter((id) => id !== heroId);
  if (entrants.length >= tournament.size) entrants.pop();
  entrants.push(heroId);
  tournament.initialEntrants = seedEntrants(next, tournament, entrants, (id) => heroTournamentRating(getHero(next, id), tournament));
  tournament.activeEntrants = [...tournament.initialEntrants];
  tournament.currentRoundSize = tournament.activeEntrants.length;
  tournament.initialSeed = tournament.initialEntrants.indexOf(heroId) + 1;
  tournament.expectedFinish = expectedFinishForSeed(
    tournament.initialSeed,
    tournament.size,
    hero.renown + hero.career.tournamentFame * 0.35,
    tournament.prestige,
  );
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
  return { state: finalize(next), error: null };
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
    objectiveType: 'eliminate',
    objectiveLabel: 'Break the opposing company',
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
  if (next.guild.crowns < tournament.entryFee) return { state, error: `Entry costs ${tournament.entryFee} crowns.` };
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
