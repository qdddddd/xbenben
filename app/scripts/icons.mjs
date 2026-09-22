import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';

// Render every install icon from the same vector artwork.
const svg = await fs.readFile(new URL('../public/icons/xbenben.svg', import.meta.url), 'utf8');
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || (process.platform === 'darwin' ? 'chrome' : undefined) });
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  for (const [file, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['maskable-512.png', 512], ['apple-touch-icon.png', 180]]) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent('<!doctype html><style>html,body{margin:0;width:100%;height:100%}svg{display:block;width:100%;height:100%}</style>' + svg);
    await page.screenshot({ path: new URL('../public/icons/' + file, import.meta.url).pathname });
  }
} finally { await browser.close(); }
