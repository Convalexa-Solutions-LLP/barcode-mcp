// Decode barcodes / QR from an image, via @zxing/library (pure JS, multi-format, runs in Node).
// jimp decodes the image file to RGBA pixels; we pack to Int32 ARGB for RGBLuminanceSource.
import {
  MultiFormatReader, BinaryBitmap, HybridBinarizer, RGBLuminanceSource,
  DecodeHintType, BarcodeFormat
} from '@zxing/library';
import { Jimp } from 'jimp';
import { readFile } from 'node:fs/promises';

async function toBytes({ path, base64 }) {
  if (base64) return Buffer.from(String(base64).replace(/^data:[^,]+,/, ''), 'base64');
  if (path) return readFile(path);
  throw new Error('Provide an image as `base64` or a file `path`.');
}

export async function decodeBarcode({ path, base64, formats }) {
  const bytes = await toBytes({ path, base64 });
  const img = await Jimp.fromBuffer(bytes);
  const { data, width, height } = img.bitmap; // RGBA
  const len = width * height;
  const px = new Int32Array(len);
  for (let i = 0; i < len; i++) {
    const o = i * 4;
    px[i] = (0xff << 24) | (data[o] << 16) | (data[o + 1] << 8) | data[o + 2];
  }
  const bitmap = new BinaryBitmap(new HybridBinarizer(new RGBLuminanceSource(px, width, height)));
  const hints = new Map();
  hints.set(DecodeHintType.TRY_HARDER, true);
  if (formats && formats.length) {
    const f = formats.map((n) => BarcodeFormat[n]).filter((v) => v !== undefined);
    if (f.length) hints.set(DecodeHintType.POSSIBLE_FORMATS, f);
  }
  const reader = new MultiFormatReader();
  reader.setHints(hints);

  // @zxing/library logs caught NotFoundExceptions to the console; silence during decode
  const saved = { log: console.log, error: console.error, warn: console.warn };
  console.log = console.error = console.warn = () => {};
  try {
    const r = reader.decode(bitmap, hints);
    return [{ text: r.getText(), format: BarcodeFormat[r.getBarcodeFormat()] }];
  } catch {
    return [];
  } finally {
    console.log = saved.log; console.error = saved.error; console.warn = saved.warn;
  }
}
