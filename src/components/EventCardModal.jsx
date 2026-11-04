import React, { useEffect, useState } from 'react';
import { Crest, HeroPortrait, Modal, TypeText } from './UI.jsx';

// The hero an event is about (named in its text), for the dialogue portrait.
function heroInText(heroes = [], text = '') {
  return heroes.find((hero) => !['dead', 'retired'].includes(hero.status) && hero.name && text.includes(hero.name)) || null;
}

/** A parchment dialogue box: portrait, speaker plate, typed text (click to finish). The plate names
 * who tells it (the town crier for a town event); a hero in the story only lends the portrait. */
export function Dialogue({ speaker, text, hero = null }) {
  const [done, setDone] = useState(false);
  useEffect(() => setDone(false), [text]);
  return (
    <div className={`quote-card ${done ? 'is-done' : ''}`} onClick={() => setDone(true)} role="group" aria-label={`${speaker} says`}>
      <div className="quote-card__portrait">{hero ? <HeroPortrait hero={hero} size="lg" showStatus={false} /> : <Crest size="lg" />}</div>
      <div className="quote-card__body">
        <span className="quote-card__speaker">{speaker}</span>
        <blockquote>
          <TypeText text={text} done={done} />
        </blockquote>
        <span className="quote-card__more" aria-hidden="true" />
      </div>
    </div>
  );
}

// Town events and festivals: a dialogue box with 2–3 choices.
export default function EventCardModal({ card, onChoose, heroes = [] }) {
  if (!card) return null;
  const speaker = card.source === 'festival' ? card.festival || 'Festival' : 'Town crier';
  const subtitle = card.source === 'festival' ? 'Festival' : 'This week in town';
  return (
    <Modal open title={card.title} eyebrow={subtitle} preventClose width="medium" className="modal--story">
      <div className={`decision-scene event-card event-card--${card.source}`}>
        <Dialogue speaker={speaker} text={card.text} hero={heroInText(heroes, card.text)} />
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
