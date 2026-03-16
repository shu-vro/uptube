import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { THEME } from '@/lib/theme';
import { useColorScheme } from 'nativewind';
import {
  View,
  Image,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
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
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const theme = THEME[colorScheme ?? 'light'];

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        router.push(`/video/${item.id}`);
      }}>
      <Card className="mb-3 gap-0 py-2">
        <CardContent className="p-3 py-0">
          <View className="flex-row">
            <View className="mr-3 aspect-video w-32 items-center justify-center overflow-hidden rounded-lg bg-muted">
              <ImageBackground
                source={{
                  uri: item.thumbnails?.sort((a, b) => (a?.width || 0) - (b?.width || 0))[
                    Math.min((item.thumbnails?.length ?? 1) - 1, 1)
                  ]?.url,
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
                  {miniNumber(Number(item.view_count) || 0)} views
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
    </TouchableOpacity>
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
              {miniNumber(Number(item.view_count) || 0)} views
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

export const ShortCard = ({ item, shortIds }: { item: Video; shortIds: string[] }) => {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const theme = THEME[colorScheme ?? 'light'];
  const { width: screenWidth } = Dimensions.get('window');
  const cardWidth = screenWidth * 0.45;
  const cardHeight = cardWidth * (16 / 9);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        router.push({
          pathname: '/(tabs)/shorts',
          params: {
            shortId: item.id,
            ids: shortIds.join(','),
          },
        });
      }}
      style={{ width: cardWidth, marginRight: 12 }}>
      <View style={{ height: cardHeight }} className="overflow-hidden rounded-xl bg-muted">
        <ImageBackground
          source={{
            uri: item.thumbnails?.sort((a, b) => (b?.width || 0) - (a?.width || 0))[0]?.url,
          }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover">
          <View className="absolute bottom-2 left-2 right-2">
            <View className="mb-1 self-start rounded-sm bg-background/70 px-1.5 py-0.5">
              <Text variant="muted" className="text-xs font-semibold">
                {numberToTime(item.duration || 0)}
              </Text>
            </View>
          </View>
        </ImageBackground>
      </View>
      <View className="mt-2">
        <Text className="text-sm font-semibold leading-4" numberOfLines={2}>
          {item.title}
        </Text>
        <Text variant="muted" className="mt-1 text-xs" numberOfLines={1}>
          {miniNumber(Number(item.view_count) || 0)} views
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export const ShortsSection = ({ shorts }: { shorts: Video[] }) => {
  if (!shorts || shorts.length === 0) return null;
  const { colorScheme } = useColorScheme();
  const shortIds = shorts.map((s) => s.id);

  return (
    <View className="mb-6">
      <View className="mb-3 flex-row items-center px-4">
        <Lucide
          name="zap"
          size={20}
          color={THEME[colorScheme ?? 'light'].primary}
          style={{ marginRight: 8 }}
        />
        <Text className="text-lg font-bold">Shorts</Text>
      </View>
      <FlatList
        data={shorts}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => <ShortCard item={item} shortIds={shortIds} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        snapToInterval={Dimensions.get('window').width * 0.45 + 12}
        decelerationRate="fast"
        snapToAlignment="start"
      />
    </View>
  );
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
