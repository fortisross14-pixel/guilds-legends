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
export { planRoadEvents, travelTo, continueJourney, resolveRoadEvent, launchExpedition } from './engine/timeActions.js';
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
export { advanceWeeks, advanceToDate } from './engine/time.js';
export { WEEKS_PER_MONTH, campaignWeekSerial, dateWeekSerial, dateFromWeekSerial } from './engine/core.js';
export { getCalendarEntries } from './engine/dashboard.js';
export { MAIN_PARTY_SIZE, isHeroAway, sendIdleHeroesTo, autoAssignRooms, setMainParty, toggleMainPartyMember } from './engine/recruitment.js';
export {
  CONTRACT_LENGTHS,
  CONTRACT_WARNING_MONTHS,
  POACH_LOYALTY,
  baseSalaryFor,
  contractSalary,
  contractMonthsLeft,
  renewalTerms,
  renewContract,
  counterOffer,
  candidateRanges,
  offerTerms,
} from './engine/contracts.js';
export { makeOffer } from './engine/recruitment.js';
export { REPUTATION_FAMILIES, REPUTATION_LEVELS, FAMILY_PERKS, getReputationSummary, specializationTitle, reputationLevel } from './engine/reputation.js';
export { nemesisIds, rivalRecord, getNemesisView, challengeNemesis, acceptChallenge, declineChallenge } from './engine/rivalry.js';
export { declineContract } from './engine/missions.js';
export { resolveTownEvent, startSideJob, markNewsRead, festivalFor } from './engine/townLife.js';
export { getStoryView, bossForMission } from './engine/stories.js';
