import Link from 'next/link';
import { LEVER_BY_KEY } from '@/lib/scoring';
import { rankingsPath } from '@/lib/dataset';

/** One line saying which weighting the page is scored on, with a way to change it. */
export default function WeightNote({ order }) {
  return (
    <p className="wnote">
      <span>Scored on your weighting:</span>
      {order.map((k, i) => (
        <span key={k} className="wn" style={{ '--c': LEVER_BY_KEY[k].color }}>
          <i aria-hidden="true" />{LEVER_BY_KEY[k].short}{i < order.length - 1 ? ' ›' : ''}
        </span>
      ))}
      <Link className="link-btn" href={rankingsPath(order)}>Change it</Link>
    </p>
  );
}
