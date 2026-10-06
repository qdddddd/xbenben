import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import { freshLedger } from '../../src/storage.js';

const key = 'ledger:data:v1', start = Date.parse('2026-10-06T04:00:00Z');
const instant = minutes => start + minutes * 60000;
const saved = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
const screen = (page, name) => page.locator(`[data-screen="${name}"]`);
const button = (page, name) => page.getByRole('button', { name, exact: true });
async function at(page, minutes) {
  await page.clock.setFixedTime(new Date(instant(minutes)));
  await page.evaluate(() => window.dispatchEvent(new Event('pageshow')));
}
async function startSession(page, sessions = []) {
  await page.clock.setFixedTime(new Date(start));
  await page.goto('/');
  await page.evaluate(({ key, data }) => localStorage.setItem(key, JSON.stringify(data)), { key, data: { version: 1, ...freshLedger(), sessions } });
  await page.reload();
  await button(page, 'Start session').click();
  await page.getByRole('button', { name: /^Venue/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Home game', exact: true }).click();
  await page.keyboard.type('500');
  await button(page, 'Start · clock runs').click();
}
async function settings(page) {
  await button(page, '← Back to xbenben').click();
  await button(page, 'Settings').click();
}
async function backup(page) {
  await button(page, 'Back up to iCloud / file').click();
  const download = page.waitForEvent('download');
  await button(page, 'Download backup').click();
  return fs.readFile(await (await download).path(), 'utf8');
}

for (const width of [402, 320]) test(`pause controls and both paused indicators are clear and separated at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: width === 402 ? 874 : 568 });
  await startSession(page);
  await page.addStyleTag({ content: ':root { --safe-top: 44px; --safe-bottom: 34px; }' });
  await at(page, 30);
  const pause = button(page, 'Pause session');
  const layout = await screen(page, 'active').evaluate(el => {
    const rect = el => { const { top, right, bottom, left, height, width } = el.getBoundingClientRect(); return { top, right, bottom, left, height, width }; };
    const buttons = [...el.querySelectorAll('button')];
    return { pause: rect(el.querySelector('.pause-control')),
      discard: rect(buttons.find(b => b.textContent === 'Discard')), cash: rect(buttons.find(b => b.textContent === 'Cash out')),
      overflow: el.scrollWidth > el.clientWidth, viewport: window.innerHeight };
  });
  expect(layout.pause.height).toBeGreaterThanOrEqual(48);
  expect(layout.pause.width).toBeGreaterThanOrEqual(200);
  expect(layout.pause.left).toBeGreaterThanOrEqual(0);
  expect(layout.pause.right).toBeLessThanOrEqual(width);
  expect(layout.pause.bottom).toBeLessThanOrEqual(layout.viewport - 34);
  expect(layout.pause.top - layout.discard.bottom).toBeGreaterThanOrEqual(24);
  expect(layout.cash.top - layout.pause.bottom).toBeGreaterThanOrEqual(24);
  expect(layout.overflow).toBe(false);
  await page.screenshot({ path: `evidence/pause/running-${width}.png`, animations: 'disabled' });
  await pause.click(); await at(page, 45);
  await expect(page.getByTestId('timer')).toHaveText('0:30:00');
  await expect(screen(page, 'active').getByText('Paused', { exact: true })).toBeVisible();
  await expect(button(page, 'Resume session')).toBeVisible();
  await page.screenshot({ path: `evidence/pause/paused-${width}.png`, animations: 'disabled' });
  await button(page, 'Cash out').click(); await page.keyboard.type('800');
  await expect(screen(page, 'cashout')).toContainText('0h 30m · +$600/h');
  await button(page, 'Book session').scrollIntoViewIfNeeded();
  const book = await button(page, 'Book session').boundingBox();
  const keypad = await screen(page, 'cashout').locator(':scope > div').last().boundingBox();
  expect(book.height).toBeGreaterThanOrEqual(44);
  expect(book.y + book.height).toBeLessThanOrEqual(keypad.y);
  await page.screenshot({ path: `evidence/pause/cashout-${width}.png`, animations: 'disabled' });
  await button(page, 'Back').click();
  await button(page, '← Back to xbenben').click();
  await expect(page.getByTestId('active-banner')).toContainText('Session paused · 0:30:00');
  await page.getByTestId('active-banner').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `evidence/pause/home-${width}.png`, animations: 'disabled' });
  await page.getByTestId('active-banner').click();
  await expect(button(page, 'Resume session')).toBeVisible(); // Opening the session must not resume it.
  await button(page, 'Resume session').click(); await at(page, 60);
  await expect(page.getByTestId('timer')).toHaveText('0:45:00');
  expect((await saved(page)).active.pauses).toEqual([{ startedAt: instant(30), endedAt: instant(45) }]);
  await button(page, '← Back to xbenben').click();
  await expect(page.getByTestId('active-banner')).toContainText('Session running · 0:45:00');
});

test('three pauses agree across live time, cash-out, log, detail, stats, Longest, CSV and backup restore', async ({ page, context }) => {
  test.setTimeout(60000);
  const previous = { id: 'legacy-longest', cur: 'USD', venue: 'Longer playing session', city: '', game: 'NLHE', seats: 9,
    sb: 2, bb: 5, startedAt: start - 86400000, endedAt: start - 86400000 + 105 * 60000,
    buyIns: [{ amount: 500, at: start - 86400000 }], cashOut: 500, tips: 0, notes: '' };
  await startSession(page, [previous]);
  await at(page, 30); await button(page, 'Pause session').click();
  const firstPause = (await saved(page)).active;
  await at(page, 40); await page.reload();
  await expect(button(page, 'Resume session')).toBeVisible();
  await expect(page.getByTestId('timer')).toHaveText('0:30:00');
  expect((await saved(page)).active).toEqual(firstPause);
  await at(page, 45); await button(page, 'Resume session').click();
  await at(page, 90); await button(page, 'Pause session').click();
  await at(page, 120); await button(page, 'Resume session').click();
  await at(page, 135); await button(page, 'Pause session').click();
  await at(page, 150);
  await expect(page.getByTestId('timer')).toHaveText('1:30:00');
  await button(page, '+ Re-buy').click(); await button(page, 'Custom amount').click();
  await page.keyboard.type('125'); await button(page, 'Log re-buy').click();
  await expect(page.getByRole('status')).toHaveText('Re-buy $125 logged');
  await expect(button(page, 'Resume session')).toBeVisible();
  const paused = (await saved(page)).active;
  expect(paused.buyIns.map(b => b.amount)).toEqual([500, 125]);
  expect(paused.pauses).toEqual([{ startedAt: instant(30), endedAt: instant(45) },
    { startedAt: instant(90), endedAt: instant(120) }, { startedAt: instant(135), endedAt: null }]);
  await settings(page);
  const file = await backup(page);
  expect(JSON.parse(file).ledger.active).toEqual(paused);
  await button(page, 'Live').click(); await at(page, 165);
  await button(page, 'Cash out').click(); await page.keyboard.type('925');
  await expect(screen(page, 'cashout')).toContainText('Session paused');
  await expect(screen(page, 'cashout')).toContainText('1h 30m · +$200/h');
  await at(page, 180);
  await expect(screen(page, 'cashout')).toContainText('1h 30m · +$200/h');
  await button(page, 'Book session').click();
  const done = (await saved(page)).sessions[0];
  expect(done.endedAt).toBe(instant(180));
  expect(done.pauses).toEqual([...paused.pauses.slice(0, 2), { startedAt: instant(135), endedAt: instant(180) }]);
  expect(done.buyIns).toEqual(paused.buyIns);
  await expect(screen(page, 'home')).toContainText('3.3 h logged');
  await expect(screen(page, 'home').getByText('Per hour', { exact: true }).locator('..')).toContainText('+$92');
  await button(page, 'Log').click();
  await expect(screen(page, 'log').getByText('Hours', { exact: true }).locator('..')).toContainText('3.3');
  const row = page.getByRole('button', { name: /Home game.*1h 30m/ });
  await expect(row).toContainText('+$200'); await row.click();
  await expect(screen(page, 'detail').getByText('Duration', { exact: true }).locator('..')).toContainText('1h 30m');
  await expect(screen(page, 'detail')).toContainText('+$200 / hour · +40.0 bb/h');
  await expect(page.getByTestId('paused-time')).toContainText('Paused time · 1:30:00');
  await button(page, 'Stats').click();
  await expect(page.getByTestId('bb-per-hour')).toHaveText('+18.5');
  await expect(page.getByTestId('bb-per-100')).toHaveText('+61.5');
  await expect(page.getByText('Longest', { exact: true }).locator('..')).toContainText('Longer playing session');
  await expect(page.getByText('Longest', { exact: true }).locator('..')).toContainText('1h 45m');
  await expect(page.getByRole('row', { name: /USD 2\/5/ })).toContainText('3.3');
  await expect(page.getByRole('row', { name: /USD 2\/5/ })).toContainText('+$92');
  await button(page, 'Settings').click();
  const download = page.waitForEvent('download'); await button(page, 'Export CSV').click();
  const exported = await fs.readFile(await (await download).path(), 'utf8');
  expect(exported).toContain('"625","925","0","300","1.5000"');
  expect(exported).toContain('"live","1.5000"');
  expect(exported).toContain(JSON.stringify(done.pauses).replaceAll('"', '""'));
  const completedBackup = JSON.parse(await backup(page));
  expect(completedBackup.ledger.sessions[0]).toEqual(done);
  await page.getByLabel('Restore xbenben backup').setInputFiles({ name: 'paused.json', mimeType: 'application/json', buffer: Buffer.from(file) });
  await expect(page.getByRole('dialog')).toContainText('Paused');
  await button(page, 'Replace ledger & restore').click();
  await expect(page.getByTestId('timer')).toHaveText('1:30:00');
  expect((await saved(page)).active).toEqual(paused);
  await page.close();
  const reopened = await context.newPage(); await reopened.clock.setFixedTime(new Date(instant(400)));
  await context.setOffline(true); await reopened.goto('/');
  await expect(button(reopened, 'Resume session')).toBeVisible();
  await expect(reopened.getByTestId('timer')).toHaveText('1:30:00');
  expect((await saved(reopened)).active).toEqual(paused);
  await button(reopened, 'Resume session').click(); await at(reopened, 415);
  await expect(reopened.getByTestId('timer')).toHaveText('1:45:00');
});

for (const paused of [false, true]) test(`a service-worker update preserves a ${paused ? 'paused' : 'resumed'} session and its history`, async ({ page }) => {
  await startSession(page);
  await at(page, 30); await button(page, 'Pause session').click();
  if (!paused) { await at(page, 45); await button(page, 'Resume session').click(); }
  await at(page, 60);
  await page.evaluate(() => navigator.serviceWorker.ready); await page.reload();
  const before = await saved(page), worker = 'dist/sw.js', original = await fs.readFile(worker, 'utf8');
  try {
    await fs.writeFile(worker, original + `\n// Test release: pause state ${paused}\n`);
    await page.evaluate(async () => (await navigator.serviceWorker.getRegistration()).update());
    await expect(page.locator('.update-notice')).toBeVisible();
    await page.locator('.update-notice').getByRole('button', { name: 'Later', exact: true }).click();
    await settings(page);
    await Promise.all([page.waitForEvent('load'), button(page, 'Update app').click()]);
    expect(await saved(page)).toEqual(before);
    await expect(button(page, paused ? 'Resume session' : 'Pause session')).toBeVisible();
    await at(page, 75);
    await expect(page.getByTestId('timer')).toHaveText(paused ? '0:30:00' : '1:00:00');
  } finally { await fs.writeFile(worker, original); }
});

test('analytics7 import summaries keep legacy duration until pauseDuration units are verified', async ({ page }) => {
  const xml = (await fs.readFile('public/sample-analytics7.xml', 'utf8')).replaceAll('<cash ', '<cash pauseDuration="3600" ');
  await page.goto('/'); await button(page, 'Settings').click();
  await page.getByRole('button', { name: /Import from analytics7/ }).click();
  await page.getByLabel('Choose .xml file').setInputFiles({ name: 'unverified-pauses.xml', mimeType: 'application/xml', buffer: Buffer.from(xml) });
  await button(page, 'Review 3 rows').click();
  for (const duration of ['12.0 h', '3h 00m', '4h 00m', '5h 00m']) await expect(screen(page, 'import')).toContainText(duration);
  await button(page, 'Import 3 sessions').click();
  await expect(screen(page, 'home')).toContainText('12.0 h logged');
  expect((await saved(page)).sessions.every(s => s.pauses === undefined)).toBe(true);
});
