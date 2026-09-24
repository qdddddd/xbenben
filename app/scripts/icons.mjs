import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';

// Install icons share the favicon's chip artwork; the OS supplies its own corner mask.
const svg = await fs.readFile(new URL('../public/icons/favicon.svg', import.meta.url), 'utf8');
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || (process.platform === 'darwin' ? 'chrome' : undefined) });
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  for (const [file, size] of [['chip-192.png', 192], ['chip-512.png', 512], ['chip-maskable-512.png', 512], ['apple-touch-icon-chip.png', 180]]) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent('<!doctype html><style>html,body{margin:0;width:100%;height:100%}svg{display:block;width:100%;height:100%}</style>' + svg);
    await page.locator('svg > rect').evaluate(rect => rect.removeAttribute('rx'));
    await page.screenshot({ path: new URL('../public/icons/' + file, import.meta.url).pathname });
  }
} finally { await browser.close(); }
