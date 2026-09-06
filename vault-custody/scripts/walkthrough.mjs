// Walkthrough recording: gateway → Collector → tap → receipt → card → timeline
// → map; Manufacturer → where-the-boxes-went. Playwright records WebM; ffmpeg
// turns it into MP4. Screenshots land beside it for review. Usage:
//   node scripts/walkthrough.mjs [base-url] [out-dir]
import { chromium } from 'playwright';
import { mkdirSync, readdirSync, renameSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const base = process.argv[2] ?? 'https://preview.vault-custody.pages.dev';
const out = resolve(process.argv[3] ?? '../renders/walkthrough');
mkdirSync(out, { recursive: true });
const shots = join(out, 'shots');
mkdirSync(shots, { recursive: true });

const W = 1440, H = 900;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, recordVideo: { dir: out, size: { width: W, height: H } }, colorScheme: 'dark', reducedMotion: 'no-preference' });
const page = await ctx.newPage();
let n = 0;
const shot = async (name) => { await page.screenshot({ path: join(shots, `${String(++n).padStart(2, '0')}-${name}.png`), fullPage: false }); };
const hold = (ms) => page.waitForTimeout(ms);
const settle = async (ms = 900) => { await page.waitForLoadState('networkidle').catch(() => {}); await hold(ms); };
const scrollTo = async (y, ms = 700) => { await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'smooth' }), y); await hold(ms); };

// 1. Gateway: the box, then the hats, then the QR.
await page.goto(`${base}/`); await settle(2600); await shot('gateway-box');
await scrollTo(760, 1400); await shot('gateway-hats');
await scrollTo(1500, 1400); await shot('gateway-tap-this');

// 2. Collector: sign in (seeded session) → singles sheet.
await page.goto(`${base}/hat/collector`); await settle(1200); await shot('hat-collector');
await page.click('[data-testid="enter"]'); await settle(1400); await shot('collector-singles');
await page.goto(`${base}/me`); await settle(1200); await shot('collector-profile');

// 3. Tap: the AN12196 vector → receipt page with the verified banner.
await page.goto(`${base}/t?e=EF963FF7828658A599F3041510671E88&c=94EED9EE65337086&tt=CC`); await settle(1800); await shot('tap-receipt');
await scrollTo(700, 1200); await shot('receipt-timeline');

// 4. Card.
await page.goto(`${base}/c/VC0007-17-03`); await settle(1500); await shot('card');

// 5. Provenance: 3D timeline, then the travel map.
await page.goto(`${base}/p/VC0007`); await settle(2600); await shot('provenance-timeline');
await page.click('#list li:nth-child(8)').catch(() => {}); await hold(1800); await shot('provenance-timeline-open');
await page.click('.tab[data-view="map"]'); await hold(1800); await shot('provenance-map');

// 6. Manufacturer: switch hat → boxes → where the boxes went.
await page.goto(`${base}/signin?hat=manufacturer`); await settle(1400); await shot('manufacturer-boxes');
await page.goto(`${base}/m`); await settle(1800); await shot('where-the-boxes-went');
await scrollTo(500, 1200);
await hold(800);

await ctx.close();
await browser.close();

// Playwright names the video itself; find it and convert.
const webm = readdirSync(out).filter((f) => f.endsWith('.webm')).map((f) => join(out, f)).sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0];
const src = join(out, 'walkthrough.webm');
renameSync(webm, src);
const mp4 = join(out, 'walkthrough.mp4');
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', src, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '20', '-movflags', '+faststart', mp4]);
const sha = createHash('sha256').update(readFileSync(mp4)).digest('hex');
const probe = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size', '-of', 'csv=p=0', mp4], { encoding: 'utf8' }).trim();
console.log(JSON.stringify({ ok: true, mp4, sha256: sha, duration_size: probe, shots: n }));
