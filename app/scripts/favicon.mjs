import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';

// Browser-tab sizes use direction 1C's simplified edge-spot drawing.
const svg = await fs.readFile(new URL('../public/icons/favicon.svg', import.meta.url), 'utf8');
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || (process.platform === 'darwin' ? 'chrome' : undefined) });
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  for (const size of [16, 32]) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent('<!doctype html><style>html,body{margin:0;width:100%;height:100%;background:transparent}svg{display:block;width:100%;height:100%}</style>' + svg);
    await page.screenshot({ path: new URL('../public/icons/favicon-' + size + '.png', import.meta.url).pathname, omitBackground: true });
  }
} finally { await browser.close(); }
