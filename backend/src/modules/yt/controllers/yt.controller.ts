import logger from "config/logger/pino.logger";
import { Request } from "express";
import { asyncHandler } from "utils/async-handler";
import { Innertube, UniversalCache } from "youtubei.js";
import { sanitizeYtUrl } from "utils/yt";
import { parseViewCount } from "utils/yt/parseViewCount";
import parseDurationToSeconds from "utils/yt/parseDurationToSeconds";

export const yt = await Innertube.create({
  cache: new UniversalCache(true, "./.cache"),
  //   cookie: `VISITOR_INFO1_LIVE=4P9NKvf2tVA; VISITOR_PRIVACY_METADATA=CgJCRBIEGgAgWg%3D%3D; LOGIN_INFO=AFmmF2swRQIga7voSrekRhRfpv6Jyhz3bYTtFHCthMuhuw0AJtZQYHMCIQDxsprw4k2ArphELi2o70OW8XsVTFhqYsHt87fo769lxA:QUQ3MjNmd1p2MlBicWZJa2d1Zy1oelNUeDBWc1FxOEU4RmxibVhaZm5mUVF5TjVSLTNnbFZQMDdYRUpUaHNHdXhjSHd2bGRFd0h2bl9Kc3lLME1HdkxPeTJ5QlFmYVJtS2JoWFhMOWEtSnhzQTJ1QXlNTzFNQTVrcUQyMkhwWEozZVo0OHBITUVzSGdsQjhwZTJ2NVBxQkJHRjN4cno1eENn; SID=g.a0000ggRxdNpTyVT3qbJRVCvWdeP7fI9PVq9Z_2K6BJ1jhTi_Xv1M-UIxuZkROlbYqGw6gE4vwACgYKAf8SARASFQHGX2MiXqkMEoyrsE2sEoO2xtP3KBoVAUF8yKpFnNP6JzNZs7xF_OA29SOF0076; __Secure-1PSID=g.a0000ggRxdNpTyVT3qbJRVCvWdeP7fI9PVq9Z_2K6BJ1jhTi_Xv1bryZ6AIq9ReQ7ci8zo9NNQACgYKAUQSARASFQHGX2MiL8-vUcMQNpIsr-EinBtT3BoVAUF8yKpQruvqLcipbCiqHv_s6TP80076; __Secure-3PSID=g.a0000ggRxdNpTyVT3qbJRVCvWdeP7fI9PVq9Z_2K6BJ1jhTi_Xv1pmSG-AXSmbTaMDbyIkyL-wACgYKAdISARASFQHGX2MiilhZ1FUZZwBE8sXbOjj6-hoVAUF8yKrXXmuDZrfhlwadO4IqJE7n0076; HSID=AxMCylDk2VtP_Bmq5; SSID=AJKz1fz4ahtZXcI0q; APISID=E1VwAZ2tdPzn5HBX/Awh7DAgw2BAYzGZ5_; SAPISID=igUkjXf4LADMhgoG/A1LYfJmf_DUkh1HR0; __Secure-1PAPISID=igUkjXf4LADMhgoG/A1LYfJmf_DUkh1HR0; __Secure-3PAPISID=igUkjXf4LADMhgoG/A1LYfJmf_DUkh1HR0; PREF=f6=40000000&tz=Asia.Dhaka&f7=150; YSC=NkIeJMU0uZo; __Secure-ROLLOUT_TOKEN=CPnZ2KaxyPK32QEQ_arN9u_0jgMYwb29hcTljwM%3D; wide=0; __Secure-1PSIDTS=sidts-CjUBmkD5S2X0IFjz1z_h_9C4xVa3apHF79duLKoDHa2tA9HXpi51SknM2r83Lj7PL9U_uzgOnhAA; __Secure-3PSIDTS=sidts-CjUBmkD5S2X0IFjz1z_h_9C4xVa3apHF79duLKoDHa2tA9HXpi51SknM2r83Lj7PL9U_uzgOnhAA; SIDCC=AKEyXzWjIJJDBTA_0cqVKUmvC19toueGOpseXK-jMEDlJ5NBT8eC1uUd6lvWpypGcoUwzUovZQ; __Secure-1PSIDCC=AKEyXzWedpA6Niwa5CU1djFcyC6pxHlmeRVdQzdVEAYDh-wGBJu8hJLKRzphmfGG1Ki5tX5Mep0; __Secure-3PSIDCC=AKEyXzXQ-rHtmDZRKXmsw_pDEBK32hLa7oznYAOZWj5MyJmMGGrONTtfEnhFOk7ypwW3RfmYAN0; ST-3opvp5=session_logininfo=AFmmF2swRQIga7voSrekRhRfpv6Jyhz3bYTtFHCthMuhuw0AJtZQYHMCIQDxsprw4k2ArphELi2o70OW8XsVTFhqYsHt87fo769lxA%3AQUQ3MjNmd1p2MlBicWZJa2d1Zy1oelNUeDBWc1FxOEU4RmxibVhaZm5mUVF5TjVSLTNnbFZQMDdYRUpUaHNHdXhjSHd2bGRFd0h2bl9Kc3lLME1HdkxPeTJ5QlFmYVJtS2JoWFhMOWEtSnhzQTJ1QXlNTzFNQTVrcUQyMkhwWEozZVo0OHBITUVzSGdsQjhwZTJ2NVBxQkJHRjN4cno1eENn; ST-46b5q6=itct=CP8CENwwIhMI_8PN4t3ljwMVF4rYBR1e1jqxMgpnLWhpZ2gtcmVjWg9GRXdoYXRfdG9fd2F0Y2iaAQYQjh4YngHKAQQsueHF&csn=jzNTMpXbwe591hmz&session_logininfo=AFmmF2swRQIga7voSrekRhRfpv6Jyhz3bYTtFHCthMuhuw0AJtZQYHMCIQDxsprw4k2ArphELi2o70OW8XsVTFhqYsHt87fo769lxA%3AQUQ3MjNmd1p2MlBicWZJa2d1Zy1oelNUeDBWc1FxOEU4RmxibVhaZm5mUVF5TjVSLTNnbFZQMDdYRUpUaHNHdXhjSHd2bGRFd0h2bl9Kc3lLME1HdkxPeTJ5QlFmYVJtS2JoWFhMOWEtSnhzQTJ1QXlNTzFNQTVrcUQyMkhwWEozZVo0OHBITUVzSGdsQjhwZTJ2NVBxQkJHRjN4cno1eENn&endpoint=%7B%22clickTrackingParams%22%3A%22CP8CENwwIhMI_8PN4t3ljwMVF4rYBR1e1jqxMgpnLWhpZ2gtcmVjWg9GRXdoYXRfdG9fd2F0Y2iaAQYQjh4YngHKAQQsueHF%22%2C%22commandMetadata%22%3A%7B%22webCommandMetadata%22%3A%7B%22url%22%3A%22%2Fwatch%3Fv%3DOfOPrmnHRxw%22%2C%22webPageType%22%3A%22WEB_PAGE_TYPE_WATCH%22%2C%22rootVe%22%3A3832%7D%7D%2C%22watchEndpoint%22%3A%7B%22videoId%22%3A%22OfOPrmnHRxw%22%2C%22watchEndpointSupportedOnesieConfig%22%3A%7B%22html5PlaybackOnesieConfig%22%3A%7B%22commonConfig%22%3A%7B%22url%22%3A%22https%3A%2F%2Frr3---sn-5hcxgpucq-q5j6.googlevideo.com%2Finitplayback%3Fsource%3Dyoutube%26oeis%3D1%26c%3DWEB%26oad%3D3200%26ovd%3D3200%26oaad%3D11000%26oavd%3D11000%26ocs%3D700%26oewis%3D1%26oputc%3D1%26ofpcc%3D1%26siu%3D1%26msp%3D1%26odepv%3D1%26id%3D39f38fae69c7471c%26ip%3D118.179.177.81%26initcwndbps%3D1082500%26mt%3D1758315492%26oweuc%3D%26pxtags%3DCg4KAnR4Egg1MTYwNTM2NQ%26rxtags%3DCg4KAnR4Egg1MTYwNTM2NQ%252CCg4KAnR4Egg1MTYwNTM2Ng%252CCg4KAnR4Egg1MTYwNTM2Nw%252CCg4KAnR4Egg1MTYwNTM2OA%252CCg4KAnR4Egg1MTYwNTM2OQ%252CCg4KAnR4Egg1MTYwNTM3MA%252CCg4KAnR4Egg1MTYwNTM3MQ%22%7D%7D%7D%7D%7D
  // `,
});

