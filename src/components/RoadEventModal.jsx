import React from 'react';
import { ROAD_EVENTS } from '../data/roadEvents.js';
import { LOCATION_BY_ID } from '../data/world.js';
import { Modal } from './UI.jsx';
import PixelIcon from './PixelIcon.jsx';

// Same pattern as the event cards: a dialogue box and numbered options.
export default function RoadEventModal({ event, onChoose }) {
  if (!event) return null;
  const definition = ROAD_EVENTS[event.type];
  if (!definition) return null;
  const destination = LOCATION_BY_ID[event.toId]?.name || 'the next town';
  return (
    <Modal open title={definition.title} eyebrow={`On the road to ${destination}`} preventClose width="medium">
      <div className="decision-scene road-event">
        <div className="dialogue">
          <span className="dialogue__speaker">
            <PixelIcon name="flag" size={12} />
            On the road
          </span>
          <blockquote>{definition.text}</blockquote>
          <span className="dialogue__more" aria-hidden="true" />
        </div>
        <div className="decision-options" data-menu>
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
