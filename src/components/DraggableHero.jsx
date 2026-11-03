import React from 'react';
import { useDraggable } from './useDraggable.js';
import { dragEnabled } from './gestures.js';

/**
 * A hero you can drag onto rooms, the main party, mission slots or anything
 * marked `data-drop`. Drops go to actions.dropHero(heroId, target), which
 * routes them (App.jsx). Tapping still does whatever `onClick` says, so the
 * tap fallback (tap the hero, then the target) keeps working.
 */
export default function DraggableHero({ hero, state, actions, className = '', children, onClick, title }) {
  const drag = useDraggable({
    enabled: dragEnabled(state.settings) && !['dead', 'retired'].includes(hero.status),
    label: hero.name,
    onDrop: (target) => target && actions.dropHero(hero.id, target),
  });
  return (
    <button type="button" className={`${className} is-draggable`} title={title} onClick={onClick} {...drag}>
      {children}
    </button>
  );
}
