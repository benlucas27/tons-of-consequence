import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRecordsQuestion, batterRecords } from '../src/lib/records.js';

test('counting questions become filters, and ranking questions are left to ask', () => {
  assert.equal(parseRecordsQuestion('Who has the most tons of consequence?').filters.sortBy, 'tonsOfConsequence');
  const away = parseRecordsQuestion('Most hundreds away from home').filters;
  assert.equal(away.where, 'away');
  const strong = parseRecordsQuestion('Who has scored the most hundreds against strong opposition?').filters;
  assert.equal(strong.oppositionTier, 1);
  assert.equal(parseRecordsQuestion('Who has the most hundreds against Australia?').filters.opposition, 'Australia');
  assert.equal(parseRecordsQuestion('How many of Steve Smith\'s hundreds were tons of consequence?').filters.batter, 'Steve Smith');
  assert.equal(parseRecordsQuestion('Best centuries by India since 2010'), null);
  assert.equal(parseRecordsQuestion('Top 10 Test centuries'), null);
});

test('the records leaderboard counts and warns where the data is partial', () => {
  const r = batterRecords({ sortBy: 'tonsOfConsequence', limit: 3 });
  assert.equal(r.results.length, 3);
  assert.ok(r.caveat);
  const smith = batterRecords({ batter: 'Steve Smith', limit: 1 }).results[0];
  assert.equal(smith.hundreds, 37);
  assert.throws(() => batterRecords({ country: 'Atlantis' }), /Unknown country/);
});
