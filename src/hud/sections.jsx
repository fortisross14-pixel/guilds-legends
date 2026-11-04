import React from 'react';
import Section from './Section.jsx';
import { Button, SceneBackdrop } from '../components/UI.jsx';
import PartyRail from '../components/PartyRail.jsx';
import HeroesScreen from '../screens/HeroesScreen.jsx';
import EquipmentScreen from '../screens/EquipmentScreen.jsx';
import GuildHallRooms, { WarRoom } from '../places/GuildHallRooms.jsx';
import QuestLogScreen, { QUEST_TABS } from '../places/QuestLogScreen.jsx';
import CalendarScreen from '../places/CalendarScreen.jsx';
import { BestiaryScreen, NewsScreen } from '../places/NewsScreen.jsx';
import RankingsScreen from '../screens/RankingsScreen.jsx';
import { MissionLog, SeasonReviewsPage } from '../screens/HistoryScreens.jsx';
import ChronicleScreen from '../screens/ChronicleScreen.jsx';
import LoreCodex from '../screens/LoreCodex.jsx';
import GoalsScreen from '../screens/GoalsScreen.jsx';
import SettingsScreen from '../screens/SettingsScreen.jsx';
import CreditsScreen from './CreditsScreen.jsx';
import ContactsScreen from './ContactsScreen.jsx';
import { BUILDINGS } from '../data/world.js';
import { ROOM_BY_ID, roomInterior } from '../data/rooms.js';
import { firstAsset } from '../data/assets.js';
import { HOME_LOCATION_ID, atHome, hallStage, roomLevel } from '../game/engine.js';

// Every screen outside the walkable world is a section in the one template
// (Section.jsx). This file says which tabs each section has and what each tab shows.

const tabs = (...items) => items.map(([id, label, icon]) => ({ id, label, icon }));

export const SECTION_TABS = {
  party: tabs(['roster', 'Heroes', 'party'], ['main', 'Main party', 'flag'], ['legends', 'Retired & fallen', 'scroll']),
  quests: QUEST_TABS,
  calendar: tabs(['calendar', 'Calendar', 'calendar'], ['news', 'News', 'letter']),
  records: tabs(
    ['rankings', 'Rankings', 'trophy'],
    ['seasons', 'Seasons', 'hourglass'],
    ['book', 'Record book', 'star'],
    ['fame', 'Hall of fame', 'crown'],
    ['log', 'Mission log', 'scroll'],
    ['almanac', 'Almanac', 'book'],
    ['lore', 'Lore', 'quill'],
    ['bestiary', 'Bestiary', 'skull'],
    ['goals', 'Goals', 'check'],
  ),
  system: tabs(['game', 'Game', 'save'], ['settings', 'Settings', 'gear'], ['credits', 'Credits', 'info']),
};

const HELP = {
  party: 'Tap a hero for their page. Drag a hero into the main party, or tap to toggle.',
  items: 'Drag an item onto a hero to equip or use it. Tap an item, then a hero, to do the same.',
  hall: 'Drag heroes from the bar onto a room to give them a task.',
  quests: 'Show on map marks where a quest happens.',
  contacts: 'Everyone you have talked to. Tap a person to see where they are.',
  calendar: 'Time passes only when you act. Rest at the Guild Hall or an inn.',
  records: 'Swipe sideways to change tab.',
  system: 'The game saves itself after every action.',
  inn: 'Resting heals the travelling party; the heroes at home keep to their tasks.',
  noticeBoard: 'Contracts people gave you. Pick one here, then drag heroes into the slots.',
  arena: 'Sign up at the desk; be here on the start day.',
  shop: 'Drag an item onto a hero to compare.',
};

const BUILDING_ART = { shop: 'interior.shop', noticeBoard: 'interior.noticeboard' };
function buildingArt(state, id) {
  const here = state.world?.currentLocationId || HOME_LOCATION_ID;
  if (id === 'arena') return firstAsset(`interior.arena.${here}`, 'interior.arena');
  if (id === 'inn') return firstAsset(`interior.inn.${here}`, 'interior.tavern');
  return BUILDING_ART[id];
}

export function sectionTitle(state, section) {
  const id = section.id;
  const titles = { party: 'Party', items: 'Items', quests: 'Quests', contacts: 'Contacts', calendar: 'Calendar', records: 'Records', system: 'System' };
  if (titles[id]) return titles[id];
  if (id === 'hall') {
    const room = section.tab;
    if (room === 'build') return 'Build a room';
    if (room === 'rest') return 'Rest at the hall';
    if (room && ROOM_BY_ID[room]) return ROOM_BY_ID[room].name;
    return hallStage(state).key === 'house' ? 'Your house' : 'Guild Hall';
  }
  if (id === 'inn') return 'A room for the night';
  if (id === 'noticeBoard') return 'Notice board';
  return BUILDINGS[id]?.name || 'Guild';
}

