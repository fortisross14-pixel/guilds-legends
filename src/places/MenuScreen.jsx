import React from 'react';
import { Tabs } from '../components/UI.jsx';
import SettingsScreen from '../screens/SettingsScreen.jsx';
import ChronicleScreen from '../screens/ChronicleScreen.jsx';
import GoalsScreen from '../screens/GoalsScreen.jsx';
import LegacyScreen from '../screens/LegacyScreen.jsx';

const PAGES = [
  { id: 'settings', name: 'Campaign settings', icon: '⚙', description: 'Save, export or import the campaign, rename the guild, preferences.' },
  { id: 'chronicle', name: 'Chronicle', icon: '▤', description: 'The living history: timeline, field reports, eras and the hall of fame.' },
  { id: 'codex', name: 'Codex', icon: '✓', description: 'Goals, promotion path, achievements, and the legacy office.' },
];

const CODEX_TABS = [
  { id: 'goals', label: 'Goals & promotion', icon: '✓' },
  { id: 'legacy', label: 'Legacy office', icon: '♛' },
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
          </div>
        </header>
        <div className="building-grid">
          {PAGES.map((item) => (
            <button key={item.id} className={`building-tile building-tile--${item.id}`} onClick={() => setPlace({ view: 'menu', page: item.id, tab: null })}>
              <span className="building-tile__icon">{item.icon}</span>
              <strong>{item.name}</strong>
              <small>{item.description}</small>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const codexTab = place.tab === 'legacy' ? 'legacy' : 'goals';
  return (
    <div className={`menu-page menu-page--${page.id}`}>
      <button className="town-header__back menu-page__back" onClick={() => setPlace({ view: 'menu', page: null })}>
        ← Chronicle
      </button>
      {page.id === 'settings' ? <SettingsScreen {...props} /> : null}
      {page.id === 'chronicle' ? <ChronicleScreen {...props} /> : null}
      {page.id === 'codex' ? (
        <>
          <Tabs active={codexTab} onChange={(tab) => setPlace({ ...place, tab })} items={CODEX_TABS} />
          {codexTab === 'goals' ? <GoalsScreen {...props} /> : <LegacyScreen {...props} />}
        </>
      ) : null}
    </div>
  );
}
