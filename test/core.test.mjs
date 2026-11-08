import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyActivation, extractKeys, fingerprint, isVerifiedActivation, maskKey } from '../src/core.mjs';

test('extractKeys finds unique normalized Steam-style product keys', () => {
  assert.deepEqual(
    extractKeys('First abcde-12345-z9y8x second ABCDE-12345-Z9Y8X and FFFFF-GGGGG-HHHHH'),
    ['ABCDE-12345-Z9Y8X', 'FFFFF-GGGGG-HHHHH']
  );
  assert.deepEqual(extractKeys('No codes here'), []);
});

test('fingerprints are stable and do not include plaintext', () => {
  const key = 'ABCDE-12345-Z9Y8X';
  assert.equal(fingerprint(key), fingerprint(key.toLowerCase()));
  assert.equal(fingerprint(key).length, 64);
  assert.ok(!fingerprint(key).includes(key));
  assert.equal(maskKey(key), '***-***-Y8X');
  assert.throws(() => fingerprint('invalid'));
});

test('classification only confirms an explicit success result', () => {
  assert.equal(classifyActivation('Product Activation Successful!'), 'activated');
  assert.equal(classifyActivation('This product has already been activated'), 'already-used');
  assert.equal(classifyActivation('Too many activation attempts. Try again later.'), 'blocked');
  assert.equal(classifyActivation('Invalid Product Code'), 'invalid');
  assert.equal(classifyActivation('This product is already in your Steam library'), 'already-owned');
  assert.equal(classifyActivation('Please activate your product below'), 'unknown');
  assert.equal(classifyActivation(''), 'unknown');
  assert.ok(!isVerifiedActivation({ status: 'unknown' }));
  assert.ok(!isVerifiedActivation({ status: 'already-owned' }));
  assert.ok(isVerifiedActivation({ status: 'activated' }));
});
