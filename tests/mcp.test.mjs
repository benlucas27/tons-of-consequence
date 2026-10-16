import test from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createServer, resolveWeighting } from '../src/lib/mcp.js';
import { PRESETS } from '../src/lib/scoring.js';

async function connect() {
  const [a, b] = InMemoryTransport.createLinkedPair();
  const server = createServer();
  await server.connect(b);
  const client = new Client({ name: 'test', version: '1.0.0' });
  await client.connect(a);
  return client;
}
const call = async (client, name, args = {}) => {
  const res = await client.callTool({ name, arguments: args });
  const body = res.content[0].text;
  return { isError: Boolean(res.isError), body, data: res.isError ? null : JSON.parse(body) };
};

test('the connector offers eight read-only tools', async () => {
  const client = await connect();
  const { tools } = await client.listTools();
  assert.deepEqual(tools.map((t) => t.name).sort(), ['ask', 'batter_records', 'compare_careers', 'compare_centuries', 'get_century', 'list_options', 'most_divisive', 'rank_centuries']);
  for (const t of tools) {
    assert.equal(t.annotations?.readOnlyHint, true, `${t.name} must be read-only`);
    assert.ok(t.description.length > 40);
    assert.ok(t.annotations?.title, `${t.name} needs annotations.title`);
  }
});

test('ask answers a head-to-head with a verdict and links', async () => {
  const client = await connect();
  const { data } = await call(client, 'ask', { question: 'who has the better test hundred, ricky ponting or steve smith?' });
  assert.equal(data.kind, 'compare');
  assert.match(data.verdict, /Ponting|Smith/);
  assert.equal(data.innings.length, 2);
  assert.match(data.innings[0].url, /^https:\/\/.+\/innings\/\d+-/);
  assert.ok(data.holdsAcrossPresets.length > 10);
});

test('ask reports how it understood a list question', async () => {
  const client = await connect();
  const { data } = await call(client, 'ask', { question: 'best centuries by India since 2010' });
  assert.equal(data.kind, 'list');
  assert.ok(data.understoodAs.includes('India batters'));
  assert.ok(data.results.every((r) => r.country === 'India' && r.year >= 2010));
});

test('rank_centuries honours presets, filters, limits and the Patriot bonus', async () => {
  const client = await connect();
  const def = (await call(client, 'rank_centuries', { limit: 3 })).data;
  assert.equal(def.results[0].player, 'Brian Lara');
  assert.equal(def.results.length, 3);
  const pat = (await call(client, 'rank_centuries', { preset: 'Patriot', limit: 3 })).data;
  assert.equal(pat.results[0].country, 'Australia');
  assert.match(pat.weighting.australianBonus, /\+5/);
  assert.equal(def.weighting.australianBonus, null);
  const lords = (await call(client, 'rank_centuries', { venue: "Lord's", minRuns: 200, limit: 50 })).data;
  assert.ok(lords.results.length > 0 && lords.results.every((r) => r.venue === "Lord's" && parseInt(r.runs, 10) >= 200));
  const custom = (await call(client, 'rank_centuries', { order: ['narrative', 'historicalWeight', 'perceivedGreatness', 'clutchness', 'matchImpact', 'conditions'], limit: 1 })).data;
  assert.equal(custom.weighting.australianBonus, null);
});

test('rank_centuries rejects bad input politely', async () => {
  const client = await connect();
  assert.equal((await call(client, 'rank_centuries', { country: 'Atlantis' })).isError, true);
  assert.equal((await call(client, 'rank_centuries', { order: ['narrative', 'narrative', 'conditions', 'matchImpact', 'clutchness', 'historicalWeight'] })).isError, true);
  // out-of-range input is refused by the schema, not run
  const tooMany = await client.callTool({ name: 'rank_centuries', arguments: { limit: 5000 } });
  assert.equal(Boolean(tooMany.isError), true);
});

