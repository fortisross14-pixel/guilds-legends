import React from 'react';
import { Badge, Button, HeroPortrait, Modal, PrimalBadge, RankChange, RarityBadge } from './UI.jsx';

// Reward moments: victory screen, level-up screen and recruit introduction card.
export default function MomentModal({ moment, state, onClose }) {
  if (!moment) return null;
  const hero = moment.heroId ? state.heroes.find((item) => item.id === moment.heroId) : null;

  if (moment.type === 'victory') {
    return (
      <Modal open title="Victory!" eyebrow={moment.title} onClose={onClose} width="medium">
        <div className="moment moment--victory">
          {moment.grade ? <Badge tone="gold">{moment.grade}</Badge> : null}
          {moment.gold ? <p className="moment__gold">+{moment.gold} gold</p> : null}
          {moment.xp?.length ? (
            <ul className="moment__xp">
              {moment.xp.map((entry) => (
                <li key={entry.heroId}>
                  <strong>{entry.name}</strong> +{entry.xp} XP
                </li>
              ))}
            </ul>
          ) : null}
          {moment.loot?.length ? <p className="moment__loot">Loot: {moment.loot.join(', ')}</p> : null}
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
          {hero ? <HeroPortrait hero={hero} size="lg" /> : null}
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
                <strong>
                  #{entry.rank}
                  <small>/{entry.total}</small>
                </strong>
                <RankChange change={entry.change} />
                <small>
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
          <p className="moment__fanfare">{moment.promoted ? '♛' : '▼'}</p>
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
          <p className="moment__hook">{moment.hook}</p>
          <Button variant="primary" onClick={onClose}>
            Welcome aboard
          </Button>
        </div>
      </Modal>
    );
  }
  return null;
}
