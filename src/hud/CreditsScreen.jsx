import React from 'react';

// Keep in sync with CREDITS.md.
const CREDITS = [
  {
    title: 'Icons',
    lines: [
      'Game icons from game-icons.net by Lorc, Delapouite and Sbed, licensed under CC BY 3.0 (creativecommons.org/licenses/by/3.0). Recoloured as engraved brass.',
      'System icons from Phosphor Icons (bold weight), MIT License, © Phosphor Icons.',
    ],
  },
  {
    title: 'Fonts',
    lines: ['Cormorant Garamond by Christian Thalmann, SIL Open Font License 1.1.', 'Manrope by Mikhail Sharanda, SIL Open Font License 1.1.'],
  },
  { title: 'Code', lines: ['React, Vite and Phaser, MIT License.'] },
];

export default function CreditsScreen() {
  return (
    <div className="credits">
      {CREDITS.map((group) => (
        <section key={group.title}>
          <h2>{group.title}</h2>
          {group.lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </section>
      ))}
    </div>
  );
}
