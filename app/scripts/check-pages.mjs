import { execFileSync, spawn } from 'node:child_process';
import { chromium, expect } from '@playwright/test';

const base = '/xbenben/', env = { ...process.env, XBENBEN_BASE: base };
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
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('button', { name: 'Update app', exact: true }).click();
  await expect(page.getByRole('region', { name: 'App updates' })).toContainText('You’re up to date.');
  await context.setOffline(true); await page.reload();
  const assets = await page.evaluate(async () => ({
    icons: await Promise.all([...document.querySelectorAll('link[rel="icon"]')].map(async icon => ({ path: new URL(icon.href).pathname, ok: (await fetch(icon.href)).ok }))),
    apple: new URL(document.querySelector('link[rel="apple-touch-icon"]').href).pathname,
    install: await Promise.all([
      document.querySelector('link[rel="apple-touch-icon"]').href,
      ...(await (await fetch(document.querySelector('link[rel="manifest"]').href)).json()).icons.map(icon => icon.src),
    ].map(async src => {
      const bitmap = await createImageBitmap(await (await fetch(src)).blob());
      const result = { path: new URL(src, location.href).pathname, width: bitmap.width, height: bitmap.height };
      bitmap.close(); return result;
    })),
    fonts: (await Promise.all([document.fonts.load('400 26px "Barlow Condensed"'), document.fonts.load('400 14px "Barlow"')])).every(faces => faces.length > 0 && faces.every(face => face.status === 'loaded')),
  }));
  if (assets.icons.length !== 3 || assets.icons.some(icon => !icon.path.startsWith(base + 'icons/favicon') || !icon.ok) || !assets.fonts) throw new Error('Offline fonts or favicon paths failed under the Pages base.');
  expect(assets.apple).toBe(base + 'icons/apple-touch-icon-chip.png');
  expect(assets.install).toEqual([
    { path: base + 'icons/apple-touch-icon-chip.png', width: 180, height: 180 },
    { path: base + 'icons/chip-192.png', width: 192, height: 192 },
    { path: base + 'icons/chip-512.png', width: 512, height: 512 },
    { path: base + 'icons/chip-maskable-512.png', width: 512, height: 512 },
  ]);
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('button', { name: 'Update app', exact: true }).click();
  await expect(page.getByRole('region', { name: 'App updates' })).toContainText('You’re offline.');
  await page.getByRole('button', { name: /Import from analytics7/ }).click();
  await page.getByRole('button', { name: 'Use the sample export' }).click();
  await expect(page.getByRole('button', { name: 'Review 3 rows' })).toBeVisible();
  if (errors.length) throw new Error(errors.join('\n'));
  console.log('Pages path check passed: app, update checks, manifest, Apple/install icons, worker, offline fonts/favicons and sample work under ' + base);
} finally { if (browser) await browser.close(); server.kill('SIGTERM'); }
