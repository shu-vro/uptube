/**
 * Example: How to use uptube-ytdl module in a component
 *
 * This demonstrates three main use cases:
 * 1. Getting video info
 * 2. Streaming video (getting playable URLs)
 * 3. Downloading video to device
 */

import React, { useEffect, useState } from 'react';
import { View, Text, Button, ActivityIndicator } from 'react-native';
import { useYTDL, formatFileSize, getQualityLabel } from '@/hooks/useYTDL';
import { YTDLFormat } from '@/modules/uptube-ytdl';

interface ExampleYTDLUsageProps {
  videoId: string;
}

export function ExampleYTDLUsage({ videoId }: ExampleYTDLUsageProps) {
  const {
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
  } = useYTDL();

  const [selectedFormat, setSelectedFormat] = useState<YTDLFormat | null>(null);

  // Fetch video info on mount
  useEffect(() => {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    fetchVideoInfo(url);
    getStreamingFormats(videoId);
  }, [videoId]);

  // Select best format automatically when formats load
  useEffect(() => {
    if (streamFormats && streamFormats.length > 0) {
      setSelectedFormat(streamFormats[0]); // Best quality
    }
  }, [streamFormats]);

  const handleDownload = async () => {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const filePath = await downloadVideo(url);

    if (filePath) {
      console.log('Video downloaded to:', filePath);
      // You can now play the downloaded file or show a success message
    }
  };

  return (
    <View style={{ padding: 20 }}>
      {/* Video Info Section */}
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>Video Information</Text>

      {loadingInfo && <ActivityIndicator />}
      {infoError && <Text style={{ color: 'red' }}>Error: {infoError}</Text>}

      {videoInfo && (
        <View style={{ marginBottom: 20 }}>
          <Text>Title: {videoInfo.title}</Text>
          <Text>Uploader: {videoInfo.uploader}</Text>
          <Text>
            Duration: {Math.floor(videoInfo.duration / 60)}:{videoInfo.duration % 60}
          </Text>
          <Text>Views: {videoInfo.view_count?.toLocaleString()}</Text>
        </View>
      )}

      {/* Streaming Formats Section */}
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>
        Available Formats (For Streaming)
      </Text>

      {loadingFormats && <ActivityIndicator />}
      {formatsError && <Text style={{ color: 'red' }}>Error: {formatsError}</Text>}

      {streamFormats && streamFormats.length > 0 && (
        <View style={{ marginBottom: 20 }}>
          {streamFormats.slice(0, 5).map((format, index) => (
            <View
              key={format.format_id}
              style={{
                padding: 10,
                marginBottom: 5,
                backgroundColor:
                  selectedFormat?.format_id === format.format_id ? '#e0e0e0' : '#f5f5f5',
              }}>
              <Text>
                {getQualityLabel(format)} - {format.extension.toUpperCase()} -{' '}
                {formatFileSize(format.filesize)}
              </Text>
              <Button title="Use This Format" onPress={() => setSelectedFormat(format)} />
            </View>
          ))}
        </View>
      )}

      {/* Selected Format Stream URL */}
      {selectedFormat && (
        <View style={{ marginBottom: 20, padding: 10, backgroundColor: '#e8f5e9' }}>
          <Text style={{ fontWeight: 'bold' }}>Selected Format URL:</Text>
          <Text numberOfLines={2} style={{ fontSize: 10 }}>
            {selectedFormat.url}
          </Text>
          <Text style={{ marginTop: 5, fontStyle: 'italic' }}>
            You can use this URL with react-native-video or any video player
          </Text>
        </View>
      )}

      {/* Download Section */}
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>Download Video</Text>

      {downloading && (
        <View style={{ marginBottom: 10 }}>
          <Text>Downloading: {downloadProgress?.progress.toFixed(1)}%</Text>
          <Text>ETA: {downloadProgress?.eta}s</Text>
          <Text style={{ fontSize: 10 }}>{downloadProgress?.line}</Text>
        </View>
      )}

      {downloadError && <Text style={{ color: 'red' }}>Error: {downloadError}</Text>}

      <Button
        title={downloading ? 'Downloading...' : 'Download Video'}
        onPress={handleDownload}
        disabled={downloading}
      />
    </View>
  );
}

// ========================================
// Quick Examples for Common Use Cases
// ========================================

/**
 * EXAMPLE 1: Just get the best stream URL for playing
 */
export async function getVideoStreamUrl(videoId: string): Promise<string | null> {
  const { getStreamUrls } = require('@/modules/uptube-ytdl');

  const formats = await getStreamUrls(videoId);
  if (formats && formats.length > 0) {
    return formats[0].url; // Best quality URL
  }
  return null;
}

/**
 * EXAMPLE 2: Download specific quality
 */
export async function downloadSpecificQuality(
  videoId: string,
  quality: '1080' | '720' | '480' | '360'
): Promise<string | null> {
  const { download } = require('@/modules/uptube-ytdl');
  const FileSystem = require('expo-file-system');

  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const format = `bestvideo[height<=${quality}][ext=mp4]+bestaudio[ext=m4a]/best[height<=${quality}]`;
  const outputPath = `${FileSystem.documentDirectory}video_${quality}p_${Date.now()}.mp4`;

  await download(url, format, outputPath);
  return outputPath;
}

/**
 * EXAMPLE 3: Get all available qualities
 */
export async function getAvailableQualities(videoId: string): Promise<string[]> {
  const { getStreamUrls } = require('@/modules/uptube-ytdl');

  const formats = await getStreamUrls(videoId);
  if (!formats) return [];

  const qualities = formats
    .map((f) => f.height)
    .filter((h): h is number => h !== null && h !== undefined)
    .filter((v, i, a) => a.indexOf(v) === i) // unique
    .sort((a, b) => b - a); // descending

  return qualities.map((q) => `${q}p`);
}
