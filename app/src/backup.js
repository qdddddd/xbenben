import { persistedKeys, validateSaved } from './storage.js';

const digest = async text => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))), b => b.toString(16).padStart(2, '0')).join('');

export async function createBackup(state, createdAt = Date.now()) {
  const ledger = JSON.parse(JSON.stringify({ version: 1, ...Object.fromEntries(persistedKeys.map(k => [k, state[k]])), lastBackupAt: createdAt }));
  if (!validateSaved(ledger)) throw new Error('The ledger could not be backed up. Export a recovery copy before changing your data.');
  const envelope = { format: 'ledger-backup', version: 1, createdAt, ledger, checksum: await digest(JSON.stringify(ledger)) };
  return { envelope, text: JSON.stringify(envelope, null, 2), name: 'xbenben-backup-' + new Date(createdAt).toISOString().replace(/[:.]/g, '-') + '.json' };
}

export async function parseBackup(text) {
  let parsed;
  try { parsed = JSON.parse(text); } catch { throw new Error('That file is not a readable xbenben backup. Your data has not changed.'); }
  if (parsed?.format !== 'ledger-backup') throw new Error('That file is not an xbenben backup. Your data has not changed.');
  if (parsed.version !== 1) throw new Error('This backup version is not supported. Update xbenben before restoring it.');
  if (!Number.isFinite(parsed.createdAt) || !validateSaved(parsed.ledger) || typeof parsed.checksum !== 'string' || parsed.checksum !== await digest(JSON.stringify(parsed.ledger))) {
    throw new Error('This xbenben backup is damaged or incomplete. Your data has not changed.');
  }
  return parsed;
}

export function backupSummary(ledger) {
  const currencies = {};
  ledger.sessions.forEach(s => { currencies[s.cur] = (currencies[s.cur] || 0) + 1; });
  return { sessions: ledger.sessions.length, currencies: Object.entries(currencies).map(([code, count]) => `${count} ${code}`).join(' · ') || 'No completed sessions',
    live: ledger.active ? `${ledger.active.venue} · ${ledger.active.cur}` : 'No running session', venues: ledger.venues.length, stakes: ledger.stakes.length };
}
