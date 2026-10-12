import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import { seedSample } from '../fixtures/sample-ledger.js';

const button = (page, name) => page.getByRole('button', { name, exact: true });
const saved = page => page.evaluate(() => JSON.parse(localStorage.getItem('ledger:data:v1')));
async function choose(page, row, option) {
  await page.getByRole('button', { name: row }).click();
  await page.getByRole('dialog').getByRole('button', { name: option, exact: true }).click();
}
async function readableAccent(page) {
  const failures = await page.evaluate(() => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
    const ctx = canvas.getContext('2d');
    const rgba = css => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = css; ctx.fillRect(0, 0, 1, 1); return [...ctx.getImageData(0, 0, 1, 1).data]; };
    const root = getComputedStyle(document.documentElement);
    const accent = ['--color-accent', '--color-accent-fill', '--color-profit', '--color-loss', ...[100, 600, 700, 800, 900].map(n => '--color-accent-' + n)].map(p => rgba(root.getPropertyValue(p)).slice(0, 3).join(','));
    const luminance = rgb => rgb.slice(0, 3).map(c => c / 255).map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4).reduce((n, c, i) => n + c * [.2126, .7152, .0722][i], 0);
    const found = [];
    for (const el of document.querySelectorAll('#root *')) {
      if (!el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) || el.closest('[disabled]') || ![...el.childNodes].some(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim())) continue;
      const bounds = el.getBoundingClientRect(); if (bounds.bottom < 0 || bounds.top >= innerHeight) continue;
      const style = getComputedStyle(el), fg = rgba(style.color);
      const parents = []; for (let p = el; p; p = p.parentElement) parents.unshift(p);
      let bg = [242, 242, 243], colouredGround = false;
      for (const parent of parents) {
        const colour = rgba(getComputedStyle(parent).backgroundColor), a = colour[3] / 255;
        if (a && accent.includes(colour.slice(0, 3).join(','))) colouredGround = true;
        bg = bg.map((v, i) => colour[i] * a + v * (1 - a));
      }
      if (!colouredGround && !accent.includes(fg.slice(0, 3).join(','))) continue;
      const values = [luminance(fg), luminance(bg)].sort((a, b) => a - b);
      const ratio = (values[1] + .05) / (values[0] + .05);
      if (ratio < 4.5) found.push({ text: el.textContent.slice(0, 60), color: style.color, bg, ratio });
    }
    return found;
  });
  expect(failures, 'Accent text and filled labels keep at least 4.5:1 contrast').toEqual([]);
}

for (const width of [402, 320]) test(`Muted pink stays readable in Mono, Signal and money controls at ${width}px`, async ({ page }) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width, height: width === 402 ? 874 : 568 });
  await page.clock.setFixedTime(new Date('2026-10-12T04:00:00Z'));
  await page.goto('/'); await seedSample(page);
  await page.addStyleTag({ content: ':root { --safe-top: 44px; --safe-bottom: 34px; }' });
  await button(page, 'Settings').click();
  await choose(page, /^Accent colour/, 'Muted pink');
  await expect(page.locator('html')).toHaveAttribute('data-accent', 'mutedpink');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim())).toBe('#a8667a');
  await page.getByRole('button', { name: /^App icon/ }).click(); await button(page, 'Muted pink').click();
  await readableAccent(page); await button(page, 'Close').click();
  for (const mode of ['Mono', 'Signal']) {
    await button(page, 'Settings').click();
    await choose(page, /^Profit & loss colours/, mode === 'Mono' ? 'Mono Accent / ink' : 'Signal Green / red');
    for (const tab of ['Home', 'Log', 'Stats']) {
      await button(page, tab).click();
      const total = tab === 'Home' ? page.getByText('+$3,085 this month', { exact: true }) :
        tab === 'Log' ? page.locator('[data-screen="log"]').getByText('+$3,085', { exact: true }) : page.getByTestId('bankroll');
      await expect(total).toHaveCSS('color', mode === 'Mono' ? 'rgb(119, 67, 87)' : 'rgb(38, 110, 86)');
      await readableAccent(page);
      if (tab === 'Log') {
        await button(page, 'Losses').click(); await readableAccent(page);
        await expect(page.locator('[data-screen="log"]').getByText('−$770', { exact: true })).toHaveCSS('color', mode === 'Mono' ? 'rgb(43, 43, 45)' : 'rgb(168, 50, 63)');
        await button(page, 'All').click();
      }
      await page.screenshot({ path: `evidence/pink/${tab.toLowerCase()}-${mode.toLowerCase()}-${width}.png`, animations: 'disabled' });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  }
  await button(page, 'Home').click();
  await button(page, 'Start session').click(); await page.keyboard.type('500');
  await button(page, 'Start · clock runs').scrollIntoViewIfNeeded(); await readableAccent(page);
  await button(page, 'Start · clock runs').click(); await readableAccent(page);
  await button(page, '+ Re-buy').click(); await button(page, 'Custom amount').click(); await page.keyboard.type('125');
  await readableAccent(page);
  await page.screenshot({ path: `evidence/pink/rebuy-${width}.png`, animations: 'disabled' });
  await button(page, 'Log re-buy').click(); await button(page, 'Cash out').click(); await page.keyboard.type('850');
  await button(page, 'Book session').scrollIntoViewIfNeeded(); await readableAccent(page);
  await page.screenshot({ path: `evidence/pink/cashout-${width}.png`, animations: 'disabled' });
  await button(page, 'Book session').click();
  const before = await saved(page); await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-accent', 'mutedpink');
  expect((await saved(page)).settings).toEqual(before.settings);
  await button(page, 'Settings').click(); await button(page, 'Back up to iCloud / file').click();
  const download = page.waitForEvent('download'); await button(page, 'Download backup').click();
  const backup = await fs.readFile(await (await download).path(), 'utf8');
  await choose(page, /^Accent colour/, 'Steel');
  await page.getByLabel('Restore xbenben backup').setInputFiles({ name: 'pink-backup.json', mimeType: 'application/json', buffer: Buffer.from(backup) });
  await button(page, 'Replace ledger & restore').click();
  await expect(page.locator('html')).toHaveAttribute('data-accent', 'mutedpink');
  expect((await saved(page)).settings).toEqual(before.settings);
});
