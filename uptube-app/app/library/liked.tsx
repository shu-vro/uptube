import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SimpleHeader from '@/components/specific/SimpleHeader';
import { VideoCardList } from '@/components/specific/Search';
import { Text } from '@/components/ui/text';
import { get } from '@/lib/utils/fetch';
import { LibraryVideo, PaginatedLibraryVideos } from '@/types/library';
import { Video } from '@/types/prisma';

export default function LikedVideosScreen() {
  const [items, setItems] = useState<LibraryVideo[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const fetchPage = async (nextPage: number) => {
    if (loading) return;
    setLoading(true);
    try {
      const data: PaginatedLibraryVideos = await get({
        endpoint: '/protected/library/likes',
        params: { page: nextPage, limit: 20 },
        throwable: true,
      });
      setItems((prev) => (nextPage === 1 ? data.items : [...prev, ...data.items]));
      setHasMore(data.hasMore);
      setPage(nextPage);
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage(1);
  }, []);

  return (
    <SafeAreaView className="flex-1">
      <SimpleHeader title="Liked videos" separator />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <VideoCardList item={item as Video} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        onEndReached={() => {
          if (hasMore && !loading) fetchPage(page + 1);
        }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          !loading ? (
            <Text variant="muted" className="text-center">
              No liked videos yet.
            </Text>
          ) : null
        }
        ListFooterComponent={
          loading ? (
            <View className="items-center py-4">
              <ActivityIndicator />
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
