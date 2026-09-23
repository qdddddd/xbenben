import { useEffect, useId, useRef, useState } from 'react';
import { backupSummary } from './backup.js';

function Modal({ title, onClose, children, sheet = false }) {
  const ref = useRef(null), titleId = useId();
  useEffect(() => {
    const el = ref.current;
    const trigger = document.activeElement;
    el.showModal();
    return () => { if (el.open) el.close(); if (trigger?.isConnected) trigger.focus(); };
  }, []);
  return <dialog ref={ref} className={sheet ? 'ledger-dialog sheet' : 'ledger-dialog'} aria-labelledby={titleId}
    onKeyDown={e => {
      if (e.key !== 'Tab') return;
      const controls = Array.from(e.currentTarget.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]'))
        .filter(el => el.getClientRects().length);
      const first = controls[0], last = controls.at(-1);
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }}
    onCancel={e => { e.preventDefault(); onClose(); }}
    onClick={e => { if (e.target === e.currentTarget) { const r = e.currentTarget.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) onClose(); } }}>
    <header className="dialog-heading"><h2 id={titleId}>{title}</h2>
      <button type="button" className="dialog-close" onClick={onClose}>Close</button>
    </header>
    {children}
  </dialog>;
}

export function Sheet({ v }) {
  if (!v.sheetOpen) return null;
  return <Modal title={v.sheetTitle} sheet onClose={v.closeSheet}>
    <div className="sheet-options">
      {v.sheetItems.map((it, i) => <button type="button" key={it.label + i} className="sheet-option"
        style={{ background: it.bg, color: it.fg }} onClick={it.onClick}>
        <span>{it.label}</span><small>{it.sub}</small>
      </button>)}
      {v.sheetAdd && <button type="button" className="sheet-option add-option" onClick={v.addPickerItem}>+ Add {v.sheetTitle.toLowerCase().includes('stake') ? 'stakes' : 'venue'}</button>}
    </div>
  </Modal>;
}

const confirmations = {
  delete: ['Delete session?', 'This permanently removes this session from your log and recalculates your totals.', 'Delete session'],
  discard: ['Discard live session?', 'The running session and its buy-ins will be removed. It will not be booked in your log.', 'Discard session'],
  erase: ['Erase all sessions?', 'This permanently removes every session in every currency, including the running session. Export any log you want to keep first.', 'Erase all sessions'],
  sample: ['Restore sample log?', 'Add or refresh six example USD sessions and switch the ledger to USD. Your personal sessions, imports and running session stay intact. Remove the examples separately when you are done.', 'Restore sample log'],
  removeSamples: ['Remove sample log?', 'Remove only the six example sessions. Your personal sessions and imports stay in your log.', 'Remove sample log'],
  resetStorage: ['Reset local storage?', 'Start with an empty ledger after saving your recovery copy. This only resets xbenben’s data in this browser.', 'Reset storage'],
};

function PickerForm({ controller, kind }) {
  const [error, setError] = useState('');
  const close = () => controller.setState({ modal: null, sheet: controller.state.returnSheet });
  const submit = e => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    if (kind === 'venue') {
      const name = String(data.get('name')).trim(), city = String(data.get('city')).trim();
      if (!name) { setError('Enter a venue name.'); return; }
      controller.setState(st => ({ venues: [...st.venues.filter(v => v.name !== name), { name, city }],
        draft: { ...st.draft, venue: name, city }, modal: null, sheet: null }));
    } else {
      const sb = Number(data.get('sb')), bb = Number(data.get('bb'));
      if (!Number.isFinite(sb) || !Number.isFinite(bb) || sb < 0 || bb <= 0 || sb > bb || bb > 1000000) { setError('Enter valid blinds: big blind must be positive and at least the small blind.'); return; }
      const stakes = sb + '/' + bb, isDefault = controller.state.returnSheet === 'defStakes';
      controller.setState(st => ({ stakes: [...new Set([...st.stakes, stakes])], draft: { ...st.draft, sb, bb },
        settings: isDefault ? { ...st.settings, stakes } : st.settings, modal: null, sheet: null }));
    }
  };
  return <Modal title={'Add ' + (kind === 'venue' ? 'venue' : 'stakes')} onClose={close}>
    <form onSubmit={submit} className="picker-form">
      {kind === 'venue' ? <>
        <label>Venue name<input autoFocus required name="name" maxLength={80} autoComplete="off" /></label>
        <label>City (optional)<input name="city" maxLength={80} autoComplete="off" /></label>
      </> : <>
        <label>Small blind<input autoFocus required name="sb" type="number" inputMode="decimal" min="0" max="1000000" step="0.01" /></label>
        <label>Big blind<input required name="bb" type="number" inputMode="decimal" min="0.01" max="1000000" step="0.01" /></label>
      </>}
      {error && <p role="alert">{error}</p>}
      <div className="dialog-actions"><button type="button" className="btn btn-secondary" onClick={close}>Cancel</button>
        <button type="submit" className="btn btn-primary">Save {kind === 'venue' ? 'venue' : 'stakes'}</button></div>
    </form>
  </Modal>;
}

