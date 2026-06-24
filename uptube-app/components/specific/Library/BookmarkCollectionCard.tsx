import React from 'react';
import { ImageBackground, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Lucide } from '@react-native-vector-icons/lucide';
import { useColorScheme } from 'nativewind';
import { THEME } from '@/lib/theme';
import { miniNumber } from '@/lib/utils/number-format';
import { getVideoThumbnailUrl } from '@/lib/utils/video-thumbnail';
import { BookmarkCollectionSummary } from '@/types/library';
import { CARD_HEIGHT, CARD_WIDTH } from './LibraryMediaCard';

const imageStyle = StyleSheet.create({
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
}).thumbnail;

type BookmarkCollectionCardProps = {
  bookmark: BookmarkCollectionSummary;
  onPress: () => void;
};

export function BookmarkCollectionCard({ bookmark, onPress }: BookmarkCollectionCardProps) {
  const { colorScheme } = useColorScheme();
  const colors = THEME[colorScheme ?? 'light'];
  const thumbnailUrl = getVideoThumbnailUrl(bookmark.preview);

  return (
    <Pressable onPress={onPress} className="mr-3 active:opacity-80" style={{ width: CARD_WIDTH }}>
      <View
        className="mb-2 overflow-hidden rounded-lg bg-muted"
        style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}>
        {thumbnailUrl ? (
          <ImageBackground source={{ uri: thumbnailUrl }} style={imageStyle} resizeMode="cover">
            <View className="absolute bottom-1 right-1 flex-row items-center gap-1 rounded bg-black/70 px-1.5 py-0.5">
              <Lucide name="list-video" size={10} color="white" />
              <Text className="text-[10px] font-medium text-white">
                {miniNumber(bookmark.count)}
              </Text>
            </View>
          </ImageBackground>
        ) : (
          <View className="flex-1 items-center justify-center">
            <Lucide name="list-video" size={24} color={colors.mutedForeground} />
            <Text className="mt-1 text-xs font-medium">{miniNumber(bookmark.count)}</Text>
          </View>
        )}
      </View>
      <Text className="text-sm font-medium" numberOfLines={2}>
        {bookmark.name}
      </Text>
      <Text variant="muted" className="text-xs" numberOfLines={1}>
        Private
      </Text>
    </Pressable>
  );
}
