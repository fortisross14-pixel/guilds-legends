import { useRef, useState } from 'react';
import { DRAG_SLOP } from './gestures.js';

/**
 * Drag to pan and pinch (or wheel) to zoom a map plane. Put `handlers` on the
 * viewport and `style` on the plane (transform-origin 0 0). A press that
 * doesn't move stays a tap on whatever is under it (a location).
 */
export function usePanZoom({ min = 1, max = 3 } = {}) {
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const pointers = useRef(new Map());
  const gesture = useRef(null);
  const moved = useRef(false);
  const box = useRef(null);

  const clamp = (next) => {
    const rect = box.current?.getBoundingClientRect();
    const scale = Math.min(max, Math.max(min, next.scale));
    if (!rect) return { ...next, scale };
    const minX = rect.width - rect.width * scale;
    const minY = rect.height - rect.height * scale;
    return { scale, x: Math.min(0, Math.max(minX, next.x)), y: Math.min(0, Math.max(minY, next.y)) };
  };
  const zoomAt = (clientX, clientY, factor) =>
    setView((current) => {
      const rect = box.current.getBoundingClientRect();
      const px = clientX - rect.left;
      const py = clientY - rect.top;
      const scale = Math.min(max, Math.max(min, current.scale * factor));
      const k = scale / current.scale;
      return clamp({ scale, x: px - (px - current.x) * k, y: py - (py - current.y) * k });
    });

  const handlers = {
    ref: box,
    onPointerDown: (event) => {
      pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      moved.current = false;
      const list = [...pointers.current.values()];
      gesture.current =
        list.length === 2
          ? { pinch: Math.hypot(list[0].x - list[1].x, list[0].y - list[1].y), view }
          : { start: { x: event.clientX, y: event.clientY }, view };
    },
    onPointerMove: (event) => {
      if (!pointers.current.has(event.pointerId) || !gesture.current) return;
      pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      const list = [...pointers.current.values()];
      if (list.length === 2 && gesture.current.pinch) {
        const distance = Math.hypot(list[0].x - list[1].x, list[0].y - list[1].y);
        const cx = (list[0].x + list[1].x) / 2;
        const cy = (list[0].y + list[1].y) / 2;
        moved.current = true;
        const base = gesture.current.view;
        const rect = box.current.getBoundingClientRect();
        const scale = Math.min(max, Math.max(min, (base.scale * distance) / gesture.current.pinch));
        const k = scale / base.scale;
        setView(clamp({ scale, x: cx - rect.left - (cx - rect.left - base.x) * k, y: cy - rect.top - (cy - rect.top - base.y) * k }));
        return;
      }
      const { start, view: base } = gesture.current;
      if (!start) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      if (!moved.current && Math.hypot(dx, dy) < DRAG_SLOP) return;
      moved.current = true;
      setView(clamp({ scale: base.scale, x: base.x + dx, y: base.y + dy }));
    },
    onPointerUp: (event) => {
      pointers.current.delete(event.pointerId);
      if (!pointers.current.size) gesture.current = null;
    },
    onPointerCancel: (event) => {
      pointers.current.delete(event.pointerId);
      gesture.current = null;
    },
    onWheel: (event) => zoomAt(event.clientX, event.clientY, event.deltaY < 0 ? 1.15 : 1 / 1.15),
    // A pan or pinch must not also tap a location.
    onClickCapture: (event) => {
      if (moved.current) {
        event.preventDefault();
        event.stopPropagation();
        moved.current = false;
      }
    },
  };
  const style = { transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`, transformOrigin: '0 0' };
  return { handlers, style, zoomed: view.scale > 1.01, reset: () => setView({ x: 0, y: 0, scale: 1 }) };
}
