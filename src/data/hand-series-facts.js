/**
 * Match facts found by hand from two opened sources (the Wikipedia tour page and a second page), for hundreds the tour-page
 * script could not settle. Same row as series-facts.js: id -> [result for the batter's team, Test number in the series,
 * Tests in the series, the batter's team's series lead going in (wins minus losses), 1 if the series was already decided,
 * innings of the match (1 to 4, in the order played), the team's total in that innings, the lead when that innings began,
 * the margin ('r120', 'w5', 'i13'), start date MMDD]. The sources for each id are in verdict-sources.js.
 * These win over series-facts.js (which scripts/fill-from-wikipedia-tours.mjs rewrites).
 */
export const HAND_SERIES_FACTS = {
};
