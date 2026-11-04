import React from 'react';
import Section from './Section.jsx';
import { Button, SceneBackdrop } from '../components/UI.jsx';
import PartyRail from '../components/PartyRail.jsx';
import HeroesScreen from '../screens/HeroesScreen.jsx';
import EquipmentScreen from '../screens/EquipmentScreen.jsx';
import GuildHallRooms from '../places/GuildHallRooms.jsx';
import MainPartyScreen from '../screens/MainPartyScreen.jsx';
import JournalScreen, { JOURNAL_TABS } from '../places/JournalScreen.jsx';
import RankingsScreen, { HallOfFameTab, RecordBookTab } from '../screens/RankingsScreen.jsx';
import { MissionLog, SeasonReviewsPage } from '../screens/HistoryScreens.jsx';
import CodexScreen from '../screens/CodexScreen.jsx';
import GuildScreen, { GUILD_TABS } from './GuildScreen.jsx';
import SettingsScreen from '../screens/SettingsScreen.jsx';
import CreditsScreen from './CreditsScreen.jsx';
import ContactsScreen from './ContactsScreen.jsx';
import { BUILDINGS } from '../data/world.js';
import { LOT_DIORAMA } from '../data/rooms.js';
import { firstAsset } from '../data/assets.js';
import { HOME_LOCATION_ID, atHome, hasHall } from '../game/engine.js';

// Every screen outside the walkable world is a section in the one template
// (Section.jsx). This file says which tabs each section has and what each tab shows.

const tabs = (...items) => items.map(([id, label, icon]) => ({ id, label, icon }));

/** The tabs of each section. Party's "Retired & fallen" appears once someone is in it. */
export function sectionTabs(state, id) {
  if (id === 'party') {
    const gone = state.heroes.some((hero) => ['dead', 'retired'].includes(hero.status)) || state.historicHeroes?.length;
    return tabs(['roster', 'Heroes', 'party'], ['main', 'Main party', 'flag'], ...(gone ? [['legends', 'Retired & fallen', 'scroll']] : []));
  }
  return SECTION_TABS[id] || null;
}

export const SECTION_TABS = {
  guild: GUILD_TABS,
  journal: JOURNAL_TABS,
  records: tabs(['rankings', 'Rankings', 'trophy'], ['seasons', 'Seasons', 'hourglass'], ['book', 'Record book', 'star'], ['fame', 'Hall of fame', 'crown'], ['log', 'Mission log', 'scroll'], ['codex', 'Codex', 'book']),
  system: tabs(['game', 'Game', 'save'], ['settings', 'Settings', 'gear'], ['credits', 'Credits', 'info']),
};

// One short help line per section (docs/UX.md): a gesture or where things are, never a rule.
const HELP = {
  party: 'Tap a hero for their page.',
  items: 'Drag an item onto a hero, or tap the item, then the hero.',
  hall: 'Tap a slot to build or manage a room.',
  journal: 'Swipe sideways to change tab.',
  contacts: 'Tap a person to see where they are.',
  records: 'Long-press a ladder to see what it measures.',
  system: 'The game saves after every action.',
  inn: 'Rest heals the party travelling with you.',
  noticeBoard: 'Pick a contract, then drag heroes into the slots.',
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
  const titles = { party: 'Party', items: 'Items', guild: 'Guild', journal: 'Journal', contacts: 'Contacts', records: 'Records', system: 'System' };
  if (titles[id]) return titles[id];
  if (id === 'hall') {
    return hasHall(state) ? 'Guild Hall' : 'Empty lot';
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
  const tabList = sectionTabs(state, id);
  const tab = tabList ? (tabList.some((item) => item.id === section.tab) ? section.tab : tabList[0].id) : section.tab;
  const help = id === 'records' && tab !== 'rankings' ? null : HELP[id] || null;
  const common = { id, title: sectionTitle(state, section), tabs: tabList, tab, onTab: setTab, onBack: close, help };
  const rail = <PartyRail state={state} actions={actions} onOpenHero={actions.openHero} />;

  if (id === 'party') {
    return (
      <Section {...common}>
        {tab === 'roster' ? <HeroesScreen {...props} tabs={['roster']} /> : null}
        {tab === 'main' ? <MainPartyScreen state={state} actions={actions} /> : null}
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
    // The Guild Hall: the lot diorama (docs/specs/guild-hall-rooms.md).
    return (
      <>
        <SceneBackdrop asset={LOT_DIORAMA} dim={0.6} />
        <Section {...common} tabs={null}>
          <GuildHallRooms {...props} initial={section.tab} />
        </Section>
      </>
    );
  }
  if (id === 'guild') {
    return (
      <Section {...common}>
        <GuildScreen {...props} tab={tab} />
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
  if (id === 'journal') {
    // The calendar's main button rests: at the Guild Hall at home, at the inn away.
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
      <Section {...common} primary={tab === 'calendar' ? rest : null}>
        <JournalScreen {...props} tab={tab} />
      </Section>
    );
  }
  if (id === 'records') {
    return (
      <Section {...common}>
        {tab === 'rankings' ? <RankingsScreen {...props} /> : null}
        {tab === 'seasons' ? <SeasonReviewsPage {...props} /> : null}
        {tab === 'book' ? <RecordBookTab {...props} /> : null}
        {tab === 'fame' ? <HallOfFameTab {...props} /> : null}
        {tab === 'log' ? <MissionLog {...props} /> : null}
        {tab === 'codex' ? <CodexScreen {...props} page={section.view} /> : null}
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

/** System → Game: short labelled rows. Loading another slot is on the title screen. */
function GameMenu({ state, actions, slot, saveStatus }) {
  const saved = { saving: 'Saving…', unsaved: 'Not saved', error: 'Save failed' }[saveStatus] || 'Saved';
  return (
    <div className="game-menu">
      <div className="guild-line">
        <span>{state.guild.name}</span>
        <strong className="num">
          Slot {slot} · {state.date.year}
        </strong>
      </div>
      <div className="guild-line">
        <span>Status</span>
        <strong className={`save-state save-state--${saveStatus}`}>{saved}</strong>
      </div>
      <div className="game-menu__actions">
        <Button variant="primary" onClick={actions.saveNow}>
          Save now
        </Button>
        <Button onClick={actions.returnHome}>Load or quit to title</Button>
      </div>
    </div>
  );
}
