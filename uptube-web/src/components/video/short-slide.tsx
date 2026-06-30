"use client";

import { useState } from "react";
import { get } from "@/lib/api";
import type { Video } from "@/types/prisma";
import { VideoPlayer } from "@/components/video/video-player";
import { VideoActions } from "@/components/video/video-actions";
import { usePlayUrls, INITIAL_PLAYBACK_QUALITY } from "@/hooks/use-play-urls";
import { useRecordHistory } from "@/hooks/use-record-history";
import { miniNumber } from "@/lib/format";

export function ShortSlide({
  video,
  videoId,
}: {
  video?: Video;
  videoId: string;
}) {
  const [quality, setQuality] = useState(INITIAL_PLAYBACK_QUALITY);
  const { data: playUrls } = usePlayUrls(videoId, quality);

  useRecordHistory(videoId, 2000);

  const handleDownload = async () => {
    const result = (await get({
      endpoint: `/download/video-audio/${videoId}`,
      params: { quality },
      baseUrl: "/download-api/v1",
    })) as { url?: string } | null;
    if (result?.url) window.open(result.url, "_blank");
  };

  const thumbnail = video?.thumbnails?.sort(
    (a, b) => (b?.width || 0) - (a?.width || 0),
  )[0]?.url;

  return (
    <div className="relative mx-auto flex h-full max-w-md items-center justify-center bg-black">
      <VideoPlayer
        videoUrl={playUrls?.video_fmt?.url}
        audioUrl={playUrls?.audio_fmt?.url}
        poster={thumbnail}
        qualities={video?.available_qualities ?? []}
        selectedQuality={quality}
        onQualityChange={setQuality}
        className="h-full max-h-full w-full"
      />

      {video && (
        <div className="absolute bottom-20 left-4 right-16 text-white">
          <p className="line-clamp-2 text-sm font-semibold drop-shadow">
            {video.title}
          </p>
          <p className="text-xs text-white/80 drop-shadow">
            {miniNumber(Number(video.view_count) || 0)} views
          </p>
        </div>
      )}

      {video && (
        <div className="absolute bottom-24 right-4">
          <VideoActions
            video={video}
            onDownload={handleDownload}
            variant="overlay"
          />
        </div>
      )}
    </div>
  );
}
