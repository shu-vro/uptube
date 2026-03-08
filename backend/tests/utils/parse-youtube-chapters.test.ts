import { describe, it, expect } from "vitest";
import parseYouTubeChapters from "../../src/utils/parse-youtube-chapters";

describe("parseYouTubeChapters (extended)", () => {
  describe("basic parsing", () => {
    it("parses simple chapters", () => {
      const description = `
        0:00 Intro
        1:23 Chapter 1
        4:56 Chapter 2
      `;
      const chapters = parseYouTubeChapters(description);
      expect(chapters).toEqual([
        { title: "Intro", start: 0, end: 83 },
        { title: "Chapter 1", start: 83, end: 296 },
        { title: "Chapter 2", start: 296, end: null },
      ]);
    });

    it("parses HH:MM:SS format", () => {
      const description = `
        0:00 Start
        01:02:03 Deep Into Topic
      `;
      const chapters = parseYouTubeChapters(description);
      expect(chapters).toHaveLength(2);
      expect(chapters[0].start).toBe(0);
      expect(chapters[1].start).toBe(3723);
    });

    it("ignores lines without timestamps", () => {
      const description = `
        This is just text
        0:00 Intro
        More text here
        2:30 Chapter 1
      `;
      const chapters = parseYouTubeChapters(description);
      expect(chapters).toHaveLength(2);
    });
  });

  describe("timestamp formats", () => {
    it("handles [brackets] around timestamps", () => {
      const description = `
        [0:00] Intro
        [5:30] Main Content
      `;
      const chapters = parseYouTubeChapters(description);
      expect(chapters).toHaveLength(2);
      expect(chapters[0].title).toBe("Intro");
      expect(chapters[1].title).toBe("Main Content");
    });

    it("handles dash separator after timestamp", () => {
      const description = `
        0:00 - Intro
        3:45 - First Section
      `;
      const chapters = parseYouTubeChapters(description);
      expect(chapters).toHaveLength(2);
      expect(chapters[0].title).toBe("Intro");
      expect(chapters[1].title).toBe("First Section");
    });

    it("handles pipe separator after timestamp", () => {
      const description = `
        0:00 | Intro
        1:30 | Part Two
      `;
      const chapters = parseYouTubeChapters(description);
      expect(chapters).toHaveLength(2);
      expect(chapters[0].title).toBe("Intro");
    });
  });

  describe("edge cases", () => {
    it("returns empty array for empty description", () => {
      expect(parseYouTubeChapters("")).toEqual([]);
    });

    it("returns empty array for null-like values", () => {
      expect(parseYouTubeChapters(null as any)).toEqual([]);
      expect(parseYouTubeChapters(undefined as any)).toEqual([]);
    });

    it("returns empty array for description with no chapters", () => {
      const description =
        "Just a regular video description with no timestamps.";
      expect(parseYouTubeChapters(description)).toEqual([]);
    });

    it("ignores timestamp lines without titles", () => {
      const description = `
        0:00
        1:23 Real Chapter
      `;
      const chapters = parseYouTubeChapters(description);
      expect(chapters).toHaveLength(1);
      expect(chapters[0].title).toBe("Real Chapter");
      expect(chapters[0].start).toBe(83);
    });

    it("deduplicates chapters with same start time", () => {
      const description = `
        0:00 Intro
        0:00 Also Intro
        1:00 Chapter 1
      `;
      const chapters = parseYouTubeChapters(description);
      expect(chapters).toHaveLength(2);
      expect(chapters[0].title).toBe("Intro"); // first occurrence kept
    });

    it("sorts chapters by start time", () => {
      const description = `
        5:00 Later Chapter
        0:00 Intro
        2:30 Middle Chapter
      `;
      const chapters = parseYouTubeChapters(description);
      expect(chapters[0].start).toBe(0);
      expect(chapters[1].start).toBe(150);
      expect(chapters[2].start).toBe(300);
    });

    it("handles single chapter", () => {
      const description = `
        0:00 Only Chapter
      `;
      const chapters = parseYouTubeChapters(description);
      expect(chapters).toHaveLength(1);
      expect(chapters[0]).toEqual({
        title: "Only Chapter",
        start: 0,
        end: null,
      });
    });
  });

  describe("options", () => {
    it("uses videoDurationSeconds for last chapter end", () => {
      const description = `
        0:00 Intro
        1:00 Main Content
      `;
      const chapters = parseYouTubeChapters(description, {
        videoDurationSeconds: 300,
      });
      expect(chapters[1].end).toBe(300);
    });

    it("last chapter end is null when videoDurationSeconds is not provided", () => {
      const description = `
        0:00 Intro
        1:00 Content
      `;
      const chapters = parseYouTubeChapters(description);
      expect(chapters[chapters.length - 1].end).toBeNull();
    });

    it("requireFirstAtZero returns empty when first chapter is not at 0:00", () => {
      const description = `
        1:00 First Chapter
        5:00 Second Chapter
      `;
      const chapters = parseYouTubeChapters(description, {
        requireFirstAtZero: true,
      });
      expect(chapters).toEqual([]);
    });

    it("requireFirstAtZero works when first chapter is at 0:00", () => {
      const description = `
        0:00 Intro
        5:00 Main
      `;
      const chapters = parseYouTubeChapters(description, {
        requireFirstAtZero: true,
      });
      expect(chapters).toHaveLength(2);
    });
  });

  describe("real-world descriptions", () => {
    it("parses chapters from a real YouTube description", () => {
      const description = `
Welcome to our React TypeScript Crash Course!

Here's what you'll learn:
00:00 |  Intro
01:31 |  Brilliant
03:25 |  Tutorial Start
03:48 |  Creating a Vite Application
04:08 |  Explanation of Boilerplate Code
05:19 |  Defining Props in TypeScript
18:30 |  Hooks using TypeScript
40:57 |  Enum in TypeScript
44:16 |  Converting JS to TS components

Tags:
- ReactJS Tutorial
`;
      const chapters = parseYouTubeChapters(description);
      expect(chapters.length).toBe(9);
      expect(chapters[0].title).toBe("Intro");
      expect(chapters[0].start).toBe(0);
      expect(chapters[1].title).toBe("Brilliant");
      expect(chapters[1].start).toBe(91);
      expect(chapters[8].title).toBe("Converting JS to TS components");
      expect(chapters[8].start).toBe(2656);
    });

    it("correctly computes end times between chapters", () => {
      const description = `
        0:00 Intro
        2:00 Part 1
        5:00 Part 2
        10:00 Outro
      `;
      const chapters = parseYouTubeChapters(description);
      expect(chapters[0].end).toBe(120); // 2:00
      expect(chapters[1].end).toBe(300); // 5:00
      expect(chapters[2].end).toBe(600); // 10:00
      expect(chapters[3].end).toBeNull();
    });
  });
});
