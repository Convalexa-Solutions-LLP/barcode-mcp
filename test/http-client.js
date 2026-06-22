// Test the remote Streamable HTTP transport against a running src/http.js.
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const url = new URL(process.env.MCP_URL || 'http://127.0.0.1:8787/mcp');
const client = new Client({ name: 'http-smoke', version: '0.0.1' });
await client.connect(new StreamableHTTPClientTransport(url));

const tools = await client.listTools();
console.log('HTTP TOOLS:', tools.tools.map((t) => t.name).join(', '));

const epc = await client.callTool({ name: 'encode_epc', arguments: { scheme: 'giai96', companyPrefix: '0614141', reference: '5678' } });
console.log('HTTP encode_epc ->', epc.content[0].text.split('\n')[0]);

await client.close();
console.log('HTTP E2E OK');
