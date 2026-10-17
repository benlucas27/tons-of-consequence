import Link from 'next/link';

/** The round stamp for a ton of consequence. `small` is the compact version used on ranking rows. */
export function Stamp({ size = 96 }) {
  return (
    <svg className="toc-stamp" width={size} height={size} viewBox="0 0 120 120" role="img" aria-label="Ton of consequence">
      <defs><path id="stamp-arc" d="M60 60 m-44 0 a44 44 0 1 1 88 0 a44 44 0 1 1 -88 0" /></defs>
      <circle cx="60" cy="60" r="57" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="60" cy="60" r="51" fill="none" stroke="currentColor" strokeWidth="1" />
      <text fontFamily="var(--display), sans-serif" fontSize="14" fontWeight="700" letterSpacing="2.4" fill="currentColor">
        <textPath href="#stamp-arc" startOffset="0">TON OF CONSEQUENCE · TON OF CONSEQUENCE ·</textPath>
      </text>
      <text x="60" y="73" textAnchor="middle" fontFamily="var(--display), sans-serif" fontSize="40" fontWeight="700" fill="currentColor">ToC</text>
    </svg>
  );
}

/** "Was it a ton of consequence?" for one innings: the stamp and the reason, or why not, or that we cannot say yet. */
export default function ConsequenceNote({ verdict }) {
  if (!verdict) {
    return (
      <section className="toc-note toc-note-none">
        <h2 className="sec-t">Was it a ton of consequence?</h2>
        <p><b>Not enough match data yet to say.</b> We have not found enough about this match (the result, which innings it was and where the series stood) to call it either way. <Link href="/tons-of-consequence">How a ToC is decided</Link></p>
      </section>
    );
  }
  return (
    <section className={`toc-note ${verdict.passes ? 'toc-note-yes' : ''}`}>
      <h2 className="sec-t">Was it a ton of consequence?</h2>
      <div className="toc-note-body">
        {verdict.passes && <Stamp />}
        <p>
          <b>{verdict.passes ? `Yes: ${verdict.scenario.toLowerCase()}.` : 'No: a good ton.'}</b> {verdict.because}{' '}
          <Link href="/tons-of-consequence">How a ToC is decided</Link>
        </p>
      </div>
      {verdict.press?.length > 0 && (
        <p className="toc-conf"><b>Called one of the greats:</b>{' '}
          {verdict.press.map((a, i) => <span key={a.url}>{i > 0 && '; '}<a href={a.url} target="_blank" rel="noopener noreferrer">{a.title}</a> ({a.source})</span>)}
        </p>
      )}
      {verdict.sources?.length > 0 && (
        <p className="toc-conf"><b>Sources:</b>{' '}
          {verdict.sources.map((a, i) => <span key={a.url}>{i > 0 && ' · '}<a href={a.url} target="_blank" rel="noopener noreferrer">{a.label}</a></span>)}
        </p>
      )}
      {verdict.confidence && <p className="toc-conf"><b>{verdict.confidence.label}.</b> {verdict.confidence.note}</p>}
    </section>
  );
}
