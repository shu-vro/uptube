import Gradient from '@/components/specific/Gradient';
import Header from '@/components/specific/Header';
import { VideoCardGrid } from '@/components/specific/Search';
import { get } from '@/lib/utils/fetch';
import { Video } from '@/types/prisma';
import * as React from 'react';
import { FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useSWR from 'swr';

export default function Screen() {
  const { data } = useSWR(
    '/public/yt/home',
    (url) => {
      return get({ endpoint: url });
    },
    { refreshInterval: 120000 }
  );

  return (
    <SafeAreaView>
      <Header />
      <Gradient />
      {data ? (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <>
              <VideoCardGrid item={item} />
            </>
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 100, paddingHorizontal: 16 }}
        />
      ) : null}
    </SafeAreaView>
  );
}
