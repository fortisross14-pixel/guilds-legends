import React, { useState } from 'react';
import { Badge, Button, CountUp, HeroPortrait, Modal, PrimalBadge, RankChange, RarityBadge, artUrl } from './UI.jsx';
import PixelIcon from './PixelIcon.jsx';
import Asset from './Asset.jsx';
import { Dialogue } from './EventCardModal.jsx';

// Reward effect sprites from public/art/effects.
const FX = { sparkle: 'effect_12', burst: 'effect_10' };
const SPARKS = Array.from({ length: 12 }, (_, index) => ({ left: 8 + ((index * 41) % 84), delay: (index * 0.13) % 1.2, dx: ((index % 5) - 2) * 14 }));

/** Light burst, rising sparks and an optional effect sprite behind a ceremony title. */
function Ceremony({ fx = 'sparkle', children }) {
  return (
    <div className="ceremony">
      <span className="ceremony__burst" aria-hidden="true" />
      <span className="ceremony__sparks" aria-hidden="true">
        {SPARKS.map((spark, index) => (
          <i key={index} style={{ left: `${spark.left}%`, animationDelay: `${spark.delay}s`, '--dx': `${spark.dx}px` }} />
        ))}
      </span>
      {fx ? <img className="fx-badge" src={artUrl(`art/effects/${FX[fx]}.png`)} alt="" aria-hidden="true" /> : null}
      {children}
    </div>
  );
}

