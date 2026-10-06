import { test } from 'node:test';
import assert from 'node:assert/strict';
import { playingMs, pausedMs, isPaused, pauseSession, resumeSession, finishSession } from '../src/session-time.js';
import { hours, bigBlindStats, csv, scale } from '../src/domain.js';
import { freshLedger, saveLedger, loadLedger, validSession } from '../src/storage.js';
import { createBackup, parseBackup } from '../src/backup.js';

const start = 1700000000000, minute = 60000, at = minutes => start + minutes * minute;
const session = { id: 'breaks', cur: 'USD', venue: 'Home game', city: '', game: 'NLHE', seats: 9,
  sb: 2, bb: 5, startedAt: start, endedAt: null, buyIns: [{ amount: 500, at: start }], cashOut: 800, tips: 0, notes: '' };
function severalPauses() {
  let s = pauseSession(session, at(30));
  s = resumeSession(s, at(45));
  s = pauseSession(s, at(90));
  s = resumeSession(s, at(120));
  return pauseSession(s, at(135));
}

test('legacy sessions use their full wall time and completed sessions never advance', () => {
  const done = { ...session, endedAt: at(180) };
  assert.equal(playingMs(session, at(90)), 90 * minute);
  assert.equal(playingMs(done, at(300)), 180 * minute);
  assert.equal(pausedMs(done), 0);
  assert.equal(hours(done), 3);
  assert.equal(isPaused(session), false);
  assert.equal(playingMs(session, start - 1), 0);
});

test('several pauses stop only playing time and transitions are immutable and idempotent', () => {
  const s = severalPauses();
  assert.equal(isPaused(s), true);
  assert.equal(playingMs(s, at(150)), 90 * minute);
  assert.equal(playingMs(s, at(180)), 90 * minute);
  assert.equal(pausedMs(s, at(180)), 90 * minute);
  assert.equal(hours(s, at(180)), 1.5);
  assert.equal(pauseSession(s, at(180)), s);
  assert.equal(session.pauses, undefined);
  const resumed = resumeSession(s, at(180));
  assert.equal(isPaused(resumed), false);
  assert.equal(resumeSession(resumed, at(185)), resumed);
  assert.equal(playingMs(resumed, at(195)), 105 * minute);
  assert.equal(s.pauses[2].endedAt, null);
  assert.deepEqual(resumed.pauses, [
    { startedAt: at(30), endedAt: at(45) }, { startedAt: at(90), endedAt: at(120) }, { startedAt: at(135), endedAt: at(180) },
  ]);
});

test('booking while paused closes the break at booking, while ordinary booking keeps its history', () => {
  const done = finishSession(severalPauses(), at(180));
  assert.equal(done.endedAt, at(180));
  assert.equal(done.pauses[2].endedAt, at(180));
  assert.equal(hours(done, at(400)), 1.5);
  assert.equal(pausedMs(done, at(400)), 90 * minute);
  assert.equal(isPaused(done), false);
  assert.ok(validSession(done));
  assert.equal(pauseSession(done, at(200)), done);
  assert.equal(resumeSession(done, at(200)), done);
  assert.equal(finishSession(done, at(200)), done);
  const running = resumeSession(severalPauses(), at(180));
  const booked = finishSession(running, at(210));
  assert.equal(hours(booked), 2);
  assert.deepEqual(booked.pauses, running.pauses);
});

test('clock rollback and same-instant actions cannot reverse or overlap pause intervals', () => {
  let s = pauseSession(session, start - 1);
  s = resumeSession(s, start - 2);
  s = pauseSession(s, start - 3);
  const done = finishSession(s, start - 4);
  assert.ok(validSession(done));
  assert.equal(playingMs(done), 0);
  assert.equal(pausedMs(done), 0);
  const future = pauseSession(session, at(30));
  assert.equal(pausedMs(future, at(20)), 0);
  assert.equal(playingMs(future, at(20)), 20 * minute);
});

test('storage accepts old records and rejects invalid, overlapping or unfinished booked pauses', () => {
  assert.ok(validSession(session, true));
  assert.ok(validSession(severalPauses(), true));
  const invalid = [null, {}, 'pause', [null], [{ startedAt: start - 1, endedAt: start }],
    [{ startedAt: start, endedAt: start - 1 }], [{ startedAt: start }],
    [{ startedAt: start, endedAt: NaN }], [{ startedAt: '0', endedAt: at(1) }],
    [{ startedAt: at(1), endedAt: at(3) }, { startedAt: at(2), endedAt: at(4) }],
    [{ startedAt: at(1), endedAt: null }, { startedAt: at(2), endedAt: at(4) }]];
  for (const pauses of invalid) assert.equal(validSession({ ...session, pauses }, true), false);
  assert.equal(validSession({ ...severalPauses(), endedAt: at(180) }), false);
  assert.equal(validSession({ ...session, endedAt: at(30), pauses: [{ startedAt: at(10), endedAt: at(40) }] }), false);
});

test('pause history and open pause round-trip through storage and version-one backups', async () => {
  const state = { ...freshLedger(), sessions: [finishSession(severalPauses(), at(180))], active: { ...severalPauses(), id: 'active' } };
  const values = new Map(), storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
  saveLedger(state, storage);
  const loaded = loadLedger(storage);
  assert.equal(loaded.error, null);
  assert.deepEqual(loaded.data, state);
  const backup = await createBackup(loaded.data, at(180));
  const restored = await parseBackup(backup.text);
  assert.equal(restored.version, 1);
  assert.equal(restored.ledger.version, 1);
  assert.deepEqual(restored.ledger.active, state.active);
  assert.deepEqual(restored.ledger.sessions, state.sessions);
  assert.equal(playingMs(restored.ledger.active, at(400)), 90 * minute);
  assert.equal(hours(restored.ledger.sessions[0]), 1.5);
});

test('hours, bb/hour and live/online hand estimates all exclude breaks, including all-paused sessions', () => {
  const done = finishSession(severalPauses(), at(180));
  const online = { ...session, id: 'online', endedAt: at(30), cashOut: 600, playType: 'online' };
  const stats = bigBlindStats([done, online]);
  assert.equal(stats.hours, 2);
  assert.equal(stats.bbWon, 80);
  assert.equal(stats.estimatedHands, 82.5);
  assert.equal(stats.perHour, 40);
  assert.equal(stats.per100, 80 / 82.5 * 100);
  const allPaused = finishSession(pauseSession(session, start), at(180));
  assert.equal(hours(allPaused), 0);
  assert.equal(bigBlindStats([allPaused]).perHour, null);
  assert.equal(bigBlindStats([allPaused]).per100, null);
});

test('CSV exports playing hours, paused hours and exact intervals; currency conversion preserves time', () => {
  const done = finishSession(severalPauses(), at(180)), file = csv([done]);
  assert.ok(file.includes('"hours"'));
  assert.ok(file.includes('"paused_hours","pause_events"'));
  assert.ok(file.includes('"300","1.5000"'));
  assert.ok(file.includes('"live","1.5000"'));
  assert.ok(file.includes(JSON.stringify(done.pauses).replaceAll('"', '""')));
  assert.deepEqual(scale(done, .128).pauses, done.pauses);
  assert.equal(hours(scale(done, .128)), 1.5);
});
