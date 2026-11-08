import test from 'node:test';
import assert from 'node:assert/strict';
import { redactKeys } from '../src/core.mjs';
import { scanKeys } from '../src/humble.mjs';

test('redactKeys masks every visible Steam-style key, including mixed case', () => {
  const text = 'Key ABCDE-12345-Z9Y8X and ab123-cd456-ef789';
  const safe = redactKeys(text);
  assert.equal(safe, 'Key [REDACTED KEY] and [REDACTED KEY]');
  assert.ok(!safe.includes('ABCDE-12345-Z9Y8X'));
});

test('scanKeys does not log a raw key when row title falls back to first text line', async () => {
  const key = 'ABCDE-12345-Z9Y8X';
  const element = {
    innerText: key + '\nSteam',
    querySelector: () => null,
    querySelectorAll: () => [],
  };
  const page = {
    locator: () => ({ evaluateAll: async (fn, selector) => fn([element], selector) }),
  };
  const [row] = await scanKeys(page);
  assert.equal(row.steam, true);
  assert.deepEqual(row.keys, [key]);
  assert.equal(row.title, '[REDACTED KEY]');
});
