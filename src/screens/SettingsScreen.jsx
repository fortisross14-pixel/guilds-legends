import React, { useEffect, useRef, useState } from 'react';
import { Badge, Button, Panel } from '../components/UI.jsx';

export default function SettingsScreen({ state, actions, slot }) {
  const fileRef = useRef(null);
  const [importText, setImportText] = useState('');
  const founder = state.heroes.find((hero) => hero.id === state.guild.founderHeroId);
  const [guildName, setGuildName] = useState(state.guild.name);
  const [founderName, setFounderName] = useState(founder?.name || state.guild.founder || '');

  useEffect(() => {
    setGuildName(state.guild.name);
    setFounderName(founder?.name || state.guild.founder || '');
  }, [state.guild.name, state.guild.founder, founder?.name]);

  return (
    <div className="screen screen--settings">
      <header className="screen-heading">
        <div>
          <span className="eyebrow">Campaign management</span>
          <h1>Settings & Save</h1>
          <p>Saves use IndexedDB, not localStorage. History is compacted safely and storage errors never crash rendering.</p>
        </div>
        <div className="heading-metrics">
          <Badge tone="green">Save slot {slot}</Badge>
        </div>
      </header>

      <div className="settings-grid">
        <Panel title="Guild identity" eyebrow="Names can evolve; history stays intact">
          <div className="settings-form identity-settings">
            <label>
              Guild name
              <input value={guildName} maxLength={38} onChange={(event) => setGuildName(event.target.value)} />
              <small>Renaming creates a Chronicle entry instead of rewriting the past.</small>
            </label>
            <Button disabled={!guildName.trim() || guildName.trim() === state.guild.name} onClick={() => actions.renameGuild(guildName)}>
              Rename guild
            </Button>
            <label>
              Founder name
              <input value={founderName} maxLength={36} onChange={(event) => setFounderName(event.target.value)} />
              <small>Your founder remains the same hero; only the recorded name changes.</small>
            </label>
            <Button disabled={!founderName.trim() || founderName.trim() === founder?.name} onClick={() => actions.renameFounder(founderName)}>
              Rename founder
            </Button>
          </div>
        </Panel>

        <Panel title="Sound" eyebrow="Retro sound effects">
          <label className="sound-setting">
            <input type="checkbox" checked={state.settings.sound !== false} onChange={(event) => actions.updateSettings({ sound: event.target.checked })} />{' '}
            Sound on
          </label>
          <label className="sound-setting">
            Volume
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={state.settings.volume ?? 0.6}
              onChange={(event) => actions.updateSettings({ volume: Number(event.target.value) })}
              disabled={state.settings.sound === false}
            />
          </label>
        </Panel>

        <Panel title="Controls" eyebrow="Touch and gestures">
          <div className="segmented" role="radiogroup" aria-label="Gestures">
            {[
              ['drag', 'Drag gestures'],
              ['tap', 'Tap only'],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={(state.settings.gestures || 'drag') === id}
                className={(state.settings.gestures || 'drag') === id ? 'is-selected' : ''}
                onClick={() => actions.updateSettings({ gestures: id })}
              >
                {label}
              </button>
            ))}
          </div>
          <small className="muted">Tap only: tap the source, then the target. Nothing needs dragging.</small>
          <label className="sound-setting">
            <input type="checkbox" checked={state.settings.haptics !== false} onChange={(event) => actions.updateSettings({ haptics: event.target.checked })} /> Vibration (hits, crits, KOs)
          </label>
          <label className="sound-setting">
            <input type="checkbox" checked={Boolean(state.settings.joystick)} onChange={(event) => actions.updateSettings({ joystick: event.target.checked })} />{' '}
            Drag-anywhere joystick (optional)
          </label>
          <label className="sound-setting">
            <input type="checkbox" checked={state.settings.battleSpeed === 2} onChange={(event) => actions.updateSettings({ battleSpeed: event.target.checked ? 2 : 1 })} /> Fast battles (2× speed)
          </label>
          <small className="muted">Walking: tap the ground to go, tap a person or door to walk there and use it.</small>
          <Button size="sm" onClick={() => actions.updateSettings({ seenHints: {} })}>
            Show gesture hints again
          </Button>
        </Panel>

        <Panel title="Simulation" eyebrow="Campaign preferences">
          <div className="settings-form">
            <label>
              Difficulty
              <select value={state.settings.difficulty} onChange={(event) => actions.updateSettings({ difficulty: event.target.value })}>
                <option>Story</option>
                <option>Standard</option>
                <option>Harsh</option>
              </select>
              <small>Story reduces mission difficulty by 6. Harsh increases it by 6.</small>
            </label>
            <label className="switch-row">
              <span>
                <strong>Autosave</strong>
                <small>Save after meaningful actions and time advancement.</small>
              </span>
              <input type="checkbox" checked={state.settings.autosave} onChange={(event) => actions.updateSettings({ autosave: event.target.checked })} />
            </label>
            <label className="switch-row">
              <span>
                <strong>Reduced motion</strong>
                <small>Disable page and decorative animation.</small>
              </span>
              <input
                type="checkbox"
                checked={state.settings.reducedMotion}
                onChange={(event) => actions.updateSettings({ reducedMotion: event.target.checked })}
              />
            </label>
            <label className="switch-row">
              <span>
                <strong>Compact interface</strong>
                <small>Reduce spacing on dense roster and ranking pages.</small>
              </span>
              <input type="checkbox" checked={state.settings.compactMode} onChange={(event) => actions.updateSettings({ compactMode: event.target.checked })} />
            </label>
          </div>
        </Panel>

        <Panel title="Save management" eyebrow="Slot and export">
          <div className="save-actions">
            <Button variant="primary" onClick={actions.saveNow}>
              Save now
            </Button>
            <Button onClick={actions.exportSave}>Export campaign</Button>
            <Button variant="danger" onClick={actions.returnHome}>
              Return to save slots
            </Button>
          </div>
          <p className="muted">
            Export creates a readable JSON backup. The active browser save remains in IndexedDB and can grow far beyond localStorage’s small quota.
          </p>
        </Panel>

        <Panel title="Import backup" eyebrow="Replace current slot">
          <textarea
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
            placeholder="Paste an exported Guilds of Legend save here…"
            rows={8}
          />
          <div className="save-actions">
            <Button onClick={() => fileRef.current?.click()}>Choose JSON file</Button>
            <Button variant="primary" disabled={!importText.trim()} onClick={() => actions.importSave(importText)}>
              Import into slot {slot}
            </Button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (file) setImportText(await file.text());
            }}
          />
        </Panel>

        <Panel title="Danger zone" eyebrow="Irreversible">
          <p>Deleting this campaign removes the IndexedDB record for slot {slot}. Export first if the history matters.</p>
          <Button variant="danger" onClick={actions.deleteCurrent}>
            Delete this campaign
          </Button>
        </Panel>
      </div>
    </div>
  );
}
