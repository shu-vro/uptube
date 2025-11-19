import Gradient from '@/components/specific/Gradient';
import Header from '@/components/specific/Header';
import { VideoCardGrid } from '@/components/specific/Search';
import { get } from '@/lib/utils/fetch';
import { Video } from '@/types/prisma';
import * as React from 'react';
import { FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useSWR from 'swr';

const dummy = {
  id: 'Ez8F0nW6S-w',
  title: 'Complete Git and GitHub Tutorial for Beginners',
  channel_id: 'UCBwmMxybNva6P_5VmxjzwqA',
  short_description: null,
  duration: 4522,
  view_count: 5503286,
  createdAt: '2025-09-19T23:33:33.749Z',
  updatedAt: '2025-09-19T23:33:33.749Z',
  extra: {},
  creator: {
    id: 'UCBwmMxybNva6P_5VmxjzwqA',
    title: 'Apna College',
    description:
      "I'm Shradha, Ex-Microsoft Software Engineer, DRDO. My journey started from a small village of Haryana, in college I learned coding and got 2 internships at M...",
    url: 'https://www.youtube.com/channel/UCBwmMxybNva6P_5VmxjzwqA',
    vanity_channel_url: 'http://www.youtube.com/@ApnaCollegeOfficial',
    createdAt: '2025-09-19T23:33:33.474Z',
    updatedAt: '2025-09-19T23:33:33.474Z',
    extra: {},
    avatars: [
      {
        id: 'https://yt3.googleusercontent.com/FEcjRtez5od8UowDo6tTt9WlE-MrIFEmcwPMTORmK9Swk6KCklOmA3xfIG9WuLWfNYfNThQE=s200-c-k-c0x00ffffff-no-rj?days_since_epoch=20350',
        video_id: null,
        creator_id: 'UCBwmMxybNva6P_5VmxjzwqA',
        width: 200,
        height: 200,
        createdAt: '2025-09-19T23:33:33.498Z',
        updatedAt: '2025-09-19T23:33:33.498Z',
        extra: {},
      },
    ],
  },
  thumbnails: [
    {
      id: 'https://i.ytimg.com/vi_webp/Ez8F0nW6S-w/hq720.webp',
      video_id: 'Ez8F0nW6S-w',
      creator_id: null,
      width: 1280,
      height: 720,
      createdAt: '2025-09-19T23:33:33.749Z',
      updatedAt: '2025-09-19T23:33:33.749Z',
      extra: {},
    },
    {
      id: 'https://i.ytimg.com/vi/Ez8F0nW6S-w/hq720.jpg?sqp=-oaymwEXCKAGEMIDSFryq4qpAwkIARUAAIhCGAE=&rs=AOn4CLApaWi5u11P-ubWsK0hjtqpYd6p4A',
      video_id: 'Ez8F0nW6S-w',
      creator_id: null,
      width: 800,
      height: 450,
      createdAt: '2025-09-19T23:33:33.749Z',
      updatedAt: '2025-09-19T23:33:33.749Z',
      extra: {},
    },
    {
      id: 'https://i.ytimg.com/vi/Ez8F0nW6S-w/hqdefault.jpg?sqp=-oaymwEXCJADEOABSFryq4qpAwkIARUAAIhCGAE=&rs=AOn4CLDkpssAjHfLdf5sFFTjUQ9FKi_B-A',
      video_id: 'Ez8F0nW6S-w',
      creator_id: null,
      width: 400,
      height: 224,
      createdAt: '2025-09-19T23:33:33.749Z',
      updatedAt: '2025-09-19T23:33:33.749Z',
      extra: {},
    },
    {
      id: 'https://i.ytimg.com/vi_webp/Ez8F0nW6S-w/mqdefault.webp',
      video_id: 'Ez8F0nW6S-w',
      creator_id: null,
      width: 320,
      height: 180,
      createdAt: '2025-09-19T23:33:33.749Z',
      updatedAt: '2025-09-19T23:33:33.749Z',
      extra: {},
    },
  ],
} as Video;
// const x : Avatar
export default function Screen() {
  const res = useSWR(
    '/public/yt/home',
    (url) => {
      return get(url);
    },
    { refreshInterval: 120000 }
  );
  return (
    <SafeAreaView>
      <Header />
      <Gradient />
      {res.data?.data ? (
        <FlatList
          data={res.data.data}
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
