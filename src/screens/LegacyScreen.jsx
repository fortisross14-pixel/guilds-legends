import React, { useMemo, useState } from 'react';
import { normalizeClassId } from '../data/content.js';
import { LOCATION_BY_ID } from '../data/world.js';
import { ambitionMetric, BRANCH_RULES } from '../game/legacy.js';
import { branchCapacity, getGuildmaster } from '../game/engine.js';
import { Badge, Button, EmptyState, HeroPortrait, Panel, ProgressBar, Tabs } from '../components/UI.jsx';

export default function LegacyScreen({ state, actions, navigate }) {
  const [tab, setTab] = useState('succession');
  const [branchLocationId, setBranchLocationId] = useState('');
  const [branchCommanderId, setBranchCommanderId] = useState('');
  const [mentorId, setMentorId] = useState('');
  const [apprenticeId, setApprenticeId] = useState('');
  const guildmaster = getGuildmaster(state);
  const successor = state.guild.successorHeroId ? state.heroes.find((hero) => hero.id === state.guild.successorHeroId) : null;
  const activeHeroes = state.heroes.filter((hero) => !['dead', 'retired'].includes(hero.status));
  const allBranches = state.guild.branches || [];
  const branches = allBranches.filter((branch) => branch.active !== false);
  const inactiveBranches = allBranches.filter((branch) => branch.active === false);
  const cap = branchCapacity(state);
  const eligibleBranchLocations = (state.world.visitedLocationIds || [])
    .filter((id) => id !== state.world.currentLocationId)
    .filter((id) => !allBranches.some((branch) => branch.locationId === id))
    .map((id) => LOCATION_BY_ID[id])
    .filter(Boolean);
  const inherited = (state.legacy?.inheritedAmbitions || []).filter((item) => item.status === 'unclaimed');
  const ambitions = useMemo(
    () => activeHeroes.flatMap((hero) => (hero.ambitions || []).map((ambition) => ({ hero, ambition, progress: ambitionMetric(hero, ambition) }))),
    [activeHeroes],
  );

  return (
    <div className="screen screen--legacy">
      <header className="screen-heading">
        <div>
          <span className="eyebrow">The guild must outlive its founder</span>
          <h1>Legacy & Succession</h1>
          <p>Branches, heirs, mentors, artifacts and inherited ambitions turn individual careers into an institution that can survive for centuries.</p>
        </div>
        <div className="heading-metrics">
          <Badge tone="purple">{state.stats.successions || 0} successions</Badge>
          <Badge tone="blue">
            {branches.length}/{cap || 0} branches
          </Badge>
          <Badge tone="gold">{state.artifacts.length} artifacts</Badge>
        </div>
      </header>

      <Tabs
        active={tab}
        onChange={setTab}
        items={[
          { id: 'succession', label: 'Succession', icon: '♛' },
          { id: 'branches', label: 'Branches', icon: '⌂' },
          { id: 'lineage', label: 'Mentors & ambitions', icon: '◇' },
          { id: 'artifacts', label: 'Artifacts', icon: '✦' },
          { id: 'world', label: 'Rival institutions', icon: '◉' },
        ]}
      />

      {tab === 'succession' ? (
        <div className="legacy-grid legacy-grid--succession">
          <Panel title="Current guildmaster" eyebrow="The living face of the institution">
            {guildmaster ? (
              <div className="legacy-leader">
                <HeroPortrait hero={guildmaster} size="lg" />
                <div>
                  <h2>{guildmaster.name}</h2>
                  <p>
                    Level {guildmaster.level} {guildmaster.rarity} {normalizeClassId(guildmaster.classId)} · Age {guildmaster.age}
                  </p>
                  <div className="tag-row">
                    <Badge tone="gold">{guildmaster.id === state.guild.founderHeroId ? 'Founder' : 'Successor'}</Badge>
                    <Badge>{guildmaster.career.leadershipYears || 0} years leading</Badge>
                    <Badge tone="purple">{guildmaster.legacy} legacy</Badge>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                icon="♛"
                title="No active guildmaster"
                text="The council will select the strongest viable successor when the next state update resolves."
              />
            )}
          </Panel>
          <Panel title="Designated successor" eyebrow={state.guild.tierIndex < 1 ? 'Unlocks at National status' : 'Plan before the crisis'}>
            {state.guild.tierIndex < 1 ? (
              <EmptyState
                icon="⌛"
                title="The guild is still personal"
                text="At Regional scale the founder is the institution. Reach National status to formalize succession."
              />
            ) : (
              <>
                {successor ? (
                  <div className="successor-card">
                    <HeroPortrait hero={successor} size="md" />
                    <div>
                      <strong>{successor.name}</strong>
                      <p>
                        Lv {successor.level} · Presence {successor.attributes?.Presence || 0} · Loyalty {successor.loyalty}
                      </p>
                    </div>
                    <Badge tone="green">Designated</Badge>
                  </div>
                ) : (
                  <p className="muted">
                    No heir is designated. If the guildmaster retires or dies, the council will select a leader based on presence, loyalty, legacy and
                    experience.
                  </p>
                )}
                <label className="legacy-select">
                  Choose successor
                  <select value={successor?.id || ''} onChange={(event) => event.target.value && actions.designateSuccessor(event.target.value)}>
                    <option value="">— Select an heir —</option>
                    {activeHeroes
                      .filter((hero) => hero.id !== guildmaster?.id && hero.age >= 20)
                      .sort((a, b) => b.attributes.Presence - a.attributes.Presence)
                      .map((hero) => (
                        <option key={hero.id} value={hero.id}>
                          {hero.name} · Lv {hero.level} · Presence {hero.attributes.Presence} · Loyalty {hero.loyalty}
                        </option>
                      ))}
                  </select>
                </label>
              </>
            )}
          </Panel>
          <Panel title="Lines of succession" eyebrow="Every era is preserved">
            {(state.legacy?.successionHistory || []).length ? (
              <div className="succession-history">
                {state.legacy.successionHistory.map((entry, index) => (
                  <article key={`${entry.year}-${entry.toHeroId}-${index}`}>
                    <span>{entry.year}</span>
                    <div>
                      <strong>{entry.toName}</strong>
                      <small>followed {entry.fromName}</small>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState icon="▤" title="The founding era continues" text="The first succession will create the second named era of the guild." />
            )}
          </Panel>
        </div>
      ) : null}

      {tab === 'branches' ? (
        <div className="legacy-grid">
          <Panel title="Institutional reach" eyebrow="Permanent chapters">
            {cap === 0 ? (
              <EmptyState
                icon="⌂"
                title="Branches unlock at National status"
                text="Regional guilds still travel as one institution. National status supports one permanent chapter; Global status supports three."
                action={<Button onClick={() => navigate('goals')}>View promotion path</Button>}
              />
            ) : (
              <>
                <ProgressBar value={branches.length} max={cap} label="Active branches" tone={branches.length >= cap ? 'gold' : 'blue'} />
                <p className="muted">
                  A branch makes its settlement operational even while headquarters is elsewhere: you may accept local contracts and recruit there without
                  moving the entire guild.
                </p>
                {branches.map((branch) => {
                  const commander = state.heroes.find((hero) => hero.id === branch.commanderHeroId);
                  const location = LOCATION_BY_ID[branch.locationId];
                  return (
                    <article className="branch-card" key={branch.id}>
                      <div className="branch-card__seal">{location?.icon || '⌂'}</div>
                      <div>
                        <small>
                          Level {branch.level} chapter · founded {branch.foundedYear}
                        </small>
                        <h3>{branch.name}</h3>
                        <p>
                          {commander?.name || 'No commander'} · {location?.name}
                        </p>
                        <div className="tag-row">
                          <Badge tone="green">
                            {branch.incomeLastMonth >= 0 ? '+' : ''}
                            {branch.incomeLastMonth || 0} gold last month
                          </Badge>
                          <Badge>{branch.fame || 0} local fame</Badge>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => actions.upgradeBranch(branch.id)} disabled={branch.level >= 3}>
                        {branch.level >= 3 ? 'Max level' : 'Upgrade branch'}
                      </Button>
                    </article>
                  );
                })}
                {inactiveBranches.length ? (
                  <div className="inactive-branches">
                    <span className="eyebrow">Dormant chapters</span>
                    {inactiveBranches.map((branch) => {
                      const location = LOCATION_BY_ID[branch.locationId];
                      return (
                        <article className="branch-card is-inactive" key={branch.id}>
                          <div className="branch-card__seal">{location?.icon || '⌂'}</div>
                          <div>
                            <small>Level {branch.level} chapter · dormant</small>
                            <h3>{branch.name}</h3>
                            <p>{location?.name} is no longer operational until a new commander takes the post.</p>
                          </div>
                          <label className="branch-reassign">
                            New commander
                            <select defaultValue="" onChange={(event) => event.target.value && actions.assignBranchCommander(branch.id, event.target.value)}>
                              <option value="">Choose…</option>
                              {activeHeroes
                                .filter((hero) => hero.status === 'available' && !hero.branchId)
                                .sort((a, b) => b.level - a.level)
                                .map((hero) => (
                                  <option key={hero.id} value={hero.id}>
                                    {hero.name} · Lv {hero.level}
                                  </option>
                                ))}
                            </select>
                          </label>
                        </article>
                      );
                    })}
                  </div>
                ) : null}
              </>
            )}
          </Panel>
          {cap > 0 ? (
            <Panel title="Found a new branch" eyebrow={`${branches.length}/${cap} chapter slots used`}>
              {branches.length >= cap ? (
                <EmptyState icon="⌂" title="Branch capacity reached" text="Reach a higher social tier or develop the chapters you already control." />
              ) : (
                <div className="branch-founder">
                  <label>
                    Visited settlement
                    <select value={branchLocationId} onChange={(event) => setBranchLocationId(event.target.value)}>
                      <option value="">— Choose location —</option>
                      {eligibleBranchLocations.map((location) => (
                        <option key={location.id} value={location.id}>
                          {location.name} · {location.primal}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Branch commander
                    <select value={branchCommanderId} onChange={(event) => setBranchCommanderId(event.target.value)}>
                      <option value="">— Choose commander —</option>
                      {activeHeroes
                        .filter((hero) => hero.status === 'available' && !hero.branchId)
                        .sort((a, b) => b.level - a.level)
                        .map((hero) => (
                          <option key={hero.id} value={hero.id}>
                            {hero.name} · Lv {hero.level} · Loyalty {hero.loyalty}
                          </option>
                        ))}
                    </select>
                  </label>
                  <div className="legacy-cost">
                    <span>Founding budget</span>
                    <strong>{state.guild.tierIndex >= 2 ? BRANCH_RULES.Global.cost : BRANCH_RULES.National.cost} crowns</strong>
                  </div>
                  <Button
                    variant="primary"
                    disabled={!branchLocationId || !branchCommanderId}
                    onClick={() => actions.foundBranch(branchLocationId, branchCommanderId)}
                  >
                    Establish chapter
                  </Button>
                </div>
              )}
            </Panel>
          ) : null}
        </div>
      ) : null}

      {tab === 'lineage' ? (
        <div className="legacy-grid">
          <Panel title="Mentorship" eyebrow="Knowledge should have a lineage">
            <div className="mentor-form">
              <label>
                Mentor
                <select value={mentorId} onChange={(event) => setMentorId(event.target.value)}>
                  <option value="">— Veteran —</option>
                  {activeHeroes
                    .sort((a, b) => b.level - a.level)
                    .map((hero) => (
                      <option key={hero.id} value={hero.id}>
                        {hero.name} · Lv {hero.level} · Age {hero.age}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Apprentice
                <select value={apprenticeId} onChange={(event) => setApprenticeId(event.target.value)}>
                  <option value="">— Developing hero —</option>
                  {activeHeroes
                    .filter((hero) => hero.id !== mentorId)
                    .sort((a, b) => a.level - b.level)
                    .map((hero) => (
                      <option key={hero.id} value={hero.id}>
                        {hero.name} · Lv {hero.level} · Age {hero.age}
                      </option>
                    ))}
                </select>
              </label>
              <Button variant="primary" disabled={!mentorId || !apprenticeId} onClick={() => actions.assignMentor(mentorId, apprenticeId)}>
                Create mentorship
              </Button>
            </div>
            <div className="lineage-list">
              {activeHeroes
                .filter((hero) => hero.mentorId)
                .map((hero) => {
                  const mentor = state.heroes.find((item) => item.id === hero.mentorId);
                  return (
                    <article key={hero.id}>
                      <HeroPortrait hero={hero} size="xs" />
                      <div>
                        <strong>{hero.name}</strong>
                        <small>apprentice of {mentor?.name || 'an archived mentor'}</small>
                      </div>
                      <Badge tone="blue">training bonus</Badge>
                    </article>
                  );
                })}
            </div>
          </Panel>
          <Panel title="Living ambitions" eyebrow="Private dreams become public records">
            <div className="ambition-list">
              {ambitions.map(({ hero, ambition, progress }) => (
                <article key={ambition.id} className={ambition.status === 'completed' ? 'is-complete' : ''}>
                  <HeroPortrait hero={hero} size="xs" />
                  <div>
                    <strong>{hero.name}</strong>
                    <p>{ambition.label}</p>
                    <ProgressBar
                      value={Math.min(progress, ambition.target)}
                      max={ambition.target}
                      compact
                      tone={ambition.status === 'completed' ? 'green' : 'purple'}
                    />
                  </div>
                  <span>
                    {Math.min(progress, ambition.target)}/{ambition.target}
                  </span>
                </article>
              ))}
            </div>
          </Panel>
          <Panel title="Inherited wills" eyebrow="Unfinished dreams do not have to die">
            {inherited.length ? (
              <div className="inherited-list">
                {inherited.map((record) => (
                  <article key={record.id}>
                    <div>
                      <strong>{record.fromHeroName}</strong>
                      <p>{record.ambition.label}</p>
                      <small>Left unfinished in {record.createdYear}</small>
                    </div>
                    <label>
                      Pass to
                      <select defaultValue="" onChange={(event) => event.target.value && actions.inheritAmbition(record.id, event.target.value)}>
                        <option value="">Choose heir…</option>
                        {activeHeroes.map((hero) => (
                          <option key={hero.id} value={hero.id}>
                            {hero.name} · Lv {hero.level}
                          </option>
                        ))}
                      </select>
                    </label>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                icon="◇"
                title="No unfinished will is waiting"
                text="When important heroes retire or die before fulfilling an ambition, another generation may take it up."
              />
            )}
          </Panel>
        </div>
      ) : null}

      {tab === 'artifacts' ? (
        <Panel title="The guild collection" eyebrow="Objects accumulate biographies too">
          {state.artifacts.length ? (
            <div className="artifact-grid">
              {state.artifacts.map((artifact) => {
                const owner = artifact.ownerId ? state.heroes.find((hero) => hero.id === artifact.ownerId) : null;
                return (
                  <article key={artifact.id}>
                    <div className="artifact-glyph">✦</div>
                    <div>
                      <small>
                        {artifact.prestige} prestige · discovered {artifact.discoveredYear}
                      </small>
                      <h3>{artifact.name}</h3>
                      <p>{artifact.legend}</p>
                      <Badge tone="purple">{artifact.effect?.label || 'Historic artifact'}</Badge>
                      <div className="artifact-owner">
                        <span>Bearer</span>
                        <strong>{owner?.name || 'Guild Vault'}</strong>
                      </div>
                      <label>
                        Assign
                        <select value={owner?.id || ''} onChange={(event) => actions.assignArtifact(artifact.id, event.target.value || null)}>
                          <option value="">Guild Vault</option>
                          {activeHeroes.map((hero) => (
                            <option key={hero.id} value={hero.id}>
                              {hero.name} · Lv {hero.level}
                            </option>
                          ))}
                        </select>
                      </label>
                      {artifact.ownerHistory?.length ? (
                        <details>
                          <summary>Ownership history</summary>
                          {artifact.ownerHistory.slice(0, 8).map((entry, index) => (
                            <p key={`${entry.year}-${index}`}>
                              {entry.year}: {entry.heroName} · {entry.action}
                            </p>
                          ))}
                        </details>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon="✦"
              title="The vault is empty"
              text="Legendary and Great Success expeditions can recover artifacts with permanent histories and small field bonuses."
              action={<Button onClick={() => navigate('missions')}>Find an artifact mission</Button>}
            />
          )}
        </Panel>
      ) : null}

      {tab === 'world' ? (
        <div className="legacy-grid">
          <Panel title="Institutional shocks" eyebrow="The world changes banners too">
            {(state.legacy?.rivalInstitutionEvents || []).length ? (
              <div className="institution-events">
                {state.legacy.rivalInstitutionEvents.slice(0, 20).map((event, index) => (
                  <article key={`${event.year}-${event.type}-${index}`}>
                    <span>{event.year}</span>
                    <Badge tone={event.type === 'split' ? 'purple' : 'gold'}>{event.type}</Badge>
                    <p>{event.type === 'split' ? 'A rival faction founded a new guild.' : 'An established hero was poached by a rival institution.'}</p>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                icon="◉"
                title="No institutional shock yet"
                text="Over long campaigns, rival guilds can poach talent and occasionally split into successor institutions."
              />
            )}
          </Panel>
          <Panel title="What Phase 4 changes" eyebrow="Century-scale play" tone="dark">
            <ul className="insight-list">
              <li>Your guildmaster can retire or die without ending the campaign.</li>
              <li>National and Global branches keep distant regions operational.</li>
              <li>Mentors accelerate apprentices and create named lineages.</li>
              <li>Unfinished ambitions can pass to the next generation for extra legacy.</li>
              <li>Artifacts return to the vault on retirement/death and can be reassigned.</li>
              <li>Rival guilds now poach stars and sometimes split under new banners.</li>
            </ul>
          </Panel>
        </div>
      ) : null}
    </div>
  );
}
