#!/usr/bin/env node
// Convalexa Barcode MCP server (stdio). Exposes barcode/QR generation,
// bulk generation, EPC encoding and barcode decoding to AI assistants.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { generateBarcode } from './barcode.js';
import { decodeBarcode } from './decode.js';
import { encodeEPC } from './epc.js';

const SYMBOLOGIES = ['code128', 'ean13', 'ean8', 'upca', 'code39', 'itf14', 'qr'];

const server = new McpServer({ name: 'convalexa-barcode-mcp', version: '0.1.0' });

function textBlock(t) { return { type: 'text', text: t }; }
function imageBlock(img) { return { type: 'image', data: img.base64, mimeType: img.mimeType }; }
function errorResult(e) { return { isError: true, content: [textBlock(`Error: ${e.message || e}`)] }; }

// 1) encode_epc
server.registerTool(
  'encode_epc',
  {
    title: 'Encode EPC (UHF RFID)',
    description: 'Encode an SGTIN-96, SSCC-96 or GIAI-96 EPC for UHF RFID tags from a GS1 company prefix, reference and (for SGTIN) serial. Returns the EPC hex, EPC tag URI and 96-bit binary. This computes the value to write to a tag; it does not program a physical tag.',
    inputSchema: {
      scheme: z.enum(['sgtin96', 'sscc96', 'giai96']).describe('EPC scheme'),
      companyPrefix: z.string().describe('GS1 company prefix, 6-12 digits'),
      reference: z.string().describe('SGTIN: item reference incl. indicator digit; SSCC: serial reference incl. extension digit; GIAI: individual asset reference'),
      serial: z.string().optional().describe('SGTIN only: numeric serial (0 to 274877906943)'),
      filter: z.number().int().min(0).max(7).optional().describe('Filter value 0-7 (default 1 for SGTIN, 0 otherwise)')
    }
  },
  async ({ scheme, companyPrefix, reference, serial, filter }) => {
    try {
      const f = filter !== undefined ? filter : (scheme === 'sgtin96' ? 1 : 0);
      const r = encodeEPC(scheme, { companyPrefix, reference, serial, filter: f });
      return { content: [textBlock(`EPC hex: ${r.hex}\nEPC URI: ${r.uri}\nBinary (96-bit): ${r.bin}`)] };
    } catch (e) { return errorResult(e); }
  }
);

// 2) generate_barcode
server.registerTool(
  'generate_barcode',
  {
    title: 'Generate barcode',
    description: 'Generate a 1D barcode (Code 128, EAN-13, EAN-8, UPC-A, Code 39, ITF-14) or QR code as a PNG image.',
    inputSchema: {
      data: z.string().describe('The data/text to encode'),
      symbology: z.enum(SYMBOLOGIES).optional().describe('Barcode type (default code128)'),
      scale: z.number().int().min(1).max(10).optional().describe('Pixel scale factor (default 3)'),
      height: z.number().int().min(2).max(80).optional().describe('1D bar height in mm-units (default 10; ignored for QR)'),
      includetext: z.boolean().optional().describe('Show the human-readable value under 1D barcodes (default true)'),
      eclevel: z.enum(['L', 'M', 'Q', 'H']).optional().describe('QR error-correction level (default M)')
    }
  },
  async ({ data, symbology = 'code128', scale = 3, height = 10, includetext = true, eclevel }) => {
    try {
      const img = await generateBarcode({ data, symbology, scale, height, includetext, eclevel });
      return { content: [textBlock(`Generated ${symbology} for: ${data}`), imageBlock(img)] };
    } catch (e) { return errorResult(e); }
  }
);

// 3) generate_qr
server.registerTool(
  'generate_qr',
  {
    title: 'Generate QR code',
    description: 'Generate a QR code as a PNG image. Convenience wrapper around generate_barcode for QR.',
    inputSchema: {
      data: z.string().describe('Text, URL or data to encode'),
      scale: z.number().int().min(1).max(12).optional().describe('Pixel scale factor (default 4)'),
      eclevel: z.enum(['L', 'M', 'Q', 'H']).optional().describe('Error-correction level (default M)')
    }
  },
  async ({ data, scale = 4, eclevel = 'M' }) => {
    try {
      const img = await generateBarcode({ data, symbology: 'qr', scale, eclevel, includetext: false });
      return { content: [textBlock(`Generated QR for: ${data}`), imageBlock(img)] };
    } catch (e) { return errorResult(e); }
  }
);

// 4) bulk_barcode
server.registerTool(
  'bulk_barcode',
  {
    title: 'Bulk generate barcodes',
    description: 'Generate many barcodes/QR codes at once from a list. Returns one PNG per item (capped at 50).',
    inputSchema: {
      items: z.array(z.string()).min(1).max(50).describe('List of values to encode (one barcode each, max 50)'),
      symbology: z.enum(SYMBOLOGIES).optional().describe('Barcode type for all items (default code128)'),
      scale: z.number().int().min(1).max(10).optional().describe('Pixel scale factor (default 3)'),
      height: z.number().int().min(2).max(80).optional().describe('1D bar height (default 10; ignored for QR)'),
      includetext: z.boolean().optional().describe('Show value under 1D barcodes (default true)')
    }
  },
  async ({ items, symbology = 'code128', scale = 3, height = 10, includetext = true }) => {
    const content = [textBlock(`Generating ${items.length} ${symbology} code(s).`)];
    let ok = 0;
    for (const data of items) {
      try {
        const img = await generateBarcode({ data, symbology, scale, height, includetext });
        content.push(textBlock(data));
        content.push(imageBlock(img));
        ok++;
      } catch (e) {
        content.push(textBlock(`(skipped "${data}": ${e.message || e})`));
      }
    }
    content[0] = textBlock(`Generated ${ok}/${items.length} ${symbology} code(s).`);
    return { content };
  }
);

// 5) decode_barcode
server.registerTool(
  'decode_barcode',
  {
    title: 'Decode barcode from image',
    description: 'Decode 1D and 2D barcodes (QR, Code 128, EAN, UPC, Code 39, DataMatrix, etc.) from an image supplied as a base64 string or a local file path. Returns the decoded value(s) and format(s).',
    inputSchema: {
      base64: z.string().optional().describe('Image as base64 (data URI prefix allowed)'),
      path: z.string().optional().describe('Local image file path (png/jpg/etc.)'),
      formats: z.array(z.string()).optional().describe('Optional list of formats to restrict to (e.g. ["QRCode","Code128"])')
    }
  },
  async ({ base64, path, formats }) => {
    try {
      const results = await decodeBarcode({ base64, path, formats });
      if (!results.length) return { content: [textBlock('No barcode found in the image.')] };
      const lines = results.map((r, i) => `${i + 1}. [${r.format}] ${r.text}`).join('\n');
      return { content: [textBlock(`Decoded ${results.length} code(s):\n${lines}`)] };
    } catch (e) { return errorResult(e); }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error('convalexa-barcode-mcp running on stdio');
