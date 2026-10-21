/** Reads the challenge counts and turns them into the Under review and Decided lists. Notes are never read here: they are private. */
import { sql } from './db.js';
import { REVIEW_THRESHOLD, REVIEW_STATUS, REVIEW_HIDDEN } from '../data/reviews.js';
import { BY_ID } from './dataset.js';
import { verdictOf } from './consequence.js';

const TEST_NOTE = '__test__';

/** Per innings: { id, count, reasons: { facts, situation, data, other } }, most challenged first. Null if the database is not available. */
export async function challengeCounts() {
  const db = sql();
  if (!db) return null;
  const rows = await db`SELECT innings_id, count(*)::int AS n,
      count(*) FILTER (WHERE reason_code = 'facts')::int AS facts,
      count(*) FILTER (WHERE reason_code = 'situation')::int AS situation,
      count(*) FILTER (WHERE reason_code = 'data')::int AS data,
      count(*) FILTER (WHERE reason_code = 'other')::int AS other
    FROM challenges WHERE note IS DISTINCT FROM ${TEST_NOTE}
    GROUP BY innings_id ORDER BY n DESC, innings_id`;
  return rows.map((r) => ({ id: r.innings_id, count: r.n, reasons: { facts: r.facts, situation: r.situation, data: r.data, other: r.other } }));
}

/** How firm the evidence behind a verdict is, in plain words for the list. */
export function evidenceBadge(id) {
  const v = verdictOf(id);
  if (!v) return 'No verdict yet';
  return v.confidence.key === 'high' ? 'Full match record' : 'Not a lot of data on this match';
}

export function buildReviewLists(counts) {
  const byId = new Map((counts || []).map((c) => [c.id, c]));
  const row = (id) => {
    const c = BY_ID.get(id); const v = verdictOf(id); const n = byId.get(id);
    return c ? { id, innings: c, verdict: v ? (v.passes ? 'ToC' : 'Good ton') : 'No verdict yet', evidence: evidenceBadge(id), count: n?.count || 0, reasons: n?.reasons || { facts: 0, situation: 0, data: 0, other: 0 } } : null;
  };
  const decided = Object.entries(REVIEW_STATUS).filter(([, s]) => s.status === 'decided').map(([id, s]) => ({ ...row(Number(id)), ...s })).filter((r) => r.innings);
  const decidedIds = new Set(decided.map((d) => d.id));
  const pinned = Object.entries(REVIEW_STATUS).filter(([, s]) => s.status === 'under-review').map(([id]) => Number(id));
  const ids = new Set([...pinned, ...(counts || []).filter((c) => c.count >= REVIEW_THRESHOLD).map((c) => c.id)]);
  const under = [...ids].filter((id) => !decidedIds.has(id) && !REVIEW_HIDDEN.includes(id)).map(row).filter(Boolean).sort((a, b) => b.count - a.count || a.id - b.id);
  return { under, decided, totalChallenges: (counts || []).reduce((s, c) => s + c.count, 0) };
}

/** Is this innings on the Under review list, and with how many challenges? */
export function reviewState(id, counts) {
  const { under, decided } = buildReviewLists(counts);
  const u = under.find((r) => r.id === id); if (u) return { status: 'under-review', count: u.count };
  const d = decided.find((r) => r.id === id); if (d) return { status: 'decided', outcome: d.outcome, decided: d.decided, note: d.note, count: d.count };
  return { status: 'none', count: (counts || []).find((c) => c.id === id)?.count || 0 };
}
