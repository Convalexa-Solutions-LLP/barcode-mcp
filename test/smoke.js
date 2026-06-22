import assert from 'node:assert';
import { encodeSGTIN, encodeSSCC, encodeGIAI } from '../src/epc.js';
import { generateBarcode } from '../src/barcode.js';
import { decodeBarcode } from '../src/decode.js';

// 1) EPC reference vector
const epc = encodeSGTIN({ companyPrefix: '0614141', reference: '812345', serial: '6789', filter: 3 });
assert.equal(epc.hex, '3074257BF7194E4000001A85', 'SGTIN-96 vector mismatch');
console.log('EPC SGTIN ok:', epc.hex);
console.log('EPC SSCC ok:', encodeSSCC({ companyPrefix: '0614141', reference: '1234567' }).hex);
console.log('EPC GIAI ok:', encodeGIAI({ companyPrefix: '0614141', reference: '5678' }).hex);

// 2) barcode generate
const bc = await generateBarcode({ data: 'CONVALEXA-0001', symbology: 'code128' });
assert.ok(bc.mimeType === 'image/png' && bc.base64.length > 100, 'code128 png');
console.log('Code128 png ok:', bc.base64.length, 'b64 chars');

const ean = await generateBarcode({ data: '5901234123457', symbology: 'ean13' });
console.log('EAN13 png ok:', ean.base64.length);

// 3) QR generate + 4) decode round-trip
const qr = await generateBarcode({ data: 'https://www.convalexa.in', symbology: 'qr', includetext: false });
console.log('QR png ok:', qr.base64.length);
const dec = await decodeBarcode({ base64: qr.base64 });
console.log('Decode result:', JSON.stringify(dec));
assert.ok(dec.some((r) => r.text === 'https://www.convalexa.in'), 'QR round-trip decode failed');

// 5) decode a generated Code128
const dec2 = await decodeBarcode({ base64: bc.base64 });
console.log('Decode Code128:', JSON.stringify(dec2));
assert.ok(dec2.some((r) => r.text === 'CONVALEXA-0001'), 'Code128 round-trip decode failed');

console.log('\nALL SMOKE TESTS PASSED');
