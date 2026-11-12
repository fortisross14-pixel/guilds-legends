import React, { useId } from 'react';
import { ICON_PATHS } from './iconPaths.js';
import { cleanBanner, colorHex } from '../data/banner.js';

/** The field of a banner pattern, in a 100 x 120 box (the shape clips it). */
function Field({ pattern, a, b }) {
  switch (pattern) {
    case 'pale':
      return (
        <>
          <rect width="100" height="120" fill={a} />
          <rect x="35" width="30" height="120" fill={b} />
        </>
      );
    case 'fess':
      return (
        <>
          <rect width="100" height="120" fill={a} />
          <rect y="44" width="100" height="32" fill={b} />
        </>
      );
    case 'per-pale':
      return (
        <>
          <rect width="50" height="120" fill={a} />
          <rect x="50" width="50" height="120" fill={b} />
        </>
      );
    case 'per-fess':
      return (
        <>
          <rect width="100" height="60" fill={a} />
          <rect y="60" width="100" height="60" fill={b} />
        </>
      );
    case 'bend':
      return (
        <>
          <rect width="100" height="120" fill={a} />
          <polygon points="0,0 28,0 100,92 100,120 72,120 0,28" fill={b} />
        </>
      );
    case 'quarterly':
      return (
        <>
          <rect width="100" height="120" fill={a} />
          <rect x="50" width="50" height="60" fill={b} />
          <rect y="60" width="50" height="60" fill={b} />
        </>
      );
    case 'chevron':
      return (
        <>
          <rect width="100" height="120" fill={a} />
          <polygon points="0,78 50,44 100,78 100,104 50,70 0,104" fill={b} />
        </>
      );
    default:
      return <rect width="100" height="120" fill={a} />;
  }
}

/**
 * The guild's banner: a hanging banner (swallow-tailed at the bottom) with its
 * field pattern, a gold edge and the emblem. `banner` is guild.banner.
 */
export default function GuildBanner({ banner, size = 48, className = '', title = null, plain = false }) {
  const clip = useId().replace(/:/g, '');
  const value = cleanBanner(banner);
  const [a, b] = value.colors.map(colorHex);
  const shape = plain ? null : ICON_PATHS[value.emblem];
  const outline = 'M4 4 H96 V112 L50 96 L4 112 Z';
  return (
    <svg className={`guild-banner ${className}`} width={size} height={size * 1.2} viewBox="0 0 100 120" role="img" aria-label={title || 'The guild banner'}>
      <defs>
        <clipPath id={clip}>
          <path d={outline} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <Field pattern={value.pattern} a={a} b={b} />
      </g>
      {shape ? (
        <g transform="translate(26 26) scale(0.094)">
          <path d={shape[1]} fill={colorHex(value.emblemColor)} stroke="#140d08" strokeWidth="14" paintOrder="stroke" />
        </g>
      ) : null}
      <path d={outline} fill="none" stroke="#d9a93a" strokeWidth="4" strokeLinejoin="round" />
      <rect x="0" y="0" width="100" height="6" rx="2" fill="#6b4a2b" />
    </svg>
  );
}