export const getVideoInfo = asyncHandler(async (req: Request) => {
  const videoId = sanitizeYtUrl(req.query.id as string);
  if (!videoId) {
    return req._error("Invalid video ID");
  }
  const videoInfo = await yt.actions.execute("/player", {
    videoId,
    client: "YTMUSIC", // InnerTube client to use. only get necessary info
    parse: true, // tells YouTube.js to parse the response (not sent to InnerTube).
  });

  req._success(videoInfo);
});

// https://www.youtube.com/watch?v=m6qieXZsgwo&t=3s
export const searchVideos = asyncHandler(async (req: Request) => {
  const query = req.query.q as string;
  const videos = await yt.search(query, {
    type: "video",
  });

  const uploadableVideos = videos.videos.map((video) => {
    return {
      id: video.video_id,
      title: video.title.text,
      // channel_id
      // short_description
      duration: parseDurationToSeconds(video.length_text.text),
      thumbnail: video.thumbnails.map((t) => {
        return {
          id: t.url,
          width: parseInt(t.width.toString()),
          height: parseInt(t.height.toString()),
        };
      }),
      view_count: parseViewCount(video.view_count.text),
    };
  });

  req._success(videos.videos[0]);
});

// const info = await yt.getSearchSuggestions("linear algebra");
// const info = await yt.getHashtag("game");
// const info = await yt.resolveURL(
//   "https://www.youtube.com/watch?v=m6qieXZsgwo&t=3s"
// );
// const info = await yt.getChannel("UC6ZVQBJ00cRkZSnbOZEmCkA");
// const info = await yt.search("what is binary search?");
// const info = await yt.getHomeFeed();
export const doSomething = asyncHandler(async (req: Request) => {
  const info = await yt.getChannel("UC6ZVQBJ00cRkZSnbOZEmCkA");
  req._success(info);
});
