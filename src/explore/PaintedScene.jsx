import React, { useLayoutEffect, useRef, useState } from 'react';
import Asset from '../components/Asset.jsx';
import Icon from '../components/Icon.jsx';

/** The interior paintings are 1280 × 576. */
const ART = { w: 1280, h: 576 };

/**
 * A painted scene (playtest-1-feedback): the painting covers the screen, and what
 * sticks out pans under a finger (sideways on a phone). `children` are placed on
 * the painting in percentages (people, hotspots, the door). Starts centred on
 * `focusX` (a percentage). A missing painting shows a mood gradient.
 */
export default function PaintedScene({ art, focusX = 50, className = '', label, onBackgroundTap = null, children, overlay = null }) {
  const viewRef = useRef(null);
  const [size, setSize] = useState({ w: ART.w, h: ART.h });
  // Arrows at the edges while there is more painting that way (a phone sees a slice).
  const [more, setMore] = useState({ left: false, right: false });
  const measure = () => {
    const view = viewRef.current;
    if (!view) return;
    const left = view.scrollLeft > 8;
    const right = view.scrollLeft < view.scrollWidth - view.clientWidth - 8;
    setMore((current) => (current.left === left && current.right === right ? current : { left, right }));
  };
  const pan = (direction) => viewRef.current?.scrollBy({ left: direction * viewRef.current.clientWidth * 0.7, behavior: 'smooth' });
  useLayoutEffect(() => {
    const view = viewRef.current;
    if (!view) return undefined;
    const fit = () => {
      const scale = Math.max(view.clientWidth / ART.w, view.clientHeight / ART.h);
      setSize({ w: Math.round(ART.w * scale), h: Math.round(ART.h * scale) });
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(view);
    return () => observer.disconnect();
  }, []);
  useLayoutEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.scrollLeft = Math.max(0, (size.w * focusX) / 100 - view.clientWidth / 2);
    view.scrollTop = Math.max(0, (size.h - view.clientHeight) / 2);
    measure();
  }, [size.w, size.h, focusX]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <main className={`interior ${className}`} aria-label={label}>
      <div className="interior__view" ref={viewRef} onClick={onBackgroundTap || undefined} onScroll={measure}>
        <div className="interior__stage" style={{ width: size.w, height: size.h }}>
          <Asset id={art} className="interior__art" alt="" />
          {children}
        </div>
      </div>
      {more.left ? (
        <button type="button" className="interior__pan interior__pan--left" onClick={() => pan(-1)} aria-label="Look left">
          <Icon name="back" size={20} tone="plain" />
        </button>
      ) : null}
      {more.right ? (
        <button type="button" className="interior__pan interior__pan--right" onClick={() => pan(1)} aria-label="Look right">
          <Icon name="next" size={20} tone="plain" />
        </button>
      ) : null}
      {overlay}
    </main>
  );
}

/** Styles for things placed on a painting: a point (feet of a person) or a box, in percentages. */
export const at = ([x, y]) => ({ left: `${x}%`, top: `${y}%` });
export const box = ([x, y, w, h]) => ({ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%` });
