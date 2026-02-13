import { EventEmitter, NativeModule, requireNativeModule } from 'expo-modules-core';
import { YTDLFormat, YTDLInfo, YTDLProgress } from './src/types';

type UptubeYTDLEvents = {
  onProgress: (event: YTDLProgress) => void;
};

declare class UptubeYTDLModule extends NativeModule<UptubeYTDLEvents> {
  getInfo(url: string): Promise<string>;
  download(url: string, format: string, outputPath: string): Promise<void>;
}

const UptubeYTDL = requireNativeModule<UptubeYTDLModule>('UptubeYTDL');

export async function getInfo(url: string): Promise<YTDLInfo> {
  const jsonString = await UptubeYTDL.getInfo(url);
  return JSON.parse(jsonString);
}

export async function download(url: string, format: string, outputPath: string): Promise<void> {
  return await UptubeYTDL.download(url, format, outputPath);
}

export const addProgressListener = (listener: (event: YTDLProgress) => void) => {
  return UptubeYTDL.addListener('onProgress', listener);
};

export async function getStreamUrls(videoId: string): Promise<YTDLFormat[] | null> {
  const info = await getInfo(`https://www.youtube.com/watch?v=${videoId}`);
  // Find the best format with both audio and video
  const formats = info.formats
    .filter((f) => f.vcodec !== 'none' && f.acodec !== 'none' && f.url)
    .sort((a, b) => (b.height || 0) - (a.height || 0));

  return formats;
}

export * from './src/types';
