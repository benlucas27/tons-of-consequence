'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { REASONS, NOTE_MAX } from '@/lib/challengeOptions';

/** One button, "Challenge this", that opens a pop-up with the tick boxes and a box for a note. Also shows the Under review chip when the innings is on the list. */
export default function ChallengeButton({ id }) {
  const dialog = useRef(null);
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

  const open = () => { setMsg(''); dialog.current?.showModal(); };
  const close = () => dialog.current?.close();

  async function submit(e) {
    e.preventDefault();
    if (!reason) { setMsg('Tick what we should look at.'); return; }
    setBusy(true); setMsg('');
    try {
      const res = await fetch('/api/challenge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ inningsId: id, reason, note, website: trap }) });
      const out = await res.json();
      if (!out.ok) { setMsg(out.error || 'Could not send that.'); setBusy(false); return; }
      setSent(true);
      setState((s) => ({ ...(s || {}), count: out.count || ((s && s.count) || 0) }));
      setMsg(`Added. ${out.count} ${out.count === 1 ? 'person has' : 'people have'} challenged this call.`);
    } catch { setMsg('Could not send that. Try again in a moment.'); }
    setBusy(false);
  }

  const underReview = state && state.status === 'under-review';
  const decided = state && state.status === 'decided';
  return (
    <div className="challenge-box">
      {underReview && <p className="challenge-chip"><Link href="/reviews">Under review</Link> · {state.count} {state.count === 1 ? 'challenge' : 'challenges'}</p>}
      {decided && <p className="challenge-chip challenge-decided"><Link href="/reviews">Reviewed {state.decided || ''}: {state.outcome === 'changed' ? 'changed' : state.outcome === 'no-call' ? 'no call' : 'stands'}</Link>{state.note ? ` · ${state.note}` : ''}</p>}
      <button type="button" className="btn challenge-btn" onClick={open}>Challenge this</button>

      <dialog ref={dialog} className="challenge-dialog" onClick={(e) => { if (e.target === dialog.current) close(); }} aria-labelledby={`challenge-title-${id}`}>
        <form className="challenge-form" onSubmit={submit}>
          <div className="challenge-head">
            <h2 id={`challenge-title-${id}`}>Challenge this call</h2>
            <button type="button" className="challenge-x" onClick={close} aria-label="Close">×</button>
          </div>
          <fieldset disabled={sent || busy}>
            <legend>What should we look at?</legend>
            {REASONS.map((r) => (
              <label key={r.code} className={`challenge-tick ${reason === r.code ? 'on' : ''}`}>
                <input type="radio" name="reason" value={r.code} checked={reason === r.code} onChange={() => setReason(r.code)} />
                <span className="challenge-box-mark" aria-hidden="true" />
                <span>{r.label}</span>
              </label>
            ))}
            <label className="challenge-note">Add a note <span>(optional, only the site owner sees it)</span>
              <textarea value={note} maxLength={NOTE_MAX} rows={4} onChange={(e) => setNote(e.target.value)} />
              <span className="challenge-count">{note.length}/{NOTE_MAX}</span>
            </label>
            {/* A field real visitors never see: bots fill it in, and their submission is dropped. */}
            <div className="challenge-trap" aria-hidden="true"><label>Website<input tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} /></label></div>
            <button type="submit" className="btn primary challenge-send">{busy ? 'Sending…' : 'Send'}</button>
          </fieldset>
          {msg && <p role="status" className={`challenge-msg ${sent ? 'ok' : ''}`}>{msg}</p>}
          {sent && <button type="button" className="btn" onClick={close}>Done</button>}
        </form>
      </dialog>
    </div>
  );
}
