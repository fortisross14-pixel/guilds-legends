import React from 'react';
import { ROAD_EVENTS } from '../data/roadEvents.js';
import { LOCATION_BY_ID } from '../data/world.js';
import { Modal } from './UI.jsx';

/** The first sentence of the event's narration: one line on the card. */
const firstLine = (text = '') => text.match(/^[^.!?]*[.!?]/)?.[0] || text;

// A road event (missions-in-world spec): a proper card that fits on screen, with
// the title, one line of narration, and the choices as full-width rows. Nothing
// sits behind or under it; choosing is how it closes.
export default function RoadEventModal({ event, onChoose }) {
  if (!event) return null;
  const definition = ROAD_EVENTS[event.type];
  if (!definition) return null;
  const destination = LOCATION_BY_ID[event.toId]?.name || 'the next town';
  return (
    <Modal open title={definition.title} eyebrow={event.where || `On the road to ${destination}`} preventClose width="medium" className="modal--road">
      <div className="road-event">
        <p className="road-event__line">{firstLine(definition.text)}</p>
        <div className="decision-options" data-menu>
          {definition.options.map((option, index) => (
            <button key={option.id} onClick={() => onChoose(option.id)}>
              <span className="decision-options__key">{index + 1}</span>
              <div>
                <h3>{option.label}</h3>
                {option.note ? <p>{option.note}</p> : null}
              </div>
              <span className="decision-options__arrow">›</span>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
