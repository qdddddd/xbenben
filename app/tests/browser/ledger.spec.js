import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { freshLedger } from '../../src/storage.js';

const fixture = path.resolve('public/sample-analytics7.xml');
const key = 'ledger:data:v1';
const screen = (page, name) => page.locator(`[data-screen="${name}"]`);
const settings = page => page.getByRole('button', { name: 'Settings', exact: true }).click();
const home = page => page.getByRole('button', { name: 'Home', exact: true }).click();
const saved = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
async function sample(page) {
  await settings(page);
  await page.getByRole('button', { name: 'Restore sample log', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Restore sample log', exact: true }).click();
  await home(page);
}
async function openImport(page) {
  await settings(page);
  await page.getByRole('button', { name: /Import from analytics7/ }).click();
}
async function importFile(page) {
  await openImport(page);
  await page.getByLabel('Choose .xml file').setInputFiles(fixture);
}
async function choose(page, row, option) {
  await page.getByRole('button', { name: row }).click();
  await page.getByRole('dialog').getByRole('button', { name: option, exact: true }).click();
}
async function digits(page, value) {
  for (const digit of value) await page.getByRole('button', { name: digit, exact: true }).click();
}
test.beforeEach(async ({ page }) => { await page.goto('/'); });

test('empty first launch and the USD sample acceptance figures, log filters and detail', async ({ page }) => {
  await expect(page.getByTestId('bankroll')).toHaveText('+$0');
  await expect(page.getByText('Nothing logged yet')).toBeVisible();
  await sample(page);
  await expect(page.getByTestId('bankroll')).toHaveText('+$3,085');
  for (const value of ['6 sessions', '30.7 h logged', '+$100', '67%', '+$514', '+$960', '−$180', '+$2,090', '+$465']) await expect(screen(page, 'home')).toContainText(value);
  await page.getByRole('button', { name: 'Log', exact: true }).click();
  await page.getByRole('button', { name: 'Wins', exact: true }).click();
  await expect(screen(page, 'log')).toContainText('+$3,855');
  await page.getByRole('button', { name: 'Losses', exact: true }).click();
  await expect(screen(page, 'log')).toContainText('−$770');
  await page.getByRole('button', { name: 'All', exact: true }).click();
  await page.getByRole('button', { name: /Bellagio/ }).click();
  await expect(screen(page, 'detail')).toContainText('+$960');
  await expect(screen(page, 'detail')).toContainText('38.4 bb/h');
  await expect(screen(page, 'detail')).toContainText('Table broke twice');
  await page.getByRole('button', { name: 'Delete session' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click();
  expect((await saved(page)).sessions).toHaveLength(6);
  await page.getByRole('button', { name: 'Delete session' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete session', exact: true }).click();
  expect((await saved(page)).sessions).toHaveLength(5);
});

test('HKD import keeps original amounts while reports combine currencies and duplicates skip', async ({ page }) => {
  await sample(page); await importFile(page);
  await expect(screen(page, 'import')).toContainText('3');
  await expect(screen(page, 'import')).toContainText('Feb 26 – Mar 26');
  await expect(screen(page, 'import')).toContainText('Demo City');
  await expect(page.getByRole('button', { name: /Convert to USD/ })).toContainText('1 HKD = 0.128 USD');
  await page.getByRole('button', { name: 'Review 3 rows' }).click();
  for (const value of ['+HK$2,900', '12.0 h', '3 to add · 0 skipped']) await expect(screen(page, 'import')).toContainText(value);
  await page.getByRole('button', { name: 'Import 3 sessions', exact: true }).click();
  await expect(page.getByTestId('bankroll')).toHaveText('+$3,456');
  await expect(screen(page, 'home')).toContainText('67%');
  await expect(screen(page, 'home')).toContainText('+$384');
  await expect(screen(page, 'home')).toContainText('42.7 h logged');
  expect((await saved(page)).settings.currency).toBe('USD');
  expect((await saved(page)).sessions.filter(s => s.src === 'analytics7').every(s => s.playType === 'live')).toBeTruthy();
  await settings(page);
  await expect(screen(page, 'settings')).toContainText('1 HKD = 0.128 USD');
  await page.getByRole('button', { name: /Import from analytics7/ }).click();
  await page.getByLabel('Choose .xml file').setInputFiles(fixture);
  await expect(screen(page, 'import')).toContainText('3 of 3 already in your log');
  await page.getByRole('button', { name: 'Review 3 rows' }).click();
  await expect(screen(page, 'import')).toContainText('0 to add · 3 skipped');
  await expect(page.getByRole('button', { name: 'Import 0 sessions' })).toBeDisabled();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await choose(page, /^Display currency/, 'HKD Hong Kong');
  await home(page);
  await expect(page.getByTestId('bankroll')).toHaveText('+HK$27,003');
  await page.getByRole('button', {name:'Stats',exact:true}).click();
  await expect(page.getByTestId('bankroll')).toHaveText('+HK$27,003');
  const data = await saved(page);
  expect(data.sessions.filter(s => s.cur === 'USD')).toHaveLength(6);
  expect(data.sessions.filter(s => s.cur === 'HKD')).toHaveLength(3);
});

test('converted import uses displayed fixed rate, and importing duplicates gives unique IDs', async ({ page }) => {
  await importFile(page);
  await page.getByRole('button', { name: /Convert to USD/ }).click();
  await page.getByRole('button', { name: 'Review 3 rows' }).click();
  await page.getByRole('button', { name: 'Import 3 sessions', exact: true }).click();
  let data = await saved(page);
  expect(data.sessions).toHaveLength(3);
  expect(data.sessions.every(s => s.cur === 'USD' && s.importRate === .128)).toBeTruthy();
  const first = data.sessions.find(s => s.cashOut === 486);
  expect(first.buyIns[0].amount).toBe(256); expect(first.sb).toBe(1.3); expect(first.bb).toBe(2.6);
  await importFile(page);
  await expect(screen(page, 'import')).toContainText('3 of 3 already in your log');
  await page.getByRole('button', { name: 'Skipping', exact: true }).click();
  await page.getByRole('button', { name: 'Review 3 rows' }).click();
  await page.getByRole('button', { name: 'Import 3 sessions', exact: true }).click();
  data = await saved(page);
  expect(data.sessions).toHaveLength(6); expect(new Set(data.sessions.map(s => s.id)).size).toBe(6);
  await page.getByRole('button', { name: 'Log', exact: true }).click();
  await page.getByRole('button', { name: /Demo Room A/ }).first().click();
  await page.getByRole('button', { name: 'Delete session' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete session', exact: true }).click();
  expect((await saved(page)).sessions).toHaveLength(5);
});

test('invalid XML, empty XML and unreadable dates stay at step one with the prototype messages', async ({ page }) => {
  await openImport(page);
  for (const [content, message] of [
    ['not xml', 'That file is not valid XML.'],
    ['<model><sessions/></model>', 'No cash sessions found in that file. Tournaments and hand histories are not imported.'],
    ['<model><cash startdate="invalid"/></model>', 'Sessions were found but none had readable dates.'],
  ]) {
    await page.getByLabel('Choose .xml file').setInputFiles({ name: 'bad.xml', mimeType: 'application/xml', buffer: Buffer.from(content) });
    await expect(page.getByRole('alert')).toHaveText(message);
    await expect(screen(page, 'import')).toContainText('step 1/3');
  }
  await page.getByLabel('Choose .xml file').setInputFiles(fixture);
  await expect(screen(page, 'import')).toContainText('step 2/3');
});

const singleBlindXML = `<model>
  <bankroll name="Demo city"/><currency bankroll="Demo city" currencyCode="HKD"/>
  <cash id="synthetic-single-blind" startdate="05/09/26 12:00:00" enddate="05/09/26 14:00:00"
    bankroll="Demo city" location="Single-blind demo" blinds="25" ante="5" islive="1" limit="0" variant="Hold'em" tablesize="6">
    <result owner="1" buyin="1500" chipcount="1800" tips="50">
      <buyin amount="1000" date="05/09/26 12:00:00"/><buyin amount="500" date="05/09/26 13:00:00"/>
    </result>
  </cash>
</model>`;
const xmlFile = content => ({ name: 'synthetic.xml', mimeType: 'application/xml', buffer: Buffer.from(content) });

test('single-blind imports default the small blind to half and preserve money, stats and duplicates', async ({ page }) => {
  await openImport(page);
  await page.getByLabel('Choose .xml file').setInputFiles(xmlFile(singleBlindXML));
  await page.getByRole('button', { name: 'Review 1 rows' }).click();
  await expect(screen(page, 'import')).toContainText('12.5/25');
  await expect(screen(page, 'import')).toContainText('+HK$250');
  await page.getByRole('button', { name: 'Import 1 sessions', exact: true }).click();
  const data = await saved(page), imported = data.sessions[0];
  expect(imported).toMatchObject({ sb: 12.5, bb: 25, cur: 'HKD', cashOut: 1800, tips: 50 });
  expect(imported.buyIns.map(b => b.amount)).toEqual([1000, 500]);
  await expect(page.getByTestId('bankroll')).toHaveText('+$32');
  await page.getByRole('button', { name: 'Stats', exact: true }).click();
  await expect(page.getByTestId('bb-per-100')).toHaveText('+16.7');
  await expect(page.getByTestId('bb-per-hour')).toHaveText('+5.0');
  await page.reload(); expect((await saved(page)).sessions).toEqual(data.sessions);
  await openImport(page);
  await page.getByLabel('Choose .xml file').setInputFiles(xmlFile(singleBlindXML));
  await expect(screen(page, 'import')).toContainText('1 of 1 already in your log');
  await page.getByRole('button', { name: 'Review 1 rows' }).click();
  await expect(page.getByRole('button', { name: 'Import 0 sessions' })).toBeDisabled();
});

test('single-blind support still rejects invalid stakes, money and missing results without changing data', async ({ page }) => {
  await sample(page); const original = await saved(page);
  await openImport(page);
  const invalid = [
    ...['oops', '-25', 'Infinity', '1000000000001', '5/nope'].map(blinds => singleBlindXML.replace('blinds="25"', `blinds="${blinds}"`)),
    singleBlindXML.replace('chipcount="1800"', 'chipcount="-1"'),
    singleBlindXML.replace('amount="500"', 'amount="bad"'),
    singleBlindXML.replace(/<result[\s\S]*?<\/result>/, ''),
  ];
  for (const xml of invalid) {
    await page.getByLabel('Choose .xml file').setInputFiles(xmlFile(xml));
    await expect(page.getByRole('alert')).toHaveText('Some sessions have missing results or invalid amounts. Check the export and try again.');
    expect((await saved(page)).sessions).toEqual(original.sessions);
  }
});

test('live clock and rebuy survive reload, closing a window, currency changes and booking', async ({ page, context }) => {
  const start = new Date('2026-09-22T08:00:00Z');
  await page.clock.install({ time: start });
  await page.getByRole('button', { name: 'Start session', exact: true }).click();
  await digits(page, '500');
  await page.getByRole('button', { name: 'Start · clock runs' }).click();
  await page.getByRole('button', { name: '+ Re-buy', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('button', { name: '$500 100 bb', exact: true })).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: '$500 100 bb', exact: true }).click();
  await page.clock.fastForward(300000);
  await page.reload();
  await expect(page.getByTestId('timer')).toHaveText('0:05:00');
  expect((await saved(page)).active.buyIns).toHaveLength(2);
  await page.close();
  const reopened = await context.newPage();
  await reopened.clock.install({ time: new Date(start.getTime() + 600000) });
  await reopened.goto('/');
  await expect(reopened.getByTestId('timer')).toHaveText('0:10:00');
  await reopened.getByRole('button', { name: '← Back to xbenben' }).click();
  await settings(reopened); await choose(reopened, /^Display currency/, 'HKD Hong Kong');
  await reopened.getByRole('button', { name: 'Live', exact: true }).click();
  await reopened.getByRole('button', { name: 'Cash out', exact: true }).click();
  await digits(reopened, '1500');
  await reopened.getByRole('button', { name: /Tips & rake paid/ }).click(); await digits(reopened, '20');
  await expect(screen(reopened, 'cashout')).toContainText('+$480');
  await expect(screen(reopened, 'cashout')).not.toContainText('HK$');
  await reopened.getByRole('button', { name: 'Book session', exact: true }).click();
  await expect(reopened.getByTestId('bankroll')).toHaveText('+HK$3,750');
  expect((await saved(reopened)).settings.currency).toBe('HKD');
  const data = await saved(reopened);
  expect(data.active).toBeNull(); expect(data.sessions[0].cur).toBe('USD'); expect(data.sessions[0].tips).toBe(20);
});

test('settings, quick presets, personal pickers and imported venues persist', async ({ page }) => {
  await settings(page);
  await choose(page, /^Accent colour/, 'Forest');
  await choose(page, /^Profit & loss colours/, 'Signal Green / red');
  await page.getByRole('button', { name: /^Quick-start presets/ }).click();
  await choose(page, /^Default game/, 'PLO');
  await choose(page, /^Default table/, '6-max');
  await page.getByRole('button', { name: /^Default stakes/ }).click();
  await page.getByRole('button', { name: '+ Add stakes' }).click();
  await page.getByLabel('Small blind', { exact: true }).fill('50'); await page.getByLabel('Big blind', { exact: true }).fill('100');
  await page.getByRole('button', { name: 'Save stakes' }).click();
  await page.reload(); await page.getByRole('button', { name: 'Start session', exact: true }).click();
  await expect(screen(page, 'new')).not.toContainText('One tap');
  for (const value of ['PLO', '6-max', '50/100']) await expect(screen(page, 'new')).toContainText(value);
  await page.getByRole('button', { name: /^Venue/ }).click();
  await page.getByRole('button', { name: '+ Add venue' }).click();
  await page.getByLabel('Venue name').fill('My cash game'); await page.getByLabel('City (optional)').fill('Taipei');
  await page.getByRole('button', { name: 'Save venue' }).click();
  await expect(screen(page, 'new')).toContainText('My cash game');
  await page.reload(); await page.getByRole('button', { name: 'Start session', exact: true }).click();
  await expect(screen(page, 'new')).toContainText('My cash game');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await importFile(page); await page.getByRole('button', { name: 'Review 3 rows' }).click();
  await page.getByRole('button', { name: 'Import 3 sessions', exact: true }).click();
  await page.getByRole('button', { name: 'Start session', exact: true }).click();
  await page.getByRole('button', { name: /^Venue/ }).click();
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Demo Room B Demo City' })).toBeVisible();
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Demo Room A Demo City' })).toBeVisible();
  expect((await saved(page)).settings.accent).toBe('forest');
});

test('sample restore preserves real data; all destructive actions require confirmation', async ({ page }) => {
  await page.getByRole('button', { name: 'Start session', exact: true }).click();
  await page.getByRole('button', { name: /Default NLHE/ }).click();
  await page.getByRole('button', { name: 'Discard', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(screen(page, 'active')).toBeVisible();
  await page.getByRole('button', { name: 'Cash out', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Book session' })).toBeEnabled();
  await page.getByRole('button', { name: 'Book session' }).click();
  await sample(page);
  expect((await saved(page)).sessions).toHaveLength(7);
  await settings(page);
  await page.getByRole('button', { name: 'Remove sample log', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Remove sample log', exact: true }).click();
  expect((await saved(page)).sessions).toHaveLength(1);
  await page.getByRole('button', { name: 'Erase all sessions', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click();
  expect((await saved(page)).sessions).toHaveLength(1);
  await page.getByRole('button', { name: 'Erase all sessions', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Erase all sessions', exact: true }).click();
  expect((await saved(page)).sessions).toHaveLength(0);
  await page.getByRole('button', { name: 'New', exact: true }).click();
  await page.getByRole('button', { name: /Default NLHE/ }).click();
  await page.getByRole('button', { name: 'Discard', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Discard session', exact: true }).click();
  expect((await saved(page)).active).toBeNull();
});

test('CSV exports all original session currencies and amounts in a real file', async ({ page }) => {
  await sample(page); await importFile(page);
  await page.getByRole('button', {name:'Review 3 rows'}).click();
  await page.getByRole('button', {name:'Import 3 sessions',exact:true}).click();
  await settings(page);
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  const file = await pending, content = await fs.readFile(await file.path(), 'utf8');
  expect(file.suggestedFilename()).toMatch(/^xbenben-sessions-.*\.csv$/);
  expect(content).toContain('Bellagio'); expect(content).toContain('"960"');
  expect(content.trim().split('\r\n')).toHaveLength(10);
  expect(content).toContain('"HKD"'); expect(content).toContain('"USD"');
  expect(content).toContain('"2970"');
});

test('offline production reload, fonts, icons and sample import work after install caching', async ({ page, context }) => {
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBeTruthy();
  await sample(page);
  await context.setOffline(true); await page.reload();
  await expect(page.getByTestId('bankroll')).toHaveText('+$3,085');
  await page.evaluate(() => document.fonts.ready);
  const loadedFonts = await page.evaluate(async () => {
    const heading = await document.fonts.load('400 26px "Barlow Condensed"');
    const body = await document.fonts.load('400 16px "Barlow"');
    return heading.length > 0 && body.length > 0 && [...heading, ...body].every(font => font.status === 'loaded');
  });
  expect(loadedFonts).toBeTruthy();
  await openImport(page); await page.getByRole('button', { name: 'Use the sample export' }).click();
  await expect(screen(page, 'import')).toContainText('3');
  const installIcons = await page.evaluate(async () => {
    const apple = document.querySelector('link[rel="apple-touch-icon"]');
    const manifest = await (await fetch(document.querySelector('link[rel="manifest"]').href)).json();
    return Promise.all([{ src: apple.href, sizes: apple.sizes.value }, ...manifest.icons].map(async icon => {
      const response = await fetch(icon.src);
      const bitmap = await createImageBitmap(await response.blob());
      const canvas = document.createElement('canvas'); canvas.width = bitmap.width; canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d'); ctx.drawImage(bitmap, 0, 0);
      const pixel = (x, y) => [...ctx.getImageData(Math.floor(x * bitmap.width), Math.floor(y * bitmap.height), 1, 1).data];
      const data = ctx.getImageData(0, 0, bitmap.width, bitmap.height).data;
      const result = { src: new URL(icon.src, location.href).pathname, sizes: icon.sizes, width: bitmap.width, height: bitmap.height,
        corner: pixel(0, 0), center: pixel(.5, .5), chip: pixel(.81, .5), opaque: true, safe: true };
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] !== 255) result.opaque = false;
        if (data[i] !== 89 || data[i + 1] !== 128 || data[i + 2] !== 166) {
          const x = (i / 4) % bitmap.width, y = Math.floor(i / 4 / bitmap.width);
          if (Math.hypot(x + .5 - bitmap.width / 2, y + .5 - bitmap.height / 2) > bitmap.width * .4) result.safe = false;
        }
      }
      bitmap.close(); return result;
    }));
  });
  expect(installIcons.map(icon => icon.src)).toEqual(['/icons/apple-touch-icon-chip.png', '/icons/chip-192.png', '/icons/chip-512.png', '/icons/chip-maskable-512.png']);
  for (const icon of installIcons) {
    expect(`${icon.width}x${icon.height}`).toBe(icon.sizes);
    expect(icon).toMatchObject({ corner: [89, 128, 166, 255], center: [89, 128, 166, 255], chip: [242, 242, 243, 255], opaque: true, safe: true });
  }
  const favicons = await page.evaluate(async () => Promise.all([...document.querySelectorAll('link[rel="icon"]')].map(async icon => (await fetch(icon.href)).ok)));
  expect(favicons).toEqual([true, true, true]);
});

test('storage recovery preserves unreadable data and offers a real recovery download', async ({ page }) => {
  await page.evaluate(key => localStorage.setItem(key, '{broken'), key); await page.reload();
  await expect(page.getByRole('alert')).toContainText('The original is preserved');
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe('{broken');
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download recovery copy' }).click();
  expect(await fs.readFile(await (await pending).path(), 'utf8')).toBe('{broken');
  await page.getByRole('button', { name: 'Reset storage', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Reset storage', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByTestId('bankroll')).toHaveText('+$0');
});

test('a full storage volume visibly reports unsaved changes', async ({ page }) => {
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException('Full', 'QuotaExceededError'); }; });
  await sample(page);
  await expect(page.getByRole('alert')).toContainText('Changes could not be saved');
  await expect(page.getByTestId('bankroll')).toHaveText('+$3,085');
});

test('larger text and session controls stay usable at phone widths and short screen heights', async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await sample(page);
  const readable = async () => {
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    expect(await page.locator('[data-screen]').evaluate(el => el.scrollWidth <= el.clientWidth)).toBeTruthy();
    const small = await page.locator('.ledger-shell *, dialog[open] *').evaluateAll(elements => elements.filter(el =>
      el.getClientRects().length && [...el.childNodes].some(node => node.nodeType === 3 && node.textContent.trim()) &&
      parseFloat(getComputedStyle(el).fontSize) < 13.9
    ).map(el => ({ text: el.textContent.slice(0, 60), size: getComputedStyle(el).fontSize })));
    expect(small, 'Readable captions and full amounts throughout the visible screen').toEqual([]);
  };
  for (const [width, height] of [[402, 874], [390, 844], [320, 568]]) {
    await page.setViewportSize({ width, height });
    for (const tab of ['Home', 'Log', 'Stats', 'Settings']) {
      await page.getByRole('button', { name: tab, exact: true }).click();
      await readable();
    }
  }
  await home(page);
  await page.getByRole('button', { name: 'Start session', exact: true }).click();
  await digits(page, '500');
  await page.getByRole('button', { name: /^Venue/ }).click();
  await readable();
  await page.getByRole('dialog').getByRole('button', { name: 'Home game', exact: true }).click();
  await readable();
  await page.getByRole('button', { name: 'Start · clock runs', exact: true }).click();
  await readable();
  await page.getByRole('button', { name: 'Cash out', exact: true }).click();
  await digits(page, '750');
  await readable();
  await page.getByRole('button', { name: 'Book session', exact: true }).click();
  await expect(screen(page, 'home')).toBeVisible();
  await screen(page, 'home').getByRole('button', { name: /Home game/ }).click();
  await expect(screen(page, 'detail')).toBeVisible();
  await readable();
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await importFile(page);
  await readable();
  await page.getByRole('button', { name: 'Review 3 rows', exact: true }).click();
  await readable();
  await page.getByRole('button', { name: 'Import 3 sessions', exact: true }).click();
  await expect(page.getByTestId('bankroll')).toBeVisible();
  expect(errors).toEqual([]);
});

test('full stakes stay inside padded badges without shrinking on narrow session lists', async ({ page }) => {
  const pairs = [[2, 5], [12.5, 25], [100, 200], [500, 1000], [5000, 10000], [500000000000, 1000000000000]];
  const data = { version: 1, ...freshLedger(), sessions: pairs.map(([sb, bb], index) => ({
    ...bbSession, id: `stakes-${index}`, venue: 'Example card room', cur: 'HKD', sb, bb,
    startedAt: bbSession.startedAt + index * 86400000, endedAt: bbSession.endedAt + index * 86400000,
    cashOut: 14200,
  })) };
  await installLedger(page, data);
  for (const width of [402, 390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    for (const tab of ['Home', 'Log']) {
      await page.getByRole('button', { name: tab, exact: true }).click();
      await page.evaluate(() => document.fonts.ready);
      const badges = page.locator('.stake-badge');
      const expected = pairs.slice(tab === 'Home' ? -4 : 0).reverse().map(([sb, bb]) => `${sb}/${bb}`);
      await expect(badges).toHaveText(expected);
      const issues = await badges.evaluateAll(elements => elements.flatMap(badge => {
        const box = badge.getBoundingClientRect();
        const content = badge.firstElementChild;
        const range = document.createRange(); range.selectNodeContents(content);
        const textFits = [...range.getClientRects()].every(rect =>
          rect.left >= box.left + 7 && rect.right <= box.right - 7 &&
          rect.top >= box.top && rect.bottom <= box.bottom
        );
        const next = badge.nextElementSibling.getBoundingClientRect();
        return textFits && next.left >= box.right + 10 && parseFloat(getComputedStyle(content).fontSize) >= 16
          ? [] : [{ text: badge.textContent, textFits, boxWidth: box.width, nextLeft: next.left }];
      }));
      expect(issues, `Readable, padded stakes on ${tab} at ${width}px`).toEqual([]);
      expect(await page.locator('[data-screen]').evaluate(el => el.scrollWidth <= el.clientWidth)).toBeTruthy();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    }
  }
  await page.getByRole('button', { name: /^100\/200 Example card room/ }).click();
  await expect(screen(page, 'detail')).toContainText('100/200');
  expect((await saved(page)).sessions).toEqual(data.sessions);
});

test('design typography and chip favicon stay local, readable and outside app content', async ({ page }) => {
  await page.evaluate(() => document.fonts.ready);
  const heading = screen(page, 'home').getByText('xbenben', { exact: true });
  await expect(heading).toHaveCSS('font-family', '"Barlow Condensed", system-ui, sans-serif');
  await expect(heading).toHaveCSS('font-weight', '400');
  await expect(page.locator('body')).toHaveCSS('font-weight', '400');
  await expect(screen(page, 'home').getByText('Avg', { exact: true })).toBeVisible();
  await sample(page);
  await settings(page); await choose(page, /^Display currency/, 'HKD Hong Kong');
  for (const width of [402, 320, 402]) {
    await page.setViewportSize({ width, height: 874 });
    for (const tab of ['Home', 'Log', 'Stats']) {
      await page.getByRole('button', { name: tab, exact: true }).click();
      if (tab === 'Home' || tab === 'Stats') await expect(page.getByTestId('bankroll')).toHaveText('+HK$24,103');
      for (const label of await page.locator('.stat-label').all()) {
        await expect(label).toHaveCSS('white-space', 'nowrap');
        await expect(label).toHaveCSS('text-overflow', 'ellipsis');
      }
      await expect.poll(() => page.locator('.fitted-value').evaluateAll(values => values.flatMap(value => {
        const range = document.createRange(); range.selectNodeContents(value);
        const textWidth = range.getBoundingClientRect().width;
        return textWidth <= value.clientWidth + 1 ? [] : [{ text: value.textContent, textWidth, available: value.clientWidth, fontSize: getComputedStyle(value.firstElementChild).fontSize }];
      })), { message: `Full amounts fit their cards on ${tab} at ${width}px` }).toEqual([]);
    }
  }
  const before = await page.locator('link[rel="icon"][type="image/svg+xml"]').getAttribute('href');
  expect(before).toBe('/icons/favicon.svg');
  await settings(page); await choose(page, /^Accent colour/, 'Forest');
  expect(await page.locator('link[rel="icon"][type="image/svg+xml"]').getAttribute('href')).toBe(before);
  await expect(page.locator('#root img, #root image, #root object, #root iframe')).toHaveCount(0);
  const metadata = await page.evaluate(async () => ({
    apple: document.querySelector('link[rel="apple-touch-icon"]').getAttribute('href'),
    manifest: await (await fetch(document.querySelector('link[rel="manifest"]').href)).json(),
    favicon: await (await fetch(document.querySelector('link[rel="icon"][type="image/svg+xml"]').href)).text(),
    externalFonts: performance.getEntriesByType('resource').filter(r => /fonts\.(googleapis|gstatic)\.com/.test(r.name)).length,
  }));
  expect(metadata.apple).toBe('/icons/apple-touch-icon-chip.png');
  expect(metadata.manifest.icons).toEqual([
    { src: '/icons/chip-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/icons/chip-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/icons/chip-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ]);
  expect(metadata.favicon).toContain('fill="#5980a6"');
  expect(metadata.favicon).toContain('stroke-dasharray="11 13.35"');
  expect(metadata.externalFonts).toBe(0);
});

test('single-session peak and lifetime colour remain correct when this month is losing', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-08-31T08:00:00Z'));
  await page.getByRole('button', { name: 'Start session', exact: true }).click();
  await page.getByRole('button', { name: /Default NLHE/ }).click();
  await page.getByRole('button', { name: 'Cash out', exact: true }).click(); await digits(page, '1500');
  await page.getByRole('button', { name: 'Book session' }).click();
  await page.getByRole('button', { name: 'Stats', exact: true }).click();
  await expect(screen(page, 'stats')).toContainText('+$1,000 peak');
  await expect(screen(page, 'stats').locator('polyline')).not.toHaveAttribute('points', '');
  await page.clock.setFixedTime(new Date('2026-09-22T08:00:00Z'));
  await home(page); await page.getByRole('button', { name: 'Start session', exact: true }).click();
  await page.getByRole('button', { name: /Default NLHE/ }).click();
  await page.getByRole('button', { name: 'Cash out', exact: true }).click();
  await page.getByRole('button', { name: 'Book session' }).click();
  await settings(page); await choose(page, /^Profit & loss colours/, 'Signal Green / red');
  await page.getByRole('button', { name: 'Stats', exact: true }).click();
  await expect(page.getByTestId('bankroll')).toHaveText('+$500');
  await expect(page.getByTestId('bankroll')).toHaveCSS('color', 'rgb(28, 122, 79)');
  await home(page);
  await expect(page.getByText('−$500 this month', { exact: true })).toHaveCSS('color', 'rgb(168, 50, 63)');
});

test('unlisted currencies can be kept, mixed currencies are rejected, and within-file duplicates are skipped', async ({ page }) => {
  const source = await fs.readFile(fixture, 'utf8');
  await openImport(page);
  await page.getByLabel('Choose .xml file').setInputFiles({ name: 'yen.xml', mimeType: 'application/xml', buffer: Buffer.from(source.replaceAll('currencyCode="HKD"', 'currencyCode="JPY"')) });
  await expect(page.getByRole('button', { name: /^Keep JPY/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Convert/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await openImport(page);
  const first = source.match(/<cash\b[\s\S]*?<\/cash>/)[0];
  const mixed = '<model><currencies><currency currencyCode="HKD" bankroll="Demo City"/><currency currencyCode="USD" bankroll="Vegas"/></currencies>' + first + first.replace('bankroll="Demo City"', 'bankroll="Vegas"') + '</model>';
  await page.getByLabel('Choose .xml file').setInputFiles({ name: 'mixed.xml', mimeType: 'application/xml', buffer: Buffer.from(mixed) });
  await expect(page.getByRole('alert')).toHaveText('That file contains more than one currency. Export one bankroll at a time.');
  const repeated = '<model><currency currencyCode="HKD"/>' + first + first + '</model>';
  await page.getByLabel('Choose .xml file').setInputFiles({ name: 'repeated.xml', mimeType: 'application/xml', buffer: Buffer.from(repeated) });
  await expect(screen(page, 'import')).toContainText('1 of 2 already in your log');
  await page.getByRole('button', { name: 'Review 2 rows' }).click();
  await expect(screen(page, 'import')).toContainText('1 to add · 1 skipped');
});

test('dialogs contain keyboard focus, Escape restores focus, and numpad supports physical keys', async ({ page }) => {
  await settings(page);
  const trigger = page.getByRole('button', { name: /^Display currency/ });
  await trigger.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement.closest('dialog'))).toBeTruthy();
  }
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await page.getByRole('button', { name: 'New', exact: true }).click();
  await page.keyboard.type('5000'); await page.keyboard.press('Backspace');
  await expect(page.getByLabel('Buy-in amount')).toHaveText('$500');
});

test('backup preview and confirmed replacement round-trip two currencies, live clock, settings and choices', async ({ page }) => {
  await sample(page); await importFile(page);
  await page.getByRole('button', { name: 'Review 3 rows' }).click();
  await page.getByRole('button', { name: 'Import 3 sessions', exact: true }).click();
  await settings(page); await choose(page, /^Accent colour/, 'Violet');
  await page.getByRole('button', { name: /^Hands per hour/ }).click();
  await page.getByLabel('Live hands per hour').fill('25');
  await page.getByLabel('Online hands per hour').fill('180');
  await page.getByRole('button', { name: 'Save estimates' }).click();
  await page.getByRole('button', { name: 'New', exact: true }).click();
  await choose(page, /^Play type/, 'Online 180 hands/hour');
  await digits(page, '4000');
  await page.getByRole('button', { name: 'Start · clock runs' }).click();
  await page.getByRole('button', { name: '+ Re-buy', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: /HK\$4,000/ }).click();
  await page.getByRole('button', { name: '← Back to xbenben' }).click(); await settings(page);
  await page.getByRole('button', { name: 'Back up to iCloud / file' }).click();
  const pending = page.waitForEvent('download');
  await page.getByRole('dialog').getByRole('button', { name: 'Download backup' }).click();
  const backupPath = await (await pending).path(), text = await fs.readFile(backupPath, 'utf8');
  const envelope = JSON.parse(text), original = await saved(page);
  expect(original.active.playType).toBe('online');
  expect(original.settings.onlineHandsPerHour).toBe(180);
  await expect(screen(page, 'settings')).not.toContainText('Last backup: Never');
  await page.getByRole('button', { name: 'Erase all sessions', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Erase all sessions', exact: true }).click();
  const input = page.getByLabel('Restore xbenben backup');
  await input.setInputFiles({ name: 'xbenben.json', mimeType: 'application/json', buffer: Buffer.from(text) });
  await expect(page.getByRole('dialog')).toContainText('6 USD');
  await expect(page.getByRole('dialog')).toContainText('3 HKD');
  expect((await saved(page)).sessions).toHaveLength(0);
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click();
  expect((await saved(page)).active).toBeNull();
  await input.setInputFiles({ name: 'xbenben.json', mimeType: 'application/json', buffer: Buffer.from(text) });
  await page.getByRole('button', { name: 'Replace ledger & restore' }).click();
  const restored = await saved(page);
  for (const field of ['sessions', 'active', 'settings', 'venues', 'stakes', 'draft', 'out', 'lastBackupAt', 'lastSetup']) expect(restored[field]).toEqual(original[field]);
  expect(restored.active.startedAt).toBe(envelope.ledger.active.startedAt);
  await expect(screen(page, 'active')).toBeVisible();
  await page.getByRole('button', { name: '← Back to xbenben' }).click();
  await expect(page.getByTestId('bankroll')).toHaveText('+$3,456');
  await settings(page);
  for (const contents of ['not json', '{"unrelated":true}', JSON.stringify({ ...envelope, checksum: 'broken' })]) {
    await input.setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from(contents) });
    await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Your data has not changed');
    expect((await saved(page)).sessions).toEqual(original.sessions);
    await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
  }
});

test('share-sheet cancellation leaves last-backup unchanged and storage persistence is requested', async ({ page }) => {
  await page.evaluate(() => {
    window.persistRequests = 0;
    navigator.storage.persist = async () => { window.persistRequests++; return true; };
    navigator.canShare = () => true;
    navigator.share = async ({ files }) => { window.sharedBackup = { name: files[0].name, type: files[0].type }; throw new DOMException('Cancelled', 'AbortError'); };
  });
  await settings(page); await page.getByRole('button', { name: 'Back up to iCloud / file' }).click();
  await page.getByRole('button', { name: 'Save to Files / share' }).click();
  expect(await page.evaluate(() => window.persistRequests)).toBeGreaterThan(0);
  expect((await page.evaluate(() => window.sharedBackup)).type).toBe('application/json');
  expect((await saved(page))?.lastBackupAt ?? null).toBeNull();
  await expect(page.getByRole('dialog', { name: 'Back up xbenben' })).toBeVisible();
});

test('a service-worker update waits for reload and keeps the saved ledger', async ({ page }) => {
  await page.evaluate(() => navigator.serviceWorker.ready); await page.reload(); await sample(page);
  const before = await saved(page), workerPath = path.resolve('dist/sw.js'), original = await fs.readFile(workerPath, 'utf8');
  try {
    await fs.writeFile(workerPath, original + '\n// Simulated new release for update verification\n');
    await page.evaluate(async () => { const registration = await navigator.serviceWorker.getRegistration(); await registration.update(); });
    await expect(page.locator('.update-notice')).toBeVisible();
    expect((await saved(page)).sessions).toEqual(before.sessions);
    await page.locator('.update-notice').getByRole('button', { name: 'Reload', exact: true }).click();
    await expect(page.getByTestId('bankroll')).toHaveText('+$3,085');
    expect((await saved(page)).sessions).toEqual(before.sessions);
  } finally { await fs.writeFile(workerPath, original); }
});

test('new sessions offer presets, keep their own currency and repeat the last created setup', async ({ page }) => {
  await page.getByRole('button', {name:'Start session',exact:true}).click();
  await choose(page, /^Venue/, 'Macau table Macau');
  await choose(page, /^Stakes/, '50/100');
  await choose(page, /^Session currency/, 'HKD Hong Kong');
  await choose(page, /^Game/, 'PLO');
  await choose(page, /^Table/, '6-max');
  await choose(page, /^Play type/, 'Online 75 hands/hour');
  await digits(page, '5000');
  await expect(page.getByLabel('Buy-in amount')).toHaveText('HK$5,000');
  await page.getByRole('button', {name:'Start · clock runs'}).click();
  const started = await saved(page);
  expect(started.settings.currency).toBe('USD'); expect(started.active.cur).toBe('HKD');
  expect(started.active.playType).toBe('online'); expect(started.lastSetup.playType).toBe('online');
  await page.reload();
  await expect(screen(page, 'active')).toContainText('Online · HKD');
  expect((await saved(page)).active).toEqual(started.active);
  await page.getByRole('button', {name:'Cash out',exact:true}).click();
  await digits(page, '6500');
  await page.getByRole('button', {name:/Tips & rake paid/}).click(); await digits(page, '100');
  await page.getByRole('button', {name:'Book session',exact:true}).click();
  await expect(page.getByTestId('bankroll')).toHaveText('+$179');
  await page.getByRole('button', {name:'Log',exact:true}).click();
  await page.getByRole('button', {name:/Macau table/}).click();
  await expect(screen(page, 'detail')).toContainText('+HK$1,400');
  await expect(screen(page, 'detail')).toContainText('HK$5,000');
  await settings(page); await choose(page, /^Display currency/, 'EUR Euro');
  await home(page); await expect(page.getByTestId('bankroll')).toHaveText('+€167');
  await page.reload(); await page.getByRole('button', {name:'Start session',exact:true}).click();
  for (const value of ['Macau table', '50/100', 'HKD', 'PLO', '6-max', 'Online']) await expect(screen(page, 'new')).toContainText(value);
  await expect(page.getByLabel('Buy-in amount')).toHaveText('HK$0');
  await choose(page, /^Venue/, 'Aria Las Vegas');
  await choose(page, /^Session currency/, 'USD US Dollar');
  await page.getByRole('button', {name:'Cancel',exact:true}).click();
  await page.getByRole('button', {name:'Start session',exact:true}).click();
  await expect(page.getByRole('button', {name:/^Venue/})).toContainText('Macau table');
  await expect(page.getByRole('button', {name:/^Session currency/})).toContainText('HKD');
  await page.getByRole('button', {name:/Repeat Macau table/}).click();
  expect((await saved(page)).active.buyIns[0].amount).toBe(5000);
  expect((await saved(page)).active.playType).toBe('online');
  await page.getByRole('button', {name:'Discard',exact:true}).click();
  await page.getByRole('dialog').getByRole('button', {name:'Discard session',exact:true}).click();
  await importFile(page); await page.getByRole('button', {name:'Review 3 rows'}).click();
  await page.getByRole('button', {name:'Import 3 sessions',exact:true}).click();
  expect((await saved(page)).settings.currency).toBe('EUR');
  await page.getByRole('button', {name:'Start session',exact:true}).click();
  await expect(page.getByRole('button', {name:/^Venue/})).toContainText('Macau table');
  await expect(page.getByRole('button', {name:/^Stakes/})).toContainText('50/100');
});

const bbSession = { id: 'live', cur: 'USD', venue: 'Live room', city: '', game: 'NLHE', seats: 6, sb: 2, bb: 5,
  startedAt: 1770000000000, endedAt: 1770007200000, buyIns: [{ amount: 2000, at: 1770000000000 }], cashOut: 2100, tips: 0, notes: '' };
async function installLedger(page, data) {
  await page.evaluate(({ key, data }) => localStorage.setItem(key, JSON.stringify(data)), { key, data });
  await page.reload();
}
async function stats(page, per100, perHour) {
  await page.getByRole('button', { name: 'Stats', exact: true }).click();
  await expect(page.getByTestId('bb-per-100')).toHaveText(per100);
  await expect(page.getByTestId('bb-per-hour')).toHaveText(perHour);
}

test('weighted big-blind stats use live/online estimates, recalculate history and ignore display currency', async ({ page }) => {
  const data = { version: 1, ...freshLedger(), sessions: [
    { ...bbSession, playType: 'live' },
    { ...bbSession, id: 'online', venue: 'Online room', cur: 'HKD', bb: 10, cashOut: 2150, endedAt: bbSession.startedAt + 3600000, playType: 'online' },
  ] };
  await installLedger(page, data); await stats(page, '+25.9', '+11.7');
  await expect(page.getByRole('region', { name: 'Big-blind averages' })).toContainText('Estimated');
  await settings(page); await page.getByRole('button', { name: /^Hands per hour/ }).click();
  await page.getByLabel('Live hands per hour').fill('20');
  await page.getByLabel('Online hands per hour').fill('100');
  await page.getByRole('button', { name: 'Save estimates' }).click();
  await stats(page, '+25.0', '+11.7');
  await settings(page); await choose(page, /^Display currency/, 'EUR Euro');
  await stats(page, '+25.0', '+11.7');
  expect((await saved(page)).sessions).toEqual(data.sessions);
  await page.getByRole('button', { name: 'Log', exact: true }).click();
  await page.getByRole('button', { name: /Live room/ }).click();
  await choose(page, /^Play type/, 'Online 100 hands/hour');
  await expect(page.getByRole('button', { name: /^Play type/ })).toContainText('Online');
  await stats(page, '+11.7', '+11.7');
  await page.reload(); await stats(page, '+11.7', '+11.7');
  const stored = await saved(page);
  expect(stored.sessions).toEqual(data.sessions.map(s => ({ ...s, playType: 'online' })));
  expect(stored.settings).toMatchObject({ liveHandsPerHour: 20, onlineHandsPerHour: 100 });
});

test('big-blind stats show empty and excluded states and migrate untagged sessions without FX', async ({ page }) => {
  await stats(page, '—', '—');
  const data = { version: 1, ...freshLedger(), sessions: [
    { ...bbSession, cur: 'JPY' }, { ...bbSession, id: 'no-blind', bb: 0 }, { ...bbSession, id: 'no-time', endedAt: bbSession.startedAt },
  ] };
  delete data.settings.liveHandsPerHour; delete data.settings.onlineHandsPerHour; delete data.draft.playType;
  await installLedger(page, data); await stats(page, '+33.3', '+10.0');
  await expect(page.getByRole('region', { name: 'Big-blind averages' })).toContainText('1 completed session · all currencies');
  await expect(page.getByRole('region', { name: 'Big-blind averages' })).toContainText('2 sessions excluded');
  await settings(page); await expect(page.getByRole('button', { name: /^Hands per hour/ })).toContainText('30 live · 75 online');
  await page.getByRole('button', { name: /^Hands per hour/ }).click();
  await page.getByRole('button', { name: 'Save estimates' }).click();
  expect((await saved(page)).sessions).toEqual(data.sessions);
  data.sessions = data.sessions.slice(1);
  await installLedger(page, data); await stats(page, '—', '—');
});

test('hand estimates validate both fields and preserve settings on cancel or invalid input', async ({ page }) => {
  await settings(page); await page.getByRole('button', { name: /^Hands per hour/ }).click();
  for (const value of ['0', '1.5', '10001', '']) {
    await page.getByLabel('Live hands per hour').fill(value);
    await page.getByRole('button', { name: 'Save estimates' }).click();
    await expect(page.getByRole('alert')).toHaveText('Enter whole numbers from 1 to 10,000 for both estimates.');
  }
  await page.getByLabel('Live hands per hour').fill('60');
  await page.getByLabel('Online hands per hour').fill('-1');
  await page.getByRole('button', { name: 'Save estimates' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Hands per hour/ })).toContainText('30 live · 75 online');
  await page.getByRole('button', { name: /^Hands per hour/ }).click();
  await page.getByLabel('Live hands per hour').fill('60');
  await page.getByLabel('Online hands per hour').fill('120');
  await page.getByRole('button', { name: 'Save estimates' }).click();
  await page.reload(); await settings(page);
  await expect(page.getByRole('button', { name: /^Hands per hour/ })).toContainText('60 live · 120 online');
});

test('reports separate native stake groups and explicitly exclude unavailable exchange rates', async ({ page }) => {
  await sample(page);
  const data = await saved(page), template = data.sessions[0];
  data.sessions = [
    { ...template, id:'usd', venue:'Dollar table', cur:'USD', cashOut:1100 },
    { ...template, id:'hkd', venue:'Hong Kong table', cur:'HKD', cashOut:2000 },
    { ...template, id:'jpy', venue:'Yen table', cur:'JPY', cashOut:10000 },
  ].map(s => ({...s, demo:false, sb:2, bb:5, tips:0, buyIns:[{amount:1000,at:s.startedAt}]}));
  await page.evaluate(({key,data}) => localStorage.setItem(key, JSON.stringify(data)), {key,data});
  await page.reload();
  await expect(page.getByTestId('bankroll')).toHaveText('+$228');
  await expect(screen(page, 'home')).toContainText('1 session in JPY excluded from currency totals');
  await page.getByRole('button', {name:'Stats',exact:true}).click();
  await expect(page.getByTestId('bankroll')).toHaveText('+$228');
  await expect(page.getByText('USD 2/5', {exact:true})).toBeVisible();
  await expect(page.getByText('HKD 2/5', {exact:true})).toBeVisible();
  await page.getByRole('button', {name:'Log',exact:true}).click();
  await expect(page.getByRole('button', {name:/Hong Kong table/})).toContainText('+HK$1,000');
  await page.getByRole('button', {name:/Yen table/}).click();
  await expect(screen(page, 'detail')).toContainText('+JPY 9,000');
  await settings(page); await choose(page, /^Display currency/, 'HKD Hong Kong');
  await home(page); await expect(page.getByTestId('bankroll')).toHaveText('+HK$1,781');
  await settings(page); await choose(page, /^Display currency/, 'JPY');
  await home(page); await expect(page.getByTestId('bankroll')).toHaveText('+JPY 9,000');
  await expect(screen(page, 'home')).toContainText('2 sessions in USD, HKD excluded from currency totals');
  expect((await saved(page)).sessions).toEqual(data.sessions);
});
