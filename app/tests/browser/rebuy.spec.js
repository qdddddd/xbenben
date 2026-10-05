import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';

const key = 'ledger:data:v1';
const saved = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
const settings = page => page.getByRole('button', { name: 'Settings', exact: true }).click();
const digits = async (page, amount) => { for (const digit of amount) await page.getByRole('dialog').getByRole('button', { name: digit, exact: true }).click(); };
async function start(page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start session', exact: true }).click();
  for (const [row, option] of [[/^Session currency/, 'HKD Hong Kong'], [/^Stakes/, '100/200'], [/^Venue/, 'Home game']]) {
    await page.getByRole('button', { name: row }).click();
    await page.getByRole('dialog').getByRole('button', { name: option, exact: true }).click();
  }
  await page.keyboard.type('12000');
  await page.getByRole('button', { name: 'Start · clock runs', exact: true }).click();
}
async function custom(page) {
  await page.getByRole('button', { name: '+ Re-buy', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Custom amount', exact: true }).click();
  await expect(page.getByLabel('Custom re-buy amount')).toBeFocused();
}
async function backup(page) {
  await page.getByRole('button', { name: 'Back up to iCloud / file', exact: true }).click();
  const pending = page.waitForEvent('download');
  await page.getByRole('dialog').getByRole('button', { name: 'Download backup', exact: true }).click();
  return fs.readFile(await (await pending).path(), 'utf8');
}

for (const width of [402, 320]) test(`custom re-buy entry, limits and cancellation fit a ${width}px phone`, async ({ page }) => {
  await page.setViewportSize({ width, height: width === 402 ? 874 : 568 });
  await start(page);
  await page.addStyleTag({ content: ':root { --safe-top: 44px; --safe-bottom: 34px; }' });
  const before = await saved(page);
  await page.getByRole('button', { name: '+ Re-buy', exact: true }).click();
  const dialog = page.getByRole('dialog');
  for (const label of ['HK$12,000 60 bb', 'HK$20,000 100 bb', 'HK$40,000 200 bb', 'HK$80,000 400 bb']) {
    await expect(dialog.getByRole('button', { name: label, exact: true })).toBeVisible();
  }
  await dialog.getByRole('button', { name: 'Custom amount', exact: true }).click();
  const confirm = dialog.getByRole('button', { name: 'Log re-buy', exact: true });
  await expect(confirm).toBeDisabled();
  await page.keyboard.press('Enter');
  await digits(page, '00');
  await expect(confirm).toBeDisabled();
  await expect(page.getByLabel('Custom re-buy amount')).toHaveText('HK$0');
  await page.getByLabel('Custom re-buy amount').focus();
  await page.keyboard.type('9999999999');
  await expect(page.getByLabel('Custom re-buy amount')).toHaveText('HK$999,999,999');
  await page.keyboard.type('e-+.');
  await expect(page.getByLabel('Custom re-buy amount')).toHaveText('HK$999,999,999');
  await dialog.getByRole('button', { name: 'Delete digit', exact: true }).click();
  await expect(page.getByLabel('Custom re-buy amount')).toHaveText('HK$99,999,999');
  await dialog.getByRole('button', { name: '← Preset amounts', exact: true }).click();
  await expect(dialog.getByRole('button', { name: 'HK$12,000 60 bb', exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'Custom amount', exact: true }).click();
  await expect(confirm).toBeDisabled();
  await digits(page, '13750');
  await expect(page.getByLabel('Custom re-buy amount')).toHaveText('HK$13,750');
  await expect(page.getByLabel('Re-buy in big blinds')).toHaveText('69 bb');
  expect(await saved(page)).toEqual(before);
  const layout = await dialog.evaluate(dialog => {
    const rect = el => { const { x, y, width, height, bottom } = el.getBoundingClientRect(); return { x, y, width, height, bottom }; };
    const output = dialog.querySelector('output');
    const range = document.createRange(); range.selectNodeContents(output);
    return { sheet: rect(dialog), confirm: rect(dialog.querySelector('.rebuy-confirm')), keypad: rect(dialog.querySelector('.rebuy-keypad')),
      keys: [...dialog.querySelectorAll('.rebuy-keypad button')].map(rect), output: rect(output), text: range.getBoundingClientRect().width,
      viewport: window.visualViewport.height, inputs: dialog.querySelectorAll('input, textarea, [contenteditable="true"]').length };
  });
  expect(layout.sheet.y).toBeGreaterThanOrEqual(44);
  expect(layout.sheet.bottom).toBeLessThanOrEqual(layout.viewport);
  expect(layout.confirm.bottom).toBeLessThanOrEqual(layout.viewport - 34);
  expect(layout.keypad.bottom).toBeLessThanOrEqual(layout.confirm.y);
  expect(layout.text).toBeLessThanOrEqual(layout.output.width + 1);
  expect(layout.inputs).toBe(0);
  for (const button of [layout.confirm, ...layout.keys]) {
    expect(button.height).toBeGreaterThanOrEqual(44);
    expect(button.x).toBeGreaterThanOrEqual(0);
    expect(button.x + button.width).toBeLessThanOrEqual(width);
  }
  await page.screenshot({ path: `evidence/custom-rebuy/entry-${width}.png` });
  await dialog.getByRole('button', { name: 'Close', exact: true }).click();
  expect(await saved(page)).toEqual(before);
  await custom(page); await expect(page.getByLabel('Custom re-buy amount')).toHaveText('HK$0');
  await page.keyboard.type('50'); await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  expect(await saved(page)).toEqual(before);
  await page.getByRole('button', { name: '+ Re-buy', exact: true }).click();
  await dialog.getByRole('button', { name: 'HK$12,000 60 bb', exact: true }).click();
  expect((await saved(page)).active.buyIns.map(b => b.amount)).toEqual([12000, 12000]);
});

test('confirmed custom re-buy keeps its currency, time, totals, backup and CSV through reload and booking', async ({ page, context }) => {
  const started = new Date('2026-10-05T04:00:00Z');
  await page.clock.setFixedTime(started);
  await start(page);
  await page.clock.setFixedTime(new Date(started.getTime() + 300000));
  await custom(page); await page.keyboard.type('13750');
  expect((await saved(page)).active.buyIns).toHaveLength(1);
  await page.getByRole('dialog').getByRole('button', { name: 'Log re-buy', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('status')).toHaveText('Re-buy HK$13,750 logged');
  const recorded = (await saved(page)).active;
  expect(recorded.buyIns.map(b => b.amount)).toEqual([12000, 13750]);
  expect(recorded.buyIns[1].at).toBe(started.getTime() + 300000);
  expect((await saved(page)).settings.currency).toBe('USD');
  await expect(page.locator('[data-screen="active"]')).toContainText('HK$25,750');
  await expect(page.locator('[data-screen="active"]')).toContainText('129 bb');
  await expect(page.locator('[data-screen="active"]')).toContainText('Re-buy 1 · 12:05PM');
  await page.reload(); expect((await saved(page)).active).toEqual(recorded);
  await page.close();
  const reopened = await context.newPage();
  await reopened.clock.setFixedTime(new Date(started.getTime() + 600000));
  await reopened.goto('/');
  await expect(reopened.getByTestId('timer')).toHaveText('0:10:00');
  expect((await saved(reopened)).active).toEqual(recorded);
  await reopened.getByRole('button', { name: '← Back to xbenben', exact: true }).click();
  await settings(reopened);
  const file = await backup(reopened);
  expect(JSON.parse(file).ledger.active).toEqual(recorded);
  await reopened.getByRole('button', { name: 'Live', exact: true }).click();
  await reopened.getByRole('button', { name: 'Cash out', exact: true }).click();
  await reopened.keyboard.type('30000');
  await reopened.getByRole('button', { name: /Tips & rake paid/ }).click();
  await reopened.keyboard.type('250');
  await expect(reopened.locator('[data-screen="cashout"]')).toContainText('+HK$4,000');
  await reopened.getByRole('button', { name: 'Book session', exact: true }).click();
  await expect(reopened.getByTestId('bankroll')).toHaveText('+$512');
  const booked = (await saved(reopened)).sessions[0];
  expect(booked.buyIns).toEqual(recorded.buyIns);
  await reopened.getByRole('button', { name: /Home game/ }).click();
  await expect(reopened.locator('[data-screen="detail"]')).toContainText('−HK$13,750');
  await expect(reopened.locator('[data-screen="detail"]')).toContainText('+HK$4,000');
  await settings(reopened);
  const pending = reopened.waitForEvent('download');
  await reopened.getByRole('button', { name: 'Export CSV', exact: true }).click();
  const exported = await fs.readFile(await (await pending).path(), 'utf8');
  expect(exported).toContain('"HKD"');
  expect(exported).toContain('"25750","30000","250","4000"');
  expect(exported).toContain(JSON.stringify(recorded.buyIns).replaceAll('"', '""'));
  await reopened.getByLabel('Restore xbenben backup').setInputFiles({ name: 'rebuy-backup.json', mimeType: 'application/json', buffer: Buffer.from(file) });
  await reopened.getByRole('button', { name: 'Replace ledger & restore', exact: true }).click();
  expect((await saved(reopened)).active).toEqual(recorded);
  await context.setOffline(true); await reopened.reload();
  expect((await saved(reopened)).active).toEqual(recorded);
  await expect(reopened.getByTestId('timer')).toBeVisible();
});
