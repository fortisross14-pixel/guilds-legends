import React, { Component, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  acknowledgeCouncilReport,
  acknowledgeReport,
  acknowledgeWelcome,
  autoResolveActiveMissionGame,
  appointHero,
  assignArtifact,
  assignBranchCommander,
  assignMentor,
  clearNotifications,
  clone,
  completeFallenBannerOpening,
  talkTo,
  chooseDialogueOption,
  saveScenePosition,
  recordSceneVisit,
  enterWildArea,
  leaveWildArea,
  gatherAtSpot,
  restAtCamp,
  startWildBattle,
  retryWildBattle,
  retreatToCamp,
  createNewGame,
  designateSuccessor,
  dismissNotification,
  enterGuildTournament,
  foundBranch,
  signUpForTournament,
  restAtHall,
  restAtInn,
  performActiveCombatAction,
  performActiveMissionGameAction,
  getDashboardSummary,
  getHero,
  getReport,
  getNextAction,
  hashString,
  inheritAmbition,
  inspectGoals,
  inspectHero,
  inspectMission,
  isGuildDefunct,
  launchExpedition,
  notePartySelection,
  recruitCandidate,
  refoundGuild,
  releaseHero,
  renameFounderHero,
  renameGuild,
  resolveDecision,
  saveFormation,
  setHeroMonthlyActivity,
  setHeroTraining,
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
  noteTutorialStep,
  skipTutorial,
  LADDERS,
  LADDER_LABELS,
  continueJourney,
  resolveRoadEvent,
  advanceToDate,
  sendIdleHeroesTo,
  autoAssignRooms,
  toggleMainPartyMember,
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
  rentBed,
  giftPatron,
  acquireHall,
  buildRoom,
  upgradeGear,
  validateGame,
} from './game/engine.js';
import { deleteGame, exportGame, importGame, listSaveSlots, loadGame, saveGame } from './game/storage.js';
import { CLASSES, MONTHS } from './data/content.js';
import { LOCATION_BY_ID, PRIMALS } from './data/world.js';
import { Badge, Button, Crest, HeroPortrait, Modal, RankChange, SceneBackdrop, useMenuKeys } from './components/UI.jsx';
import PixelIcon, { LADDER_ICONS, PLACE_ICONS } from './components/PixelIcon.jsx';
import MapScreen from './places/MapScreen.jsx';
import TownScreen from './places/TownScreen.jsx';
import MenuScreen from './places/MenuScreen.jsx';
import { resolveRoute } from './places/routes.js';
import CouncilReportModal from './components/CouncilReportModal.jsx';
import CombatArenaModal from './components/CombatArenaModal.jsx';
import MissionGameModal from './components/MissionGameModal.jsx';
import RoadEventModal from './components/RoadEventModal.jsx';
import UpcomingStrip from './components/UpcomingStrip.jsx';
import MomentModal from './components/MomentModal.jsx';
import EventCardModal from './components/EventCardModal.jsx';
import { configureSound, playSound, unlockAudio } from './audio/sfx.js';
import PartyRail from './components/PartyRail.jsx';
import HeroStatusScreen from './components/HeroStatusScreen.jsx';
import FallenBannerOpening from './components/FallenBannerOpening.jsx';
import Asset from './components/Asset.jsx';
import { CHARTERS, CHARTER_LIST, PATHS } from './data/charters.js';
import { specializationTitle } from './game/engine.js';

// Three places replace the old 11-item navigation.
const PLACE_NAV = [
  { id: 'map', label: 'World', glyph: 'world' },
  { id: 'town', label: 'Guild', glyph: 'guild' },
  { id: 'menu', label: 'Chronicle', glyph: 'chronicle' },
];

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

