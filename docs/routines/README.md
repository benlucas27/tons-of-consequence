# The weekly review: scan, email, reply, publish

Built 19 Nov 2026. It keeps the site current during a Test series without anyone's laptop being open.

```
Tuesday 8am Sydney    Cloud routine "ToC weekly scan"
                      finds Tests played or under way, lists what the site is missing or has wrong,
                      emails the list to Ben's own inbox (a numbered list he can answer in a reply)
Ben replies           "1 y / 2 n / 3 y" (any time, from any device)
7:30am and 7:30pm     Cloud routine "ToC apply replies"
                      reads the reply, edits src/data/sample.js for the items he approved, runs the tests,
                      pushes a branch called claude/toc-approved-<date>, and replies in the thread
GitHub (a minute)     .github/workflows/publish-approved.yml checks the branch only touches the dataset,
                      refreshes verdicts, runs the tests and the build, then puts the change on main
Vercel                deploys main
```

Nothing goes live without a reply that approves it, and nothing the reply says is ever run as an instruction.

## What can be approved

Only three kinds of item exist (`src/lib/reviewApply.js`):

| Item | What it does |
| --- | --- |
| `add_innings` | Adds a finished hundred the site lacks. Levers and the story are the usual automatic estimates; a verdict comes from the normal build. |
| `settle_result` | Changes a row marked "live" (In progress) to its final result once the Test has finished. |
| `set_featured` | Moves the Latest century card to a chosen innings. |

Rulings, stories, names and everything else still go through Ben the usual way.

## The reply

One answer per line, in `src/lib/reviewReply.js`'s grammar: `1 y`, `2 n`, `1, 3 y`, `1-3 y`, `all y`, `all n`. Words after the answer are kept as a note. Anything that does not fit is ignored, and unanswered items are left alone. Only the text above the quoted original is read. Replies from the review email's own thread only.

## Safety, in layers

1. Items are fixed in the review email Ben received. A reply can only approve or decline them, never add or change one.
2. `buildRow` validates every field (known teams, 100 or more, balls, year from 2026, result, not already on the site) and a refused item changes nothing.
3. The apply routine only commits `src/data/sample.js`; the publish workflow refuses a branch that changes any other file.
4. The tests, the build and `check-verdict-flips.mjs` (no existing yes/no may change) must pass before main is touched.
5. Failures publish nothing, leave the branch in place, and GitHub emails the failure.

## Files

- `weekly-scan.md`, `weekly-apply.md`: the instructions each cloud routine follows (the routine prompts just point here).
- `scripts/weekly-review-context.mjs`: what the site holds now (used by the scan).
- `scripts/weekly-review-apply.mjs`: applies a reply to a review file (used by the apply routine; `--write` to save).
- `tests/weekly-review.test.mjs`: the reply grammar and the apply logic.

## Running or changing it

Routines live at https://claude.ai/code/routines (pause, edit the schedule, run now). To try the apply step on a made-up review without touching the site, run
`node scripts/weekly-review-apply.mjs --review review.json --reply reply.txt` (no `--write`).
