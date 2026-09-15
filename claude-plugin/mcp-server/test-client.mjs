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

const ids = parsed.results.slice(0, 2).map((r) => r.id);
await call('compare_centuries', { ids });

await client.close();
process.exit(0);
