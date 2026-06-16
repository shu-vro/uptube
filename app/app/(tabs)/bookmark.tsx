import React, { useEffect } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useSWR from 'swr';
import { useIsFocused } from '@react-navigation/native';
import Gradient from '@/components/specific/Gradient';
import Header from '@/components/specific/Header';
import { HistorySection } from '@/components/specific/Library/HistorySection';
import { BookmarksSection } from '@/components/specific/Library/BookmarksSection';
import { Text } from '@/components/ui/text';
import { get } from '@/lib/utils/fetch';
import { LibraryOverview } from '@/types/library';

export default function BookmarkScreen() {
  const isFocused = useIsFocused();
  const { data, error, isLoading, mutate } = useSWR<LibraryOverview>(
    isFocused ? '/protected/library/overview' : null,
    (endpoint: string) => get({ endpoint, throwable: true })
  );

  useEffect(() => {
    if (isFocused) mutate();
  }, [isFocused, mutate]);

  return (
    <SafeAreaView className="flex-1">
      <Header />
      <Gradient />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View className="items-center justify-center py-12">
            <ActivityIndicator />
          </View>
        ) : error ? (
          <Text className="px-4 text-center text-destructive">Failed to load library.</Text>
        ) : data ? (
          <>
            <HistorySection history={data.history} />
            <BookmarksSection
              likedVideos={data.likedVideos}
              bookmarks={data.bookmarks}
              onRefresh={() => mutate()}
            />
            {!data.history.length && !data.likedVideos.count && !data.bookmarks.length ? (
              <Text variant="muted" className="px-4 text-center text-sm">
                Watch videos to build your history, or like and bookmark content you enjoy.
              </Text>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
