import { execFileSync, spawn } from 'node:child_process';
import { chromium, expect } from '@playwright/test';

const base = '/ledger-pages-check/', env = { ...process.env, LEDGER_BASE: base };
execFileSync('npm', ['run', 'build'], { env, stdio: 'pipe' });
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4174', '--strictPort'], { env, stdio: 'ignore' });
let browser;
try {
  const url = 'http://127.0.0.1:4174' + base;
  for (let i = 0; i < 80; i++) {
    try { if ((await fetch(url)).ok) break; } catch { /* Server is starting. */ }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || (process.platform === 'darwin' ? 'chrome' : undefined) });
  const context = await browser.newContext({ viewport: { width: 402, height: 874 } });
  const page = await context.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(url);
  await expect(page.getByTestId('bankroll')).toHaveText('+$0');
  const manifest = await page.evaluate(async () => (await fetch(document.querySelector('link[rel="manifest"]').href)).json());
  if (manifest.start_url !== base || manifest.scope !== base || manifest.icons.some(i => !i.src.startsWith(base))) throw new Error('Manifest paths escaped the Pages base.');
  await page.evaluate(() => navigator.serviceWorker.ready); await page.reload();
  if (!(await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL)).includes(base)) throw new Error('Worker scope is wrong.');
  await context.setOffline(true); await page.reload();
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('button', { name: /Import from analytics7/ }).click();
  await page.getByRole('button', { name: 'Use the sample export' }).click();
  await expect(page.getByRole('button', { name: 'Review 3 rows' })).toBeVisible();
  if (errors.length) throw new Error(errors.join('\n'));
  console.log('Pages path check passed: app, manifest, icon paths, worker and offline sample work under ' + base);
} finally { if (browser) await browser.close(); server.kill('SIGTERM'); }
