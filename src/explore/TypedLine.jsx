import React from 'react';

/**
 * A dialogue line being typed out (useTypewriter). The untyped rest is laid out
 * but invisible, so the box never changes size while the text appears.
 */
export default function TypedLine({ text, shown, className = 'dialogue__text' }) {
  const full = String(text || '');
  const typed = shown ?? full;
  return (
    <p className={className} aria-label={full}>
      <span aria-hidden="true">{typed}</span>
      <span aria-hidden="true" className="dialogue__rest">
        {full.slice(typed.length)}
      </span>
    </p>
  );
}
