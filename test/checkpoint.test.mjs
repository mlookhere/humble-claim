import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadCheckpoint, saveCheckpoint } from '../src/checkpoint.mjs';
import { fingerprint } from '../src/core.mjs';

test('checkpoint persists status under a hash, not plaintext key', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'humble-claim-'));
  try {
    const path = join(dir, 'nested', 'state.json');
    const key = 'ABCDE-12345-Z9Y8X';
    const value = await loadCheckpoint(path);
    value.entries[fingerprint(key)] = { status: 'activated', at: '2026-01-01T00:00:00Z' };
    await saveCheckpoint(path, value);
    assert.deepEqual(await loadCheckpoint(path), value);
    assert.ok(!(await readFile(path, 'utf8')).includes(key));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('invalid checkpoint format is rejected rather than silently overwriting data', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'humble-claim-'));
  try {
    const path = join(dir, 'state.json');
    await saveCheckpoint(path, { entries: {} });
    await assert.rejects(() => loadCheckpoint(path), /Invalid checkpoint format/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
