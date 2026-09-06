// One still of a page after the intro settles. Usage: node scripts/shot.mjs <url> <out.png> [wait ms]
import { chromium } from 'playwright';
const [,, url, out, wait = '2800'] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
await page.goto(url);
await page.waitForTimeout(Number(wait));
await page.screenshot({ path: out });
await browser.close();
console.log(out);
