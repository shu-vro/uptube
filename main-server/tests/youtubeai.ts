import { ClientType, Innertube, YTNodes } from "youtubei.js/web";
import ytdl from "ytdl-core";
import fs from "fs";
// import dashjs from 'dashjs';

const innertube = await Innertube.create({
  //   fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
  //     // Modify the request
  //     // and send it to the proxy

  //     return fetch(input, init);
  //   },
  //   retrieve_player: true,
  generate_session_locally: true,
  // client_type: ClientType.ANDROID,
});

// Get the video info
// const videoInfo = await innertube.download("5758jHtfBUM", { client: "TV" });
const videoInfo = await innertube.getInfo("pljoUcBniPQ");
// const lyrics = await innertube.music.getLyrics("rEXfZ5npq3s");

// const videoURL = "https://www.youtube.com/watch?v=5758jHtfBUM";
// const outputFilePath = "path/to/save/video.mp4";

// const options = {
//   quality: "highest", // You can specify ‘highest’, ‘lowest’, or a specific format code
// };

// ytdl(videoURL, options)
//   .pipe(fs.createWriteStream(outputFilePath))
//   .on("finish", () => {
//     console.log("Video downloaded successfully!");
//   })
//   .on("error", (err) => {
//     console.log("fucked", err);
//   });

console.log(
  videoInfo.secondary_info?.as(YTNodes.VideoSecondaryInfo).description.text
);
