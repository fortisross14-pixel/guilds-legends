import React from 'react';
import { TOWNS } from '../data/towns/index.js';
import Asset from '../components/Asset.jsx';

/** Everyone you have talked to in the towns, with where to find them. */
export default function ContactsScreen({ state }) {
  const talked = state.world?.exploration?.talked || {};
  const people = Object.values(TOWNS).flatMap((town) =>
    town.npcs.filter((npc) => talked[npc.dialogue]).map((npc) => ({ ...npc, town })),
  );
  if (!people.length) return <p className="section-empty">Nobody yet. Talk to people in town and they appear here.</p>;
  return (
    <ul className="contact-list">
      {people.map((person) => (
        <li key={`${person.town.id}-${person.id}`} className="contact-row">
          <Asset id={`portrait.${person.town.id}.${person.id}`} className="contact-row__portrait" />
          <span>
            <strong>{person.name}</strong>
            <small>
              {person.role} · {person.town.name}
            </small>
          </span>
        </li>
      ))}
    </ul>
  );
}