/** Renders the open section. `setSection(next|null)` changes or closes it. */
export function SectionView({ section, state, actions, navigate, slot, setSection, extras }) {
  const close = () => setSection(null);
  const setTab = (tab) => setSection({ ...section, tab });
  const props = { state, actions, navigate, slot };
  const id = section.id;
  const tabList = SECTION_TABS[id] || null;
  const tab = tabList ? (tabList.some((item) => item.id === section.tab) ? section.tab : tabList[0].id) : section.tab;
  const common = { id, title: sectionTitle(state, section), tabs: tabList, tab, onTab: setTab, onBack: close, help: HELP[id] || null };
  const rail = <PartyRail state={state} actions={actions} onOpenHero={actions.openHero} />;

  if (id === 'party') {
    return (
      <Section {...common}>
        {tab === 'roster' ? <HeroesScreen {...props} tabs={['roster']} /> : null}
        {tab === 'main' ? (roomLevel(state, 'war') ? <WarRoom state={state} actions={actions} /> : <NoWarRoom navigate={navigate} />) : null}
        {tab === 'legends' ? <HeroesScreen {...props} tabs={['legends']} /> : null}
      </Section>
    );
  }
  if (id === 'items') {
    return (
      <Section {...common}>
        <EquipmentScreen {...props} />
      </Section>
    );
  }
  if (id === 'hall') {
    // The Guild Hall keeps its Phase 3 rooms until 7D rebuilds it.
    const room = section.tab || null;
    const art = room && ROOM_BY_ID[room] && roomLevel(state, room) ? roomInterior(room, roomLevel(state, room)) : hallStage(state).interior;
    return (
      <>
        <SceneBackdrop asset={art} dim={0.5} />
        <Section {...common} tabs={null} onBack={() => (room ? setTab(null) : close())} backLabel={room ? 'Hall' : 'Leave'}>
          <GuildHallRooms {...props} room={room} setRoom={setTab} />
          {rail}
        </Section>
      </>
    );
  }
  if (id === 'quests') {
    return (
      <Section {...common}>
        <QuestLogScreen {...props} tab={tab} />
      </Section>
    );
  }
  if (id === 'contacts') {
    return (
      <Section {...common}>
        <ContactsScreen {...props} />
      </Section>
    );
  }
  if (id === 'calendar') {
    const home = atHome(state);
    const rest = home ? (
      <Button variant="primary" onClick={() => navigate('rest')}>
        Rest at the hall
      </Button>
    ) : extras?.innHere ? (
      <Button variant="primary" onClick={() => navigate('inn')}>
        Rest at the inn
      </Button>
    ) : null;
    return (
      <Section {...common} primary={tab === 'calendar' ? rest : null} help={home || extras?.innHere ? HELP.calendar : 'Time passes only when you act. Away from home, rest at an inn.'}>
        {tab === 'calendar' ? <CalendarScreen {...props} /> : <NewsScreen {...props} />}
      </Section>
    );
  }
  if (id === 'records') {
    return (
      <Section {...common}>
        {tab === 'rankings' ? <RankingsScreen key="rankings" {...props} initialTab={section.view} views={['guilds', 'heroLadders', 'path', 'rivals', 'reputation', 'connections', 'directory']} /> : null}
        {tab === 'seasons' ? <SeasonReviewsPage {...props} /> : null}
        {tab === 'book' ? <RankingsScreen key="book" {...props} views={['records', 'artifacts']} /> : null}
        {tab === 'fame' ? <RankingsScreen key="fame" {...props} views={['hall', 'heroes', 'tournaments']} /> : null}
        {tab === 'log' ? <MissionLog {...props} /> : null}
        {tab === 'almanac' ? <ChronicleScreen {...props} /> : null}
        {tab === 'lore' ? <LoreCodex {...props} /> : null}
        {tab === 'bestiary' ? <BestiaryScreen {...props} /> : null}
        {tab === 'goals' ? <GoalsScreen {...props} /> : null}
      </Section>
    );
  }
  if (id === 'system') {
    return (
      <Section {...common}>
        {tab === 'game' ? <GameMenu {...props} saveStatus={extras?.saveStatus} /> : null}
        {tab === 'settings' ? <SettingsScreen {...props} /> : null}
        {tab === 'credits' ? <CreditsScreen /> : null}
      </Section>
    );
  }
  // Buildings (Part 1: art-backed screens in the template).
  const body = extras?.renderBuilding?.(id, section.tab);
  return (
    <>
      <SceneBackdrop asset={buildingArt(state, id)} dim={0.5} />
      <Section {...common} backLabel="Leave">
        {body}
        {id === 'noticeBoard' ? rail : null}
      </Section>
    </>
  );
}

function NoWarRoom({ navigate }) {
  return (
    <div className="section-empty">
      <p>Build a War room in the Guild Hall to choose a main party of four.</p>
      <Button onClick={() => navigate({ section: 'hall', tab: 'build' })}>Open the build list</Button>
    </div>
  );
}

/** System → Game: save, load another slot, return to the title. */
function GameMenu({ state, actions, slot, saveStatus }) {
  const saved = { saving: 'Saving…', unsaved: 'Not saved yet', error: 'Save failed' }[saveStatus] || 'Saved';
  return (
    <div className="game-menu">
      <p>
        <strong>{state.guild.name}</strong> · slot {slot} · year {state.date.year} · <span className={`save-state save-state--${saveStatus}`}>{saved}</span>
      </p>
      <div className="game-menu__actions">
        <Button variant="primary" onClick={actions.saveNow}>
          Save now
        </Button>
        <Button onClick={actions.returnHome}>Return to title</Button>
      </div>
      <p className="muted">The title screen lists your three save slots: continue another campaign or start a new one there.</p>
    </div>
  );
}
