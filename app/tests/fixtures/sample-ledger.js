import { freshLedger, STORAGE_KEY } from '../../src/storage.js';
import { setupFrom } from '../../src/domain.js';

// Synthetic design fixtures, used only by tests and local inspection scripts.
export function sampleLedger(N) {
  const D = 86400000, H = 3600000;
  const sessions = [
    { id: 's1', startedAt: N - 1 * D - 5 * H, endedAt: N - 1 * D, venue: 'Bellagio', city: 'Las Vegas', sb: 2, bb: 5, game: 'NLHE', seats: 9, buyIns: [{ amount: 500, at: N - 1 * D - 5 * H }, { amount: 500, at: N - 1 * D - 3.5 * H }], cashOut: 1980, tips: 20, notes: 'Table broke twice; ran good in the last hour.' },
    { id: 's2', startedAt: N - 2 * D - 3 * H, endedAt: N - 2 * D, venue: 'Wynn', city: 'Las Vegas', sb: 1, bb: 3, game: 'NLHE', seats: 8, buyIns: [{ amount: 300, at: N - 2 * D - 3 * H }], cashOut: 130, tips: 10, notes: 'Tough table. Two regs on my left.' },
    { id: 's3', startedAt: N - 4 * D - 6 * H, endedAt: N - 4 * D, venue: 'Aria', city: 'Las Vegas', sb: 5, bb: 10, game: 'NLHE', seats: 9, buyIns: [{ amount: 1000, at: N - 4 * D - 6 * H }, { amount: 1000, at: N - 4 * D - 4 * H }], cashOut: 4120, tips: 30, notes: 'Hero called river with second pair.' },
    { id: 's4', startedAt: N - 6 * D - 4.2 * H, endedAt: N - 6 * D, venue: 'Encore', city: 'Las Vegas', sb: 2, bb: 5, game: 'NLHE', seats: 9, buyIns: [{ amount: 500, at: N - 6 * D - 4.2 * H }], cashOut: 980, tips: 15, notes: '' },
    { id: 's5', startedAt: N - 8 * D - 5.5 * H, endedAt: N - 8 * D, venue: "Mike's home game", city: 'Henderson', sb: 1, bb: 2, game: 'NLHE', seats: 6, buyIns: [{ amount: 200, at: N - 8 * D - 5.5 * H }], cashOut: 540, tips: 0, notes: '' },
    { id: 's6', startedAt: N - 11 * D - 7 * H, endedAt: N - 11 * D, venue: 'Aria', city: 'Las Vegas', sb: 5, bb: 10, game: 'NLHE', seats: 9, buyIns: [{ amount: 1000, at: N - 11 * D - 7 * H }, { amount: 1000, at: N - 11 * D - 5 * H }, { amount: 1000, at: N - 11 * D - 2 * H }], cashOut: 2450, tips: 40, notes: 'Three bullets. Stop-loss ignored — do not repeat.' },
  ].map(session => ({ ...session, id: 'demo-' + session.id, cur: 'USD', demo: true }));
  return { version: 1, ...freshLedger(), sessions, draft: { ...setupFrom(sessions[0]), buyIn: '' } };
}

export async function seedSample(page) {
  const ledger = sampleLedger(await page.evaluate(() => Date.now()));
  await page.evaluate(({ key, ledger }) => localStorage.setItem(key, JSON.stringify(ledger)), { key: STORAGE_KEY, ledger });
  await page.reload();
  await page.getByTestId('bankroll').waitFor();
}
