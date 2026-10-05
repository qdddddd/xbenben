import { useEffect, useRef, useState } from 'react';
import { editAmount, parseRebuyAmount } from './amount-entry.js';
import { money } from './domain.js';
import FittedValue from './FittedValue.jsx';

function CustomRebuy({ session, onConfirm, onBack }) {
  const [value, setValue] = useState('');
  const form = useRef(null), submitted = useRef(false);
  const amount = parseRebuyAmount(value);
  useEffect(() => { form.current.querySelector('output').focus({ preventScroll: true }); }, []);
  const enter = key => setValue(current => editAmount(current, key));
  const submit = event => {
    event.preventDefault();
    if (amount === null || submitted.current) return;
    submitted.current = true;
    onConfirm(amount);
  };
  return <form ref={form} className="rebuy-form" onSubmit={submit} onKeyDown={event => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (/^\d$/.test(event.key)) { event.preventDefault(); enter(event.key); }
    else if (event.key === 'Backspace') { event.preventDefault(); enter('del'); }
    else if (event.key === 'Enter' && event.target.tagName === 'OUTPUT') submit(event);
  }}>
    <div className="rebuy-editor">
      <button type="button" className="text-action rebuy-back" onClick={onBack}>← Preset amounts</button>
      <div className="rebuy-value">
        <div className="section-label">Custom amount · {session.cur}</div>
        <FittedValue as="output" tabIndex={0} aria-label="Custom re-buy amount">{money(Number(value), session.cur)}</FittedValue>
        <div className="rebuy-bbs" aria-label="Re-buy in big blinds">{session.bb > 0 ? Math.round(Number(value) / session.bb).toLocaleString('en-US') : '—'} bb</div>
      </div>
      <div className="rebuy-keypad" role="group" aria-label="Re-buy keypad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'del'].map(key =>
          <button type="button" key={key} aria-label={key === 'del' ? 'Delete digit' : key} onClick={() => enter(key)}>{key === 'del' ? '⌫' : key}</button>)}
      </div>
    </div>
    <button type="submit" className="blueprint rebuy-confirm" disabled={amount === null}>
      {['tl', 'tr', 'bl', 'br'].map(corner => <i key={corner} aria-hidden="true" className={'corner ' + corner} />)}
      Log re-buy
    </button>
  </form>;
}

export default function Rebuy({ session, onConfirm, children }) {
  const [custom, setCustom] = useState(false);
  return custom ? <CustomRebuy session={session} onConfirm={onConfirm} onBack={() => setCustom(false)} /> : <>
    {children}
    <button type="button" className="btn btn-secondary btn-block data-button rebuy-custom" onClick={() => setCustom(true)}>Custom amount</button>
  </>;
}