// Reward moments: victory, level up, rankings, status title, nemesis and recruit.
// A click anywhere on a ceremony finishes its animation.
export default function MomentModal({ moment, state, onClose }) {
  const [skipped, setSkipped] = useState(null);
  if (!moment) return null;
  const hero = moment.heroId ? state.heroes.find((item) => item.id === moment.heroId) : null;
  const heroById = (id) => state.heroes.find((item) => item.id === id);
  const skipClass = skipped === moment.id ? 'is-skipped' : '';
  const skip = () => setSkipped(moment.id);

  if (moment.type === 'victory') {
    return (
      <Modal open title="Victory" eyebrow={moment.title} onClose={onClose} width="medium" className="modal--ceremony">
        <div className={`moment moment--victory ${skipClass}`} onClick={skip}>
          <Ceremony>
            <p className="moment__headline">Victory</p>
          </Ceremony>
          {moment.grade ? <Badge tone="gold">{moment.grade}</Badge> : null}
          {moment.gold ? (
            <p className="moment__gold num">
              <PixelIcon name="coin" size={24} />+<CountUp value={moment.gold} /> G
            </p>
          ) : null}
          {moment.xp?.length ? (
            <ul className="moment__xp">
              {moment.xp.map((entry, index) => {
                const member = heroById(entry.heroId);
                return (
                  <li key={entry.heroId} style={{ animationDelay: `${600 + index * 120}ms` }}>
                    {member ? <HeroPortrait hero={member} size="xs" showStatus={false} /> : <span />}
                    <span>{entry.name}</span>
                    <b className="num">
                      +<CountUp value={entry.xp} duration={1100} /> XP
                    </b>
                    {typeof entry.from === 'number' ? (
                      <span
                        className={`xp-bar ${entry.levelAfter > entry.levelBefore ? 'is-level-up' : ''}`}
                        style={{
                          '--from': `${Math.round(entry.from * 100)}%`,
                          '--to': `${entry.levelAfter > entry.levelBefore ? 100 : Math.round(entry.to * 100)}%`,
                          '--delay': `${800 + index * 160}ms`,
                        }}
                        aria-label={`XP bar, level ${entry.levelAfter}`}
                      >
                        <i />
                        {entry.levelAfter > entry.levelBefore ? <em>Level up! Lv {entry.levelAfter}</em> : <small>Lv {entry.levelAfter}</small>}
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : null}
          {moment.loot?.length ? (
            <>
              <p className="moment__section-label">Spoils</p>
              <ul className="moment__loot-list">
                {moment.loot.map((item, index) => (
                  <li key={`${item}-${index}`}>{item}</li>
                ))}
              </ul>
            </>
          ) : null}
          <Button variant="primary" onClick={onClose}>
            Continue
          </Button>
        </div>
      </Modal>
    );
  }

  if (moment.type === 'construction') {
    return (
      <Modal open title={moment.title} eyebrow="Construction complete" onClose={onClose} width="medium" className="modal--ceremony">
        <div className={`moment moment--construction ${skipClass}`} onClick={skip}>
          <Ceremony fx="burst">
            <p className="moment__headline">{moment.title}</p>
          </Ceremony>
          {moment.interior ? <Asset id={moment.interior} className="moment__room-art" alt="" /> : null}
          {moment.stage ? <Badge tone="gold">The guild home is now a {moment.stage.toLowerCase()}</Badge> : null}
          <p className="moment__effect">{moment.effect}</p>
          {moment.unlocked?.length ? (
            <>
              <p className="moment__section-label">Unlocked</p>
              <ul className="moment__loot-list">
                {moment.unlocked.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </>
          ) : null}
          <Button variant="primary" onClick={onClose}>
            Continue
          </Button>
        </div>
      </Modal>
    );
  }

  if (moment.type === 'levelUp') {
    return (
      <Modal open title={`${moment.name} reached level ${moment.levelAfter}`} eyebrow="Level up" onClose={onClose} width="medium" className="modal--ceremony">
        <div className={`moment moment--level-up ${skipClass}`} onClick={skip}>
          <Ceremony fx={null}>
            {hero ? <HeroPortrait hero={hero} size="lg" /> : null}
          </Ceremony>
          <p className="moment__headline">Level {moment.levelAfter}</p>
          <ul className="moment__stats">
            {Object.entries(moment.statGains || {}).map(([key, delta]) => (
              <li key={key}>
                {key} <strong>+{delta}</strong>
              </li>
            ))}
          </ul>
          {moment.newSkills?.length ? (
            <p className="moment__skills">
              New skill{moment.newSkills.length > 1 ? 's' : ''}: {moment.newSkills.join(', ')}
            </p>
          ) : null}
          <Button variant="primary" onClick={onClose}>
            Continue
          </Button>
        </div>
      </Modal>
    );
  }

  if (moment.type === 'rankings') {
    return (
      <Modal open title="Rankings update" eyebrow={moment.title} onClose={onClose} width="medium">
        <div className="moment moment--rankings">
          <Badge tone="gold">{moment.statusTitle}</Badge>
          <ul className="moment__ladders">
            {moment.ladders.map((entry) => (
              <li key={entry.ladder}>
                <span>{entry.label}</span>
                <strong className="num">
                  #{entry.rank}
                  <small>/{entry.total}</small>
                </strong>
                <RankChange change={entry.change} />
                <small className="num">
                  {entry.value.toLocaleString()} {entry.ladder === 'strength' ? 'power' : 'pts'}
                </small>
              </li>
            ))}
          </ul>
          <p className="muted">{moment.scope} ladders. The Herald has the full tables.</p>
          <Button variant="primary" onClick={onClose}>
            Continue
          </Button>
        </div>
      </Modal>
    );
  }

  if (moment.type === 'statusTitle') {
    return (
      <Modal open title={moment.promoted ? moment.to : `Now: ${moment.to}`} eyebrow="Status title" onClose={onClose} width="medium" className="modal--ceremony">
        <div className={`moment moment--status ${moment.promoted ? 'moment--status-up' : 'moment--status-down'} ${skipClass}`} onClick={skip}>
          <Ceremony fx={moment.promoted ? 'burst' : null}>
            <span className="moment__fanfare">
              <PixelIcon name={moment.promoted ? 'crown' : 'pointer'} size={48} />
            </span>
          </Ceremony>
          <p className="moment__headline">{moment.promoted ? 'Rank up' : 'Title lost'}</p>
          <p className="moment__transition">
            {moment.from} → <strong>{moment.to}</strong>
          </p>
          <p className="muted">
            {moment.promoted ? 'The official ladder names your guild among the powers of its tier.' : 'Official points from older tournaments have expired.'}
          </p>
          <Button variant="primary" onClick={onClose}>
            {moment.promoted ? 'Raise the banner' : 'Continue'}
          </Button>
        </div>
      </Modal>
    );
  }

  if (moment.type === 'nemesis') {
    return (
      <Modal open title={`${moment.title} is now your nemesis`} eyebrow="Rivalry" onClose={onClose} width="medium" className="modal--ceremony">
        <div className={`moment moment--nemesis ${skipClass}`} onClick={skip}>
          <Ceremony fx={null}>
            <span className="moment__fanfare">
              <PixelIcon name="swords" size={48} />
            </span>
          </Ceremony>
          <p>{moment.text}</p>
          <p className="muted">See the head-to-head record and issue challenges at the Herald (Rivals & nemeses).</p>
          <Button variant="primary" onClick={onClose}>
            Bring it on
          </Button>
        </div>
      </Modal>
    );
  }

  if (moment.type === 'recruit') {
    return (
      <Modal open title={`${moment.name} joins the guild`} eyebrow="A new companion" onClose={onClose} width="medium" className="modal--ceremony">
        <div className={`moment moment--recruit ${skipClass}`}>
          <div className="moment__taxonomy">
            <RarityBadge rarity={moment.rarity || 'Common'} />
            <PrimalBadge primal={moment.primal} />
            <Badge>
              Lv {moment.level} {moment.classId}
            </Badge>
            {moment.personality ? <Badge tone="blue">{moment.personality}</Badge> : null}
          </div>
          <Dialogue speaker={moment.name} text={moment.hook || ''} hero={hero} />
          <Button variant="primary" onClick={onClose}>
            Welcome aboard
          </Button>
        </div>
      </Modal>
    );
  }
  return null;
}
