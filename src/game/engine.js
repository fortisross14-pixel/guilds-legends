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
  activeHeroCount,
  roomLevel,
  hqLot,
  hasHall,
  bedCount,
  freeBeds,
  chestCapacity,
  trophyCount,
  hallRooms,
  roomCount,
  activityAvailable,
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
export { getPromotionRequirement } from './engine/goals.js';
export { getPatronLoanOffer, takePatronLoan, getTravelQuote, startTravel, upkeepBreakdown, hallUpkeep, savingsRate, propertyGoal } from './engine/economy.js';
export { getHallView, nextUpgrade, buyLot, expandLot, nextExpansion, buildRoom, upgradeRoom, clearRoom, setRoomEquipment, assignRoom, autoAssignRooms, trophyList, crownFame, awardTrophyInPlace } from './engine/hall.js';
export { charterOf, charterEffect, patronLevel, patronAtLeast, patronPoints } from './engine/charter.js';
export { getConnectionsView, getPathScores, giftPatron } from './engine/connections.js';
export {
  GUILD_RECORDS,
  HERO_RECORDS,
  getHallOfFame,
  getHeadToHead,
  getHeroCareer,
  getLadderHistory,
  getMissionLog,
  getRecordBook,
  getSeasonList,
  getSeasonReview,
  heroSeasonScore,
} from './engine/seasons.js';
export { recruitObjection } from './engine/candidates.js';
export { getTournamentAccess } from './engine/tournaments.js';
export { signUpForTournament, getArenaView, tournamentStartDay, tournamentCloseDay, REGISTRATION_WEEKS, beginTournamentBout, nextTournamentStop } from './engine/tournamentEntry.js';
export { saveFormation, acceptContract, contractSite, contractPlace, activeContracts, contractSteps, firstStep, reportTo, contractDaysLeft, siteObjects, siteDoors, objectiveOpen } from './engine/missions.js';
export { siteObjectiveView, siteAct, startSiteFight, retrySiteBattle, checkLabel } from './engine/sites.js';
export { townPeople, peopleIn, findPerson, getPersonTalk, meetPerson, talkToPerson, hireTerms, getContacts, knownMissions, missionPosted, shortLabels } from './engine/people.js';
export { reportContract, contractGrade, acknowledgeReport, GRADES } from './engine/outcomes.js';
export {
  performActiveCombatAction,
  fleeActiveCombat,
  autoResolveActiveCombat,
  concludeActiveCombat,
} from './engine/encounters.js';
export {
  recruitCandidate,
  releaseHero,
  refoundGuild,
  setHeroMonthlyActivity,
  renameGuild,
  renameFounderHero,
  appointHero,
  inspectHero,
} from './engine/recruitment.js';
export {
  acknowledgeCouncilReport,
  dismissNotification,
  updateSettings,
  getNextAction,
  getDashboardSummary,
} from './engine/dashboard.js';
export { createNewGame } from './engine/state.js';
export { getWorldKnowledge } from './engine/dashboard.js';
export { getLivingHistory } from './engine/dashboard.js';
export { compactForSave, migrateGame, validateGame } from './engine/save.js';
export { simulateAutoplay } from './engine/autoplay.js';
export { getUpcomingEvents } from './engine/dashboard.js';
export { planRoadEvents, travelTo, continueJourney, resolveRoadEvent, restAtHall, restAtInn, MAX_REST_DAYS, INN_NIGHT_COST } from './engine/timeActions.js';
export { itemCount } from './engine/inventory.js';
export { shopStock, buyItem, sellItem, equipItem, unequipItem, useItemOnHero, shopPrice, chestUsed, gearUpgradeCost, upgradeGear } from './engine/inventory.js';
export { acknowledgeMoment } from './engine/dashboard.js';
export { concludeCombatAndContinue } from './engine/timeActions.js';
export {
  checkCondition,
  getDialogueView,
  getDialogueReply,
  getTopicReply,
  askDialogueTopic,
  talkTo,
  chooseDialogueOption,
  saveScenePosition,
  recordSceneVisit,
  getWildAreaView,
  enterWildArea,
  leaveWildArea,
  gatherAtSpot,
  restAtCamp,
  startWildBattle,
  ambushInWild,
  retryWildBattle,
  acceptDefeat,
} from './engine/exploration.js';
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
export { advanceDays, advanceWeeks, advanceToDate } from './engine/time.js';
export {
  WEEKS_PER_MONTH,
  DAYS_PER_WEEK,
  HOME_LOCATION_ID,
  atHome,
  campaignDaySerial,
  dateFromDaySerial,
  campaignWeekSerial,
  dateWeekSerial,
  dateFromWeekSerial,
  spanLabel,
  travellingPartyIds,
} from './engine/core.js';
export { getCalendarEntries } from './engine/dashboard.js';
export { MAIN_PARTY_SIZE, isHeroAway, setMainParty, setPartyLead, toggleMainPartyMember } from './engine/recruitment.js';
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
export { REPUTATION_FAMILIES, REPUTATION_LEVELS, FAMILY_PERKS, getReputationSummary, specializationTitle, reputationLevel, getStanding, standingEpithet, standingQuadrant, STANDING } from './engine/reputation.js';
export { nemesisIds, rivalRecord, getNemesisView, challengeNemesis, acceptChallenge, declineChallenge } from './engine/rivalry.js';
export { declineContract } from './engine/missions.js';
export { resolveTownEvent, startSideJob, markNewsRead, festivalFor } from './engine/townLife.js';
export { bossForMission } from './engine/stories.js';
export {
  getStoryView,
  getLoreCodex,
  completePrologue,
  getChapterSummary,
  storyState,
  playStoryScene,
  finishStoryScene,
  startStoryDuel,
  readHistoryBoard,
  storyNpcsHere,
} from './engine/story.js';
