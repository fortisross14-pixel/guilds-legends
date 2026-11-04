import React, { Component, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  acknowledgeCouncilReport,
  acknowledgeReport,
  appointHero,
  assignArtifact,
  assignBranchCommander,
  assignMentor,
  clone,
  completePrologue,
  finishStoryScene,
  playStoryScene,
  startStoryDuel,
  readHistoryBoard,
  talkTo,
  meetPerson,
  talkToPerson,
  chooseDialogueOption,
  askDialogueTopic,
  saveScenePosition,
  recordSceneVisit,
  enterWildArea,
  leaveWildArea,
  gatherAtSpot,
  restAtCamp,
  startWildBattle,
  retryWildBattle,
  acceptDefeat,
  createNewGame,
  designateSuccessor,
  dismissNotification,
  enterGuildTournament,
  foundBranch,
  signUpForTournament,
  restAtHall,
  restAtInn,
  performActiveCombatAction,
  getDashboardSummary,
  getReport,
  getStoryView,
  hasHall,
  HOME_LOCATION_ID,
  INN_NIGHT_COST,
  travellingPartyIds,
  hashString,
  inheritAmbition,
  inspectHero,
  acceptContract,
  reportContract,
  siteAct,
  retrySiteBattle,
  isGuildDefunct,
  recruitCandidate,
  refoundGuild,
  releaseHero,
  renameFounderHero,
  renameGuild,
  saveFormation,
  setHeroMonthlyActivity,
  beginGuildTournamentCombat as startGuildTournamentCombat,
  beginHeroTournamentCombat as startHeroTournamentCombat,
  travelTo,
  concludeCombatAndContinue,
  fleeActiveCombat,
  buyItem,
  sellItem,
  equipItem,
  unequipItem,
  useItemOnHero,
  acknowledgeMoment,
  LADDERS,
  LADDER_LABELS,
  continueJourney,
  resolveRoadEvent,
  advanceToDate,
  autoAssignRooms,
  toggleMainPartyMember,
  setPartyLead,
  renewContract,
  counterOffer,
  makeOffer,
  declineContract,
  challengeNemesis,
  acceptChallenge,
  declineChallenge,
  resolveTownEvent,
  startSideJob,
  markNewsRead,
  takePatronLoan,
  updateSettings,
  upgradeBranch,
  giftPatron,
  buyLot,
  expandLot,
  buildRoom,
  upgradeRoom,
  clearRoom,
  setRoomEquipment,
  assignRoom,
  upgradeGear,
  validateGame,
} from './game/engine.js';
import { deleteGame, exportGame, importGame, listSaveSlots, loadGame, saveGame } from './game/storage.js';
import { CLASSES } from './data/content.js';
import { BUILDINGS, LOCATION_BY_ID, PRIMALS, locationBuildings } from './data/world.js';
import { townFor } from './data/towns/index.js';
import { WILD_AREAS } from './data/wilds/index.js';
import { Button, Crest, HeroPortrait, Modal, SceneBackdrop, useMenuKeys } from './components/UI.jsx';
import Icon, { IconDefs } from './components/Icon.jsx';
import MapScreen from './places/MapScreen.jsx';
import TownScene from './explore/TownScene.jsx';
import WildScene from './explore/WildScene.jsx';
import MissionsScreen from './screens/MissionsScreen.jsx';
import ArenaScreen from './screens/ArenaScreen.jsx';
import ShopScreen from './screens/ShopScreen.jsx';
import InteriorScene from './explore/InteriorScene.jsx';
import SiteScene from './explore/SiteScene.jsx';
import { INTERIORS } from './data/interiors.js';
import { resolveRoute } from './places/routes.js';
import { Ledger, Orb, OrbScrim, PlaceTag } from './hud/Hud.jsx';
import { SectionView } from './hud/sections.jsx';
import { dateLine } from './hud/dateLine.js';
import CouncilReportModal from './components/CouncilReportModal.jsx';
import CombatArenaModal from './components/CombatArenaModal.jsx';
import RoadEventModal from './components/RoadEventModal.jsx';
import MomentModal from './components/MomentModal.jsx';
import EventCardModal from './components/EventCardModal.jsx';
import { configureSound, playSound, unlockAudio } from './audio/sfx.js';
import HeroStatusScreen from './components/HeroStatusScreen.jsx';
import Prologue from './components/Prologue.jsx';
import { haptic } from './components/gestures.js';
import DialogueBox from './explore/DialogueBox.jsx';
import Asset from './components/Asset.jsx';
import { setShowAssetIds } from './components/assetLoader.js';
import { CHARTERS } from './data/charters.js';
import { specializationTitle } from './game/engine.js';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Guilds of Legend render error', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="fatal-screen">
        <Crest size="xl" />
        <span className="eyebrow">The chronicle hit an unexpected error</span>
        <h1>The guild hall could not be rendered</h1>
        <p>{this.state.error.message}</p>
        <div>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Reload safely
          </Button>
          <Button onClick={() => this.setState({ error: null })}>Try returning</Button>
        </div>
        <small>Your IndexedDB save was not deleted. A render error cannot erase the campaign.</small>
      </div>
    );
  }
}

