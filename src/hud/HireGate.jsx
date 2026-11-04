import React from 'react';
import { hasHall } from '../game/engine.js';
import Icon from '../components/Icon.jsx';

/**
 * "No hall, no hires": until the guild rents a lot (story mission 1), recruits
 * talk but nobody signs. Shown in the tavern, Contacts and the quest log.
 * Renders nothing once the guild has a hall.
 */
export default function HireGate({ state, className = '' }) {
  if (hasHall(state)) return null;
  return (
    <p className={`hire-gate ${className}`} role="note">
      <Icon name="lock" size={16} tone="plain" />
      <span>No hall, no hires: rent a hall first.</span>
    </p>
  );
}
