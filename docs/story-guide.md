# Writing a story for an innings

A story on this site is **a set of facts that can be shown**. If we can't point to where it came from, it doesn't go in.

## What every innings shows by default

A facts-only line built from our own data, for example:
"Brian Lara made 375 off 538 balls against England at St John's in 1994."
There is nothing to source, because it only repeats the scorecard. Most innings stay like this.

## A sourced story

A short note, 80 to 600 characters and at most five sentences, that adds what the scorecard doesn't say: what was at stake, how
the match went, what the innings did. Rules:

1. **At least two https sources**, ideally from different publishers (a match report, the Wisden almanack, a Wikipedia
   series page, a newspaper). Check each page says what you wrote. The link goes under the story with a label.
2. **Facts, not opinion.** No "greatest", "legendary", "stunning", "unforgettable". If a source calls it that, say who did:
   "Wisden called it...". Don't use exclamation marks or questions.
3. **State the score** and name the batter, and say who it was against or when.
4. **Don't name bowlers** unless a source does. The old generator guessed bowler names by team, not era, and most were wrong.
5. **Say less.** One true sentence beats three hopeful ones. Leave out anything you can't source.
6. **Dates, scores and margins** must match the scorecard on the innings page. If a source disagrees with our data, tell Ben.

## How to add one

Find the next innings that needs one (top of the ranking first):

    node scripts/story-queue.mjs 10

Check a draft, then save it (nothing is written if a rule fails):

    node scripts/set-story.mjs 1451 --text "..." --source "https://...|Publisher: page" --source "https://...|Publisher: page"

`--check` tests without saving; `--clear` goes back to the facts-only line. Run `npm test` before committing.

## Hand-written stories without sources

None are left (17 Oct 2026). The old hand-written stories either now have two sources (the Bradman innings, Renshaw's 190 and Warner's 253) or were replaced by the facts-only line, because they carried flourishes that could not be sourced: made-up venue lore, bowler names guessed by team, and in one case a wrong claim (Warner's 253 was off 286 balls, not the fastest double century). Do not add a story without two sources.
