import React from 'react';
import { useCoarsePointer } from './WalkableScene.jsx';

/**
 * The HUD over a walkable scene: where you are, and the four ways out
 * (World map, Guild Hall, Quest log, Menu). `leave(route)` saves the
 * founder's position before navigating.
 */
export default function SceneHud({ eyebrow, title, hint, leave, extra = null, children = null }) {
  const coarse = useCoarsePointer();
  return (
    <>
      <header className="walk-hud">
        <div className="walk-hud__place">
          <span>{eyebrow}</span>
          <h1>{title}</h1>
          <small>{hint || (coarse ? 'Tap to walk. Tap people, doors and things to visit.' : 'Click to walk, or use the arrow keys. Click people, doors and things to visit.')}</small>
          {children}
        </div>
      </header>
      <nav className="walk-nav" aria-label="Leave this place">
        <button type="button" onClick={() => leave('map')}>
          <span aria-hidden="true">◈</span>World map
        </button>
        <button type="button" onClick={() => leave('hall')}>
          <span aria-hidden="true">♜</span>Guild Hall
        </button>
        <button type="button" onClick={() => leave('quests')}>
          <span aria-hidden="true">✎</span>Quest log
        </button>
        <button type="button" onClick={() => leave('menu')}>
          <span aria-hidden="true">☰</span>Menu
        </button>
        {extra}
      </nav>
    </>
  );
}
