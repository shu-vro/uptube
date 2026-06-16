import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import useSWR from 'swr';
import { ArrowBigDown, Flame } from 'lucide-react-native';
import VideoActions from '@/components/specific/VideoActions';
import { useRecordHistory } from '@/hooks/useRecordHistory';
import Constants from 'expo-constants';

import { Text } from '@/components/ui/text';
import VideoPlayer, { SettingsButton, VideoPlayerHandle } from '@/components/ui/video-player';
import { get } from '@/lib/utils/fetch';
import { Video } from '@/types/prisma';
import DownloadVideo from '@/components/specific/DownloadVideo';
import Sheet from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

type ShortsParams = {
  shortIds?: string | string[];
  ids?: string | string[];
  shortId?: string;
};

function parseIdsParam(value?: string | string[]) {
  if (!value) return [] as string[];

  const raw = Array.isArray(value) ? value.join(',') : value;
  if (!raw) return [] as string[];

  const trimmed = raw.trim();
  if (!trimmed) return [] as string[];

  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((v) => String(v).trim()).filter(Boolean);
      }
    } catch {
      // fallback to comma parser below
    }
  }

  return trimmed
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
}

function uniqueIds(ids: string[]) {
  return Array.from(new Set(ids));
}

export default function Shorts() {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<ShortsParams>();

  const [queueIds, setQueueIds] = useState<string[]>([]);
  const [videosById, setVideosById] = useState<Record<string, Video>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPip, setIsPip] = useState(false);
  const [openDownload, setOpenDownload] = useState(false);
  const [openQualitySheet, setOpenQualitySheet] = useState(false);
  const [selectedQualityById, setSelectedQualityById] = useState<Record<string, string>>({});
  const [controlsVisible, setControlsVisible] = useState(true);
  const [interactionBottom, setInteractionBottom] = useState('bottom-16');

  const playerRef = useRef<VideoPlayerHandle | null>(null);
  const randomFetchRef = useRef(false);
  const bootstrapRef = useRef(0);

  const fetchVideoById = useCallback(async (id: string) => {
    const video = await get({ endpoint: '/public/yt/video', params: { id } });
    return (video ?? null) as Video | null;
  }, []);

  const appendFromNextEdges = useCallback((video: Video) => {
    const nextIds = (video.nextEdges ?? [])
      .map((edge) => edge.toId)
      .filter((id): id is string => Boolean(id));

    if (!nextIds.length) return;

    setQueueIds((prev) => uniqueIds([...prev, ...nextIds]));
  }, []);

  const fetchRandomShort = useCallback(async () => {
    const data = await get({ endpoint: '/public/shorts/random' });
    const randomShort = (data?.shorts?.[0] ?? null) as Video | null;
    return randomShort;
  }, []);

  useEffect(() => {
    let cancelled = false;
    const bootId = ++bootstrapRef.current;

    const bootstrap = async () => {
      setIsBootstrapping(true);

      const paramIds = parseIdsParam(params.shortIds ?? params.ids);
      const selected = typeof params.shortId === 'string' ? params.shortId : '';

      let initialIds = uniqueIds(paramIds);
      if (selected) {
        initialIds = [selected, ...initialIds.filter((id) => id !== selected)];
      }

      if (initialIds.length > 0) {
        if (cancelled || bootId !== bootstrapRef.current) return;
        setQueueIds(initialIds);
        setVideosById({});
        setCurrentIndex(0);
        setIsBootstrapping(false);
        return;
      }

      const randomShort = await fetchRandomShort();
      if (cancelled || bootId !== bootstrapRef.current) return;

      if (!randomShort) {
        setQueueIds([]);
        setVideosById({});
        setCurrentIndex(0);
        setIsBootstrapping(false);
        return;
      }

      setQueueIds([randomShort.id]);
      setVideosById({ [randomShort.id]: randomShort });
      setCurrentIndex(0);
      appendFromNextEdges(randomShort);
      setIsBootstrapping(false);
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [appendFromNextEdges, fetchRandomShort, params.ids, params.shortId, params.shortIds]);

  const currentId = queueIds[currentIndex];
  const currentVideo = currentId ? videosById[currentId] : undefined;
  const nextId = queueIds[currentIndex + 1];

  useEffect(() => {
    if (!currentId || videosById[currentId]) return;

    let cancelled = false;
    (async () => {
      const video = await fetchVideoById(currentId);
      if (cancelled || !video) return;

      setVideosById((prev) => ({ ...prev, [currentId]: video }));
      appendFromNextEdges(video);
    })();

    return () => {
      cancelled = true;
    };
  }, [appendFromNextEdges, currentId, fetchVideoById, videosById]);

  useEffect(() => {
    if (!nextId || videosById[nextId]) return;
    let cancelled = false;

    (async () => {
      const video = await fetchVideoById(nextId);
      if (cancelled || !video) return;
      setVideosById((prev) => ({ ...prev, [nextId]: video }));
    })();

    return () => {
      cancelled = true;
    };
  }, [fetchVideoById, nextId, videosById]);

  useEffect(() => {
    if (queueIds.length === 0 || currentIndex < queueIds.length - 1 || randomFetchRef.current) {
      return;
    }

    randomFetchRef.current = true;
    (async () => {
      const randomShort = await fetchRandomShort();
      if (!randomShort) {
        randomFetchRef.current = false;
        return;
      }

      setVideosById((prev) => ({ ...prev, [randomShort.id]: prev[randomShort.id] ?? randomShort }));
      appendFromNextEdges(randomShort);
      setQueueIds((prev) => uniqueIds([...prev, randomShort.id]));
      randomFetchRef.current = false;
    })();
  }, [appendFromNextEdges, currentIndex, fetchRandomShort, queueIds]);

  useEffect(() => {
    if (!currentVideo) return;

    const heatmap = currentVideo.heatmap;
    const hasHeatMarkers =
      !!heatmap &&
      typeof heatmap === 'object' &&
      !Array.isArray(heatmap) &&
      'heat_markers' in heatmap;

    if (hasHeatMarkers) {
      setInteractionBottom('bottom-20');
    } else {
      setInteractionBottom('bottom-16');
    }

    if (currentVideo.available_qualities?.length === 0) return;
    setSelectedQualityById((prev) => {
      if (prev[currentVideo.id]) return prev;
      return { ...prev, [currentVideo.id]: currentVideo.available_qualities[0] };
    });
  }, [currentVideo]);

  const selectedQuality = useMemo(() => {
    if (!currentVideo) return '720p';
    return selectedQualityById[currentVideo.id] || currentVideo.available_qualities?.[0] || '720p';
  }, [currentVideo, selectedQualityById]);

  const { data: downloadData } = useSWR(
    currentVideo ? [`/download/video-audio/separate/${currentVideo.id}`, selectedQuality] : null,
    async ([url, quality]: [string, string]) => {
      const result = await get({
        endpoint: url,
        params: { quality },
        baseUrl: Constants.expoConfig?.extra?.UPTUBE_DOWNLOAD_API,
        overrideEncryptedResponsesOnly: true,
      });
      return result || null;
    }
  );

  const currentVideoId = queueIds[currentIndex];
  useRecordHistory(currentVideoId, 2000);

  const bottomSpace = insets.bottom + 80;
  const topSpace = insets.top;
  const fullscreenBottomOffset = isFullscreen ? Math.max(insets.bottom || 0, 24) : 0;
  const containerHeight = height - topSpace - bottomSpace;

  const onMomentumScrollEnd = useCallback(
    (event: { nativeEvent: { contentOffset: { y: number } } }) => {
      const next = Math.round(event.nativeEvent.contentOffset.y / containerHeight);
      if (next === currentIndex) return;
      playerRef.current?.pause();
      setCurrentIndex(next);
    },
    [currentIndex, containerHeight]
  );

  if (isBootstrapping) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  if (!queueIds.length) {
    return (
      <View className="flex-1 items-center justify-center bg-black px-6">
        <Text className="text-center text-base text-white/80">No shorts available right now.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black" style={{ paddingTop: topSpace }}>
      <View style={{ flex: 1 }}>
        <FlatList
          data={queueIds}
          keyExtractor={(id) => id}
          snapToInterval={containerHeight}
          snapToAlignment="start"
          decelerationRate="fast"
          contentContainerStyle={{ paddingBottom: bottomSpace }}
          initialNumToRender={2}
          maxToRenderPerBatch={2}
          windowSize={3}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          getItemLayout={(_, index) => ({
            length: containerHeight,
            offset: containerHeight * index,
            index,
          })}
          onMomentumScrollEnd={onMomentumScrollEnd}
          renderItem={({ item, index }) => {
            const video = videosById[item];
            const isActive = index === currentIndex;

            return (
              <View style={{ height: containerHeight }} className="bg-black">
                {isActive && video ? (
                  <View
                    className="w-full"
                    style={{
                      height: '100%',
                    }}>
                    {downloadData?.video_fmt?.url ? (
                      <VideoPlayer
                        ref={playerRef}
                        poster={video.thumbnails?.[0]?.url}
                        src={downloadData.video_fmt.url}
                        audioSrc={downloadData?.audio_fmt?.url}
                        style={{ width: '100%', height: '100%' }}
                        onFullScreenChange={setIsFullscreen}
                        onPipChange={setIsPip}
                        selectedQuality={selectedQuality}
                        setOpenQualitySheet={setOpenQualitySheet}
                        heatmap={video.heatmap as any}
                        chapters={(video.chapters as Video['chapters']) || []}
                        title={video.title}
                        description={video.short_description || undefined}
                        author={video.creator?.title || undefined}
                        skipSegments={video.sponsorblocks}
                        onControlsFade={setControlsVisible}
                      />
                    ) : (
                      <View className="h-full w-full items-center justify-center">
                        <ActivityIndicator size="large" color="white" />
                      </View>
                    )}

                    {!isFullscreen && !isPip && controlsVisible && (
                      <>
                        <View
                          className={cn(
                            `pointer-events-none absolute left-4 right-12 z-10`,
                            interactionBottom
                          )}
                          style={{ marginBottom: fullscreenBottomOffset }}>
                          <Text
                            className="text-base font-semibold text-white drop-shadow-md"
                            style={{
                              width: Dimensions.get('window').width - 120,
                            }}
                            numberOfLines={1}>
                            {video.title}
                          </Text>
                        </View>

                        <View
                          className={cn(
                            'absolute right-1 z-10 items-center justify-center gap-4',
                            interactionBottom
                          )}
                          style={{ marginBottom: fullscreenBottomOffset }}>
                          <Pressable className="mb-2 items-center" hitSlop={10}>
                            {video.creator?.avatars?.[0]?.url ? (
                              <Image
                                source={{ uri: video.creator.avatars[0].url }}
                                className="h-10 w-10 rounded-full border border-white/20"
                              />
                            ) : (
                              <View className="h-10 w-10 rounded-full border border-white/20 bg-white/20" />
                            )}
                          </Pressable>
                          <VideoActions
                            video={video}
                            variant="overlay"
                            onDownload={() => setOpenDownload(true)}
                          />
                        </View>
                      </>
                    )}
                  </View>
                ) : video?.thumbnails?.[0]?.url ? (
                  <Image source={{ uri: video.thumbnails[0].url }} className="h-full w-full" />
                ) : (
                  <View className="h-full w-full items-center justify-center">
                    <ActivityIndicator size="large" color="white" />
                  </View>
                )}
              </View>
            );
          }}
        />
      </View>

      {currentVideo && (
        <DownloadVideo
          open={openDownload}
          setOpen={setOpenDownload}
          videoId={currentVideo.id}
          availableQualities={currentVideo.available_qualities || []}
          videoTitle={currentVideo.title}
          authorName={currentVideo.creator?.title || 'unknown artist'}
        />
      )}

      {currentVideo && (
        <Sheet open={openQualitySheet} onClose={() => setOpenQualitySheet(false)}>
          <Text variant="h3">Available Qualities</Text>
          {currentVideo.available_qualities?.map((q) => (
            <SettingsButton
              key={q}
              Icon={Flame}
              label={q}
              selectedText={selectedQuality === q ? 'Selected' : ' '}
              onPress={() => {
                setSelectedQualityById((prev) => ({ ...prev, [currentVideo.id]: q }));
                setOpenQualitySheet(false);
              }}
            />
          ))}
        </Sheet>
      )}
    </View>
  );
}
