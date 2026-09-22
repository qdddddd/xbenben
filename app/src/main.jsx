import React, { Component } from 'react';
import { createRoot } from 'react-dom/client';
import { useRegisterSW } from 'virtual:pwa-register/react';
import '@fontsource/barlow/latin-400.css';
import '@fontsource/barlow/latin-500.css';
import '@fontsource/barlow/latin-700.css';
import '@fontsource/barlow-condensed/latin-400.css';
import '@fontsource/barlow-condensed/latin-600.css';
import './industry.css';
import './design-measures.css';
import './app.css';
import Ledger from './Ledger.jsx';

class AppBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <main className="error-screen"><h1>xbenben could not open</h1><p>Your saved log has not been erased. Reload to try again.</p><button className="btn btn-primary" onClick={() => location.reload()}>Reload xbenben</button></main> : this.props.children;
  }
}
function UpdateNotice() {
  const { needRefresh: [refresh, setRefresh], updateServiceWorker } = useRegisterSW();
  if (!refresh) return null;
  return <aside className="update-notice" role="status"><span>An xbenben update is ready. Reload when you’re ready; your session stays saved.</span>
    <button className="btn btn-secondary" onClick={() => setRefresh(false)}>Later</button>
    <button className="btn btn-primary" onClick={() => updateServiceWorker(true)}>Reload</button></aside>;
}
createRoot(document.getElementById('root')).render(<AppBoundary><Ledger /><UpdateNotice /></AppBoundary>);
