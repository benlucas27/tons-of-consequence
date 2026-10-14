/**
 * Videos for the top-ranked innings, keyed by innings id. Each link was checked against YouTube on
 * 14 October 2026 (it exists, and whether the uploader allows embedding).
 *
 *   kind   'innings' = the video is about this innings (highlights, a film clip, a feature)
 *          'match'   = highlights of the whole Test, which includes other play
 *   embed  false when the uploader has switched embedding off, so the page links out instead
 *
 * No video is listed for an innings unless one was found and checked. Many from before the 1950s
 * have no footage at all. Re-check the links with `node scripts/check-videos.mjs`.
 */
export const VIDEOS = {
  1142: { yt: 'wWWNIXXRY4I', kind: 'innings', embed: true, channel: 'Greatest Cricket Videos - Hall Of Fame', mins: 21, note: 'Extended highlights of the innings' },
  1823: { yt: 'HrIew7-4isI', kind: 'innings', embed: true, channel: 'England & Wales Cricket Board', mins: 5, note: 'Day 4 highlights: the innings that won the Test' },
  413: { yt: 'x8kSHGhXJzw', kind: 'innings', embed: true, channel: 'Baroda Sports', mins: 4, note: 'Highlights, with the crowd on the field' },
  1075: { yt: 'un5qyh_eXCw', kind: 'innings', embed: true, channel: 'England & Wales Cricket Board', mins: 10, note: 'The game-saving 156, in the ECB\'s words' },
  1451: { yt: 'K7JlaKMRccI', kind: 'innings', embed: true, channel: 'England & Wales Cricket Board', mins: 5, note: 'Day 1 highlights of the innings' },
  124: { yt: '4zk_Ek4WW2s', kind: 'innings', embed: true, channel: 'Bibhuti Bhusan', mins: 9, note: 'Highlights of the innings' },
  9: { yt: 'g4is8aweY_Y', kind: 'innings', embed: true, channel: 'Akhuwat News', mins: 5, note: 'A short feature on the innings' },
  13: { yt: 'uxgpGs6JONM', kind: 'innings', embed: true, channel: 'DM Mordecai', mins: 1, note: 'Film clip from day one, when Bradman reached 309 not out' },
  38: { yt: 'jXSjWURZjFg', kind: 'innings', embed: true, channel: 'DM Mordecai', mins: 16, note: 'Highlights, with John Arlott commentating' },
  334: { yt: 'YYq0QDBS3_Q', kind: 'innings', embed: true, channel: 'suhass997 Cricket', mins: 20, note: 'The innings, at length' },
  7: { yt: 'uJgFCjHdqSw', kind: 'innings', embed: true, channel: 'Surrey County Cricket Club', mins: 3, note: 'Highlights of the highest Test score at The Oval' },
  4599: { yt: 'o8S-bwdD7F0', kind: 'innings', embed: true, channel: 'cricket.com.au', mins: 14, note: 'Day 2 highlights' },
  204: { yt: 'ETOjd_qH2JY', kind: 'innings', embed: true, channel: 'Star Sports', mins: 7, note: 'Highlights of the double hundred' },
  1118: { yt: 'glzYaI9D4rc', kind: 'innings', embed: true, channel: 'England & Wales Cricket Board', mins: 8, note: 'Official highlights of the innings' },
  1275: { yt: 'e0SzreAH6Vg', kind: 'match', embed: false, channel: 'cricket.com.au', mins: 25, note: 'Full highlights of the Hobart Test' },
  245: { yt: 'pFgbOoh1qRI', kind: 'innings', embed: true, channel: 'DM Mordecai', mins: 15, note: 'Highlights, from Richie Benaud\'s 25 Not Out' },
  43: { yt: 'fq8uPo_-h-U', kind: 'match', embed: true, channel: 'British Movietone', mins: 1, note: 'Newsreel clip from the Test (1957)' },
  3: { yt: '66g3xXjOfLM', kind: 'innings', embed: true, channel: 'Cricket\'s Classics', mins: 7, note: 'Highlights of the innings' },
  16: { yt: 'UG9ozcG2KgE', kind: 'innings', embed: true, channel: 'cricket.com.au', mins: 6, note: 'From the Vault: the record-breaking 329*' },
  202: { yt: 'O6ubyMVgY3w', kind: 'innings', embed: true, channel: 'suhass997 Cricket', mins: 30, note: 'Highlights of the innings' },
  35: { yt: 'IZDCyNVPsp0', kind: 'innings', embed: true, channel: '1News', mins: 1, note: 'News clip on the anniversary of the innings' },
  215: { yt: 'jxN0lQKNVxg', kind: 'innings', embed: true, channel: 'cricket.com.au', mins: 12, note: 'Taylor and Marsh\'s opening stand of 329' },
  33: { yt: 'YTTbChrk8q0', kind: 'innings', embed: true, channel: 'New Zealand Cricket', mins: 7, note: 'Every boundary' },
  29: { yt: 'H4ksTjY1nUo', kind: 'innings', embed: true, channel: 'DM Mordecai', mins: 2, note: 'Film clips from day two, when Bradman was 271 not out' },
  714: { yt: 'YHM2pjO-4Uk', kind: 'innings', embed: true, channel: 'Jimmy Pince', mins: 7, note: 'Highlights of the innings' },
  8: { yt: 'lMyVgt_a-BM', kind: 'innings', embed: true, channel: 'Cricket Sping', mins: 20, note: 'Highlights of the innings' },
  14: { yt: 'L9xzimk4JNQ', kind: 'innings', embed: true, channel: 'Lord\'s Cricket Ground', mins: 17, note: 'Highlights from Lord\'s' },
  44: { yt: 'UShMdrfMk8Y', kind: 'match', embed: true, channel: 'The Cricket Legacy', mins: 9, note: 'Highlights of the Kolkata Test' },
  32: { yt: 'owGWemDHA-o', kind: 'innings', embed: true, channel: 'Brother Anansi and Talk Caribbean', mins: 14, note: 'A retelling of the innings' },
  51: { yt: '0o2tGucp3EM', kind: 'innings', embed: true, channel: 'robelinda', mins: 26, note: 'Footage of the innings' },
};
