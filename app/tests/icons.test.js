import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { PNG } from 'pngjs';
import { APP_ICONS, appIcon, iconPath } from '../src/app-icons.js';
import { freshLedger, loadLedger, saveLedger, normalizeSaved } from '../src/storage.js';
import { createBackup, parseBackup } from '../src/backup.js';
import { squareArtwork } from '../scripts/icon-art.mjs';

const pixel = (image, x, y) => [...image.data.subarray((y * image.width + x) * 4, (y * image.width + x) * 4 + 4)];
const rgba = ground => [...ground.match(/[a-f0-9]{2}/gi).map(hex => parseInt(hex, 16)), 255];

test('all seven choices round-trip local storage and version-one backups; old or unknown choices default to Paper', async () => {
  const storage = new Map(); storage.setItem = storage.set.bind(storage); storage.getItem = storage.get.bind(storage);
  assert.equal(freshLedger().settings.appIcon, 'paper');
  assert.deepEqual(APP_ICONS.map(icon => icon.variant), ['4B', '4C', '4D', '4E', '4F', '4G', '4H']);
  for (const { id } of APP_ICONS) {
    const state = freshLedger(); state.settings.appIcon = id;
    saveLedger(state, storage);
    assert.deepEqual(loadLedger(storage).data, state);
    const backup = await createBackup(state);
    assert.equal(backup.envelope.version, 1);
    assert.equal(normalizeSaved((await parseBackup(backup.text)).ledger).settings.appIcon, id);
  }
  for (const choice of [undefined, 'future-icon', null, '../outside', {}]) {
    const state = freshLedger(); state.settings.appIcon = choice;
    saveLedger(state, storage);
    assert.equal(loadLedger(storage).data.settings.appIcon, 'paper');
    const backup = await createBackup(state);
    assert.equal(normalizeSaved((await parseBackup(backup.text)).ledger).settings.appIcon, 'paper');
    assert.equal(appIcon(choice).id, 'paper');
  }
});

test('cleanup retains the supplied bills pixel-for-pixel and rejects artwork reaching its crop boundary', async () => {
  for (const icon of APP_ICONS) {
    const source = PNG.sync.read(await fs.readFile(new URL('../../' + icon.source, import.meta.url)));
    const clean = squareArtwork(source, icon.ground), field = rgba(icon.ground);
    assert.notDeepEqual(pixel(source, 0, 0), field, 'The source really has off-colour corners.');
    assert.deepEqual(pixel(clean, 0, 0), field);
    // The bill glyph bounds were measured independently in the supplied artwork.
    let ink = 0;
    for (let y = 120; y < 920; y++) for (let x = 110; x < 920; x++) {
      const offset = (y * source.width + x) * 4;
      assert.equal(clean.data.readUInt32BE(offset), source.data.readUInt32BE(offset));
      if (pixel(source, x, y).some((v, i) => v !== field[i])) ink++;
    }
    assert.ok(ink > 240000, 'Cleanup must retain the bills, not produce a blank tile.');
    const damaged = PNG.sync.read(PNG.sync.write(source));
    damaged.data[(500 * 1024 + 80) * 4] ^= 1;
    assert.throws(() => squareArtwork(damaged, icon.ground), /cleanup boundary/);
  }
});

test('every shipped icon is opaque, with clean edges, corners and iOS mask margins; maskable art stays in the safe circle', async () => {
  const files = (await fs.readdir(new URL('../public/icons/', import.meta.url))).sort();
  const expected = APP_ICONS.flatMap(icon => (icon.id === 'paper' ? [16, 32, 180, 192, 512, 'maskable-1024'] : [16, 32, 180])
    .map(size => iconPath(icon.id, size).slice('icons/'.length))).sort();
  assert.deepEqual(files, expected, 'No old 3A or unclean source icons ship.');
  for (const file of files) {
    const icon = APP_ICONS.find(icon => file.startsWith(`bankroll-${icon.id}-`));
    const image = PNG.sync.read(await fs.readFile(new URL('../public/icons/' + file, import.meta.url)));
    const size = image.width, field = rgba(icon.ground), packed = Buffer.from(field).readUInt32BE(0);
    assert.equal(image.height, size);
    assert.equal(size, Number(file.match(/-(\d+)\.png$/)[1]));
    let ink = 0;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const offset = (y * size + x) * 4, isGround = image.data.readUInt32BE(offset) === packed;
      assert.equal(image.data[offset + 3], 255, file + ' alpha');
      // The outer 6% rim includes the original edge and diagonal corner contamination.
      if (Math.min(x, y, size - 1 - x, size - 1 - y) < Math.max(1, Math.floor(size * .06))) assert.ok(isGround, file + ' rim');
      // Check outside and just inside the rounded mask's arc, not its whole
      // bounding square (which legitimately contains part of the bill artwork).
      const radius = size * .226, dx = Math.min(x + .5, size - x - .5), dy = Math.min(y + .5, size - y - .5);
      if (dx < radius && dy < radius && Math.hypot(radius - dx, radius - dy) >= radius - size * .02) assert.ok(isGround, file + ' corner mask');
      if (!isGround) {
        ink++;
        if (file.includes('maskable')) assert.ok(Math.hypot(x + .5 - size / 2, y + .5 - size / 2) <= size * .4, file + ' safe circle');
      }
    }
    assert.ok(ink > size * size * .15 && ink < size * size * .5, file + ' retains visible artwork');
  }
});
