"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { VideoPlayer } from "@/components/video/video-player";
import { VideoActions } from "@/components/video/video-actions";
import { VideoCardGrid } from "@/components/video/video-cards";
import { useVideoDetails } from "@/hooks/use-video-details";
import {
  usePlayUrls,
  INITIAL_PLAYBACK_QUALITY,
  normalizeVideoId,
} from "@/hooks/use-play-urls";
import { useRecordHistory } from "@/hooks/use-record-history";
import { distanceFromToday, miniNumber } from "@/lib/format";
import { get } from "@/lib/api";
import type { Video } from "@/types/prisma";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TranscriptViewer } from "@/components/video/transcript-viewer";

export default function VideoPage() {
  const params = useParams();
  const rawId = params.id as string;
  const id = normalizeVideoId(rawId);
  const [selectedQuality, setSelectedQuality] = useState(
    INITIAL_PLAYBACK_QUALITY,
  );
  const [descExpanded, setDescExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const { video, isLoading, isEnriching } = useVideoDetails(id);
  const { data: playUrls } = usePlayUrls(id, selectedQuality);

  useRecordHistory(id, 3000);

  const handleDownload = async () => {
    if (!id) return;
    const result = (await get({
      endpoint: `/download/video-audio/${id}`,
      params: { quality: selectedQuality },
      baseUrl: "/download-api/v1",
    })) as { url?: string } | null;
    if (result?.url) {
      window.open(result.url, "_blank");
    }
  };

  const upNext = (video?.nextEdges ?? [])
    .map((e) => e.to)
    .filter((v): v is Video => !!v);

  const thumbnail = video?.thumbnails?.[0]?.url;

  return (
    <div className="mx-auto max-w-6xl px-4 py-4">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <div className="lg:flex lg:gap-6">
        <div className="flex-1">
          <VideoPlayer
            videoUrl={playUrls?.video_fmt?.url}
            audioUrl={playUrls?.audio_fmt?.url}
            poster={thumbnail}
            qualities={video?.available_qualities ?? []}
            selectedQuality={selectedQuality}
            onQualityChange={setSelectedQuality}
            onTimeUpdate={setCurrentTime}
          />

          {(isLoading || isEnriching) && !video && (
            <div className="mt-4 flex justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}

          {video && (
            <div className="mt-4">
              <h1 className="text-xl font-bold">{video.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>{miniNumber(Number(video.view_count) || 0)} views</span>
                <span>•</span>
                <span>{distanceFromToday(video.createdAt.toString())}</span>
              </div>

              {video.creator && (
                <Link
                  href={`/creator/${video.creator.id}`}
                  className="mt-4 flex items-center gap-3 rounded-xl bg-muted/50 p-3 hover:bg-muted"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                    {video.creator.title[0]}
                  </div>
                  <div>
                    <p className="font-semibold">{video.creator.title}</p>
                  </div>
                </Link>
              )}

              <VideoActions video={video} onDownload={handleDownload} />

              {(video.captions?.length ?? 0) > 0 && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="mb-4">
                      Transcript
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Transcript</DialogTitle>
                    </DialogHeader>
                    <TranscriptViewer
                      captions={video.captions ?? []}
                      currentTime={currentTime}
                    />
                  </DialogContent>
                </Dialog>
              )}

              {video.short_description && (
                <div className="rounded-xl bg-muted/50 p-4">
                  <p className={descExpanded ? "" : "line-clamp-3"}>
                    {video.short_description}
                  </p>
                  {video.short_description.length > 150 && (
                    <button
                      type="button"
                      className="mt-2 text-sm font-medium text-primary"
                      onClick={() => setDescExpanded(!descExpanded)}
                    >
                      {descExpanded ? "Show less" : "Show more"}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {upNext.length > 0 && (
          <aside className="mt-6 lg:mt-0 lg:w-96 lg:shrink-0">
            <h2 className="mb-3 text-lg font-semibold">Up next</h2>
            <div className="space-y-2">
              {upNext.slice(0, 10).map((item) => (
                <VideoCardGrid key={item.id} item={item} className="mb-0" />
              ))}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
