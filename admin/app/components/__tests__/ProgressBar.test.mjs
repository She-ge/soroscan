import assert from 'node:assert/strict';
import test from 'node:test';

import {
  clampProgressValue,
  formatProgressPercentage,
} from '../progressBarUtils.mjs';

test('clampProgressValue accepts values from 0 to 100', () => {
  const testCases = [
    [0, 0],
    [25, 25],
    [42.5, 42.5],
    [75, 75],
    [100, 100],
  ];

  for (const [value, expected] of testCases) {
    assert.equal(
      clampProgressValue(value),
      expected,
      `Expected ${value} to remain ${expected}`,
    );
  }
});

test('clampProgressValue clamps values outside the supported range', () => {
  const testCases = [
    [-10, 0],
    [-1, 0],
    [101, 100],
    [150, 100],
  ];

  for (const [value, expected] of testCases) {
    assert.equal(
      clampProgressValue(value),
      expected,
      `Expected ${value} to be clamped to ${expected}`,
    );
  }
});

test('clampProgressValue handles non-finite values safely', () => {
  assert.equal(clampProgressValue(Number.NaN), 0);
  assert.equal(clampProgressValue(Number.POSITIVE_INFINITY), 0);
  assert.equal(clampProgressValue(Number.NEGATIVE_INFINITY), 0);
});

test('formatProgressPercentage rounds and formats the percentage', () => {
  const testCases = [
    [0, '0%'],
    [25, '25%'],
    [42.4, '42%'],
    [42.5, '43%'],
    [75, '75%'],
    [100, '100%'],
    [150, '100%'],
    [-10, '0%'],
  ];

  for (const [value, expected] of testCases) {
    assert.equal(
      formatProgressPercentage(value),
      expected,
      `Expected ${value} to display as ${expected}`,
    );
  }
});
