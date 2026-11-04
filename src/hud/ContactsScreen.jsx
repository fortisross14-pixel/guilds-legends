import React from 'react';
import { getContacts } from '../game/engine.js';
import { BUILDINGS, LOCATION_BY_ID } from '../data/world.js';
import { townFor } from '../data/towns/index.js';
import Asset from '../components/Asset.jsx';
import Icon from '../components/Icon.jsx';
import { Button } from '../components/UI.jsx';

const OFFER_ICONS = { mission: ['alert', 'Has a contract'], hire: ['coin', 'Looking for work'], challenge: ['swords', 'Wants a bout'] };
const SERVICES = { shop: 'Sells supplies', inn: 'Rents rooms', registrar: 'Tournament sign-ups', referee: 'Starts arena bouts', clerk: 'Keeps the rankings', news: 'Carries news', rumor: 'Hears rumours' };

function where(contact) {
  const town = LOCATION_BY_ID[contact.locationId]?.name || 'somewhere';
  if (contact.movedOn) return `Moved on · last seen in ${town}`;
  const label = contact.building ? townFor(contact.locationId)?.buildings.find((item) => item.building === contact.building)?.label || BUILDINGS[contact.building]?.name : 'the streets';
  return `${town} · ${label}`;
}

function feeling(score) {
  if (score >= 4) return 'Friendly';
  if (score >= 1) return 'Warm';
  if (score <= -3) return 'Cold';
  return 'Neutral';
}

/** Everyone you have met: where they are, what they offer, how they feel about you. Tap to see them on the map. */
export default function ContactsScreen({ state, navigate }) {
  const contacts = getContacts(state);
  if (!contacts.length) return <p className="section-empty">Nobody yet. Walk into a tavern, a shop or the arena and talk to people: they appear here.</p>;
  return (
    <ul className="contact-list">
      {contacts.map((contact) => (
        <li key={contact.id} className={`contact-row${contact.movedOn ? ' is-gone' : ''}`}>
          <Asset id={contact.portrait || 'portrait.poi'} className="contact-row__portrait" />
          <span>
            <strong>{contact.name}</strong>
            <small>
              {contact.role} · {where(contact)}
            </small>
            <span className="contact-row__offers">
              {contact.offers.map((offer) => (
                <span key={offer} className="contact-row__offer">
                  <Icon name={OFFER_ICONS[offer]?.[0] || 'question'} size={14} tone="plain" />
                  {OFFER_ICONS[offer]?.[1]}
                </span>
              ))}
              {contact.service ? <span className="contact-row__offer">{SERVICES[contact.service]}</span> : null}
              <span className="contact-row__offer contact-row__offer--feeling">{feeling(contact.relationship)}</span>
            </span>
          </span>
          <Button size="sm" onClick={() => navigate({ view: 'map', pin: contact.locationId })} aria-label={`Show ${contact.name} on the map`}>
            <Icon name="pin" size={14} tone="plain" /> Map
          </Button>
        </li>
      ))}
    </ul>
  );
}
