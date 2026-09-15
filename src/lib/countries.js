/**
 * Single source of truth for country code <-> full team name, shared by
 * everything that touches Cricsheet's full-name team strings (cricsheet.js,
 * the cron route) and everything that displays a code (scoring.js, page.js).
 *
 * Deliberately NOT imported by claude-plugin/mcp-server/scoring.mjs — that
 * plugin is self-contained by design (see docs/adr/0003), so it keeps its
 * own copy rather than depending on this app's src/ tree.
 */

export const NATIONS = {
  AUS: 'Australia', ENG: 'England', WI: 'West Indies', IND: 'India',
  SA: 'South Africa', PAK: 'Pakistan', NZ: 'New Zealand', SL: 'Sri Lanka',
  ZIM: 'Zimbabwe', BAN: 'Bangladesh', AFG: 'Afghanistan', IRE: 'Ireland',
};

export const FLAGS = {
  AUS: '🇦🇺', ENG: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', WI: '🏝️', IND: '🇮🇳', SA: '🇿🇦', PAK: '🇵🇰',
  NZ: '🇳🇿', SL: '🇱🇰', ZIM: '🇿🇼', BAN: '🇧🇩', AFG: '🇦🇫', IRE: '🇮🇪',
};

// Cricsheet's `info.teams` gives full names ("Australia"), not codes.
export const TEAM_NAME_TO_CODE = Object.fromEntries(
  Object.entries(NATIONS).map(([code, name]) => [name, code])
);

export function teamCodeFor(teamName) {
  return TEAM_NAME_TO_CODE[teamName] || teamName;
}
