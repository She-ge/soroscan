/**
 * WCAG 2.1 contrast helpers for the accessibility audit (#912).
 */

function channelLuminance(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) {
    throw new Error(`Expected 6-digit hex color, got: ${hex}`);
  }
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return (
    0.2126 * channelLuminance(r) +
    0.7152 * channelLuminance(g) +
    0.0722 * channelLuminance(b)
  );
}

export function contrastRatio(foreground: string, background: string): number {
  const L1 = relativeLuminance(foreground);
  const L2 = relativeLuminance(background);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function meetsWcagAa(
  foreground: string,
  background: string,
  options: { largeText?: boolean } = {},
): boolean {
  const ratio = contrastRatio(foreground, background);
  return options.largeText ? ratio >= 3 : ratio >= 4.5;
}

export function meetsFocusContrast(
  focusColor: string,
  adjacentBackground: string,
): boolean {
  return contrastRatio(focusColor, adjacentBackground) >= 3;
}

export type ContrastAuditRow = {
  name: string;
  foreground: string;
  background: string;
  ratio: number;
  aa: boolean;
  aaa: boolean;
};

export function auditColorPairs(
  pairs: Array<{ name: string; foreground: string; background: string }>,
): ContrastAuditRow[] {
  return pairs.map((pair) => {
    const ratio = contrastRatio(pair.foreground, pair.background);
    return {
      ...pair,
      ratio: Number(ratio.toFixed(2)),
      aa: ratio >= 4.5,
      aaa: ratio >= 7,
    };
  });
}
