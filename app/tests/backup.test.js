import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBackup, parseBackup } from '../src/backup.js';
import { freshLedger, normalizeSaved } from '../src/storage.js';
import { createHash } from 'node:crypto';

test('versioned backups faithfully round-trip settings, drafts, choices and metadata', async () => {
  const state = { ...freshLedger(), venues: [{ name: 'Private table', city: 'Home' }], stakes: ['50/100'] };
  state.settings.accent = 'forest'; state.draft.buyIn = '700';
  state.settings.liveHandsPerHour = 25; state.settings.onlineHandsPerHour = 180; state.draft.playType = 'online';
  const session = { id: 'online', cur: 'USD', venue: 'Online room', city: '', game: 'NLHE', seats: 6, playType: 'online',
    sb: 1, bb: 2, startedAt: 1700000000000, endedAt: 1700003600000, buyIns: [{ amount: 200, at: 1700000000000 }], cashOut: 300, tips: 0, notes: '' };
  state.sessions = [session]; state.active = { ...session, id: 'running', endedAt: null };
  state.lastSetup = { ...state.draft, cur: 'HKD', venue: 'Home game' };
  const file = await createBackup(state, 1700000000000);
  const restored = await parseBackup(file.text);
  assert.deepEqual(restored.ledger, { version: 1, ...state, lastBackupAt: 1700000000000 });
  assert.equal(state.lastBackupAt, null);
});
test('legacy version-one backups remain readable and receive the new optional defaults', async () => {
  const ledger = { version: 1, ...freshLedger(), lastBackupAt: 1700000000000 };
  delete ledger.lastSetup; delete ledger.draft.cur;
  delete ledger.draft.playType; delete ledger.settings.liveHandsPerHour; delete ledger.settings.onlineHandsPerHour;
  const checksum = createHash('sha256').update(JSON.stringify(ledger)).digest('hex');
  const parsed = await parseBackup(JSON.stringify({ format: 'ledger-backup', version: 1, createdAt: 1700000000000, ledger, checksum }));
  const restored = normalizeSaved(parsed.ledger);
  assert.equal(restored.draft.cur, 'USD');
  assert.equal(restored.lastSetup, null);
  assert.equal(restored.draft.playType, 'live');
  assert.equal(restored.settings.liveHandsPerHour, 30); assert.equal(restored.settings.onlineHandsPerHour, 75);
  assert.deepEqual(restored.sessions, []);
});
test('damaged, unrelated and future-version backups are rejected', async () => {
  const file = await createBackup(freshLedger());
  const broken = JSON.parse(file.text); broken.ledger.settings.currency = 'HKD';
  await assert.rejects(parseBackup(JSON.stringify(broken)), /damaged/);
  await assert.rejects(parseBackup('{'), /not a readable/);
  await assert.rejects(parseBackup('{"rows":[]}'), /not an xbenben/);
  await assert.rejects(parseBackup(JSON.stringify({ ...JSON.parse(file.text), version: 99 })), /not supported/);
});
