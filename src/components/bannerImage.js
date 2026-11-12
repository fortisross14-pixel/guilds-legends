import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GuildBanner from './GuildBanner.jsx';

/**
 * The guild's banner on a wooden post, as an image URL (an SVG data URL) for the
 * walk engine, which draws images, not components. 60 x 150 (scaled by the map).
 */
export function bannerPostUrl(banner) {
  const flag = renderToStaticMarkup(React.createElement(GuildBanner, { banner, size: 44 }))
    .replace(/^<svg /, '<svg x="14" y="14" ');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="150" viewBox="0 0 60 150">
    <rect x="9" y="6" width="6" height="142" rx="2" fill="#6b4a2b" stroke="#2a1a0e" stroke-width="1.5"/>
    <rect x="9" y="10" width="40" height="5" rx="2" fill="#6b4a2b" stroke="#2a1a0e" stroke-width="1.2"/>
    <circle cx="12" cy="6" r="4" fill="#d9a93a" stroke="#2a1a0e" stroke-width="1.2"/>
    <ellipse cx="12" cy="147" rx="11" ry="3" fill="rgba(0,0,0,.3)"/>
    ${flag}
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
