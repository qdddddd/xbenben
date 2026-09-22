import { chromium } from '@playwright/test';
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const app = await browser.newPage({ viewport: { width: 402, height: 874 }, timezoneId: 'Asia/Taipei' });
  const errors = [];
  app.on('pageerror', e => errors.push(e.message));
  await app.goto('http://127.0.0.1:5173/');
  await app.getByRole('button', { name: 'Settings', exact: true }).click();
  await app.getByRole('button', { name: 'Restore sample log', exact: true }).click();
  await app.getByRole('dialog').getByRole('button', { name: 'Restore sample log', exact: true }).click();
  await app.getByRole('button', { name: 'Home', exact: true }).click();
  await app.evaluate(() => document.fonts.ready);
  await app.screenshot({ path: 'evidence/current-home.png' });
  console.log(JSON.stringify({ app: await app.locator('main').innerText(), errors }, null, 2));
  const reference = await browser.newPage({ viewport: { width: 1060, height: 1000 }, timezoneId: 'Asia/Taipei' });
  reference.on('pageerror', e => console.log('Oracle page error:', e.message));
  await reference.goto('http://127.0.0.1:8765/Ledger.dc.html');
  await reference.locator('[data-om-starter="ios-frame"]').waitFor({ timeout: 45000 });
  await reference.evaluate(() => document.fonts.ready);
  await reference.screenshot({ path: 'evidence/prototype-full.png' });
  console.log('Prototype:', (await reference.locator('[data-om-starter="ios-frame"]').innerText()).slice(0, 2500));
} finally { await browser.close(); }
