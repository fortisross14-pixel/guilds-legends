import React, { Component, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  acknowledgeReport,
  acknowledgeWelcome,
  advanceMonths,
  advanceToNextEvent,
  appointHero,
  chooseAlignment,
  clearNotifications,
  clone,
  createNewGame,
  dismissNotification,
  enterTournament,
  fightTournamentRound,
  getDashboardSummary,
  getHero,
  getReport,
  getNextAction,
  inspectGoals,
  inspectHero,
  inspectMission,
  launchMission,
  notePartySelection,
  recruitCandidate,
  releaseHero,
  resolveDecision,
  roleRating,
  saveFormation,
  setHeroTraining,
  updateSettings,
  upgradeFacility,
  validateGame,
} from './game/engine.js';
import {
  deleteGame,
  exportGame,
  getLastSlot,
  importGame,
  listSaveSlots,
  loadGame,
  saveGame,
} from './game/storage.js';
import { APPOINTMENTS, CLASSES, MONTHS, TIERS } from './data/content.js';
import { FORMATION_TYPES, PARTY_ROLES } from './data/formations.js';
import { Badge, Button, Crest, HeroPortrait, Modal, ProgressBar } from './components/UI.jsx';
import HallScreen from './screens/HallScreen.jsx';
import MissionsScreen from './screens/MissionsScreen.jsx';
import HeroesScreen from './screens/HeroesScreen.jsx';
import WorldScreen from './screens/WorldScreen.jsx';
import HeadquartersScreen from './screens/HeadquartersScreen.jsx';
import TournamentsScreen from './screens/TournamentsScreen.jsx';
import RankingsScreen from './screens/RankingsScreen.jsx';
import ChronicleScreen from './screens/ChronicleScreen.jsx';
import GoalsScreen from './screens/GoalsScreen.jsx';
import SettingsScreen from './screens/SettingsScreen.jsx';

