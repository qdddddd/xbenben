import { DEFAULT_SETTINGS, ACCENTS } from './domain.js';

export const STORAGE_KEY = 'ledger:data:v1';
export const persistedKeys = ['sessions', 'settings', 'active', 'draft', 'out', 'venues', 'stakes', 'lastBackupAt'];
const amount = n => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1e12;
const text = s => typeof s === 'string';
export function validSession(s, live = false) {
  return s && text(s.id) && text(s.cur) && text(s.venue) && text(s.city) && text(s.game) && text(s.notes) &&
    Number.isFinite(s.startedAt) && (live ? s.endedAt === null : Number.isFinite(s.endedAt) && s.endedAt >= s.startedAt) &&
    [s.sb, s.bb, s.cashOut, s.tips].every(amount) && Number.isInteger(s.seats) && s.seats > 0 && s.seats <= 100 &&
    Array.isArray(s.buyIns) && s.buyIns.length > 0 && s.buyIns.every(b => amount(b.amount) && Number.isFinite(b.at));
}
export function validateSaved(data) {
  const s = data?.settings, d = data?.draft;
  return data?.version === 1 && (data.lastBackupAt == null || Number.isFinite(data.lastBackupAt)) && Array.isArray(data.sessions) && data.sessions.every(x => validSession(x)) &&
    new Set(data.sessions.map(x => x.id)).size === data.sessions.length && (!data.active || validSession(data.active, true)) &&
    s && text(s.currency) && text(s.game) && /^\d+(\.\d+)?\/\d+(\.\d+)?$/.test(s.stakes) && Number(s.stakes.split('/')[1]) > 0 &&
    Number.isInteger(s.seats) && s.seats > 0 && s.seats <= 100 && ACCENTS.includes(s.accent) && ['Mono', 'Signal'].includes(s.pnlColor) && typeof s.showQuickStart === 'boolean' &&
    d && text(d.venue) && text(d.city) && text(d.game) && amount(d.sb) && amount(d.bb) && d.bb > 0 && Number.isInteger(d.seats) && d.seats > 0 && d.seats <= 100 && /^\d{0,9}$/.test(d.buyIn) &&
    data.out && ['cash', 'tips'].every(k => /^\d{0,9}$/.test(data.out[k])) &&
    Array.isArray(data.venues) && data.venues.every(v => text(v.name) && text(v.city)) &&
    Array.isArray(data.stakes) && data.stakes.every(v => /^\d+(\.\d+)?\/\d+(\.\d+)?$/.test(v) && Number(v.split('/')[1]) > 0);
}
export function freshLedger() {
  return { sessions: [], active: null, settings: { ...DEFAULT_SETTINGS },
    draft: { venue: 'Bellagio', city: 'Las Vegas', sb: 2, bb: 5, game: 'NLHE', seats: 9, buyIn: '' },
    out: { cash: '', tips: '' }, venues: [], stakes: [], lastBackupAt: null };
}
export function loadLedger(storage = localStorage) {
  let raw = null;
  try {
    raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { data: freshLedger(), error: null };
    const data = JSON.parse(raw);
    if (!validateSaved(data)) throw new Error('Unrecognized data');
    return { data: { ...Object.fromEntries(persistedKeys.map(k => [k, data[k]])), lastBackupAt: data.lastBackupAt ?? null }, error: null };
  } catch {
    return { data: freshLedger(), raw, error: raw ? 'Saved data could not be read. The original is preserved. Download a recovery copy before resetting storage.' : 'Storage is unavailable. Changes are only kept in this window. Export your log before closing.' };
  }
}
export function saveLedger(state, storage = localStorage) {
  const data = { version: 1, savedAt: Date.now(), ...Object.fromEntries(persistedKeys.map(k => [k, state[k]])) };
  if (!validateSaved(data)) throw new Error('The ledger contains an invalid record.');
  storage.setItem(STORAGE_KEY, JSON.stringify(data));
}
