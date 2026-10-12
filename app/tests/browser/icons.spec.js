import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import { APP_ICONS } from '../../src/app-icons.js';
import { freshLedger } from '../../src/storage.js';
import { createBackup } from '../../src/backup.js';

const key = 'ledger:data:v1';
const button = (page, name) => page.getByRole('button', { name, exact: true });
const saved = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
const openPicker = async page => {
  await button(page, 'Settings').click();
  await page.getByRole('button', { name: /^App icon/ }).click();
};
async function iconsMatch(page, id) {
  await expect(page.locator('link[rel="icon"]')).toHaveCount(2);
  for (const size of [16, 32]) await expect(page.locator(`link[rel="icon"][sizes="${size}x${size}"]`)).toHaveAttribute('href', `/icons/bankroll-${id}-${size}.png`);
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', `/icons/bankroll-${id}-180.png`);
}
async function restore(page, content) {
  await page.getByLabel('Restore xbenben backup').setInputFiles({ name: 'icon-backup.json', mimeType: 'application/json', buffer: Buffer.from(content) });
  await button(page, 'Replace ledger & restore').click();
}

for (const width of [402, 320]) test(`icon chooser previews, selected state and scrolling fit ${width}px safe areas`, async ({ page }) => {
  await page.setViewportSize({ width, height: width === 402 ? 874 : 568 });
  await page.goto('/');
  await page.addStyleTag({ content: ':root { --safe-top: 44px; --safe-bottom: 34px; }' });
  await openPicker(page);
  const dialog = page.getByRole('dialog', { name: 'App icon', exact: true });
  await expect(dialog.getByRole('button', { name: '4C Paper', exact: true })).toHaveAttribute('aria-pressed', 'true');
  for (const text of ['Changes this browser’s tab icon now.', 'choose in Safari before adding', 'Existing Home Screen icons stay unchanged.', 'keep separate data', 'Other platforms install Paper.']) await expect(dialog).toContainText(text);
  await expect(dialog.locator('img')).toHaveCount(7);
  await expect.poll(() => dialog.locator('img').evaluateAll(images => images.every(img => img.complete && img.naturalWidth === 180))).toBe(true);
  await page.screenshot({ path: `evidence/icons/picker-${width}.png`, animations: 'disabled' });
  for (const icon of APP_ICONS) {
    const option = dialog.getByRole('button', { name: `${icon.variant} ${icon.label}`, exact: true });
    await option.evaluate(el => el.scrollIntoView({ block: 'center' }));
    const bounds = await option.boundingBox(), close = await button(page, 'Close').boundingBox();
    expect(bounds.height).toBeGreaterThanOrEqual(44);
    expect(bounds.x).toBeGreaterThanOrEqual(0); expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    expect(bounds.y).toBeGreaterThanOrEqual(close.y + close.height);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(page.viewportSize().height - 34);
    expect(await option.locator('span').evaluateAll(labels => labels.every(el => el.scrollWidth <= el.clientWidth))).toBe(true);
    await option.click(); await expect(option).toHaveAttribute('aria-pressed', 'true');
    await iconsMatch(page, icon.id);
  }
  await page.screenshot({ path: `evidence/icons/picker-bottom-${width}.png`, animations: 'disabled' });
  await button(page, 'Close').click();
  await expect(page.getByRole('button', { name: /^App icon/ })).toContainText('Violet');
  await page.screenshot({ path: `evidence/icons/settings-${width}.png`, animations: 'disabled' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('all icons switch immediately, stay independent of accent and manifest, and survive offline reopening', async ({ page, context }) => {
  await page.goto('/'); await page.evaluate(() => navigator.serviceWorker.ready); await page.reload();
  await openPicker(page);
  for (const icon of APP_ICONS) {
    await button(page, `${icon.variant} ${icon.label}`).click();
    await iconsMatch(page, icon.id);
    expect((await saved(page)).settings.appIcon).toBe(icon.id);
    const images = await page.evaluate(async () => Promise.all([...document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]')].map(async link => {
      const bitmap = await createImageBitmap(await (await fetch(link.href)).blob());
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = bitmap.width;
      const ctx = canvas.getContext('2d'); ctx.drawImage(bitmap, 0, 0);
      return { width: bitmap.width, pixel: [...ctx.getImageData(0, 0, 1, 1).data] };
    })));
    const field = [...icon.ground.match(/[a-f0-9]{2}/gi).map(n => parseInt(n, 16)), 255];
    expect(images.map(i => i.width)).toEqual([180, 16, 32]);
    expect(images.every(i => JSON.stringify(i.pixel) === JSON.stringify(field))).toBe(true);
  }
  await button(page, 'Close').click();
  await page.getByRole('button', { name: /^Accent colour/ }).click(); await button(page, 'Forest').click();
  await iconsMatch(page, 'violet');
  const manifest = await page.evaluate(async () => (await (await fetch(document.querySelector('link[rel="manifest"]').href)).json()));
  expect(manifest.icons.every(icon => icon.src.startsWith('/icons/bankroll-paper-'))).toBe(true);
  const before = await saved(page);
  await page.reload(); await iconsMatch(page, 'violet'); expect(await saved(page)).toEqual(before);
  await page.close(); await context.setOffline(true);
  const reopened = await context.newPage(); await reopened.goto('/');
  await iconsMatch(reopened, 'violet'); expect(await saved(reopened)).toEqual(before);
  await openPicker(reopened);
  // Every alternative is precached too, so an offline choice still displays real artwork.
  await button(reopened, '4E HK$1000').click(); await iconsMatch(reopened, 'hkd');
  expect(await reopened.getByRole('dialog').locator('img').evaluateAll(images => images.every(img => img.complete && img.naturalWidth === 180))).toBe(true);
  expect(await reopened.evaluate(async () => (await fetch(document.querySelector('link[rel="apple-touch-icon"]').href)).ok)).toBe(true);
});

test('downloaded backup restores the icon with a paused ledger; older backup resets a previous choice to Paper', async ({ page }) => {
  const ledger = freshLedger(), start = Date.now() - 3600000;
  ledger.active = { id: 'paused', venue: 'Home game', city: '', cur: 'HKD', game: 'NLHE', seats: 9, sb: 100, bb: 200,
    startedAt: start, endedAt: null, buyIns: [{ at: start, amount: 12000 }, { at: start + 1200000, amount: 13750 }], cashOut: 0, tips: 0, notes: '',
    pauses: [{ startedAt: start + 1800000, endedAt: null }] };
  await page.goto('/');
  await page.evaluate(({ key, ledger }) => localStorage.setItem(key, JSON.stringify({ version: 1, ...ledger })), { key, ledger });
  await page.reload(); await button(page, '← Back to xbenben').click();
  await openPicker(page); await button(page, '4E HK$1000').click(); await button(page, 'Close').click();
  await button(page, 'Back up to iCloud / file').click();
  const download = page.waitForEvent('download'); await button(page, 'Download backup').click();
  const content = await fs.readFile(await (await download).path(), 'utf8'), backedUp = JSON.parse(content).ledger;
  expect(backedUp.settings.appIcon).toBe('hkd'); expect(backedUp.active).toEqual(ledger.active);
  await page.getByRole('button', { name: /^App icon/ }).click(); await button(page, '4G Forest').click(); await button(page, 'Close').click();
  await restore(page, content); await iconsMatch(page, 'hkd');
  expect((await saved(page)).active).toEqual(ledger.active);
  await button(page, '← Back to xbenben').click(); await button(page, 'Settings').click();
  delete backedUp.settings.appIcon;
  const legacy = await createBackup(backedUp);
  await restore(page, legacy.text); await iconsMatch(page, 'paper');
  expect((await saved(page)).settings.appIcon).toBe('paper'); expect((await saved(page)).active).toEqual(ledger.active);
  await page.reload(); await iconsMatch(page, 'paper'); await expect(button(page, 'Resume session')).toBeVisible();
});

test('Settings update keeps a chosen icon and all running session data', async ({ page }) => {
  await page.goto('/'); await openPicker(page);
  await button(page, '4F Bronze').click(); await button(page, 'Close').click(); await button(page, 'Home').click();
  await button(page, 'Start session').click(); await page.keyboard.type('500'); await button(page, 'Start · clock runs').click();
  await button(page, 'Pause session').click();
  await page.evaluate(() => navigator.serviceWorker.ready); await page.reload();
  const before = await saved(page), worker = 'dist/sw.js', original = await fs.readFile(worker, 'utf8');
  try {
    await fs.writeFile(worker, original + '\n// Icon selection update test\n');
    await page.evaluate(async () => (await navigator.serviceWorker.getRegistration()).update());
    await expect(page.locator('.update-notice')).toBeVisible();
    await page.locator('.update-notice').getByRole('button', { name: 'Later', exact: true }).click();
    await button(page, '← Back to xbenben').click(); await button(page, 'Settings').click();
    await Promise.all([page.waitForEvent('load'), button(page, 'Update app').click()]);
    await expect(button(page, 'Resume session')).toBeVisible();
    await iconsMatch(page, 'bronze'); expect(await saved(page)).toEqual(before);
  } finally { await fs.writeFile(worker, original); }
});
