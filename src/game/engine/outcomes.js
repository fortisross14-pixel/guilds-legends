// @ts-check
// Reporting a contract back (missions-in-world spec): the grade comes from what
// the party actually did (objectives, extras found, heroes knocked out, days
// taken), then the reward (gold, fame, reputation, patrons, loot, the ladders)
// arrives through one "Mission complete" moment. Deadlines fail contracts.
// Also: acknowledging a queued report (tournaments).
import { LOCATION_BY_ID } from '../../data/world.js';
import { siteFor } from '../../data/missions/index.js';
import { MAX_MISSION_HISTORY, addChronicle, campaignDaySerial, clamp, clone, commitRng, dateLabel, earnGoldInPlace, finalize, rngFor, travellingPartyIds, pushMoment } from './core.js';
import { evaluateStateInPlace } from './goals.js';
import { addItemsInPlace, lootList, rollLoot } from './inventory.js';
import { addMissionLegacyInPlace } from './rankings.js';
import { addContractReputationInPlace, contractFameBonus, contractPayBonus } from './reputation.js';
import { onContractResolvedInPlace } from './stories.js';
import { checkWagerOnContractInPlace } from './townLife.js';
import { missionFamily } from './reputation.js';
import { charterEffect, patronAtLeast, patronContractResultInPlace } from './charter.js';
import { grantPatronRewardsInPlace } from './connections.js';
import { afterContractInPlace } from './seasons.js';
import { storyContractResolvedInPlace } from './story.js';

/** The grades, worst to best (one to four stars). */
export const GRADES = ['Partial', 'Success', 'Great', 'Legendary'];
/** The names the older reward tables use. */
const TABLE_GRADE = { Partial: 'Partial', Success: 'Success', Great: 'Great Success', Legendary: 'Legendary' };
const PAY = { Partial: 0.6, Success: 1, Great: 1.2, Legendary: 1.45 };

/**
 * A contract's grade from what was done: Success for the required objectives;
 * a star more for every extra found; a star more for a clean job (nobody knocked
 * out, within the days it should take); a star less for a rough one (two or more
 * knocked out, a corner cut in talk, or twice the days).
 */
export function contractGrade(state, mission) {
  const site = siteFor(mission);
  const record = mission.site || {};
  const extras = site.objectives.filter((objective) => objective.optional);
  const found = extras.filter((objective) => record.done?.[objective.id]).length;
  const days = campaignDaySerial(state) - (record.startDay ?? campaignDaySerial(state));
  let stars = 2;
  if (extras.length && found === extras.length) stars += 1;
  if (!record.kos && days <= (record.par || 3)) stars += 1;
  if ((record.kos || 0) >= 2 || (record.rough || 0) > 0 || days > 2 * (record.par || 3)) stars -= 1;
  return GRADES[clamp(stars, 1, 4) - 1];
}

/** One line from the giver when the job is reported (at most a dozen words). */
function giverLine(grade) {
  return {
    Partial: 'It’s done, I suppose. Not how I’d have liked it.',
    Success: 'Good work. That’s what we agreed on.',
    Great: 'Better than I hoped. People will hear of this.',
    Legendary: 'They’ll sing about this one. Thank you.',
  }[grade];
}

/**
 * Reports a finished contract in place: rewards, the record, the moment. The
 * contract leaves the board. Story contracts move their story on.
 */
