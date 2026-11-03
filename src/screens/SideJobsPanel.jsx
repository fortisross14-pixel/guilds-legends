import React, { useState } from 'react';
import { Badge, Button, Panel } from '../components/UI.jsx';

// Notice board side jobs: 1 week, 1–2 heroes, a quick stat roll.
export default function SideJobsPanel({ state, actions, locationId }) {
  const [picks, setPicks] = useState({});
  const jobs = (state.sideJobs || []).filter((job) => job.locationId === locationId);
  const idle = state.heroes.filter((hero) => hero.status === 'available' && !hero.branchId);
  const running = (state.activeSideJobs || []).filter((job) => job.locationId === locationId);
  const pick = (jobId, slot, heroId) => setPicks({ ...picks, [jobId]: { ...(picks[jobId] || {}), [slot]: heroId } });
  return (
    <Panel title="Side jobs" eyebrow="One week, one or two heroes, small rewards">
      {running.map((job) => (
        <p key={job.id} className="side-job side-job--running">
          <Badge tone="blue">Running</Badge> {job.title} · {job.heroIds.map((id) => state.heroes.find((hero) => hero.id === id)?.name).join(', ')}
        </p>
      ))}
      {jobs.length ? (
        jobs.map((job) => {
          const chosen = picks[job.id] || {};
          const first = chosen.a || idle[0]?.id || '';
          return (
            <article key={job.id} className="side-job">
              <div>
                <strong>{job.title}</strong>
                <small>
                  {job.stat} check · {job.gold} gold · {job.xp} XP{job.item ? ' · maybe an item' : ''}
                  {job.rep ? ' · reputation' : ''}
                </small>
              </div>
              <select value={first} onChange={(event) => pick(job.id, 'a', event.target.value)} disabled={!idle.length}>
                {idle.map((hero) => (
                  <option key={hero.id} value={hero.id}>
                    {hero.name} ({hero.attributes?.[job.stat] ?? '—'} {job.stat})
                  </option>
                ))}
              </select>
              <select value={chosen.b || ''} onChange={(event) => pick(job.id, 'b', event.target.value)} disabled={idle.length < 2}>
                <option value="">+ helper (optional)</option>
                {idle
                  .filter((hero) => hero.id !== first)
                  .map((hero) => (
                    <option key={hero.id} value={hero.id}>
                      {hero.name}
                    </option>
                  ))}
              </select>
              <Button size="sm" disabled={!first} onClick={() => actions.startSideJob(job.id, [first, chosen.b].filter(Boolean))}>
                Send
              </Button>
            </article>
          );
        })
      ) : (
        <p className="muted">No side jobs posted here right now. New ones appear each month.</p>
      )}
    </Panel>
  );
}
