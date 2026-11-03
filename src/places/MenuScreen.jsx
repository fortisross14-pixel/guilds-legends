import React from 'react';
import { Button, Tabs } from '../components/UI.jsx';
import PixelIcon, { PAGE_ICONS } from '../components/PixelIcon.jsx';
import SettingsScreen from '../screens/SettingsScreen.jsx';
import ChronicleScreen from '../screens/ChronicleScreen.jsx';
import GoalsScreen from '../screens/GoalsScreen.jsx';
import LegacyScreen from '../screens/LegacyScreen.jsx';
import CalendarScreen from './CalendarScreen.jsx';
import QuestLogScreen from './QuestLogScreen.jsx';
import { BestiaryScreen, NewsScreen } from './NewsScreen.jsx';

const PAGES = [
  { id: 'calendar', name: 'Calendar', icon: '▦', description: 'Weeks ahead: tournaments, company returns, wage days. Advance to a date.' },
  { id: 'news', name: 'News', icon: '✉', description: 'Town talk, side-job results and world events.' },
  { id: 'quests', name: 'Quest log', icon: '✎', description: 'Active contracts, open promises and current objectives.' },
  { id: 'settings', name: 'Campaign settings', icon: '⚙', description: 'Save, export or import the campaign, rename the guild, preferences.' },
  { id: 'chronicle', name: 'Chronicle', icon: '▤', description: 'The living history: timeline, field reports, eras and the hall of fame.' },
  { id: 'codex', name: 'Codex', icon: '✓', description: 'Goals, promotion path, achievements, and the legacy office.' },
];

const CODEX_TABS = [
  { id: 'goals', label: 'Goals & promotion', icon: '✓' },
  { id: 'legacy', label: 'Legacy office', icon: '♛' },
  { id: 'bestiary', label: 'Bestiary & story', icon: '☠' },
];

export default function MenuScreen({ state, actions, navigate, slot, place, setPlace }) {
  const props = { state, actions, navigate, slot };
  const page = PAGES.find((item) => item.id === place.page);

  if (!page) {
    return (
      <div className="screen screen--menu">
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

  const codexTab = ['legacy', 'bestiary'].includes(place.tab) ? place.tab : 'goals';
  return (
    <div className={`menu-page menu-page--${page.id}`}>
      <Button size="sm" className="town-header__back menu-page__back" onClick={() => setPlace({ view: 'menu', page: null })}>
        ◀ Chronicle
      </Button>
      {page.id === 'settings' ? <SettingsScreen {...props} /> : null}
      {page.id === 'chronicle' ? <ChronicleScreen {...props} /> : null}
      {page.id === 'calendar' ? <CalendarScreen {...props} /> : null}
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
