import React, { useState } from 'react';
import { Badge, Button, CountUp, HeroPortrait, Modal, PrimalBadge, RankChange, RarityBadge, artUrl } from './UI.jsx';
import Icon from './Icon.jsx';
import Asset from './Asset.jsx';
import { Dialogue } from './EventCardModal.jsx';
import { SeasonReview } from '../screens/HistoryScreens.jsx';
import ChapterEnd from './ChapterEnd.jsx';
import { getSeasonReview } from '../game/engine.js';

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

const LOOT_ICONS = { consumable: 'potion', weapon: 'sword', armor: 'shield', accessory: 'gem' };

/** "Details": the battle log (or a breakdown), never shown by default. */
function Details({ lines }) {
  const [open, setOpen] = useState(false);
  if (!lines?.length) return null;
  return (
    <div className="moment__details" onClick={(event) => event.stopPropagation()}>
      <button type="button" className="moment__details-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
        Details
      </button>
      {open ? (
        <ol className="moment__details-log">
          {lines.map((line, index) => (
            <li key={index}>{line}</li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

// Reward moments: victory, level up, rankings, status title, nemesis, recruit,
// a broken record and the end-of-year season review.
// A click anywhere on a ceremony finishes its animation.
export default function MomentModal({ moment, state, onClose }) {
  const [skipped, setSkipped] = useState(null);
  if (!moment) return null;
  const hero = moment.heroId ? state.heroes.find((item) => item.id === moment.heroId) : null;
  const heroById = (id) => state.heroes.find((item) => item.id === id);
  const skipClass = skipped === moment.id ? 'is-skipped' : '';
  const skip = () => setSkipped(moment.id);

  // Victory (playtest-1-feedback): show, don't tell. The big word, each hero with
  // an XP bar (Level up! inside it), HP left and an injury mark, gold and loot as
  // icons with numbers, Continue. The battle log waits behind Details.
  if (moment.type === 'victory') {
    const hpOf = (heroId) => moment.party?.find((entry) => entry.heroId === heroId);
    return (
      <Modal open title={moment.title} onClose={onClose} width="medium" className="modal--ceremony">
        <div className={`moment moment--victory ${skipClass}`} onClick={skip}>
          <Ceremony>
            <p className="moment__headline">Victory</p>
          </Ceremony>
          {moment.xp?.length ? (
            <ul className="moment__xp">
              {moment.xp.map((entry, index) => {
                const member = heroById(entry.heroId);
                const vitals = hpOf(entry.heroId);
                const leveled = entry.levelAfter > entry.levelBefore;
                return (
                  <li key={entry.heroId} style={{ animationDelay: `${600 + index * 120}ms` }} className={vitals?.injured ? 'is-injured' : ''}>
                    {member ? <HeroPortrait hero={member} size="xs" showStatus={false} /> : <span />}
                    <span
                      className={`xp-bar ${leveled ? 'is-level-up' : ''}`}
                      style={{ '--from': `${Math.round((entry.from || 0) * 100)}%`, '--to': `${leveled ? 100 : Math.round((entry.to || 0) * 100)}%`, '--delay': `${800 + index * 160}ms` }}
                      aria-label={`${entry.name}: +${entry.xp} XP, level ${entry.levelAfter}`}
                    >
                      <i />
                      {leveled ? <em>Level up! Lv {entry.levelAfter}</em> : <small>Lv {entry.levelAfter}</small>}
                    </span>
                    {vitals ? (
                      <b className={`moment__hp num ${vitals.hp < 40 ? 'is-low' : ''}`} aria-label={`HP ${vitals.hp}%`}>
                        <Icon name={vitals.injured ? 'bandage' : 'heart'} size={14} tone="plain" />
                        {vitals.hp}
                      </b>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : null}
          {moment.gold || moment.loot?.length ? (
            <ul className="moment__spoils">
              {moment.gold ? (
                <li className="num">
                  <Icon name="coin" size={20} />+<CountUp value={moment.gold} />
                </li>
              ) : null}
              {(moment.loot || []).map((item, index) => (
                <li key={`${item.id || item}-${index}`} title={item.name || item}>
                  <Icon name={LOOT_ICONS[item.kind] || 'bag'} size={20} />
                  {item.count ? <span className="num">×{item.count}</span> : <small>{item}</small>}
                </li>
              ))}
            </ul>
          ) : null}
          <Details lines={moment.details} />
          <Button variant="primary" onClick={onClose}>
            Continue
          </Button>
        </div>
      </Modal>
    );
  }

  // Mission complete (playtest-1-feedback, missions-in-world): the contract and its
  // grade as stars, gold, fame and reputation as icons, loot, one line from the giver.
  if (moment.type === 'missionComplete') {
    const stars = { Partial: 1, Success: 2, Great: 3, Legendary: 4 }[moment.grade] || 2;
    return (
      <Modal open title={moment.title} eyebrow="Contract complete" onClose={onClose} width="medium" className="modal--ceremony">
        <div className={`moment moment--mission ${skipClass}`} onClick={skip}>
          <Ceremony fx={null}>
            <p className="moment__stars" aria-label={`${moment.grade}: ${stars} of 4 stars`}>
              {[1, 2, 3, 4].map((star) => (
                <Icon key={star} name="star" size={30} tone={star <= stars ? 'brass' : 'plain'} className={star <= stars ? 'is-on' : ''} />
              ))}
            </p>
            <p className="moment__grade">{moment.grade}</p>
          </Ceremony>
          <ul className="moment__spoils">
            {moment.gold ? (
              <li className="num" aria-label={`${moment.gold} gold`}>
                <Icon name="coin" size={20} />+<CountUp value={moment.gold} />
              </li>
            ) : null}
            {moment.fame ? (
              <li className="num" aria-label={`${moment.fame} fame`}>
                <Icon name="laurel" size={20} />+{moment.fame}
              </li>
            ) : null}
            {moment.reputation ? (
              <li className="num" aria-label={`${moment.reputation} reputation`}>
                <Icon name="banner" size={20} />+{moment.reputation}
              </li>
            ) : null}
            {(moment.loot || []).map((item, index) => (
              <li key={`${item.id || item}-${index}`} title={item.name || item}>
                <Icon name={LOOT_ICONS[item.kind] || 'bag'} size={20} />
                {item.count ? <span className="num">×{item.count}</span> : <small>{item}</small>}
              </li>
            ))}
          </ul>
          {moment.line ? <p className="moment__giver">“{moment.line}”{moment.giver ? <small> {moment.giver}</small> : null}</p> : null}
          <Details lines={moment.details} />
          <Button variant="primary" onClick={onClose}>
            Continue
          </Button>
        </div>
      </Modal>
    );
  }

  // A defeat: a calm card, no ceremony (guild-hall-rooms spec).
  if (moment.type === 'defeat') {
    return (
      <Modal open title={moment.heading || 'Defeat'} onClose={onClose} width="medium">
        <div className="moment moment--defeat">
          {moment.interior ? <Asset id={moment.interior} className="moment__room-art" alt="" /> : null}
          <p className="moment__headline">{moment.title}</p>
          <p className="moment__effect">{moment.effect}</p>
          <ul className="moment__spoils moment__spoils--cost">
            <li className="num" aria-label={`Treatment and transport: ${moment.cost} gold${moment.owed ? `, ${moment.owed} owed` : ''}`}>
              <Icon name="coin" size={20} />−{moment.cost}
              {moment.owed ? <small> ({moment.owed} owed)</small> : null}
            </li>
            <li className="num" aria-label={`Recovery: ${moment.weeks} weeks`}>
              <Icon name="bandage" size={20} />
              {moment.weeks === 4 ? '1 month' : `${moment.weeks} weeks`}
            </li>
          </ul>
          <Button variant="primary" onClick={onClose}>
            Continue
          </Button>
        </div>
      </Modal>
    );
  }

  if (moment.type === 'construction') {
    return (
      <Modal open title={moment.heading || 'Construction complete'} onClose={onClose} width="medium" className="modal--ceremony">
        <div className={`moment moment--construction ${skipClass}`} onClick={skip}>
          <Ceremony fx="burst">
            <p className="moment__headline">{moment.title}</p>
          </Ceremony>
          {moment.interior ? <Asset id={moment.interior} className={`moment__room-art ${moment.interior.startsWith('hall.room.') ? 'moment__room-art--tile' : ''}`} alt="" /> : null}
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
          <Ceremony fx={null}>{hero ? <HeroPortrait hero={hero} size="lg" /> : null}</Ceremony>
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
              <Icon name={moment.promoted ? 'crown' : 'pointer'} size={48} />
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
              <Icon name="swords" size={48} />
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

  if (moment.type === 'seasonReview') {
    return <SeasonReview key={moment.id} review={getSeasonReview(state, moment.year)} onClose={onClose} />;
  }

  if (moment.type === 'record') {
    return (
      <Modal open title={moment.label} eyebrow="Record broken!" onClose={onClose} width="medium" className="modal--ceremony">
        <div className={`moment moment--record ${skipClass}`} onClick={skip}>
          <Ceremony fx="burst">
            <span className="moment__fanfare">
              <Asset id="trophy.record" alt="" />
            </span>
          </Ceremony>
          <p className="moment__headline">Record broken!</p>
          <p className="moment__record-value num">{moment.display}</p>
          <p>
            <strong>{moment.holder}</strong> takes the record from {moment.previous}.
          </p>
          <p className="muted">The Herald keeps the record book.</p>
          <Button variant="primary" onClick={onClose}>
            Continue
          </Button>
        </div>
      </Modal>
    );
  }

  if (moment.type === 'chapterEnd') {
    return <ChapterEnd key={moment.id} state={state} chapter={moment.chapter} onClose={onClose} />;
  }

  if (moment.type === 'tutorialComplete') {
    return (
      <Modal open title="Tutorial complete" eyebrow="The end of Act I" onClose={onClose} width="medium" className="modal--ceremony">
        <div className={`moment moment--story ${skipClass}`} onClick={skip}>
          <Ceremony fx="burst">
            <Asset id="relic.banner" className="moment__relic" alt="" />
          </Ceremony>
          <p className="moment__headline">You are free</p>
          <p>
            {state.guild.name} has a hall, a first companion and a name in Dunmere. From here, go where you like: take contracts, grow the hall, enter
            tournaments, travel, or follow the story. The Quest Log keeps the main story, side quests and guild goals.
          </p>
          <Button variant="primary" onClick={onClose}>
            Continue
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
