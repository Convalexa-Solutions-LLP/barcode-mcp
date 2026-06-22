// End-to-end MCP test: spawn the server over stdio, list tools, call a few.
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({ command: 'node', args: ['src/index.js'] });
const client = new Client({ name: 'smoke-client', version: '0.0.1' });
await client.connect(transport);

const tools = await client.listTools();
console.log('TOOLS:', tools.tools.map((t) => t.name).join(', '));

const epc = await client.callTool({ name: 'encode_epc', arguments: { scheme: 'sgtin96', companyPrefix: '0614141', reference: '812345', serial: '6789', filter: 3 } });
console.log('encode_epc ->', epc.content[0].text.replace(/\n/g, ' | '));

const qr = await client.callTool({ name: 'generate_qr', arguments: { data: 'https://www.convalexa.in' } });
console.log('generate_qr ->', qr.content.map((c) => c.type === 'image' ? `image(${c.mimeType}, ${c.data.length}b64)` : c.text).join(' | '));

const bc = await client.callTool({ name: 'generate_barcode', arguments: { data: 'CONVALEXA-0001', symbology: 'code128' } });
console.log('generate_barcode ->', bc.content.map((c) => c.type === 'image' ? `image(${c.data.length}b64)` : c.text).join(' | '));

const dec = await client.callTool({ name: 'decode_barcode', arguments: { base64: qr.content.find((c) => c.type === 'image').data } });
console.log('decode_barcode ->', dec.content[0].text);

const bad = await client.callTool({ name: 'encode_epc', arguments: { scheme: 'sgtin96', companyPrefix: '12345', reference: '1', serial: '1' } });
console.log('encode_epc (bad prefix) -> isError=', bad.isError, '|', bad.content[0].text);

await client.close();
console.log('\nMCP E2E OK');
