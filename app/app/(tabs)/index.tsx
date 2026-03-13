import Gradient from '@/components/specific/Gradient';
import Header from '@/components/specific/Header';
import { VideoCardGrid } from '@/components/specific/Search';
import { get } from '@/lib/utils/fetch';
import { Video } from '@/types/prisma';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useSWR from 'swr';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import { Text } from '@/components/ui/text';

export default function Screen() {
  // return null;
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const flashListRef = useRef<FlashListRef<Video>>(null);
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading, mutate } = useSWR('/public/yt/home', async (url) => {
    const d: Video[] = await get({ endpoint: url, params: { page, limit } });
    setAllVideos((prev) => [...prev, ...d]);
    return d;
  });

  useEffect(() => {
    if (page > 1) {
      mutate();
    }
  }, [page]);

  return (
    <SafeAreaView className="flex-1">
      <Header />
      <Gradient />
      <FlashList
        ref={flashListRef}
        data={allVideos}
        // @ts-ignore
        estimatedItemSize={200}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        renderItem={({ item }) => (
          <>
            <VideoCardGrid item={item} />
          </>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 100, paddingHorizontal: 16 }}
        onEndReachedThreshold={0.8}
        onEndReached={() => {
          if (!isLoading) {
            setPage((prev) => prev + 1);
          }
        }}
        ListFooterComponent={() =>
          isLoading ? (
            <View
              style={{
                justifyContent: 'center',
                alignItems: 'center',
                paddingVertical: 16,
                gap: 8,
              }}>
              <ActivityIndicator size="small" />
              <Text>Loading...</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={() =>
          !isLoading && allVideos.length === 0 ? <Text>No Videos found.</Text> : null
        }
      />
    </SafeAreaView>
  );
}
