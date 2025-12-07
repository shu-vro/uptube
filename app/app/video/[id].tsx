import React from 'react';
import {
  View,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Dimensions,
  Image,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import useSWR from 'swr';
import { ArrowLeft } from 'lucide-react-native';
import { useState, useCallback } from 'react';

import { Text } from '@/components/ui/text';
import { get } from '@/lib/utils/fetch';
import { Video } from '@/types/prisma';
import { useColorScheme } from 'nativewind';
import { THEME } from '@/lib/theme';
import { ResizeMode } from 'react-native-video';
import VideoPlayer from '@/components/ui/video-player';
import { numberToTime } from '@/lib/utils/number-format';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function VideoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const colors = THEME[colorScheme ?? 'light'];
  const [isPlayerFullscreen, setIsPlayerFullscreen] = useState(false);

  const [isPip, setIsPip] = useState(false);

  const onPipChange = useCallback((isActive: boolean) => {
    setIsPip(isActive);
  }, []);

  const onFullScreenChange = useCallback((isFullscreen: boolean) => {
    setIsPlayerFullscreen(isFullscreen);
  }, []);

  // Fetch video details
  const { data, error, isLoading } = useSWR(
    id ? `/public/yt/video?id=${id}` : null,
    (url: string) => get(url)
  );

  const video: Video | undefined = data?.data;
  // console.log(JSON.stringify(video, null, 2));

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

      <ScrollView
        className="flex-1"
        scrollEnabled={!isPlayerFullscreen && !isPip}
        contentContainerStyle={isPlayerFullscreen || isPip ? { flex: 1 } : {}}>
        <View
          className={
            isPlayerFullscreen || isPip
              ? 'h-full w-full flex-1 bg-black'
              : 'aspect-video w-full bg-black'
          }>
          <VideoPlayer
            video={video}
            style={{ width: '100%', height: '100%' }}
            onFullScreenChange={onFullScreenChange}
            onPipChange={onPipChange}
          />
        </View>

        {!isPlayerFullscreen && !isPip && (
          <View className="p-4">
            <Text variant="h3" className="mb-2">
              {video.title}
            </Text>

            <View className="mb-4 flex-row items-center">
              <Text variant="muted" className="text-sm">
                {video.view_count?.toLocaleString() || 0} views
              </Text>
              <Text variant="muted" className="mx-2 text-sm">
                •
              </Text>
              <Text variant="muted" className="text-sm">
                {new Date(video.createdAt || '').toLocaleDateString()}
              </Text>
              <Text variant="muted" className="mx-2 text-sm">
                •
              </Text>
              <Text variant="muted" className="text-sm">
                {numberToTime(video.duration)}
              </Text>
            </View>

            {video?.creator && (
              <Pressable className="mb-4 flex-row items-center border-b border-border pb-4">
                {video.creator.avatars?.[0]?.id ? (
                  <View className="mr-3 size-12 overflow-hidden rounded-full bg-muted">
                    <Image
                      source={{ uri: video.creator.avatars[0].id }}
                      style={{ width: 48, height: 48 }}
                    />
                  </View>
                ) : (
                  <View className="mr-3 size-12 rounded-full bg-muted" />
                )}
                <View className="flex-1">
                  <Text className="font-semibold">{video.creator.title}</Text>
                </View>
              </Pressable>
            )}

            {video.short_description && (
              <View className="mb-4">
                <Text variant="h4" className="mb-2">
                  Description
                </Text>
                <Text variant="muted">{video.short_description}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
