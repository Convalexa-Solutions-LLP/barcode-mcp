#!/usr/bin/env node
// Convalexa Barcode MCP server — remote Streamable HTTP transport.
// For hosting on a Node host (Railway/Fly/Render/VPS) behind HTTPS, e.g. mcp.convalexa.in.
// NOTE: needs `express` (optional dependency): npm install express
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from './server.js';

let express;
try {
  express = (await import('express')).default;
} catch {
  console.error('Remote mode needs express. Install it:  npm install express');
  process.exit(1);
}

const PORT = process.env.PORT || 8787;
const API_KEY = process.env.MCP_API_KEY || '';

const app = express();
app.use(express.json({ limit: '8mb' }));

// Optional bearer-token auth (set MCP_API_KEY to enable)
app.use((req, res, next) => {
  if (!API_KEY) return next();
  const auth = req.headers.authorization || '';
  if (auth === `Bearer ${API_KEY}`) return next();
  res.status(401).json({ jsonrpc: '2.0', error: { code: -32001, message: 'Unauthorized' }, id: null });
});

app.get('/healthz', (_req, res) => res.json({ ok: true }));

// Stateless Streamable HTTP: a fresh server + transport per request.
app.post('/mcp', async (req, res) => {
  const server = createServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  res.on('close', () => { transport.close(); server.close(); });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (e) {
    if (!res.headersSent) {
      res.status(500).json({ jsonrpc: '2.0', error: { code: -32603, message: String(e && e.message || e) }, id: null });
    }
  }
});

app.listen(PORT, () => console.error(`convalexa-barcode-mcp (HTTP) on :${PORT}/mcp`));