export function Dialogs({ controller }) {
  const { modal } = controller.state;
  if (!modal) return null;
  if (modal === 'backup' || modal === 'restore') return <BackupDialog controller={controller} />;
  if (['venue', 'stakes'].includes(modal)) return <PickerForm key={modal} controller={controller} kind={modal} />;
  const [title, copy, action] = confirmations[modal];
  const close = () => controller.setState({ modal: null });
  return <Modal title={title} onClose={close}>
    <p className="confirm-copy">{copy}</p>
    <div className="dialog-actions">
      <button type="button" autoFocus className="btn btn-secondary" onClick={close}>Cancel</button>
      <button type="button" className="btn btn-primary" disabled={modal === 'resetStorage' && !!controller.state.recoveryRaw && !controller.state.recoveryDownloaded}
        onClick={() => controller.confirmAction()}>{action}</button>
    </div>
  </Modal>;
}

export function StorageNotice({ controller }) {
  const { storageError, recoveryRaw, recoveryDownloaded } = controller.state;
  if (!storageError) return null;
  return <aside className="storage-notice" role="alert">
    <p>{storageError}</p>
    <button className="btn btn-secondary" onClick={() => controller.recoveryDownload()}>Download recovery copy</button>
    {recoveryRaw && recoveryDownloaded && <button className="btn btn-secondary" onClick={() => controller.ask('resetStorage')}>Reset storage</button>}
  </aside>;
}

export function BackupControls({ controller }) {
  const s = controller.state;
  return <section className="backup-controls" aria-label="Backup and restore">
    <div className="section-label">Backup & restore</div>
    <button className="btn btn-secondary btn-block data-button" onClick={() => controller.prepareBackup()}>Back up to iCloud / file</button>
    <label className="btn btn-secondary btn-block data-button backup-picker">Restore backup
      <input type="file" accept=".json,application/json" className="file-input" aria-label="Restore xbenben backup" onChange={e => controller.readBackup(e)} />
    </label>
    <p className="backup-meta">Last backup: {s.lastBackupAt ? new Date(s.lastBackupAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Never'}</p>
    <p className="backup-meta">{s.durableStorage || 'Browser-managed storage · keep regular backups'}</p>
  </section>;
}

export function ConversionNote({ v }) {
  if (!v.conversionNote && !v.missingRateNote) return null;
  return <aside className="conversion-note" aria-label="Currency conversion">
    {v.conversionNote && <p>{v.conversionNote}</p>}
    {v.missingRateNote && <p role="status">{v.missingRateNote}</p>}
  </aside>;
}

function BackupDialog({ controller }) {
  const s = controller.state, restore = s.modal === 'restore';
  const backup = restore ? s.restoreBackup : s.preparedBackup?.envelope;
  const summary = backup ? backupSummary(backup.ledger) : null;
  let canShare = false;
  if (!restore && s.preparedBackup && navigator.canShare && navigator.share) {
    try { canShare = navigator.canShare({ files: [new File([s.preparedBackup.text], s.preparedBackup.name, { type: 'application/json' })] }); } catch { /* Download remains available. */ }
  }
  const close = () => controller.setState({ modal: null, restoreBackup: null, preparedBackup: null, backupError: null });
  return <Modal title={restore ? 'Review backup' : 'Back up xbenben'} onClose={close}>
    {s.backupError && <p role="alert" className="confirm-copy">{s.backupError}</p>}
    {!backup && !s.backupError && <p role="status" className="confirm-copy">{restore ? 'Reading backup…' : 'Preparing backup…'}</p>}
    {summary && <>
      <dl className="backup-summary"><dt>Created</dt><dd>{new Date(backup.createdAt).toLocaleString('en-US')}</dd>
        <dt>Sessions</dt><dd>{summary.sessions} · {summary.currencies}</dd><dt>Live session</dt><dd>{summary.live}</dd>
        <dt>Saved choices</dt><dd>{summary.venues} venues · {summary.stakes} stakes</dd>
        <dt>Settings</dt><dd>{backup.ledger.settings.currency} · {backup.ledger.settings.game} · {backup.ledger.settings.stakes}</dd></dl>
      <p className="confirm-copy">{restore ? 'Restore replaces the entire current ledger, including its running session, settings and saved choices. Save a backup of this device first if you want to keep both.' : 'On iPhone, choose Save to Files, then iCloud Drive. A backup includes every currency, settings and the running session. Keep it somewhere private.'}</p>
      <div className="dialog-actions"><button className="btn btn-secondary" autoFocus onClick={close}>Cancel</button>
        {restore ? <button className="btn btn-primary" onClick={() => controller.restoreBackup()}>Replace ledger & restore</button> : <>
          <button className="btn btn-secondary" onClick={() => controller.saveBackup(false)}>Download backup</button>
          {canShare && <button className="btn btn-primary" onClick={() => controller.saveBackup(true)}>Save to Files / share</button>}
        </>}
      </div>
    </>}
  </Modal>;
}
