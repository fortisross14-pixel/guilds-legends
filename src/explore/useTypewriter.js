import { useEffect, useRef, useState } from 'react';

const CHARS_PER_SECOND = 60;

/**
 * Types a dialogue line out. Every dialogue box uses it, so tapping and Skip
 * behave the same everywhere (docs/UX.md): the first tap (or Skip) finishes the
 * line; after that, a tap moves on and Skip jumps to the next choice or the end.
 * `instant` (reduced motion) shows the whole line at once.
 */
export function useTypewriter(text, instant = false) {
  const full = String(text || '');
  const [count, setCount] = useState(instant ? full.length : 0);
  const timer = useRef(0);
  useEffect(() => {
    if (instant || !full) {
      setCount(full.length);
      return undefined;
    }
    setCount(0);
    const start = performance.now();
    const step = () => {
      const next = Math.min(full.length, Math.floor(((performance.now() - start) / 1000) * CHARS_PER_SECOND) + 1);
      setCount(next);
      if (next < full.length) timer.current = window.requestAnimationFrame(step);
    };
    timer.current = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(timer.current);
  }, [full, instant]);
  const done = count >= full.length;
  const finish = () => {
    window.cancelAnimationFrame(timer.current);
    setCount(full.length);
  };
  return { shown: full.slice(0, count), done, finish };
}

/** True when the player asked for less motion (the setting or the system). */
export function prefersInstantText(settings) {
  if (settings?.reducedMotion) return true;
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}
