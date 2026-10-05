import { test } from 'node:test';
import assert from 'node:assert/strict';
import { editAmount, parseRebuyAmount, MAX_MANUAL_AMOUNT } from '../src/amount-entry.js';

test('custom re-buys accept positive whole amounts up to the buy-in limit', () => {
  for (const value of ['1', '13750', String(MAX_MANUAL_AMOUNT)]) assert.equal(parseRebuyAmount(value), Number(value));
  for (const value of ['', '0', '000', '-1', '1.5', '1e3', 'Infinity', 'NaN', ' 1', '1 ', '1,000', 'HK$50', '1000000000', null, undefined, 500]) {
    assert.equal(parseRebuyAmount(value), null, `Reject ${String(value)} without recording it`);
  }
});

test('shared manual keypad handles leading zero, double zero, deletion and the nine-digit boundary', () => {
  assert.equal(editAmount('', '00'), '');
  assert.equal(editAmount('', '0'), '0');
  assert.equal(editAmount('0', '5'), '5');
  assert.equal(editAmount('5', '00'), '500');
  assert.equal(editAmount('13750', 'del'), '1375');
  assert.equal(editAmount('', 'del'), '');
  assert.equal(editAmount('99999999', '00'), '999999990');
  assert.equal(editAmount('999999999', '9'), '999999999');
  for (const key of ['.', '-', 'e', '100', 'Infinity']) assert.equal(editAmount('13750', key), '13750');
  assert.equal([...String(MAX_MANUAL_AMOUNT)].reduce(editAmount, ''), String(MAX_MANUAL_AMOUNT));
});
