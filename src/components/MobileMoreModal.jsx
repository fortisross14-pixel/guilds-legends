import React from 'react';
import { Modal } from './UI.jsx';

const MORE_ITEMS = [
  { id: 'headquarters', label: 'Headquarters', icon: '♜', text: 'Facilities, appointments and politics' },
  { id: 'rankings', label: 'Rankings', icon: '✦', text: 'Guild ladders, hero rankings and records' },
  { id: 'chronicle', label: 'Chronicle', icon: '▤', text: 'Mission reports and the historical archive' },
  { id: 'legacy', label: 'Legacy', icon: '♛', text: 'Succession, branches, artifacts and inherited ambitions' },
  { id: 'goals', label: 'Goals', icon: '✓', text: 'Current objectives and achievements' },
  { id: 'settings', label: 'Settings', icon: '⚙', text: 'Identity, save data and accessibility' },
];

export default function MobileMoreModal({ open, onClose, navigate, active }) {
  return (
    <Modal open={open} title="More" eyebrow="Guild management" onClose={onClose} width="compact">
      <div className="mobile-more-grid">
        {MORE_ITEMS.map((item) => (
          <button key={item.id} className={active === item.id ? 'is-active' : ''} onClick={() => { navigate(item.id); onClose(); }}>
            <span>{item.icon}</span><div><strong>{item.label}</strong><small>{item.text}</small></div><i>›</i>
          </button>
        ))}
      </div>
    </Modal>
  );
}
