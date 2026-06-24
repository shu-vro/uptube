import React, { useEffect, useRef } from 'react';
import {
  View,
  ActivityIndicator,
  Pressable,
  Image,
  FlatList,
  TouchableOpacity,
  InteractionManager,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Flame, Home } from 'lucide-react-native';
import { useState, useCallback } from 'react';

import { Text } from '@/components/ui/text';
import { put } from '@/lib/utils/fetch';
import { Video } from '@/types/prisma';
import { useColorScheme } from 'nativewind';
import { THEME } from '@/lib/theme';
import VideoPlayer, { SettingsButton, VideoPlayerHandle } from '@/components/ui/video-player';
import {
  miniNumber,
  distanceFromToday,
  twoDateDifference,
  formatTime,
} from '@/lib/utils/number-format';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import VideoActions from '@/components/specific/VideoActions';
import { useRecordHistory } from '@/hooks/useRecordHistory';
import {
  usePlayUrls,
  INITIAL_PLAYBACK_QUALITY,
  normalizeVideoId,
  type PlayUrls,
} from '@/hooks/usePlayUrls';
import { useVideoDetails } from '@/hooks/useVideoDetails';
import { VideoCardGrid } from '@/components/specific/Search';
import { TranscriptViewer } from '@/components/specific/TranscriptViewer';
import Sheet from '@/components/ui/sheet';
import { SwipableTabs } from '@/components/ui/swipable-tabs';
import { BottomSheetContainer } from '@/components/ui/bottom-sheet-container';
import { X } from 'lucide-react-native';
import axios from 'axios';
import { ISponsorBlockSegment } from '@/types/sponsorblock';
import DownloadVideo from '@/components/specific/DownloadVideo';

