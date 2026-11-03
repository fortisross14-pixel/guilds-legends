import React from 'react';
import { Modal } from './UI.jsx';
import PixelIcon from './PixelIcon.jsx';

// Town events, festivals and story beats: a dialogue box with 2–3 choices.
export default function EventCardModal({ card, onChoose }) {
  if (!card) return null;
  const speaker = card.source === 'story' ? 'The Lantern in the Blackwood' : card.source === 'festival' ? card.festival || 'Festival' : 'Town crier';
  const subtitle = card.source === 'story' ? 'Story' : card.source === 'festival' ? 'Festival' : 'This week in town';
  return (
    <Modal open title={card.title} eyebrow={subtitle} preventClose width="medium">
      <div className={`decision-scene event-card event-card--${card.source}`}>
        <div className="dialogue">
          <span className="dialogue__speaker">
            <PixelIcon name={card.source === 'story' ? 'book' : card.source === 'festival' ? 'star' : 'horn'} size={12} />
            {speaker}
          </span>
          <blockquote>{card.text}</blockquote>
          <span className="dialogue__more" aria-hidden="true" />
        </div>
        <div className="decision-options" data-menu>
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
