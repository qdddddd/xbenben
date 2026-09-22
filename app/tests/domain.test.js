import { test } from 'node:test';
import assert from 'node:assert/strict';
import { money, rate, scale, duplicateFlags, a7Date, csv, pnl, hours } from '../src/domain.js';
import { freshLedger, loadLedger, saveLedger, validateSaved, STORAGE_KEY } from '../src/storage.js';

const row = { id: 'one', cur: 'HKD', venue: 'Demo Room A', city: 'Demo City', game: 'NLHE', seats: 8,
  sb: 10, bb: 20, startedAt: 1000000, endedAt: 19000000, buyIns: [{ amount: 2000, at: 1000000 }], cashOut: 3800, tips: 50, notes: '' };

test('money uses the real minus, symbols, grouping and prototype rounding', () => {
  assert.equal(money(-1234.6, 'HKD', true), '−HK$1,235');
  assert.equal(money(3085, 'USD', true), '+$3,085');
  assert.equal(money(1, 'JPY'), 'JPY 1');
  assert.equal(money(0, 'EUR', true), '+€0');
});
test('conversion applies exactly the displayed fixed rate to each component', () => {
  assert.equal(rate('HKD', 'USD'), .128);
  assert.equal(rate('USD', 'HKD'), 7.813);
  assert.equal(rate('JPY', 'USD'), null);
  const converted = scale(row, rate('HKD', 'USD'));
  assert.equal(converted.cashOut, 486);
  assert.equal(converted.buyIns[0].amount, 256);
  assert.equal(converted.tips, 6);
  assert.equal(converted.sb, 1.3);
  assert.equal(pnl(converted), 224);
  assert.equal(row.cashOut, 3800);
  assert.equal(scale({ ...row, tips: .5 }, 1).tips, .5);
});
test('duplicate rule is the venue and strictly less than two minutes, including within a file', () => {
  assert.deepEqual(duplicateFlags([row, { ...row, id: 'two' }, { ...row, startedAt: row.startedAt + 120000 }, { ...row, venue: 'Demo Room B' }], []), [false, true, false, false]);
  assert.deepEqual(duplicateFlags([row], [row]), [true]);
});
test('invalid dates do not normalize into another month; timing keeps elapsed hours', () => {
  assert.equal(a7Date('02/30/26 12:00:00'), null);
  assert.equal(a7Date('01/01/26 25:00:00'), null);
  assert.ok(a7Date('12/26/25 22:34:00'));
  assert.equal(hours(row), 5);
});
test('CSV contains exact session currency, numeric results, quoted multiline text and formula protection', () => {
  const file = csv([{ ...row, venue: '=HYPERLINK("bad")', notes: 'One, two\n"three"' }]);
  assert.match(file, /"HKD"/);
  assert.ok(file.includes('"\'=HYPERLINK(""bad"")"'));
  assert.ok(file.includes('"One, two\n""three"""'));
  assert.ok(file.includes('"1750"'));
});
test('one versioned save round-trips completed sessions, settings and live buy-ins', () => {
  const storage = new Map();
  storage.setItem = storage.set.bind(storage); storage.getItem = storage.get.bind(storage);
  const state = { ...freshLedger(), sessions: [row], active: { ...row, id: 'live', endedAt: null } };
  saveLedger(state, storage);
  assert.deepEqual(loadLedger(storage).data, state);
  const data = JSON.parse(storage.get(STORAGE_KEY));
  assert.equal(validateSaved({ ...data, sessions: [row, row] }), false);
});
test('corrupt or unavailable storage never silently overwrites the original', () => {
  let writes = 0;
  const storage = { getItem: () => '{broken', setItem: () => writes++ };
  const result = loadLedger(storage);
  assert.ok(result.error); assert.equal(result.raw, '{broken'); assert.equal(writes, 0);
  assert.ok(loadLedger({ getItem() { throw new Error('blocked'); } }).error);
  assert.throws(() => saveLedger(freshLedger(), { setItem() { throw new Error('full'); } }));
});
