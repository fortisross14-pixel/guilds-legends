import React, { useEffect, useRef } from 'react';
import Icon from '../components/Icon.jsx';
import { Tabs } from '../components/UI.jsx';

/**
 * The one screen template (docs/UX.md, "One screen template"). Every section and
 * building screen uses it:
 *   1. title and tabs (swipe the content sideways to change tab)
 *   2. a list or grid (children)
 *   3. a details area: a side panel on wide screens, a bottom panel on phones
 *   4. a portrait at the top of the details where it helps
 *   5. one help line at the bottom
 * Back sits at the top left (a left-edge swipe also goes back); the primary
 * action sits at the bottom right.
 */
export default function Section({
  id,
  title,
  tabs = null,
  tab = null,
  onTab = null,
  onBack,
  backLabel = 'Back',
  help = null,
  primary = null,
  detail = null,
  detailTitle = null,
  portrait = null,
  onCloseDetail = null,
  className = '',
  children,
}) {
  const bodyRef = useRef(null);
  const swipe = useRef(null);
  const index = tabs ? Math.max(0, tabs.findIndex((item) => item.id === tab)) : 0;

  // Esc goes back, like the back button.
  useEffect(() => {
    const onKey = (event) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      if (document.querySelector('.modal-layer, .dialogue')) return;
      event.preventDefault();
      if (detail && onCloseDetail) onCloseDetail();
      else onBack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onBack, detail, onCloseDetail]);

  // Each tab opens at the top.
  useEffect(() => {
    bodyRef.current?.scrollTo?.({ top: 0 });
  }, [tab]);

  const ignore = (target) => target.closest?.('input, select, textarea, [data-drop], .draggable, .world-map, .rest-dial, .tabs, [data-no-swipe]');
  const onPointerDown = (event) => {
    if (!tabs || tabs.length < 2 || ignore(event.target) || event.clientX < 32) {
      swipe.current = null;
      return;
    }
    swipe.current = { x: event.clientX, y: event.clientY, t: Date.now(), dragged: false };
  };
  const onPointerMove = () => {
    if (swipe.current && document.body.classList.contains('is-dragging')) swipe.current.dragged = true;
  };
  const onPointerUp = (event) => {
    const from = swipe.current;
    swipe.current = null;
    if (!from || from.dragged || Date.now() - from.t > 600) return;
    const dx = event.clientX - from.x;
    const dy = event.clientY - from.y;
    if (Math.abs(dx) < 80 || Math.abs(dx) < Math.abs(dy) * 1.6) return;
    const next = tabs[index + (dx < 0 ? 1 : -1)];
    if (next) onTab(next.id);
  };

  // The detail panel on phones: swipe its grip down to close it.
  const sheet = useRef(null);
  const grab = useRef(null);
  const onGrabDown = (event) => {
    if (!onCloseDetail || event.target.closest('button:not(.section__grip)')) return;
    grab.current = { y: event.clientY };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const onGrabMove = (event) => {
    if (!grab.current || !sheet.current) return;
    const dy = Math.max(0, event.clientY - grab.current.y);
    sheet.current.style.transform = dy ? `translateY(${dy}px)` : '';
  };
  const onGrabUp = (event) => {
    if (!grab.current) return;
    const dy = event.clientY - grab.current.y;
    grab.current = null;
    if (sheet.current) sheet.current.style.transform = '';
    if (dy > 80) onCloseDetail?.();
  };

  return (
    <div className={`section-layer section-layer--${id}`} role="presentation">
      <section className={`section section--${id} ${detail ? 'has-detail' : ''} ${className}`} role="dialog" aria-modal="false" aria-label={title}>
        <header className="section__head">
          <button type="button" className="section__back" onClick={onBack} aria-label={backLabel}>
            <Icon name="back" size={20} tone="plain" />
            <span>{backLabel}</span>
          </button>
          <h1 className="section__title">{title}</h1>
        </header>
        {tabs && tabs.length > 1 ? (
          <div className="section__tabs">
            <Tabs items={tabs} active={tab} onChange={onTab} ariaLabel={`${title} tabs`} />
          </div>
        ) : null}
        <div className="section__main">
          <div className="section__list" ref={bodyRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
            {children}
          </div>
          {detail ? (
            <aside className="section__detail" ref={sheet} aria-label={detailTitle || 'Details'}>
              <div className="section__grip-row" onPointerDown={onGrabDown} onPointerMove={onGrabMove} onPointerUp={onGrabUp} onPointerCancel={onGrabUp}>
                <i className="section__grip" aria-hidden="true" />
                {detailTitle ? <h2>{detailTitle}</h2> : null}
                {onCloseDetail ? (
                  <button type="button" className="section__close" onClick={onCloseDetail} aria-label="Close details">
                    <Icon name="close" size={18} tone="plain" />
                  </button>
                ) : null}
              </div>
              {portrait ? <div className="section__portrait">{portrait}</div> : null}
              <div className="section__detail-body">{detail}</div>
            </aside>
          ) : null}
        </div>
        {help || primary ? (
          <footer className="section__foot">
            {help ? <p className="section__help">{help}</p> : <span />}
            {primary ? <div className="section__primary">{primary}</div> : null}
          </footer>
        ) : null}
      </section>
    </div>
  );
}
