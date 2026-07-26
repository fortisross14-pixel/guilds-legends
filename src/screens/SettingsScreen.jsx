import React, { useRef, useState } from 'react';
import { Badge, Button, Panel } from '../components/UI.jsx';

export default function SettingsScreen({ state, actions, slot }) {
  const fileRef = useRef(null);
  const [importText, setImportText] = useState('');

  return (
    <div className="screen screen--settings">
      <header className="screen-heading"><div><span className="eyebrow">Campaign management</span><h1>Settings & Save</h1><p>Saves use IndexedDB, not localStorage. History is compacted safely and storage errors never crash rendering.</p></div><div className="heading-metrics"><Badge tone="green">Save slot {slot}</Badge></div></header>

      <div className="settings-grid">
        <Panel title="Simulation" eyebrow="Campaign preferences">
          <div className="settings-form">
            <label>Difficulty<select value={state.settings.difficulty} onChange={(event) => actions.updateSettings({ difficulty: event.target.value })}><option>Story</option><option>Standard</option><option>Harsh</option></select><small>Story reduces mission difficulty by 6. Harsh increases it by 6.</small></label>
            <label className="switch-row"><span><strong>Autosave</strong><small>Save after meaningful actions and time advancement.</small></span><input type="checkbox" checked={state.settings.autosave} onChange={(event) => actions.updateSettings({ autosave: event.target.checked })} /></label>
            <label className="switch-row"><span><strong>Reduced motion</strong><small>Disable page and decorative animation.</small></span><input type="checkbox" checked={state.settings.reducedMotion} onChange={(event) => actions.updateSettings({ reducedMotion: event.target.checked })} /></label>
            <label className="switch-row"><span><strong>Compact interface</strong><small>Reduce spacing on dense roster and ranking pages.</small></span><input type="checkbox" checked={state.settings.compactMode} onChange={(event) => actions.updateSettings({ compactMode: event.target.checked })} /></label>
          </div>
        </Panel>

        <Panel title="Save management" eyebrow="Slot and export">
          <div className="save-actions"><Button variant="primary" onClick={actions.saveNow}>Save now</Button><Button onClick={actions.exportSave}>Export campaign</Button><Button variant="danger" onClick={actions.returnHome}>Return to save slots</Button></div>
          <p className="muted">Export creates a readable JSON backup. The active browser save remains in IndexedDB and can grow far beyond localStorage’s small quota.</p>
        </Panel>

        <Panel title="Import backup" eyebrow="Replace current slot">
          <textarea value={importText} onChange={(event) => setImportText(event.target.value)} placeholder="Paste an exported Guilds of Legend save here…" rows={8} />
          <div className="save-actions"><Button onClick={() => fileRef.current?.click()}>Choose JSON file</Button><Button variant="primary" disabled={!importText.trim()} onClick={() => actions.importSave(importText)}>Import into slot {slot}</Button></div>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={async (event) => {
            const file = event.target.files?.[0];
            if (file) setImportText(await file.text());
          }} />
        </Panel>

        <Panel title="Danger zone" eyebrow="Irreversible">
          <p>Deleting this campaign removes the IndexedDB record for slot {slot}. Export first if the history matters.</p>
          <Button variant="danger" onClick={actions.deleteCurrent}>Delete this campaign</Button>
        </Panel>
      </div>
    </div>
  );
}
