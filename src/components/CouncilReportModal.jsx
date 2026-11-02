import React from 'react';
import { Badge, Button, HeroPortrait, Modal } from './UI.jsx';

function delta(value, suffix = '') {
  if (!value) return `0${suffix}`;
  return `${value > 0 ? '+' : ''}${value}${suffix}`;
}

export default function CouncilReportModal({ state, open, onClose, openHero }) {
  const report = state.council?.lastReport;
  if (!open || !report) return null;
  const heroById = new Map(state.heroes.map((hero) => [hero.id, hero]));
  return (
    <Modal open title={`Council report · ${report.label}`} eyebrow={report.advancedMonths > 1 ? `${report.advancedMonths} months advanced · latest month shown` : 'Monthly resolution'} onClose={onClose} width="wide">
      <div className="council-report">
        <div className="council-report__metrics">
          <div><span>Upkeep</span><strong>−{report.upkeep + (report.loanPayment || 0)}</strong><small>{report.loanPayment ? `incl. ${report.loanPayment} loan · ` : ''}{report.crownsBefore.toLocaleString()} → {report.crownsAfter.toLocaleString()} crowns</small></div>
          <div><span>Fame</span><strong>{delta(report.fameDelta)}</strong><small>{report.exhibitionFame ? `${report.exhibitionFame} from exhibitions` : 'No exhibition fame'}</small></div>
          <div><span>Legacy</span><strong>{delta(report.legacyDelta)}</strong><small>Institutional growth</small></div>
          <div><span>Scouting</span><strong>{report.scouts || 0}</strong><small>field effort</small></div>
        </div>
        {report.walkouts?.length ? <p className="council-report__warning"><Badge tone="red">Unpaid wages</Badge> {report.walkouts.join(', ')} walked out and joined the free agents.</p> : null}
        <section>
          <span className="eyebrow">What everyone did</span>
          <div className="council-report__activity-list">
            {(report.activities || []).map((item) => {
              const hero = heroById.get(item.heroId);
              return (
                <button key={`${item.heroId}-${item.activity}`} onClick={() => hero && openHero(item.heroId)}>
                  {hero ? <HeroPortrait hero={hero} size="sm" /> : <span className="council-report__icon">{item.icon}</span>}
                  <div><strong>{item.name}</strong><small>{item.icon} {item.activity}</small><p>{item.summary}</p></div>
                  <span className="council-report__deltas">
                    {item.levelAfter > item.levelBefore ? <Badge tone="purple">Level {item.levelAfter}</Badge> : item.xpDelta > 0 ? <Badge tone="blue">+{item.xpDelta} XP</Badge> : null}
                    {item.healthDelta > 0 ? <Badge tone="green">+{item.healthDelta} health</Badge> : null}
                    {item.fatigueDelta < 0 ? <Badge tone="green">{item.fatigueDelta} fatigue</Badge> : null}
                    {item.fatigueDelta > 0 ? <Badge tone="gold">+{item.fatigueDelta} fatigue</Badge> : null}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
        <Button variant="primary" size="lg" onClick={onClose}>Return to the guild hall</Button>
      </div>
    </Modal>
  );
}