test('get_century finds Renshaw by name and shows his video, presets and link', async () => {
  const client = await connect();
  const { data } = await call(client, 'get_century', { player: 'Matt Renshaw', runs: 190 });
  assert.equal(data.id, 4599);
  assert.equal(data.underEachPreset.length, Object.keys(PRESETS).length);
  assert.ok(data.story.length > 50);
  assert.equal(data.video.channel, 'cricket.com.au');
  assert.match(data.video.url, /youtube\.com\/watch\?v=/);
  assert.equal(data.criteria.length, 6);
  assert.equal((await call(client, 'get_century', { player: 'Nobody Atall' })).isError, true);
});

test('compare_centuries takes names or ids and says whether the verdict holds', async () => {
  const client = await connect();
  const byName = (await call(client, 'compare_centuries', { innings: ['Lara 153', 'Stokes 135 2019'] })).data;
  assert.equal(byName.innings.length, 2);
  assert.match(byName.verdict, /Lara|Stokes/);
  const byId = (await call(client, 'compare_centuries', { ids: [1142, 1823, 413] })).data;
  assert.equal(byId.innings.length, 3);
  assert.match(byId.verdict, /placed third/);
  assert.equal((await call(client, 'compare_centuries', { ids: [1142] })).isError, true);
});

test('most_divisive and list_options describe the model', async () => {
  const client = await connect();
  const div = (await call(client, 'most_divisive', { limit: 3 })).data;
  assert.equal(div.results.length, 3);
  assert.ok(div.results.every((r) => r.divisiveness >= 0 && r.divisiveness <= 100));
  const opts = (await call(client, 'list_options')).data;
  assert.deepEqual(opts.presets.map((p) => p.name), ['Default', 'Purist', 'Analyst', 'Patriot', 'Romantic']);
  assert.equal(opts.criteria.length, 6);
  assert.match(opts.australianBonus, /1989 to 2007/);
});

test('weightings resolve sensibly', () => {
  assert.equal(resolveWeighting({}).bias, null);
  assert.equal(resolveWeighting({ preset: 'Patriot' }).bias, 'au');
  assert.equal(resolveWeighting({ preset: 'Patriot', australianBonus: false }).bias, null);
  assert.equal(resolveWeighting({ preset: 'Purist', australianBonus: true }).bias, 'au');
  assert.ok(resolveWeighting({ preset: 'Nope' }).error);
});

test('compare_careers gives the Big Four numbers, ranking and leaders', async () => {
  const client = await connect();
  const { data } = await call(client, 'compare_careers', {});
  assert.equal(data.set, 'The Big Four');
  assert.equal(Object.keys(data.measuresLed).length, 4);
  const hundreds = data.theNumbers.find((m) => m.measure === 'Hundreds');
  assert.equal(hundreds.values['Joe Root'], '41');
  assert.ok(data.theNumbers.find((m) => m.measure === 'Average').values['Steve Smith']);
  assert.ok(data.summary.length >= 2);
  assert.equal(data.bestInnings['Kane Williamson'].length, 3);
  const patriot = (await call(client, 'compare_careers', { preset: 'Patriot' })).data;
  assert.match(patriot.weighting.australianBonus, /\+5/);
});

test('batter_records answers the aggregate questions', async () => {
  const client = await connect();
  const don = (await call(client, 'batter_records', { batter: 'Don Bradman' })).data.results[0];
  assert.equal(don.hundreds, 29);
  assert.equal(don.tonsOfConsequence, 10);
  assert.deepEqual([don.results.won, don.results.drawn, don.results.lost], [23, 4, 2]);
  const top = (await call(client, 'batter_records', { sortBy: 'tonsOfConsequence', limit: 3 })).data.results;
  assert.ok(top[0].tonsOfConsequence >= top[1].tonsOfConsequence);
  const strong = (await call(client, 'batter_records', { oppositionTier: 1, limit: 5 })).data;
  assert.equal(strong.results.length, 5);
  const away = (await call(client, 'batter_records', { where: 'away', batter: 'Steve Smith' })).data.results[0];
  assert.ok(away.hundreds > 5);
  const bad = await call(client, 'batter_records', { batter: 'Nobody Atall' });
  assert.equal(bad.isError, true);
});
