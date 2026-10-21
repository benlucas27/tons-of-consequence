'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { REASONS, NOTE_MAX } from '@/lib/challengeOptions';

/** The Challenge button on an innings page, plus the "Under review" chip when the innings is on the review list. */
export default function ChallengeButton({ id }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState(null); // { status, count, outcome, decided, note } from /api/review-counts
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [trap, setTrap] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    let live = true;
    fetch(`/api/review-counts?id=${id}`).then((r) => r.json()).then((s) => { if (live) setState(s); }).catch(() => {});
    return () => { live = false; };
  }, [id]);

  async function submit(e) {
    e.preventDefault();
    if (!reason) { setMsg('Pick what we should look at.'); return; }
    setBusy(true); setMsg('');
    try {
      const res = await fetch('/api/challenge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ inningsId: id, reason, note, website: trap }) });
      const out = await res.json();
      if (!out.ok) { setMsg(out.error || 'Could not send that.'); setBusy(false); return; }
      setSent(true); setState((s) => ({ ...(s || {}), count: out.count || ((s && s.count) || 0) })); setMsg(`Added. ${out.count} ${out.count === 1 ? 'person has' : 'people have'} challenged this call.`);
    } catch { setMsg('Could not send that. Try again in a moment.'); }
    setBusy(false);
  }

  const underReview = state && state.status === 'under-review';
  const decided = state && state.status === 'decided';
  return (
    <div className="challenge-box">
      {underReview && <p className="challenge-chip"><Link href="/reviews">Under review</Link> · {state.count} {state.count === 1 ? 'challenge' : 'challenges'}</p>}
      {decided && <p className="challenge-chip challenge-decided"><Link href="/reviews">Reviewed {state.decided || ''}: {state.outcome === 'changed' ? 'changed' : state.outcome === 'no-call' ? 'no call' : 'stands'}</Link>{state.note ? ` · ${state.note}` : ''}</p>}
      <button type="button" className="btn" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Close' : 'Challenge'}</button>
      {open && (
        <form className="challenge-form" onSubmit={submit}>
          <fieldset disabled={sent || busy}>
            <legend>What should we look at?</legend>
            {REASONS.map((r) => (
              <label key={r.code} className="challenge-opt"><input type="radio" name="reason" value={r.code} checked={reason === r.code} onChange={() => setReason(r.code)} /> {r.label}</label>
            ))}
            <label className="challenge-note">Add a note (optional, only the site owner sees it)
              <textarea value={note} maxLength={NOTE_MAX} rows={3} onChange={(e) => setNote(e.target.value)} />
              <span className="conn-note">{note.length}/{NOTE_MAX}</span>
            </label>
            {/* A field real visitors never see: bots fill it in, and their submission is dropped. */}
            <div className="challenge-trap" aria-hidden="true"><label>Website<input tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} /></label></div>
            <button type="submit" className="btn primary">{busy ? 'Sending…' : 'Send'}</button>
          </fieldset>
          {msg && <p role="status" className="conn-note">{msg}</p>}
        </form>
      )}
    </div>
  );
}
