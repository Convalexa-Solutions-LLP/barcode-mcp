// EPC encoding (SGTIN-96, SSCC-96, GIAI-96) per GS1 EPC Tag Data Standard.
// Validated against the GS1 SGTIN-96 reference vector 3074257BF7194E4000001A85.

const SGTIN = {
  12: { p: 0, cpBits: 40, refBits: 4 }, 11: { p: 1, cpBits: 37, refBits: 7 },
  10: { p: 2, cpBits: 34, refBits: 10 }, 9: { p: 3, cpBits: 30, refBits: 14 },
  8: { p: 4, cpBits: 27, refBits: 17 }, 7: { p: 5, cpBits: 24, refBits: 20 },
  6: { p: 6, cpBits: 20, refBits: 24 }
};
const SSCC = {
  12: { p: 0, cpBits: 40, refBits: 18 }, 11: { p: 1, cpBits: 37, refBits: 21 },
  10: { p: 2, cpBits: 34, refBits: 24 }, 9: { p: 3, cpBits: 30, refBits: 28 },
  8: { p: 4, cpBits: 27, refBits: 31 }, 7: { p: 5, cpBits: 24, refBits: 34 },
  6: { p: 6, cpBits: 20, refBits: 38 }
};
const GIAI = {
  12: { p: 0, cpBits: 40, refBits: 42 }, 11: { p: 1, cpBits: 37, refBits: 45 },
  10: { p: 2, cpBits: 34, refBits: 48 }, 9: { p: 3, cpBits: 30, refBits: 52 },
  8: { p: 4, cpBits: 27, refBits: 55 }, 7: { p: 5, cpBits: 24, refBits: 58 },
  6: { p: 6, cpBits: 20, refBits: 62 }
};

function digits(s, name) {
  s = String(s);
  if (!/^[0-9]+$/.test(s)) throw new Error(`${name} must be digits only.`);
  return s;
}
function bits(value, n) {
  const v = BigInt(value);
  if (v < 0n) throw new Error('Value cannot be negative.');
  let s = v.toString(2);
  if (s.length > n) throw new Error(`Value ${value} does not fit in ${n} bits.`);
  return s.padStart(n, '0');
}
function binToHex(bin) {
  if (bin.length % 4) throw new Error('bit length not multiple of 4');
  let hex = '';
  for (let i = 0; i < bin.length; i += 4) hex += parseInt(bin.substr(i, 4), 2).toString(16);
  return hex.toUpperCase();
}

export function encodeSGTIN({ companyPrefix, reference, serial, filter = 1 }) {
  const cp = digits(companyPrefix, 'companyPrefix');
  const ref = digits(reference, 'reference');
  const ser = digits(serial, 'serial');
  const t = SGTIN[cp.length];
  if (!t) throw new Error('companyPrefix must be 6-12 digits.');
  if (filter < 0 || filter > 7) throw new Error('filter must be 0-7.');
  if (BigInt(ser) > 274877906943n) throw new Error('serial exceeds 38-bit max (274877906943).');
  const bin = '00110000' + bits(filter, 3) + bits(t.p, 3) + bits(cp, t.cpBits) + bits(ref, t.refBits) + bits(ser, 38);
  return { hex: binToHex(bin), bin, uri: `urn:epc:tag:sgtin-96:${filter}.${cp}.${ref}.${ser}` };
}
export function encodeSSCC({ companyPrefix, reference, filter = 0 }) {
  const cp = digits(companyPrefix, 'companyPrefix');
  const ref = digits(reference, 'reference');
  const t = SSCC[cp.length];
  if (!t) throw new Error('companyPrefix must be 6-12 digits.');
  if (filter < 0 || filter > 7) throw new Error('filter must be 0-7.');
  const bin = '00110001' + bits(filter, 3) + bits(t.p, 3) + bits(cp, t.cpBits) + bits(ref, t.refBits) + bits(0, 24);
  return { hex: binToHex(bin), bin, uri: `urn:epc:tag:sscc-96:${filter}.${cp}.${ref}` };
}
export function encodeGIAI({ companyPrefix, reference, filter = 0 }) {
  const cp = digits(companyPrefix, 'companyPrefix');
  const ref = digits(reference, 'reference');
  const t = GIAI[cp.length];
  if (!t) throw new Error('companyPrefix must be 6-12 digits.');
  if (filter < 0 || filter > 7) throw new Error('filter must be 0-7.');
  const bin = '00110100' + bits(filter, 3) + bits(t.p, 3) + bits(cp, t.cpBits) + bits(ref, t.refBits);
  return { hex: binToHex(bin), bin, uri: `urn:epc:tag:giai-96:${filter}.${cp}.${ref}` };
}
export function encodeEPC(scheme, args) {
  if (scheme === 'sgtin96') return encodeSGTIN(args);
  if (scheme === 'sscc96') return encodeSSCC(args);
  if (scheme === 'giai96') return encodeGIAI(args);
  throw new Error(`Unknown scheme: ${scheme}`);
}