export default function VideoDetailScreen() {
  const {
    id: rawId,
    previewTitle,
    previewThumbnail,
  } = useLocalSearchParams<{
    id: string;
    previewTitle?: string;
    previewThumbnail?: string;
  }>();
  const id = normalizeVideoId(rawId);
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const colors = THEME[colorScheme ?? 'light'];
  const [isPlayerFullscreen, setIsPlayerFullscreen] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isTranscriptSheetOpen, setIsTranscriptSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TranscriptToggleType>(null);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [selectedQuality, setSelectedQuality] = useState(INITIAL_PLAYBACK_QUALITY);
  const videoPlayerRef = useRef<VideoPlayerHandle | null>(null);

  const [isPip, setIsPip] = useState(false);

  const onPipChange = useCallback((isActive: boolean) => {
    setIsPip(isActive);
  }, []);

  const onFullScreenChange = useCallback((isFullscreen: boolean) => {
    setIsPlayerFullscreen(isFullscreen);
  }, []);

  const handleCurrentTimeChange = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handleSeek = useCallback((time: number) => {
    videoPlayerRef.current?.seek(time);
  }, []);

  const handleTranscriptToggle = useCallback<VideoComponentProps['onTranscriptToggle']>((type) => {
    setIsTranscriptSheetOpen(!!type);
    if (type) {
      setActiveTab(type);
    }
  }, []);

  // Pause when navigating away so old audio doesn't bleed into the new video
  useFocusEffect(
    useCallback(() => {
      return () => {
        videoPlayerRef.current?.pause();
      };
    }, [])
  );

  // Playback URLs fire immediately from video id — never wait on metadata.
  const { data: downloadData } = usePlayUrls(id, selectedQuality);

  // Basic metadata first; extended (next videos, captions, chapters) loads in parallel.
  const { video, basic, extended, isLoading, error, mutateBasic } = useVideoDetails(id);

  useRecordHistory(id);

  const dislikesFetchInFlightRef = useRef<string | null>(null);
  const sponsorFetchInFlightRef = useRef<string | null>(null);

  useEffect(() => {
    if (!basic) return;

    const task = InteractionManager.runAfterInteractions(() => {
      (async () => {
        const shouldRefreshDislikes =
          twoDateDifference(new Date(), new Date(basic.extra?.last_disliked_at || 0)) >= 3;
        if (shouldRefreshDislikes && dislikesFetchInFlightRef.current !== basic.id) {
          dislikesFetchInFlightRef.current = basic.id;
          try {
            const dislikes = await axios.get(
              `https://returnyoutubedislikeapi.com/votes?videoId=${basic.id}`
            );

            mutateBasic((current) => {
              if (!current) return current;
              return {
                ...current,
                dislike_count: dislikes.data.dislikes,
                extra: { ...current.extra, last_disliked_at: Date.now() },
              };
            }, false);
            try {
              await put({
                endpoint: `/public/yt/update-dislikes/${basic.id}`,
                params: { dislike_count: dislikes.data.dislikes },
                throwable: true,
              });
            } catch {}
          } catch (error: any) {
            if (error.status !== 200) {
              if (error.status === 429) {
                return;
              }
              return console.log('[RETURNYOUTUBEDISLIKEAPI]: Failed to fetch dislike count');
            }
          } finally {
            dislikesFetchInFlightRef.current = null;
          }
        }
        const shouldRefreshSponsorBlock =
          !basic.sponsorblocks?.length &&
          twoDateDifference(new Date(), new Date(basic.extra?.last_sponsorblock_at || 0)) >= 3;
        if (shouldRefreshSponsorBlock && sponsorFetchInFlightRef.current !== basic.id) {
          sponsorFetchInFlightRef.current = basic.id;
          try {
            const sponsorBlocks = await axios.get(
              `https://sponsor.ajay.app/api/skipSegments?videoID=${basic.id}`
            );

            const sponsorData = sponsorBlocks.data.map((s: ISponsorBlockSegment) => ({
              category: s.category,
              start: Math.trunc(s.segment[0]) || 0,
              end: Math.trunc(s.segment[1]) || 0,
            }));

            mutateBasic((current) => {
              if (!current) return current;
              return {
                ...current,
                sponsorblocks: sponsorData,
                extra: { ...current.extra, last_sponsorblock_at: Date.now() },
              };
            }, false);
          } catch (error: any) {
            if (error?.status !== 200) {
              if (error?.status === 404) {
                return console.log('[SPONSORBLOCK]: Video not found on SponsorBlock', basic.id);
              }
              if (error?.status === 400) {
                return console.log('[SPONSORBLOCK]: Bad Request', basic.id);
              }
              return;
            }
          } finally {
            sponsorFetchInFlightRef.current = null;
          }
        }
      })();
    });

    return () => task.cancel();
  }, [basic, mutateBasic]);

  const showBlockingLoader = isLoading && !basic && !previewThumbnail;

  if (showBlockingLoader) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if ((error || !basic) && !previewThumbnail) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center px-4">
          <Text variant="h3" className="mb-2">
            Video Not Found
          </Text>
          <Text variant="muted" className="text-center">
            Could not load video details. Please try again.
          </Text>
          <Pressable onPress={() => router.back()} className="mt-4 rounded-lg bg-primary px-6 py-3">
            <Text className="font-semibold text-primary-foreground">Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const displayTitle = basic?.title || video?.title || previewTitle || 'Video';
  const displayThumbnail =
    basic?.thumbnails?.[0]?.url || video?.thumbnails?.[0]?.url || previewThumbnail || undefined;
  const nextEdges = extended?.nextEdges ?? video?.nextEdges ?? [];
  const detailsVideo = video ?? basic;

  return (
    <SafeAreaView
      style={{ flex: 1 }}
      className="flex-1 bg-background"
      edges={isPlayerFullscreen || isPip ? [] : ['top']}>
      {!isPlayerFullscreen && !isPip && (
        <View
          className="flex-row items-center border-b border-border px-4 py-3"
          onLayout={(event) => {
            const { height } = event.nativeEvent.layout;
            setHeaderHeight(height);
          }}>
          <Pressable
            onPress={() => router.back()}
            className="mr-3 rounded-full p-2 active:bg-muted">
            <ArrowLeft size={24} color={colors.foreground} />
          </Pressable>
          <Text variant="h4" numberOfLines={1} className="flex-1 text-center">
            {displayTitle}
          </Text>
          {/* <View className="grow flex-row items-center justify-center gap-2">
            <Logo width={32} height={32} color={THEME[colorScheme ?? 'light'].foreground} />
            <Text variant="h3">Uptube</Text>
          </View> */}

          <Pressable
            onPress={() => router.push('/')}
            className="mr-0 rounded-full p-2 active:bg-muted">
            <Home size={24} color={colors.foreground} />
          </Pressable>
        </View>
      )}

      <VideoComponentFull
        videoId={id}
        isPlayerFullscreen={isPlayerFullscreen}
        isPip={isPip}
        video={detailsVideo}
        downloadData={downloadData}
        selectedQuality={selectedQuality}
        setSelectedQuality={setSelectedQuality}
        displayThumbnail={displayThumbnail}
        isPaused={videoPlayerRef.current?.isPaused}
        onFullScreenChange={onFullScreenChange}
        onPipChange={onPipChange}
        onCurrentTimeChange={handleCurrentTimeChange}
        onSeek={handleSeek}
        videoPlayerRef={videoPlayerRef}
        isTranscriptSheetOpen={isTranscriptSheetOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onTranscriptToggle={handleTranscriptToggle}
        currentTime={currentTime}
        headerHeight={headerHeight}
      />

      {!isPlayerFullscreen && !isPip && (
        <FlatList
          className="flex-1"
          data={nextEdges}
          keyExtractor={(item) => item.toId}
          renderItem={({ item }) => (
            <View className="px-4">
              <VideoCardGrid item={item.to!} />
            </View>
          )}
          ListHeaderComponent={
            basic ? (
              <View className="p-4">
                <Text variant="h3" className="mb-2 font-bold leading-tight">
                  {basic.title}
                </Text>

                <View className="mb-4 flex-row flex-wrap items-center">
                  <Text variant="muted" className="text-sm">
                    {miniNumber(Number(basic.view_count) || 0)} views
                  </Text>
                  <Text variant="muted" className="mx-2 text-sm">
                    •
                  </Text>
                  <Text variant="muted" className="text-sm">
                    {distanceFromToday(basic.trulyCreatedAt.toString())}
                  </Text>
                </View>

                {/* Actions */}
                <VideoActions video={basic} onDownload={() => setDownloadModalOpen(true)} />

                {basic?.creator && (
                  <Pressable
                    onPress={() => router.push(`/creator/${basic.creator!.id}`)}
                    className="mb-6 flex-row items-center justify-between border-y border-border py-3 active:opacity-80">
                    <View className="mr-4 flex-1 flex-row items-center">
                      {basic.creator.avatars &&
                      Array.isArray(basic.creator.avatars) &&
                      basic.creator.avatars[0]?.url ? (
                        <View className="mr-3 size-10 overflow-hidden rounded-full bg-muted">
                          <Image
                            source={{ uri: basic.creator.avatars[0].url }}
                            style={{ width: 40, height: 40 }}
                          />
                        </View>
                      ) : (
                        <View className="mr-3 size-10 rounded-full bg-muted" />
                      )}
                      <View className="flex-1">
                        <Text className="text-base font-semibold" numberOfLines={1}>
                          {basic.creator.title}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                )}

                <View className="mb-6 rounded-xl bg-muted p-3">
                  <Text className="mb-2 font-bold">Description</Text>
                  <Text
                    variant="default"
                    numberOfLines={isDescriptionExpanded ? undefined : 2}
                    className="text-sm italic leading-5">
                    {basic.short_description || 'No description available.'}
                  </Text>
                  <Pressable
                    onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="mt-2 flex-row items-center">
                    <Text className="mr-1 text-sm font-bold">
                      {isDescriptionExpanded ? 'Show less' : 'Show more'}
                    </Text>
                    {isDescriptionExpanded ? (
                      <ChevronUp size={16} color={colors.foreground} />
                    ) : (
                      <ChevronDown size={16} color={colors.foreground} />
                    )}
                  </Pressable>
                </View>

                <Text variant="h4" className="mb-4 font-bold">
                  Up Next
                </Text>
              </View>
            ) : (
              <View className="items-center p-8">
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            )
          }
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
      {basic ? (
        <DownloadVideo
          open={downloadModalOpen}
          setOpen={setDownloadModalOpen}
          videoId={id!}
          availableQualities={basic.available_qualities}
          videoTitle={basic.title}
          authorName={basic.creator?.title || 'unknown artist'}
        />
      ) : null}
    </SafeAreaView>
  );
}

type TranscriptToggleType = 'CHAPTER' | 'TRANSCRIPT' | null;

export type VideoComponentProps = {
  videoId?: string;
  isPlayerFullscreen: boolean;
  isPip: boolean;
  video?: Video;
  downloadData?: PlayUrls | null;
  selectedQuality: string;
  setSelectedQuality: (quality: string) => void;
  displayThumbnail?: string;
  onFullScreenChange: (isFullscreen: boolean) => void;
  onPipChange: (isActive: boolean) => void;
  onCurrentTimeChange: (time: number) => void;
  onSeek: (time: number) => void;
  isPaused?: () => boolean;
  videoPlayerRef: React.RefObject<VideoPlayerHandle | null>;
  isTranscriptSheetOpen: boolean;
  activeTab: TranscriptToggleType;
  setActiveTab: (tab: TranscriptToggleType) => void;
  onTranscriptToggle: (type: TranscriptToggleType) => void;
  currentTime: number;
  headerHeight: number;
};

function VideoComponentFull({
  videoId,
  isPlayerFullscreen,
  isPip,
  video,
  downloadData,
  selectedQuality,
  setSelectedQuality,
  displayThumbnail,
  onFullScreenChange,
  onPipChange,
  onCurrentTimeChange,
  onSeek,
  isPaused,
  videoPlayerRef,
  isTranscriptSheetOpen,
  activeTab,
  setActiveTab,
  onTranscriptToggle,
  currentTime,
  headerHeight,
}: VideoComponentProps) {
  const [openQualitySheet, setOpenQualitySheet] = useState(false);
  const [videoHeight, setVideoHeight] = useState(0);
  const videoRef = useRef<VideoPlayerHandle>(null);
  const { colorScheme } = useColorScheme();
  const colors = THEME[colorScheme ?? 'light'];
  const lockedPlaybackRef = useRef<{
    videoId: string;
    quality: string;
    videoUrl?: string;
    audioUrl?: string;
  } | null>(null);

  if (videoId && downloadData?.video_fmt?.url) {
    const locked = lockedPlaybackRef.current;
    if (!locked || locked.videoId !== videoId || locked.quality !== selectedQuality) {
      lockedPlaybackRef.current = {
        videoId,
        quality: selectedQuality,
        videoUrl: downloadData.video_fmt.url,
        audioUrl: downloadData.audio_fmt?.url,
      };
    } else if (!locked.videoUrl) {
      locked.videoUrl = downloadData.video_fmt.url;
      locked.audioUrl = downloadData.audio_fmt?.url;
    }
  }

  const locked = lockedPlaybackRef.current;
  const playbackVideoUrl =
    locked && locked.videoId === videoId && locked.quality === selectedQuality
      ? locked.videoUrl
      : downloadData?.video_fmt?.url;
  const playbackAudioUrl =
    locked && locked.videoId === videoId && locked.quality === selectedQuality
      ? locked.audioUrl
      : downloadData?.audio_fmt?.url;

  // Expose all handle methods to parent
  useEffect(() => {
    videoPlayerRef.current = {
      seek: (time: number) => {
        videoRef.current?.seek(time);
      },
      isPaused: () => {
        return videoRef.current?.isPaused() ?? false;
      },
      pause: () => {
        videoRef.current?.pause();
      },
      resume: () => {
        videoRef.current?.resume();
      },
    };
  }, [videoPlayerRef]);

  const tabs = video
    ? [
        {
          key: 'TRANSCRIPT',
          title: 'Transcripts',
          component: (
            <TranscriptViewer
              captions={(video.captions as any) || []}
              currentTime={currentTime}
              onSeek={onSeek}
              isPaused={isPaused}
            />
          ),
        },
        {
          key: 'CHAPTER',
          title: 'Chapters',
          component: (
            <FlatList
              data={(video.chapters as any[]) || []}
              keyExtractor={(item) => item.title + item.start}
              renderItem={({ item }) => {
                const isActive = currentTime >= item.start && currentTime < item.end;
                return (
                  <Pressable
                    onPress={() => onSeek(item.start)}
                    className={`flex-row items-center border-b border-border p-4 ${
                      isActive ? 'bg-primary/20' : ''
                    }`}>
                    <Image
                      source={{ uri: video.thumbnails?.[0]?.url }}
                      className="mr-3 h-16 w-28 rounded-md bg-muted"
                      resizeMode="cover"
                    />
                    <View className="flex-1">
                      <Text
                        className={`font-semibold ${isActive ? 'text-primary' : 'text-foreground'}`}>
                        {item.title}
                      </Text>
                      <Text className="text-xs text-muted-foreground">
                        {formatTime(item.start)}
                      </Text>
                    </View>
                  </Pressable>
                );
              }}
            />
          ),
        },
      ]
    : [];

  return (
    <>
      <View
        className={
          isPlayerFullscreen || isPip
            ? 'h-full w-full flex-1 bg-black'
            : 'aspect-video w-full bg-black'
        }
        onLayout={(event) => {
          if (!isPlayerFullscreen && !isPip) {
            const { height } = event.nativeEvent.layout;
            setVideoHeight(height);
          }
        }}>
        <VideoPlayer
          ref={videoRef}
          poster={displayThumbnail || video?.thumbnails?.[0]?.url}
          src={playbackVideoUrl ?? ''}
          audioSrc={playbackAudioUrl}
          style={{ width: '100%', height: '100%' }}
          onFullScreenChange={onFullScreenChange}
          onPipChange={onPipChange}
          onCurrentTimeChange={onCurrentTimeChange}
          selectedQuality={selectedQuality}
          setOpenQualitySheet={setOpenQualitySheet}
          onTranscriptToggle={onTranscriptToggle}
          heatmap={video?.heatmap as any}
          chapters={(video?.chapters as Video['chapters']) || []}
          title={video?.title}
          description={video?.short_description || undefined}
          author={video?.creator?.title || undefined}
          skipSegments={video?.sponsorblocks}
        />
      </View>
      <Sheet open={openQualitySheet} onClose={() => setOpenQualitySheet(false)}>
        <Text variant="h3">Available Qualities</Text>
        {video?.available_qualities?.map((q) => (
          <SettingsButton
            key={q}
            Icon={Flame}
            label={q}
            selectedText=" "
            onPress={() => {
              setSelectedQuality(q);
              setOpenQualitySheet(false);
            }}
          />
        ))}
      </Sheet>

      {!isPlayerFullscreen && !isPip && video && tabs.length > 0 && (
        <BottomSheetContainer
          isOpen={isTranscriptSheetOpen}
          headerHeight={headerHeight}
          videoHeight={videoHeight}
          onClose={() => onTranscriptToggle(null)}>
          <View className="flex-1 px-4" style={{ backgroundColor: colors.border }}>
            {/* Header with Close Button */}
            <View className="flex-row items-center justify-between py-2">
              <View />
              <TouchableOpacity
                onPress={() => {
                  onTranscriptToggle(null);
                  setActiveTab(null);
                }}
                className="rounded-full bg-muted p-1">
                <X size={20} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            {/* Tabs */}
            <SwipableTabs
              key={activeTab || 'TRANSCRIPT'}
              tabs={tabs}
              initialTabKey={activeTab || 'TRANSCRIPT'}
              onTabChange={(key) => {
                setActiveTab(key as TranscriptToggleType);
              }}
            />
          </View>
        </BottomSheetContainer>
      )}
    </>
  );
}
