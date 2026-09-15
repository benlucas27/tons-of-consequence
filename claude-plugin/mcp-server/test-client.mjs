import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({ command: 'node', args: ['index.mjs'] });
const client = new Client({ name: 'test-client', version: '1.0.0' });
await client.connect(transport);

const tools = await client.listTools();
console.log('TOOLS:', tools.tools.map((t) => t.name));

async function call(name, args) {
  console.log(`\n--- ${name}(${JSON.stringify(args)}) ---`);
  const res = await client.callTool({ name, arguments: args });
  console.log(res.content[0].text.slice(0, 800));
}

await call('list_options', {});
const rank = await client.callTool({ name: 'rank_centuries', arguments: { limit: 3 } });
console.log('\n--- rank_centuries default ---');
console.log(rank.content[0].text.slice(0, 600));

const parsed = JSON.parse(rank.content[0].text);
const topId = parsed.results[0].id;

await call('get_century', { id: topId });
await call('rank_centuries', { preset: 'romantic', country: 'AUS', limit: 3 });
await call('most_divisive', { limit: 3 });

const ids2 = parsed.results.slice(0, 2).map((r) => r.id);
await call('compare_centuries', { ids: ids2 });

// 3-way compare: assert the third item's own score isn't silently dropped
// from the verdict (regression check for a real bug the mattpocock-skills
// code-review skill caught — verdict used to always be items[0] vs [1],
// ignoring input order and any third id entirely).
const ids3 = parsed.results.slice(0, 3).map((r) => r.id);
const res3 = await client.callTool({ name: 'compare_centuries', arguments: { ids: ids3 } });
const parsed3 = JSON.parse(res3.content[0].text);
console.log('\n--- compare_centuries (3-way) ---');
console.log(res3.content[0].text.slice(0, 400));
const thirdPlayer = parsed.results[2].player;
if (!parsed3.verdict.verdict.includes(thirdPlayer)) {
  throw new Error(`3-way compare regression: verdict text doesn't mention ${thirdPlayer} (the third id)`);
}
if (parsed3.items.length !== 3) {
  throw new Error(`3-way compare regression: expected 3 items in the response, got ${parsed3.items.length}`);
}
console.log(`\n✓ 3-way compare_centuries correctly accounts for all 3 items (${thirdPlayer} mentioned in verdict)`);

await client.close();
console.log('\n✓ all checks passed');
process.exit(0);
