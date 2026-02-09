import parseYouTubeChapters from "utils/parse-youtube-chapters";
import { describe, expect, it } from "vitest";

const real_world_description = [
  `To try everything Brilliant has to offer—free—for a full 30 days, visit https://brilliant.org/PedroTech . You’ll also get 20% off an annual premium subscription.

Welcome to our React TypeScript Crash Course! 🚀 In this quick and comprehensive tutorial, we'll cover everything you need to know to get started with TypeScript. Whether you're a JavaScript developer looking to enhance your skills or a complete beginner, this video will guide you through the essentials of TypeScript.

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

🚀  Learn ReactJS By Building 6 Projects: https://codedamn.com/learn/reactjs-projects
🐙 GraphQL Course: https://codedamn.com/learn/graphql-for-beginners

Social
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
Website: machadopedro.com
Linkedin: https://www.linkedin.com/in/machadop1407/
Instagram: https://www.instagram.com/pedro.fmachado_
Github: https://github.com/machadop1407

Business Email: pedro@pedrotech.co

🌟 Gear / Hardware I Use and Recommend 🌟
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
💻 https://amzn.to/42kqFuM 💻 Monitor
🖱️https://amzn.to/3C0ZhHb 🖱️ Mouse
📷 https://amzn.to/3OHJvbM 📷 My Camera
🎤 https://amzn.to/3oxSthj 🎤 My Microphone
⌨️ https://amzn.to/3oFPpj1 ⌨️ My Microphone
⚡ https://amzn.to/3MYMnzM ⚡ LED Lights In the Background

Tags:
- ReactJS Tutorial
- ReactJS and MySQL
- NodeJS Tutorial
- API Tutorial

..........
♬ MUSIC ♬
Artist: tubebackr
Track: Chill With Me
@tubebackr
hypeddit.com/tubebackr/chillwithme-1
.............

#typescript  #react`,
];

describe("parseYouTubeChapters", () => {
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

  it("ignores invalid lines", () => {
    const description = `
      This is a video about something.
      0:00 Intro
      Not a chapter line
      1:23 Chapter 1
    `;

    const chapters = parseYouTubeChapters(description);
    expect(chapters).toEqual([
      { title: "Intro", start: 0, end: 83 },
      { title: "Chapter 1", start: 83, end: null },
    ]);
  });

  it("handles different timestamp formats", () => {
    const description = `
      [0:00] Intro
      1:23 - Chapter 1
      01:02:03 Chapter 2
    `;

    const chapters = parseYouTubeChapters(description);
    expect(chapters).toEqual([
      { title: "Intro", start: 0, end: 83 },
      { title: "Chapter 1", start: 83, end: 3723 },
      { title: "Chapter 2", start: 3723, end: null },
    ]);
  });

  it("requires first chapter at zero if option is set", () => {
    const description = `
      0:10 Intro
      1:23 Chapter 1
    `;

    const chapters = parseYouTubeChapters(description, {
      requireFirstAtZero: true,
    });
    expect(chapters).toEqual([]);
  });

  it("infers end time from next chapter", () => {
    const description = `
      0:00 Intro
      1:00 Chapter 1
      2:30 Chapter 2
    `;

    const chapters = parseYouTubeChapters(description);
    expect(chapters).toEqual([
      { title: "Intro", start: 0, end: 60 },
      { title: "Chapter 1", start: 60, end: 150 },
      { title: "Chapter 2", start: 150, end: null },
    ]);
  });
  it("handles duplicate timestamps", () => {
    const description = `
      0:00 Intro
      1:00 Chapter 1
      1:00 Chapter 1 Duplicate
      2:00 Chapter 2
    `;

    const chapters = parseYouTubeChapters(description);
    expect(chapters).toEqual([
      { title: "Intro", start: 0, end: 60 },
      { title: "Chapter 1", start: 60, end: 120 },
      { title: "Chapter 2", start: 120, end: null },
    ]);
  });
  it("doesn't capture anything if there are no valid chapters", () => {
    const description = `
      This is a video about something.
      No chapters here!
    `;

    const chapters = parseYouTubeChapters(description);
    expect(chapters).toEqual([]);
  });
  it("passes real world descriptions", () => {
    const chapters = parseYouTubeChapters(real_world_description[0]);
    expect(chapters).toEqual([
      { title: "Intro", start: 0, end: 91 },
      { title: "Brilliant", start: 91, end: 205 },
      { title: "Tutorial Start", start: 205, end: 228 },
      { title: "Creating a Vite Application", start: 228, end: 248 },
      { title: "Explanation of Boilerplate Code", start: 248, end: 319 },
      { title: "Defining Props in TypeScript", start: 319, end: 1110 },
      { title: "Hooks using TypeScript", start: 1110, end: 2457 },
      { title: "Enum in TypeScript", start: 2457, end: 2656 },
      { title: "Converting JS to TS components", start: 2656, end: null },
    ]);
  });
});
