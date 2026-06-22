#!/usr/bin/env node
// Convalexa Barcode MCP server — stdio transport (local; spawned by the AI client).
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';

const server = createServer();
await server.connect(new StdioServerTransport());
console.error('convalexa-barcode-mcp running on stdio');
