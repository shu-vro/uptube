import React from 'react';
import { ImageBackground, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { ThumbsUp } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { THEME } from '@/lib/theme';
import { miniNumber } from '@/lib/utils/number-format';
import { getVideoThumbnailUrl } from '@/lib/utils/video-thumbnail';
import { LibraryVideo } from '@/types/library';
import { CARD_HEIGHT, CARD_WIDTH } from './LibraryMediaCard';

const imageStyle = StyleSheet.create({
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
}).thumbnail;

type LikedVideosCardProps = {
  count: number;
  preview: LibraryVideo[];
  onPress: () => void;
};

export function LikedVideosCard({ count, preview, onPress }: LikedVideosCardProps) {
  const { colorScheme } = useColorScheme();
  const colors = THEME[colorScheme ?? 'light'];
  const thumbnailUrl = getVideoThumbnailUrl(preview[0]);

  return (
    <Pressable onPress={onPress} className="mr-3 active:opacity-80" style={{ width: CARD_WIDTH }}>
      <View
        className="mb-2 overflow-hidden rounded-lg bg-muted"
        style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}>
        {thumbnailUrl ? (
          <ImageBackground source={{ uri: thumbnailUrl }} style={imageStyle} resizeMode="cover">
            <View className="absolute inset-0 items-center justify-center bg-black/35">
              <View className="flex-row items-center gap-1.5">
                <ThumbsUp size={18} color="white" fill="white" />
                <Text className="text-sm font-semibold text-white">{miniNumber(count)}</Text>
              </View>
            </View>
          </ImageBackground>
        ) : (
          <View className="flex-1 items-center justify-center bg-muted">
            <ThumbsUp size={24} color={colors.primary} />
            <Text className="mt-1 text-sm font-semibold">{miniNumber(count)}</Text>
          </View>
        )}
      </View>
      <Text className="text-sm font-medium" numberOfLines={1}>
        Liked videos
      </Text>
      <Text variant="muted" className="text-xs">
        Private
      </Text>
    </Pressable>
  );
}
