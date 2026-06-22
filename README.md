# @convalexa/barcode-mcp

MCP (Model Context Protocol) server that gives AI assistants Convalexa's barcode, QR and RFID/EPC tools — generate, bulk-generate, encode EPCs and decode barcodes. Runs locally over stdio; nothing is uploaded.

Built by [Convalexa Solutions LLP](https://www.convalexa.in) — Make-in-India UHF RFID & barcode. Companion to the free web tools at <https://www.convalexa.in/tools/>.

## Tools

| Tool | What it does |
|------|--------------|
| `encode_epc` | Encode **SGTIN-96 / SSCC-96 / GIAI-96** EPC (hex + EPC URI + 96-bit binary) from a GS1 company prefix, reference and serial, per the GS1 EPC Tag Data Standard. |
| `generate_barcode` | Generate a 1D barcode (Code 128, EAN-13, EAN-8, UPC-A, Code 39, ITF-14) or QR as a PNG. |
| `generate_qr` | Generate a QR code as a PNG (convenience wrapper). |
| `bulk_barcode` | Generate up to 50 barcodes/QRs at once from a list. |
| `decode_barcode` | Decode 1D/2D barcodes from an image (base64 or file path) → value + format. |

> `encode_epc` computes the EPC value to write to a tag — a browser/host cannot program a physical tag. SGTIN-96 output is validated against the GS1 reference vector `3074257BF7194E4000001A85`.

## Install

### Claude Desktop / Claude Code (after npm publish)

```json
{
  "mcpServers": {
    "convalexa-barcode": {
      "command": "npx",
      "args": ["-y", "@convalexa/barcode-mcp"]
    }
  }
}
```

### Local / from source (before publish)

```json
{
  "mcpServers": {
    "convalexa-barcode": {
      "command": "node",
      "args": ["/absolute/path/to/convalexa-mcp/src/index.js"]
    }
  }
}
```

Claude Desktop config lives at: macOS `~/Library/Application Support/Claude/claude_desktop_config.json`, Windows `%APPDATA%\Claude\claude_desktop_config.json`. For Claude Code: `claude mcp add convalexa-barcode -- npx -y @convalexa/barcode-mcp`.

## Develop

```bash
npm install
npm test          # unit smoke test (epc vector, generate, decode round-trip)
node test/client.js   # end-to-end MCP handshake + tool calls
npm start         # run the stdio server directly
```

## Stack

Node ≥18, ESM. `@modelcontextprotocol/sdk`, `zod`, `bwip-js` (generation), `@zxing/library` + `jimp` (decoding). No network calls; all processing is local.

## License

MIT © Convalexa Solutions LLP
