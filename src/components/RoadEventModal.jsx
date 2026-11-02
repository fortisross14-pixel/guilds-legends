import React from 'react';
import { ROAD_EVENTS } from '../data/roadEvents.js';
import { LOCATION_BY_ID } from '../data/world.js';
import { Modal } from './UI.jsx';

// Same pattern as the mission decision modal: a short scene and numbered options.
export default function RoadEventModal({ event, onChoose }) {
  if (!event) return null;
  const definition = ROAD_EVENTS[event.type];
  if (!definition) return null;
  return (
    <Modal open title={definition.title} eyebrow={`On the road to ${LOCATION_BY_ID[event.toId]?.name || 'the next town'}`} preventClose width="medium">
      <div className="decision-scene road-event">
        <blockquote>{definition.text}</blockquote>
        <div className="decision-options">
          {definition.options.map((option, index) => (
            <button key={option.id} onClick={() => onChoose(option.id)}>
              <span className="decision-options__key">{index + 1}</span>
              <div>
                <h3>{option.label}</h3>
                <p>{option.note}</p>
              </div>
              <span className="decision-options__arrow">›</span>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
