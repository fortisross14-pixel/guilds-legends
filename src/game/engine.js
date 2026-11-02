// Public engine API. The implementation lives in src/game/engine/*.js;
// this barrel keeps UI and test imports stable. Add new exports here.

export {
  clone,
  hashString,
  makeRng,
  getWorldHeroes,
  getHero,
  getGuild,
  getHeroGuildName,
  heroCapacity,
  headquartersRoomCapacity,
  usedFacilityRooms,
  activeHeroCount,
  branchCapacity,
  operationalLocationIds,
  getGuildmaster,
  isGuildDefunct,
  getGuildStar,
  getCurrentLocation,
  partyCapacity,
  getReport,
} from './engine/core.js';
export { xpForNextLevel, calculatePower, generateHero, roleRating, partyEstimate } from './engine/heroes.js';
export { getGuildRankings, getGuildRankSummary, getHeroRankings } from './engine/rankings.js';
export { designateSuccessor, assignMentor, foundBranch, assignBranchCommander, upgradeBranch, assignArtifact, inheritAmbition } from './engine/institution.js';
export { getGoalMetric, getPromotionRequirement } from './engine/goals.js';
export { getPatronLoanOffer, takePatronLoan, getTravelQuote, startTravel, upgradeFacility } from './engine/economy.js';
export { getTournamentAccess } from './engine/tournaments.js';
export { enterHeroTournament, beginHeroTournamentCombat, beginGuildTournamentCombat, enterGuildTournament, enterTournament } from './engine/tournamentEntry.js';
export { inspectMission, notePartySelection, saveFormation, launchMission } from './engine/missions.js';
export { resolveDecision, acknowledgeReport } from './engine/outcomes.js';
export {
  performActiveMissionGameAction,
  autoResolveActiveMissionGame,
  performActiveCombatAction,
  fleeActiveCombat,
  autoResolveActiveCombat,
  concludeActiveCombat,
} from './engine/encounters.js';
export { advanceMonths, advanceToNextEvent } from './engine/time.js';
export {
  recruitCandidate,
  releaseHero,
  refoundGuild,
  setHeroTraining,
  setHeroMonthlyActivity,
  renameGuild,
  renameFounderHero,
  appointHero,
  chooseAlignment,
  inspectHero,
} from './engine/recruitment.js';
export {
  acknowledgeWelcome,
  acknowledgeCouncilReport,
  inspectGoals,
  dismissNotification,
  clearNotifications,
  updateSettings,
  getNextAction,
  getDashboardSummary,
} from './engine/dashboard.js';
export { createNewGame } from './engine/state.js';
export { compactForSave, migrateGame, validateGame } from './engine/save.js';
export { simulateAutoplay } from './engine/autoplay.js';
export { getUpcomingEvents } from './engine/dashboard.js';
export { MAX_REST_MONTHS, planRoadEvents, travelTo, continueJourney, resolveRoadEvent, restAtGuildHall, launchExpedition } from './engine/timeActions.js';
export { shopStock, buyItem, sellItem, equipItem, unequipItem, useItemOnHero } from './engine/inventory.js';
export { acknowledgeMoment } from './engine/dashboard.js';
export { concludeCombatAndContinue } from './engine/timeActions.js';
export {
  LADDERS,
  LADDER_LABELS,
  STATUS_TITLES,
  getGuildLadder,
  getHeroLadder,
  getPlayerRanks,
  getPointsToPass,
  getRankMovement,
  getStatusTitle,
  officialPointsFor,
} from './engine/rankings.js';
export { noteTutorialStep, skipTutorial } from './engine/dashboard.js';
