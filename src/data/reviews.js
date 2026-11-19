/**
 * The review list. Visitors challenge a call from an innings page; challenges are stored in the database (the `challenges`
 * table) and counted. Nothing here changes a verdict: only a ruling in the rulings files does that.
 *
 * An innings shows on /reviews as "under review" once it has REVIEW_THRESHOLD challenges, or as soon as it is listed in
 * REVIEW_STATUS with status 'under-review'. Decided ones move to the Decided list with a short public note.
 */
export const REVIEW_THRESHOLD = 3;

/** id -> { status: 'under-review' | 'decided', outcome: 'stands' | 'changed' | 'no-call', decided: 'YYYY-MM-DD', note: short public note } */
export const REVIEW_STATUS = {
  3333: { status: 'decided', outcome: 'changed', decided: '2026-10-29', note: 'Ruled a ton of consequence: South Africa were 4 for 45 chasing 430 and he batted 376 balls on debut to save the Test.' },
  413: { status: 'decided', outcome: 'stands', decided: '2026-10-29', note: 'Stands. Australia were 3 for 73 when he came in and the Waughs added 231 to win the decider.' },
};

/** Innings never shown on the list, however many challenges they get. */
export const REVIEW_HIDDEN = [];
