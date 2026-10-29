import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { apply } from '../src/index.mjs';

test('accepts only the expected route and writes observed values', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'route-guard-test-'));
  try {
    let listener;
    apply({ on(event, fn, options) { assert.equal(event, 'agent/request'); assert.equal(options.prepend, true); listener = fn; } },
      { provider: 'spark-local', model: 'test', effort: 'high', statusDir: dir });
    assert.deepEqual(JSON.parse(readFileSync(join(dir, 'guard-ready.json'))), { provider: 'spark-local', model: 'test', effort: 'high' });
    const correct = { provider: 'spark-local', model: 'test', reasoningEffort: 'high' };
    assert.deepEqual(await listener({}, async () => correct), correct);
    for (const patch of [{ provider: 'river' }, { model: 'wrong' }, { reasoningEffort: 'max' }, { reasoningEffort: undefined }]) {
      await assert.rejects(listener({}, async () => ({ ...correct, ...patch })), /does not match/);
    }
  } finally { rmSync(dir, { recursive: true }); }
});

test('fails on incomplete expected route', () => {
  assert.throws(() => apply({ on() {} }, { provider: 'river', model: 'test' }), /requires/);
});
