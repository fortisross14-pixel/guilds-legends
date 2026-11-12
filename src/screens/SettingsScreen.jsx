import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../components/UI.jsx';

// System → Settings: short labelled rows, grouped. No explanations on the
// screen; each control says what it is.

function Toggle({ label, checked, onChange, disabled = false }) {
  return (
    <label className="settings-row">
      <span>{label}</span>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}

function Group({ title, children }) {
  return (
    <section className="settings-group">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

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
  const settings = state.settings;
  const set = (patch) => actions.updateSettings(patch);
  return (
    <div className="settings">
      <Group title="Sound">
        <Toggle label="Sound" checked={settings.sound !== false} onChange={(on) => set({ sound: on })} />
        <label className="settings-row">
          <span>Volume</span>
          <input type="range" min="0" max="1" step="0.05" value={settings.volume ?? 0.6} disabled={settings.sound === false} onChange={(event) => set({ volume: Number(event.target.value) })} />
        </label>
      </Group>
      <Group title="Controls">
        <label className="settings-row">
          <span>Gestures</span>
          <select value={settings.gestures || 'drag'} onChange={(event) => set({ gestures: event.target.value })}>
            <option value="drag">Drag and tap</option>
            <option value="tap">Tap only</option>
          </select>
        </label>
        <Toggle label="Vibration" checked={settings.haptics !== false} onChange={(on) => set({ haptics: on })} />
        <Toggle label="Joystick" checked={Boolean(settings.joystick)} onChange={(on) => set({ joystick: on })} />
        <Toggle label="Fast battles" checked={settings.battleSpeed === 2} onChange={(on) => set({ battleSpeed: on ? 2 : 1 })} />
        <div className="settings-row">
          <span>Gesture hints</span>
          <Button size="sm" onClick={() => set({ seenHints: {} })}>
            Show again
          </Button>
        </div>
      </Group>
      <Group title="Display">
        <Toggle label="Main quest marker" checked={settings.questMarker !== false} onChange={(on) => set({ questMarker: on })} />
        <Toggle label="Reduced motion" checked={Boolean(settings.reducedMotion)} onChange={(on) => set({ reducedMotion: on })} />
        <Toggle label="Compact lists" checked={Boolean(settings.compactMode)} onChange={(on) => set({ compactMode: on })} />
        <Toggle label="Show asset ids" checked={Boolean(settings.showAssetIds)} onChange={(on) => set({ showAssetIds: on })} />
      </Group>
      <Group title="Developer">
        <div className="settings-row">
          <span>Art preview (every town and wild area)</span>
          <Button size="sm" onClick={() => (window.location.hash = 'art-test')}>
            Open
          </Button>
        </div>
      </Group>
      <Group title="Game">
        <label className="settings-row">
          <span>Difficulty</span>
          <select value={settings.difficulty} onChange={(event) => set({ difficulty: event.target.value })}>
            <option>Story</option>
            <option>Standard</option>
            <option>Harsh</option>
          </select>
        </label>
        <Toggle label="Autosave" checked={Boolean(settings.autosave)} onChange={(on) => set({ autosave: on })} />
      </Group>
      <Group title="Names">
        <div className="settings-row">
          <input aria-label="Guild name" value={guildName} maxLength={38} onChange={(event) => setGuildName(event.target.value)} />
          <Button size="sm" disabled={!guildName.trim() || guildName.trim() === state.guild.name} onClick={() => actions.renameGuild(guildName)}>
            Rename
          </Button>
        </div>
        <div className="settings-row">
          <input aria-label="Founder name" value={founderName} maxLength={36} onChange={(event) => setFounderName(event.target.value)} />
          <Button size="sm" disabled={!founderName.trim() || founderName.trim() === founder?.name} onClick={() => actions.renameFounder(founderName)}>
            Rename
          </Button>
        </div>
      </Group>
      <Group title="Backup">
        <div className="settings-row">
          <span>Export to a file</span>
          <Button size="sm" onClick={actions.exportSave}>
            Export
          </Button>
        </div>
        <details className="journal-details">
          <summary>Import into slot {slot}</summary>
          <textarea value={importText} onChange={(event) => setImportText(event.target.value)} placeholder="Paste a backup here" rows={5} />
          <div className="settings-row">
            <Button size="sm" onClick={() => fileRef.current?.click()}>
              Choose file
            </Button>
            <Button size="sm" variant="primary" disabled={!importText.trim()} onClick={() => actions.importSave(importText)}>
              Import
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
        </details>
        <div className="settings-row">
          <span>Delete this campaign</span>
          <Button size="sm" variant="danger" onClick={actions.deleteCurrent}>
            Delete
          </Button>
        </div>
      </Group>
    </div>
  );
}
