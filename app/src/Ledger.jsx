import React from "react";
import LedgerView from "./LedgerView.jsx";
import { Dialogs, StorageNotice } from "./Overlays.jsx";
import * as domain from "./domain.js";
import { loadLedger, saveLedger, STORAGE_KEY, persistedKeys, freshLedger, normalizeSaved } from "./storage.js";
import { createBackup, parseBackup } from './backup.js';
import { AppUpdates } from './AppUpdates.jsx';

export default class Ledger extends React.Component {
  constructor(props) {
    super(props);
    const saved = loadLedger();
    this.state = { ...saved.data, tab: 'home', flow: saved.data.active ? 'active' : null,
      detailId: null, sheet: null, filter: 'All', now: Date.now(), padTarget: 'buyIn', toast: null,
      modal: null, imp: null, storageError: saved.error, recoveryRaw: saved.raw || null };
  }

  rate(from, to) { return domain.rate(from, to); }

  seed(N, D, H) {
    return this.tagUSD([
      { id: 's1', startedAt: N - 1 * D - 5 * H, endedAt: N - 1 * D, venue: 'Bellagio', city: 'Las Vegas', sb: 2, bb: 5, game: 'NLHE', seats: 9, buyIns: [{ amount: 500, at: N - 1 * D - 5 * H }, { amount: 500, at: N - 1 * D - 3.5 * H }], cashOut: 1980, tips: 20, notes: 'Table broke twice; ran good in the last hour.' },
      { id: 's2', startedAt: N - 2 * D - 3 * H, endedAt: N - 2 * D, venue: 'Wynn', city: 'Las Vegas', sb: 1, bb: 3, game: 'NLHE', seats: 8, buyIns: [{ amount: 300, at: N - 2 * D - 3 * H }], cashOut: 130, tips: 10, notes: 'Tough table. Two regs on my left.' },
      { id: 's3', startedAt: N - 4 * D - 6 * H, endedAt: N - 4 * D, venue: 'Aria', city: 'Las Vegas', sb: 5, bb: 10, game: 'NLHE', seats: 9, buyIns: [{ amount: 1000, at: N - 4 * D - 6 * H }, { amount: 1000, at: N - 4 * D - 4 * H }], cashOut: 4120, tips: 30, notes: 'Hero called river with second pair.' },
      { id: 's4', startedAt: N - 6 * D - 4.2 * H, endedAt: N - 6 * D, venue: 'Encore', city: 'Las Vegas', sb: 2, bb: 5, game: 'NLHE', seats: 9, buyIns: [{ amount: 500, at: N - 6 * D - 4.2 * H }], cashOut: 980, tips: 15, notes: '' },
      { id: 's5', startedAt: N - 8 * D - 5.5 * H, endedAt: N - 8 * D, venue: "Mike's home game", city: 'Henderson', sb: 1, bb: 2, game: 'NLHE', seats: 6, buyIns: [{ amount: 200, at: N - 8 * D - 5.5 * H }], cashOut: 540, tips: 0, notes: '' },
      { id: 's6', startedAt: N - 11 * D - 7 * H, endedAt: N - 11 * D, venue: 'Aria', city: 'Las Vegas', sb: 5, bb: 10, game: 'NLHE', seats: 9, buyIns: [{ amount: 1000, at: N - 11 * D - 7 * H }, { amount: 1000, at: N - 11 * D - 5 * H }, { amount: 1000, at: N - 11 * D - 2 * H }], cashOut: 2450, tips: 40, notes: 'Three bullets. Stop-loss ignored — do not repeat.' },
    ]);
  }
  tagUSD(list) { return list.map((s) => Object.assign({ cur: 'USD' }, s)); }

