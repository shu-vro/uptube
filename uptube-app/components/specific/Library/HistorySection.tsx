import React from 'react';
import { FlatList, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { SectionHeader } from './SectionHeader';
import { LibraryMediaCard } from './LibraryMediaCard';
import { LibraryVideo } from '@/types/library';

type HistorySectionProps = {
  history: LibraryVideo[];
};

export function HistorySection({ history }: HistorySectionProps) {
  const router = useRouter();

  if (!history.length) {
    return null;
  }

  const openVideo = (video: LibraryVideo) => {
    if (video.type === 'SHORT') {
      router.push({
        pathname: '/(tabs)/shorts',
        params: { shortId: video.id },
      });
      return;
    }
    router.push(`/video/${video.id}`);
  };

  return (
    <View className="mb-6">
      <SectionHeader title="History" onPress={() => router.push('/library/history')} />
      <FlatList
        horizontal
        data={history}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        renderItem={({ item }) => <LibraryMediaCard video={item} onPress={() => openVideo(item)} />}
      />
    </View>
  );
}
