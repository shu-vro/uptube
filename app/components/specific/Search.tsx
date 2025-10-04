import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { THEME } from '@/lib/theme';
import { useColorScheme } from 'nativewind';
import { View, Image, StyleSheet, ImageBackground } from 'react-native';
import { Lucide } from '@react-native-vector-icons/lucide';
import { Skeleton } from '../ui/skeleton';

const IMAGE_STYLE = StyleSheet.create({
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
}).thumbnail;

export const VideoCardList = ({ item }: { item: any }) => {
  const { colorScheme } = useColorScheme();
  const theme = THEME[colorScheme ?? 'light'];
  return (
    <Card className="mb-3">
      <CardContent className="p-3">
        <View className="flex-row">
          <View className="h-18 mr-3 w-32 items-center justify-center rounded-lg bg-muted">
            <Lucide name="circle-play" size={24} color={theme.mutedForeground} />
          </View>
          <View className="flex-1">
            <Text className="mb-1 text-sm font-semibold leading-5" numberOfLines={2}>
              {item.title}
            </Text>
            <Text variant="muted" className="mb-1 text-xs">
              {item.channel}
            </Text>
            <View className="flex-row items-center">
              <Text variant="muted" className="text-xs">
                {item.views}
              </Text>
              <Text variant="muted" className="mx-1 text-xs">
                •
              </Text>
              <Text variant="muted" className="text-xs">
                {item.duration}
              </Text>
            </View>
          </View>
        </View>
      </CardContent>
    </Card>
  );
};

export function VideoCardGrid({ item }: { item: any }) {
  const { colorScheme } = useColorScheme();
  const theme = THEME[colorScheme ?? 'light'];
  console.log(item.thumbnail);

  return (
    <Card className="mb-3 h-80 w-[calc(100%-2rem)]">
      <CardContent className="p-3">
        <View className="mb-2 h-48 w-full items-center justify-center overflow-hidden rounded-lg bg-muted">
          <ImageBackground
            source={{ uri: item.thumbnail }}
            style={[IMAGE_STYLE, { flex: 1, width: '100%', height: '100%' }]}
            resizeMode="cover">
            <View className="flex-1 items-center justify-center">
              <Lucide name="circle-play" size={32} color="rgba(255,255,255,0.8)" />
            </View>
          </ImageBackground>
        </View>
        <Text className="mb-1 text-sm font-semibold leading-4" numberOfLines={2}>
          {item.title}
        </Text>
        <Text variant="muted" className="mb-1 text-xs" numberOfLines={1}>
          {item.channel}
        </Text>
        <View className="flex-row items-center">
          <Text variant="muted" className="text-xs">
            {item.views}
          </Text>
          <Text variant="muted" className="mx-1 text-xs">
            •
          </Text>
          <Text variant="muted" className="text-xs">
            {item.duration}
          </Text>
        </View>
      </CardContent>
    </Card>
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
