"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Maximize,
  Minimize,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { formatTime } from "@/lib/format";

type VideoPlayerProps = {
  videoUrl?: string;
  audioUrl?: string | null;
  poster?: string;
  qualities?: string[];
  selectedQuality?: string;
  onQualityChange?: (q: string) => void;
  onTimeUpdate?: (time: number) => void;
  className?: string;
};

export function VideoPlayer({
  videoUrl,
  audioUrl,
  poster,
  qualities = [],
  selectedQuality,
  onQualityChange,
  onTimeUpdate,
  className,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const syncAudio = useCallback((time: number) => {
    const audio = audioRef.current;
    if (audio && Math.abs(audio.currentTime - time) > 0.3) {
      audio.currentTime = time;
    }
  }, []);

  useEffect(() => {
    setPlaying(false);
    setCurrentTime(0);
  }, [videoUrl, audioUrl]);

  const togglePlay = () => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video) return;

    if (playing) {
      video.pause();
      audio?.pause();
      setPlaying(false);
    } else {
      void video.play();
      if (audioUrl && audio) void audio.play();
      setPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
    syncAudio(video.currentTime);
    onTimeUpdate?.(video.currentTime);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    const video = videoRef.current;
    const audio = audioRef.current;
    if (video) video.currentTime = time;
    if (audio) audio.currentTime = time;
    setCurrentTime(time);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    const audio = audioRef.current;
    const next = !muted;
    if (video) video.muted = next;
    if (audio) audio.muted = next;
    setMuted(next);
  };

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      await el.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (!videoUrl) {
    return (
      <div
        className={cn(
          "flex aspect-video items-center justify-center bg-black",
          className,
        )}
      >
        {poster && (
          <img
            src={poster}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-50"
          />
        )}
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("group relative aspect-video bg-black", className)}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        poster={poster}
        className="h-full w-full"
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration ?? 0)}
        onClick={togglePlay}
        muted={muted || !!audioUrl}
      />
      {audioUrl && <audio ref={audioRef} src={audioUrl} />}

      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={togglePlay}
          className="rounded-full bg-black/50 p-4 text-white"
        >
          {playing ? (
            <Pause className="h-8 w-8" />
          ) : (
            <Play className="h-8 w-8" />
          )}
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
        <input
          type="range"
          min={0}
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className="mb-2 w-full accent-primary"
        />
        <div className="flex items-center justify-between gap-2 text-xs text-white">
          <div className="flex items-center gap-2">
            <button type="button" onClick={togglePlay}>
              {playing ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </button>
            <button type="button" onClick={toggleMute}>
              {muted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>
            <span>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {qualities.length > 0 && onQualityChange && (
              <select
                value={selectedQuality}
                onChange={(e) => onQualityChange(e.target.value)}
                className="rounded bg-black/50 px-2 py-1 text-white"
              >
                {qualities.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            )}
            <button type="button" onClick={toggleFullscreen}>
              {isFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
