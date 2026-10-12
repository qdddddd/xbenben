import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import { PNG } from 'pngjs';
import { APP_ICONS, DEFAULT_APP_ICON, iconPath } from '../src/app-icons.js';
import { squareArtwork } from './icon-art.mjs';

const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || (process.platform === 'darwin' ? 'chrome' : undefined) });
try {
  const page = await browser.newPage();
  for (const icon of APP_ICONS) {
    const source = PNG.sync.read(await fs.readFile(new URL('../../' + icon.source, import.meta.url)));
    const clean = PNG.sync.write(squareArtwork(source, icon.ground)).toString('base64');
    const sizes = icon.id === DEFAULT_APP_ICON ? [16, 32, 180, 192, 512, 'maskable-1024'] : [16, 32, 180];
    for (const size of sizes) {
      const data = await page.evaluate(async ({ clean, ground, size }) => {
        const maskable = typeof size === 'string', pixels = maskable ? 1024 : size;
        const image = new Image(); image.src = 'data:image/png;base64,' + clean; await image.decode();
        const canvas = document.createElement('canvas'); canvas.width = canvas.height = pixels;
        const ctx = canvas.getContext('2d'); ctx.fillStyle = ground; ctx.fillRect(0, 0, pixels, pixels);
        ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
        // Leave breathing room within the 40% maskable safe circle.
        const scale = maskable ? .96 : 1, margin = pixels * (1 - scale) / 2;
        ctx.drawImage(image, margin, margin, pixels * scale, pixels * scale);
        return canvas.toDataURL('image/png').split(',')[1];
      }, { clean, ground: icon.ground, size });
      await fs.writeFile(new URL('../public/' + iconPath(icon.id, size), import.meta.url), Buffer.from(data, 'base64'));
    }
  }
} finally { await browser.close(); }
