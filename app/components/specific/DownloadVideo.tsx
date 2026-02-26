import { View, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui/text';
import Sheet from '@/components/ui/sheet';
import React, { useState } from 'react';
import { SettingsButton } from '../ui/video-player';
import { Download, CheckCircle2, XCircle } from 'lucide-react-native';
import { File, Paths } from 'expo-file-system';
import { createDownloadResumable } from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import Constants from 'expo-constants';

type DownloadVideoProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  videoId: string;
  videoTitle: string;
  availableQualities: string[];
};

type DownloadStatus = 'idle' | 'downloading' | 'done' | 'error';

/** Remove characters that are illegal in filenames */
function sanitizeFilename(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'video';
}

export default function DownloadVideo({
  open,
  setOpen,
  videoId,
  videoTitle,
  availableQualities,
}: DownloadVideoProps) {
  const [activeQuality, setActiveQuality] = useState<string | null>(null);
  const [progress, setProgress] = useState(0); // 0-100
  const [status, setStatus] = useState<DownloadStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleDownload = async (quality: string) => {
    if (status === 'downloading') return;

    setActiveQuality(quality);
    setStatus('downloading');
    setProgress(0);
    setErrorMsg('');

    const filename = `${sanitizeFilename(videoTitle)}.mp4`;
    const tempFile = new File(Paths.cache, filename);

    try {
      // 1. Permissions
      const { status: permStatus } = await MediaLibrary.requestPermissionsAsync();
      if (permStatus !== 'granted') {
        throw new Error('Media library permission denied');
      }

      // 2. GET the backend streaming endpoint (query params — RN fetch has no ReadableStream support)
      const apiBase = Constants.expoConfig?.extra?.UPTUBE_API as string;
      const params = new URLSearchParams({ quality });
      const url = `${apiBase}/api/v1/public/yt/download-video/${videoId}?${params}`;

      const downloadResumable = createDownloadResumable(
        url,
        tempFile.uri,
        {
          headers: {
            'X-App-Version': Constants.expoConfig?.version ?? 'unknown',
            'X-Platform': 'android',
          },
        },
        ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
          if (totalBytesExpectedToWrite > 0) {
            setProgress(Math.round((totalBytesWritten / totalBytesExpectedToWrite) * 90));
          }
        }
      );

      const result = await downloadResumable.downloadAsync();
      if (!result || result.status !== 200) {
        throw new Error(`Server responded with ${result?.status ?? 'unknown'}`);
      }

      setProgress(93);

      // 4. Save to device media library under "uptube" album
      const asset = await MediaLibrary.createAssetAsync(tempFile.uri);
      await MediaLibrary.createAlbumAsync('uptube', asset, false);

      setProgress(100);
      setStatus('done');
    } catch (err: any) {
      setErrorMsg(err?.message ?? 'Download failed');
      setStatus('error');
    } finally {
      // Clean up temp cache file (idempotent)
      if (tempFile.exists) {
        tempFile.delete();
      }
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
        if (!isDownloading) {
          reset();
          setOpen(false);
        }
      }}>
      <Text variant="h2" className="mb-2">
        Download Video
      </Text>

      {/* Status feedback */}
      {status === 'downloading' && (
        <View className="mb-4 items-center gap-2">
          <ActivityIndicator size="small" />
          <Text className="text-sm text-muted-foreground">
            Downloading {activeQuality}
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
            Saved to "uptube" album in your device gallery.
          </Text>
        </View>
      )}

      {status === 'error' && (
        <View className="mb-4 flex-row items-center gap-2">
          <XCircle size={18} color="#ef4444" />
          <Text className="flex-1 text-sm text-red-500">{errorMsg}</Text>
        </View>
      )}

      {/* Quality options — disabled during active download */}
      {availableQualities?.map((q) => (
        <SettingsButton
          key={q}
          Icon={Download}
          label={q}
          selectedText={activeQuality === q && isDownloading ? `${progress}%` : ' '}
          onPress={() => handleDownload(q)}
        />
      ))}
    </Sheet>
  );
}
