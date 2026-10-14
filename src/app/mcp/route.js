import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { createServer } from '@/lib/mcp';

// The connector for Claude. Stateless: every request builds a fresh server, answers, and forgets. Read-only,
// no sign-in, nothing stored. See src/lib/mcp.js for the tools and docs/adr/0006 for why it lives here.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type, accept, mcp-protocol-version, mcp-session-id, authorization',
  'Access-Control-Expose-Headers': 'mcp-session-id',
};

const json = (body, status, extra = {}) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...CORS, ...extra } });

export async function POST(request) {
  const server = createServer();
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  await server.connect(transport);
  try {
    const res = await transport.handleRequest(request);
    for (const [k, v] of Object.entries(CORS)) res.headers.set(k, v);
    return res;
  } catch {
    return json({ jsonrpc: '2.0', error: { code: -32603, message: 'Internal error' }, id: null }, 500);
  }
}

// A person who opens the connector address in a browser gets the instructions instead of an error.
export async function GET(request) {
  if ((request.headers.get('accept') || '').includes('text/html')) {
    return new Response(null, { status: 302, headers: { Location: '/connect' } });
  }
  return json({ jsonrpc: '2.0', error: { code: -32000, message: 'This connector answers POST requests (Streamable HTTP). See /connect.' }, id: null }, 405, { Allow: 'POST' });
}

export const DELETE = () => json({ jsonrpc: '2.0', error: { code: -32000, message: 'No sessions to close. This connector is stateless.' }, id: null }, 405, { Allow: 'POST' });

export const OPTIONS = () => new Response(null, { status: 204, headers: CORS });
