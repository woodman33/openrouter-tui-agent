// "Tap this": the AN12196 vector as a QR that opens the real /t address on the
// preview edge. Writes the PNG into public/qr (served on the gateway) and a
// deck copy into ../../renders. Usage: node scripts/make-qr.mjs [base-url]
import { mkdirSync, writeFileSync, copyFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';

const here = dirname(fileURLToPath(import.meta.url));
const base = process.argv[2] ?? 'https://preview.vault-custody.pages.dev';
const url = `${base}/t?e=EF963FF7828658A599F3041510671E88&c=94EED9EE65337086&tt=CC`;

const out = join(here, '..', 'public', 'qr');
mkdirSync(out, { recursive: true });
const png = join(out, 'an12196-tap.png');
// Product mode: phosphor modules on navy, quiet zone 4, 1024 px for the deck.
await QRCode.toFile(png, url, { errorCorrectionLevel: 'M', margin: 4, width: 1024, color: { dark: '#33FF66', light: '#0A1628' } });
const svg = await QRCode.toString(url, { type: 'svg', errorCorrectionLevel: 'M', margin: 4, color: { dark: '#33FF66', light: '#0A162800' } });
writeFileSync(join(out, 'an12196-tap.svg'), svg);

const deck = join(here, '..', '..', 'renders');
mkdirSync(deck, { recursive: true });
copyFileSync(png, join(deck, 'qr-an12196-tap.png'));

const sha = createHash('sha256').update(await import('node:fs').then((m) => m.readFileSync(png))).digest('hex');
console.log(JSON.stringify({ ok: true, url, png, deck: join(deck, 'qr-an12196-tap.png'), sha256: sha }));
