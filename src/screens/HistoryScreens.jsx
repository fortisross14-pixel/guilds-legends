import React, { useMemo, useState } from 'react';
import { getHallOfFame, getHeadToHead, getHeroCareer, getLadderHistory, getMissionLog, getRecordBook, getSeasonList, getSeasonReview } from '../game/engine.js';
import { Badge, Button, EmptyState, HeroPortrait, Modal, Panel } from '../components/UI.jsx';
import Asset from '../components/Asset.jsx';

// Phase 5 history pages: the season review cards, record book, hall of fame,
// mission log, ladder history, head-to-head and the hero Career tab.

const LADDERS = [
  ['s', 'Strength'],
  ['l', 'Legacy'],
  ['o', 'Official'],
];
const AWARD_ASSET = { mvp: 'award.mvp', rookie: 'award.rookie', signing: 'award.signing' };
const SPEND_LABELS = { wages: 'Wages', hall: 'Hall', recruits: 'Recruits', shop: 'Shop', travel: 'Travel', tournaments: 'Tournament fees', patrons: 'Patrons', loan: 'Loan', other: 'Other (inns and upkeep)' };

const gold = (value) => `${Math.round(value || 0).toLocaleString()} G`;
const signed = (value) => `${value >= 0 ? '+' : ''}${Math.round(value || 0)}`;

