import React from 'react';
import { Badge, Button, HeroPortrait, Modal, PrimalBadge, RankChange, RarityBadge, artUrl } from './UI.jsx';
import PixelIcon from './PixelIcon.jsx';

// Reward effect sprites from public/art/effects.
const FX = { sparkle: 'effect_12', buff: 'effect_12', burst: 'effect_10' };
function RewardFx({ name }) {
  return <img className="fx-badge" src={artUrl(`art/effects/${FX[name]}.png`)} alt="" aria-hidden="true" />;
}

// Reward moments: victory, level up, rankings, status title, nemesis and recruit.
export default function MomentModal({ moment, state, onClose }) {
  if (!moment) return null;
  const hero = moment.heroId ? state.heroes.find((item) => item.id === moment.heroId) : null;
  const heroById = (id) => state.heroes.find((item) => item.id === id);

  if (moment.type === 'victory') {
    return (
      <Modal open title="Victory!" eyebrow={moment.title} onClose={onClose} width="medium">
        <div className="moment moment--victory">
          <RewardFx name="sparkle" />
          <p className="moment__headline">Victory!</p>
          {moment.grade ? <Badge tone="gold">{moment.grade}</Badge> : null}
          {moment.gold ? (
            <p className="moment__gold num">
              <PixelIcon name="coin" size={24} />+{moment.gold} G
            </p>
          ) : null}
          {moment.xp?.length ? (
            <ul className="moment__xp">
              {moment.xp.map((entry) => {
                const member = heroById(entry.heroId);
                return (
                  <li key={entry.heroId}>
                    {member ? <HeroPortrait hero={member} size="xs" showStatus={false} /> : <span />}
                    <span>{entry.name}</span>
                    <b className="num">+{entry.xp} XP</b>
                  </li>
                );
              })}
            </ul>
          ) : null}
          {moment.loot?.length ? (
            <>
              <p className="moment__section-label">Loot</p>
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

  if (moment.type === 'levelUp') {
    return (
      <Modal open title={`${moment.name} reached level ${moment.levelAfter}!`} eyebrow="Level up" onClose={onClose} width="medium">
        <div className="moment moment--level-up">
          {hero ? <HeroPortrait hero={hero} size="lg" /> : <RewardFx name="buff" />}
          <p className="moment__headline">Level {moment.levelAfter}!</p>
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
      <Modal open title={moment.promoted ? `${moment.to}!` : `Now: ${moment.to}`} eyebrow="Status title" onClose={onClose} width="medium">
        <div className={`moment moment--status ${moment.promoted ? 'moment--status-up' : 'moment--status-down'}`}>
          {moment.promoted ? <RewardFx name="sparkle" /> : null}
          <span className="moment__fanfare">
            <PixelIcon name={moment.promoted ? 'crown' : 'pointer'} size={48} />
          </span>
          <p className="moment__headline">{moment.promoted ? 'Rank up!' : 'Title lost'}</p>
          <p>
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
      <Modal open title={`${moment.title} is now your nemesis`} eyebrow="Rivalry" onClose={onClose} width="medium">
        <div className="moment moment--nemesis">
          <span className="moment__fanfare">
            <PixelIcon name="swords" size={48} />
          </span>
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
      <Modal open title={`${moment.name} joins the guild`} eyebrow="A new companion" onClose={onClose} width="medium">
        <div className="moment moment--recruit">
          {hero ? <HeroPortrait hero={hero} size="xl" /> : null}
          <div className="moment__taxonomy">
            <RarityBadge rarity={moment.rarity || 'Common'} />
            <PrimalBadge primal={moment.primal} />
            <Badge>
              Lv {moment.level} {moment.classId}
            </Badge>
            {moment.personality ? <Badge tone="blue">{moment.personality}</Badge> : null}
          </div>
          <div className="dialogue">
            <span className="dialogue__speaker">{moment.name}</span>
            <blockquote>{moment.hook}</blockquote>
          </div>
          <Button variant="primary" onClick={onClose}>
            Welcome aboard
          </Button>
        </div>
      </Modal>
    );
  }
  return null;
}
