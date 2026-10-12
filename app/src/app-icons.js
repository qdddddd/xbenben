// Turn 4 artwork. Add a variant only once its original PNG and ground are available.
export const APP_ICONS = Object.freeze([
  { id: 'deep', variant: '4B', label: 'Deep steel', ground: '#1d2d3d', source: 'icon-bankroll-deep-1024.png' },
  { id: 'paper', variant: '4C', label: 'Paper', ground: '#f2f2f3', source: 'icon-bankroll-paper-1024.png' },
  { id: 'ink', variant: '4D', label: 'Ink', ground: '#1d1f20', source: 'icon-bankroll-ink-1024.png' },
  { id: 'hkd', variant: '4E', label: 'HK$1000', ground: '#c94640', source: 'icon-bankroll-hkd-1024.png' },
  { id: 'bronze', variant: '4F', label: 'Bronze', ground: '#7a6a55', source: 'icon-bankroll-bronze-1024.png' },
  { id: 'forest', variant: '4G', label: 'Forest', ground: '#4f6b58', source: 'icon-bankroll-forest-1024.png' },
  { id: 'violet', variant: '4H', label: 'Violet', ground: '#6b5a7a', source: 'icon-bankroll-violet-1024.png' },
  { id: 'pink', variant: '4I', label: 'Salmon', ground: '#f58ea3', source: 'icon-bankroll-pink-1024.png' },
  { id: 'mutedpink', variant: '4J', label: 'Muted pink', ground: '#a8667a', source: 'icon-bankroll-mutedpink-1024.png' },
]);
export const DEFAULT_APP_ICON = 'deep';
export const appIcon = id => APP_ICONS.find(icon => icon.id === id) || APP_ICONS.find(icon => icon.id === DEFAULT_APP_ICON);
export const iconPath = (id, size) => `icons/bankroll-${appIcon(id).id}-${size}.png`;

// e560c21 stored its Paper default even without a choice. It has no provenance,
// so unmarked Paper follows the new default; other old values imply a choice.
export function iconPreference(settings) {
  const icon = APP_ICONS.find(icon => icon.id === settings.appIcon);
  const explicit = !!icon && (settings.appIconExplicit === true ||
    (settings.appIconExplicit === undefined && icon.id !== 'paper'));
  return { appIcon: explicit ? icon.id : DEFAULT_APP_ICON, appIconExplicit: explicit };
}

export function applyAppIcon(id, base, doc = document) {
  for (const size of [16, 32]) doc.querySelector(`link[rel="icon"][sizes="${size}x${size}"]`).setAttribute('href', base + iconPath(id, size));
  doc.querySelector('link[rel="apple-touch-icon"]').setAttribute('href', base + iconPath(id, 180));
}
