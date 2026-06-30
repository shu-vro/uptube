"use client";

import type { Caption } from "@/types/prisma";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/cn";

export function TranscriptViewer({
  captions,
  currentTime = 0,
  onSeek,
}: {
  captions: Caption[];
  currentTime?: number;
  onSeek?: (time: number) => void;
}) {
  const entries = captions.flatMap((caption) => {
    const json = caption.base_url_to_json as {
      transcript?: {
        text?: Array<{ "#text"?: string; $_start?: string; $_dur?: string }>;
      };
    } | null;
    const texts = json?.transcript?.text ?? [];
    return texts
      .map((entry) => ({
        text: entry["#text"] ?? "",
        start: parseFloat(entry.$_start ?? "0"),
      }))
      .filter((e) => e.text);
  });

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No transcript available.</p>
    );
  }

  return (
    <div className="max-h-[50vh] space-y-2 overflow-y-auto">
      {entries.map((entry, i) => {
        const active =
          currentTime >= entry.start &&
          currentTime < (entries[i + 1]?.start ?? Infinity);
        return (
          <button
            key={`${entry.start}-${i}`}
            type="button"
            onClick={() => onSeek?.(entry.start)}
            className={cn(
              "block w-full rounded px-2 py-1 text-left text-sm hover:bg-muted",
              active && "bg-primary/20 text-primary",
            )}
          >
            <span className="mr-2 text-xs text-muted-foreground">
              {formatTime(entry.start)}
            </span>
            {entry.text}
          </button>
        );
      })}
    </div>
  );
}
