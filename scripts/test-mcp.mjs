/**
 * Checks a running copy of the connector over real HTTP, the way Claude reaches it.
 *
 *   node scripts/test-mcp.mjs                              # the live site
 *   node scripts/test-mcp.mjs http://localhost:3000/mcp    # a local dev server
 *
 * Exits 1 if anything is wrong.
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const url = process.argv[2] || 'https://tons-of-consequence.vercel.app/mcp';
let failed = 0;
const check = (ok, what) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`); if (!ok) failed++; };

const client = new Client({ name: 'tons-of-consequence-check', version: '1.0.0' });
await client.connect(new StreamableHTTPClientTransport(new URL(url)));
console.log(`connected to ${url} (${client.getServerVersion()?.name} ${client.getServerVersion()?.version})`);
if (client.getInstructions()) console.log(`instructions: ${client.getInstructions().slice(0, 90)}...`);

const { tools } = await client.listTools();
check(tools.length === 6, `six tools offered: ${tools.map((t) => t.name).join(', ')}`);
check(tools.every((t) => t.annotations?.readOnlyHint), 'every tool is marked read-only');

const call = async (name, args) => {
  const r = await client.callTool({ name, arguments: args });
  return { error: Boolean(r.isError), data: r.isError ? null : JSON.parse(r.content[0].text) };
};
const ask = await call('ask', { question: 'who has the better test hundred, ricky ponting or steve smith?' });
check(!ask.error && ask.data.kind === 'compare' && ask.data.innings.length === 2, `ask: ${ask.data?.headline}`);
const rank = await call('rank_centuries', { preset: 'Patriot', limit: 3 });
check(!rank.error && rank.data.results[0].country === 'Australia', `rank (Patriot): ${rank.data?.results.map((r) => `${r.player} ${r.runs}`).join(', ')}`);
const one = await call('get_century', { player: 'Matt Renshaw', runs: 190 });
check(!one.error && one.data.id === 4599 && one.data.video?.url, `get_century: ${one.data?.player} ${one.data?.runs}, rank ${one.data?.rank}, video ${one.data?.video?.channel}`);
const bad = await call('rank_centuries', { country: 'Atlantis' });
check(bad.error, 'a bad country is refused politely');

await client.close();
console.log(failed ? `${failed} check(s) failed` : 'all checks passed');
process.exit(failed ? 1 : 0);
