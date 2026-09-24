import { createContext, useContext, useRef, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const UpdateContext = createContext(null);
const timeoutMs = 20000;

function withTimeout(promise) {
  let timer;
  return Promise.race([promise, new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('Update timed out')), timeoutMs);
  })]).finally(() => clearTimeout(timer));
}

function waitForState(worker, states) {
  return new Promise((resolve, reject) => {
    const finish = error => {
      clearTimeout(timer); worker.removeEventListener('statechange', check);
      if (error) reject(error); else resolve();
    };
    const check = () => {
      if (worker.state === 'redundant') finish(new Error('Update failed'));
      else if (states.includes(worker.state)) finish();
    };
    const timer = setTimeout(() => finish(new Error('Update timed out')), timeoutMs);
    worker.addEventListener('statechange', check); check();
  });
}

export function AppUpdates({ canReload, children }) {
  const registration = useRef(null), inFlight = useRef(false), pendingWorker = useRef(null);
  const [phase, setPhase] = useState('idle'), [message, setMessage] = useState('');
  const [dismissed, setDismissed] = useState(false);
  const { needRefresh: [ready] } = useRegisterSW({
    onRegisteredSW(_url, value) { registration.current = value; },
    onNeedRefresh() {
      setDismissed(false);
      if (!inFlight.current) { setPhase('idle'); setMessage(''); }
    },
    // Activation and reload are awaited below, including updates whose prompt was dismissed.
    onNeedReload() {},
  });
  const checkForUpdates = async () => {
    if (inFlight.current) return;
    inFlight.current = true; setPhase('checking'); setMessage('Checking for updates…');
    try {
      if (!canReload()) throw new Error('unsaved');
      if (pendingWorker.current?.state === 'activated') {
        setPhase('reloading'); window.location.reload(); return;
      }
      if (!('serviceWorker' in navigator)) throw new Error('unavailable');
      const reg = registration.current || await navigator.serviceWorker.getRegistration(import.meta.env.BASE_URL);
      if (!reg) throw new Error('unavailable');
      let worker = reg.waiting;
      if (navigator.onLine) {
        await withTimeout(reg.update());
        if (reg.installing) {
          setPhase('downloading'); setMessage('Downloading update…');
          await waitForState(reg.installing, ['installed', 'activating', 'activated']);
        }
        worker = reg.waiting;
      } else if (!worker) throw new Error('offline');
      if (!worker) {
        setPhase('current'); setMessage('You’re up to date.'); return;
      }
      if (!canReload()) throw new Error('unsaved');
      setPhase('reloading'); setMessage('Reloading with the latest version…');
      pendingWorker.current = worker;
      const activated = waitForState(worker, ['activated']);
      worker.postMessage({ type: 'SKIP_WAITING' });
      await activated;
      if (!canReload()) throw new Error('unsaved');
      window.location.reload();
    } catch (error) {
      setPhase('error');
      setMessage(error.message === 'unsaved' ? 'Your latest changes aren’t saved. Back up your log before updating.'
        : error.message === 'offline' || !navigator.onLine ? 'You’re offline. Connect to the internet and try again.'
          : 'Couldn’t update the app. Please try again.');
    } finally { inFlight.current = false; }
  };
  const busy = ['checking', 'downloading', 'reloading'].includes(phase);
  const status = busy || phase === 'error' ? message : ready ? 'An update is ready to install.'
    : message || 'Check for the latest version and reload if an update is available.';
  return <UpdateContext.Provider value={{ checkForUpdates, busy, phase, status }}>
    {children}
    {ready && !dismissed && !busy && <aside className="update-notice" role="status">
      <span>{phase === 'error' ? message : 'An xbenben update is ready. Reload when you’re ready; your session stays saved.'}</span>
      <button className="btn btn-secondary" onClick={() => setDismissed(true)}>Later</button>
      <button className="btn btn-primary" onClick={checkForUpdates}>Reload</button>
    </aside>}
  </UpdateContext.Provider>;
}

export function UpdateSettings() {
  const { checkForUpdates, busy, phase, status } = useContext(UpdateContext);
  return <section className="app-updates" aria-label="App updates">
    <div className="section-label">App updates</div>
    <button type="button" className="btn btn-secondary btn-block data-button" disabled={busy} onClick={checkForUpdates}>
      {busy ? phase === 'checking' ? 'Checking…' : 'Updating…' : 'Update app'}
    </button>
    <p className="update-status" role="status" aria-live="polite">{status}</p>
  </section>;
}
