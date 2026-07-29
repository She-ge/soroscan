/**
 * Clamps a progress value to the supported 0–100 range.
 *
 * Non-finite values such as NaN and Infinity are treated as zero.
 *
 * @param {number} value
 * @returns {number}
 */
export function clampProgressValue(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, value));
}

/**
 * Formats a progress value as a rounded percentage.
 *
 * The supplied value is clamped before it is rounded and formatted.
 *
 * @param {number} value
 * @returns {string}
 */
export function formatProgressPercentage(value) {
  return `${Math.round(clampProgressValue(value))}%`;
}
