import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, BadgeCheck, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

import { Text } from '@/components/ui/text';
import { get } from '@/lib/utils/fetch';
import { THEME } from '@/lib/theme';
import { CreatorPageResponse, CreatorProfile, ChannelVideoPreview } from '@/types/channel';
import { Video } from '@/types/prisma';
import { VideoCardGrid } from '@/components/specific/Search';

function previewToVideo(preview: ChannelVideoPreview, profile: CreatorProfile): Video {
  const createdAt = preview.createdAt || '';

  return {
    id: preview.id,
    title: preview.title,
    channel_id: profile.id,
    short_description: null,
    duration: preview.duration,
    view_count: preview.view_count,
    type: 'VIDEO',
    keywords: [],
    like_count: '0',
    dislike_count: '0',
    category: null,
    extra: null,
    last_manual_fetch: createdAt,
    available_qualities: [],
    thumbnails: preview.thumbnails,
    sponsorblocks: [],
    chapters: null,
    trulyCreatedAt: createdAt,
    createdAt,
    updatedAt: createdAt,
    heatmap: null,
    creator: {
      id: profile.id,
      title: profile.title,
      description: profile.description,
      url: profile.url,
      vanity_channel_url: profile.vanity_channel_url,
      avatars: profile.avatars,
      createdAt: '',
      updatedAt: '',
      extra: null,
    },
  };
}

export default function CreatorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const colors = THEME[colorScheme ?? 'light'];
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [videos, setVideos] = useState<ChannelVideoPreview[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const loadingMoreRef = useRef(false);

  const mergeVideos = useCallback(
    (current: ChannelVideoPreview[], incoming: ChannelVideoPreview[]) => {
      const seen = new Set(current.map((video) => video.id));
      const merged = [...current];

      for (const video of incoming) {
        if (seen.has(video.id)) continue;
        seen.add(video.id);
        merged.push(video);
      }

      return merged;
    },
    []
  );

  const fetchCreatorPage = useCallback(
    async (cursor?: string | null) => {
      if (!id) return;

      const isInitial = !cursor;
      if (isInitial) {
        setIsLoading(true);
        setError(false);
      } else {
        if (loadingMoreRef.current) return;
        loadingMoreRef.current = true;
        setIsLoadingMore(true);
      }

      try {
        const data: CreatorPageResponse = await get({
          endpoint: '/public/yt/creator',
          params: {
            id,
            ...(cursor ? { cursor } : {}),
          },
        });

        if (data.profile) {
          setProfile(data.profile);
        }

        setVideos((current) => (isInitial ? data.videos : mergeVideos(current, data.videos)));
        setNextCursor(data.nextCursor);
      } catch {
        if (isInitial) {
          setError(true);
        }
      } finally {
        if (isInitial) {
          setIsLoading(false);
        } else {
          loadingMoreRef.current = false;
          setIsLoadingMore(false);
        }
      }
    },
    [id, mergeVideos]
  );

  useEffect(() => {
    if (!id) return;
    setProfile(null);
    setVideos([]);
    setNextCursor(null);
    fetchCreatorPage();
  }, [id, fetchCreatorPage]);

  const loadMore = useCallback(() => {
    if (!nextCursor || isLoadingMore || isLoading) return;
    fetchCreatorPage(nextCursor);
  }, [fetchCreatorPage, isLoading, isLoadingMore, nextCursor]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center border-b border-border px-4 py-3">
          <Pressable
            onPress={() => router.back()}
            className="mr-3 rounded-full p-2 active:bg-muted">
            <ArrowLeft size={24} color={colors.foreground} />
          </Pressable>
          <Text variant="h4" numberOfLines={1} className="flex-1">
            Channel
          </Text>
        </View>
        <View className="flex-1 items-center justify-center px-4">
          <Text variant="h3" className="mb-2">
            Channel Not Found
          </Text>
          <Text variant="muted" className="text-center">
            Could not load this creator. Please try again.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const bannerUrl = profile.banner?.sort((a, b) => (b.width || 0) - (a.width || 0))[0]?.url;
  const avatarUrl = profile.avatars?.sort((a, b) => (b.width || 0) - (a.width || 0))[0]?.url;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center border-b border-border px-4 py-3">
        <Pressable onPress={() => router.back()} className="mr-3 rounded-full p-2 active:bg-muted">
          <ArrowLeft size={24} color={colors.foreground} />
        </Pressable>
        <Text variant="h4" numberOfLines={1} className="flex-1">
          {profile.title}
        </Text>
      </View>

      <FlatList
        data={videos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="px-4">
            <VideoCardGrid
              item={previewToVideo(item, profile)}
              hideCreator
              publishedText={item.published_text || undefined}
            />
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <View>
            <View className="relative mb-14">
              {bannerUrl ? (
                <Image
                  source={{ uri: bannerUrl }}
                  className="h-36 w-full bg-muted"
                  resizeMode="cover"
                />
              ) : (
                <View className="h-28 w-full bg-muted" />
              )}

              <View className="absolute -bottom-10 left-4 overflow-hidden rounded-full border-4 border-background bg-muted">
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={{ width: 80, height: 80 }} />
                ) : (
                  <View style={{ width: 80, height: 80 }} />
                )}
              </View>
            </View>

            <View className="mb-6 px-4">
              <View className="mb-1 flex-row items-center">
                <Text variant="h3" className="mr-1 font-bold" numberOfLines={2}>
                  {profile.title}
                </Text>
                {profile.is_verified ? <BadgeCheck size={18} color={colors.primary} /> : null}
              </View>

              {profile.handle ? (
                <Text variant="muted" className="mb-2 text-sm">
                  {profile.handle}
                </Text>
              ) : null}

              <View className="mb-4 flex-row flex-wrap items-center">
                {profile.subscriber_count ? (
                  <Text variant="muted" className="text-sm">
                    {profile.subscriber_count}
                  </Text>
                ) : null}
                {profile.subscriber_count && profile.video_count ? (
                  <Text variant="muted" className="mx-2 text-sm">
                    •
                  </Text>
                ) : null}
                {profile.video_count ? (
                  <Text variant="muted" className="text-sm">
                    {profile.video_count}
                  </Text>
                ) : null}
              </View>

              {profile.description ? (
                <View className="mb-4 rounded-xl bg-muted p-3">
                  <Text
                    variant="default"
                    numberOfLines={isDescriptionExpanded ? undefined : 3}
                    className="text-sm leading-5">
                    {profile.description}
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
              ) : null}

              <Text variant="h4" className="font-bold">
                Videos
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <Text variant="muted" className="px-4 text-center">
            No videos found for this channel.
          </Text>
        }
        ListFooterComponent={
          isLoadingMore ? (
            <View className="items-center py-4">
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
