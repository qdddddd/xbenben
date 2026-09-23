import { test } from 'node:test';
import assert from 'node:assert/strict';
import { money, rate, scale, duplicateFlags, a7Date, csv, pnl, hours, reportNet, bigBlindStats, formatBB, setupFrom } from '../src/domain.js';
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
test('reporting converts native net without mutating or rounding sessions', () => {
  const small = { ...row, buyIns: [{ amount: 100, at: row.startedAt }], cashOut: 104.5, tips: 0 };
  const original = structuredClone(small);
  assert.ok(Math.abs(reportNet(small, 'USD') - .576) < 1e-12);
  assert.equal(money(reportNet(small, 'USD') * 2, 'USD', true), '+$1');
  assert.equal(reportNet(small, 'HKD'), 4.5);
  assert.equal(reportNet(small, 'JPY'), null);
  assert.equal(rate('constructor', 'USD'), null);
  assert.deepEqual(small, original);
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
  assert.ok(file.includes('"play_type"'));
  assert.ok(file.endsWith(',"live"\r\n'));
  assert.ok(csv([{ ...row, playType: 'online' }]).endsWith(',"online"\r\n'));
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
test('old saved ledgers acquire session currency and last setup without altering records', () => {
  const old = { version: 1, ...freshLedger(), sessions: [row], active: { ...row, id: 'running', endedAt: null } };
  old.settings.currency = 'EUR'; delete old.draft.cur; delete old.lastSetup; delete old.draft.playType;
  delete old.settings.liveHandsPerHour; delete old.settings.onlineHandsPerHour;
  const result = loadLedger({ getItem: () => JSON.stringify(old) });
  assert.equal(result.error, null);
  assert.equal(result.data.draft.cur, 'HKD');
  assert.equal(result.data.lastSetup.cur, 'HKD');
  assert.equal(result.data.lastSetup.buyIn, '2000');
  assert.equal(result.data.settings.currency, 'EUR');
  assert.equal(result.data.settings.liveHandsPerHour, 30);
  assert.equal(result.data.settings.onlineHandsPerHour, 75);
  assert.equal(result.data.draft.playType, 'live');
  assert.equal(result.data.lastSetup.playType, 'live');
  assert.deepEqual(result.data.sessions, old.sessions);
  assert.deepEqual(result.data.active, old.active);
});

test('big-blind averages weight native results by hours and estimated live/online hands', () => {
  const sessions = [
    { ...row, cur: 'USD', bb: 5, tips: 0, cashOut: 2100, endedAt: row.startedAt + 7200000, playType: 'live' },
    { ...row, id: 'two', cur: 'HKD', bb: 10, tips: 0, cashOut: 2150, endedAt: row.startedAt + 3600000, playType: 'online' },
  ];
  const original = structuredClone(sessions), stats = bigBlindStats(sessions);
  assert.equal(stats.bbWon, 35); assert.equal(stats.hours, 3); assert.equal(stats.estimatedHands, 135);
  assert.equal(stats.perHour, 35 / 3); assert.equal(stats.per100, 35 / 135 * 100);
  assert.equal(formatBB(stats.perHour), '+11.7'); assert.equal(formatBB(stats.per100), '+25.9');
  const revised = bigBlindStats(sessions, { liveHandsPerHour: 20, onlineHandsPerHour: 100, currency: 'EUR' });
  assert.equal(revised.perHour, stats.perHour); assert.equal(revised.per100, 25);
  assert.deepEqual(bigBlindStats(sessions.map(s => ({ ...s, cur: 'JPY' }))), stats);
  assert.deepEqual(sessions, original);
  assert.equal(setupFrom(sessions[1]).playType, 'online');
});

test('big-blind averages handle legacy records, losses, no hands, zero blinds and running sessions', () => {
  const loss = { ...row, cashOut: 1000, tips: 0 }; // Untagged legacy session: -50 bb over 5 live hours.
  const excluded = [
    { ...row, bb: 0 }, { ...row, endedAt: row.startedAt }, { ...row, endedAt: null },
  ];
  const stats = bigBlindStats([loss, ...excluded]);
  assert.equal(stats.count, 1); assert.equal(stats.excluded, 3); assert.equal(stats.estimatedHands, 150);
  assert.equal(formatBB(stats.perHour), '−10.0'); assert.equal(formatBB(stats.per100), '−33.3');
  for (const sessions of [[], excluded]) {
    assert.equal(bigBlindStats(sessions).perHour, null); assert.equal(bigBlindStats(sessions).per100, null);
  }
  assert.equal(bigBlindStats([loss], { liveHandsPerHour: 0 }).per100, null);
  for (const value of [null, NaN, Infinity]) assert.equal(formatBB(value), '—');
  assert.equal(formatBB(-.001), '+0.0');
  assert.equal(formatBB(bigBlindStats([{ ...row, cashOut: 2050 }]).per100), '+0.0');
});

test('invalid hand estimates and play types are rejected without rejecting legacy data', () => {
  const ledger = { version: 1, ...freshLedger(), sessions: [row] };
  assert.equal(validateSaved(ledger), true);
  for (const key of ['liveHandsPerHour', 'onlineHandsPerHour']) {
    for (const value of [0, -1, 12.5, 10001, NaN, Infinity, null, '30']) {
      assert.equal(validateSaved({ ...ledger, settings: { ...ledger.settings, [key]: value } }), false);
    }
  }
  assert.equal(validateSaved({ ...ledger, sessions: [{ ...row, playType: 'unknown' }] }), false);
  assert.equal(validateSaved({ ...ledger, draft: { ...ledger.draft, playType: 'unknown' } }), false);
  assert.equal(validateSaved({ ...ledger, sessions: [{ ...row, playType: 'online' }] }), true);
});
