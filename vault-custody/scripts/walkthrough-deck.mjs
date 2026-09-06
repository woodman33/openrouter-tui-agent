// 30-second deck cut: gateway hero → one tap → receipt → provenance timeline
// → map → QR end card. Playwright records WebM at 1440×900; ffmpeg trims to
// exactly 30 s and encodes MP4. Usage: node scripts/walkthrough-deck.mjs [base] [out-dir]
import { chromium } from 'playwright';
import { mkdirSync, readdirSync, renameSync, statSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';

const base = process.argv[2] ?? 'https://preview.vault-custody.pages.dev';
const out = resolve(process.argv[3] ?? '../renders/walkthrough-deck');
mkdirSync(out, { recursive: true });

const W = 1440, H = 900;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, recordVideo: { dir: out, size: { width: W, height: H } }, colorScheme: 'dark', reducedMotion: 'no-preference' });
const page = await ctx.newPage();
const hold = (ms) => page.waitForTimeout(ms);
const settle = async (ms) => { await page.waitForLoadState('networkidle').catch(() => {}); await hold(ms); };

// Beat sheet (target 30 s): hero 7 · tap→receipt 6 · timeline 7 · map 6 · end card 4
await page.goto(`${base}/`); await settle(6200);
await page.goto(`${base}/t?e=EF963FF7828658A599F3041510671E88&c=94EED9EE65337086&tt=CC`); await settle(4200);
await page.evaluate(() => window.scrollTo({ top: 520, behavior: 'smooth' })); await hold(1400);
await page.goto(`${base}/p/VC0007`); await settle(4600);
await page.click('#list li:nth-child(8)').catch(() => {}); await hold(2000);
await page.click('.tab[data-view="map"]'); await hold(5400);
await page.goto(`${base}/deck/end`); await settle(3600);

await ctx.close();
await browser.close();

const webm = readdirSync(out).filter((f) => f.endsWith('.webm') && f !== 'deck.webm').map((f) => join(out, f)).sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0];
const src = join(out, 'deck.webm');
renameSync(webm, src);
const mp4 = join(out, 'walkthrough-deck-30s.mp4');
// Trim to exactly 30 s from the start, 30 fps, faststart for the deck.
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', src, '-t', '30', '-r', '30', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '19', '-movflags', '+faststart', mp4]);
const sha = createHash('sha256').update(readFileSync(mp4)).digest('hex');
const probe = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size', '-of', 'csv=p=0', mp4], { encoding: 'utf8' }).trim();
console.log(JSON.stringify({ ok: true, mp4, sha256: sha, duration_size: probe }));
