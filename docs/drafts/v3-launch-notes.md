# Consequence rules v3: what is on the `consequence-v3` branch and how to launch it

Branch `consequence-v3` (pushed, not merged; the live site still runs the old rules). Everything below is built, tested (107 tests), linted and builds.

## What it does
- `src/lib/consequenceModel.js`: the gated and weighted rules. Gate: a win, or a draw that saved the match in a live series; never a loss; a dead rubber only if his side had won the series and won the match. Then points for need, carry, chase and close finish, series stakes, tempo (over 90 or under 40 with 250+ balls), occasion (Boxing Day, New Year, tribute, emotional, farewell, comeback), minus points when the match was already safe or the innings was shared. Threshold 38.
- `scripts/build-consequence.mjs` applies it **only where the answer is firm** (a ton in at least 90% of 300 runs with the weights nudged, or a good ton in at least 90%). Borderline hundreds keep today's verdict (ball-by-ball ones) or have no verdict (partial ones) and go to the review queue (`docs/drafts/review-queue.json`).
- Ben's own rulings, the Bradman verdicts and the older hand rulings are never overwritten.
- New evidence level `p` (partial: result, innings, team total and series, no entry state) shown as "Medium confidence".
- Occasions register: `src/data/occasions.js` (Hughes tributes added; more to come).

## Effect (before the final review)
- 3,477 hundreds with a verdict, up from 2,020 (1,457 are new, partial evidence).
- 643 tons of consequence, up from 452 (339 of 1,739 ball-by-ball, 176 of 1,457 partial).
- 49 ball-by-ball verdicts change (32 to a ton, 17 to a good ton).
- 375 borderline hundreds queued.
- Root has 5 tons.

## To launch
1. Ben finishes the tick pages (final review, four batters, tempo, draws and losses) and Claude records the answers as rulings, which override the model.
2. Rebuild (`node scripts/build-consequence.mjs <cricsheet folder>`), `npm test`, `npm run build`.
3. Merge `consequence-v3` to `main` and push. To roll back, revert the merge commit.
