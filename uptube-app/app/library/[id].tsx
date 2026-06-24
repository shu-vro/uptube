import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import SimpleHeader from '@/components/specific/SimpleHeader';
import { VideoCardList } from '@/components/specific/Search';
import { Text } from '@/components/ui/text';
import { get } from '@/lib/utils/fetch';
import { BookmarkVideosResponse, LibraryVideo } from '@/types/library';
import { Video } from '@/types/prisma';

export default function BookmarkDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [title, setTitle] = useState('Bookmark');
  const [items, setItems] = useState<LibraryVideo[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const fetchPage = async (nextPage: number) => {
    if (!id || loading) return;
    setLoading(true);
    try {
      const data: BookmarkVideosResponse = await get({
        endpoint: `/protected/library/bookmarks/${id}/videos`,
        params: { page: nextPage, limit: 20 },
        throwable: true,
      });
      if (data.bookmark?.name) {
        setTitle(data.bookmark.name);
      }
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
    if (id) fetchPage(1);
  }, [id]);

  return (
    <SafeAreaView className="flex-1">
      <SimpleHeader title={title} separator />
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
              This collection is empty.
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
