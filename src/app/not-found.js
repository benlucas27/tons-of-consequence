import Link from 'next/link';

export const metadata = { title: 'Not found' };

export default function NotFound() {
  return (
    <div className="empty">
      <h3>Out for a duck</h3>
      <p>We could not find that page. The link may be wrong, or the innings may have moved.</p>
      <Link className="btn primary" href="/">Back to the rankings</Link>
    </div>
  );
}