/** Small rank chart: rank 1 at the top. `lines` = [{ key, label, values }]; values may hold nulls. */
export function RankChart({ lines, labels, height = 120 }) {
  const width = 320;
  const pad = 18;
  const all = lines.flatMap((line) => line.values).filter((value) => Number.isFinite(value));
  if (!all.length) return <p className="muted">No ranks recorded yet.</p>;
  const worst = Math.max(...all, 2);
  const count = Math.max(labels.length, 2);
  const x = (index) => pad + (index * (width - pad * 2)) / (count - 1);
  const y = (rank) => pad + ((rank - 1) * (height - pad * 2)) / Math.max(1, worst - 1);
  return (
    <figure className="rank-chart">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Rank history: ${lines.map((line) => `${line.label} ${line.values.filter(Number.isFinite).join(', ')}`).join('; ')}`}
      >
        <line className="rank-chart__axis" x1={pad} x2={width - pad} y1={y(1)} y2={y(1)} />
        <text className="rank-chart__tick" x={2} y={y(1) + 4}>
          #1
        </text>
        <text className="rank-chart__tick" x={2} y={y(worst) + 4}>
          #{worst}
        </text>
        {lines.map((line) => {
          const points = line.values.map((value, index) => (Number.isFinite(value) ? `${x(index)},${y(value)}` : null)).filter(Boolean);
          return (
            <g key={line.key} className={`rank-chart__line rank-chart__line--${line.key}`}>
              <polyline points={points.join(' ')} />
              {line.values.map((value, index) => (Number.isFinite(value) ? <circle key={index} cx={x(index)} cy={y(value)} r={3} /> : null))}
            </g>
          );
        })}
      </svg>
      <figcaption>
        {lines.map((line) => (
          <span key={line.key} className={`rank-chart__key rank-chart__key--${line.key}`}>
            {line.label}
          </span>
        ))}
        <small>
          {labels[0]} → {labels.at(-1)}
        </small>
      </figcaption>
    </figure>
  );
}

// ---------------------------------------------------------------- season review

function reviewCards(review) {
  const cards = ['record', 'gold', 'awards', 'moments', 'ranks'];
  if (review.broken?.length) cards.push('records');
  cards.push('reaction');
  return cards;
}

function AwardLine({ id, label, entry, detail }) {
  if (!entry) return null;
  return (
    <li className="award-line">
      <Asset id={AWARD_ASSET[id]} className="award-line__icon" alt="" />
      <span>
        <small>{label}</small>
        <strong>{entry.name}</strong>
        {detail ? <em>{detail}</em> : null}
      </span>
      <b className="num">{entry.score}</b>
    </li>
  );
}

function ReviewCard({ card, review }) {
  if (card === 'record') {
    return (
      <>
        <p className="season-card__eyebrow">The {review.year} season</p>
        <p className="season-card__headline num">
          {review.record.won}–{review.record.failed}
        </p>
        <p>Contracts won and failed</p>
        <ul className="season-card__facts">
          <li>
            Battles{' '}
            <b className="num">
              {review.record.battlesWon}–{review.record.battlesLost}
            </b>
          </li>
          <li>
            <Asset id="trophy.title" className="season-card__trophy" alt="" /> Titles <b className="num">{review.titles}</b>
          </li>
          <li>
            Best tournament finish <b>{review.bestFinish ? (review.bestFinish === 1 ? 'Champion' : `Top ${review.bestFinish}`) : '—'}</b>
          </li>
        </ul>
      </>
    );
  }
  if (card === 'gold') {
    const max = Math.max(review.earned, review.spent, 1);
    return (
      <>
        <p className="season-card__eyebrow">The ledger</p>
        <div className="season-ledger">
          <span>Earned</span>
          <i className="season-ledger__bar season-ledger__bar--earned" style={{ '--w': `${(review.earned / max) * 100}%` }} />
          <b className="num">{gold(review.earned)}</b>
          <span>Spent</span>
          <i className="season-ledger__bar season-ledger__bar--spent" style={{ '--w': `${(review.spent / max) * 100}%` }} />
          <b className="num">{gold(review.spent)}</b>
        </div>
        <ul className="season-card__facts season-card__facts--small">
          {Object.entries(review.spentBy || {})
            .sort((a, b) => b[1] - a[1])
            .map(([key, value]) => (
              <li key={key}>
                {SPEND_LABELS[key] || key} <b className="num">{gold(value)}</b>
              </li>
            ))}
        </ul>
        <p>
          Fame {signed(review.fame)} · Legacy {signed(review.legacy)} · {review.recruits} signed · {review.lost} lost
        </p>
      </>
    );
  }
  if (card === 'awards') {
    const mvpStats = review.mvp?.stats || {};
    return (
      <>
        <p className="season-card__eyebrow">Awards</p>
        {review.mvp || review.rookie || review.signing ? (
          <ul className="award-list">
            <AwardLine
              id="mvp"
              label="Most valuable"
              entry={review.mvp}
              detail={`${mvpStats.wins || 0} wins · ${mvpStats.kosDealt || 0} KOs · ${mvpStats.titles || 0} titles`}
            />
            <AwardLine id="rookie" label="Rookie of the year" entry={review.rookie} />
            <AwardLine id="signing" label="Best signing" entry={review.signing} />
          </ul>
        ) : (
          <p>No hero did enough this season to earn an award.</p>
        )}
        <small className="muted">Season score: wins, battles, KOs, titles, levels, damage, healing and gold earned.</small>
      </>
    );
  }
  if (card === 'moments') {
    return (
      <>
        <p className="season-card__eyebrow">Moments</p>
        <div className="season-moments">
          <article className="season-moment season-moment--good">
            <small>Biggest win</small>
            <strong>{review.big?.title || 'None this season'}</strong>
            {review.big?.detail ? <span>{review.big.detail}</span> : null}
          </article>
          <article className="season-moment season-moment--bad">
            <small>Worst defeat</small>
            <strong>{review.worst?.title || 'None this season'}</strong>
            {review.worst?.detail ? <span>{review.worst.detail}</span> : null}
          </article>
        </div>
      </>
    );
  }
  if (card === 'ranks') {
    const series = review.series || [];
    return (
      <>
        <p className="season-card__eyebrow">The ladders</p>
        <ul className="season-ranks">
          {LADDERS.map(([key, label]) => {
            const from = review.ranksStart?.[key];
            const to = review.ranksEnd?.[key];
            const moved = from && to ? from - to : 0;
            return (
              <li key={key}>
                <span>{label}</span>
                <b className="num">
                  #{from ?? '—'} → #{to ?? '—'}
                </b>
                <em className={moved > 0 ? 'is-up' : moved < 0 ? 'is-down' : ''}>{moved > 0 ? `▲${moved}` : moved < 0 ? `▼${-moved}` : '='}</em>
                <small>best #{review.best?.[key] ?? '—'}</small>
              </li>
            );
          })}
        </ul>
        {series.length > 1 ? (
          <RankChart
            labels={series.map((point) => `M${point.m + 1}`)}
            lines={LADDERS.map(([key, label]) => ({ key, label, values: series.map((point) => point[key]) }))}
          />
        ) : null}
      </>
    );
  }
  if (card === 'records') {
    return (
      <>
        <p className="season-card__eyebrow">Records broken</p>
        <ul className="season-card__records">
          {review.broken.map((item, index) => (
            <li key={`${item.key}-${index}`}>
              <Asset id="trophy.record" className="season-card__trophy" alt="" />
              <span>
                <strong>{item.label}</strong>
                <small>
                  {item.display} · {item.name} (was {item.previous})
                </small>
              </span>
            </li>
          ))}
        </ul>
      </>
    );
  }
  return (
    <>
      <p className="season-card__eyebrow">{review.reaction?.role}</p>
      <blockquote className="season-card__quote">“{review.reaction?.text}”</blockquote>
      <p>— {review.reaction?.speaker}</p>
    </>
  );
}

/** The end-of-year review as a sequence of cards. Skippable at any point. */
export function SeasonReview({ review, onClose }) {
  const [index, setIndex] = useState(0);
  if (!review) return null;
  const cards = reviewCards(review);
  const card = cards[Math.min(index, cards.length - 1)];
  const last = index >= cards.length - 1;
  return (
    <Modal open title={`The ${review.year} season`} eyebrow="Season review" onClose={onClose} width="medium" className="modal--season">
      <div className="season-review">
        <Asset id="bg.season.review" className="season-review__backdrop" alt="" />
        <article className={`season-card season-card--${card}`} key={card}>
          <ReviewCard card={card} review={review} />
        </article>
        <div className="season-review__dots" aria-label={`Card ${index + 1} of ${cards.length}`}>
          {cards.map((item, dot) => (
            <button key={item} className={dot === index ? 'is-current' : ''} aria-label={`Card ${dot + 1}`} onClick={() => setIndex(dot)} />
          ))}
        </div>
        <div className="season-review__actions">
          <Button size="sm" disabled={index === 0} onClick={() => setIndex(index - 1)}>
            ◀ Back
          </Button>
          {last ? null : (
            <Button size="sm" onClick={onClose}>
              Skip
            </Button>
          )}
          <Button variant="primary" onClick={() => (last ? onClose() : setIndex(index + 1))}>
            {last ? 'Close' : 'Next ▶'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/** Past season reviews, each re-openable. */
export function SeasonReviewList({ state }) {
  const [open, setOpen] = useState(null);
  const seasons = getSeasonList(state);
  return (
    <>
      {seasons.length ? (
        <div className="season-list" data-menu>
          {seasons.map((season) => (
            <button key={season.year} className="season-list__item" onClick={() => setOpen(season.year)}>
              <strong>{season.year}</strong>
              <span className="num">
                {season.record.won}–{season.record.failed}
              </span>
              <small>{season.mvp ? `MVP ${season.mvp}` : 'No MVP'}</small>
              <small className="num">
                S #{season.ranksEnd?.s ?? '—'} · L #{season.ranksEnd?.l ?? '—'} · O #{season.ranksEnd?.o ?? '—'}
              </small>
              <i>Review ›</i>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState icon="◷" title="No season has ended yet" text="The first review arrives when the year turns." />
      )}
      {open ? <SeasonReview review={getSeasonReview(state, open)} onClose={() => setOpen(null)} /> : null}
    </>
  );
}

export function SeasonReviewsPage({ state }) {
  return (
    <div className="screen screen--history">
      <header className="screen-heading">
        <div>
          <span className="eyebrow">One card sequence per year</span>
          <h1>Season reviews</h1>
          <p>Record, money, awards, best and worst moments, ladder movement and broken records for every finished year.</p>
        </div>
      </header>
      <SeasonReviewList state={state} />
    </div>
  );
}

// ---------------------------------------------------------------- record book

export function RecordBook({ state, actions }) {
  const book = useMemo(() => getRecordBook(state), [state]);
  return (
    <div className="record-book-view">
      <Panel title="Guild records" eyebrow="Best marks in the guild's history">
        <div className="table-scroll">
          <table className="history-table">
            <thead>
              <tr>
                <th>Record</th>
                <th>Value</th>
                <th>Year</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {book.guild.map((row) => (
                <tr key={row.key}>
                  <th scope="row">{row.label}</th>
                  <td className="num">{row.display}</td>
                  <td className="num">{row.record?.year || '—'}</td>
                  <td>{row.record?.detail || (row.record ? row.record.name : 'Not set yet')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title="Hero records" eyebrow="Held by anyone who ever served">
        <div className="table-scroll">
          <table className="history-table">
            <thead>
              <tr>
                <th>Record</th>
                <th>Value</th>
                <th>Holder</th>
                <th>Year</th>
              </tr>
            </thead>
            <tbody>
              {book.hero.map((row) => (
                <tr key={row.key}>
                  <th scope="row">{row.label}</th>
                  <td className="num">{row.display}</td>
                  <td>
                    {row.record?.heroId ? (
                      <button className="link-button" onClick={() => actions.openHero(row.record.heroId)}>
                        {row.record.name}
                      </button>
                    ) : (
                      row.record?.name || '—'
                    )}
                  </td>
                  <td className="num">{row.record?.year || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      {book.rivals.length ? (
        <Panel title="Against the best" eyebrow="How the record book compares" tone="dark">
          <ul className="insight-list">
            {book.rivals.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </Panel>
      ) : null}
      <Panel title="Past season reviews" eyebrow="Open any year again">
        <SeasonReviewList state={state} />
      </Panel>
    </div>
  );
}

// ---------------------------------------------------------------- hall of fame

export function HallOfFame({ state, actions }) {
  const entries = useMemo(() => getHallOfFame(state), [state]);
  return (
    <Panel title="Hall of fame" eyebrow="Retired and fallen heroes with an award, a record, or a career score of 60+">
      {entries.length ? (
        <div className="hof-grid" data-menu>
          {entries.map((entry) => (
            <button
              key={entry.hero.id}
              className={`hof-card ${entry.hero.status === 'dead' ? 'is-fallen' : ''}`}
              onClick={() => actions.openHero(entry.hero.id)}
            >
              <Asset id="trophy.hall" className="hof-card__plaque" alt="" />
              <HeroPortrait hero={entry.hero} size="md" showStatus={false} />
              <span className="hof-card__body">
                <strong>{entry.hero.name}</strong>
                <small>
                  {entry.hero.classId} · {entry.ending} · career score {entry.careerScore}
                </small>
                {entry.best ? (
                  <small>
                    Best season {entry.best.year}: {entry.best.wins || 0} wins, {entry.best.kosDealt || 0} KOs (score {entry.best.score})
                  </small>
                ) : null}
                <span className="hof-card__badges">
                  {entry.awards.map((award) => (
                    <Badge key={`${award.year}-${award.id}`} tone="gold">
                      {award.label} {award.year}
                    </Badge>
                  ))}
                  {entry.records.map((record) => (
                    <Badge key={record.label} tone="purple">
                      {record.label}
                    </Badge>
                  ))}
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="♛"
          title="The hall is empty"
          text="Heroes are inducted when they retire or fall with an award, a record, or a strong career behind them."
        />
      )}
    </Panel>
  );
}

// ---------------------------------------------------------------- mission log

export function MissionLog({ state, actions }) {
  const log = useMemo(() => getMissionLog(state), [state]);
  const [filters, setFilters] = useState({ year: 'All', family: 'All', location: 'All', outcome: 'All', hero: 'All' });
  const set = (key) => (event) => setFilters({ ...filters, [key]: event.target.value });
  const rows = log.entries.filter(
    (entry) =>
      (filters.year === 'All' || entry.year === Number(filters.year)) &&
      (filters.family === 'All' || entry.family === filters.family) &&
      (filters.location === 'All' || entry.locationId === filters.location) &&
      (filters.outcome === 'All' || entry.outcome === filters.outcome) &&
      (filters.hero === 'All' || entry.heroIds.includes(filters.hero)),
  );
  return (
    <div className="screen screen--history">
      <header className="screen-heading">
        <div>
          <span className="eyebrow">Every contract, boss fight and tournament run</span>
          <h1>Mission log</h1>
          <p>Tap an entry to open its full report.</p>
        </div>
        <div className="heading-metrics">
          <Badge tone="blue">{log.entries.length} entries</Badge>
        </div>
      </header>
      <div className="filter-bar">
        <label>
          Year
          <select value={filters.year} onChange={set('year')}>
            <option>All</option>
            {log.years.map((year) => (
              <option key={year}>{year}</option>
            ))}
          </select>
        </label>
        <label>
          Type
          <select value={filters.family} onChange={set('family')}>
            <option>All</option>
            {log.families.map((family) => (
              <option key={family}>{family}</option>
            ))}
          </select>
        </label>
        <label>
          Place
          <select value={filters.location} onChange={set('location')}>
            <option value="All">All</option>
            {log.locations.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Outcome
          <select value={filters.outcome} onChange={set('outcome')}>
            <option value="All">All</option>
            <option value="won">Won</option>
            <option value="failed">Failed</option>
          </select>
        </label>
        <label>
          Hero
          <select value={filters.hero} onChange={set('hero')}>
            <option value="All">All</option>
            {log.heroes.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {rows.length ? (
        <div className="table-scroll">
          <table className="history-table history-table--log">
            <thead>
              <tr>
                <th>Date</th>
                <th>Entry</th>
                <th>Type</th>
                <th>Place</th>
                <th>Result</th>
                <th>Heroes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((entry) => (
                <tr key={entry.id} className={`is-${entry.outcome}`}>
                  <td className="num">
                    {entry.year}·{(entry.month ?? 0) + 1}
                  </td>
                  <th scope="row">
                    {entry.report ? (
                      <button className="link-button" onClick={() => actions.openReport(entry.report)}>
                        {entry.title} ›
                      </button>
                    ) : (
                      entry.title
                    )}
                  </th>
                  <td>{entry.family}</td>
                  <td>{entry.locationName}</td>
                  <td>
                    <Badge tone={entry.outcome === 'won' ? 'green' : 'red'}>{entry.grade}</Badge>
                  </td>
                  <td>{entry.heroes.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon="⌖"
          title={log.entries.length ? 'No entry matches' : 'Nothing logged yet'}
          text={log.entries.length ? 'Change the filters.' : 'Finish a contract and it is logged here for good.'}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------- ladders and rivals

/** Herald → Guild ladders: season-by-season history, best ever and the gap to the next guild. */
export function LadderHistoryPanel({ state }) {
  const ladders = useMemo(() => getLadderHistory(state), [state]);
  const years = [...new Set(ladders.flatMap((ladder) => ladder.seasons.map((row) => row.year)))].sort((a, b) => a - b);
  const keyOf = { strength: 's', legacy: 'l', official: 'o' };
  return (
    <Panel title="Season by season" eyebrow="Rank at the end of each year (this year so far)">
      <ul className="ladder-history">
        {ladders.map((ladder) => (
          <li key={ladder.ladder}>
            <strong>{ladder.ladder[0].toUpperCase() + ladder.ladder.slice(1)}</strong>
            <span className="num">
              now #{ladder.current.rank}/{ladder.current.total}
            </span>
            <span className="num">best ever #{ladder.best}</span>
            <small>
              {ladder.toPass ? `${ladder.toPass.gap.toLocaleString()} to pass ${ladder.toPass.name} (#${ladder.toPass.rank})` : 'Leading this ladder'}
            </small>
          </li>
        ))}
      </ul>
      {years.length > 1 ? (
        <RankChart
          labels={years.map(String)}
          lines={ladders.map((ladder) => ({
            key: keyOf[ladder.ladder],
            label: ladder.ladder[0].toUpperCase() + ladder.ladder.slice(1),
            values: years.map((year) => ladder.seasons.find((row) => row.year === year)?.end ?? null),
          }))}
        />
      ) : (
        <p className="muted">The chart fills in as seasons pass.</p>
      )}
    </Panel>
  );
}

