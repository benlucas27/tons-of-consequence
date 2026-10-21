import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFeed, FEED_SCHEMA } from '../src/lib/feed.js';

test('feed is valid JSON with the expected shape', () => {
  const { json, version, counts } = buildFeed();
  const feed = JSON.parse(json);
  assert.equal(feed.schema, FEED_SCHEMA);
  assert.equal(feed.version, version);
  assert.ok(feed.counts.hundreds > 4000 && feed.counts.tons > 300);
  assert.equal(feed.data.sample.SAMPLE_CENTURIES.length, counts.hundreds);
  assert.equal(feed.data['ton-ids'].TON_IDS.$set.length, counts.tons);
});

test('feed version only changes when the data does', () => {
  assert.equal(buildFeed().version, buildFeed().version);
});
