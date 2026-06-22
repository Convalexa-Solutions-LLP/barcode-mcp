// Barcode / QR generation via bwip-js (renders PNG in Node).
import bwipjs from 'bwip-js';

const SYM = {
  code128: 'code128', ean13: 'ean13', ean8: 'ean8',
  upca: 'upca', code39: 'code39', itf14: 'itf14', qr: 'qrcode'
};

export async function generateBarcode({ data, symbology = 'code128', scale = 3, height = 10, includetext = true, eclevel }) {
  const bcid = SYM[symbology];
  if (!bcid) throw new Error(`Unsupported symbology: ${symbology}`);
  const opts = { bcid, text: String(data), scale, includetext, paddingwidth: 4, paddingheight: 4, backgroundcolor: 'ffffff' };
  if (bcid === 'qrcode') {
    if (eclevel) opts.eclevel = eclevel;
  } else {
    opts.height = height;
    if (includetext) opts.textxalign = 'center';
  }
  const png = await bwipjs.toBuffer(opts);
  return { mimeType: 'image/png', base64: Buffer.from(png).toString('base64') };
}