const NAV_ITEMS = [
  { id: 'hall', label: 'Guild Hall', icon: '◆' },
  { id: 'missions', label: 'Missions', icon: '⌖' },
  { id: 'heroes', label: 'Heroes', icon: '♟' },
  { id: 'tournaments', label: 'Tournaments', icon: '♛' },
  { id: 'world', label: 'World', icon: '◉' },
  { id: 'headquarters', label: 'Headquarters', icon: '♜' },
  { id: 'rankings', label: 'Rankings', icon: '✦' },
  { id: 'chronicle', label: 'Chronicle', icon: '▤' },
  { id: 'goals', label: 'Goals', icon: '✓' },
  { id: 'settings', label: 'Save & Settings', icon: '⚙' },
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
        <div><Button variant="primary" onClick={() => window.location.reload()}>Reload safely</Button><Button onClick={() => this.setState({ error: null })}>Try returning</Button></div>
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

function HomeScreen({ slots, busy, onLoad, onCreate, onDelete }) {
  return (
    <div className="home-screen">
      <div className="home-screen__mist" />
      <header className="home-title">
        <Crest size="xl" />
        <span className="eyebrow">A dynasty chronicle · A party management RPG</span>
        <h1>Guilds of Legend</h1>
        <p>Discover imperfect heroes. Give them a banner. Survive their failures. Preserve their names after they are gone.</p>
      </header>
      <div className="save-slots">
        {[1, 2, 3].map((slot) => {
          const meta = slots.find((item) => item.slot === slot);
          return (
            <article className={`save-slot ${meta ? 'save-slot--filled' : 'save-slot--empty'}`} key={slot}>
              <div className="save-slot__number">{slot}</div>
              {meta ? (
                <>
                  <div className="save-slot__crest"><Crest size="lg" /></div>
                  <span className="eyebrow">Year {meta.year} · {meta.tier}</span>
                  <h2>{meta.guildName}</h2>
                  <p>Rank #{meta.rank} · {meta.activeHeroes} active heroes</p>
                  <div className="save-slot__metrics"><span><small>Fame</small><strong>{meta.fame}</strong></span><span><small>Legacy</small><strong>{meta.legacy}</strong></span></div>
                  <time>Last played {formatPlayed(meta.lastPlayedAt)}</time>
                  <div className="save-slot__actions"><Button variant="primary" onClick={() => onLoad(slot)} disabled={busy}>Continue</Button><Button variant="danger" size="sm" onClick={() => onDelete(slot)} disabled={busy}>Delete</Button></div>
                </>
              ) : (
                <>
                  <div className="save-slot__empty-mark">✦</div>
                  <span className="eyebrow">Empty chronicle</span>
                  <h2>Found a new guild</h2>
                  <p>Begin in Year 1187 as a founder searching for the first companion willing to carry the lantern.</p>
                  <Button variant="primary" onClick={() => onCreate(slot)} disabled={busy}>Create campaign</Button>
                </>
              )}
            </article>
          );
        })}
      </div>
      <footer className="home-footer"><span>Browser save: IndexedDB</span><span>Designed for 5–15 minute sessions</span><span>Campaign horizon: centuries</span></footer>
    </div>
  );
}

function CreateCampaignModal({ open, slot, onClose, onCreate }) {
  const [guildName, setGuildName] = useState('The Broken Lantern');
  const [founderName, setFounderName] = useState('Rowan Vale');
  const [founderClass, setFounderClass] = useState('Guardian');
  const [motto, setMotto] = useState('No light is lost forever.');
  const [seedText, setSeedText] = useState('Dunmere');

  useEffect(() => {
    if (open) {
      setGuildName('The Broken Lantern');
      setFounderName('Rowan Vale');
      setFounderClass('Guardian');
      setMotto('No light is lost forever.');
      setSeedText('Dunmere');
    }
  }, [open]);

  const classInfo = CLASSES[founderClass];
  return (
    <Modal open={open} title={`Found campaign in slot ${slot}`} eyebrow="Year 1187 · Dunmere" onClose={onClose} width="wide">
      <div className="new-campaign new-campaign--founder">
        <div className="new-campaign__crest"><Crest size="xl" /></div>
        <div className="new-campaign__fields">
          <label>Guild name<input value={guildName} maxLength={38} onChange={(event) => setGuildName(event.target.value)} /></label>
          <label>Your name<input value={founderName} maxLength={36} onChange={(event) => setFounderName(event.target.value)} /><small>You are an active hero, not an invisible administrator.</small></label>
          <label>Your class<select value={founderClass} onChange={(event) => setFounderClass(event.target.value)}>{Object.keys(CLASSES).map((classId) => <option key={classId}>{classId}</option>)}</select></label>
          <label>Motto<input value={motto} maxLength={72} onChange={(event) => setMotto(event.target.value)} /></label>
          <label>World seed<input value={seedText} maxLength={40} onChange={(event) => setSeedText(event.target.value)} /><small>The same seed produces the same opening candidates and rival variation.</small></label>
        </div>
        <div className="founder-preview">
          <span className="founder-preview__glyph">{classInfo?.glyph}</span><div><span className="eyebrow">Founding hero</span><h3>{founderName || 'Unnamed founder'}</h3><p>{founderClass} · {classInfo?.description}</p></div>
        </div>
        <div className="new-campaign__premise"><strong>The Broken Lantern scenario</strong><p>The previous guild disappeared in the Blackwood. You begin alone in a rented hall. Your first objective is to hire one companion, then prove the new company on the Old Road.</p></div>
        <Button variant="primary" size="lg" disabled={!guildName.trim() || !founderName.trim()} onClick={() => onCreate({ guildName: guildName.trim(), founderName: founderName.trim(), founderClass, motto: motto.trim(), seedText })}>Raise the banner</Button>
      </div>
    </Modal>
  );
}

function DecisionModal({ state, actions }) {
  const decision = state.pendingDecisions[0];
  if (!decision) return null;
  const mission = state.activeMissions.find((item) => item.id === decision.missionId);
  const heroes = mission?.assignments.map((assignment) => ({ ...assignment, hero: getHero(state, assignment.heroId) })).filter((item) => item.hero) || [];
  return (
    <Modal open title={decision.title} eyebrow="Critical expedition decision · Time paused" preventClose width="wide">
      <div className="decision-scene">
        <div className="decision-scene__party">{heroes.map(({ hero, role }) => <div key={hero.id}><HeroPortrait hero={hero} size="sm" /><span><strong>{hero.name}</strong><small>{role} · PWR {hero.power}</small></span></div>)}</div>
        <blockquote>{decision.prompt}</blockquote>
        <div className="decision-options">
          {decision.options.map((option, index) => (
            <button key={option.id} onClick={() => actions.resolveDecision(decision.id, option.id)}>
              <span className="decision-options__key">{index + 1}</span>
              <div><h3>{option.label}</h3><p>{option.note}</p><div className="decision-options__effects">{option.power ? <Badge tone={option.power >= 0 ? 'green' : 'red'}>{option.power >= 0 ? '+' : ''}{option.power} mission edge</Badge> : null}{option.fame ? <Badge tone="gold">{option.fame >= 0 ? '+' : ''}{option.fame} narrative fame</Badge> : null}{option.reward ? <Badge tone="blue">{option.reward >= 0 ? '+' : ''}{option.reward} base reward</Badge> : null}{option.artifact ? <Badge tone="purple">Artifact possibility</Badge> : null}</div></div>
              <span className="decision-options__arrow">›</span>
            </button>
          ))}
        </div>
        <p className="decision-scene__warning">Important choices alter odds and consequences. They do not reveal the final roll.</p>
      </div>
    </Modal>
  );
}

function ReportModal({ report, onClose, openHero }) {
  if (!report) return null;
  const isMission = report.kind === 'mission';
  const tone = isMission
    ? ['Legendary', 'Great Success', 'Success'].includes(report.grade) ? 'green' : report.grade === 'Partial' ? 'gold' : 'red'
    : report.champion ? 'green' : 'gold';
  return (
    <Modal open title={report.title} eyebrow={isMission ? `${report.completedDate} · Expedition report` : `Year ${report.year} · Tournament report`} onClose={onClose} width="wide">
      <div className={`mission-report mission-report--${tone}`}>
        <header className="mission-report__hero">
          <div className="mission-report__seal">{isMission ? report.grade === 'Legendary' ? '✦' : report.grade === 'Catastrophic' ? '!' : '◆' : report.champion ? '♛' : '⚔'}</div>
          <div><span className="eyebrow">{isMission ? `${report.family} · ${report.formationType}` : `${report.division} circuit · ${report.location}`}</span><h2>{isMission ? report.grade : report.champion ? 'Champions' : `Top ${report.finish}`}</h2><p>{report.narrative}</p></div>
        </header>

        {isMission ? (
          <>
            <div className="report-metrics"><div><span>Final chance</span><strong>{report.finalChance}%</strong><small>Roll {report.roll}</small></div><div><span>Treasury</span><strong>+{report.reward}</strong><small>Supplies −{report.supplyCost}</small></div><div><span>Fame</span><strong>{report.fame >= 0 ? '+' : ''}{report.fame}</strong><small>{report.region}</small></div><div><span>Outcome</span><strong>{report.grade}</strong><small>Risk {report.risk}/5</small></div></div>
            <section className="report-decision"><span className="eyebrow">The decisive moment</span><blockquote>{report.decision?.prompt}</blockquote><div><strong>{report.decision?.label}</strong><p>{report.decision?.note}</p></div></section>
          </>
        ) : (
          <div className="report-metrics"><div><span>Finish</span><strong>{report.champion ? '1st' : `Top ${report.finish}`}</strong></div><div><span>Prize</span><strong>{report.reward}</strong></div><div><span>Fame</span><strong>+{report.fame}</strong></div><div><span>Bouts</span><strong>{report.bracket?.length || 0}</strong></div></div>
        )}

        <section><span className="eyebrow">Company arrangement</span><div className="report-team">{(report.team || []).map((member) => <button key={member.heroId} onClick={() => openHero(member.heroId)}><HeroPortrait hero={{ ...member, id: member.heroId, status: member.status || 'available' }} size="sm" /><div><strong>{member.name}</strong><small>{member.classId} · {member.role}</small><span>Power {member.power} · Role {member.roleRating}</span></div>{isMission ? <i className={report.heroEffects?.find((effect) => effect.heroId === member.heroId)?.status === 'dead' ? 'is-dead' : report.heroEffects?.find((effect) => effect.heroId === member.heroId)?.status === 'injured' ? 'is-injured' : ''}>{report.heroEffects?.find((effect) => effect.heroId === member.heroId)?.status || 'returned'}</i> : null}</button>)}</div></section>

        {isMission ? (
          <div className="report-consequences">
            <section><span className="eyebrow">Individual consequences</span>{report.heroEffects?.map((effect) => <div key={effect.heroId}><strong>{effect.name}</strong><p>{effect.injury ? effect.injury : effect.status === 'dead' ? 'Killed during the expedition' : 'Returned to active service'} · form {effect.formChange >= 0 ? '+' : ''}{effect.formChange} · renown {effect.renownChange >= 0 ? '+' : ''}{effect.renownChange}</p></div>)}</section>
            <section><span className="eyebrow">Lasting consequences</span>{report.artifact ? <p><b>Artifact recovered:</b> {report.artifact}</p> : null}{report.consequences?.length ? report.consequences.map((item) => <p key={item}>{item}</p>) : <p>No new political obligation or rivalry was created.</p>}</section>
          </div>
        ) : (
          <section><span className="eyebrow">Round-by-round record</span><div className="report-bouts">{report.bracket?.map((bout, index) => <article key={`${bout.round}-${index}`}><strong>{bout.round}</strong><span>{bout.won ? 'Victory' : 'Defeat'} vs {bout.opponent}</span><small>{bout.tactic} · {bout.chance}% estimate · {bout.teamPower} vs {bout.opponentPower}</small></article>)}</div></section>
        )}
        <Button variant="primary" size="lg" onClick={onClose}>{isMission ? 'Seal report in the Chronicle' : 'Return to the circuit'}</Button>
      </div>
    </Modal>
  );
}

function HeroDetailModal({ state, heroId, onClose, actions }) {
  const hero = heroId ? getHero(state, heroId) : null;
  if (!hero) return null;
  const classInfo = CLASSES[hero.classId];
  const active = !['retired', 'dead'].includes(hero.status) && state.heroes.some((item) => item.id === hero.id);
  return (
    <Modal open title={hero.name} eyebrow={`${hero.classId} · Age ${hero.age} · ${hero.status}`} onClose={onClose} width="wide">
      <div className="hero-dossier">
        <aside className="hero-dossier__identity">
          <HeroPortrait hero={hero} size="xl" />
          <Badge tone={hero.status === 'dead' ? 'red' : hero.status === 'retired' ? 'neutral' : 'green'}>{hero.status}</Badge>
          <p>{hero.hook || `${hero.origin}.`}</p>
          <div className="dossier-tags"><Badge>{hero.personality}</Badge><Badge tone="red">Flaw: {hero.flaw}</Badge><Badge tone="blue">Dream: {hero.dream}</Badge></div>
          <div className="dossier-legacy"><span>Historical legacy</span><strong>{hero.legacy}</strong><small>{hero.renown} public renown</small></div>
        </aside>
        <div className="hero-dossier__main">
          <div className="dossier-rating-row"><div><span>Power</span><strong>{hero.power}</strong></div><div><span>Potential</span><strong>{hero.potential}</strong></div><div><span>Peak</span><strong>{hero.career?.peakPower || hero.power}</strong></div><div><span>Service</span><strong>{hero.career?.serviceYears || 0}y</strong></div></div>
          <section><span className="eyebrow">Core attributes</span><div className="attribute-grid">{Object.entries(hero.attributes || {}).map(([name, value]) => <div key={name}><ProgressBar value={value} max={100} label={name} tone={name === classInfo?.primary ? 'gold' : name === classInfo?.secondary ? 'blue' : 'neutral'} compact /></div>)}</div></section>
          <section><span className="eyebrow">Party role ratings</span><div className="role-rating-grid">{PARTY_ROLES.map((role) => <div key={role.id}><span>{role.label}</span><strong>{roleRating(hero, role.id)}</strong></div>)}</div></section>
          <section><span className="eyebrow">Career record</span><div className="career-grid"><div><span>Missions</span><strong>{hero.career?.missions || 0}</strong></div><div><span>Victories</span><strong>{hero.career?.wins || 0}</strong></div><div><span>Legendary</span><strong>{hero.career?.legendary || 0}</strong></div><div><span>Titles</span><strong>{hero.career?.titles || 0}</strong></div><div><span>Injuries</span><strong>{hero.career?.injuries || 0}</strong></div><div><span>Artifacts</span><strong>{hero.career?.artifacts || 0}</strong></div></div></section>
          {active ? <section className="dossier-controls"><label>Training<select value={hero.training} onChange={(event) => actions.setTraining(hero.id, event.target.value)}><option>Fundamentals</option><option>Role Drills</option><option>Sparring</option><option>Mentorship</option><option>Study</option><option>Rehabilitation</option><option>Public Exhibition</option></select></label><label>Appointment<select value={hero.appointment || ''} onChange={(event) => event.target.value && actions.appointHero(hero.id, event.target.value)}><option value="">No appointment</option>{APPOINTMENTS.map((item) => <option key={item.id} value={item.id}>{item.id}</option>)}</select></label><Button variant="danger" size="sm" disabled={hero.status === 'mission'} onClick={() => actions.releaseHero(hero.id)}>Release / retire</Button></section> : null}
          <section><span className="eyebrow">Career timeline</span><div className="hero-history">{(hero.history || []).slice(0, 40).map((event, index) => <article key={`${event.date}-${index}`}><time>{event.date}</time><div><strong>{event.title}</strong><p>{event.text}</p></div></article>)}</div></section>
        </div>
      </div>
    </Modal>
  );
}

function Toasts({ notifications, onDismiss, onClear }) {
  if (!notifications.length) return null;
  return (
    <div className="toast-stack" aria-live="polite">
      {notifications.slice(-4).map((notification) => <button key={notification.id} className={`toast toast--${notification.tone}`} onClick={() => onDismiss(notification.id)}><span>{notification.tone === 'green' ? '✓' : notification.tone === 'red' ? '!' : notification.tone === 'purple' ? '✦' : '◆'}</span><div><strong>{notification.title}</strong><p>{notification.text}</p></div><i>×</i></button>)}
      {notifications.length > 4 ? <button className="toast-clear" onClick={onClear}>Clear {notifications.length} notices</button> : null}
    </div>
  );
}

function GameShell({ state, setState, slot, onReturnHome, onDeleteCurrent, onSlotsChanged }) {
  const [screen, setScreen] = useState('hall');
  const [heroModalId, setHeroModalId] = useState(null);
  const [reportModalRef, setReportModalRef] = useState(null);
  const [message, setMessage] = useState(null);
  const [saveStatus, setSaveStatus] = useState('saved');
  const autosaveTimer = useRef(null);
  const summary = getDashboardSummary(state);
  const nextAction = getNextAction(state);

  const commitState = useCallback((nextState, notice) => {
    const errors = validateGame(nextState);
    if (errors.length) {
      console.error('State validation failed:', errors);
      setMessage({ tone: 'red', text: `The action was blocked because state validation failed: ${errors[0]}` });
      return;
    }
    setState(nextState);
    setSaveStatus('unsaved');
    if (notice) setMessage(notice);
  }, [setState]);

  const applyResult = useCallback((result, successText) => {
    if (!result) return;
    if (result.error) {
      setMessage({ tone: 'red', text: result.error });
      return;
    }
    commitState(result.state, successText ? { tone: 'green', text: successText } : null);
  }, [commitState]);

  const saveNow = useCallback(async (quiet = false) => {
    setSaveStatus('saving');
    const result = await saveGame(slot, state);
    if (result.ok) {
      setSaveStatus('saved');
      onSlotsChanged?.();
      if (!quiet) setMessage({ tone: result.compacted ? 'gold' : 'green', text: result.compacted ? 'Campaign saved with older history compacted.' : 'Campaign saved.' });
    } else {
      setSaveStatus('error');
      setMessage({ tone: 'red', text: result.error });
    }
    return result;
  }, [slot, state, onSlotsChanged]);

  useEffect(() => {
    if (!state.settings.autosave) return undefined;
    window.clearTimeout(autosaveTimer.current);
    autosaveTimer.current = window.setTimeout(() => saveNow(true), 700);
    return () => window.clearTimeout(autosaveTimer.current);
  }, [state, saveNow]);

  useEffect(() => {
    document.documentElement.classList.toggle('reduced-motion', state.settings.reducedMotion);
    document.documentElement.classList.toggle('compact-mode', state.settings.compactMode);
  }, [state.settings.reducedMotion, state.settings.compactMode]);

  const actions = useMemo(() => ({
    acknowledgeWelcome: () => commitState(acknowledgeWelcome(state)),
    inspectMission: (id) => commitState(inspectMission(state, id)),
    notePartySelection: (id, formationType, assignments) => {
      const next = notePartySelection(state, id, formationType, assignments);
      if (next.tutorial.step !== state.tutorial.step) commitState(next);
    },
    launchMission: (id, formationType, assignments) => applyResult(launchMission(state, id, formationType, assignments), 'The company has left Dunmere.'),
    saveFormation: (formationType, assignments) => applyResult(saveFormation(state, formationType, assignments)),
    advance: (months) => applyResult(advanceMonths(state, months)),
    advanceNext: () => applyResult(advanceToNextEvent(state)),
    resolveDecision: (decisionId, optionId) => applyResult(resolveDecision(state, decisionId, optionId)),
    recruit: (id) => applyResult(recruitCandidate(state, id), 'A new hero has joined the banner.'),
    setTraining: (id, training) => commitState(setHeroTraining(state, id, training)),
    appointHero: (heroId, appointmentId) => applyResult(appointHero(state, heroId, appointmentId)),
    upgradeFacility: (id) => applyResult(upgradeFacility(state, id), 'Headquarters upgraded.'),
    chooseAlignment: (alignment) => applyResult(chooseAlignment(state, alignment)),
    enterTournament: (tournamentId, formationType, assignments) => applyResult(enterTournament(state, tournamentId, formationType, assignments)),
    fightTournamentRound: (tournamentId, tactic) => applyResult(fightTournamentRound(state, tournamentId, tactic)),
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
      try {
        const imported = importGame(text);
        const errors = validateGame(imported);
        if (errors.length) throw new Error(errors[0]);
        commitState(imported, { tone: 'green', text: 'Backup imported. Save now to replace this slot permanently.' });
      } catch (error) {
        setMessage({ tone: 'red', text: `Import failed: ${error.message}` });
      }
    },
    deleteCurrent: onDeleteCurrent,
    dismissNotification: (id) => commitState(dismissNotification(state, id)),
    clearNotifications: () => commitState(clearNotifications(state)),
  }), [state, commitState, applyResult, saveNow, onReturnHome, onDeleteCurrent]);

  const navigate = (id) => {
    setScreen(id);
    if (id === 'goals' && !state.flags.goalsInspected) actions.inspectGoals();
    window.scrollTo({ top: 0, behavior: state.settings.reducedMotion ? 'auto' : 'smooth' });
  };

  const screenProps = { state, actions, navigate, slot };
  const renderedScreen = {
    hall: <HallScreen {...screenProps} />,
    missions: <MissionsScreen {...screenProps} />,
    heroes: <HeroesScreen {...screenProps} />,
    tournaments: <TournamentsScreen {...screenProps} />,
    world: <WorldScreen {...screenProps} />,
    headquarters: <HeadquartersScreen {...screenProps} />,
    rankings: <RankingsScreen {...screenProps} />,
    chronicle: <ChronicleScreen {...screenProps} />,
    goals: <GoalsScreen {...screenProps} />,
    settings: <SettingsScreen {...screenProps} />,
  }[screen] || <HallScreen {...screenProps} />;

  const activeReportReference = reportModalRef || state.pendingReports?.[0] || null;
  const activeReport = getReport(state, activeReportReference);
  const closeReport = () => {
    if (!activeReportReference) return;
    const isPending = state.pendingReports?.some((item) => item.id === (typeof activeReportReference === 'string' ? activeReportReference : activeReportReference.id));
    if (isPending) actions.acknowledgeReport(activeReportReference);
    else setReportModalRef(null);
  };

  return (
    <div className="game-shell">
      <aside className="sidebar">
        <div className="sidebar__brand"><Crest size="md" /><div><strong>{state.guild.name}</strong><small>{state.guild.tier} · Year {state.date.year}</small></div></div>
        <nav>{NAV_ITEMS.map((item) => <button key={item.id} className={screen === item.id ? 'is-active' : ''} onClick={() => navigate(item.id)}><span>{item.icon}</span><strong>{item.label}</strong>{item.id === 'hall' && state.pendingDecisions.length ? <i className="nav-alert">{state.pendingDecisions.length}</i> : item.id === 'missions' && state.missions.length ? <i>{state.missions.length}</i> : null}</button>)}</nav>
        <div className="sidebar__footer"><div className={`save-indicator save-indicator--${saveStatus}`}><i />{saveStatus === 'saving' ? 'Saving…' : saveStatus === 'unsaved' ? 'Unsaved' : saveStatus === 'error' ? 'Save error' : 'Saved'}</div><button onClick={() => actions.saveNow()}>Save slot {slot}</button></div>
      </aside>

      <div className="game-main">
        <header className="topbar">
          <button className="topbar__mobile-brand" onClick={() => navigate('hall')}><Crest size="xs" /><span>{state.guild.name}</span></button>
          <div className="topbar__date"><span>{MONTHS[state.date.month]}</span><strong>{state.date.year}</strong></div>
          <div className="topbar__resources"><span title="Treasury"><i>◈</i>{summary.crowns.toLocaleString()}</span><span title="Fame"><i>✦</i>{summary.fame}</span><span title="Legacy"><i>▤</i>{summary.legacy}</span><span title="Rank"><i>♛</i>#{summary.rank}</span></div>
          <div className="time-controls">
            <Button size="sm" onClick={() => actions.advance(1)} disabled={state.pendingDecisions.length > 0}>+1 month</Button>
            <Button size="sm" onClick={() => actions.advanceNext()} disabled={state.pendingDecisions.length > 0}>Next event</Button>
            <Button size="sm" onClick={() => actions.advance(3)} disabled={state.pendingDecisions.length > 0}>+Season</Button>
            <Button size="sm" variant="primary" onClick={() => actions.advance(12)} disabled={state.pendingDecisions.length > 0}>+1 year</Button>
          </div>
        </header>
        {message ? <button className={`message-bar message-bar--${message.tone}`} onClick={() => setMessage(null)}><span>{message.tone === 'red' ? '!' : message.tone === 'green' ? '✓' : '◆'}</span><p>{message.text}</p><i>×</i></button> : null}
        {screen !== 'hall' ? (
          <aside className={`objective-ribbon objective-ribbon--${nextAction.kind}`}>
            <span className="objective-ribbon__mark">{nextAction.kind === 'tutorial' ? nextAction.step : nextAction.kind === 'critical' ? '!' : '✦'}</span>
            <div><small>{nextAction.kind === 'tutorial' ? `Current order · ${nextAction.step}/${nextAction.total}` : nextAction.kind === 'critical' ? 'Time paused' : 'Recommended next step'}</small><strong>{nextAction.title}</strong><p>{nextAction.body}</p></div>
            {typeof nextAction.progress === 'number' ? <ProgressBar value={nextAction.progress} max={nextAction.target} compact tone="gold" /> : null}
            <Button size="sm" variant={nextAction.kind === 'critical' ? 'danger' : 'primary'} onClick={() => {
              if (nextAction.target === 'acknowledgeWelcome') { actions.acknowledgeWelcome(); navigate('hall'); }
              else navigate(nextAction.screen || 'hall');
            }}>{nextAction.kind === 'critical' ? 'Resolve now' : nextAction.screen === screen ? 'You are here' : 'Go to task'}</Button>
          </aside>
        ) : null}
        <main className="screen-container" key={screen}>{renderedScreen}</main>
      </div>

      <nav className="mobile-nav">{NAV_ITEMS.slice(0, 6).map((item) => <button key={item.id} className={screen === item.id ? 'is-active' : ''} onClick={() => navigate(item.id)}><span>{item.icon}</span><small>{item.label.split(' ')[0]}</small></button>)}</nav>
      <DecisionModal state={state} actions={actions} />
      <ReportModal report={activeReport} onClose={closeReport} openHero={actions.openHero} />
      <HeroDetailModal state={state} heroId={heroModalId} onClose={() => setHeroModalId(null)} actions={actions} />
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
      const seed = options.seedText ? options.seedText.split('').reduce((sum, char) => ((sum << 5) - sum + char.charCodeAt(0)) | 0, 0) >>> 0 : undefined;
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

  const deleteCurrent = async () => {
    if (!window.confirm(`Delete ${state?.guild.name || 'this campaign'} permanently?`)) return;
    await deleteGame(activeSlot);
    setState(null);
    setActiveSlot(null);
    await refreshSlots();
  };

  if (!state || !activeSlot) {
    return (
      <>
        <HomeScreen slots={slots} busy={busy} onLoad={loadSlot} onCreate={setCreatingSlot} onDelete={removeSlot} />
        {busy ? <div className="loading-layer"><Crest size="lg" /><span>Opening the chronicle…</span></div> : null}
        {homeError ? <button className="home-error" onClick={() => setHomeError(null)}><strong>Could not complete that action</strong><span>{homeError}</span><i>×</i></button> : null}
        <CreateCampaignModal open={Boolean(creatingSlot)} slot={creatingSlot} onClose={() => setCreatingSlot(null)} onCreate={createCampaign} />
      </>
    );
  }

  return <GameShell state={state} setState={setState} slot={activeSlot} onReturnHome={() => { setState(null); setActiveSlot(null); refreshSlots(); }} onDeleteCurrent={deleteCurrent} onSlotsChanged={refreshSlots} />;
}

export function RootApp() {
  return <ErrorBoundary><App /></ErrorBoundary>;
}
