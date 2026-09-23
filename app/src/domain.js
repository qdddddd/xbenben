// Money stays in the currency of its session. Exchange rates match the design.
export const USD_RATES = Object.freeze({ USD: 1, HKD: 0.128, EUR: 1.08, GBP: 1.27, CAD: 0.74, AUD: 0.66 });
export const SYMBOLS = Object.freeze({ USD: '$', HKD: 'HK$', EUR: '€', GBP: '£', CAD: 'C$', AUD: 'A$' });
export const DEFAULT_SETTINGS = Object.freeze({ currency: 'USD', game: 'NLHE', stakes: '2/5', seats: 9, accent: 'steel', pnlColor: 'Mono', showQuickStart: true });
export const ACCENTS = ['steel', 'bronze', 'forest', 'violet'];
export const DEFAULT_VENUES = [
  { name: 'Macau table', city: 'Macau' }, { name: 'Home game', city: '' },
  ...['Bellagio', 'Aria', 'Wynn', 'Encore', 'Resorts World'].map(name => ({ name, city: 'Las Vegas' })),
];
export const DEFAULT_STAKES = ['0.5/1', '1/2', '1/3', '2/5', '5/10', '10/20', '20/40', '25/50', '50/100', '100/200', '200/400', '500/1000'];
export const buyIn = s => s.buyIns.reduce((n, b) => n + b.amount, 0);
export const pnl = s => s.cashOut - buyIn(s) - s.tips;
export const hours = s => Math.max(0, ((s.endedAt ?? Date.now()) - s.startedAt) / 3600000);
export const symbol = code => Object.hasOwn(SYMBOLS, code) ? SYMBOLS[code] : code + ' ';
export const money = (n, code, signed = false) => (n < 0 ? '−' : signed ? '+' : '') + symbol(code) + Math.round(Math.abs(n)).toLocaleString('en-US');
export const rate = (from, to) => from === to ? 1 : Object.hasOwn(USD_RATES, from) && Object.hasOwn(USD_RATES, to) ? Math.round(USD_RATES[from] / USD_RATES[to] * 1000) / 1000 : null;
// Reporting never changes or rounds the recorded session amounts.
export const reportNet = (session, currency) => {
  const multiplier = rate(session.cur, currency);
  return multiplier === null ? null : pnl(session) * multiplier;
};
export function setupFrom(session) {
  return { venue: session.venue, city: session.city, cur: session.cur, sb: session.sb, bb: session.bb,
    game: session.game, seats: session.seats, buyIn: String(Math.min(999999999, Math.round(session.buyIns[0].amount))) };
}
export function latestSession(sessions) {
  const valid = sessions.filter(s => s.bb > 0), personal = valid.filter(s => !s.demo);
  return (personal.length ? personal : valid).slice().sort((a, b) => b.startedAt - a.startedAt)[0];
}
export const newId = () => {
  if (crypto.randomUUID) return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

export function scale(row, multiplier) {
  if (!Number.isFinite(multiplier) || multiplier <= 0) throw new Error('Unsupported conversion.');
  if (multiplier === 1) return { ...row, buyIns: row.buyIns.map(b => ({ ...b })) };
  return { ...row, buyIns: row.buyIns.map(b => ({ ...b, amount: Math.round(b.amount * multiplier) })),
    cashOut: Math.round(row.cashOut * multiplier), tips: Math.round(row.tips * multiplier),
    sb: Math.round(row.sb * multiplier * 10) / 10, bb: Math.round(row.bb * multiplier * 10) / 10 };
}

export function duplicateFlags(rows, existing) {
  const seen = [...existing];
  return rows.map(row => {
    const duplicate = seen.some(s => s.venue === row.venue && Math.abs(s.startedAt - row.startedAt) < 120000);
    seen.push(row);
    return duplicate;
  });
}

export function a7Date(value) {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{2}) (\d{1,2}):(\d{2}):(\d{2})$/.exec((value || '').trim());
  if (!m) return null;
  const [, month, day, year, h, min, sec] = m.map(Number);
  const d = new Date(2000 + year, month - 1, day, h, min, sec);
  return d.getFullYear() === 2000 + year && d.getMonth() === month - 1 && d.getDate() === day && d.getHours() === h && d.getMinutes() === min && d.getSeconds() === sec ? d.getTime() : null;
}

