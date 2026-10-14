/**
 * Who was the home side in a Cricsheet Test match? From the series name ("England tour of Australia", "New Zealand in
 * England") where it says, otherwise from the ground (a side that played nearly every match there is its home).
 * Returns the home team's name, or null when the match was on neutral ground (a final, or the UAE) or cannot be told.
 */
const NEUTRAL_GROUNDS = /Dubai|Sheikh Zayed|Abu Dhabi|Sharjah/;

export function hostOf(match, venueCounts) {
  const { teams, venue, event } = match.info;
  const e = event?.name || '';
  if (/World Test Championship/.test(e) && /final/i.test(e)) return null;
  if (NEUTRAL_GROUNDS.test(venue || '')) return null;
  const fromEvent = hostFromEvent(match.info);
  if (fromEvent) return fromEvent;
  const v = venueCounts[venue];
  if (v) {
    // a trophy series (the Ashes, the Border-Gavaskar Trophy) does not name the host: use who hosts at this ground in tours
    const known = Object.entries(v.hosts || {}).sort((a, b) => b[1] - a[1])[0];
    if (known && teams.includes(known[0])) return known[0];
    const ranked = Object.entries(v.teams).sort((a, b) => b[1] - a[1]);
    if (v.n >= 2 && ranked[0][1] / v.n >= 0.9 && (!ranked[1] || ranked[1][1] / v.n <= 0.5) && teams.includes(ranked[0][0])) return ranked[0][0];
  }
  return null;
}

/** How many matches each ground has hosted, and by whom, across a set of matches. */
export function countVenues(matches) {
  const out = {};
  for (const m of matches) {
    const v = (out[m.info.venue] ??= { n: 0, teams: {}, hosts: {} });
    v.n += 1;
    for (const t of m.info.teams) v.teams[t] = (v.teams[t] || 0) + 1;
    // matches whose series name says who the host was (a tour) tell us who the ground belongs to
    const h = hostFromEvent(m.info);
    if (h) v.hosts[h] = (v.hosts[h] || 0) + 1;
  }
  return out;
}

function hostFromEvent({ teams, event }) {
  const m = (event?.name || '').match(/^(.+?) (?:tour of|in) (.+?)(?: Test Series| Tests?| Series)?$/);
  return m ? m[2].split(/ and |, /).map((s) => s.trim()).find((s) => teams.includes(s)) || null : null;
}

/** 'H' home, 'A' away or 'N' neutral for the side that was batting. */
export function wherePlayed(match, venueCounts, battingTeam) {
  const host = hostOf(match, venueCounts);
  if (!host) return 'N';
  return host === battingTeam ? 'H' : 'A';
}
