import { BIASES } from '@/lib/scoring';

/** Says plainly that a bonus is on, so a score never moves without telling the reader why. */
export default function BiasNote({ bias, onTurnOff }) {
  const b = BIASES[bias];
  if (!b) return null;
  return (
    <div className="bias-note" role="note">
      <span><b>{b.name} is on.</b> {b.note} Every score on this page includes it.</span>
      {onTurnOff && <button type="button" className="link-btn" onClick={onTurnOff}>Turn it off</button>}
    </div>
  );
}
