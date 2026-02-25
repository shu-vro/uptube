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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import useSWR from 'swr';
import {
  AlignVerticalDistributeCenter,
  ArrowBigDown,
  ArrowLeft,
  Flame,
  ThumbsDown,
} from 'lucide-react-native';
import { useState, useCallback } from 'react';

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
import { ThumbsUp, ChevronDown, ChevronUp } from 'lucide-react-native';
import { VideoCardGrid } from '@/components/specific/Search';
import { TranscriptViewer } from '@/components/specific/TranscriptViewer';
import Sheet from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { SwipableTabs } from '@/components/ui/swipable-tabs';
import { BottomSheetContainer } from '@/components/ui/bottom-sheet-container';
import { X } from 'lucide-react-native';
import axios from 'axios';
import {
  getInfo,
  download,
  getStreamUrls,
  addProgressListener,
  YTDLInfo,
} from '@/modules/uptube-ytdl';

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

  // Fetch video details
  const { data, error, isLoading, mutate } = useSWR<Video>(
    id ? `/public/yt/video?id=${id}` : null,
    (url: string) => get({ endpoint: url })
  );

  useEffect(() => {
    if (data) {
      (async () => {
        if (twoDateDifference(new Date(), new Date(data.extra?.last_disliked_at || 0)) >= 3) {
          const dislikes = await axios.get(
            `https://returnyoutubedislikeapi.com/votes?videoId=${data.id}`
          );

          if (dislikes.status !== 200) {
            if (dislikes.status === 429) {
              return;
            }
            return console.log('[RETURNYOUTUBEDISLIKEAPI]: Failed to fetch dislike count');
          }
          mutate(
            {
              ...data,
              dislike_count: dislikes.data.dislikes,
              extra: { ...data.extra, last_disliked_at: Date.now() },
            },
            false
          );
          // send this data to server
          try {
            await put({
              endpoint: `/public/yt/update-dislikes/${data.id}`,
              params: { dislike_count: dislikes.data.dislikes },
              throwable: true,
            });
          } catch (error) {
            //
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
          <Text variant="h4" numberOfLines={1} className="flex-1">
            {video.title}
          </Text>
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
                  {distanceFromToday(video.createdAt.toString())}
                </Text>
              </View>

              {/* Actions */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
                <Pressable className="mr-4 flex-row items-center gap-1 rounded-full bg-muted px-4 py-2">
                  <ThumbsUp size={18} color={colors.foreground} />
                  <Text className="font-medium">{miniNumber(Number(video.like_count) || 0)}</Text>
                </Pressable>
                <Pressable className="mr-4 flex-row items-center gap-1 rounded-full bg-muted px-4 py-2">
                  <ThumbsDown size={18} color={colors.foreground} />
                  <Text className="font-medium">
                    {miniNumber(Number(video.dislike_count) || 0)}
                  </Text>
                </Pressable>
                <Pressable className="mr-4 flex-row items-center gap-1 rounded-full bg-muted px-4 py-2">
                  <ArrowBigDown size={24} color={colors.foreground} />
                  <Text className="font-medium">Download</Text>
                </Pressable>
              </ScrollView>

              {video?.creator && (
                <View className="mb-6 flex-row items-center justify-between border-y border-border py-3">
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
                </View>
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
  const [selectedQuality, setSelectedQuality] = useState('bestefficiency');
  const [videoHeight, setVideoHeight] = useState(0);
  const { id } = useLocalSearchParams<{ id: string }>();
  const videoRef = useRef<VideoPlayerHandle>(null);
  const { colorScheme } = useColorScheme();
  const colors = THEME[colorScheme ?? 'light'];

  // Expose seek method to parent
  useEffect(() => {
    videoPlayerRef.current = {
      seek: (time: number) => {
        videoRef.current?.seek(time);
      },
      isPaused: () => {
        return videoRef.current?.isPaused() ?? false;
      },
    };
  }, [videoPlayerRef]);

  // fetch download url
  const { data: downloadData, mutate } = useSWR(
    id ? `/public/yt/download-data/${id}` : null,
    (url: string) => post({ endpoint: url, params: { quality: selectedQuality } })
  );

  useEffect(() => {
    mutate();
  }, [selectedQuality]);

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
          src={downloadData?.data.url}
          style={{ width: '100%', height: '100%' }}
          onFullScreenChange={onFullScreenChange}
          onPipChange={onPipChange}
          onCurrentTimeChange={onCurrentTimeChange}
          setOpenQualitySheet={setOpenQualitySheet}
          onTranscriptToggle={onTranscriptToggle}
          heatmap={video.heatmap as any}
          chapters={(video.chapters as Video['chapters']) || []}
          title={video.title}
          description={video.short_description || undefined}
          author={video.creator?.title || undefined}
        />
      </View>
      <Sheet open={openQualitySheet} onClose={() => setOpenQualitySheet(false)}>
        <Text variant="h3">Playback Speed</Text>
        {video.available_qualities?.map((q) => (
          <SettingsButton
            key={q}
            Icon={Flame}
            label={q}
            selectedText=" "
            onPress={() => {
              setSelectedQuality(q);
            }}></SettingsButton>
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
