import React, { useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Image,
  FlatList,
  Dimensions,
  StatusBar,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import useSWR from 'swr';
import { ArrowLeft, Flame, Home, ThumbsDown } from 'lucide-react-native';
import { useState, useCallback } from 'react';

import Logo from '@/assets/icons/original.svg';
import { Text } from '@/components/ui/text';
import { get, post, put } from '@/lib/utils/fetch';
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
import { VideoCardGrid } from '@/components/specific/Search';
import { TranscriptViewer } from '@/components/specific/TranscriptViewer';
import Sheet from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { SwipableTabs } from '@/components/ui/swipable-tabs';
import { BottomSheetContainer } from '@/components/ui/bottom-sheet-container';
import { X } from 'lucide-react-native';
import axios from 'axios';
import { ISponsorBlockSegment } from '@/types/sponsorblock';
import DownloadVideo from '@/components/specific/DownloadVideo';
import Constants from 'expo-constants';

export default function VideoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
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

  // Fetch video details
  const { data, error, isLoading, mutate } = useSWR<Video>(
    id ? `/public/yt/video?id=${id}` : null,
    (url: string) => get({ endpoint: url })
  );

  useRecordHistory(id);

  const dislikesFetchInFlightRef = useRef<string | null>(null);
  const sponsorFetchInFlightRef = useRef<string | null>(null);

  useEffect(() => {
    if (data) {
      (async () => {
        const shouldRefreshDislikes =
          twoDateDifference(new Date(), new Date(data.extra?.last_disliked_at || 0)) >= 3;
        if (shouldRefreshDislikes && dislikesFetchInFlightRef.current !== data.id) {
          dislikesFetchInFlightRef.current = data.id;
          try {
            const dislikes = await axios.get(
              `https://returnyoutubedislikeapi.com/votes?videoId=${data.id}`
            );

            mutate((current) => {
              if (!current) return current;
              return {
                ...current,
                dislike_count: dislikes.data.dislikes,
                extra: { ...current.extra, last_disliked_at: Date.now() },
              };
            }, false);
            // send this data to server
            try {
              await put({
                endpoint: `/public/yt/update-dislikes/${data.id}`,
                params: { dislike_count: dislikes.data.dislikes },
                throwable: true,
              });
            } catch (error: any) {}
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
          !data.sponsorblocks?.length &&
          twoDateDifference(new Date(), new Date(data.extra?.last_sponsorblock_at || 0)) >= 3;
        if (shouldRefreshSponsorBlock && sponsorFetchInFlightRef.current !== data.id) {
          sponsorFetchInFlightRef.current = data.id;
          try {
            console.log(`https://sponsor.ajay.app/api/skipSegments?videoID=${data.id}`);
            const sponsorBlocks = await axios.get(
              `https://sponsor.ajay.app/api/skipSegments?videoID=${data.id}`
            );

            const sponsorData = sponsorBlocks.data.map((s: ISponsorBlockSegment) => ({
              category: s.category,
              start: Math.trunc(s.segment[0]) || 0,
              end: Math.trunc(s.segment[1]) || 0,
            }));

            console.log(sponsorData);

            mutate((current) => {
              if (!current) return current;
              return {
                ...current,
                sponsorblocks: sponsorData,
                extra: { ...current.extra, last_sponsorblock_at: Date.now() },
              };
            }, false);
            // // send this data to server
            // try {
            //   await put({
            //     endpoint: `/public/yt/update-dislikes/${data.id}`,
            //     params: { dislike_count: sponsorBlocks.data.dislikes },
            //     throwable: true,
            //   });
            // } catch (error) {
            //   //
            // }
          } catch (error: any) {
            if (error?.status !== 200) {
              if (error?.status === 404) {
                return console.log('[SPONSORBLOCK]: Video not found on SponsorBlock', data.id);
              }
              if (error?.status === 400) {
                return console.log('[SPONSORBLOCK]: Bad Request', data.id);
              }
              return;
            }
          } finally {
            sponsorFetchInFlightRef.current = null;
          }
        }
      })();
    }
  }, [data]);

  const video: Video | undefined = data;

  useEffect(() => {
    if (video?.available_qualities?.length) return;
    const timeout = setTimeout(async () => {
      const s = await mutate();
    }, 3000);
    return () => clearTimeout(timeout);
  }, [video]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (error || !video) {
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
            {video.title}
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
        isPlayerFullscreen={isPlayerFullscreen}
        isPip={isPip}
        video={video}
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
          data={video.nextEdges}
          keyExtractor={(item) => item.toId}
          renderItem={({ item }) => (
            <View className="px-4">
              <VideoCardGrid item={item.to!} />
            </View>
          )}
          ListHeaderComponent={
            <View className="p-4">
              <Text variant="h3" className="mb-2 font-bold leading-tight">
                {video.title}
              </Text>

              <View className="mb-4 flex-row flex-wrap items-center">
                <Text variant="muted" className="text-sm">
                  {miniNumber(Number(video.view_count) || 0)} views
                </Text>
                <Text variant="muted" className="mx-2 text-sm">
                  •
                </Text>
                <Text variant="muted" className="text-sm">
                  {distanceFromToday(video.trulyCreatedAt.toString())}
                </Text>
              </View>

              {/* Actions */}
              <VideoActions video={video} onDownload={() => setDownloadModalOpen(true)} />

              {video?.creator && (
                <Pressable
                  onPress={() => router.push(`/creator/${video.creator!.id}`)}
                  className="mb-6 flex-row items-center justify-between border-y border-border py-3 active:opacity-80">
                  <View className="mr-4 flex-1 flex-row items-center">
                    {video.creator.avatars &&
                    Array.isArray(video.creator.avatars) &&
                    video.creator.avatars[0]?.url ? (
                      <View className="mr-3 size-10 overflow-hidden rounded-full bg-muted">
                        <Image
                          source={{ uri: video.creator.avatars[0].url }}
                          style={{ width: 40, height: 40 }}
                        />
                      </View>
                    ) : (
                      <View className="mr-3 size-10 rounded-full bg-muted" />
                    )}
                    <View className="flex-1">
                      <Text className="text-base font-semibold" numberOfLines={1}>
                        {video.creator.title}
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
                  {video.short_description || 'No description available.'}
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
          }
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
      <DownloadVideo
        open={downloadModalOpen}
        setOpen={setDownloadModalOpen}
        videoId={id}
        availableQualities={video.available_qualities}
        videoTitle={video.title}
        authorName={video.creator?.title || 'unknown artist'}
      />
    </SafeAreaView>
  );
}

type TranscriptToggleType = 'CHAPTER' | 'TRANSCRIPT' | null;

export type VideoComponentProps = {
  isPlayerFullscreen: boolean;
  isPip: boolean;
  video: Video;
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
  isPlayerFullscreen,
  isPip,
  video,
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
  const [selectedQuality, setSelectedQuality] = useState('720p');
  const [videoHeight, setVideoHeight] = useState(0);
  const { id } = useLocalSearchParams<{ id: string }>();
  const videoRef = useRef<VideoPlayerHandle>(null);
  const { colorScheme } = useColorScheme();
  const colors = THEME[colorScheme ?? 'light'];

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

  // fetch download url
  const { data: downloadData } = useSWR(
    id ? [`/download/video-audio/separate/${id}`, selectedQuality] : null,
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

  // console.log(JSON.stringify(downloadData?.video_fmt, null, 2));

  const tabs = [
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
          renderItem={({ item, index }) => {
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
                  <Text className="text-xs text-muted-foreground">{formatTime(item.start)}</Text>
                </View>
              </Pressable>
            );
          }}
        />
      ),
    },
  ];

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
          poster={video.thumbnails?.[0]?.url}
          src={downloadData?.video_fmt?.url}
          audioSrc={downloadData?.audio_fmt?.url}
          style={{ width: '100%', height: '100%' }}
          onFullScreenChange={onFullScreenChange}
          onPipChange={onPipChange}
          onCurrentTimeChange={onCurrentTimeChange}
          selectedQuality={selectedQuality}
          setOpenQualitySheet={setOpenQualitySheet}
          onTranscriptToggle={onTranscriptToggle}
          heatmap={video.heatmap as any}
          chapters={(video.chapters as Video['chapters']) || []}
          title={video.title}
          description={video.short_description || undefined}
          author={video.creator?.title || undefined}
          skipSegments={video.sponsorblocks}
        />
      </View>
      <Sheet open={openQualitySheet} onClose={() => setOpenQualitySheet(false)}>
        <Text variant="h3">Available Qualities</Text>
        {video.available_qualities?.map((q) => (
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

      {!isPlayerFullscreen && !isPip && (
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
