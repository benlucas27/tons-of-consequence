/** Sorting and filtering for the ToCs leaderboard rows (see batterBoard.js). Pure, so the page and the share cards agree. */
export const SORTS = {
  tons: { label: 'Most ToCs', needsMin: false },
  share: { label: 'Highest ToC share', needsMin: true },
  peak: { label: 'Best single innings', needsMin: false },
  wins: { label: 'Team win rate', needsMin: true },
};

export function sortBoard(rows, { sort = 'tons', min = 8, query = '' } = {}) {
  const needle = query.trim().toLowerCase();
  const floor = SORTS[sort].needsMin ? min : 0;
  const ok = rows.filter((r) => r.hundreds > 0 && (!needle || r.name.toLowerCase().includes(needle))
    && (sort === 'wins' ? r.resultsKnown >= floor : sort === 'share' ? r.measured >= floor : true)
    && (sort !== 'tons' || r.measured > 0 || needle));
  const key = {
    tons: (r) => [r.tons, r.measured ? r.tons / r.measured : 0],
    share: (r) => [r.measured ? r.tons / r.measured : 0, r.tons],
    peak: (r) => [r.peak ? r.peak.score : 0, r.tons],
    wins: (r) => [r.resultsKnown ? r.wins / r.resultsKnown : 0, r.resultsKnown],
  }[sort];
  return ok.sort((a, b) => { const x = key(a), y = key(b); return y[0] - x[0] || y[1] - x[1] || a.name.localeCompare(b.name); });
}