  componentDidMount() {
    this.tick = setInterval(() => { if (this.state.active && !document.hidden) this.setState({ now: Date.now() }); }, 1000);
    this.wake = () => { if (this.state.active) this.setState({ now: Date.now() }); };
    this.storageChanged = event => {
      if (event.key !== STORAGE_KEY) return;
      const saved = loadLedger();
      if (saved.error) { this.setState({ storageError: saved.error, recoveryRaw: saved.raw }); return; }
      this.externalChange = true;
      this.setState(prev => ({ ...saved.data, now: Date.now(), detailId: null,
        flow: ['active', 'cashout'].includes(prev.flow) && !saved.data.active ? null : prev.flow }));
    };
    this.keydown = e => {
      if (this.state.sheet || this.state.modal || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      if (!['new', 'cashout'].includes(this.state.flow)) return;
      if (/^\d$/.test(e.key)) { e.preventDefault(); this.pad(e.key); }
      else if (e.key === 'Backspace') { e.preventDefault(); this.pad('del'); }
    };
    document.addEventListener('visibilitychange', this.wake);
    window.addEventListener('pageshow', this.wake);
    window.addEventListener('storage', this.storageChanged);
    window.addEventListener('keydown', this.keydown);
    this.applyAccent();
    this.requestStorage();
  }

  componentDidUpdate(prevProps, prev) {
    if (prev.settings.accent !== this.state.settings.accent) this.applyAccent();
    if (this.externalChange) { this.externalChange = false; return; }
    if (persistedKeys.some(k => prev[k] !== this.state[k]) && !this.state.recoveryRaw) {
      try { saveLedger(this.state); if (this.state.storageError) this.setState({ storageError: null }); }
      catch { if (!this.state.storageError) this.setState({ storageError: 'Changes could not be saved. Export your log before closing, then free some device storage and try again.' }); }
    }
  }

  componentWillUnmount() {
    clearInterval(this.tick); clearTimeout(this.toastT);
    document.removeEventListener('visibilitychange', this.wake);
    window.removeEventListener('pageshow', this.wake);
    window.removeEventListener('storage', this.storageChanged);
    window.removeEventListener('keydown', this.keydown);
  }

  applyAccent() { document.documentElement.dataset.accent = this.state.settings.accent; }

  symOf(code) { return domain.symbol(code); }

  sym() { return this.symOf(this.state.settings.currency); }
  moneyIn(n, code, sign) { return domain.money(n, code, sign); }

  a7Date(s) { return domain.a7Date(s); }

  parseA7(text, name) { return domain.parseA7(text, name); }

  isDupe(r) {
    return this.state.sessions.some((s) => s.venue === r.venue && Math.abs(s.startedAt - r.startedAt) < 120000);
  }
  scale(row, rate) { return domain.scale(row, rate); }

  loadA7(text, name) {
    const res = this.parseA7(text, name);
    if (res.error) this.setState({ imp: { step: 'pick', error: res.error } });
    else this.setState({ imp: res });
  }
  commitA7() {
    const imp = this.state.imp; if (!imp?.rows) return;
    const S = this.state.settings;
    const keep = imp.mode !== 'convert' || imp.code === S.currency;
    const k = keep ? 1 : this.rate(imp.code, S.currency);
    if (!k) { this.say('No fixed rate is available for that currency.'); return; }
    const dupes = domain.duplicateFlags(imp.rows, this.state.sessions);
    const cur = keep ? imp.code : S.currency;
    const add = imp.rows.filter((r, i) => !(imp.skip && dupes[i]))
      .map(r => ({ ...this.scale(r, k), id: domain.newId(), cur, sourceCurrency: r.cur, importRate: k }));
    if (!add.length) return;
    this.setState({ sessions: [...add, ...this.state.sessions],
      venues: this.mergeVenues(add), stakes: this.mergeStakes(add),
      imp: null, flow: null, detailId: null, tab: 'home' });
    this.say(add.length + ' sessions imported from analytics7');
  }

  money(n, sign) { return this.moneyIn(n, this.state.settings.currency, sign); }

  buyIn(s) { return domain.buyIn(s); }

  pnl(s) { return domain.pnl(s); }

  hours(s) { return domain.hours(s); }

  clock(ms) {
    const t = Math.max(0, Math.floor(ms / 1000));
    return Math.floor(t / 3600) + ':' + String(Math.floor((t % 3600) / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');
  }
  shortDur(ms) {
    const t = Math.max(0, Math.floor(ms / 60000));
    return Math.floor(t / 60) + 'h ' + String(t % 60).padStart(2, '0') + 'm';
  }
  when(ts) {
    const d = new Date(ts), days = Math.round((Date.now() - ts) / 86400000);
    if (days <= 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return days + ' days ago';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  hm(ts) { return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(/\s/, ''); }
  pos() { return this.state.settings.pnlColor === 'Signal' ? 'var(--color-profit)' : 'var(--color-accent-700)'; }

  neg() { return this.state.settings.pnlColor === 'Signal' ? 'var(--color-loss)' : 'var(--color-neutral-900)'; }

  col(n) { return n < 0 ? this.neg() : this.pos(); }
  stakeLabel(s) { return s.sb + '/' + s.bb; }

  // ── actions ─────────────────────────────────────────────────
  say(msg) {
    this.setState({ toast: msg });
    if (this.toastT) clearTimeout(this.toastT);
    this.toastT = setTimeout(() => this.setState({ toast: null }), 2200);
  }
  go(tab) { this.setState({ tab, flow: null, detailId: null, sheet: null }); }
  openDetail(id) { this.setState({ detailId: id, flow: null, sheet: null }); }
  pad(key) {
    this.setState(st => {
      const t = st.padTarget;
      let v = t === 'buyIn' ? st.draft.buyIn : st.out[t];
      if (key === 'del') v = v.slice(0, -1);
      else if (/^\d{1,2}$/.test(key) && !(key === '00' && v === '')) v = ((v === '0' ? '' : v) + key).slice(0, 9);
      return t === 'buyIn' ? { draft: { ...st.draft, buyIn: v } } : { out: { ...st.out, [t]: v } };
    });
  }

  startSession(over) {
    this.setState(st => {
      if (st.active) return { flow: 'active', detailId: null };
      const d = { ...st.draft, ...over }, amount = Number(d.buyIn);
      if (!Number.isFinite(amount) || amount <= 0 || amount > 999999999 || d.bb <= 0) return null;
      const at = Date.now(), cur = d.cur || 'USD', playType = domain.playType(d);
      return { active: { id: domain.newId(), cur, playType, startedAt: at, endedAt: null, venue: d.venue, city: d.city,
        sb: d.sb, bb: d.bb, game: d.game, seats: d.seats, buyIns: [{ amount, at }], cashOut: 0, tips: 0, notes: '' },
        draft: { ...d, cur, playType, buyIn: '' }, lastSetup: { ...d, cur, playType, buyIn: String(amount) }, out: { cash: '', tips: '' },
        flow: 'active', tab: 'home', detailId: null, sheet: null, now: at };
    });
  }

  rebuy(amount) {
    if (!this.state.active || !Number.isFinite(amount) || amount <= 0) return;
    const cur = this.state.active.cur;
    this.setState(st => st.active ? { active: { ...st.active, buyIns: [...st.active.buyIns, { amount, at: Date.now() }] }, sheet: null } : null);
    this.say('Re-buy ' + this.moneyIn(amount, cur) + ' logged');
  }

  book() {
    let done;
    this.setState(st => {
      if (!st.active) return null;
      done = { ...st.active, endedAt: Date.now(), cashOut: Number(st.out.cash) || 0, tips: Number(st.out.tips) || 0 };
      return { sessions: [done, ...st.sessions], active: null, out: { cash: '', tips: '' },
        flow: null, tab: 'home' };
    }, () => { if (done) this.say('Session booked · ' + this.moneyIn(this.pnl(done), done.cur, true)); });
  }

  curve(list, w, h, value = s => this.pnl(s)) {
    const pts = [];
    let run = 0;
    list.slice().sort((a, b) => a.startedAt - b.startedAt).forEach((s) => { run += value(s); pts.push(run); });
    if (!pts.length) return { line: '', area: '', zero: h / 2, peak: 0, last: run };
    if (pts.length === 1) pts.unshift(0);
    const all = pts.concat([0]);
    const min = Math.min.apply(null, all), max = Math.max.apply(null, all);
    const range = (max - min) || 1;
    const y = (v) => (h - 6) - ((v - min) / range) * (h - 12) + 6;
    const step = w / (pts.length - 1);
    const line = pts.map((v, i) => (i * step).toFixed(1) + ',' + y(v).toFixed(1)).join(' ');
    return { line, area: '0,' + y(min) + ' ' + line + ' ' + w + ',' + y(min), zero: y(0).toFixed(1), peak: max, last: run };
  }

  renderVals() {
    const st = this.state, S = st.settings;
    const reporting = s => domain.reportNet(s, S.currency);
    const sessions = st.sessions.filter(s => reporting(s) !== null);
    const excluded = st.sessions.filter(s => reporting(s) === null);
    const foreign = [...new Set(st.sessions.map(s => s.cur))].filter(cur => cur !== S.currency);
    const missingCodes = [...new Set(excluded.map(s => s.cur))].join(', ');
    const conversionNote = foreign.length ? 'Currency totals in ' + S.currency + ' · fixed exchange rates.' : '';
    const missingRateNote = excluded.length ? excluded.length + ' session' + (excluded.length === 1 ? '' : 's') + ' in ' + missingCodes + ' excluded from currency totals: no fixed rate to ' + S.currency + '. Original amounts remain in the log.' : '';
    const flow = st.flow, det = st.detailId;
    const onTab = !flow && !det;
    const net = sessions.reduce((n, s) => n + reporting(s), 0);
    const hrs = sessions.reduce((n, s) => n + this.hours(s), 0);
    const bbStats = domain.bigBlindStats(st.sessions, S);
    const wins = sessions.filter(s => this.pnl(s) > 0).length;
    const m0 = new Date(); m0.setDate(1); m0.setHours(0, 0, 0, 0);
    const monthNet = sessions.filter(s => s.startedAt >= m0.getTime()).reduce((n, s) => n + reporting(s), 0);

    const row = (s, converted = false) => {
      const value = converted ? reporting(s) : this.pnl(s), cur = converted ? S.currency : s.cur;
      const source = converted && s.cur !== S.currency ? s.cur + ' → ' + S.currency : s.cur;
      return {
        id: s.id, stakes: this.stakeLabel(s), venue: s.venue,
        meta: this.when(s.startedAt) + ' · ' + this.shortDur((s.endedAt || Date.now()) - s.startedAt) + ' · ' + s.seats + '-max · ' + source,
        pnl: value === null ? '—' : this.moneyIn(value, cur, true), color: value === null ? 'var(--color-neutral-700)' : this.col(value),
        rate: value === null ? '—' : this.moneyIn(this.hours(s) > 0 ? value / this.hours(s) : 0, cur, true),
        onClick: () => this.openDetail(s.id),
      };
    };
    const sorted = st.sessions.slice().sort((a, b) => b.startedAt - a.startedAt);
    const valuedSorted = sessions.slice().sort((a, b) => b.startedAt - a.startedAt);
    const filtered = sorted.filter(s => st.filter === 'All' || (st.filter === 'Wins' ? this.pnl(s) > 0 : this.pnl(s) <= 0));
    const valuedFiltered = filtered.filter(s => reporting(s) !== null);
    const fNet = valuedFiltered.reduce((n, s) => n + reporting(s), 0);
    const spark = this.curve(sessions, 370, 72, reporting);
    const big = this.curve(sessions, 342, 150, reporting);

    // Keep native stakes in distinct currency groups; only results are converted.
    const groups = Object.create(null);
    sessions.forEach(s => {
      const k = s.cur + ' ' + this.stakeLabel(s);
      groups[k] ||= { label: k, n: 0, h: 0, net: 0, bb: s.bb * this.rate(s.cur, S.currency) };
      groups[k].n++; groups[k].h += this.hours(s); groups[k].net += reporting(s);
    });
    const byStake = Object.values(groups).sort((a, b) => b.bb - a.bb).map(g => ({
      label: g.label, n: g.n, hours: g.h.toFixed(1), net: this.money(g.net, true),
      rate: this.money(g.h > 0 ? g.net / g.h : 0, true), color: this.col(g.net),
    }));
    const best = sessions.slice().sort((a, b) => reporting(b) - reporting(a))[0];
    const worst = sessions.slice().sort((a, b) => reporting(a) - reporting(b))[0];
    const longest = sessions.slice().sort((a, b) => this.hours(b) - this.hours(a))[0];
    const venues = Object.create(null);
    sessions.forEach(s => { venues[s.venue] = (venues[s.venue] || 0) + reporting(s); });
    const topVenue = Object.keys(venues).sort((a, b) => venues[b] - venues[a])[0];
    const supers = best ? [
      { label: 'Best session', value: best.venue + ' · ' + this.when(best.startedAt), figure: this.money(reporting(best), true), color: this.col(reporting(best)) },
      { label: 'Worst session', value: worst.venue + ' · ' + this.when(worst.startedAt), figure: this.money(reporting(worst), true), color: this.col(reporting(worst)) },
      { label: 'Longest', value: longest.venue + ' · ' + longest.cur + ' ' + this.stakeLabel(longest), figure: this.shortDur(longest.endedAt - longest.startedAt), color: 'var(--color-text)' },
      { label: 'Top venue', value: topVenue, figure: this.money(venues[topVenue], true), color: this.col(venues[topVenue]) },
    ] : [];

    // Details always show the session's original currency and amounts.
    const ds = st.sessions.find(s => s.id === det);
    let d = null;
    if (ds) {
      const p = this.pnl(ds), h = this.hours(ds), nativeMoney = (n, sign) => this.moneyIn(n, ds.cur, sign);
      const lines = ds.buyIns.map((b, i) => ({ label: (i === 0 ? 'Buy-in' : 'Re-buy ' + i) + ' · ' + this.hm(b.at), value: '−' + nativeMoney(b.amount), color: 'var(--color-text)' }));
      lines.push({ label: 'Tips & rake', value: '−' + nativeMoney(ds.tips), color: 'var(--color-text)' });
      lines.push({ label: 'Chips off table', value: nativeMoney(ds.cashOut), color: 'var(--color-text)' });
      lines.push({ label: 'Net', value: nativeMoney(p, true), color: this.col(p) });
      d = {
        venue: ds.venue, cur: ds.cur, when: this.when(ds.startedAt), game: ds.game, stakes: this.stakeLabel(ds), seats: ds.seats,
        playType: domain.playLabel(ds), editPlayType: () => this.setState({ sheet: 'detailPlayType' }),
        pnl: nativeMoney(p, true), color: this.col(p),
        rate: nativeMoney(h > 0 ? p / h : 0, true), bbRate: domain.formatBB(domain.bigBlindStats([ds], S).perHour),
        lines,
        tiles: [
          { label: 'Duration', value: this.shortDur(ds.endedAt - ds.startedAt) },
          { label: 'Invested', value: nativeMoney(this.buyIn(ds)) },
          { label: 'Bullets', value: ds.buyIns.length },
          { label: 'City', value: ds.city },
        ],
        hasNotes: !!ds.notes, notes: ds.notes,
      };
    }

    // active
    const A = st.active;
    let a = null;
    if (A) {
      const inv = this.buyIn(A);
      a = {
        venue: A.venue, cur: A.cur, game: A.game, stakes: this.stakeLabel(A), seats: A.seats, startedAt: this.hm(A.startedAt), playType: domain.playLabel(A),
        invested: this.moneyIn(inv, A.cur), bbs: A.bb > 0 ? Math.round(inv / A.bb) : '—',
        buyIns: A.buyIns.map((b, i) => ({ label: i === 0 ? 'Buy-in' : 'Re-buy ' + i, at: this.hm(b.at), amount: this.moneyIn(b.amount, A.cur) })),
      };
    }
    const liveMoney = (n, sign) => this.moneyIn(n, A ? A.cur : S.currency, sign);
    const liveSymbol = this.symOf(A ? A.cur : S.currency);
    const elapsed = A ? st.now - A.startedAt : 0;
    const cashN = Number(st.out.cash) || 0, tipsN = Number(st.out.tips) || 0;
    const outNet = A ? cashN - this.buyIn(A) - tipsN : 0;
    const outH = A ? Math.max(elapsed / 3600000, 0.01) : 1;

    const pk = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'del'];
    const padKeys = pk.map((k) => ({ label: k === 'del' ? '\u232b' : k, onClick: () => this.pad(k) }));

    const sheetItems = (items, cur, apply) => items.map((it) => ({
      label: it.label, sub: it.sub || '',
      bg: it.value === cur ? 'color-mix(in srgb, var(--color-accent) 14%, transparent)' : 'transparent',
      fg: 'var(--color-text)',
      onClick: () => apply(it.value),
    }));
    const setDraft = (patch) => this.setState({ draft: Object.assign({}, st.draft, patch), sheet: null });
    const venueItems = this.mergeVenues(st.sessions).map(v => ({ label: v.name, sub: v.city, value: v.name }));
    domain.DEFAULT_VENUES.forEach(v => { if (!venueItems.some(x => x.value === v.name)) venueItems.push({ label: v.name, sub: v.city, value: v.name }); });
    const stakeItems = [...new Set([...this.mergeStakes(st.sessions), S.stakes, ...domain.DEFAULT_STAKES])].map(value => ({ label: value, value }));
    const gameItems = ['NLHE', 'PLO', 'PLO5', 'Mixed', 'LHE'].map((g) => ({ label: g, value: g }));
    const playItems = [{ label: 'Live', value: 'live', sub: S.liveHandsPerHour + ' hands/hour' }, { label: 'Online', value: 'online', sub: S.onlineHandsPerHour + ' hands/hour' }];
    const seatItems = [6, 8, 9].map((n) => ({ label: n + '-max', value: n }));
    const curItems = [
      { label: 'USD', sub: 'US Dollar', value: 'USD' }, { label: 'EUR', sub: 'Euro', value: 'EUR' },
      { label: 'GBP', sub: 'Pound', value: 'GBP' }, { label: 'CAD', sub: 'Canadian', value: 'CAD' },
      { label: 'AUD', sub: 'Australian', value: 'AUD' }, { label: 'HKD', sub: 'Hong Kong', value: 'HKD' },
    ];

    [...new Set([...st.sessions.map(s => s.cur), st.draft.cur, st.active?.cur, S.currency].filter(Boolean))].forEach(code => { if (!curItems.some(x => x.value === code)) curItems.push({ label: code, value: code }); });
    const sheets = {
      venue: { title: 'Venue', items: sheetItems(venueItems, st.draft.venue, (v) => setDraft({ venue: v, city: (venueItems.filter((x) => x.value === v)[0] || {}).sub })) },
      stakes: { title: 'Stakes', items: sheetItems(stakeItems, this.stakeLabel(st.draft), (v) => setDraft({ sb: Number(v.split('/')[0]), bb: Number(v.split('/')[1]) })) },
      game: { title: 'Game', items: sheetItems(gameItems, st.draft.game, (v) => setDraft({ game: v })) },
      playType: { title: 'Play type', items: sheetItems(playItems, domain.playType(st.draft), playType => setDraft({ playType })) },
      detailPlayType: { title: 'Play type', items: sheetItems(playItems, domain.playType(ds), playType => this.setState(st => ({
        sessions: st.sessions.map(s => s.id === ds?.id ? { ...s, playType } : s), sheet: null,
      }))) },
      seats: { title: 'Table size', items: sheetItems(seatItems, st.draft.seats, (v) => setDraft({ seats: v })) },
      rebuy: { title: 'Re-buy amount', items: (A ? [A.buyIns[0].amount, A.bb * 100, A.bb * 200, A.bb * 400] : []).filter((v, i, arr) => arr.indexOf(v) === i).map((v) => ({ label: this.moneyIn(v, A.cur), sub: Math.round(v / (A ? A.bb : 1)) + ' bb', bg: 'transparent', fg: 'var(--color-text)', onClick: () => this.rebuy(v) })) },
      sessionCurrency: { title: 'Session currency', items: sheetItems(curItems, st.draft.cur, cur => setDraft({ cur })) },
      currency: { title: 'Display currency', items: sheetItems(curItems, S.currency, (v) => this.setState({ settings: Object.assign({}, S, { currency: v }), sheet: null })) },
      defGame: { title: 'Default game', items: sheetItems(gameItems, S.game, (v) => this.updateDefault('game', v)) },
      defStakes: { title: 'Default stakes', items: sheetItems(stakeItems, S.stakes, (v) => this.updateDefault('stakes', v)) },
      defSeats: { title: 'Default table', items: sheetItems(seatItems, S.seats, (v) => this.updateDefault('seats', v)) },
    };
    sheets.accent = { title: 'Accent colour', items: sheetItems(domain.ACCENTS.map(v => ({ label: v[0].toUpperCase() + v.slice(1), value: v })), S.accent, v => this.setState({ settings: { ...S, accent: v }, sheet: null })) };
    sheets.pnl = { title: 'Profit & loss colours', items: sheetItems(['Mono', 'Signal'].map(v => ({ label: v, value: v, sub: v === 'Mono' ? 'Steel / ink' : 'Green / red' })), S.pnlColor, v => this.setState({ settings: { ...S, pnlColor: v }, sheet: null })) };
    const sheet = st.sheet ? sheets[st.sheet] : null;

    const last = this.recentSetup();
    const presets = [];
    if (last && Number(last.buyIn) > 0) presets.push({
      label: last.cur + ' ' + this.moneyIn(Number(last.buyIn), last.cur) + ' · ' + this.stakeLabel(last),
      sub: 'Repeat ' + last.venue,
      onClick: () => this.startSession(last),
    });
    const dsb = Number(S.stakes.split('/')[0]), dbb = Number(S.stakes.split('/')[1]);
    presets.push({
      label: st.draft.cur + ' ' + this.moneyIn(dbb * 100, st.draft.cur) + ' · ' + S.stakes, sub: 'Default ' + S.game + ' ' + S.seats + '-max',
      onClick: () => this.startSession({ sb: dsb, bb: dbb, game: S.game, seats: S.seats, buyIn: String(dbb * 100) }),
    });

    // import state
    const imp = st.imp;
    const impRows = (imp && imp.rows) || [];
    const impSameCur = !!imp && imp.code === S.currency;
    const impConvert = !!imp && imp.mode === 'convert' && !impSameCur;
    const impRate = imp ? this.rate(imp.code, S.currency) : 1;
    const impK = impConvert ? impRate : 1;
    const impCurCode = impConvert ? S.currency : (imp ? imp.code : S.currency);
    const dupeFlags = domain.duplicateFlags(impRows, st.sessions);
    const impDupes = dupeFlags.filter(Boolean).length;
    const included = impRows.filter((r, i) => !(imp && imp.skip && dupeFlags[i]));
    const impAdd = included.length;
    const impNet = included.reduce((n, r) => n + this.pnl(this.scale(r, impK)), 0);
    const impHours = included.reduce((n, r) => n + this.hours(r), 0);
    const fmtD = (t) => new Date(t).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    const impTimes = impRows.map((r) => r.startedAt);
    const impSpan = impRows.length ? fmtD(Math.min.apply(null, impTimes)) + ' \u2013 ' + fmtD(Math.max.apply(null, impTimes)) : '';
    const impVenues = impRows.reduce((acc, r) => (acc.indexOf(r.venue) < 0 ? acc.concat([r.venue]) : acc), []).length;
    const impList = impRows.map((r, i) => {
      const sc = this.scale(r, impK), p = this.pnl(sc);
      const dupe = dupeFlags[i], skipped = dupe && imp && imp.skip;
      return {
        stakes: sc.sb + '/' + sc.bb, venue: r.venue,
        meta: new Date(r.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' \u00b7 ' + this.shortDur(r.endedAt - r.startedAt) + ' \u00b7 ' + sc.buyIns.length + (sc.buyIns.length > 1 ? ' bullets' : ' bullet'),
        net: this.moneyIn(p, impCurCode, true), color: this.col(p),
        tag: skipped ? 'Skip' : dupe ? 'Dupe' : 'New',
        tagColor: dupe ? 'var(--color-neutral-700)' : 'var(--color-accent-700)',
        opacity: skipped ? 0.42 : 1,
      };
    });

    const tabDef = [
      { key: 'home', label: 'Home', path: 'M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z' },
      { key: 'log', label: 'Log', path: 'M4 6h16M4 12h16M4 18h10' },
    ];
    const tabDef2 = [
      { key: 'stats', label: 'Stats', path: 'M4 20h16M7 17V9M12 17V5M17 17v-6' },
      { key: 'settings', label: 'Set', path: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2-1.2L14.2 3H9.8l-.4 2.7a7 7 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2 1.2l.4 2.7h4.4l.4-2.7a7 7 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z' },
    ];
    const mkTab = (t) => ({
      label: t.label, path: t.path,
      color: (onTab && st.tab === t.key) ? 'var(--color-accent)' : 'var(--color-neutral-700)',
      onClick: () => this.go(t.key), active: onTab && st.tab === t.key,
    });


    return {
      isHome: onTab && st.tab === 'home', isLog: onTab && st.tab === 'log',
      isStats: onTab && st.tab === 'stats', isSettings: onTab && st.tab === 'settings',
      isDetail: !!d && !flow, isNew: flow === 'new', isActive: flow === 'active' && !!A, isCashOut: flow === 'cashout' && !!A,
      showTabs: !flow,
      tabs: tabDef.map(mkTab).concat(tabDef2.map(mkTab)),
      plusPath: 'M12 5v14M5 12h14',
      plusLabel: A ? 'Live' : 'New',
      onPlus: () => this.openNew(),

      dateLine: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
      currency: S.currency, sessionCount: st.sessions.length,
      conversionNote, missingRateNote,
      rateNotes: foreign.map(cur => this.rate(cur, S.currency) === null ? cur + " → " + S.currency + ": unavailable" : "1 " + cur + " = " + this.rate(cur, S.currency) + " " + S.currency),
      bankrollText: !sessions.length && excluded.length ? '—' : this.money(net, true), monthText: this.money(monthNet, true), monthColor: this.col(monthNet),
      hourlyText: this.money(hrs > 0 ? net / hrs : 0, true), hourlyColor: this.col(net),
      hoursText: hrs.toFixed(1), winRateText: sessions.length ? Math.round((wins / sessions.length) * 100) + '%' : '—',
      avgText: this.money(sessions.length ? net / sessions.length : 0, true), avgColor: this.col(net),
      sparkLine: spark.line, sparkArea: spark.area, sparkZero: spark.zero,
      hasActive: !!A, noActive: !A, timerText: this.clock(elapsed),
      recent: sorted.slice(0, 4).map(s => row(s, true)),
      goNew: () => this.openNew(),
      goActive: () => this.setState({ flow: 'active', detailId: null }),
      goLog: () => this.go('log'), goBack: () => this.setState({ detailId: null }),

      filters: ['All', 'Wins', 'Losses'].map((f) => ({
        label: f, bg: st.filter === f ? 'var(--color-accent)' : 'transparent',
        fg: st.filter === f ? 'var(--color-bg)' : 'var(--color-text)',
        onClick: () => this.setState({ filter: f }),
      })),
      logRows: filtered.map(s => row(s)), logCount: filtered.length,
      logNet: !valuedFiltered.length && filtered.length ? '—' : this.money(fNet, true), logNetColor: this.col(fNet),
      logHours: filtered.reduce((n, s) => n + this.hours(s), 0).toFixed(1),

      curveLine: big.line, curveArea: big.area, curveZero: big.zero,
      curveSpan: sessions.length + ' sessions \u00b7 ' + hrs.toFixed(0) + 'h',
      curveFirst: valuedSorted.length ? this.when(valuedSorted[valuedSorted.length - 1].startedAt) : '—',
      curvePeak: this.money(big.peak, true), curveLast: 'Now',
      byStake, supers,
      bbPer100: domain.formatBB(bbStats.per100), bbPerHour: domain.formatBB(bbStats.perHour), bbColor: this.col(bbStats.bbWon),
      bbSummary: bbStats.count + ' completed session' + (bbStats.count === 1 ? '' : 's') + ' · all currencies',
      bbExcluded: bbStats.excluded ? bbStats.excluded + ' session' + (bbStats.excluded === 1 ? '' : 's') + ' excluded: a positive duration and big blind are required.' : '',
      handEstimates: S.liveHandsPerHour + ' live / ' + S.onlineHandsPerHour + ' online hands per hour',
      editHandEstimates: () => this.ask('handEstimates'),

      d, a, onDelete: () => this.ask('delete'),

      showQuick: this.state.settings.showQuickStart !== false,
      presets,
      buyInText: this.moneyIn(Number(st.draft.buyIn) || 0, st.draft.cur),
      draftHelp: last ? 'Using your last session setup. Tap any row to change it.' : 'Choose your venue, stakes and session currency.',
      draftRows: [
        { label: 'Session currency', value: st.draft.cur, onClick: () => this.setState({ sheet: 'sessionCurrency' }) },
        { label: 'Play type', value: domain.playLabel(st.draft), onClick: () => this.setState({ sheet: 'playType' }) },
        { label: 'Venue', value: st.draft.venue, onClick: () => this.setState({ sheet: 'venue' }) },
        { label: 'Stakes', value: this.stakeLabel(st.draft), onClick: () => this.setState({ sheet: 'stakes' }) },
        { label: 'Game', value: st.draft.game, onClick: () => this.setState({ sheet: 'game' }) },
        { label: 'Table', value: st.draft.seats + '-max', onClick: () => this.setState({ sheet: 'seats' }) },
      ],
      startDisabled: !Number(st.draft.buyIn), startOpacity: Number(st.draft.buyIn) ? 1 : 0.45,
      onStart: () => this.startSession(), onCancelNew: () => this.setState({ flow: null }),
      padKeys,

      onOpenRebuy: () => this.setState({ sheet: 'rebuy' }),
      goCashOut: () => this.setState({ flow: 'cashout', padTarget: 'cash' }),
      onAbandon: () => this.ask('discard'),

      cashText: st.out.cash ? liveSymbol + Number(st.out.cash).toLocaleString('en-US') : liveSymbol + '0',
      tipsText: st.out.tips ? liveSymbol + Number(st.out.tips).toLocaleString('en-US') : liveSymbol + '0',
      cashBorder: st.padTarget === 'cash' ? 'var(--color-accent)' : 'var(--color-divider)',
      tipsBorder: st.padTarget === 'tips' ? 'var(--color-accent)' : 'var(--color-divider)',
      focusCash: () => this.setState({ padTarget: 'cash' }), focusTips: () => this.setState({ padTarget: 'tips' }),
      outNet: liveMoney(outNet, true), outColor: this.col(outNet),
      outDur: this.shortDur(elapsed), outRate: elapsed < 300000 ? '\u2014' : liveMoney(outNet / outH, true),
      outMath: A ? liveMoney(cashN) + ' off table \u2212 ' + liveMoney(this.buyIn(A)) + ' in \u2212 ' + liveMoney(tipsN) + ' tips' : '',
      confirmOpacity: 1,
      onConfirm: () => this.book(),

      setRows: [
        { label: 'Display currency', value: S.currency, onClick: () => this.setState({ sheet: 'currency' }) },
        { label: 'Hands per hour', value: S.liveHandsPerHour + ' live · ' + S.onlineHandsPerHour + ' online', onClick: () => this.ask('handEstimates') },
        { label: 'Default game', value: S.game, onClick: () => this.setState({ sheet: 'defGame' }) },
        { label: 'Default stakes', value: S.stakes, onClick: () => this.setState({ sheet: 'defStakes' }) },
        { label: 'Default table', value: S.seats + '-max', onClick: () => this.setState({ sheet: 'defSeats' }) },
        { label: 'Quick-start presets', value: this.state.settings.showQuickStart === false ? 'Off' : 'On', onClick: () => this.setState({ settings: { ...S, showQuickStart: !S.showQuickStart } }) },
        { label: 'Accent colour', value: S.accent[0].toUpperCase() + S.accent.slice(1), onClick: () => this.setState({ sheet: 'accent' }) },
        { label: 'Profit & loss colours', value: S.pnlColor, onClick: () => this.setState({ sheet: 'pnl' }) },
      ],
      hasSamples: st.sessions.some(s => s.demo), removeSamples: () => this.ask('removeSamples'),
      backHome: () => this.go('home'),
      hasSessions: sessions.length > 0, noSessions: sessions.length === 0,
      emptyTitle: st.sessions.length ? 'No convertible sessions' : 'Nothing logged yet',
      emptyLine: excluded.length
        ? 'Choose a supported display currency in Settings. Your sessions remain in the log.'
        : 'Start one at the table, or bring your history across from analytics7.',
      noLogRows: filtered.length === 0,
      logEmptyTitle: st.sessions.length === 0 ? 'Nothing logged yet' : 'No ' + st.filter.toLowerCase() + ' yet',
      logEmptyLine: st.sessions.length === 0
        ? 'Import or start a session to fill your log.'
        : 'Your sessions are in one of the other two filters.',
      onExport: () => this.exportCsv(),
      onSeed: () => this.ask('sample'),
      onReset: () => this.ask('erase'),

      isImport: flow === 'import',
      impStep: imp ? (imp.step === 'pick' ? 1 : imp.step === 'map' ? 2 : 3) : 1,
      impPick: !!imp && imp.step === 'pick', impMap: !!imp && imp.step === 'map', impReview: !!imp && imp.step === 'review',
      impHasError: !!(imp && imp.error), impError: (imp && imp.error) || '',
      openImport: () => this.setState({ flow: 'import', imp: { step: 'pick' }, detailId: null }),
      impCancel: () => this.setState({ flow: null, imp: null }),
      impBack: () => this.setState({ imp: Object.assign({}, imp, { step: 'map' }) }),
      impToReview: () => this.setState({ imp: Object.assign({}, imp, { step: 'review' }) }),
      impToggleSkip: () => this.setState({ imp: Object.assign({}, imp, { skip: !imp.skip }) }),
      impCommit: () => this.commitA7(),
      onPickFile: (e) => {
        const input = e.target;
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        input.value = '';
        if (f.size > 10 * 1024 * 1024) { this.loadA7Error('That file is too large. Pick an XML export smaller than 10 MB.'); return; }
        const rd = new FileReader();
        rd.onload = () => this.loadA7(String(rd.result), f.name);
        rd.onerror = () => this.setState({ imp: { step: 'pick', error: 'That file could not be opened.' } });
        rd.readAsText(f);
      },
      onUseSample: () => {
        fetch(import.meta.env.BASE_URL + 'sample-analytics7.xml').then((r) => { if (!r.ok) throw new Error('Sample unavailable'); return r.text(); })
          .then((t) => this.loadA7(t, 'xbenben-demo.xml'))
          .catch(() => this.setState({ imp: { step: 'pick', error: 'The sample export could not be loaded.' } }));
      },
      impMapRows: [
        { from: 'cash @startdate / @enddate', to: 'Start / end', color: 'var(--color-text)' },
        { from: 'cash @blinds', to: 'Stakes', color: 'var(--color-text)' },
        { from: 'cash @location', to: 'Venue', color: 'var(--color-text)' },
        { from: 'cash @tablesize', to: 'Table size', color: 'var(--color-text)' },
        { from: 'cash @variant / @limit', to: 'Game', color: 'var(--color-text)' },
        { from: 'result > buyin[]', to: 'Buy-ins & re-buys', color: 'var(--color-text)' },
        { from: 'result @chipcount', to: 'Chips off table', color: 'var(--color-text)' },
        { from: 'result @tips', to: 'Tips & rake', color: 'var(--color-text)' },
        { from: 'cash @comments', to: 'Notes', color: 'var(--color-text)' },
        { from: 'handHistories, notes', to: 'Not imported', color: 'var(--color-neutral-700)' },
      ],
      impName: imp ? imp.name : '', impCount: impRows.length,
      impSpan: impSpan, impBank: imp ? imp.bank : '', impCode: imp ? imp.code : '',
      impVenues: impVenues,
      impModes: !imp ? [] : (impSameCur ? [
        { label: 'Keep ' + imp.code, sub: 'Keep original session amounts · no conversion needed', bg: 'color-mix(in srgb, var(--color-accent) 12%, transparent)', dot: 'var(--color-accent)', onClick: () => this.setState({ imp: Object.assign({}, imp, { mode: 'keep' }) }) },
      ] : [
        { label: 'Keep ' + imp.code, sub: 'Keep original amounts · Home and Stats display in ' + S.currency, bg: !impConvert ? 'color-mix(in srgb, var(--color-accent) 12%, transparent)' : 'transparent', dot: !impConvert ? 'var(--color-accent)' : 'transparent', onClick: () => this.setState({ imp: Object.assign({}, imp, { mode: 'keep' }) }) },
        { label: 'Convert to ' + S.currency, sub: 'At 1 ' + imp.code + ' = ' + impRate + ' ' + S.currency + ' \u00b7 amounts and stakes rescaled', bg: impConvert ? 'color-mix(in srgb, var(--color-accent) 12%, transparent)' : 'transparent', dot: impConvert ? 'var(--color-accent)' : 'transparent', onClick: () => this.setState({ imp: Object.assign({}, imp, { mode: 'convert' }) }) },
      ]),
      impCanConvert: !!impRate,
      impAdd, cashFocused: st.padTarget === 'cash',
      impDupeLine: impDupes + ' of ' + impRows.length + ' already in your log',
      skipLabel: imp && imp.skip ? 'Skipping' : 'Importing',
      skipBg: imp && imp.skip ? 'var(--color-accent)' : 'transparent',
      skipFg: imp && imp.skip ? 'var(--color-bg)' : 'var(--color-accent-700)',
      impRows: impList,
      impNet: this.moneyIn(impNet, impCurCode, true), impNetColor: this.col(impNet),
      impHours: impHours.toFixed(1),
      impAddLine: impAdd + ' to add \u00b7 ' + (impRows.length - impAdd) + ' skipped',
      impCommitLabel: 'Import ' + impAdd + ' sessions',

      sheetAdd: ['venue', 'stakes', 'defStakes'].includes(st.sheet),
      addPickerItem: () => this.setState({ modal: st.sheet === 'venue' ? 'venue' : 'stakes', returnSheet: st.sheet, sheet: null }),
      sheetOpen: !!sheet, sheetTitle: sheet ? sheet.title : '', sheetItems: sheet ? sheet.items : [],
      closeSheet: () => this.setState({ sheet: null }), stop: (e) => e.stopPropagation(),
      toastOpen: !!st.toast, toast: st.toast || '',
    };
  }
  setupFrom(s) { return domain.setupFrom(s); }
  recentSetup() {
    if (this.state.lastSetup) return this.state.lastSetup;
    const last = domain.latestSession(this.state.sessions);
    return last ? this.setupFrom(last) : null;
  }
  openNew() {
    const { active, settings: S, draft } = this.state;
    if (active) { this.setState({ flow: 'active', detailId: null }); return; }
    const [sb, bb] = S.stakes.split('/').map(Number);
    const setup = this.recentSetup() || { ...draft, sb, bb, game: S.game, seats: S.seats };
    this.setState({ flow: 'new', detailId: null, padTarget: 'buyIn', draft: { ...setup, buyIn: '' } });
  }
  updateDefault(key, value) {
    this.setState(st => ({ settings: { ...st.settings, [key]: value }, sheet: null }));
  }
  mergeVenues(sessions) {
    const list = [];
    [this.state.lastSetup, ...sessions.slice().sort((a, b) => b.startedAt - a.startedAt), this.state.draft, ...this.state.venues.map(v => ({ venue: v.name, city: v.city }))].filter(Boolean).forEach(s => { if (s.venue && !list.some(v => v.name === s.venue)) list.push({ name: s.venue, city: s.city || '' }); });
    return list;
  }
  mergeStakes(sessions) {
    return [...new Set([this.state.lastSetup, this.state.draft, ...sessions.slice().sort((a, b) => b.startedAt - a.startedAt)].filter(s => s?.bb > 0).map(s => this.stakeLabel(s)).concat(this.state.stakes))];
  }
  loadA7Error(error) { this.setState({ imp: { step: 'pick', error } }); }
  ask(modal) { this.setState({ modal, sheet: null }); }
  confirmAction() {
    const action = this.state.modal;
    if (action === 'delete') this.setState(st => ({ sessions: st.sessions.filter(s => s.id !== st.detailId), detailId: null }));
    if (action === 'discard') this.setState({ active: null, out: { cash: '', tips: '' }, flow: null, tab: 'home' });
    if (action === 'erase') this.setState({ sessions: [], active: null, out: { cash: '', tips: '' }, flow: null, detailId: null });
    if (action === 'removeSamples') this.setState(st => ({ sessions: st.sessions.filter(s => !s.demo) }));
    if (action === 'sample') {
      const sample = this.seed(Date.now(), 86400000, 3600000).map(s => ({ ...s, id: 'demo-' + s.id, demo: true }));
      this.setState(st => ({ sessions: [...sample, ...st.sessions.filter(s => !s.demo)], settings: { ...st.settings, currency: 'USD' }, draft: st.lastSetup ? st.draft : { ...this.setupFrom(sample[0]), buyIn: '' } }));
    }
    if (action === 'resetStorage') {
      if (this.state.recoveryRaw && !this.state.recoveryDownloaded) return;
      try { localStorage.removeItem(STORAGE_KEY); }
      catch { this.say('Storage is still unavailable.'); return; }
      this.setState({ ...freshLedger(), recoveryRaw: null, storageError: null, flow: null, detailId: null, tab: 'home' });
    }
    this.setState({ modal: null });
    this.say({ delete: 'Session deleted', discard: 'Live session discarded', erase: 'All sessions erased', sample: 'Sample log restored', removeSamples: 'Sample log removed', resetStorage: 'Storage reset' }[action]);
  }
  exportCsv() {
    const list = this.state.sessions.slice().sort((a, b) => b.startedAt - a.startedAt);
    domain.download(domain.csv(list), 'xbenben-sessions-' + new Date().toISOString().slice(0, 10) + '.csv', 'text/csv;charset=utf-8');
    this.say(list.length + ' rows exported');
  }
  recoveryDownload() {
    domain.download(this.state.recoveryRaw || JSON.stringify(this.state, null, 2), 'xbenben-recovery.json', 'application/json');
    this.setState({ recoveryDownloaded: true });
  }
  requestStorage() {
    if (navigator.storage?.persist) navigator.storage.persist().then(granted => this.setState({ durableStorage: granted ? 'Persistent storage granted' : 'Browser-managed storage · keep regular backups' })).catch(() => this.setState({ durableStorage: 'Browser-managed storage · keep regular backups' }));
  }
  async prepareBackup() {
    this.requestStorage();
    this.setState({ modal: 'backup', preparedBackup: null, backupError: null });
    try {
      const preparedBackup = await createBackup(this.state);
      if (this.state.modal === 'backup') this.setState({ preparedBackup });
    } catch (error) { this.setState({ backupError: error.message }); }
  }
  async saveBackup(useShare) {
    const backup = this.state.preparedBackup; if (!backup) return;
    try {
      // An explicit second tap retains iOS share-sheet user activation.
      if (useShare) {
        const file = new File([backup.text], backup.name, { type: 'application/json' });
        await navigator.share({ files: [file], title: 'xbenben backup' });
      } else domain.download(backup.text, backup.name, 'application/json');
      this.setState({ lastBackupAt: backup.envelope.createdAt, modal: null, preparedBackup: null });
      this.say('Backup file created');
    } catch (error) {
      if (error.name !== 'AbortError') this.setState({ backupError: 'Sharing was unavailable. Use Download backup, then save it in Files.' });
    }
  }
  async readBackup(event) {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    this.setState({ modal: 'restore', restoreBackup: null, backupError: null });
    if (file.size > 20 * 1024 * 1024) { this.setState({ backupError: 'That backup is too large. Choose a file smaller than 20 MB.' }); return; }
    try {
      const backup = await parseBackup(await file.text());
      if (this.state.modal === 'restore') this.setState({ restoreBackup: backup });
    } catch (error) { this.setState({ backupError: error.message || 'That backup could not be opened. Your data has not changed.' }); }
  }
  restoreBackup() {
    const backup = this.state.restoreBackup; if (!backup) return;
    const restored = normalizeSaved(backup.ledger);
    // Commit the complete snapshot atomically before replacing the current view.
    try { saveLedger(restored); }
    catch { this.setState({ backupError: 'The backup could not be saved on this device. Free some storage and try again. Your current ledger is unchanged.' }); return; }
    this.setState({ ...restored, modal: null, restoreBackup: null, backupError: null, storageError: null, recoveryRaw: null,
      now: Date.now(), flow: restored.active ? 'active' : null, detailId: null, tab: 'home', sheet: null, imp: null });
    this.say('xbenben restored from backup');
  }
  render() {
    const v = this.renderVals();
    v.controller = this;
    if (!v.impCanConvert) v.impModes = v.impModes.filter(m => !m.label.startsWith('Convert'));
    return <AppUpdates canReload={() => !this.state.storageError}><main className="ledger-shell">
      <StorageNotice controller={this} />
      <LedgerView {...v} />
      <Dialogs controller={this} />
    </main></AppUpdates>;
  }

}
