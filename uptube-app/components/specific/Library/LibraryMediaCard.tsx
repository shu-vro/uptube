import React from 'react';
import { ImageBackground, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Lucide } from '@react-native-vector-icons/lucide';
import { useColorScheme } from 'nativewind';
import { THEME } from '@/lib/theme';
import { numberToTime } from '@/lib/utils/number-format';
import { getVideoThumbnailUrl } from '@/lib/utils/video-thumbnail';
import { LibraryVideo } from '@/types/library';

const CARD_WIDTH = 140;
const CARD_HEIGHT = 80;

const imageStyle = StyleSheet.create({
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
}).thumbnail;

type LibraryMediaCardProps = {
  video: LibraryVideo;
  onPress: () => void;
};

export function LibraryMediaCard({ video, onPress }: LibraryMediaCardProps) {
  const { colorScheme } = useColorScheme();
  const colors = THEME[colorScheme ?? 'light'];
  const thumbnailUrl = getVideoThumbnailUrl(video);
  const isShort = video.type === 'SHORT';

  return (
    <Pressable onPress={onPress} className="mr-3 active:opacity-80" style={{ width: CARD_WIDTH }}>
      <View
        className="mb-2 overflow-hidden rounded-lg bg-muted"
        style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}>
        {thumbnailUrl ? (
          <ImageBackground source={{ uri: thumbnailUrl }} style={imageStyle} resizeMode="cover">
            {isShort ? (
              <View className="absolute inset-0 items-center justify-center bg-black/30">
                <View className="flex-row items-center gap-1 rounded bg-black/50 px-2 py-1">
                  <Lucide name="smartphone" size={12} color="white" />
                  <Text className="text-xs font-semibold text-white">Shorts</Text>
                </View>
              </View>
            ) : (
              <View className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5">
                <Text className="text-[10px] font-medium text-white">
                  {numberToTime(video.duration || 0)}
                </Text>
              </View>
            )}
          </ImageBackground>
        ) : (
          <View className="flex-1 items-center justify-center">
            <Lucide name="circle-play" size={24} color={colors.mutedForeground} />
          </View>
        )}
      </View>
      <Text className="text-sm font-medium leading-4" numberOfLines={2}>
        {video.title}
      </Text>
      {video.creator?.title ? (
        <Text variant="muted" className="mt-0.5 text-xs" numberOfLines={1}>
          {video.creator.title}
        </Text>
      ) : null}
    </Pressable>
  );
}

export { CARD_WIDTH, CARD_HEIGHT };
