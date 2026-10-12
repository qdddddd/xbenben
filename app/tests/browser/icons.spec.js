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
  await expect(dialog.getByRole('button', { name: 'Deep steel', exact: true })).toHaveAttribute('aria-pressed', 'true');
  for (const text of ['Changes this browser’s tab icon now.', 'choose in Safari before adding', 'Existing Home Screen icons stay unchanged.', 'keep separate data', 'Other platforms install Deep steel.']) await expect(dialog).toContainText(text);
  await expect(dialog.locator('img')).toHaveCount(10);
  await expect(dialog.getByRole('group', { name: 'App icon choices' }).getByRole('button').first()).toHaveAccessibleName('Green');
  await expect.poll(() => dialog.locator('img').evaluateAll(images => images.every(img => img.complete && img.naturalWidth === 180))).toBe(true);
  await page.screenshot({ path: `evidence/icons/picker-${width}.png`, animations: 'disabled' });
  for (const icon of APP_ICONS) {
    const option = dialog.getByRole('button', { name: icon.label, exact: true });
    await expect(option).toHaveText(icon.label);
    await expect(option).toHaveAccessibleName(icon.label);
    await option.evaluate(el => el.scrollIntoView({ block: 'center' }));
    const bounds = await option.boundingBox(), close = await button(page, 'Close').boundingBox();
    expect(bounds.height).toBeGreaterThanOrEqual(44);
    expect(bounds.x).toBeGreaterThanOrEqual(0); expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    expect(bounds.y).toBeGreaterThanOrEqual(close.y + close.height);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(page.viewportSize().height - 34);
    expect(await option.locator('span').evaluateAll(labels => labels.every(el => el.scrollWidth <= el.clientWidth))).toBe(true);
    await option.click(); await expect(option).toHaveAttribute('aria-pressed', 'true');
    await expect(dialog.getByRole('button', { pressed: true })).toHaveCount(1);
    await expect(option).toHaveText(icon.label);
    expect(await option.locator('.icon-name').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    const selectedBounds = await option.boundingBox();
    expect(selectedBounds.height).toBe(bounds.height);
    expect(selectedBounds.y + selectedBounds.height).toBeLessThanOrEqual(page.viewportSize().height - 34);
    await iconsMatch(page, icon.id);
  }
  await page.screenshot({ path: `evidence/icons/picker-bottom-${width}.png`, animations: 'disabled' });
  await button(page, 'Close').click();
  await expect(page.getByRole('button', { name: /^App icon/ })).toContainText('Muted pink');
  await page.screenshot({ path: `evidence/icons/settings-${width}.png`, animations: 'disabled' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('all icons switch immediately, stay independent of accent and manifest, and survive offline reopening', async ({ page, context }) => {
  await page.goto('/'); await page.evaluate(() => navigator.serviceWorker.ready); await page.reload();
  await openPicker(page);
  for (const icon of APP_ICONS) {
    await button(page, icon.label).click();
    await iconsMatch(page, icon.id);
    expect((await saved(page)).settings.appIcon).toBe(icon.id);
    expect((await saved(page)).settings.appIconExplicit).toBe(true);
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
  await iconsMatch(page, 'mutedpink');
  const manifest = await page.evaluate(async () => (await (await fetch(document.querySelector('link[rel="manifest"]').href)).json()));
  expect(manifest.icons.every(icon => icon.src.startsWith('/icons/bankroll-deep-'))).toBe(true);
  const before = await saved(page);
  await page.reload(); await iconsMatch(page, 'mutedpink'); expect(await saved(page)).toEqual(before);
  await page.close(); await context.setOffline(true);
  const reopened = await context.newPage(); await reopened.goto('/');
  await iconsMatch(reopened, 'mutedpink'); expect(await saved(reopened)).toEqual(before);
  await openPicker(reopened);
  // Every alternative is precached too, so an offline choice still displays real artwork.
  await button(reopened, 'HK$1000').click(); await iconsMatch(reopened, 'hkd');
  expect(await reopened.getByRole('dialog').locator('img').evaluateAll(images => images.every(img => img.complete && img.naturalWidth === 180))).toBe(true);
  expect(await reopened.evaluate(async () => (await fetch(document.querySelector('link[rel="apple-touch-icon"]').href)).ok)).toBe(true);
});

test('downloaded backup restores the icon with a paused ledger; older backup resets a previous choice to Deep steel', async ({ page }) => {
  const ledger = freshLedger(), start = Date.now() - 3600000;
  ledger.active = { id: 'paused', venue: 'Home game', city: '', cur: 'HKD', game: 'NLHE', seats: 9, sb: 100, bb: 200,
    startedAt: start, endedAt: null, buyIns: [{ at: start, amount: 12000 }, { at: start + 1200000, amount: 13750 }], cashOut: 0, tips: 0, notes: '',
    pauses: [{ startedAt: start + 1800000, endedAt: null }] };
  await page.goto('/');
  await page.evaluate(({ key, ledger }) => localStorage.setItem(key, JSON.stringify({ version: 1, ...ledger })), { key, ledger });
  await page.reload(); await button(page, '← Back to xbenben').click();
  await openPicker(page); await button(page, 'Green').click(); await button(page, 'Close').click();
  await button(page, 'Back up to iCloud / file').click();
  const download = page.waitForEvent('download'); await button(page, 'Download backup').click();
  const content = await fs.readFile(await (await download).path(), 'utf8'), backedUp = JSON.parse(content).ledger;
  expect(backedUp.settings.appIcon).toBe('green'); expect(backedUp.active).toEqual(ledger.active);
  await page.getByRole('button', { name: /^App icon/ }).click(); await button(page, 'Forest').click(); await button(page, 'Close').click();
  await restore(page, content); await iconsMatch(page, 'green');
  expect((await saved(page)).active).toEqual(ledger.active);
  await page.reload(); await iconsMatch(page, 'green');
  await button(page, '← Back to xbenben').click(); await button(page, 'Settings').click();
  delete backedUp.settings.appIcon; delete backedUp.settings.appIconExplicit;
  const legacy = await createBackup(backedUp);
  await restore(page, legacy.text); await iconsMatch(page, 'deep');
  expect((await saved(page)).settings.appIcon).toBe('deep'); expect((await saved(page)).active).toEqual(ledger.active);
  await page.reload(); await iconsMatch(page, 'deep'); await expect(button(page, 'Resume session')).toBeVisible();
});

test('Settings update keeps a chosen icon and all running session data', async ({ page }) => {
  await page.goto('/'); await openPicker(page);
  await button(page, 'Green').click(); await button(page, 'Close').click(); await button(page, 'Home').click();
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
    await iconsMatch(page, 'green'); expect(await saved(page)).toEqual(before);
  } finally { await fs.writeFile(worker, original); }
});


test('implicit Paper follows Deep steel, while an explicit Paper selection survives reload and backup restore', async ({ page }) => {
  const old = freshLedger(); old.settings.appIcon = 'paper'; delete old.settings.appIconExplicit;
  const legacy = await createBackup(old);
  await page.goto('/');
  await page.evaluate(({ key, old }) => localStorage.setItem(key, JSON.stringify({ version: 1, ...old })), { key, old });
  await page.reload(); await iconsMatch(page, 'deep');
  await openPicker(page); await expect(button(page, 'Deep steel')).toHaveAttribute('aria-pressed', 'true');
  await button(page, 'Paper').click(); await iconsMatch(page, 'paper'); await button(page, 'Close').click();
  expect((await saved(page)).settings).toMatchObject({ appIcon: 'paper', appIconExplicit: true });
  const chosen = await createBackup(await saved(page));
  await page.reload(); await iconsMatch(page, 'paper');
  await button(page, 'Settings').click(); await restore(page, legacy.text); await iconsMatch(page, 'deep');
  expect((await saved(page)).settings).toMatchObject({ appIcon: 'deep', appIconExplicit: false });
  await button(page, 'Settings').click(); await restore(page, chosen.text); await iconsMatch(page, 'paper');
  await page.reload(); await iconsMatch(page, 'paper');
});
