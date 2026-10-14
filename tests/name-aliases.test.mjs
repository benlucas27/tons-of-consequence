import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalPlayer, NAME_ALIASES } from '../src/data/name-aliases.js';
import { naturalKey } from '../src/lib/naturalKey.js';
import { ALL } from '../src/lib/dataset.js';

test('a Cricsheet spelling and the dataset spelling make the same key', () => {
  assert.equal(naturalKey({ player: 'Liton Das', year: 2022, runs: 141, opponent: 'Sri Lanka' }), naturalKey({ player: 'Litton Das', year: 2022, runs: 141, opponent: 'Sri Lanka' }));
  assert.equal(canonicalPlayer('Someone Else'), 'Someone Else');
});

test('every alias points at a spelling the dataset actually uses', () => {
  const players = new Set(ALL.map((c) => c.player));
  for (const [from, to] of Object.entries(NAME_ALIASES)) assert.ok(players.has(to), `${to} (for ${from}) is not in the dataset`);
});

test('the three results corrected from the archive stay corrected, and the Galle 109 stays a loss', () => {
  const by = (id) => ALL.find((c) => c.id === id).matchResult;
  assert.deepEqual([by(4), by(20), by(98)], ['win', 'draw', 'draw']);
  assert.equal(by(3499), 'loss'); // Sehwag's 109 at Galle: Sri Lanka won by ten wickets
});
