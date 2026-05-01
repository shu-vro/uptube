export function parseDurationToSeconds(
  input: string | null | undefined
): number | null {
  if (!input) return null;
  const s = String(input).trim();
  if (!s) return null;

  // Handle Hh Mm Ss (e.g. "1h2m3s", "2h", "45m")
  const hmsMatch = s.match(
    /(?:(\d+)\s*h(?:ours?)?)?\s*(?:(\d+)\s*m(?:in(?:utes?)?)?)?\s*(?:(\d+)\s*s(?:ec(?:onds?)?)?)?$/i
  );
  if (hmsMatch && (hmsMatch[1] || hmsMatch[2] || hmsMatch[3])) {
    const hours = parseInt(hmsMatch[1] || "0", 10);
    const minutes = parseInt(hmsMatch[2] || "0", 10);
    const seconds = parseInt(hmsMatch[3] || "0", 10);
    return hours * 3600 + minutes * 60 + seconds;
  }

  // Handle colon separated (MM:SS or HH:MM:SS)
  if (s.includes(":")) {
    const parts = s.split(":").map((p) => p.replace(/\D/g, ""));
    const nums = parts.filter(Boolean).map((p) => parseInt(p, 10));
    if (nums.length === 0) return null;
    let seconds = 0;
    if (nums.length >= 1) seconds += nums[nums.length - 1] || 0;
    if (nums.length >= 2) seconds += (nums[nums.length - 2] || 0) * 60;
    if (nums.length >= 3) seconds += (nums[nums.length - 3] || 0) * 3600;
    return seconds;
  }

  const plain = s.replace(/[^\d]/g, "");
  if (plain) return parseInt(plain, 10);

  return null;
}

export default parseDurationToSeconds;
