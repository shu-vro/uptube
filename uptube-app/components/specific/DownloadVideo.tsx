import { View, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { Text } from '@/components/ui/text';
import Sheet from '@/components/ui/sheet';
import React, { useState } from 'react';
import { SettingsButton } from '../ui/video-player';
import { Download, CheckCircle2, XCircle, Music, Video } from 'lucide-react-native';
import { File, Paths } from 'expo-file-system';
import { createDownloadResumable } from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import Constants from 'expo-constants';
import { useColorScheme } from 'nativewind';
import { THEME } from '@/lib/theme';

type DownloadVideoProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  videoId: string;
  videoTitle: string;
  authorName?: string;
  availableQualities: string[];
};

type DownloadStatus = 'idle' | 'downloading' | 'done' | 'error';
type DownloadMode = 'video' | 'audio';

/** Remove characters that are illegal in filenames */
function sanitizeFilename(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'video';
}

export default function DownloadVideo({
  open,
  setOpen,
  videoId,
  videoTitle,
  authorName,
  availableQualities,
}: DownloadVideoProps) {
  const [mode, setMode] = useState<DownloadMode>('video');
  const [activeQuality, setActiveQuality] = useState<string | null>(null);
  const [progress, setProgress] = useState(0); // 0-100
  const [status, setStatus] = useState<DownloadStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const { colorScheme } = useColorScheme();
  const colors = THEME[colorScheme ?? 'light'];

  const downloadBase = (Constants.expoConfig?.extra?.UPTUBE_DOWNLOAD_API as string) + '/api/v1';

  const handleVideoDownload = async (quality: string) => {
    if (status === 'downloading') return;

    setActiveQuality(quality);
    setStatus('downloading');
    setProgress(0);
    setErrorMsg('');

    const filename = `${sanitizeFilename(videoTitle)}_${quality}.mp4`;
    const tempFile = new File(Paths.cache, filename);

    try {
      const { status: permStatus } = await MediaLibrary.requestPermissionsAsync();
      if (permStatus !== 'granted') throw new Error('Media library permission denied');

      // Resolve a direct muxed media URL first. This is much more reliable for
      // client-side saving than the ffmpeg pipe stream endpoint.
      const infoRes = await fetch(
        `${downloadBase}/download/video-audio/${videoId}?quality=${quality}`
      );
      if (!infoRes.ok) throw new Error(`Video info fetch failed: ${infoRes.status}`);
      const infoJson = await infoRes.json();
      const url: string = infoJson?.data?.url ?? infoJson?.url;
      if (!url) throw new Error('No downloadable video URL returned from server');

      const dl = createDownloadResumable(
        url,
        tempFile.uri,
        { headers: { 'X-Platform': Platform.OS } },
        ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
          if (totalBytesExpectedToWrite > 0) {
            setProgress(Math.round((totalBytesWritten / totalBytesExpectedToWrite) * 90));
          }
        }
      );

      const result = await dl.downloadAsync();
      if (!result || result.status !== 200)
        throw new Error(`Server responded with ${result?.status ?? 'unknown'}`);

      setProgress(93);

      // Save to gallery under "uptube/videos" album
      const asset = await MediaLibrary.createAssetAsync(tempFile.uri);
      await MediaLibrary.createAlbumAsync('uptube-videos', asset, false);

      setProgress(100);
      setStatus('done');
    } catch (err: any) {
      setErrorMsg(err?.message ?? 'Download failed');
      setStatus('error');
    } finally {
      if (tempFile.exists) tempFile.delete();
    }
  };

  const handleAudioDownload = async () => {
    if (status === 'downloading') return;

    setActiveQuality('audio');
    setStatus('downloading');
    setProgress(0);
    setErrorMsg('');

    const filename = `${sanitizeFilename(videoTitle)}.m4a`;
    // Audio files are saved to the app's Documents directory (accessible via Files
    // app on iOS; on Android we also try to add to a MediaLibrary album).
    const destFile = new File(Paths.document, filename);

    try {
      // Step 1: Resolve the audio stream URL from the download server
      const infoRes = await fetch(`${downloadBase}/download/audio/${videoId}`);
      if (!infoRes.ok) throw new Error(`Audio info fetch failed: ${infoRes.status}`);
      const infoJson = await infoRes.json();
      const audioUrl: string = infoJson?.data?.url ?? infoJson?.url;
      if (!audioUrl) throw new Error('No audio URL returned from server');

      setProgress(5);

      // Step 2: Download the audio stream to Documents
      const dl = createDownloadResumable(
        audioUrl,
        destFile.uri,
        {},
        ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
          if (totalBytesExpectedToWrite > 0) {
            setProgress(5 + Math.round((totalBytesWritten / totalBytesExpectedToWrite) * 90));
          }
        }
      );

      const result = await dl.downloadAsync();
      if (!result || result.status !== 200)
        throw new Error(`Audio download failed: ${result?.status ?? 'unknown'}`);

      setProgress(97);

      // Step 3: On Android, also add to a media album so it shows in music apps
      if (Platform.OS === 'android') {
        try {
          const { status: permStatus } = await MediaLibrary.requestPermissionsAsync();
          if (permStatus === 'granted') {
            const asset = await MediaLibrary.createAssetAsync(destFile.uri);
            await MediaLibrary.createAlbumAsync('uptube-audio', asset, false);
          }
        } catch {
          // Non-fatal — file is already saved to Documents
        }
      }

      setProgress(100);
      setStatus('done');
    } catch (err: any) {
      setErrorMsg(err?.message ?? 'Audio download failed');
      setStatus('error');
      if (destFile.exists) destFile.delete();
    }
  };

  const reset = () => {
    setStatus('idle');
    setActiveQuality(null);
    setProgress(0);
    setErrorMsg('');
  };

  const isDownloading = status === 'downloading';

  return (
    <Sheet
      open={open}
      onClose={() => {
        // Allow closing the sheet while a download is in progress.
        // The download keeps running; users can reopen to inspect status.
        setOpen(false);
        if (!isDownloading) {
          reset();
        }
      }}>
      <Text variant="h2" className="mb-3">
        Download
      </Text>

      {/* Mode toggle */}
      <View className="mb-4 flex-row overflow-hidden rounded-xl bg-muted">
        {(['video', 'audio'] as DownloadMode[]).map((m) => (
          <TouchableOpacity
            key={m}
            disabled={isDownloading}
            onPress={() => {
              reset();
              setMode(m);
            }}
            className={`flex-1 flex-row items-center justify-center gap-2 py-2.5 ${
              mode === m ? 'rounded-xl bg-primary' : ''
            }`}>
            {m === 'video' ? (
              <Video size={16} color={mode === m ? colors.primaryForeground : colors.foreground} />
            ) : (
              <Music size={16} color={mode === m ? colors.primaryForeground : colors.foreground} />
            )}
            <Text
              className={`text-sm font-semibold capitalize ${
                mode === m ? 'text-primary-foreground' : 'text-foreground'
              }`}>
              {m}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Status feedback */}
      {status === 'downloading' && (
        <View className="mb-4 items-center gap-2">
          <ActivityIndicator size="small" />
          <Text className="text-sm text-muted-foreground">
            {mode === 'audio' ? 'Downloading audio' : `Downloading ${activeQuality}`}
            {progress > 0 ? ` — ${progress}%` : '…'}
          </Text>
          {progress > 0 && (
            <View className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <View className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
            </View>
          )}
        </View>
      )}

      {status === 'done' && (
        <View className="mb-4 flex-row items-center gap-2">
          <CheckCircle2 size={18} color="#22c55e" />
          <Text className="flex-1 text-sm text-green-500">
            {mode === 'audio'
              ? 'Audio saved to app Documents folder.'
              : 'Video saved to "uptube-videos" album in your gallery.'}
          </Text>
        </View>
      )}

      {status === 'error' && (
        <View className="mb-4 flex-row items-center gap-2">
          <XCircle size={18} color="#ef4444" />
          <Text className="flex-1 text-sm text-red-500">{errorMsg}</Text>
        </View>
      )}

      {/* Audio mode — single download button */}
      {mode === 'audio' && (
        <SettingsButton
          Icon={Music}
          label="Download Audio (.m4a)"
          selectedText={activeQuality === 'audio' && isDownloading ? `${progress}%` : ' '}
          onPress={handleAudioDownload}
        />
      )}

      {/* Video mode — one button per quality */}
      {mode === 'video' &&
        availableQualities?.map((q) => (
          <SettingsButton
            key={q}
            Icon={Download}
            label={q}
            selectedText={activeQuality === q && isDownloading ? `${progress}%` : ' '}
            onPress={() => handleVideoDownload(q)}
          />
        ))}
    </Sheet>
  );
}