function formatPlayed(value) {
  if (!value) return 'Never played';
  try {
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
  } catch {
    return 'Saved campaign';
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
          <p>Discover imperfect heroes. Give them a banner. Survive their failures. Preserve their names after they are gone.</p>
        </header>
        <nav className="save-menu" aria-label="Save slots">
          <ul className="cmd-menu" data-menu>
            {[1, 2, 3].map((slot) => {
              const meta = slots.find((item) => item.slot === slot);
              return (
                <li className={`save-slot ${meta ? 'save-slot--filled' : 'save-slot--empty'}`} key={slot}>
                  <button className="save-menu__main" onClick={() => (meta ? onLoad(slot) : onCreate(slot))} disabled={busy}>
                    <span className="save-menu__verb">{meta ? 'Continue' : 'New Game'}</span>
                    <span className="save-menu__slot">Slot {slot}</span>
                    {meta ? (
                      <span className="save-menu__meta">
                        <strong>{meta.guildName}</strong>
                        <span className="num">
                          Year {meta.year} · {meta.tier} · Rank #{meta.rank} · {meta.activeHeroes} heroes · Fame <b>{meta.fame}</b> · Legacy {meta.legacy}
                        </span>
                        <small>Last played {formatPlayed(meta.lastPlayedAt)}</small>
                      </span>
                    ) : (
                      <span className="save-menu__meta">
                        <small>Empty chronicle. Begin in Year 1187 as a founder looking for a first companion.</small>
                      </span>
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
        <footer className="home-footer">
          <span>Saves stay in this browser</span>
          <span>Made for 5–15 minute sessions</span>
          <span>A campaign can span centuries</span>
        </footer>
      </div>
    </div>
  );
}

function CreateCampaignModal({ open, slot, onClose, onCreate }) {
  const [guildName, setGuildName] = useState('The Broken Lantern');
  const [founderName, setFounderName] = useState('Rowan Vale');
  const [founderClass, setFounderClass] = useState('Guardian');
  const [founderPrimal, setFounderPrimal] = useState('Fire');
  const [motto, setMotto] = useState('No light is lost forever.');
  const [seedText, setSeedText] = useState('Dunmere');
  const [charter, setCharter] = useState('free');

  useEffect(() => {
    if (open) {
      setCharter('free');
      setGuildName('The Broken Lantern');
      setFounderName('Rowan Vale');
      setFounderClass('Guardian');
      setFounderPrimal('Fire');
      setMotto('No light is lost forever.');
      setSeedText('Dunmere');
    }
  }, [open]);

  const classInfo = CLASSES[founderClass];
  return (
    <Modal open={open} title={`Found campaign in slot ${slot}`} eyebrow="Year 1187 · Dunmere" onClose={onClose} width="wide">
      <div className="new-campaign new-campaign--founder">
        <div className="new-campaign__crest">
          <Crest size="xl" />
        </div>
        <div className="new-campaign__fields">
          <label>
            Guild name
            <input value={guildName} maxLength={38} onChange={(event) => setGuildName(event.target.value)} />
          </label>
          <label>
            Your name
            <input value={founderName} maxLength={36} onChange={(event) => setFounderName(event.target.value)} />
            <small>You are an active hero, not an invisible administrator.</small>
          </label>
          <label>
            Your class
            <select value={founderClass} onChange={(event) => setFounderClass(event.target.value)}>
              {Object.keys(CLASSES).map((classId) => (
                <option key={classId}>{classId}</option>
              ))}
            </select>
          </label>
          <label>
            Your primal
            <select value={founderPrimal} onChange={(event) => setFounderPrimal(event.target.value)}>
              {Object.values(PRIMALS).map((primal) => (
                <option key={primal.id} value={primal.id}>
                  {primal.icon} {primal.id}
                </option>
              ))}
            </select>
            <small>Primal is permanent. It affects combat matchups.</small>
          </label>
          <label>
            Motto
            <input value={motto} maxLength={72} onChange={(event) => setMotto(event.target.value)} />
          </label>
          <label>
            World seed
            <input value={seedText} maxLength={40} onChange={(event) => setSeedText(event.target.value)} />
            <small>The same seed produces the same opening candidates and rival variation.</small>
          </label>
        </div>
        <div className="founder-preview">
          <HeroPortrait hero={{ name: founderName || 'Founder', classId: founderClass, primal: founderPrimal, rarity: 'Common' }} size="md" showStatus={false} />
          <div>
            <h3>{founderName || 'Unnamed founder'}</h3>
            <p>
              Level 1 · {PRIMALS[founderPrimal]?.icon} {founderPrimal} · {founderClass} · {classInfo?.description}
            </p>
          </div>
        </div>
        <fieldset className="charter-picker">
          <legend>Founding charter: what kind of guild will this be?</legend>
          <div className="charter-picker__options">
            {CHARTER_LIST.map((item) => (
              <button key={item.id} type="button" className={`charter-card ${charter === item.id ? 'is-selected' : ''}`} aria-pressed={charter === item.id} onClick={() => setCharter(item.id)}>
                <Asset id={item.crest} className="charter-card__crest" />
                <strong>{item.name}</strong>
                <small>{item.pitch}</small>
                <ul>
                  {item.modifiers.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                <em>
                  {PATHS[item.path].name} path · {item.signature}
                </em>
              </button>
            ))}
          </div>
        </fieldset>
        <div className="new-campaign__premise">
          <strong>The Broken Lantern scenario</strong>
          <p>
            The previous guild disappeared in the Blackwood. You begin alone in a rented hall. Your first objective is to hire one companion, then prove the new
            company on the Old Road.
          </p>
        </div>
        <Button
          variant="primary"
          size="lg"
          disabled={!guildName.trim() || !founderName.trim()}
          onClick={() => onCreate({ guildName: guildName.trim(), founderName: founderName.trim(), founderClass, founderPrimal, motto: motto.trim(), seedText, charter })}
        >
          Raise the banner
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
            All {fallen} heroes of {state.guild.name} are dead or retired. The guild keeps its name, treasury ({state.guild.crowns} crowns), history and
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
                  {primal.icon} {primal.id}
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

function IntroModal({ state, actions }) {
  if (state.tutorial.completed || state.tutorial.step !== 0) return null;
  return (
    <Modal open title="The Broken Lantern" eyebrow={`Dunmere · Year ${state.date.year}`} preventClose width="medium">
      <div className="intro-card">
        <Crest size="xl" />
        <p>The old guild of the Broken Lantern marched into the Blackwood and never came back. All that is left is its banner, and you, its new founder.</p>
        <p>
          Hire a companion at the Tavern, take a contract from the Notice Board, and win your first fight. Then the rankings will start to notice{' '}
          {state.guild.name}.
        </p>
        <div className="save-actions">
          <Button variant="primary" size="lg" onClick={actions.acknowledgeWelcome}>
            Raise the banner
          </Button>
          <Button onClick={actions.skipTutorial}>Skip tutorial</Button>
        </div>
      </div>
    </Modal>
  );
}

function DecisionModal({ state, actions }) {
  const decision = state.pendingDecisions[0];
  if (!decision) return null;
  const mission = state.activeMissions.find((item) => item.id === decision.missionId);
  const combatResolved = Boolean(decision.combatResolved && decision.combatSummary);
  const missionGameResolved = Boolean(decision.missionGameResolved && decision.missionGameSummary);
  const lockedResult = combatResolved || missionGameResolved;
  const heroes = mission?.assignments.map((assignment) => ({ ...assignment, hero: getHero(state, assignment.heroId) })).filter((item) => item.hero) || [];
  return (
    <Modal
      open
      title={decision.title}
      eyebrow={
        lockedResult
          ? `${combatResolved ? 'Combat' : decision.missionGameSummary.type} resolved · ${decision.forcedGrade} · Choose the aftermath`
          : 'Critical expedition decision · Time paused'
      }
      preventClose
      width="wide"
    >
      <div className="decision-scene">
        <div className="decision-scene__party">
          {heroes.map(({ hero, role }) => (
            <div key={hero.id}>
              <HeroPortrait hero={hero} size="sm" />
              <span>
                <strong>{hero.name}</strong>
                <small>
                  {role} · PWR {hero.power}
                </small>
              </span>
            </div>
          ))}
        </div>
        <blockquote>{decision.prompt}</blockquote>
        {combatResolved ? (
          <div className="combat-aftermath-callout">
            <Badge tone={decision.combatSummary.playerWon ? 'green' : 'red'}>{decision.combatSummary.playerWon ? 'Battle won' : 'Battle lost'}</Badge>
            <div>
              <strong>The tactical result is locked.</strong>
              <p>
                {decision.combatSummary.turns} turns · you left with {decision.combatSummary.playerHpPct}% field strength · opposition{' '}
                {decision.combatSummary.enemyHpPct}%. Your choice now determines rewards, obligations and what the guild does next—not whether the battle
                secretly rerolls.
              </p>
            </div>
          </div>
        ) : null}
        {missionGameResolved ? (
          <div className="combat-aftermath-callout">
            <Badge tone={decision.missionGameSummary.status === 'won' ? 'green' : decision.missionGameSummary.status === 'partial' ? 'gold' : 'red'}>
              {decision.missionGameSummary.type} {decision.missionGameSummary.status}
            </Badge>
            <div>
              <strong>The playable mission result is locked.</strong>
              <p>
                {decision.missionGameSummary.turns} turns · performance {decision.missionGameSummary.performance} · grade {decision.missionGameSummary.grade}.
                The aftermath can change rewards, relationships and obligations, but it will not reroll the challenge.
              </p>
            </div>
          </div>
        ) : null}
        <div className="decision-options" data-menu>
          {decision.options.map((option, index) => (
            <button key={option.id} onClick={() => actions.resolveDecision(decision.id, option.id)}>
              <span className="decision-options__key">{index + 1}</span>
              <div>
                <h3>{option.label}</h3>
                <p>{option.note}</p>
                <div className="decision-options__effects">
                  {!lockedResult && option.power ? (
                    <Badge tone={option.power >= 0 ? 'green' : 'red'}>
                      {option.power >= 0 ? '+' : ''}
                      {option.power} mission edge
                    </Badge>
                  ) : null}
                  {option.fame ? (
                    <Badge tone="gold">
                      {option.fame >= 0 ? '+' : ''}
                      {option.fame} narrative fame
                    </Badge>
                  ) : null}
                  {option.reward ? (
                    <Badge tone="blue">
                      {option.reward >= 0 ? '+' : ''}
                      {option.reward} base reward
                    </Badge>
                  ) : null}
                  {option.artifact ? <Badge tone="purple">Artifact possibility</Badge> : null}
                </div>
              </div>
              <span className="decision-options__arrow">›</span>
            </button>
          ))}
        </div>
        <p className="decision-scene__warning">
          {lockedResult
            ? 'The decisive gameplay is over. This choice changes consequences, relationships and rewards.'
            : 'Important choices alter odds and consequences. They do not reveal the final roll.'}
        </p>
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

function Toasts({ notifications, onDismiss, onClear }) {
  if (!notifications.length) return null;
  return (
    <div className="toast-stack" aria-live="polite">
      {notifications.slice(-4).map((notification) => (
        <button key={notification.id} className={`toast toast--${notification.tone}`} onClick={() => onDismiss(notification.id)}>
          <span>{notification.tone === 'green' ? '✓' : notification.tone === 'red' ? '!' : notification.tone === 'purple' ? '✦' : '◆'}</span>
          <div>
            <strong>{notification.title}</strong>
            <p>{notification.text}</p>
          </div>
          <i>×</i>
        </button>
      ))}
      {notifications.length > 4 ? (
        <button className="toast-clear" onClick={onClear}>
          Clear {notifications.length} notices
        </button>
      ) : null}
    </div>
  );
}

function GameShell({ state, setState, slot, onReturnHome, onDeleteCurrent, onSlotsChanged }) {
  const [place, setPlaceState] = useState({ view: 'town' });
  // Arriving somewhere (the opening ends, a journey ends, entering or leaving a
  // wild area) puts the player in that place's walkable scene.
  const arrivalKey = `${state.world?.currentLocationId}|${state.world?.activeTravel ? 'road' : 'here'}|${state.world?.wildAreaId || ''}|${state.flags?.opening?.phase}`;
  const lastArrival = useRef(arrivalKey);
  useEffect(() => {
    if (lastArrival.current === arrivalKey) return;
    lastArrival.current = arrivalKey;
    if (!state.world?.activeTravel) setPlaceState({ view: 'town' });
  }, [arrivalKey, state.world?.activeTravel]);
  const [heroModalId, setHeroModalId] = useState(null);
  // The journal (next step + upcoming events) is a per-viewer convenience kept in localStorage.
  const [journalOpen, setJournalOpen] = useState(() => {
    try {
      return window.localStorage.getItem('gol.journalOpen') === '1';
    } catch {
      return false;
    }
  });
  const toggleJournal = () => {
    setJournalOpen((current) => {
      try {
        window.localStorage.setItem('gol.journalOpen', current ? '0' : '1');
      } catch {
        /* storage unavailable: keep the in-memory choice */
      }
      return !current;
    });
  };
  const [reportModalRef, setReportModalRef] = useState(null);
  const [message, setMessage] = useState(null);
  const [saveStatus, setSaveStatus] = useState('saved');
  const autosaveTimer = useRef(null);
  const summary = getDashboardSummary(state);
  const nextAction = getNextAction(state);
  useMenuKeys();

  const commitState = useCallback(
    (nextState, notice) => {
      const errors = validateGame(nextState);
      if (errors.length) {
        console.error('State validation failed:', errors);
        setMessage({ tone: 'red', text: `The action was blocked because state validation failed: ${errors[0]}` });
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
        setMessage({ tone: 'red', text: result.error });
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
            tone: result.compacted ? 'gold' : 'green',
            text: result.compacted ? 'Campaign saved with older history compacted.' : 'Campaign saved.',
          });
      } else {
        setSaveStatus('error');
        setMessage({ tone: 'red', text: result.error });
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

  useEffect(() => {
    document.documentElement.classList.toggle('reduced-motion', state.settings.reducedMotion);
    document.documentElement.classList.toggle('compact-mode', state.settings.compactMode);
  }, [state.settings.reducedMotion, state.settings.compactMode]);

  const actions = useMemo(
    () => ({
      acknowledgeWelcome: () => commitState(acknowledgeWelcome(state)),
      completeFallenBannerOpening: (choices) => commitState(completeFallenBannerOpening(state, choices)),
      // Walkable scenes (src/explore). talk/chooseDialogue return UI follow-ups ({ open, recruit }).
      talk: (id, visit) => {
        const result = talkTo(state, id, visit);
        applyResult(result);
        return result.error ? null : result.ui || {};
      },
      chooseDialogue: (id, variantIndex, choiceIndex) => {
        const result = chooseDialogueOption(state, id, variantIndex, choiceIndex);
        applyResult(result);
        return result.error ? null : result.ui || {};
      },
      visitBuilding: (sceneId, targetId, position, building) => {
        let next = recordSceneVisit(state, sceneId, targetId, position);
        if (building === 'herald') next = noteTutorialStep(next, 'visitHerald');
        commitState(next);
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
      inspectMission: (id) => commitState(inspectMission(state, id)),
      notePartySelection: (id, formationType, assignments) => {
        const next = notePartySelection(state, id, formationType, assignments);
        if (next.tutorial.step !== state.tutorial.step) commitState(next);
      },
      launchMission: (id, formationType, assignments) => applyResult(launchExpedition(state, id, formationType, assignments), 'The company has set out.'),
      saveFormation: (formationType, assignments) => applyResult(saveFormation(state, formationType, assignments)),
      // Time only moves through actions: travel, contracts the founder joins,
      // camping, inns, and resting at the Guild Hall (which can also wait for a date).
      restAtHall: (weeks, tasks) => applyResult(restAtHall(state, weeks, tasks), weeks >= 4 ? 'The guild rests and works.' : 'A quiet week at the hall.'),
      restAtInn: (nights) => applyResult(restAtInn(state, nights), 'Rested at the inn.'),
      advanceToDate: (date) => applyResult(advanceToDate(state, date)),
      sendIdleHeroesTo: (activity) => applyResult(sendIdleHeroesTo(state, activity)),
      autoAssignRooms: () => applyResult(autoAssignRooms(state), 'Heroes assigned to rooms.'),
      toggleMainParty: (heroId) => applyResult(toggleMainPartyMember(state, heroId)),
      resolveDecision: (decisionId, optionId) => applyResult(resolveDecision(state, decisionId, optionId)),
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
      setTraining: (id, training) => commitState(setHeroTraining(state, id, training)),
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
      rentBed: () => applyResult(rentBed(state), 'Another bed squeezed into the rented room.'),
      acquireHall: (mode) => applyResult(acquireHall(state, mode)),
      buildRoom: (roomId) => applyResult(buildRoom(state, roomId), 'The builders arrive.'),
      upgradeGear: (heroId, slot) => applyResult(upgradeGear(state, heroId, slot), 'The smith hands it back, sharper.'),
      giftPatron: (patronId) => applyResult(giftPatron(state, patronId), 'A gift is sent with your compliments.'),
      signUpForTournament: (tournamentId, heroId) => applyResult(signUpForTournament(state, tournamentId, heroId), 'Signed up. Be here on the start day.'),
      startHeroCombat: (tournamentId) => applyResult(startHeroTournamentCombat(state, tournamentId)),
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
      noteTutorial: (target) => {
        const next = noteTutorialStep(state, target);
        if (next !== state) commitState(next);
      },
      finishTutorial: () => commitState(noteTutorialStep(state, 'finishTutorial')),
      skipTutorial: () => {
        if (window.confirm('Skip the tutorial? You can play freely from here.')) commitState(skipTutorial(state));
      },
      retryWildBattle: () => applyResult(retryWildBattle(state)),
      retreatToCamp: () => applyResult(retreatToCamp(state), 'The party falls back to the camp.'),
      missionGameAction: (actionId, leadHeroId) => applyResult(performActiveMissionGameAction(state, actionId, leadHeroId)),
      autoResolveMissionGame: () => applyResult(autoResolveActiveMissionGame(state)),
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
        const next = inspectHero(state, id);
        if (next.tutorial.step !== state.tutorial.step) commitState(next);
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
      inspectGoals: () => commitState(inspectGoals(state)),
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
          setMessage({ tone: 'red', text: `Import failed: ${error.message}` });
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
          setMessage({ tone: 'green', text: `Backup imported into slot ${slot}.` });
        } else {
          setSaveStatus('error');
          setMessage({ tone: 'red', text: `Backup loaded, but saving to slot ${slot} failed: ${result.error}` });
        }
      },
      // Cancel any pending autosave first so it cannot write the slot back mid-delete.
      deleteCurrent: () => onDeleteCurrent(() => window.clearTimeout(autosaveTimer.current)),
      dismissNotification: (id) => commitState(dismissNotification(state, id)),
      clearNotifications: () => commitState(clearNotifications(state)),
    }),
    [state, setState, slot, commitState, applyResult, saveNow, onReturnHome, onDeleteCurrent, onSlotsChanged],
  );

  const setPlace = (next) => {
    setPlaceState(next);
    window.scrollTo({ top: 0, behavior: state.settings.reducedMotion ? 'auto' : 'smooth' });
  };
  const navigate = (target) => {
    const route = resolveRoute(target);
    setPlace({ ...route });
    if (route.page === 'codex' && route.tab === 'goals' && !state.flags.goalsInspected) actions.inspectGoals();
  };

  const placeProps = { state, actions, navigate, slot, place, setPlace };
  const renderedScreen =
    place.view === 'town' ? <TownScreen {...placeProps} /> : place.view === 'menu' ? <MenuScreen {...placeProps} /> : <MapScreen {...placeProps} />;
  const townName = LOCATION_BY_ID[state.world?.currentLocationId]?.name || 'Town';

  const activeReportReference = reportModalRef || state.pendingReports?.[0] || null;
  const activeReport = getReport(state, activeReportReference);
  const defunct = isGuildDefunct(state);
  const closeReport = () => {
    if (!activeReportReference) return;
    const isPending = state.pendingReports?.some(
      (item) => item.id === (typeof activeReportReference === 'string' ? activeReportReference : activeReportReference.id),
    );
    if (isPending) actions.acknowledgeReport(activeReportReference);
    else setReportModalRef(null);
  };

  if (state.flags?.opening?.phase && state.flags.opening.phase !== 'complete') {
    return <FallenBannerOpening state={state} onComplete={actions.completeFallenBannerOpening} />;
  }

  return (
    <div className="game-shell">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <Crest size="md" />
          <div>
            <strong>{state.guild.name}</strong>
            <small>
              {state.guild.tier} · Year {state.date.year}
            </small>
          </div>
        </div>
        <nav aria-label="Places" data-menu>
          {PLACE_NAV.map((item) => (
            <button
              key={item.id}
              className={place.view === item.id ? 'is-active' : ''}
              aria-current={place.view === item.id ? 'page' : undefined}
              onClick={() => navigate(item.id)}
            >
              <PixelIcon name={PLACE_ICONS[item.glyph]} size={24} />
              <strong>{item.id === 'town' ? `Guild · ${townName}` : item.label}</strong>
              {item.id === 'town' && state.pendingDecisions.length ? <i className="nav-alert">{state.pendingDecisions.length}</i> : null}
            </button>
          ))}
        </nav>
        <div className="sidebar__footer">
          <div className={`save-indicator save-indicator--${saveStatus}`}>
            <i />
            {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'unsaved' ? 'Unsaved' : saveStatus === 'error' ? 'Save error' : 'Saved'}
          </div>
          <button onClick={() => actions.saveNow()}>Save slot {slot}</button>
        </div>
      </aside>

      <div className="game-main">
        <header className="topbar">
          <button className="topbar__date" onClick={() => navigate('calendar')} title="Open the calendar">
            <span className="topbar__month">
              {MONTHS[state.date.month]} · Week {(state.date.week || 0) + 1} · Day {(state.date.day || 0) + 1}
            </span>
            <strong>{state.date.year}</strong>
          </button>
          <button className="topbar__location" onClick={() => navigate('world')} title="Current guild location">
            <i>{summary.travel ? '➜' : PRIMALS[summary.locationPrimal]?.icon || '⌖'}</i>
            <span>{summary.travel ? `Traveling · ${summary.travel.daysRemaining}d` : summary.location}</span>
          </button>
          <button className="topbar__identity" onClick={() => navigate('rankings')} title="Your charter, and what the guild is known for (the Herald)">
            <Asset id={CHARTERS[state.guild.charter]?.crest || 'crest.charter.free'} className="topbar__crest" />
            <span>
              <b>{CHARTERS[state.guild.charter]?.name || 'Free Company'}</b>
              <small>{specializationTitle(state) || 'Known for nothing yet'}</small>
            </span>
          </button>
          <div className="topbar__resources">
            <span className="topbar__gold" title="Treasury">
              <PixelIcon name="coin" size={24} />
              <b>{summary.crowns.toLocaleString()}</b>
            </span>
            {LADDERS.map((ladder) => (
              <span
                key={ladder}
                className="topbar__rank"
                title={`${LADDER_LABELS[ladder]} ladder (${summary.tier}): #${summary.ranks[ladder].rank} of ${summary.ranks[ladder].total}`}
              >
                <PixelIcon name={LADDER_ICONS[ladder]} size={24} label={LADDER_LABELS[ladder]} />
                <b>#{summary.ranks[ladder].rank}</b>
                <RankChange change={summary.movement[ladder]} />
              </span>
            ))}
            <button className="topbar__rank-chip" onClick={() => navigate('rankings')} title="Strength · Legacy · Official ranks">
              ⚔{summary.ranks.strength.rank} ▤{summary.ranks.legacy.rank} ♛{summary.ranks.official.rank}
            </button>
            <button className="topbar__status" onClick={() => navigate('rankings')} title="Status title from the Official ladder">
              {summary.statusTitle}
            </button>
          </div>
          <button
            className={`topbar__journal topbar__journal--${nextAction.kind}`}
            onClick={toggleJournal}
            aria-expanded={journalOpen}
            aria-controls="journal"
            title="Journal: next step and upcoming events"
          >
            <span className="topbar__journal-mark" aria-hidden="true">
              {nextAction.kind === 'tutorial' ? nextAction.step : nextAction.kind === 'critical' ? '!' : '✦'}
            </span>
            <span className="topbar__journal-title">{nextAction.title}</span>
            <i aria-hidden="true">{journalOpen ? '▴' : '▾'}</i>
          </button>
        </header>
        {journalOpen ? (
          <div className="journal" id="journal" role="region" aria-label="Journal">
            <section className={`objective-ribbon objective-ribbon--${nextAction.kind}`}>
              <span className="objective-ribbon__mark">{nextAction.kind === 'tutorial' ? nextAction.step : nextAction.kind === 'critical' ? '!' : '✦'}</span>
              <div className="objective-ribbon__text">
                <strong className="objective-ribbon__title">{nextAction.title}</strong>
                <span className="objective-ribbon__body">
                  {nextAction.body}
                  {typeof nextAction.progress === 'number' && typeof nextAction.target === 'number' ? ` (${nextAction.progress}/${nextAction.target})` : ''}
                </span>
              </div>
              <div className="objective-ribbon__actions">
                <Button
                  size="sm"
                  variant={nextAction.kind === 'critical' ? 'danger' : 'primary'}
                  onClick={() => {
                    if (nextAction.target === 'acknowledgeWelcome') {
                      actions.acknowledgeWelcome();
                      navigate('town');
                    } else if (nextAction.target === 'finishTutorial') actions.finishTutorial();
                    else navigate(nextAction.screen || 'hall');
                  }}
                >
                  {nextAction.kind === 'critical' ? 'Resolve' : nextAction.target === 'finishTutorial' ? 'Finish tutorial' : 'Go'}
                </Button>
                {nextAction.kind === 'tutorial' ? (
                  <Button size="sm" variant="secondary" onClick={actions.skipTutorial}>
                    Skip tutorial
                  </Button>
                ) : null}
              </div>
            </section>
            <UpcomingStrip state={state} actions={actions} navigate={navigate} />
          </div>
        ) : null}
        {message ? (
          <button className={`message-bar message-bar--${message.tone}`} onClick={() => setMessage(null)}>
            <span>{message.tone === 'red' ? '!' : message.tone === 'green' ? '✓' : '◆'}</span>
            <p>{message.text}</p>
            <i>×</i>
          </button>
        ) : null}
        <main className="screen-container" key={`${place.view}-${place.building || ''}-${place.page || ''}`}>
          {renderedScreen}
        </main>
      </div>

      <nav className="mobile-nav" aria-label="Places" data-menu>
        {PLACE_NAV.map((item) => (
          <button
            key={item.id}
            className={place.view === item.id ? 'is-active' : ''}
            aria-current={place.view === item.id ? 'page' : undefined}
            onClick={() => navigate(item.id)}
          >
            <PixelIcon name={PLACE_ICONS[item.glyph]} size={24} />
            <small>{item.label}</small>
          </button>
        ))}
      </nav>
      <PartyRail state={state} onOpenHero={actions.openHero} onOpenQuests={() => navigate('quests')} />
      <CombatArenaModal encounter={state.activeEncounter} actions={actions} locationPrimal={summary.locationPrimal} speed={state.settings.battleSpeed === 2 ? 2 : 1} />
      <MissionGameModal game={state.activeMissionGame} actions={actions} />
      <DecisionModal state={state} actions={actions} />
      <IntroModal state={state} actions={actions} />
      <RoadEventModal event={state.pendingRoadEvent} onChoose={actions.resolveRoadEvent} />
      <EventCardModal
        card={!state.activeEncounter && !state.pendingDecisions.length && !state.pendingRoadEvent && !state.activeMissionGame ? state.pendingEvent : null}
        onChoose={actions.resolveTownEvent}
        heroes={state.heroes}
      />
      <MomentModal
        moment={!state.activeEncounter && !state.pendingDecisions.length && !state.pendingRoadEvent && !activeReport ? state.moments?.[0] : null}
        state={state}
        onClose={actions.acknowledgeMoment}
      />
      <ReportModal report={activeReport} onClose={closeReport} openHero={actions.openHero} />
      <CouncilReportModal
        state={state}
        open={Boolean(
          state.council?.unread &&
            !state.pendingDecisions.length &&
            !activeReport &&
            !state.activeEncounter &&
            !state.activeMissionGame &&
            !state.pendingRoadEvent &&
            !state.moments?.length &&
            !defunct,
        )}
        onClose={actions.acknowledgeCouncilReport}
        openHero={actions.openHero}
      />
      <RefoundModal
        state={state}
        open={defunct && !state.activeEncounter && !state.activeMissionGame && !state.pendingDecisions.length && !activeReport}
        onRefound={actions.refoundGuild}
        onReturnHome={actions.returnHome}
      />
      <HeroStatusScreen state={state} heroId={heroModalId} onClose={() => setHeroModalId(null)} onSelect={setHeroModalId} actions={actions} />
      <Toasts notifications={state.notifications} onDismiss={actions.dismissNotification} onClear={actions.clearNotifications} />
    </div>
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
        <CreateCampaignModal open={Boolean(creatingSlot)} slot={creatingSlot} onClose={() => setCreatingSlot(null)} onCreate={createCampaign} />
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
