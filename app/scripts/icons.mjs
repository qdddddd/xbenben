import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';

// Direction 3A: two crossed cards in one deep steel (accent-900) on a white field, separated by a
// white gap where the front card overlaps. Small sizes use the design's wider gap.
const INK = '#1d2d3d', FIELD = '#fff';
const card = (angle, paint) => `<rect x="28" y="14" width="44" height="72" rx="5" transform="rotate(${angle} 50 50)" ${paint}/>`;
const art = ({ gap, scale = 1, radius = 0 }) => {
  const glyph = card(-20, `fill="${INK}"`) + card(20, `fill="${INK}"`) + card(20, `fill="none" stroke="${FIELD}" stroke-width="${gap}"`);
  const body = scale === 1 ? glyph : `<g transform="translate(50 50) scale(${scale}) translate(-50 -50)">${glyph}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100"${radius ? ` rx="${radius}"` : ''} fill="${FIELD}"/>${body}</svg>`;
};

const out = file => new URL('../public/icons/' + file, import.meta.url).pathname;
// The browser tab gets its own rounded tile; install icons stay square because the OS applies the mask.
const favicon = art({ gap: 4, radius: 22.4 });
await fs.writeFile(out('favicon.svg'), favicon + '\n');

const renders = [
  ['favicon-16.png', 16, favicon, true],
  ['favicon-32.png', 32, favicon, true],
  ['apple-touch-icon.png', 180, art({ gap: 3 })],
  ['icon-192.png', 192, art({ gap: 3 })],
  ['icon-512.png', 512, art({ gap: 3 })],
  // Card corners reach about 40.4% from the centre, so the maskable glyph shrinks into the 40% safe circle.
  ['icon-maskable-512.png', 512, art({ gap: 3, scale: 0.9 })],
];
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || (process.platform === 'darwin' ? 'chrome' : undefined) });
try {
  // A fresh page per size: resizing one page between renders can capture a stale frame.
  for (const [file, size, svg, transparent] of renders) {
    const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    await page.setContent('<!doctype html><style>html,body{margin:0;width:100%;height:100%;background:transparent}svg{display:block;width:100%;height:100%}</style>' + svg);
    await page.screenshot({ path: out(file), omitBackground: !!transparent });
    await page.close();
  }
} finally { await browser.close(); }
