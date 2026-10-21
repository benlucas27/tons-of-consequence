# Share card design brief

Cards are built live by `src/lib/cards/build.js` (shapes and layout), `theme.js` (sizes, colours) and the route `src/app/card/route.js`. They render with next/og (Satori), which only supports flexbox, no grid, no repeating gradients, and a limited set of CSS. A design is only useful if it can be built that way.

## Sizes that matter
- **Square 1080 x 1080** and **4:5 portrait 1080 x 1350**: the feed formats (Instagram, Facebook, X, WhatsApp, Reddit).
- **Wide 1200 x 630**: link previews only.
- No 9:16 story size.

## Card types
batter, innings, compare (2 or 3 batters), ToC leaderboard (by ToCs or by share), top hundreds list, the 13 laws (all, or one law).

## What is wrong now
- Tiles feel flat and the green is not engaging as a social tile.
- Some layouts leave large empty areas (leaderboard, laws, compare in portrait).
- Compare in portrait should be rethought (it currently uses three narrow columns).

## Must keep
- The wording "ToC" / "ToCs" (capital T, o, capital C) and "A ton of consequence".
- Real numbers pulled live. Nothing hard coded.
- The weighting bar and name on innings and top-list cards, and the small "Data as of" date.
- The site name and domain on every card.
- The dot strip (gold = ToC, green-grey = good ton, outline = not measured) on batter and compare cards.

## Imagery
- No AI generated images.
- Photos of players are wanted later, only from sources that allow reuse (for example Wikimedia Commons) with the licence and credit recorded per image. Do not pull from Google Images. Design the layouts so a photo can sit behind or beside the numbers and still read well without one.

## Output wanted
1. Mock-ups of each card type at square and 4:5 (wide where it differs), designed for how people actually see them on a phone feed.
2. Then port the winning design into `build.js` and check each card renders (`/card?type=...&size=...`), lint and tests pass.
3. Do not merge or push: work on the `share-cards` branch.
