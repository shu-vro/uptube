import React from 'react';
import { View, ScrollView, ActivityIndicator, Pressable, Image, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import useSWR from 'swr';
import { ArrowLeft } from 'lucide-react-native';
import { useState, useCallback } from 'react';

import { Text } from '@/components/ui/text';
import { get, post } from '@/lib/utils/fetch';
import { Video } from '@/types/prisma';
import { useColorScheme } from 'nativewind';
import { THEME } from '@/lib/theme';
import VideoPlayer from '@/components/ui/video-player';
import { miniNumber, distanceFromToday } from '@/lib/utils/number-format';
import { ThumbsUp, Share2, ListPlus, ChevronDown, ChevronUp } from 'lucide-react-native';
import { SearchResultVideo, VideoCardGrid } from '@/components/specific/Search';
import Gradient from '@/components/specific/Gradient';

export default function VideoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const colors = THEME[colorScheme ?? 'light'];
  const [isPlayerFullscreen, setIsPlayerFullscreen] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const [isPip, setIsPip] = useState(false);

  const onPipChange = useCallback((isActive: boolean) => {
    setIsPip(isActive);
  }, []);

  const onFullScreenChange = useCallback((isFullscreen: boolean) => {
    setIsPlayerFullscreen(isFullscreen);
  }, []);

  // Fetch video details
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/public/yt/video?id=${id}` : null,
    (url: string) => get({ endpoint: url })
  );

  // fetch download url
  const { data: downloadData } = useSWR(
    id ? `/public/yt/download-data/${id}` : null,
    (url: string) => post({ endpoint: url })
  );

  const video: Video | undefined = data;
  console.log(JSON.stringify(video?.nextEdges, null, 2));

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
      className="flex-1 bg-background"
      edges={isPlayerFullscreen || isPip ? [] : ['top']}>
      <Gradient />
      {!isPlayerFullscreen && !isPip && (
        <View className="flex-row items-center border-b border-border px-4 py-3">
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

      <View
        className={
          isPlayerFullscreen || isPip
            ? 'h-full w-full flex-1 bg-black'
            : 'aspect-video w-full bg-black'
        }>
        <VideoPlayer
          poster={video.thumbnails?.[0]?.id}
          src={downloadData?.data.url}
          style={{ width: '100%', height: '100%' }}
          onFullScreenChange={onFullScreenChange}
          onPipChange={onPipChange}
        />
      </View>

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
                  {miniNumber(video.view_count || 0)} views
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
                  <Text className="font-medium">{miniNumber(video.like_count || 0)}</Text>
                </Pressable>
              </ScrollView>

              {video?.creator && (
                <View className="mb-6 flex-row items-center justify-between border-y border-border py-3">
                  <View className="mr-4 flex-1 flex-row items-center">
                    {video.creator.avatars?.[0]?.url ? (
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
                <Text className="mb-2 font-semibold">Description</Text>
                <Text
                  variant="muted"
                  numberOfLines={isDescriptionExpanded ? undefined : 2}
                  className="text-sm leading-5">
                  {video.extra?.description ||
                    video.short_description ||
                    'No description available.'}
                </Text>
                <Pressable
                  onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  className="mt-2 flex-row items-center">
                  <Text className="mr-1 text-sm font-semibold">
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