/** Head-to-head with any rival guild: rivalry numbers and each season's ranks side by side. */
export function HeadToHeadPanel({ state, rivalId }) {
  const view = useMemo(() => getHeadToHead(state, rivalId), [state, rivalId]);
  if (!view) return null;
  return (
    <Panel title={`${state.guild.name} vs ${view.rival.name}`} eyebrow={view.nemesis ? 'Head to head · nemesis' : 'Head to head'}>
      <div className="table-scroll">
        <table className="history-table">
          <thead>
            <tr>
              <th />
              <th>{state.guild.name}</th>
              <th>{view.rival.name}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Strength rank now</th>
              <td className="num">#{view.now.ours.s ?? '—'}</td>
              <td className="num">#{view.now.theirs.s ?? '—'}</td>
            </tr>
            <tr>
              <th scope="row">Official rank now</th>
              <td className="num">#{view.now.ours.o ?? '—'}</td>
              <td className="num">#{view.now.theirs.o ?? '—'}</td>
            </tr>
            <tr>
              <th scope="row">Titles</th>
              <td className="num">{view.titles.ours}</td>
              <td className="num">{view.titles.theirs}</td>
            </tr>
            <tr>
              <th scope="row">Bouts won</th>
              <td className="num">{view.rivalry.boutsWon}</td>
              <td className="num">{view.rivalry.boutsLost}</td>
            </tr>
            <tr>
              <th scope="row">Challenges won</th>
              <td className="num">{view.rivalry.challengesWon}</td>
              <td className="num">{view.rivalry.challengesLost}</td>
            </tr>
            {view.seasons.map((season) => (
              <tr key={season.year}>
                <th scope="row">{season.year} final ranks (S / O)</th>
                <td className="num">
                  #{season.ours.s ?? '—'} / #{season.ours.o ?? '—'}
                </td>
                <td className="num">
                  #{season.theirs.s ?? '—'} / #{season.theirs.o ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!view.seasons.length ? <p className="muted">Season rows appear after the first year ends.</p> : null}
    </Panel>
  );
}

// ---------------------------------------------------------------- hero career tab

const CAREER_COLUMNS = [
  ['missions', 'Missions'],
  ['wins', 'Wins'],
  ['battles', 'Battles'],
  ['kosDealt', 'KOs'],
  ['kosTaken', 'KO’d'],
  ['damage', 'Damage'],
  ['healing', 'Healing'],
  ['bouts', 'Bouts'],
  ['titles', 'Titles'],
  ['injuries', 'Injuries'],
  ['levels', 'Levels'],
  ['gold', 'Gold'],
];

export function CareerTab({ state, hero, actions }) {
  const career = useMemo(() => getHeroCareer(state, hero.id), [state, hero.id]);
  return (
    <div className="career-tab">
      <section>
        <h3>By season</h3>
        {career.years.length ? (
          <div className="table-scroll">
            <table className="history-table history-table--career">
              <thead>
                <tr>
                  <th>Year</th>
                  {CAREER_COLUMNS.map(([key, label]) => (
                    <th key={key}>{label}</th>
                  ))}
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {career.years.map((row) => (
                  <tr key={row.year}>
                    <th scope="row">{row.year}</th>
                    {CAREER_COLUMNS.map(([key]) => (
                      <td key={key} className="num">
                        {(row[key] || 0).toLocaleString()}
                      </td>
                    ))}
                    <td className="num">{row.score}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">Career</th>
                  {CAREER_COLUMNS.map(([key]) => (
                    <td key={key} className="num">
                      {(career.total[key] || 0).toLocaleString()}
                    </td>
                  ))}
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <p className="muted">
            No season stats with your guild. Career so far: {hero.career?.missions || 0} missions ({hero.career?.wins || 0} wins), {hero.career?.titles || 0}{' '}
            titles, {hero.career?.tournamentBoutWins || 0}/{hero.career?.tournamentBouts || 0} bouts won.
          </p>
        )}
      </section>

      {career.awards.length || career.records.length ? (
        <section>
          <h3>Awards and records</h3>
          <ul className="award-list award-list--compact">
            {career.awards.map((award) => (
              <li key={`${award.year}-${award.id}`} className="award-line">
                <Asset id={AWARD_ASSET[award.id] || 'trophy.title'} className="award-line__icon" alt="" />
                <span>
                  <strong>{award.label}</strong>
                  <small>{award.year}</small>
                </span>
              </li>
            ))}
            {career.records.map((record) => (
              <li key={record.label} className="award-line">
                <Asset id="trophy.record" className="award-line__icon" alt="" />
                <span>
                  <strong>{record.label}</strong>
                  <small>
                    {record.display} · {record.year}
                  </small>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {career.contracts.length ? (
        <section>
          <h3>Contracts</h3>
          <ul className="career-contracts" data-menu>
            {career.contracts.map((record) => (
              <li key={record.id}>
                <button className="link-button" onClick={() => actions.openReport({ kind: 'mission', id: record.id })}>
                  {record.completedDate || record.completedYear} · {record.title}{' '}
                  <Badge tone={['Defeat', 'Catastrophic'].includes(record.grade) ? 'red' : 'green'}>{record.grade}</Badge>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h3>Timeline</h3>
        <div className="hero-history">
          {career.timeline.length ? (
            career.timeline.map((event, row) => (
              <article key={`${event.date}-${row}`}>
                <time>{event.date}</time>
                <div>
                  <strong>{event.title}</strong>
                  <p>{event.text}</p>
                </div>
              </article>
            ))
          ) : (
            <p className="muted">No key moments recorded.</p>
          )}
        </div>
      </section>
    </div>
  );
}
