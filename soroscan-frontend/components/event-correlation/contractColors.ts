/**
 * Deterministic color assignment per contract ID.
 * Uses the terminal palette — phosphor green / cyan / amber / red / blue.
 */

const PALETTE = [
  { bg: '#052e16', border: '#16a34a', text: '#4ade80' }, // green
  { bg: '#083344', border: '#0891b2', text: '#67e8f9' }, // cyan
  { bg: '#451a03', border: '#d97706', text: '#fcd34d' }, // amber
  { bg: '#450a0a', border: '#dc2626', text: '#f87171' }, // red
  { bg: '#1e1b4b', border: '#6d28d9', text: '#c4b5fd' }, // violet
  { bg: '#0c4a6e', border: '#0284c7', text: '#7dd3fc' }, // sky
  { bg: '#14532d', border: '#15803d', text: '#86efac' }, // emerald
  { bg: '#713f12', border: '#ca8a04', text: '#fde68a' }, // yellow
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function getContractColor(contractId: string) {
  return PALETTE[hashString(contractId) % PALETTE.length];
}
