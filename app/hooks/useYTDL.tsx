import { useState, useEffect, useCallback } from 'react';
import * as FileSystem from 'expo-file-system';
import {
  getInfo,
  download,
  getStreamUrls,
  addProgressListener,
  YTDLInfo,
  YTDLFormat,
  YTDLProgress,
} from '@/modules/uptube-ytdl';

interface UseYTDLResult {
  // Video Info
  videoInfo: YTDLInfo | null;
  loadingInfo: boolean;
  infoError: string | null;
  fetchVideoInfo: (url: string) => Promise<void>;

  // Streaming
  streamFormats: YTDLFormat[] | null;
  loadingFormats: boolean;
  formatsError: string | null;
  getStreamingFormats: (videoId: string) => Promise<void>;

  // Download
  downloading: boolean;
  downloadProgress: YTDLProgress | null;
  downloadError: string | null;
  downloadVideo: (url: string, format?: string) => Promise<string | null>;
}

export function useYTDL(): UseYTDLResult {
  const [videoInfo, setVideoInfo] = useState<YTDLInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [infoError, setInfoError] = useState<string | null>(null);

  const [streamFormats, setStreamFormats] = useState<YTDLFormat[] | null>(null);
  const [loadingFormats, setLoadingFormats] = useState(false);
  const [formatsError, setFormatsError] = useState<string | null>(null);

  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<YTDLProgress | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Listen to download progress
  useEffect(() => {
    const subscription = addProgressListener((event) => {
      setDownloadProgress(event);
      if (event.error) {
        setDownloadError(event.error);
        setDownloading(false);
      }
      // Download complete when progress reaches 100
      if (event.progress >= 100) {
        setDownloading(false);
      }
    });

    return () => subscription.remove();
  }, []);

  // Fetch video information
  const fetchVideoInfo = useCallback(async (url: string) => {
    setLoadingInfo(true);
    setInfoError(null);
    try {
      const info = await getInfo(url);
      setVideoInfo(info);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch video info';
      setInfoError(errorMessage);
      console.error('Error fetching video info:', error);
    } finally {
      setLoadingInfo(false);
    }
  }, []);

  // Get streaming formats
  const getStreamingFormats = useCallback(async (videoId: string) => {
    setLoadingFormats(true);
    setFormatsError(null);
    try {
      const formats = await getStreamUrls(videoId);
      setStreamFormats(formats);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch formats';
      setFormatsError(errorMessage);
      console.error('Error fetching formats:', error);
    } finally {
      setLoadingFormats(false);
    }
  }, []);

  // Download video
  const downloadVideo = useCallback(
    async (url: string, format?: string): Promise<string | null> => {
      setDownloading(true);
      setDownloadError(null);
      setDownloadProgress(null);

      try {
        // Create downloads directory if it doesn't exist
        // const downloadsURI = FileSystem.
        const downloadsDir = `${FileSystem.documentDirectory}downloads/`;
        const dirInfo = await FileSystem.getInfoAsync(downloadsDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(downloadsDir, { intermediates: true });
        }

        // Generate filename with timestamp
        const timestamp = Date.now();
        const outputPath = `${downloadsDir}video_${timestamp}.mp4`;

        // Default format: best mp4 with audio+video, or fallback to best available
        const formatSelector = format || 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best';

        await download(url, formatSelector, outputPath);

        return outputPath;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Download failed';
        setDownloadError(errorMessage);
        console.error('Error downloading video:', error);
        return null;
      } finally {
        setDownloading(false);
      }
    },
    []
  );

  return {
    videoInfo,
    loadingInfo,
    infoError,
    fetchVideoInfo,

    streamFormats,
    loadingFormats,
    formatsError,
    getStreamingFormats,

    downloading,
    downloadProgress,
    downloadError,
    downloadVideo,
  };
}

// Additional helper function to format file size
export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return 'Unknown';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

// Helper to get quality label from format
export function getQualityLabel(format: YTDLFormat): string {
  if (format.height) {
    return `${format.height}p`;
  }
  return format.resolution || 'Unknown';
}
