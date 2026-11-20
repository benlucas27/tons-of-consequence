/**
 * Reads Ben's emailed reply to the weekly review.
 *
 * The review email lists numbered items. A reply answers them in a tiny, strict grammar, one answer per line:
 *
 *   1 y                   approve item 1
 *   2 n                   decline item 2
 *   1, 3 y                approve items 1 and 3
 *   1-3 y                 approve items 1, 2 and 3
 *   all y                 approve everything (an explicit "n" for an item still wins)
 *   all n                 decline everything
 *   4 y  any words here   the words after the answer are kept as a note and never treated as an instruction
 *
 * Only the text above the quoted original is read. Anything that does not fit the grammar is ignored, so a reply can
 * never do more than approve or decline items that were already listed in the review.
 */

const YES = '(?:y|yes|approve|approved|ok|okay|go|publish)';
const NO = '(?:n|no|skip|reject|decline|hold)';
const NUMS = '(\\d+(?:\\s*-\\s*\\d+)?(?:\\s*(?:,|&|and)\\s*\\d+(?:\\s*-\\s*\\d+)?)*)';
const LINE = new RegExp(`^\\s*(?:${NUMS}|(all|everything))\\s*[:=\\-\u2013\u2014]?\\s*(${YES}|${NO})\\b[\\s.,!:\\-\u2013\u2014]*(.*)$`, 'i');

/** Everything above the first sign of a quoted earlier message. */
export function freshText(text) {
  const out = [];
  for (const line of String(text || '').replace(/\r/g, '').split('\n')) {
    if (/^\s*>/.test(line)) break;
    if (/^\s*On .{5,200}wrote:\s*$/i.test(line)) break;
    if (/^\s*-{2,}\s*(Original Message|Forwarded message)/i.test(line)) break;
    if (/^\s*(From|Sent|Date):\s.+/i.test(line) && out.some((l) => l.trim())) break;
    out.push(line);
  }
  return out.join('\n');
}

function expand(spec) {
  const nums = [];
  for (const part of spec.split(/\s*(?:,|&|and)\s*/i)) {
    const m = part.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) {
      const [a, b] = [Number(m[1]), Number(m[2])];
      if (b >= a && b - a < 100) for (let i = a; i <= b; i++) nums.push(i);
    } else if (/^\d+$/.test(part)) nums.push(Number(part));
  }
  return nums;
}

/**
 * @param {string} text  the reply email body
 * @param {number[]} itemNumbers  the item numbers that exist in the review
 * @returns {{ decisions: Record<number, 'y'|'n'>, notes: Record<number,string>, ignored: string[] }}
 */
export function parseReply(text, itemNumbers) {
  const valid = new Set(itemNumbers);
  const decisions = {};
  const notes = {};
  const ignored = [];
  let allDecision = null;

  const handle = (line) => {
    const m = line.match(LINE);
    if (!m) { ignored.push(line); return; }
    const [, spec, all, word, rest] = m;
    const d = new RegExp(`^${YES}$`, 'i').test(word) ? 'y' : 'n';
    // "1 y 2 n" on one line: what follows is another answer, not a note.
    const more = LINE.test(rest.trim()) && /^\d|^all|^everything/i.test(rest.trim());
    if (all) allDecision = d;
    else {
      const nums = expand(spec).filter((n) => valid.has(n));
      if (!nums.length) { ignored.push(line); return; }
      for (const n of nums) {
        decisions[n] = d;
        if (!more && rest.trim()) notes[n] = rest.trim().slice(0, 280);
      }
    }
    if (more) handle(rest.trim());
  };
  for (const raw of freshText(text).split('\n')) {
    const line = raw.trim();
    if (line) handle(line);
  }
  if (allDecision) for (const n of valid) if (!(n in decisions)) decisions[n] = allDecision;
  return { decisions, notes, ignored };
}
