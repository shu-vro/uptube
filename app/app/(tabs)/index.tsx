import Gradient from '@/components/specific/Gradient';
import Header from '@/components/specific/Header';
import { ShortsSection, VideoCardGrid } from '@/components/specific/Search';
import { get } from '@/lib/utils/fetch';
import { Video } from '@/types/prisma';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import { Text } from '@/components/ui/text';

type HomeItem = Video | { type: 'SHORTS_SHELF'; shorts: Video[] };

export default function Screen() {
  const [shelf, setShelf] = useState<HomeItem[]>([]);
  const flashListRef = useRef<FlashListRef<HomeItem>>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchData = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const data: { shelf: HomeItem[] } = await get({
        endpoint: '/public/yt/home',
        params: { page, limit: 20 },
      });

      if (data?.shelf?.length) {
        setShelf((prev) => (page === 1 ? data.shelf : [...prev, ...data.shelf]));
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page]);

  const onEndReached = () => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  return (
    <SafeAreaView className="flex-1">
      <Header />
      <Gradient />
      <FlashList
        ref={flashListRef}
        data={shelf}
        // estimatedItemSize={280}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          if ('type' in item && item.type === 'SHORTS_SHELF') {
            return <ShortsSection shorts={item.shorts} />;
          }
          return (
            <View className="w-full items-center">
              <VideoCardGrid item={item as Video} />
            </View>
          );
        }}
        keyExtractor={(item, index) => {
          if ('type' in item && item.type === 'SHORTS_SHELF') {
            return `shorts-shelf-${index}`;
          }
          return (item as Video).id;
        }}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading ? (
            <View className="items-center justify-center p-4">
              <ActivityIndicator size="small" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading && shelf.length === 0 ? (
            <Text className="p-4 text-center">No Videos found.</Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
