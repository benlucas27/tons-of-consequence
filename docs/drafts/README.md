# docs/drafts

Working notes and data for the Tons of Consequence rules and reviews.

- `consequence-rules-v3.md`, `consequence-trial.md`, `consequence-whatif.md`, `consequence-definition.md`, `v3-launch-notes.md`, `opposition-strength.md`: how the rules were designed and tested.
- `review-queue.json`, `review-rerun.json`, `scores.json`: written by `scripts/build-consequence.mjs` every time it runs (the first lists hundreds too close to call, the second the hand rulings the laws disagreed with, the third what the rules scored every hundred). A test reads `review-rerun.json`.
- `womens-test-hundreds.txt`: the 121 women's Test hundreds (source: Wikipedia), behind `src/data/womens-hundreds.js`.
- `archive/`: the review lists and proposals used to build the yes/no pages in October 2026. Nothing reads them; they are kept as a record of what was shown.

Ben's rulings live in `src/data/consequence-overrides.js` (ball-by-ball hundreds, `final: true` for the review rulings) and `src/data/final-older-rulings.js` (everything else). If the two disagree, the second wins.