export function parseA7(text, name, Parser = DOMParser) {
  let doc;
  try { doc = new Parser().parseFromString(text, 'application/xml'); }
  catch { return { error: 'That file could not be read.' }; }
  if (!doc || doc.getElementsByTagName('parsererror').length) return { error: 'That file is not valid XML.' };
  const cash = Array.from(doc.getElementsByTagName('cash'));
  if (!cash.length) return { error: 'No cash sessions found in that file. Tournaments and hand histories are not imported.' };
  const currencies = Array.from(doc.getElementsByTagName('currency'));
  const firstBank = doc.getElementsByTagName('bankroll')[0]?.getAttribute('name') || '—';
  const get = (el, key) => el?.getAttribute(key);
  const number = value => value === null || value === '' ? 0 : Number(value);
  let invalidAmounts = false;
  const rows = cash.map((c, i) => {
    const results = Array.from(c.getElementsByTagName('result'));
    const res = results.find(r => r.getAttribute('owner') === '1') || results[0];
    const startedAt = a7Date(get(c, 'startdate'));
    const endedAt = a7Date(get(c, 'enddate')) ?? startedAt;
    const city = get(c, 'bankroll') || firstBank;
    const cur = get(currencies.find(v => get(v, 'bankroll') === city) || currencies[0], 'currencyCode') || 'USD';
    const [sb, bb] = (get(c, 'blinds') || '0/0').split('/').map(number);
    const list = res ? Array.from(res.getElementsByTagName('buyin')) : [];
    const buyIns = list.length ? list.map(b => ({ amount: number(get(b, 'amount')), at: a7Date(get(b, 'date')) ?? startedAt })) : [{ amount: number(get(res, 'buyin')), at: startedAt }];
    const cashOut = number(get(res, 'chipcount')), tips = number(get(res, 'tips'));
    if (!res || [sb, bb, cashOut, tips, ...buyIns.map(b => b.amount)].some(n => !Number.isFinite(n) || n < 0 || n > 1e12)) invalidAmounts = true;
    const variant = (get(c, 'variant') || '').split('|')[0];
    return { id: 'a7-' + (get(c, 'id') || i), sourceId: get(c, 'id') || null,
      startedAt, endedAt, venue: get(c, 'location') || 'Unknown', city, sb, bb,
      game: (get(c, 'limit') === '0' ? 'NL' : 'L') + (/hold/i.test(variant) ? 'HE' : 'O'),
      seats: Number(get(c, 'tablesize')) || 9, buyIns, cashOut, tips,
      notes: get(c, 'comments') || '', src: 'analytics7', cur };
  }).filter(r => r.startedAt !== null && r.endedAt >= r.startedAt);
  if (!rows.length) return { error: 'Sessions were found but none had readable dates.' };
  if (invalidAmounts) return { error: 'Some sessions have missing results or invalid amounts. Check the export and try again.' };
  if (new Set(rows.map(r => r.cur)).size > 1) return { error: 'That file contains more than one currency. Export one bankroll at a time.' };
  return { step: 'map', name, code: rows[0].cur, bank: firstBank, rows, mode: 'keep', skip: true };
}

export function csv(sessions) {
  const header = ['id', 'currency', 'started_at', 'ended_at', 'venue', 'city', 'game', 'small_blind', 'big_blind', 'seats', 'buy_ins', 'cash_out', 'tips', 'net', 'hours', 'notes', 'buy_in_events'];
  // Quote every field; prevent user-controlled text from becoming spreadsheet formulas.
  const cell = (v, untrusted = false) => {
    let s = String(v ?? '');
    if (untrusted && /^\s*[=+@\-\t\r]/.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"', '""') + '"';
  };
  return '\uFEFF' + [header.map(h => cell(h)).join(','), ...sessions.map(s => [
    cell(s.id, true), cell(s.cur, true), cell(new Date(s.startedAt).toISOString()), cell(new Date(s.endedAt).toISOString()),
    cell(s.venue, true), cell(s.city, true), cell(s.game, true), cell(s.sb), cell(s.bb), cell(s.seats),
    cell(buyIn(s)), cell(s.cashOut), cell(s.tips), cell(pnl(s)), cell(hours(s).toFixed(4)),
    cell(s.notes, true), cell(JSON.stringify(s.buyIns)),
  ].join(','))].join('\r\n') + '\r\n';
}

export function download(content, filename, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a'); a.href = url; a.download = filename;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
