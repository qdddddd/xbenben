import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBackup, parseBackup } from '../src/backup.js';
import { freshLedger } from '../src/storage.js';

test('versioned backups faithfully round-trip settings, drafts, choices and metadata', async () => {
  const state = { ...freshLedger(), venues: [{ name: 'Private table', city: 'Home' }], stakes: ['50/100'] };
  state.settings.accent = 'forest'; state.draft.buyIn = '700';
  const file = await createBackup(state, 1700000000000);
  const restored = await parseBackup(file.text);
  assert.deepEqual(restored.ledger, { version: 1, ...state, lastBackupAt: 1700000000000 });
  assert.equal(state.lastBackupAt, null);
});
test('damaged, unrelated and future-version backups are rejected', async () => {
  const file = await createBackup(freshLedger());
  const broken = JSON.parse(file.text); broken.ledger.settings.currency = 'HKD';
  await assert.rejects(parseBackup(JSON.stringify(broken)), /damaged/);
  await assert.rejects(parseBackup('{'), /not a readable/);
  await assert.rejects(parseBackup('{"rows":[]}'), /not a Ledger/);
  await assert.rejects(parseBackup(JSON.stringify({ ...JSON.parse(file.text), version: 99 })), /not supported/);
});
