export const MAX_MANUAL_AMOUNT = 999999999;

// The same whole-unit, nine-digit entry rules apply to every manual keypad.
export function editAmount(value, key) {
  if (key === 'del') return value.slice(0, -1);
  if (!/^\d{1,2}$/.test(key) || (key === '00' && value === '')) return value;
  return ((value === '0' ? '' : value) + key).slice(0, 9);
}

export function parseRebuyAmount(value) {
  if (typeof value !== 'string' || !/^\d{1,9}$/.test(value)) return null;
  const amount = Number(value);
  return amount > 0 && amount <= MAX_MANUAL_AMOUNT ? amount : null;
}
