import React, { useState } from 'react';
import { getChapterSummary } from '../game/engine.js';
import { Button, Modal } from './UI.jsx';
import Asset from './Asset.jsx';
import Icon from './Icon.jsx';

// The end of a chapter: a short card sequence in the style of the season
// review (what happened, what the guild chose, where it stands), then the
// next chapter's teaser. Free play continues afterwards.
export default function ChapterEnd({ state, chapter = null, onClose }) {
  const [index, setIndex] = useState(0);
  const summary = getChapterSummary(state, chapter);
  const cards = ['story', 'choices', 'guild', 'teaser'];
  const card = cards[index];
  const last = index === cards.length - 1;
  return (
    <Modal open title={card === 'teaser' ? summary.teaser.title : summary.title} eyebrow={card === 'teaser' ? 'Coming next' : `Chapter complete · ${summary.span}`} onClose={onClose} width="medium" className="modal--season">
      <div className="season-review">
        <Asset id="bg.story.chapter" className="season-review__backdrop" alt="" />
        <article className={`season-card season-card--${card}`} key={card}>
          {card === 'story' ? (
            <>
              <p className="season-card__eyebrow">The Names They Erased</p>
              <ul className="season-card__facts">
                {summary.missions.map((mission) => (
                  <li key={mission.number}>
                    {mission.number}. {mission.title} <b>{mission.done ? <Icon name="check" size={14} tone="plain" /> : '—'}</b>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          {card === 'choices' ? (
            <>
              <p className="season-card__eyebrow">What you chose</p>
              <ul className="season-card__facts season-card__facts--small">
                {summary.choices.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <p>
                <b>Evidence:</b> {summary.evidence.length ? summary.evidence.join(', ') : 'none yet'}
              </p>
              <p>
                <b>Joined through the story:</b> {summary.recruits.length ? summary.recruits.join(', ') : 'nobody'}
              </p>
            </>
          ) : null}
          {card === 'guild' ? (
            <>
              <p className="season-card__eyebrow">{state.guild.name}</p>
              <ul className="season-card__facts">
                <li>
                  Contracts won <b className="num">{summary.stats.contracts}</b>
                </li>
                <li>
                  Titles <b className="num">{summary.stats.titles}</b>
                </li>
                <li>
                  Fame · Legacy{' '}
                  <b className="num">
                    {summary.stats.fame} · {summary.stats.legacy}
                  </b>
                </li>
                <li>
                  Heroes <b className="num">{summary.stats.heroes}</b>
                </li>
                <li>
                  Lore entries found <b className="num">{summary.codex}</b>
                </li>
              </ul>
              {summary.path ? <p>The road you are on: {summary.path}.</p> : null}
            </>
          ) : null}
          {card === 'teaser' ? (
            <>
              <Asset id="crest.argent-crown" className="season-card__crest" alt="The Argent Crown" />
              <p className="season-card__eyebrow">Coming next</p>
              <p className="season-card__headline season-card__headline--small">{summary.teaser.title}</p>
              <blockquote className="season-card__quote">{summary.teaser.text}</blockquote>
              <p className="muted">The story goes on from here. Your guild doesn’t have to wait: the whole map is open.</p>
            </>
          ) : null}
        </article>
        <div className="season-review__actions">
          <Button size="sm" disabled={index === 0} onClick={() => setIndex(index - 1)}>
            <Icon name="back" size={14} tone="plain" /> Back
          </Button>
          <Button variant="primary" onClick={() => (last ? onClose() : setIndex(index + 1))}>
            {last ? 'Keep playing' : <>Next <Icon name="next" size={14} tone="plain" /></>}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
