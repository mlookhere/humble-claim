import { createHash } from 'node:crypto';

const KEY_REGEX = /\b[A-Z0-9]{5}(?:-[A-Z0-9]{5}){2}\b/gi;

export function extractKeys(value) {
  const matches = String(value ?? '').match(KEY_REGEX) ?? [];
  return [...new Set(matches.map((match) => match.toUpperCase()))];
}

export function fingerprint(key) {
  const normalized = extractKeys(key);
  if (normalized.length !== 1 || normalized[0] !== String(key).trim().toUpperCase()) {
    throw new Error('Expected exactly one valid Steam-style key');
  }
  return createHash('sha256').update(normalized[0]).digest('hex');
}

export function redactKeys(text) {
  return String(text ?? '').replace(KEY_REGEX, '[REDACTED KEY]');
}

export function maskKey(key) {
  return '***-***-' + String(key).slice(-3).toUpperCase();
}

export function classifyActivation(message) {
  const text = String(message ?? '').toLowerCase();
  if (/too many (?:activation )?attempts|rate.limit|try again later|captcha|temporarily (?:unavailable|blocked)/i.test(text)) {
    return 'blocked';
  }
  if (/already (?:been )?activated|duplicate product code|already been used/i.test(text)) {
    return 'already-used';
  }
  if (/already own|already in your (?:steam )?library/i.test(text)) {
    return 'already-owned';
  }
  if (/invalid product code|code is invalid|product code is not valid|not available in your country|not available in your region/i.test(text)) {
    return 'invalid';
  }
  if (/product activation successful|activation (?:was )?successful|successfully activated (?:a|the) product/i.test(text)) {
    return 'activated';
  }
  return 'unknown';
}

export function isVerifiedActivation(record) {
  return record?.status === 'activated';
}