// Title screen: the logo window and a Continue / New Game menu, one row per save slot.
function HomeScreen({ slots, busy, onLoad, onCreate, onDelete }) {
  useMenuKeys();
  return (
    <div className="home-screen">
      <SceneBackdrop asset="bg.title" dim={0.18} focus="50% 50%" />
      <div className="home-screen__inner">
        <header className="title-logo">
          <Crest size="xl" />
          <h1>
            Guilds <span className="title-logo__small">of</span> Legend
          </h1>
        </header>
        <nav className="save-menu" aria-label="Save slots">
          <ul className="cmd-menu" data-menu>
            {[1, 2, 3].map((slot) => {
              const meta = slots.find((item) => item.slot === slot);
              return (
                <li className={`save-slot ${meta ? 'save-slot--filled' : 'save-slot--empty'}`} key={slot}>
                  <button className="save-menu__main" onClick={() => (meta ? onLoad(slot) : onCreate(slot))} disabled={busy} aria-label={meta ? `Continue ${meta.guildName}, slot ${slot}` : `New game in slot ${slot}`}>
                    {meta ? (
                      <>
                        <Asset id={CHARTERS[meta.charter]?.crest || 'crest.charter.free'} className="save-menu__crest" />
                        <span className="save-menu__meta">
                          <strong>{meta.guildName}</strong>
                          <span className="num">{meta.year}</span>
                        </span>
                      </>
                    ) : (
                      <span className="save-menu__verb">New game</span>
                    )}
                  </button>
                  {meta ? (
                    <button className="save-menu__delete" onClick={() => onDelete(slot)} disabled={busy} aria-label={`Delete save slot ${slot}`}>
                      Delete
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}

// New game: only who you are (name and class). The guild itself is founded later,
// when Cassian Rook's banner is in your hands (Prologue.jsx).
function CreateCampaignModal({ open, onClose, onCreate }) {
  const [founderName, setFounderName] = useState('Rowan Vale');
  const [founderClass, setFounderClass] = useState('Guardian');
  const [skipTutorial, setSkipTutorial] = useState(false);

  useEffect(() => {
    if (open) {
      setSkipTutorial(false);
      setFounderName('Rowan Vale');
      setFounderClass('Guardian');
    }
  }, [open]);

  return (
    <Modal open={open} title="Who are you?" onClose={onClose} width="medium">
      <div className="new-campaign new-campaign--founder">
        <div className="new-campaign__fields">
          <label>
            Your name
            <input value={founderName} maxLength={36} onChange={(event) => setFounderName(event.target.value)} autoFocus />
          </label>
          <label>
            Your class
            <select value={founderClass} onChange={(event) => setFounderClass(event.target.value)}>
              {Object.keys(CLASSES).map((classId) => (
                <option key={classId}>{classId}</option>
              ))}
            </select>
          </label>
        </div>
        <p className="new-campaign__premise">Dunmere, 1187. Tonight someone knocks on your door.</p>
        <label className="new-campaign__skip">
          <input type="checkbox" checked={skipTutorial} onChange={(event) => setSkipTutorial(event.target.checked)} />
          <span>Skip the tutorial</span>
        </label>
        <Button variant="primary" size="lg" disabled={!founderName.trim()} onClick={() => onCreate({ founderName: founderName.trim(), founderClass, skipTutorial })}>
          Begin
        </Button>
      </div>
    </Modal>
  );
}

function RefoundModal({ state, open, onRefound, onReturnHome }) {
  const [founderName, setFounderName] = useState('');
  const [founderClass, setFounderClass] = useState('Guardian');
  const [founderPrimal, setFounderPrimal] = useState(LOCATION_BY_ID[state.world?.currentLocationId]?.primal || 'Fire');
  if (!open) return null;
  const fallen = state.heroes.filter((hero) => ['dead', 'retired'].includes(hero.status)).length;
  return (
    <Modal open title="No active heroes remain" eyebrow={`${state.guild.name} · Year ${state.date.year}`} preventClose width="wide">
      <div className="new-campaign new-campaign--founder refound-modal">
        <div className="new-campaign__premise">
          <strong>The banner has fallen</strong>
          <p>
            All {fallen} heroes of {state.guild.name} are dead or retired. The guild keeps its name, treasury ({state.guild.crowns} gold), history and
            rankings. Choose a new founder to carry it forward. One local recruit will join without a fee.
          </p>
        </div>
        <div className="new-campaign__fields">
          <label>
            New founder's name
            <input value={founderName} maxLength={36} onChange={(event) => setFounderName(event.target.value)} placeholder="Name the new founder" />
          </label>
          <label>
            Class
            <select value={founderClass} onChange={(event) => setFounderClass(event.target.value)}>
              {Object.keys(CLASSES).map((classId) => (
                <option key={classId}>{classId}</option>
              ))}
            </select>
          </label>
          <label>
            Primal
            <select value={founderPrimal} onChange={(event) => setFounderPrimal(event.target.value)}>
              {Object.values(PRIMALS).map((primal) => (
                <option key={primal.id} value={primal.id}>
                  {primal.id}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="save-actions">
          <Button
            variant="primary"
            size="lg"
            disabled={!founderName.trim()}
            onClick={() => onRefound({ founderName: founderName.trim(), founderClass, founderPrimal })}
          >
            Refound the guild
          </Button>
          <Button onClick={onReturnHome}>Return to save slots</Button>
        </div>
      </div>
    </Modal>
  );
}

function ReportModal({ report, onClose, openHero }) {
  if (!report) return null;
  const isMission = report.kind === 'mission';
  const isIndividual = report.kind === 'individual-tournament';
  const playerResult = report.playerResult || null;
  const playerWon = playerResult?.finish === 1;
  const tone = isMission
    ? ['Legendary', 'Great Success', 'Success'].includes(report.grade)
      ? 'green'
      : report.grade === 'Partial'
        ? 'gold'
        : 'red'
    : playerWon
      ? 'green'
      : playerResult
        ? playerResult.fameDelta >= 0
          ? 'gold'
          : 'red'
        : 'purple';
  const finishText = playerResult
    ? playerResult.finish === 1
      ? 'Champion'
      : playerResult.finish === 2
        ? 'Runner-up'
        : `Top ${playerResult.finish}`
    : 'World result';
  const playerHero = isIndividual && playerResult ? report.entrants?.find((entrant) => entrant.heroId === playerResult.heroId) : null;
  const champion = isIndividual ? report.entrants?.find((entrant) => entrant.heroId === report.championId) : null;
  return (
    <Modal
      open
      title={report.title}
      eyebrow={
        isMission ? `${report.completedDate} · Expedition report` : `Year ${report.year} · ${isIndividual ? 'Individual tournament' : 'Guild championship'}`
      }
      onClose={onClose}
      width="wide"
    >
      <div className={`mission-report mission-report--${tone}`}>
        <header className="mission-report__hero">
          <div className="mission-report__seal">
            {isMission ? (report.grade === 'Legendary' ? '✦' : report.grade === 'Catastrophic' ? '!' : '◆') : playerWon ? '♛' : '⚔'}
          </div>
          <div>
            <span className="eyebrow">
              {isMission
                ? `${report.family} · ${report.formationType} · ${report.locationName || report.region}`
                : `${report.circuit} circuit · ${report.location}`}
            </span>
            <h2>{isMission ? report.grade : finishText}</h2>
            <p>{report.narrative}</p>
          </div>
        </header>

        {isMission ? (
          <>
            <div className="report-metrics">
              <div>
                <span>{report.combat ? 'Tactical battle' : report.missionGame ? `${report.missionGame.type} challenge` : 'Final chance'}</span>
                <strong>
                  {report.combat ? (report.combat.playerWon ? 'Victory' : 'Defeat') : report.missionGame ? report.missionGame.grade : `${report.finalChance}%`}
                </strong>
                <small>
                  {report.combat
                    ? `${report.combat.turns} turns · ${report.combat.playerHpPct}% field strength left`
                    : report.missionGame
                      ? `${report.missionGame.turns} turns · performance ${report.missionGame.performance}`
                      : `Roll ${report.roll}`}
                </small>
              </div>
              <div>
                <span>Treasury</span>
                <strong>+{report.reward}</strong>
                <small>Supplies −{report.supplyCost}</small>
              </div>
              <div>
                <span>Fame</span>
                <strong>
                  {report.fame >= 0 ? '+' : ''}
                  {report.fame}
                </strong>
                <small>{report.locationName || report.region}</small>
              </div>
              <div>
                <span>Outcome</span>
                <strong>{report.grade}</strong>
                <small>Risk {report.risk}/5</small>
              </div>
            </div>
            {report.combat ? (
              <section className="report-combat-summary">
                <span className="eyebrow">Tactical record</span>
                <div>
                  <strong>{report.combat.method}</strong>
                  <p>
                    Your company dealt {report.combat.playerDamage} damage and received {report.combat.enemyDamage}. Opposition ended at{' '}
                    {report.combat.enemyHpPct}% field strength.
                  </p>
                </div>
                <div className="report-combat-log">
                  {(report.combat.log || []).slice(-6).map((entry, index) => (
                    <p key={`${entry.turn}-${index}`}>
                      <b>{entry.turn ? `T${entry.turn}` : '•'}</b>
                      <span>{entry.text}</span>
                    </p>
                  ))}
                </div>
              </section>
            ) : null}
            {report.missionGame ? (
              <section className="report-combat-summary">
                <span className="eyebrow">Playable {report.missionGame.type} record</span>
                <div>
                  <strong>
                    {report.missionGame.grade} · performance {report.missionGame.performance}
                  </strong>
                  <p>
                    {Object.entries(report.missionGame.metrics || {})
                      .map(([key, value]) => `${key.replace(/([A-Z])/g, ' $1')}: ${typeof value === 'number' ? Math.round(value) : value}`)
                      .join(' · ')}
                  </p>
                </div>
                <div className="report-combat-log">
                  {(report.missionGame.log || []).slice(0, 6).map((entry, index) => (
                    <p key={`${entry.turn}-${index}`}>
                      <b>{entry.turn ? `T${entry.turn}` : '•'}</b>
                      <span>{entry.text}</span>
                    </p>
                  ))}
                </div>
              </section>
            ) : null}
            <section className="report-decision">
              <span className="eyebrow">{report.combat || report.missionGame ? 'Aftermath decision' : 'The decisive moment'}</span>
              <blockquote>{report.decision?.prompt}</blockquote>
              <div>
                <strong>{report.decision?.label}</strong>
                <p>{report.decision?.note}</p>
              </div>
            </section>
          </>
        ) : (
          <div className="report-metrics">
            <div>
              <span>Your finish</span>
              <strong>{playerResult ? finishText : 'Did not enter'}</strong>
              <small>{playerResult ? `Expected top ${playerResult.expectedFinish}` : `Champion: ${report.championName}`}</small>
            </div>
            <div>
              <span>Prize</span>
              <strong>{(playerResult?.prize || 0).toLocaleString()}</strong>
              <small>Champion purse {report.prize?.toLocaleString()}</small>
            </div>
            <div>
              <span>Fame</span>
              <strong>{playerResult ? `${playerResult.fameDelta >= 0 ? '+' : ''}${playerResult.fameDelta}` : '—'}</strong>
              <small>Expectation-adjusted</small>
            </div>
            <div>
              <span>Wins</span>
              <strong>{playerResult?.boutWins || 0}</strong>
              <small>Seed #{playerResult?.initialSeed || '—'}</small>
            </div>
          </div>
        )}

        {isMission ? (
          <section>
            <span className="eyebrow">Company arrangement</span>
            <div className="report-team">
              {(report.team || []).map((member) => (
                <button key={member.heroId} onClick={() => openHero(member.heroId)}>
                  <HeroPortrait hero={{ ...member, id: member.heroId, status: member.status || 'available' }} size="sm" />
                  <div>
                    <strong>{member.name}</strong>
                    <small>
                      Lv {member.level || 1} · {member.rarity || 'Common'} · {member.primal || 'Fire'} {member.classId} · {member.role}
                    </small>
                    <span>
                      Power {member.power} · Role {member.roleRating}
                    </span>
                  </div>
                  <i
                    className={
                      report.heroEffects?.find((effect) => effect.heroId === member.heroId)?.status === 'dead'
                        ? 'is-dead'
                        : report.heroEffects?.find((effect) => effect.heroId === member.heroId)?.status === 'injured'
                          ? 'is-injured'
                          : ''
                    }
                  >
                    {report.heroEffects?.find((effect) => effect.heroId === member.heroId)?.status || 'returned'}
                  </i>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {!isMission ? (
          <section className="tournament-report-spotlight">
            <span className="eyebrow">Champion and challenger</span>
            <div>
              {champion ? (
                <button onClick={() => openHero(champion.heroId)}>
                  <HeroPortrait hero={{ ...champion, id: champion.heroId, status: 'active' }} size="md" />
                  <span>
                    <small>Champion</small>
                    <strong>{champion.name}</strong>
                    <em>
                      {champion.guildName} · {champion.rarity} · Lv {champion.level}
                    </em>
                  </span>
                </button>
              ) : (
                <div>
                  <small>Champion guild</small>
                  <strong>{report.championName}</strong>
                </div>
              )}
              {playerHero && playerHero.heroId !== champion?.heroId ? (
                <button onClick={() => openHero(playerHero.heroId)}>
                  <HeroPortrait hero={{ ...playerHero, id: playerHero.heroId, status: 'available' }} size="md" />
                  <span>
                    <small>Your entrant</small>
                    <strong>{playerHero.name}</strong>
                    <em>
                      {finishText} · seed #{playerResult.initialSeed}
                    </em>
                  </span>
                </button>
              ) : null}
            </div>
          </section>
        ) : null}

        {isMission ? (
          <div className="report-consequences">
            <section>
              <span className="eyebrow">Individual consequences</span>
              {report.heroEffects?.map((effect) => (
                <div key={effect.heroId}>
                  <strong>{effect.name}</strong>
                  <p>
                    {effect.injury ? effect.injury : effect.status === 'dead' ? 'Killed during the expedition' : 'Returned to active service'} · +
                    {effect.xpGain || 0} XP{effect.levelAfter > effect.levelBefore ? ` · LEVEL ${effect.levelAfter}` : ''} · form{' '}
                    {effect.formChange >= 0 ? '+' : ''}
                    {effect.formChange} · renown {effect.renownChange >= 0 ? '+' : ''}
                    {effect.renownChange} · loyalty {effect.loyaltyChange >= 0 ? '+' : ''}
                    {effect.loyaltyChange || 0}
                    {effect.personalityReaction ? ` · ${effect.personalityReaction}` : ''}
                  </p>
                </div>
              ))}
            </section>
            <section>
              <span className="eyebrow">Lasting consequences</span>
              {report.loot?.length ? (
                <p>
                  <b>Loot:</b> {report.loot.join(', ')}
                </p>
              ) : null}
              {report.artifact ? (
                <p>
                  <b>Artifact recovered:</b> {report.artifact}
                </p>
              ) : null}
              {report.consequences?.length ? (
                report.consequences.map((item) => <p key={item}>{item}</p>)
              ) : (
                <p>No new political obligation or rivalry was created.</p>
              )}
              {report.relationshipChanges?.length ? (
                <p>
                  <b>Party bonds shifted:</b> {report.relationshipChanges.length} relationship changes were recorded from the expedition.
                </p>
              ) : null}
            </section>
          </div>
        ) : (
          <section>
            <span className="eyebrow">Round-by-round bracket</span>
            <div className="report-bouts report-bouts--universe">
              {report.bracket?.map((bout, index) => {
                const sideA = bout.heroAName || bout.guildAName;
                const sideB = bout.heroBName || bout.guildBName;
                return (
                  <article key={`${bout.round}-${index}`} className={bout.playerBout ? 'is-player' : ''}>
                    <strong>{bout.round}</strong>
                    <span>
                      {sideA} <b>vs</b> {sideB}
                    </span>
                    <small>
                      Winner: {bout.winnerName}
                      {bout.playerBout && bout.combat
                        ? ` · ${bout.combat.turns} tactical turns · ${bout.combat.method} · ${bout.combat.playerHpPct}% HP left`
                        : bout.playerBout && bout.chance
                          ? ` · Your estimate ${bout.chance}% · ${bout.tactic}`
                          : ''}
                    </small>
                  </article>
                );
              })}
            </div>
          </section>
        )}
        <Button variant="primary" size="lg" onClick={onClose}>
          {isMission ? 'Seal report in the Chronicle' : 'Return to the tournament universe'}
        </Button>
      </div>
    </Modal>
  );
}

// Notices (docs/UX.md, "One interruption at a time"): one at a time, one line, in one
// place: under the place tag, in the goal line's slot (or the section header's free
// side). Messages from the UI come first, then the engine's notifications in order.
// Each steps aside on its own; a tap dismisses it. They wait while an interruption shows.
const NOTICE_MS = 4500;
const NOTICE_ICON = { green: 'check', red: 'alert', gold: 'star', purple: 'star' };
function NoticeQueue({ notifications, message, paused, onDismiss, onMessageDone }) {
  const current = message
    ? { id: `message-${message.at}`, tone: message.tone, title: message.text, message: true }
    : (notifications || [])[0] || null;
  const done = () => (current?.message ? onMessageDone() : onDismiss(current.id));
  useEffect(() => {
    if (!current || paused) return undefined;
    const timer = window.setTimeout(done, current.tone === 'red' ? 7000 : NOTICE_MS);
    return () => window.clearTimeout(timer);
  });
  if (!current || paused) return null;
  const text = current.message ? current.title : [current.title, current.text].filter(Boolean).join(' · ');
  return (
    <button key={current.id} type="button" className={`notice notice--${current.tone || 'blue'}`} onClick={done} aria-live="polite" title={text}>
      <Icon name={NOTICE_ICON[current.tone] || 'info'} size={16} tone="plain" />
      <span>{text}</span>
    </button>
  );
}

function GameShell({ state, setState, slot, onReturnHome, onDeleteCurrent, onSlotsChanged }) {
  const [place, setPlaceState] = useState({ view: 'scene' });
  const [section, setSectionState] = useState(null);
  // Arriving somewhere (the opening ends, a journey ends, entering or leaving a
  // wild area) puts the player in that place's walkable scene.
  const arrivalKey = `${state.world?.currentLocationId}|${state.world?.activeTravel ? 'road' : 'here'}|${state.world?.wildAreaId || ''}|${state.story?.prologue}`;
  const lastArrival = useRef(arrivalKey);
  useEffect(() => {
    if (lastArrival.current === arrivalKey) return;
    lastArrival.current = arrivalKey;
    if (!state.world?.activeTravel) {
      setPlaceState({ view: 'scene' });
      setSectionState(null);
    }
  }, [arrivalKey, state.world?.activeTravel]);
  const [heroModalId, setHeroModalId] = useState(null);
  const [storyScene, setStoryScene] = useState(null);
  // A conversation open in the scene: queued cards wait until it closes.
  const [talking, setTalking] = useState(false);
  // A story scene waits until fights, decisions, reports and reward cards are done.
  const blocked = Boolean(
    state.activeEncounter || state.pendingRoadEvent || state.pendingReports?.length || state.moments?.length,
  );
  useEffect(() => {
    if (!storyScene && !blocked && !talking && state.story?.scene?.conversation) setStoryScene(state.story.scene.conversation);
  }, [storyScene, blocked, talking, state.story?.scene?.conversation]);
  const [reportModalRef, setReportModalRef] = useState(null);
  const [message, setMessage] = useState(null);
  // Short messages from anywhere (a disabled button saying why, src/components/UI.jsx toast).
  useEffect(() => {
    const show = (event) => setMessage({ text: event.detail.text, tone: event.detail.tone || 'blue', at: Date.now() });
    window.addEventListener('gol:toast', show);
    return () => window.removeEventListener('gol:toast', show);
  }, []);
  const [saveStatus, setSaveStatus] = useState('saved');
  const autosaveTimer = useRef(null);
  const summary = getDashboardSummary(state);
  useMenuKeys();

  const commitState = useCallback(
    (nextState, notice) => {
      const errors = validateGame(nextState);
      if (errors.length) {
        console.error('State validation failed:', errors);
        setMessage({ at: Date.now(), tone: 'red', text: `The action was blocked because state validation failed: ${errors[0]}` });
        return;
      }
      setState(nextState);
      setSaveStatus('unsaved');
      if (notice) setMessage(notice);
    },
    [setState],
  );

  const applyResult = useCallback(
    (result, successText) => {
      if (!result) return;
      if (result.error) {
        setMessage({ at: Date.now(), tone: 'red', text: result.error });
        return;
      }
      commitState(result.state, successText ? { tone: 'green', text: successText } : null);
    },
    [commitState],
  );

  const saveNow = useCallback(
    async (quiet = false) => {
      setSaveStatus('saving');
      const result = await saveGame(slot, state);
      if (result.ok) {
        setSaveStatus('saved');
        onSlotsChanged?.();
        if (!quiet)
          setMessage({
            at: Date.now(),
            tone: result.compacted ? 'gold' : 'green',
            text: result.compacted ? 'Campaign saved with older history compacted.' : 'Campaign saved.',
          });
      } else {
        setSaveStatus('error');
        setMessage({ at: Date.now(), tone: 'red', text: result.error });
      }
      return result;
    },
    [slot, state, onSlotsChanged],
  );

  useEffect(() => {
    if (!state.settings.autosave) return undefined;
    window.clearTimeout(autosaveTimer.current);
    autosaveTimer.current = window.setTimeout(() => saveNow(true), 700);
    return () => window.clearTimeout(autosaveTimer.current);
  }, [state, saveNow]);

  // Sound: settings, unlock on first gesture, and cues from state changes.
  useEffect(() => configureSound({ sound: state.settings.sound, volume: state.settings.volume }), [state.settings.sound, state.settings.volume]);
  useEffect(() => {
    const onPointer = (event) => {
      unlockAudio();
      if (event.target.closest?.('.button, button')) playSound('click');
    };
    window.addEventListener('pointerdown', onPointer);
    return () => window.removeEventListener('pointerdown', onPointer);
  }, []);
  // Battle sounds play in time with the battle animations (CombatArenaModal).
  const soundMemory = useRef({ crowns: state.guild.crowns, moment: null });
  useEffect(() => {
    const memory = soundMemory.current;
    if (state.guild.crowns > memory.crowns + 5) playSound('coin');
    memory.crowns = state.guild.crowns;
    const moment = state.moments?.[0];
    if (moment && moment.id !== memory.moment) {
      playSound({ levelUp: 'levelUp', victory: 'victory', rankings: 'fanfare', statusTitle: 'fanfare', nemesis: 'fanfare', construction: 'fanfare' }[moment.type] || 'confirm');
    }
    memory.moment = moment?.id || null;
  }, [state]);

  useEffect(() => setShowAssetIds(state.settings.showAssetIds), [state.settings.showAssetIds]);
  useEffect(() => {
    document.documentElement.classList.toggle('reduced-motion', state.settings.reducedMotion);
    document.documentElement.classList.toggle('compact-mode', state.settings.compactMode);
  }, [state.settings.reducedMotion, state.settings.compactMode]);

  const actions = useMemo(
    () => ({
      completePrologue: (options) => applyResult(completePrologue(state, options)),
      // Story scenes (src/data/dialogue/story.js): play one now, or close the one showing.
      playStoryScene: (missionId) => applyResult(playStoryScene(state, missionId)),
      finishStoryScene: (conversationId) => commitState(finishStoryScene(state, conversationId)),
      // Walkable scenes (src/explore). talk/chooseDialogue return UI follow-ups ({ open, recruit }).
      talk: (id, visit) => {
        const result = talkTo(state, id, visit);
        applyResult(result);
        return result.error ? null : result.ui || {};
      },
      // People in buildings (engine people.js): meeting them, and each step of a conversation.
      meetPerson: (id) => applyResult(meetPerson(state, id)),
      talkPerson: (id, choiceId) => {
        const result = talkToPerson(state, id, choiceId);
        // "It's done.": the report (and its reward moment) follows on the same state.
        if (!result.error && result.ui?.report) applyResult(reportContract(result.state, result.ui.report));
        else applyResult(result);
        return result.error ? null : result;
      },
      askTopic: (id, topicId) => {
        const result = askDialogueTopic(state, id, topicId);
        applyResult(result);
        return result.error ? null : result.ui || {};
      },
      chooseDialogue: (id, variantIndex, choiceIndex) => {
        const result = chooseDialogueOption(state, id, variantIndex, choiceIndex);
        applyResult(result);
        return result.error ? null : result.ui || {};
      },
      visitBuilding: (sceneId, targetId, position) => {
        commitState(recordSceneVisit(state, sceneId, targetId, position));
      },
      savePosition: (sceneId, position) => {
        const next = saveScenePosition(state, sceneId, position);
        if (next !== state) commitState(next);
      },
      enterWild: (areaId, fromPosition) => applyResult(enterWildArea(state, areaId, fromPosition)),
      leaveWild: (position) => applyResult(leaveWildArea(state, position)),
      gather: (areaId, spotId) => {
        const result = gatherAtSpot(state, areaId, spotId);
        applyResult(result, result.message);
      },
      restAtCamp: (areaId) => {
        const result = restAtCamp(state, areaId);
        applyResult(result, result.message);
      },
      fightWild: (areaId, groupId, position) => applyResult(startWildBattle(state, areaId, groupId, position)),
      // Contracts in the world (missions-in-world spec).
      acceptContract: (id) => applyResult(acceptContract(state, id), 'Added to your Journal.'),
      reportContract: (id) => applyResult(reportContract(state, id)),
      siteAct: (missionId, objectiveId, options) => {
        const result = siteAct(state, missionId, objectiveId, options);
        applyResult(result);
        return result.error ? null : result.result || {};
      },
      saveFormation: (formationType, assignments) => applyResult(saveFormation(state, formationType, assignments)),
      // Time only moves through actions: travel, contracts the founder joins,
      // camping, inns, and resting at the Guild Hall (which can also wait for a date).
      restAtHall: (days, tasks) => applyResult(restAtHall(state, days, tasks), `${days} day${days === 1 ? '' : 's'} pass at the hall.`),
      restAtInn: (nights) => applyResult(restAtInn(state, nights), 'Rested at the inn.'),
      advanceToDate: (date) => applyResult(advanceToDate(state, date)),
      autoAssignRooms: () => applyResult(autoAssignRooms(state), 'Heroes assigned to rooms.'),
      toggleMainParty: (heroId) => applyResult(toggleMainPartyMember(state, heroId)),
      makeLead: (heroId) => applyResult(setPartyLead(state, heroId), 'A new party lead.'),
      // A hero dragged onto something (src/components/DraggableHero.jsx). Rooms take
      // the hero, the main party adds or removes them; other drops go to the open screen.
      dropHero: (heroId, target) => {
        const inParty = (state.guild.mainParty || []).includes(heroId);
        // A Guild Hall room (training, infirmary), or the yard ('out') to take the hero out.
        if (target.kind === 'room') applyResult(assignRoom(state, heroId, target.id === 'out' ? null : target.id));
        else if (target.kind === 'party' && !inParty) applyResult(toggleMainPartyMember(state, heroId));
        else if (target.kind === 'bench' && inParty) applyResult(toggleMainPartyMember(state, heroId));
        else window.dispatchEvent(new CustomEvent('gol:drop-hero', { detail: { heroId, kind: target.kind, id: target.id } }));
        haptic('drop', state.settings);
      },
      recruit: (id, negotiation = 'accept', years = 2) => applyResult(recruitCandidate(state, id, negotiation, years), 'A new hero has joined the banner.'),
      resolveTownEvent: (optionId) => applyResult(resolveTownEvent(state, optionId)),
      startSideJob: (jobId, heroIds) => applyResult(startSideJob(state, jobId, heroIds), 'Off they go. Back next week.'),
      markNewsRead: () => commitState(markNewsRead(state)),
      declineContract: (missionId) => {
        if (window.confirm('Decline this contract? A rival guild will take it, and regional reputation drops a little.'))
          applyResult(declineContract(state, missionId));
      },
      challengeNemesis: (rivalId) => applyResult(challengeNemesis(state, rivalId), 'Challenge issued. Accept it when your party is ready.'),
      acceptChallenge: () => applyResult(acceptChallenge(state)),
      declineChallenge: () => applyResult(declineChallenge(state), 'Challenge declined.'),
      renewContract: (heroId, years) => applyResult(renewContract(state, heroId, years), 'Contract renewed.'),
      counterOffer: (heroId) => applyResult(counterOffer(state, heroId), 'The hero stays.'),
      makeOffer: (heroId) => {
        const result = makeOffer(state, heroId);
        applyResult(result, result.accepted ? 'The offer was accepted.' : null);
      },
      setMonthlyActivity: (id, activity) => commitState(setHeroMonthlyActivity(state, id, activity)),
      acknowledgeCouncilReport: () => commitState(acknowledgeCouncilReport(state)),
      renameGuild: (name) => applyResult(renameGuild(state, name), 'Guild identity updated.'),
      renameFounder: (name) => applyResult(renameFounderHero(state, name), 'Founder record updated.'),
      appointHero: (heroId, appointmentId) => applyResult(appointHero(state, heroId, appointmentId)),
      designateSuccessor: (heroId) => applyResult(designateSuccessor(state, heroId), 'Successor designated.'),
      assignMentor: (mentorId, apprenticeId) => applyResult(assignMentor(state, mentorId, apprenticeId), 'Mentorship established.'),
      assignBranchCommander: (branchId, heroId) => applyResult(assignBranchCommander(state, branchId, heroId), 'Branch commander assigned.'),
      foundBranch: (locationId, commanderId) => applyResult(foundBranch(state, locationId, commanderId), 'A new branch has been founded.'),
      upgradeBranch: (branchId) => applyResult(upgradeBranch(state, branchId), 'Branch expanded.'),
      assignArtifact: (artifactId, heroId) =>
        applyResult(assignArtifact(state, artifactId, heroId), heroId ? 'Artifact entrusted to a hero.' : 'Artifact returned to the guild vault.'),
      inheritAmbition: (legacyAmbitionId, heroId) =>
        applyResult(inheritAmbition(state, legacyAmbitionId, heroId), 'An unfinished ambition has found a new bearer.'),
      buyLot: () => applyResult(buyLot(state), 'The deed is yours.'),
      expandLot: () => applyResult(expandLot(state), 'The land next door is yours. Work begins.'),
      buildRoom: (type, equipment) => applyResult(buildRoom(state, type, equipment), 'The builders arrive.'),
      upgradeRoom: (roomId) => applyResult(upgradeRoom(state, roomId), 'The builders arrive.'),
      clearRoom: (roomId) => applyResult(clearRoom(state, roomId), 'The builders start clearing the slot.'),
      setRoomEquipment: (roomId, kind) => applyResult(setRoomEquipment(state, roomId, kind), 'New equipment in the room.'),
      assignRoom: (heroId, roomId) => applyResult(assignRoom(state, heroId, roomId)),
      upgradeGear: (heroId, slot) => applyResult(upgradeGear(state, heroId, slot), 'The smith hands it back, sharper.'),
      giftPatron: (patronId) => applyResult(giftPatron(state, patronId), 'A gift is sent with your compliments.'),
      signUpForTournament: (tournamentId, heroId) => applyResult(signUpForTournament(state, tournamentId, heroId), 'Signed up. Be here on the start day.'),
      startHeroCombat: (tournamentId) => applyResult(startHeroTournamentCombat(state, tournamentId)),
      startStoryDuel: (missionId) => applyResult(startStoryDuel(state, missionId)),
      readHistoryBoard: (loreIds) => {
        const next = readHistoryBoard(state, loreIds);
        if (next !== state) commitState(next);
      },
      enterGuildTournament: (tournamentId, formationType, assignments) => applyResult(enterGuildTournament(state, tournamentId, formationType, assignments)),
      startGuildCombat: (tournamentId) => applyResult(startGuildTournamentCombat(state, tournamentId)),
      combatRound: (commands) => applyResult(performActiveCombatAction(state, commands)),
      fleeCombat: () => applyResult(fleeActiveCombat(state)),
      buyItem: (itemId) => applyResult(buyItem(state, itemId)),
      sellItem: (itemId) => applyResult(sellItem(state, itemId)),
      equipItem: (heroId, itemId) => applyResult(equipItem(state, heroId, itemId)),
      unequipItem: (heroId, slot) => applyResult(unequipItem(state, heroId, slot)),
      useItem: (itemId, heroId) => applyResult(useItemOnHero(state, itemId, heroId)),
      acknowledgeMoment: () => commitState(acknowledgeMoment(state)),
      // A lost fight in a wild area or on a contract site: fight the same group again.
      retryWildBattle: () => applyResult(state.activeEncounter?.sourceType === 'site' ? retrySiteBattle(state) : retryWildBattle(state)),
      acceptDefeat: () => applyResult(acceptDefeat(state)),
      concludeCombat: () => applyResult(concludeCombatAndContinue(state)),
      travel: (destinationId) => applyResult(travelTo(state, destinationId)),
      continueJourney: () => applyResult(continueJourney(state)),
      resolveRoadEvent: (optionId) => applyResult(resolveRoadEvent(state, optionId)),
      refoundGuild: (options) => applyResult(refoundGuild(state, options), 'The guild has been refounded.'),
      takePatronLoan: () => applyResult(takePatronLoan(state), 'A patron has advanced the guild a loan.'),
      openReport: (reference) => setReportModalRef(reference),
      acknowledgeReport: (reference) => {
        commitState(acknowledgeReport(state, reference));
        setReportModalRef(null);
      },
      openHero: (id) => {
        if (!state.flags.firstHeroInspected) commitState(inspectHero(state, id));
        setHeroModalId(id);
      },
      releaseHero: (id) => {
        if (window.confirm('Release this hero from active service? This cannot be undone.')) {
          applyResult(releaseHero(state, id));
          setHeroModalId(null);
        }
      },
      updatePolicy: (key, value) => {
        const next = clone(state);
        next.guild.policies[key] = value;
        commitState(next);
      },
      updateSettings: (patch) => commitState(updateSettings(state, patch)),
      saveNow: () => saveNow(false),
      returnHome: async () => {
        await saveNow(true);
        onReturnHome();
      },
      exportSave: () => {
        const text = exportGame(state);
        const blob = new Blob([text], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `${state.guild.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-year-${state.date.year}.json`;
        anchor.click();
        URL.revokeObjectURL(url);
      },
      importSave: async (text) => {
        let imported;
        try {
          imported = importGame(text);
          const errors = validateGame(imported);
          if (errors.length) throw new Error(errors[0]);
        } catch (error) {
          setMessage({ at: Date.now(), tone: 'red', text: `Import failed: ${error.message}` });
          return;
        }
        const confirmed = window.confirm(`Import "${imported.guild.name}" (Year ${imported.date.year})?

This replaces slot ${slot} (${state.guild.name}). The current campaign in this slot will be lost.`);
        if (!confirmed) return;
        window.clearTimeout(autosaveTimer.current);
        setState(imported);
        setSaveStatus('saving');
        const result = await saveGame(slot, imported);
        if (result.ok) {
          setSaveStatus('saved');
          onSlotsChanged?.();
          setMessage({ at: Date.now(), tone: 'green', text: `Backup imported into slot ${slot}.` });
        } else {
          setSaveStatus('error');
          setMessage({ at: Date.now(), tone: 'red', text: `Backup loaded, but saving to slot ${slot} failed: ${result.error}` });
        }
      },
      // Cancel any pending autosave first so it cannot write the slot back mid-delete.
      deleteCurrent: () => onDeleteCurrent(() => window.clearTimeout(autosaveTimer.current)),
      dismissNotification: (id) => commitState(dismissNotification(state, id)),
    }),
    [state, setState, slot, commitState, applyResult, saveNow, onReturnHome, onDeleteCurrent, onSlotsChanged],
  );

  // Where the player is: the walkable scene (town or wild area) or the world map.
  // Everything else is a section in the one template, opened over the place.
  const traveling = Boolean(state.world?.activeTravel);
  const locationId = state.world?.currentLocationId || HOME_LOCATION_ID;
  const view = traveling ? 'map' : place.view;
  const sceneApi = useRef(null);
  const sceneId = state.world?.wildAreaId || state.world?.currentLocationId;
  const keepPosition = () => {
    const position = sceneApi.current?.position();
    if (position && view === 'scene') actions.savePosition(sceneId, position);
  };
  const setSection = (next) => {
    setOrb(null);
    setSectionState(next);
  };
  const navigate = (target) => {
    const route = resolveRoute(target);
    setOrb(null);
    setLedgerOpen(false);
    if (route.section) {
      setSectionState({ id: route.section, tab: route.tab ?? null, view: route.view || null });
      return;
    }
    if (route.view === 'interior') {
      if (!INTERIORS[route.building] || !townFor(locationId)?.buildings.some((item) => item.building === route.building)) {
        setMessage({ at: Date.now(), tone: 'blue', text: `There is no ${BUILDINGS[route.building]?.name.toLowerCase() || 'such place'} in ${LOCATION_BY_ID[locationId]?.name || 'this town'}.` });
        return;
      }
      if (view === 'scene') keepPosition();
      setSectionState(null);
      setPlaceState({ view: 'interior', building: route.building });
      return;
    }
    if (route.view === 'map' && view === 'scene') keepPosition();
    setSectionState(null);
    setPlaceState({ view: route.view === 'map' ? 'map' : 'scene', pin: route.pin || null });
  };
  // A person's service or a piece of furniture inside a building opens its panel.
  const openFromInterior = (ui) => {
    if (ui.open === 'shop') setSection({ id: 'shop', tab: ui.kind || null });
    else if (ui.open === 'inn') setSection({ id: 'inn', tab: null });
    else if (ui.open === 'arena') setSection({ id: 'arena', tab: ui.tab || null });
    else if (ui.open === 'records') navigate({ section: 'records', tab: ui.tab || 'rankings', view: ui.view || null });
    else if (ui.open === 'news') navigate('news');
    else if (ui.open === 'noticeBoard') navigate('missions');
    else if (ui.open) navigate(ui.open);
  };

  // One back behavior everywhere: the section's back button, Esc, or a swipe from the left edge.
  const goBack = () => {
    if (section?.id === 'hall' && section.tab) setSection({ ...section, tab: null });
    else if (section) setSection(null);
    else if ((view === 'map' && !traveling) || view === 'interior' || view === 'site') setPlaceState({ view: 'scene' });
  };
  const edge = useRef(null);

  // The HUD: two orbs and the ledger. One orb open at a time.
  const [orb, setOrb] = useState(null);
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const orbUses = state.settings.seenHints?.orbUses || 0;
  const openOrb = (side, open) => {
    setLedgerOpen(false);
    setOrb(open ? side : null);
    if (open && orbUses < 4) actions.updateSettings({ seenHints: { ...(state.settings.seenHints || {}), orbUses: orbUses + 1 } });
  };
  const roster = state.heroes.filter((hero) => !['dead', 'retired'].includes(hero.status));
  const injured = roster.filter((hero) => hero.status === 'injured').length;
  const story = getStoryView(state);
  const hallDone = (state.moments || []).some((moment) => moment.type === 'construction');
  const guildItems = [
    { id: 'party', label: 'Party', icon: 'party', badge: injured || null, onSelect: () => navigate('heroes') },
    { id: 'items', label: 'Items', icon: 'bag', onSelect: () => navigate('items') },
    { id: 'hall', label: hasHall(state) ? 'Guild Hall' : 'Empty lot', icon: 'castle', badge: hallDone || null, onSelect: () => navigate('hall') },
    { id: 'guild', label: 'Guild', icon: 'banner', onSelect: () => navigate('guild') },
    { id: 'contacts', label: 'Contacts', icon: 'contacts', onSelect: () => navigate('contacts') },
  ];
  const worldItems = [
    { id: 'map', label: 'Map', icon: 'map', onSelect: () => navigate('map') },
    { id: 'journal', label: 'Journal', icon: 'quill', badge: story.active?.current?.canTalk || state.newsUnread ? true : null, onSelect: () => navigate(story.active?.current?.canTalk ? 'quests' : 'journal') },
    { id: 'records', label: 'Records', icon: 'trophy', onSelect: () => navigate('rankings') },
    { id: 'system', label: 'System', icon: 'gear', onSelect: () => navigate('menu') },
  ];
  // The ledger: a short summary; each line opens its screen (docs/UX.md).
  const ledgerRows = [
    { id: 'gold', icon: 'coin', label: 'Gold', value: summary.crowns.toLocaleString(), num: summary.crowns, onOpen: () => navigate('finances') },
    { id: 'fame', icon: 'laurel', label: 'Fame', value: summary.fame.toLocaleString(), num: summary.fame, onOpen: () => navigate('reputation') },
    ...LADDERS.map((ladder) => ({
      id: ladder,
      icon: { strength: 'sword', legacy: 'scroll', official: 'crown' }[ladder],
      label: LADDER_LABELS[ladder],
      value: `#${summary.ranks[ladder].rank}`,
      num: summary.ranks[ladder].rank,
      rank: true,
      change: summary.movement[ladder] || 0,
      onOpen: () => navigate('rankings'),
    })),
    { id: 'title', icon: 'banner', label: 'Status', value: summary.statusTitle, onOpen: () => navigate('guild') },
    { id: 'known', icon: 'star', label: 'Known for', value: specializationTitle(state) || '—', onOpen: () => navigate('reputation') },
  ];

  // Keyboard shortcuts on desktop: P party, I items, G guild, J journal, Q quests, M map, R records, Esc system.
  useEffect(() => {
    const onKey = (event) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(event.target?.tagName || '')) return;
      if (document.querySelector('.modal-layer, .dialogue, .story-scene')) return;
      const key = event.key.toLowerCase();
      const routes = { p: 'heroes', i: 'items', g: 'guild', j: 'journal', q: 'quests', m: 'map', r: 'rankings' };
      if (routes[key]) {
        event.preventDefault();
        if (key === 'm' && view === 'map' && !section) goBack();
        else navigate(routes[key]);
      } else if (event.key === 'Escape' && !section && !orb && !ledgerOpen) {
        event.preventDefault();
        navigate('menu');
      } else if (event.key === 'Escape' && (orb || ledgerOpen)) {
        setOrb(null);
        setLedgerOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const placeProps = { state, actions, navigate, slot };
  const town = townFor(locationId);
  const wildArea = WILD_AREAS[state.world?.wildAreaId];
  const covered = Boolean(section);
  // Doors: a building with an interior is walked into; the Guild Hall and the notice board open as sections.
  const openBuilding = (id) => (INTERIORS[id] ? navigate({ view: 'interior', building: id }) : navigate({ noticeBoard: 'missions', guildHall: 'hall' }[id] || { section: id, tab: null }));
  const placeLayer =
    view === 'map' ? (
      <MapScreen {...placeProps} place={place} />
    ) : view === 'interior' && town && !wildArea ? (
      <InteriorScene key={`${locationId}-${place.building}`} building={place.building} {...placeProps} paused={covered} onTalk={setTalking} onLeave={() => setPlaceState({ view: 'scene' })} onOpen={openFromInterior} />
    ) : view === 'site' && town && !wildArea ? (
      <SiteScene key={place.site} siteId={place.site} {...placeProps} paused={covered} onTalk={setTalking} onLeave={() => setPlaceState({ view: 'scene' })} />
    ) : wildArea ? (
      <WildScene key={wildArea.id} area={wildArea} {...placeProps} paused={covered} apiRef={sceneApi} onTalk={setTalking} />
    ) : town ? (
      <TownScene key={town.id} town={town} {...placeProps} paused={covered} apiRef={sceneApi} onTalk={setTalking} openBuilding={openBuilding} showBuilding={openBuilding} openSite={(id) => setPlaceState({ view: 'site', site: id })} />
    ) : (
      <MapScreen {...placeProps} place={place} />
    );
  const innHere = locationId !== HOME_LOCATION_ID && locationBuildings(locationId).includes('tavern');
  // Panels opened from a building (a keeper's service, a shelf, a board) or the notice board.
  const renderBuilding = (id, tab) => {
    if (id === 'inn') return <InnRest state={state} actions={actions} />;
    if (id === 'noticeBoard') return <MissionsScreen {...placeProps} />;
    if (id === 'arena') return <ArenaScreen key={tab || 'arena'} {...placeProps} locationId={locationId} initialSpot={tab} />;
    if (id === 'shop') return <ShopScreen key={tab || 'all'} {...placeProps} kind={tab} />;
    return null;
  };

  const activeReportReference = reportModalRef || state.pendingReports?.[0] || null;
  const activeReport = getReport(state, activeReportReference);
  const defunct = isGuildDefunct(state);
  // The one interruption shown now: fights, decisions and road events first, then reports,
  // story scenes, reward moments, town events and the council report. Never two at once.
  const interruption = state.activeEncounter
    ? 'combat'
    : state.pendingRoadEvent
          ? 'road'
          : talking
            ? null
            : activeReport
            ? 'report'
            : storyScene
              ? 'scene'
              : state.moments?.length
                ? 'moment'
                : state.pendingEvent
                  ? 'event'
                  : state.council?.unread && !defunct
                    ? 'council'
                    : null;
  const closeReport = () => {
    if (!activeReportReference) return;
    const isPending = state.pendingReports?.some(
      (item) => item.id === (typeof activeReportReference === 'string' ? activeReportReference : activeReportReference.id),
    );
    if (isPending) actions.acknowledgeReport(activeReportReference);
    else setReportModalRef(null);
  };

  // Test hook (playthroughs, docs/PLAYTEST_CH1.md): the game state as short text.
  // The walkable scene adds its own window.render_game_to_text.
  useEffect(() => {
    window.gol_state_text = () =>
      JSON.stringify({
        view,
        section: section ? `${section.id}:${section.tab || ''}` : null,
        interruption,
        location: state.world?.currentLocationId,
        wild: state.world?.wildAreaId || null,
        travel: state.world?.activeTravel ? state.world.activeTravel.daysRemaining : null,
        date: state.date,
        gold: state.guild.crowns,
        fame: state.guild.fame,
        hall: hasHall(state),
        heroes: state.heroes.map((hero) => `${hero.name}|${hero.level}|${hero.status}|hp${hero.health ?? '-'}`),
        story: story.active ? `${story.active.id}:${story.active.current?.text || ''}` : story.next ? `next:${story.next.id}` : 'done',
        notices: state.notifications.length,
      });
    return () => {
      delete window.gol_state_text;
    };
  });

  if (state.story?.prologue !== 'done') {
    return <Prologue state={state} onComplete={actions.completePrologue} />;
  }

  return (
    <div
      className={`game game--${view}${section ? ' has-section' : ''}${interruption ? ' has-interruption' : ''}${!interruption && (message || state.notifications?.length) ? ' has-notice' : ''}`}
      onPointerDown={(event) => {
        edge.current = event.clientX < 24 ? { x: event.clientX, y: event.clientY } : null;
      }}
      onPointerUp={(event) => {
        const from = edge.current;
        edge.current = null;
        if (from && event.clientX - from.x > 80 && Math.abs(event.clientY - from.y) < 60) goBack();
      }}
    >
      <IconDefs />
      <div className="game__place">{placeLayer}</div>

      {section ? (
        <SectionView section={section} state={state} actions={actions} navigate={navigate} slot={slot} setSection={setSection} extras={{ renderBuilding, innHere, saveStatus }} />
      ) : null}

      {/* The HUD. The bottom corners belong to the orbs only while nothing else owns the bottom. */}
      {!interruption ? (
        <div className="hud">
          {view === 'map' && !section ? <PlaceTag title={traveling ? 'On the road' : 'World map'} sub={dateLine(state.date)} /> : null}
          <Ledger
            gold={summary.crowns}
            crest={<Asset id={CHARTERS[state.guild.charter]?.crest || 'crest.charter.free'} className="ledger__charter" />}
            rows={ledgerRows}
            open={ledgerOpen}
            onOpenChange={(open) => {
              setOrb(null);
              setLedgerOpen(open);
            }}
          />
          {orb ? <OrbScrim onClose={() => setOrb(null)} /> : null}
          {!section ? (
            <>
              <Orb side="left" icon="banner" label="Guild" items={guildItems} showLabel={orbUses < 4} open={orb === 'left'} onOpenChange={(open) => openOrb('left', open)} settings={state.settings} />
              <Orb side="right" icon="world" label="World" items={worldItems} showLabel={orbUses < 4} open={orb === 'right'} onOpenChange={(open) => openOrb('right', open)} settings={state.settings} />
            </>
          ) : null}
        </div>
      ) : null}

      <NoticeQueue notifications={state.notifications} message={message} paused={Boolean(interruption)} onDismiss={actions.dismissNotification} onMessageDone={() => setMessage(null)} />

      {/* One interruption at a time, in priority order (docs/UX.md). */}
      {interruption === 'combat' ? <CombatArenaModal encounter={state.activeEncounter} actions={actions} locationPrimal={summary.locationPrimal} speed={state.settings.battleSpeed === 2 ? 2 : 1} settings={state.settings} /> : null}
      {interruption === 'road' ? <RoadEventModal event={state.pendingRoadEvent} onChoose={actions.resolveRoadEvent} /> : null}
      {interruption === 'report' ? <ReportModal report={activeReport} onClose={closeReport} openHero={actions.openHero} /> : null}
      {interruption === 'scene' ? (
        <div className="story-scene">
          <DialogueBox
            key={storyScene}
            state={state}
            actions={actions}
            conversationId={storyScene}
            onClose={() => {
              actions.finishStoryScene(storyScene);
              setStoryScene(null);
            }}
            onOpenBuilding={(building) => openBuilding(building)}
          />
        </div>
      ) : null}
      {interruption === 'moment' ? <MomentModal moment={state.moments?.[0]} state={state} onClose={actions.acknowledgeMoment} /> : null}
      {interruption === 'event' ? <EventCardModal card={state.pendingEvent} onChoose={actions.resolveTownEvent} heroes={state.heroes} /> : null}
      <CouncilReportModal state={state} open={interruption === 'council'} onClose={actions.acknowledgeCouncilReport} openHero={actions.openHero} />
      <RefoundModal state={state} open={defunct && !interruption} onRefound={actions.refoundGuild} onReturnHome={actions.returnHome} />
      <HeroStatusScreen state={state} heroId={heroModalId} onClose={() => setHeroModalId(null)} onSelect={setHeroModalId} actions={actions} />
    </div>
  );
}

/** Away from home, the tavern is an inn: rest 1–3 nights (heals the party, passes time). */
function InnRest({ state, actions }) {
  const party = Math.max(1, travellingPartyIds(state).length);
  return (
    <section className="inn-rest">
      <div>
        <strong>Rooms for the night</strong>
        <small>
          {INN_NIGHT_COST} gold a night per traveller ({party} with you). Rest heals the party; the heroes at home keep to their tasks.
        </small>
      </div>
      <div className="inn-rest__buttons">
        {[1, 2, 3].map((nights) => (
          <Button key={nights} size="sm" disabled={state.guild.crowns < INN_NIGHT_COST * nights * party} why="Not enough gold." onClick={() => actions.restAtInn(nights)}>
            Rest {nights} night{nights === 1 ? '' : 's'} ({INN_NIGHT_COST * nights * party} gold)
          </Button>
        ))}
      </div>
    </section>
  );
}

export default function App() {
  const [slots, setSlots] = useState([]);
  const [state, setState] = useState(null);
  const [activeSlot, setActiveSlot] = useState(null);
  const [creatingSlot, setCreatingSlot] = useState(null);
  const [busy, setBusy] = useState(true);
  const [homeError, setHomeError] = useState(null);

  const refreshSlots = useCallback(async () => {
    const list = await listSaveSlots();
    setSlots(list);
  }, []);

  useEffect(() => {
    refreshSlots().finally(() => setBusy(false));
  }, [refreshSlots]);

  const loadSlot = async (slot) => {
    setBusy(true);
    setHomeError(null);
    try {
      const loaded = await loadGame(slot);
      if (!loaded) throw new Error('The selected slot is empty.');
      const errors = validateGame(loaded);
      if (errors.length) throw new Error(errors[0]);
      setState(loaded);
      setActiveSlot(slot);
    } catch (error) {
      setHomeError(error.message);
    } finally {
      setBusy(false);
    }
  };

  const createCampaign = async (options) => {
    const slot = creatingSlot;
    if (!slot) return;
    setBusy(true);
    try {
      const seed = options.seedText ? hashString(options.seedText) : undefined;
      const next = createNewGame({ ...options, seed });
      const result = await saveGame(slot, next);
      if (!result.ok) throw new Error(result.error);
      setCreatingSlot(null);
      setState(next);
      setActiveSlot(slot);
      await refreshSlots();
    } catch (error) {
      setHomeError(error.message);
    } finally {
      setBusy(false);
    }
  };

  const removeSlot = async (slot) => {
    if (!window.confirm(`Delete save slot ${slot}? This cannot be undone.`)) return;
    setBusy(true);
    const ok = await deleteGame(slot);
    if (!ok) setHomeError('The browser could not delete that save slot.');
    await refreshSlots();
    setBusy(false);
  };

  const deleteCurrent = async (cancelPendingSave) => {
    if (!window.confirm(`Delete ${state?.guild.name || 'this campaign'} permanently?`)) return;
    cancelPendingSave?.();
    await deleteGame(activeSlot);
    setState(null);
    setActiveSlot(null);
    await refreshSlots();
  };

  if (!state || !activeSlot) {
    return (
      <>
        <HomeScreen slots={slots} busy={busy} onLoad={loadSlot} onCreate={setCreatingSlot} onDelete={removeSlot} />
        {busy ? (
          <div className="loading-layer">
            <div className="loading-layer__box">
              <Crest size="sm" />
              <span>Opening the chronicle…</span>
            </div>
          </div>
        ) : null}
        {homeError ? (
          <button className="home-error" onClick={() => setHomeError(null)}>
            <strong>Could not complete that action</strong>
            <span>{homeError}</span>
            <i>×</i>
          </button>
        ) : null}
        <CreateCampaignModal open={Boolean(creatingSlot)} onClose={() => setCreatingSlot(null)} onCreate={createCampaign} />
      </>
    );
  }

  return (
    <GameShell
      state={state}
      setState={setState}
      slot={activeSlot}
      onReturnHome={() => {
        setState(null);
        setActiveSlot(null);
        refreshSlots();
      }}
      onDeleteCurrent={deleteCurrent}
      onSlotsChanged={refreshSlots}
    />
  );
}

export function RootApp() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
