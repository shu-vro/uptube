export function parseViewCount(text: string): number | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  if (/no\s+views?/.test(lower) || /no\s+views?/.test(lower)) return 0;

  let cleaned = lower.replace(/views?/g, "").trim();

  cleaned = cleaned.replace(/\u00A0/g, " ").replace(/,/g, "");

  // match numeric with optional suffix (k,m,b,t)
  const m = cleaned.match(/^([\d\.]+)\s*([kmbt])?$/i);
  if (!m) {
    const n = parseInt(cleaned, 10);
    return Number.isNaN(n) ? null : n;
  }

  const n = parseFloat(m[1]);
  const suffix = (m[2] || "").toLowerCase();
  const mul: Record<string, number> = { k: 1e3, m: 1e6, b: 1e9, t: 1e12 };

  return Math.round(n * (mul[suffix] ?? 1));
}
