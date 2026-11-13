import React from 'react';
import { getArenaRoll, getGazette, getGuildRecord, getTaleOfTape } from '../game/engine.js';

// The sports desk (docs/design/PILLARS.md, Pillar 2): the tournament circuit told like a medieval
// sports broadsheet. Ink on parchment, a masthead, ruled columns and tables. Read models in
// src/game/engine/seasons.js (and getTaleOfTape in tournamentEntry.js).

function Form({ form }) {
  if (!form.length) return <span className="sheet-form sheet-form--none">no bouts yet</span>;
  return (
    <span className="sheet-form" aria-label={`Last bouts: ${form.join(' ')}`}>
      {form.map((result, index) => (
        <b key={index} className={result === 'W' ? 'is-win' : 'is-loss'}>
          {result}
        </b>
      ))}
    </span>
  );
}

/** Records → Gazette: this month's issue. */
export function Gazette({ state }) {
  const issue = getGazette(state);
  return (
    <article className="broadsheet">
      <header className="broadsheet__masthead">
        <small>Issue {issue.issue} · {issue.date} · one copper</small>
        <h2>The Herald’s Gazette</h2>
        <small>Results, rumours and the ladder, from every ring in the realm</small>
      </header>
      <h3 className="broadsheet__headline">{issue.headline}</h3>
      <p className="broadsheet__lead">{issue.lead}</p>
      <div className="broadsheet__columns">
        <section>
          <h4>The standings</h4>
          <table className="sheet-table">
            <tbody>
              {issue.standings.map((row) => (
                <tr key={row.id} className={row.player ? 'is-you' : ''}>
                  <td className="num">{row.rank}</td>
                  <td>{row.name}</td>
                  <td className="num">{row.points} pts</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section>
          <h4>Form guide</h4>
          {issue.form.map((row) => (
            <p key={row.name} className="sheet-line">
              <span>
                {row.name}
                {row.rival ? <em> (your great rival)</em> : null}
              </span>
              <Form form={row.form} />
            </p>
          ))}
          <h4>Your season</h4>
          <p>{issue.yours}</p>
          {issue.lastYours ? <p className="sheet-small">Last time out: {issue.lastYours}</p> : null}
        </section>
        <section>
          <h4>Coming up</h4>
          {issue.upcoming.length ? (
            <ul className="sheet-list">
              {issue.upcoming.map((event) => (
                <li key={event.id}>
                  <strong>{event.name}</strong>
                  <small>
                    {event.where} · {event.when} · {event.circuit}
                  </small>
                </li>
              ))}
            </ul>
          ) : (
            <p>No more tournaments this year.</p>
          )}
        </section>
      </div>
    </article>
  );
}

/** Guild → Record: the guild's line by year, its totals, and who it beats and who beats it. */
export function GuildRecord({ state }) {
  const record = getGuildRecord(state);
  const best = [...record.opponents].sort((a, b) => b.won - b.lost - (a.won - a.lost))[0];
  const worst = [...record.opponents].sort((a, b) => b.lost - b.won - (a.lost - a.won))[0];
  return (
    <article className="broadsheet">
      <header className="broadsheet__masthead broadsheet__masthead--small">
        <h2>{state.guild.name}: the record</h2>
        <small>Every tournament, every bout, as the heralds wrote them down</small>
      </header>
      {record.years.length ? (
        <>
          <table className="sheet-table sheet-table--record">
            <thead>
              <tr>
                <th>Year</th>
                <th>Tournaments</th>
                <th>Bouts</th>
                <th>Won</th>
                <th>%</th>
                <th>Titles</th>
                <th>Best</th>
              </tr>
            </thead>
            <tbody>
              {record.years.map((row) => (
                <tr key={row.year}>
                  <td className="num">{row.year}</td>
                  <td className="num">{row.entries}</td>
                  <td className="num">{row.bouts}</td>
                  <td className="num">{row.won}</td>
                  <td className="num">{row.pct}%</td>
                  <td className="num">{row.titles}</td>
                  <td>{row.best}</td>
                </tr>
              ))}
              <tr className="is-total">
                <td>All</td>
                <td className="num">{record.totals.entries}</td>
                <td className="num">{record.totals.bouts}</td>
                <td className="num">{record.totals.won}</td>
                <td className="num">{record.totals.pct}%</td>
                <td className="num">{record.totals.titles}</td>
                <td>{record.totals.finals} final{record.totals.finals === 1 ? '' : 's'}</td>
              </tr>
            </tbody>
          </table>
          <div className="broadsheet__columns">
            <section>
              <h4>Head to head</h4>
              <ul className="sheet-list">
                {record.opponents.slice(0, 8).map((row) => (
                  <li key={row.id}>
                    <strong>{row.name}</strong>
                    <small className="num">
                      {row.won}–{row.lost}
                    </small>
                  </li>
                ))}
              </ul>
            </section>
            <section>
              {best ? (
                <p>
                  <strong>Easiest meat:</strong> {best.name} ({best.won}–{best.lost})
                </p>
              ) : null}
              {worst && worst.lost > worst.won ? (
                <p>
                  <strong>The bogey team:</strong> {worst.name} ({worst.won}–{worst.lost})
                </p>
              ) : null}
            </section>
          </div>
        </>
      ) : (
        <p className="broadsheet__lead">The heralds have nothing on {state.guild.name} yet. Sign up for a tournament at any arena.</p>
      )}
    </article>
  );
}

/** At an arena: the roll of champions for each event held there, and the guild's finishes there. */
export function RollOfChampions({ state, locationId }) {
  const rolls = getArenaRoll(state, locationId);
  if (!rolls.length) return <p className="muted">No tournaments are held in this arena.</p>;
  return (
    <>
      {rolls.map((roll) => (
        <article key={roll.definition.id} className="broadsheet broadsheet--roll">
          <header className="broadsheet__masthead broadsheet__masthead--small">
            <h2>{roll.definition.name}</h2>
            <small>
              The roll of champions · {roll.definition.circuit} · {roll.definition.trophy}
            </small>
          </header>
          <div className="broadsheet__columns">
            <section>
              <h4>Champions by year</h4>
              <ul className="sheet-list">
                {roll.winners.map((winner, index) => (
                  <li key={`${winner.year}-${index}`} className={winner.player ? 'is-you' : ''}>
                    <span className="num">{winner.year}</span> {winner.vacated ? <s>{winner.struck || winner.guildName}</s> : winner.guildName}
                    {winner.vacated ? <small> (vacated)</small> : null}
                  </li>
                ))}
                {!roll.winners.length ? <li>No champions recorded yet.</li> : null}
              </ul>
            </section>
            <section>
              <h4>Most titles</h4>
              <p>{roll.mostTitles ? `${roll.mostTitles.name} (${roll.mostTitles.titles})` : roll.recordHolder ? `${roll.recordHolder.name} (${roll.recordHolder.wins})` : 'Nobody twice, yet.'}</p>
              <h4>You here</h4>
              {roll.you.length ? (
                <ul className="sheet-list">
                  {roll.you.map((row) => (
                    <li key={row.year}>
                      <span className="num">{row.year}</span> {row.finish}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>The guild has never fought here.</p>
              )}
              {roll.yourRecord ? (
                <p className="sheet-small">
                  Bouts here: {roll.yourRecord.won}–{roll.yourRecord.bouts - roll.yourRecord.won} · titles {roll.yourRecord.titles}
                </p>
              ) : null}
            </section>
          </div>
        </article>
      ))}
    </>
  );
}

/** Before a bout: the tale of the tape. */
export function TaleOfTape({ state, tournamentId }) {
  const tape = getTaleOfTape(state, tournamentId);
  if (!tape) return null;
  const team = (list) =>
    list.map((hero) => (
      <li key={hero.name}>
        <strong>{hero.name}</strong>
        <small>
          Lv {hero.level} {hero.classId} · {hero.primal}
        </small>
      </li>
    ));
  return (
    <article className="broadsheet broadsheet--tape">
      <header className="broadsheet__masthead broadsheet__masthead--small">
        <h2>The tale of the tape</h2>
        <small>
          {state.guild.name} against {tape.opponent.name}
          {tape.opponent.creed && tape.opponent.creed !== 'neutral' ? ` (${tape.opponent.creed})` : ''}
        </small>
      </header>
      <div className="broadsheet__columns broadsheet__columns--two">
        <section>
          <h4>{state.guild.name}</h4>
          <ul className="sheet-list">{team(tape.mine)}</ul>
          <p className="sheet-line">
            <span>Form</span> <Form form={tape.form.mine} />
          </p>
        </section>
        <section>
          <h4>{tape.opponent.name}</h4>
          <ul className="sheet-list">{team(tape.theirs)}</ul>
          <p className="sheet-line">
            <span>Form</span> <Form form={tape.form.theirs} />
          </p>
        </section>
      </div>
      <p className="sheet-small">
        Meetings: {tape.meetings.won}–{tape.meetings.lost} · The bookmakers say {tape.odds}.
      </p>
    </article>
  );
}
