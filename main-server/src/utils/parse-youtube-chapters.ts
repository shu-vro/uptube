interface Chapter {
  title: string;
  start: number;
  end: number | null;
}

interface ParseOptions {
  videoDurationSeconds?: number | null;
  requireFirstAtZero?: boolean;
}

/**
 * Parse YouTube chapters from a description.
 * Returns [{ title: String, start: Int, end: Int }, ...]
 *
 * - Looks for lines like: "0:00 Intro" / "1:23 - Topic" / "01:02:03 Some title"
 * - start/end are seconds (integers)
 * - end is inferred as the next chapter's start; last chapter's end is null by default
 *
 * @param description
 * @param opts
 * @returns {Chapter[]}
 */
export default function parseYouTubeChapters(
  description: string,
  opts: ParseOptions = {}
): Chapter[] {
  const { videoDurationSeconds = null, requireFirstAtZero = false } = opts;

  const lines = String(description ?? "").split(/\r?\n/);

  // Matches:
  // 0:00 Title
  // 0:00 - Title
  // 00:00:10 Title
  // [0:00] Title
  const chapterLineRe =
    /^\s*(?:\[)?\s*(\d{1,2}:\d{2}(?::\d{2})?)\s*(?:\])?\s*(?:[-–—|:]\s*)?(.*?)\s*$/;

  const chaptersRaw: Array<{ title: string; start: number }> = [];
  for (const line of lines) {
    const m = line.match(chapterLineRe);
    if (!m || !m[1]) continue;

    const timeStr = m[1];
    let title = (m[2] || "").trim();

    // If there's nothing after the timestamp, ignore it
    if (!title) continue;

    const start = timeToSeconds(timeStr);
    if (!Number.isFinite(start)) continue;

    chaptersRaw.push({ title, start });
  }

  // Deduplicate by start time, keep first occurrence
  const seen = new Set<number>();
  const chapters: Chapter[] = chaptersRaw
    .sort((a, b) => a.start - b.start)
    .filter((c) => (seen.has(c.start) ? false : (seen.add(c.start), true)))
    .map((c) => ({ ...c, end: null }));

  if (chapters.length === 0) return [];

  if (requireFirstAtZero && chapters?.[0]?.start !== 0) return [];

  // Compute end times
  for (let i = 0; i < chapters.length; i++) {
    const current = chapters[i];
    if (!current) continue;

    const next = chapters[i + 1];
    current.end = next
      ? next.start
      : Number.isFinite(videoDurationSeconds) && videoDurationSeconds !== null
      ? videoDurationSeconds
      : null;
  }

  return chapters;

  function timeToSeconds(t: string): number {
    const parts = t.split(":").map((x) => x.trim());
    if (parts.some((p) => !/^\d+$/.test(p))) return NaN;

    // mm:ss or hh:mm:ss
    if (parts.length === 2) {
      const [mm, ss] = parts.map(Number);
      if ((!ss && ss !== 0) || (!mm && mm !== 0)) return NaN;
      if (ss >= 60) return NaN;

      return mm * 60 + ss;
    }
    if (parts.length === 3) {
      const [hh, mm, ss] = parts.map(Number);

      if ((!ss && ss !== 0) || (!mm && mm !== 0) || (!hh && hh !== 0))
        return NaN;
      if (mm >= 60 || ss >= 60) return NaN;

      return hh * 3600 + mm * 60 + ss;
    }
    return NaN;
  }
}
