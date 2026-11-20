# The weekly scan: add the hundreds, email the ToC watch

Built 19 Nov 2026, changed 20 Nov 2026 at Ben's direction: a hundred being scored is enough to add it to the site, so it is
added automatically once its facts are verified. Being a ton of consequence (ToC) is a separate question, and the only email
Ben gets is the ToC watch. It keeps the site current during a Test series without anyone's laptop being open.

```
Tuesday 8am Sydney    Cloud routine "ToC weekly scan"
                      finds every Test since the site's newest hundred, verifies each hundred (finished innings, two
                      sources agree on the runs, a scorecard gives the balls), edits src/data/sample.js through
                      scripts/weekly-review-apply.mjs, runs the tests, pushes a branch called claude/toc-approved-<date>
                      then emails Ben the "ToC watch": only the hundreds that could be a ToC, with whether they pass the
                      rules (scripts/weekly-toc-preview.mjs) and what is recommended
GitHub (a few minutes) .github/workflows/publish-approved.yml checks the branch only touches the dataset,
                      refreshes verdicts, runs the tests and the build, then puts the change on main
Vercel                deploys main
```

No reply is needed. The "ToC apply replies" routine (`weekly-apply.md`) is switched off: it is kept for when Ben wants to
approve a ruling by email, which does not exist yet. The reply grammar and `src/lib/reviewReply.js` are used by the apply
script's tests and by that future step.

The ToC preview (`src/lib/tocPreview.js`) is a recommendation from match-report facts, never a verdict. The site's own verdict
is built by the workflow from Cricsheet's ball-by-ball record when it has the match, and Ben's hand rulings
(`src/data/consequence-overrides.js`) win over both.

## What the scan can change

Only three kinds of item exist (`src/lib/reviewApply.js`):

| Item | What it does |
| --- | --- |
| `add_innings` | Adds a finished hundred the site lacks. Levers and the story are the usual automatic estimates; a verdict comes from the normal build. |
| `settle_result` | Changes a row marked "live" (In progress) to its final result once the Test has finished. |
| `set_featured` | Moves the Latest century card to the newest finished hundred. |

Rulings, stories, names and everything else still go through Ben the usual way.

## The reply

One answer per line, in `src/lib/reviewReply.js`'s grammar: `1 y`, `2 n`, `1, 3 y`, `1-3 y`, `all y`, `all n`. Words after the answer are kept as a note. Anything that does not fit is ignored, and unanswered items are left alone. Only the text above the quoted original is read. Replies from the review email's own thread only.

## Safety, in layers

1. A hundred is added only when its innings is finished, two allowed sources agree on the runs and a scorecard gives the balls. At most 20 per run.
2. `buildRow` validates every field (known teams, 100 or more, balls, year from 2026, result, not already on the site) and a refused item changes nothing.
3. The scan only commits `src/data/sample.js`; the publish workflow refuses a branch that changes any other file.
4. The tests, the build and `check-verdict-flips.mjs` (no existing yes/no may change) must pass before main is touched.
5. Failures publish nothing, leave the branch in place, and GitHub emails the failure.

## Files

- `weekly-scan.md`, `weekly-apply.md`: the instructions each cloud routine follows (the routine prompts just point here). `weekly-apply.md` is paused.
- `scripts/weekly-review-context.mjs`: what the site holds now (used by the scan).
- `scripts/weekly-review-apply.mjs`: applies review items to the dataset (used by the scan; `--write` to save).
- `scripts/weekly-toc-preview.mjs`, `src/lib/tocPreview.js`: apply the ToC rules to the hundreds found, for the email; `--site` lists the site's own verdicts.
- `tests/weekly-review.test.mjs`, `tests/toc-preview.test.mjs`: the reply grammar, the apply logic and the ToC preview.

## Running or changing it

Routines live at https://claude.ai/code/routines (pause, edit the schedule, run now). To try the apply step on a made-up review without touching the site, run
`node scripts/weekly-review-apply.mjs --review review.json --reply reply.txt` (no `--write`), where `reply.txt` holds `all y`.
