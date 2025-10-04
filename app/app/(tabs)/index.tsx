import Header from '@/components/specific/Header';
import { VideoCardGrid } from '@/components/specific/Search';
import * as React from 'react';
import { FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const dummy = {
  id: '1',
  title: 'React Native Performance Optimization',
  channel: 'Tech Channel',
  views: '1.2M views',
  duration: '15:30',
  thumbnail: 'https://placehold.co/320x180',
};

export default function Screen() {
  return (
    <SafeAreaView>
      <Header />
      <FlatList
        data={Array(20).fill(dummy)}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <>
            <VideoCardGrid item={item} />
          </>
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 100, paddingHorizontal: 16 }}
      />
    </SafeAreaView>
  );
}
