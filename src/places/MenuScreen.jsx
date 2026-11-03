import React from 'react';
import { Button, SceneBackdrop, Tabs } from '../components/UI.jsx';
import PixelIcon, { PAGE_ICONS } from '../components/PixelIcon.jsx';
import SettingsScreen from '../screens/SettingsScreen.jsx';
import ChronicleScreen from '../screens/ChronicleScreen.jsx';
import GoalsScreen from '../screens/GoalsScreen.jsx';
import LegacyScreen from '../screens/LegacyScreen.jsx';
import CalendarScreen from './CalendarScreen.jsx';
import QuestLogScreen from './QuestLogScreen.jsx';
import { BestiaryScreen, NewsScreen } from './NewsScreen.jsx';
import { sliceHides } from '../data/slice.js';
import { MissionLog, SeasonReviewsPage } from '../screens/HistoryScreens.jsx';
import LoreCodex from '../screens/LoreCodex.jsx';

const PAGES = [
  { id: 'calendar', name: 'Calendar', icon: '▦', description: 'Weeks ahead: tournaments, company returns, wage days. Advance to a date.' },
  { id: 'news', name: 'News', icon: '✉', description: 'Town talk, side-job results and world events.' },
  { id: 'quests', name: 'Quest log', icon: '✎', description: 'Main story, side quests and guild goals.' },
  { id: 'lore', name: 'Lore codex', icon: '✦', description: 'The world’s history: unlocked by the story, people, arena boards and discoveries.' },
  { id: 'settings', name: 'Campaign settings', icon: '⚙', description: 'Save, export or import the campaign, rename the guild, preferences.' },
  { id: 'chronicle', name: 'Chronicle', icon: '▤', description: 'The living history: timeline and era summaries.' },
  { id: 'log', name: 'Mission log', icon: '⌖', description: 'Every contract, boss fight and tournament run. Filter and open any report.' },
  { id: 'seasons', name: 'Season reviews', icon: '◷', description: 'Each finished year: record, awards, best moments and ladder movement.' },
  { id: 'codex', name: 'Codex', icon: '✓', description: 'Goals, promotion path, achievements and the bestiary.' },
];

// The Legacy office holds succession, branches, mentors and artifact custody: all outside Chapter 1.
const LEGACY_HIDDEN = sliceHides('succession');

const CODEX_TABS = [
  { id: 'goals', label: 'Goals & promotion', icon: '✓' },
  { id: 'legacy', label: 'Legacy office', icon: '♛' },
  { id: 'bestiary', label: 'Bestiary & story', icon: '☠' },
].filter((item) => item.id !== 'legacy' || !LEGACY_HIDDEN);

export default function MenuScreen({ state, actions, navigate, slot, place, setPlace }) {
  const props = { state, actions, navigate, slot };
  const page = PAGES.find((item) => item.id === place.page);

  if (!page) {
    return (
      <div className="screen screen--menu">
        <SceneBackdrop asset="bg.chronicle" dim={0.45} focus="50% 45%" />
        <header className="town-header">
          <div>
            <h1>The Chronicle</h1>
            <span className="eyebrow">{state.guild.name} · Year {state.date.year}</span>
          </div>
        </header>
        <nav className="building-grid" aria-label="Chronicle pages" data-menu>
          {PAGES.map((item) => (
            <button key={item.id} className={`building-tile building-tile--${item.id}`} onClick={() => setPlace({ view: 'menu', page: item.id, tab: null })}>
              <span className="building-tile__icon">
                <PixelIcon name={PAGE_ICONS[item.id] || 'book'} size={36} />
              </span>
              <strong>
                {item.name}
                {item.id === 'news' && state.newsUnread ? <span className="news-badge">{state.newsUnread}</span> : null}
              </strong>
              <small>{item.description}</small>
            </button>
          ))}
        </nav>
      </div>
    );
  }

  const codexTab = (LEGACY_HIDDEN ? ['bestiary'] : ['legacy', 'bestiary']).includes(place.tab) ? place.tab : 'goals';
  return (
    <div className={`menu-page menu-page--${page.id}`}>
      <SceneBackdrop asset="bg.chronicle" dim={0.62} focus="50% 45%" />
      <Button size="sm" className="town-header__back menu-page__back" onClick={() => setPlace({ view: 'menu', page: null })}>
        ◀ Chronicle
      </Button>
      {page.id === 'settings' ? <SettingsScreen {...props} /> : null}
      {page.id === 'chronicle' ? <ChronicleScreen {...props} /> : null}
      {page.id === 'calendar' ? <CalendarScreen {...props} /> : null}
      {page.id === 'log' ? <MissionLog {...props} /> : null}
      {page.id === 'lore' ? <LoreCodex {...props} /> : null}
      {page.id === 'seasons' ? <SeasonReviewsPage {...props} /> : null}
      {page.id === 'quests' ? <QuestLogScreen {...props} /> : null}
      {page.id === 'news' ? <NewsScreen {...props} /> : null}
      {page.id === 'codex' ? (
        <>
          <Tabs active={codexTab} onChange={(tab) => setPlace({ ...place, tab })} items={CODEX_TABS} />
          {codexTab === 'goals' ? <GoalsScreen {...props} /> : codexTab === 'legacy' ? <LegacyScreen {...props} /> : <BestiaryScreen {...props} />}
        </>
      ) : null}
    </div>
  );
}
