import { APP_ICONS, DEFAULT_APP_ICON, appIcon, iconPath } from './app-icons.js';

export default function IconPicker({ selected, onSelect }) {
  return <div className="icon-picker">
    <div className="icon-help" id="icon-help">
      <p>Changes this browser’s tab icon now.</p>
      <p>For iPhone, choose in Safari before adding xbenben to the Home Screen. Existing Home Screen icons stay unchanged.</p>
      <p>Safari and installed copies keep separate data; this choice does not sync between them. Other platforms install {appIcon(DEFAULT_APP_ICON).label}.</p>
    </div>
    <div className="icon-grid" role="group" aria-label="App icon choices" aria-describedby="icon-help">
      {APP_ICONS.map(icon => <button type="button" key={icon.id} className="icon-choice blueprint"
        aria-label={`${icon.variant} ${icon.label}`} aria-pressed={icon.id === selected} onClick={() => onSelect(icon.id)}>
        {['tl', 'tr', 'bl', 'br'].map(corner => <i key={corner} aria-hidden="true" className={'corner ' + corner} />)}
        <img src={import.meta.env.BASE_URL + iconPath(icon.id, 180)} width="64" height="64" alt="" />
        <span className="icon-name">{icon.label}</span>
        <span className="icon-caption">{icon.variant}{icon.id === selected ? ' · Selected' : icon.id === DEFAULT_APP_ICON ? ' · Default' : ''}</span>
      </button>)}
    </div>
  </div>;
}
