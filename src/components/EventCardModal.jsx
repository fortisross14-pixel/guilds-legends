import React from 'react';
import { Modal } from './UI.jsx';

// Town events, festivals and story beats: a short card with 2–3 choices.
export default function EventCardModal({ card, onChoose }) {
  if (!card) return null;
  const eyebrow = card.source === 'story' ? 'The Lantern in the Blackwood' : card.source === 'festival' ? 'Festival' : 'This week in town';
  return (
    <Modal open title={card.title} eyebrow={eyebrow} preventClose width="medium">
      <div className={`decision-scene event-card event-card--${card.source}`}>
        <blockquote>{card.text}</blockquote>
        <div className="decision-options">
          {card.options.map((option, index) => (
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
