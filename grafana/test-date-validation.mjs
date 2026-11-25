import assert from 'node:assert/strict';
import { isValidIsoDate } from '../src/date-validation.js';
const cases = [
  ['2026-11-25', true],
  ['2024-02-29', true],
  ['2025-02-29', false],
  ['2026-04-31', false],
  ['2026-13-01', false],
  ['2026-00-10', false],
  ['25-11-2026', false],
  ['2026-1-01', false],
  ['', true],
  [null, true],
];
for (const [value, expected] of cases) assert.equal(isValidIsoDate(value), expected, String(value));
console.log('Calendar date validation tests passed.');
