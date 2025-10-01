import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { THEME } from '@/lib/theme';
import { useColorScheme } from 'nativewind';
import { View } from 'react-native';
import { Lucide } from '@react-native-vector-icons/lucide';
import { Skeleton } from '../ui/skeleton';

export const SearchResultVideo = ({ item }: { item: any }) => {
  const { colorScheme } = useColorScheme();
  const theme = THEME[colorScheme ?? 'light'];
  return (
    <Card className="mx-4 mb-3">
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
