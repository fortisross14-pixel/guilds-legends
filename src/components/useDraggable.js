import { useEffect, useRef } from 'react';
import { DRAG_SLOP, dropTargetAt } from './gestures.js';

/**
 * Drag and drop with a pointer (finger or mouse). Put the returned handlers on
 * the source; mark targets with `data-drop="kind"` and `data-drop-id`. A small
 * ghost label follows the finger, the target under it gets `.is-drop-over`,
 * `onMove(target)` reports it while dragging and `onDrop(target)` fires on
 * release (target is null when released on nothing). A short press without
 * movement stays a normal click, so tap-then-tap still works.
 */
export function useDraggable({ enabled = true, label = '', onStart, onMove, onDrop }) {
  const live = useRef({});
  live.current = { enabled, label, onStart, onMove, onDrop };
  const cleanup = useRef(() => {});
  const dragged = useRef(false);
  useEffect(() => () => cleanup.current(), []);

  const onPointerDown = (event) => {
    if (!live.current.enabled || event.button > 0) return;
    const from = { x: event.clientX, y: event.clientY };
    let ghost = null;
    let over = null;
    dragged.current = false;
    const setOver = (target) => {
      if (over?.element === target?.element) return;
      over?.element?.classList.remove('is-drop-over');
      over = target;
      over?.element?.classList.add('is-drop-over');
    };
    const move = (moveEvent) => {
      const { clientX: x, clientY: y } = moveEvent;
      if (!dragged.current) {
        if (Math.hypot(x - from.x, y - from.y) < DRAG_SLOP) return;
        dragged.current = true;
        ghost = document.createElement('div');
        ghost.className = 'drag-ghost';
        ghost.textContent = live.current.label;
        document.body.appendChild(ghost);
        document.body.classList.add('is-dragging');
        live.current.onStart?.();
      }
      moveEvent.preventDefault();
      ghost.style.transform = `translate(${x}px, ${y}px)`;
      const target = dropTargetAt(x, y);
      setOver(target);
      live.current.onMove?.(target);
    };
    const end = (upEvent) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', cancel);
      if (dragged.current) {
        const target = upEvent ? dropTargetAt(upEvent.clientX, upEvent.clientY) : null;
        setOver(null);
        ghost?.remove();
        document.body.classList.remove('is-dragging');
        live.current.onDrop?.(target);
      }
    };
    const cancel = () => {
      dragged.current = false;
      setOver(null);
      ghost?.remove();
      document.body.classList.remove('is-dragging');
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', cancel);
    };
    cleanup.current = cancel;
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', cancel);
  };

  // A drag must not also count as a click on the source.
  const onClickCapture = (event) => {
    if (dragged.current) {
      event.preventDefault();
      event.stopPropagation();
      dragged.current = false;
    }
  };

  return { onPointerDown, onClickCapture };
}
