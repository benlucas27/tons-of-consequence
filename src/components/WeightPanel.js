'use client';

import { useRef, useState } from 'react';
import { LEVER_BY_KEY, RANK_WEIGHTS, PRESET_ORDERS, activePreset } from '@/lib/scoring';

/** The weighting as a coloured bar, one segment per criterion, sized by its weight. */
export function WeightBar({ order }) {
  const label = order.map((k, i) => `${LEVER_BY_KEY[k].name} ${RANK_WEIGHTS[i]} percent`).join(', ');
  return (
    <div className="wbar" role="img" aria-label={`Your weighting: ${label}`}>
      {order.map((k, i) => {
        const l = LEVER_BY_KEY[k];
        const w = RANK_WEIGHTS[i];
        return (
          <span key={k} className="wbar-seg" data-n={i + 1} style={{ '--w': w, '--c': l.color }} title={`${l.name}: ${w}%`}>
            <em>{l.short}</em>
            <b>{w}</b>
          </span>
        );
      })}
    </div>
  );
}

/** What each colour means. Sits directly under the bar so the colours are never a mystery. */
export function Legend({ order }) {
  return (
    <ul className="legend" aria-label="What each colour is">
      {order.map((k, i) => {
        const l = LEVER_BY_KEY[k];
        return (
          <li key={k} className="lg" style={{ '--c': l.color }}>
            <i aria-hidden="true" />
            <span className="lg-t">
              <span className="lg-n">{l.name}<b>{RANK_WEIGHTS[i]}%</b></span>
              <span className="lg-d">{l.ask}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function PresetChips({ order, onChange }) {
  const active = activePreset(order);
  return (
    <div className="chips" role="group" aria-label="Weighting presets">
      {Object.keys(PRESET_ORDERS).map((name) => (
        <button key={name} type="button" className="chip" aria-pressed={active === name} onClick={() => onChange([...PRESET_ORDERS[name]])}>
          {name}
        </button>
      ))}
    </div>
  );
}

function move(order, from, to) {
  const next = [...order];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** Six criteria in order of importance. Drag the grip, or use the arrow buttons. */
export function WeightList({ order, onChange }) {
  const rows = useRef({});
  const live = useRef(order);
  live.current = order;
  const [dragging, setDragging] = useState(null);

  function startDrag(e, key) {
    e.preventDefault();
    setDragging(key);
    const onMove = (ev) => {
      const cur = live.current;
      const from = cur.indexOf(key);
      let target = 0;
      cur.forEach((k) => {
        if (k === key) return;
        const el = rows.current[k];
        if (!el) return;
        const r = el.getBoundingClientRect();
        if (ev.clientY > r.top + r.height / 2) target += 1;
      });
      if (target !== from) onChange(move(cur, from, target));
    };
    const onUp = () => {
      setDragging(null);
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
  }

  return (
    <div className="wlist">
      {order.map((k, i) => {
        const l = LEVER_BY_KEY[k];
        return (
          <div key={k} ref={(el) => { rows.current[k] = el; }} className={`wrow${dragging === k ? ' drag' : ''}`} style={{ '--c': l.color }}>
            <button type="button" className="grip" aria-label={`Drag ${l.name}`} onPointerDown={(e) => startDrag(e, k)}>
              <svg width="12" height="18" viewBox="0 0 12 18" fill="currentColor" aria-hidden="true"><circle cx="3" cy="3" r="1.6" /><circle cx="9" cy="3" r="1.6" /><circle cx="3" cy="9" r="1.6" /><circle cx="9" cy="9" r="1.6" /><circle cx="3" cy="15" r="1.6" /><circle cx="9" cy="15" r="1.6" /></svg>
            </button>
            <span className="pos">{i + 1}</span>
            <span className="nm"><i aria-hidden="true" />{l.name}</span>
            <span className="ds">{l.ask}</span>
            <span className="pc">{RANK_WEIGHTS[i]}%</span>
            <span className="mv">
              <button type="button" className="mvb" aria-label={`Move ${l.name} up`} disabled={i === 0} onClick={() => onChange(move(order, i, i - 1))}>▲</button>
              <button type="button" className="mvb" aria-label={`Move ${l.name} down`} disabled={i === order.length - 1} onClick={() => onChange(move(order, i, i + 1))}>▼</button>
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Bar, legend, presets and an inline editor, all in one block. */
export default function WeightPanel({ order, onChange, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="weights" aria-label="Your weighting">
      <div className="s-label">
        <span>Your weighting</span>
        <button type="button" className="link-btn" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Done' : 'Customise'}</button>
      </div>
      <WeightBar order={order} />
      <Legend order={order} />
      <PresetChips order={order} onChange={onChange} />
      {open && <WeightList order={order} onChange={onChange} />}
    </section>
  );
}
