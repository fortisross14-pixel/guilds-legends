// The gesture language (docs/UX.md): tap = select / go / confirm; drag and drop =
// do something to something; long-press (~400 ms) = inspect; swipe = next /
// previous / dismiss / close; hold during animations = fast-forward. No
// double-tap. Every drag has a tap fallback (tap the source, then the target),
// and the "Tap only" setting turns dragging off.
import { useEffect, useRef } from 'react';

export const LONG_PRESS_MS = 400;
export const DRAG_SLOP = 10;

/** True unless the player chose "Tap only" in settings. */
export function dragEnabled(settings) {
  return settings?.gestures !== 'tap';
}

/** Short vibration on supported devices (hit, crit, KO, drop), unless switched off. */
const PATTERNS = { tap: 8, hit: 15, crit: [30, 40, 30], ko: 70, drop: 12, error: [20, 30, 20] };
export function haptic(kind, settings) {
  if (settings?.haptics === false) return;
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(PATTERNS[kind] || 10);
  } catch {
    // Some browsers throw when vibration is blocked; feedback is optional.
  }
}

/**
 * Long-press to inspect, short tap to act. Returns pointer handlers for an
 * element. Moving more than DRAG_SLOP cancels the long-press (so it never
 * fights a scroll or a drag). The context menu is suppressed.
 */
export function useLongPress(onLongPress, onTap = null, ms = LONG_PRESS_MS) {
  const timer = useRef(0);
  const start = useRef(null);
  const fired = useRef(false);
  const clear = () => window.clearTimeout(timer.current);
  useEffect(() => clear, []);
  return {
    onPointerDown: (event) => {
      fired.current = false;
      start.current = { x: event.clientX, y: event.clientY };
      clear();
      timer.current = window.setTimeout(() => {
        fired.current = true;
        onLongPress?.(event);
      }, ms);
    },
    onPointerMove: (event) => {
      if (!start.current) return;
      if (Math.hypot(event.clientX - start.current.x, event.clientY - start.current.y) > DRAG_SLOP) clear();
    },
    onPointerUp: () => {
      clear();
      start.current = null;
    },
    onPointerLeave: clear,
    onPointerCancel: clear,
    onClick: (event) => {
      if (fired.current) {
        event.preventDefault();
        event.stopPropagation();
        fired.current = false;
        return;
      }
      onTap?.(event);
    },
    // A mouse inspects with a right-click (a long-press is awkward with a mouse).
    onContextMenu: (event) => {
      event.preventDefault();
      if (event.nativeEvent?.pointerType === 'mouse' || !event.nativeEvent?.pointerType) {
        if (!fired.current) onLongPress?.(event);
        clear();
      }
    },
  };
}

/** Horizontal or vertical swipe on an element: { onLeft, onRight, onUp, onDown }. */
export function useSwipe({ onLeft, onRight, onUp, onDown } = {}, threshold = 60) {
  const start = useRef(null);
  return {
    onPointerDown: (event) => {
      // Fingers swipe; a mouse uses the buttons (a mouse drag selects text instead).
      start.current = event.pointerType === 'mouse' ? null : { x: event.clientX, y: event.clientY, t: Date.now() };
    },
    onPointerUp: (event) => {
      const from = start.current;
      start.current = null;
      if (!from || Date.now() - from.t > 700) return;
      const dx = event.clientX - from.x;
      const dy = event.clientY - from.y;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) (dx < 0 ? onLeft : onRight)?.();
      else if (Math.abs(dy) > threshold) (dy < 0 ? onUp : onDown)?.();
    },
    onPointerCancel: () => {
      start.current = null;
    },
  };
}

/**
 * Pointer drag and drop between elements marked with data attributes. The
 * source calls start(event, payload); targets carry `data-drop` (a kind) and
 * `data-drop-id`. While dragging, `onMove(target)` reports what is under the
 * finger; on release `onDrop(target)` (null = released on nothing).
 * Returns { start, active } where active is the live drag (or null).
 */
export function dropTargetAt(x, y) {
  const element = document.elementFromPoint(x, y)?.closest?.('[data-drop]');
  return element ? { kind: element.dataset.drop, id: element.dataset.dropId, element } : null;
}

/**
 * Choices ignore clicks for a moment after they appear (or change): the tap that finishes a
 * line or skips it must not land on a choice that just popped up under the finger or cursor.
 * Spread the returned props on the choices' container; `key` changes when new choices show.
 */
export const CHOICE_GUARD_MS = 450;
export function useChoiceGuard(key, ms = CHOICE_GUARD_MS) {
  const last = useRef({ key: undefined, at: 0 });
  if (last.current.key !== key) last.current = { key, at: typeof performance !== 'undefined' ? performance.now() : 0 };
  return {
    onClickCapture: (event) => {
      if (performance.now() - last.current.at < ms) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
  };
}
