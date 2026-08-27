// Screenshot the running dev server for the README.
// Run with: node scripts/screenshots.mjs
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('docs/screenshots');
const BASE = process.env.SCREENSHOT_BASE ?? 'http://localhost:5173';

if (!existsSync(OUT)) {
  await mkdir(OUT, { recursive: true });
}

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
  colorScheme: 'dark',
});
// Pin the app to dark mode (the user can also do this in Settings) so the
// screenshots look consistent regardless of the host OS theme.
await ctx.addInitScript(() => {
  try { localStorage.setItem('itsla.theme', 'dark'); } catch (_) {}
});
const page = await ctx.newPage();

async function shot(name, url, extraWait) {
  console.log(`-> ${name}: ${url}`);
  await page.goto(BASE + url, { waitUntil: 'networkidle' });
  if (extraWait) await page.waitForTimeout(extraWait);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
}

// 1. Landing
await shot('01-landing', '/#/', 1500);

// 2. Dashboard
await shot('02-dashboard', '/#/dashboard', 800);

// 3. Labs list
await shot('03-labs', '/#/labs', 800);

// 4. A lab in progress
await shot('04-lab-run', '/#/lab/lab-01', 1500);

// 5. Readiness
await shot('05-readiness', '/#/readiness', 800);

// 6. Portfolio
await shot('06-portfolio', '/#/portfolio', 800);

// 7. Settings
await shot('07-settings', '/#/settings', 800);

await browser.close();
console.log('done ->', OUT);
