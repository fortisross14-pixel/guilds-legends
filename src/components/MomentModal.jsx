import React from 'react';
import { Badge, Button, HeroPortrait, Modal, PrimalBadge, RarityBadge } from './UI.jsx';

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