export function reportContractInPlace(state, mission) {
  const grade = contractGrade(state, mission);
  const tableGrade = TABLE_GRADE[grade];
  const heroIds = travellingPartyIds(state).filter((id) => state.heroes.some((hero) => hero.id === id));
  const rng = rngFor(state, `report-${mission.id}`);
  let pay = PAY[grade] * contractPayBonus(state, mission) * charterEffect(state, 'contractPay');
  if (mission.patron && ['trade', 'temple'].includes(mission.patron) && patronAtLeast(state, mission.patron, 'ally')) pay *= 1.25;
  const reward = Math.max(0, Math.round((mission.reward || 0) * pay));
  const fame = Math.max(0, Math.round((mission.fame || 0) * PAY[grade] * contractFameBonus(state, mission)));
  earnGoldInPlace(state, reward);
  state.guild.fame += fame;
  state.guild.legacy += Math.round(fame * 0.25) + (grade === 'Legendary' ? 8 : 0);
  afterContractInPlace(state, { mission, grade: tableGrade, success: true, heroIds, reward, estimate: null });
  const reputationChange = addContractReputationInPlace(state, mission, tableGrade);
  if (mission.patron) {
    patronContractResultInPlace(state, mission.patron, tableGrade);
    grantPatronRewardsInPlace(state);
  }
  onContractResolvedInPlace(state, mission, tableGrade, true);
  checkWagerOnContractInPlace(state, missionFamily(mission));
  addMissionLegacyInPlace(state, mission, tableGrade, heroIds);
  const loot = rollLoot(rngFor(state, `loot:${mission.id}`), state.guild.tierIndex, grade === 'Legendary' ? 2 : grade === 'Great' ? 1 : 0);
  addItemsInPlace(state, loot);
  heroIds.forEach((id) => {
    const hero = state.heroes.find((item) => item.id === id);
    if (!hero) return;
    hero.career.missions += 1;
    hero.career.wins = (hero.career.wins || 0) + 1;
    hero.career.earnings += heroIds.length ? Math.round(reward / heroIds.length) : 0;
  });
  state.stats.missionsCompleted += 1;
  state.stats.missionsWon += 1;
  state.guild.wins += 1;
  state.guild.contractsCompleted += 1;
  if (grade === 'Legendary') state.stats.signatureFeats += 1;
  const reputation = Object.values(reputationChange || {}).reduce((sum, value) => sum + (Number(value) || 0), 0) || null;
  const site = siteFor(mission);
  const done = site.objectives.filter((objective) => mission.site?.done?.[objective.id]).map((objective) => objective.name);
  const days = campaignDaySerial(state) - (mission.site?.startDay ?? campaignDaySerial(state));
  const details = [
    `Done: ${done.join(', ') || 'nothing'}.`,
    `${days} day${days === 1 ? '' : 's'} (a clean job takes ${mission.site?.par || 3}).`,
    `Knocked out: ${mission.site?.kos || 0}. Corners cut: ${mission.site?.rough || 0}.`,
    `${reward} gold, ${fame} fame${reputation ? `, ${reputation} reputation` : ''}.`,
  ];
  const record = {
    id: `mission-record-${mission.id}`,
    kind: 'mission',
    missionId: mission.id,
    templateId: mission.templateId,
    title: mission.title,
    family: mission.family,
    region: mission.region,
    locationId: mission.locationId,
    locationName: mission.locationName || LOCATION_BY_ID[mission.locationId]?.name || mission.region,
    issuer: mission.issuer,
    risk: mission.risk,
    difficulty: mission.difficulty,
    completedYear: state.date.year,
    completedMonth: state.date.month,
    completedDate: dateLabel(state),
    grade,
    reward,
    fame,
    team: heroIds.map((id) => ({ heroId: id, name: state.heroes.find((hero) => hero.id === id)?.name || id })),
    loot: lootList(loot).map((item) => `${item.name}${item.count > 1 ? ` ×${item.count}` : ''}`),
    reputationChange,
    narrative: details.join(' '),
    consequences: [],
  };
  state.missionHistory.unshift(record);
  if (state.missionHistory.length > MAX_MISSION_HISTORY) state.missionHistory.length = MAX_MISSION_HISTORY;
  pushMoment(state, {
    type: 'missionComplete',
    title: mission.title,
    grade,
    gold: reward,
    fame,
    reputation,
    loot: lootList(loot),
    line: mission.story ? null : giverLine(grade),
    giver: mission.giverName || null,
    details,
  });
  addChronicle(state, { type: 'victory', importance: grade === 'Legendary' ? 4 : 2, title: `${grade}: ${mission.title}`, text: details.join(' '), heroIds, tags: [mission.family, grade], missionRecordId: record.id });
  state.missions = state.missions.filter((item) => item.id !== mission.id);
  storyContractResolvedInPlace(state, mission, true);
  commitRng(state, rng);
  evaluateStateInPlace(state);
}

/** Reports a finished contract to its giver or at the notice board. */
export function reportContract(state, missionId) {
  const mission = state.missions.find((item) => item.id === missionId);
  if (!mission || !mission.site) return { state, error: 'That contract is not yours to report.' };
  if (mission.site.status !== 'ready') return { state, error: 'There is still work to do.' };
  const next = clone(state);
  reportContractInPlace(
    next,
    next.missions.find((item) => item.id === missionId),
  );
  return { state: finalize(next), error: null };
}

/**
 * Daily: an active contract past its deadline fails. Its giver mentions it next
 * time you talk (people.js); a story contract is posted again a week later.
 */
export function contractDeadlinesInPlace(state) {
  const today = campaignDaySerial(state);
  (state.missions || [])
    .filter((mission) => mission.site && ['active', 'ready'].includes(mission.site.status) && mission.site.deadlineDay && today > mission.site.deadlineDay)
    .forEach((mission) => {
      mission.site.status = 'failed';
      state.stats.missionsLost += 1;
      state.guild.losses += 1;
      state.notifications.push({ id: `contract-failed-${mission.id}`, tone: 'red', title: `Too late: ${mission.title}`, text: mission.giverName ? `${mission.giverName} will not be pleased.` : 'The deadline has passed.' });
      if (mission.story) {
        state.missions = state.missions.filter((item) => item.id !== mission.id);
        storyContractResolvedInPlace(state, mission, false);
      } else if (!mission.giverId) state.missions = state.missions.filter((item) => item.id !== mission.id);
    });
}

export function acknowledgeReport(state, reference) {
  const next = clone(state);
  const id = typeof reference === 'string' ? reference : reference?.id;
  next.pendingReports = (next.pendingReports || []).filter((item) => item.id !== id);
  return finalize(next);
}
