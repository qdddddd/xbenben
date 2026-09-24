// Run with the app on :5173 and unmodified reference project on :8765.
// Normalizes only presentation safe areas and the reference's painted hardware.
import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { seedSample } from '../tests/fixtures/sample-ledger.js';

const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || (process.platform === 'darwin' ? 'chrome' : undefined) });
const output = new URL('../evidence/', import.meta.url);
await fs.mkdir(output, { recursive: true });
const results = [];
try {
  const app = await browser.newPage({ viewport: { width: 402, height: 874 }, timezoneId: 'Asia/Taipei' });
  const ref = await browser.newPage({ viewport: { width: 1060, height: 1000 }, timezoneId: 'Asia/Taipei' });
  const date = new Date('2026-09-22T08:00:00Z');
  await Promise.all([app.clock.setFixedTime(date), ref.clock.setFixedTime(date)]);
  await Promise.all([app.goto('http://127.0.0.1:5173'), ref.goto('http://127.0.0.1:8765/Ledger.dc.html')]);
  await seedSample(app);
  await ref.locator('[data-om-starter="ios-frame"]').waitFor();
  await Promise.all([app.evaluate(() => document.fonts.ready), ref.evaluate(() => document.fonts.ready)]);
  await app.addStyleTag({ content: ':root { --safe-top: 42px; --safe-bottom: 34px; } *, *::before, *::after { animation:none !important; }' });
  await ref.addStyleTag({ content: '[data-om-starter="ios-frame"] { position:fixed !important; top:0; left:0; border-radius:0 !important; box-shadow:none !important; } [data-om-starter="ios-frame"] > div:nth-child(1), [data-om-starter="ios-frame"] > div:nth-child(2), [data-om-starter="ios-frame"] > div:nth-child(4) { display:none !important; } *, *::before, *::after { animation:none !important; }' });
  const frame = ref.locator('[data-om-starter="ios-frame"]');
  const jump = async n => { await ref.locator('aside button').nth(n - 1).evaluate(el => el.click()); };
  const capture = async name => {
    await app.mouse.move(0, 0); await ref.mouse.move(1000, 990);
    await expect(app.locator('[role="status"]:not(.update-status)')).toHaveCount(0, { timeout: 5000 });
    const [a, r] = await Promise.all([
      app.screenshot({ path: new URL(name + '-app.png', output).pathname }),
      frame.screenshot({ path: new URL(name + '-reference.png', output).pathname }),
    ]);
    const ap = PNG.sync.read(a), rp = PNG.sync.read(r), diff = new PNG({ width: 402, height: 874 });
    const mismatch = pixelmatch(ap.data, rp.data, diff.data, 402, 874, { threshold: .15 });
    await fs.writeFile(new URL(name + '-diff.png', output), PNG.sync.write(diff));
    const result = { screen: name, changedPixels: mismatch, percent: Number((mismatch / (402 * 874) * 100).toFixed(2)),
      appText: await app.locator('.ledger-app').innerText(), referenceText: await frame.innerText() };
    results.push(result); console.log(name, result.percent + '% pixels differ');
  };
  await capture('01-home');
  await jump(2); await app.getByRole('button', { name: 'Log', exact: true }).click(); await capture('02-log');
  await jump(3); await app.getByRole('button', { name: /Bellagio/ }).click(); await capture('03-detail');
  await jump(4); await app.getByRole('button', { name: 'New', exact: true }).click(); await capture('04-new');
  await jump(5); for (const digit of '500') await app.getByRole('button', { name: digit, exact: true }).click();
  await app.getByRole('button', { name: 'Start · clock runs' }).click(); await capture('05-live');
  await jump(6); await app.getByRole('button', { name: 'Cash out', exact: true }).click(); await capture('06-cashout');
  await app.getByRole('button', { name: 'Back', exact: true }).click();
  await app.getByRole('button', { name: '← Back to xbenben' }).click();
  await jump(7); await app.getByRole('button', { name: 'Stats', exact: true }).click(); await capture('07-stats');
  await jump(8); await app.getByRole('button', { name: 'Settings', exact: true }).click(); await capture('08-settings');
  await jump(9); await app.getByRole('button', { name: /Import from analytics7/ }).click(); await capture('09-import-pick');
  const fixture = process.env.LEDGER_PRIVATE_SAMPLE || new URL('../public/sample-analytics7.xml', import.meta.url).pathname;
  const count = (await fs.readFile(fixture, 'utf8')).match(/<cash\b/g).length;
  await frame.locator('input[type="file"]').setInputFiles(fixture);
  await app.getByLabel('Choose .xml file').setInputFiles(fixture);
  await expect(frame).toContainText('0 of ' + count);
  await capture('09-import-map');
  await frame.getByRole('button', { name: 'Review ' + count + ' rows' }).click();
  await app.getByRole('button', { name: 'Review ' + count + ' rows' }).click(); await capture('09-import-review');
  await frame.getByRole('button', { name: 'Import ' + count + ' sessions', exact: true }).click();
  await app.getByRole('button', { name: 'Import ' + count + ' sessions', exact: true }).click(); await capture('imported-home');
  await fs.writeFile(new URL('parity-results.json', output), JSON.stringify({ viewport: [402, 874], frozenTime: date.toISOString(), safeAreas: [42, 34], results }, null, 2));
  const html = `<!doctype html><meta charset="utf-8"><title>xbenben parity evidence</title><style>body{font:15px system-ui;background:#e9e9ea;margin:30px}section{margin:0 0 40px}img{width:402px;height:874px}figure{display:inline-block;margin:8px}figcaption{margin-bottom:8px}h2{margin-bottom:0}</style><h1>xbenben · visual parity</h1><p>402 × 874, identical data and time. Prototype hardware hidden; app safe areas set to 42 / 34 px for comparison. Differences include deliberate production changes. See PARITY.md.</p>` + results.map(r => `<section><h2>${r.screen} · ${r.percent}% changed pixels</h2>${['reference', 'app', 'diff'].map(v => `<figure><figcaption>${v}</figcaption><img src="${r.screen}-${v}.png"></figure>`).join('')}</section>`).join('');
  await fs.writeFile(new URL('index.html', output), html);
} finally { await browser.close(); }
