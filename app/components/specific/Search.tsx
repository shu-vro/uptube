import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { THEME } from '@/lib/theme';
import { useColorScheme } from 'nativewind';
import { View, Image, StyleSheet, ImageBackground, TouchableOpacity } from 'react-native';
import { Lucide } from '@react-native-vector-icons/lucide';
import { Skeleton } from '../ui/skeleton';
import { Video } from '@/types/prisma';
import { distanceFromToday, miniNumber, numberToTime } from '@/lib/utils/number-format';
import { useRouter } from 'expo-router';

const IMAGE_STYLE = StyleSheet.create({
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
}).thumbnail;

export const VideoCardList = ({ item }: { item: Video }) => {
  const { colorScheme } = useColorScheme();
  const theme = THEME[colorScheme ?? 'light'];

  return (
    <Card className="mb-3">
      <CardContent className="p-3">
        <View className="flex-row">
          <View className="h-18 mr-3 w-32 items-center justify-center overflow-hidden rounded-lg bg-muted">
            <ImageBackground
              source={{
                uri: item.thumbnails?.sort((a, b) => (a?.width || 0) - (b?.width || 0))[
                  Math.min((item.thumbnails?.length ?? 1) - 1, 1)
                ]?.id,
              }}
              style={[IMAGE_STYLE, { flex: 1, width: '100%', height: '100%' }]}
              resizeMode="cover"
              onError={() => console.log('Image failed to load:', item.thumbnails)}>
              <View className="absolute inset-0 items-center justify-center">
                <Lucide name="circle-play" size={24} color={theme.mutedForeground} />
              </View>
              <View className="absolute bottom-2 right-2 rounded-sm bg-background/60 px-1.5 py-0.5">
                <Text variant="muted" className="text-xs">
                  {numberToTime(item.duration || 0)}
                </Text>
              </View>
            </ImageBackground>
          </View>

          <View className="flex-1">
            <Text className="mb-1 text-sm font-semibold leading-5" numberOfLines={2}>
              {item.title}
            </Text>
            <Text variant="muted" className="mb-1 text-xs" numberOfLines={1}>
              {item.creator?.title}
            </Text>
            <View className="flex-row items-center">
              <Text variant="muted" className="text-xs">
                {miniNumber(item.view_count || 0)} views
              </Text>
              <Text variant="muted" className="mx-1 text-xs">
                •
              </Text>
              <Text variant="muted" className="text-xs">
                {distanceFromToday(item.createdAt.toString() || 0)}
              </Text>
            </View>
          </View>
        </View>
      </CardContent>
    </Card>
  );
};

export function VideoCardGrid({ item }: { item: Video }) {
  const router = useRouter();
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        router.push(`/video/${item.id}`);
      }}>
      <Card className="mb-3 h-auto w-[calc(100%-2rem)]">
        <CardContent className="px-3">
          <View className="relative mb-2 aspect-video w-full items-center justify-center overflow-hidden rounded-lg bg-muted">
            <ImageBackground
              source={{
                uri: item.thumbnails?.sort((a, b) => (a?.width || 0) - (b?.width || 0))[
                  Math.min(item.thumbnails.length - 1, 1)
                ]?.url,
              }}
              style={[IMAGE_STYLE, { flex: 1, width: '100%', height: '100%' }]}
              resizeMode="cover"
              onError={() => console.log('Image failed to load:', item.thumbnails)}>
              <View className="absolute bottom-2 right-2 rounded-sm bg-background/60 px-1.5 py-0.5">
                <Text variant="muted" className="text-xs">
                  {numberToTime(item.duration || 0)}
                </Text>
              </View>
            </ImageBackground>
          </View>
          <Text className="mb-1 text-sm font-semibold leading-4" numberOfLines={2}>
            {item.title}
          </Text>
          <Text variant="muted" className="mb-1 text-xs" numberOfLines={1}>
            {item.creator?.title}
          </Text>
          <View className="flex-row items-center">
            <Text variant="muted" className="text-xs">
              {miniNumber(item.view_count || 0)} views
            </Text>
            <Text variant="muted" className="mx-1 text-xs">
              •
            </Text>
            <Text variant="muted" className="text-xs">
              {distanceFromToday(item.createdAt.toString() || 0)}
            </Text>
          </View>
        </CardContent>
      </Card>
    </TouchableOpacity>
  );
}

export const SearchResultVideo = ({
  item,
  variant = 'grid',
}: {
  item: any;
  variant?: 'list' | 'grid';
}) => {
  return variant === 'list' ? <VideoCardList item={item} /> : <VideoCardGrid item={item} />;
};

export const LoadingVideo = ({ index }: { index: number }) => (
  <Card className="mx-4 mb-3" key={index}>
    <CardContent className="p-3">
      <View className="flex-row">
        <Skeleton className="h-18 mr-3 w-32 rounded-lg" />
        <View className="flex-1">
          <Skeleton className="mb-2 h-4 rounded" />
          <Skeleton className="mb-1 h-3 w-24 rounded" />
          <Skeleton className="h-3 w-32 rounded" />
        </View>
      </View>
    </CardContent>
  </Card>
);
