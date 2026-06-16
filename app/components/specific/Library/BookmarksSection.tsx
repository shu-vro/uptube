import React, { useState } from 'react';
import { Alert, FlatList, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { post } from '@/lib/utils/fetch';
import { SectionHeader } from './SectionHeader';
import { LikedVideosCard } from './LikedVideosCard';
import { BookmarkCollectionCard } from './BookmarkCollectionCard';
import { BookmarkCollectionSummary, LibraryOverview } from '@/types/library';
import Sheet from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

type BookmarksSectionProps = {
  likedVideos: LibraryOverview['likedVideos'];
  bookmarks: BookmarkCollectionSummary[];
  onRefresh: () => void;
};

export function BookmarksSection({ likedVideos, bookmarks, onRefresh }: BookmarksSectionProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    setCreating(true);
    try {
      await post({
        endpoint: '/protected/library/bookmarks',
        params: { name: trimmed },
        throwable: true,
      });
      setName('');
      setCreateOpen(false);
      onRefresh();
    } catch {
      Alert.alert('Error', 'Could not create bookmark collection.');
    } finally {
      setCreating(false);
    }
  };

  const data: Array<{ type: 'liked' } | { type: 'bookmark'; bookmark: BookmarkCollectionSummary }> =
    [{ type: 'liked' }, ...bookmarks.map((bookmark) => ({ type: 'bookmark' as const, bookmark }))];

  if (!likedVideos.count && !bookmarks.length) {
    return (
      <View className="mb-6">
        <SectionHeader title="Bookmarks" onAdd={() => setCreateOpen(true)} />
        <Text variant="muted" className="px-4 text-sm">
          No bookmarks yet. Tap + to create a collection.
        </Text>
        <CreateBookmarkSheet
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          name={name}
          setName={setName}
          creating={creating}
          onCreate={handleCreate}
        />
      </View>
    );
  }

  return (
    <View className="mb-6">
      <SectionHeader title="Bookmarks" onAdd={() => setCreateOpen(true)} />
      <FlatList
        horizontal
        data={data}
        keyExtractor={(item, index) =>
          item.type === 'liked' ? 'liked' : item.bookmark.id || String(index)
        }
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        renderItem={({ item }) =>
          item.type === 'liked' ? (
            <LikedVideosCard
              count={likedVideos.count}
              preview={likedVideos.preview}
              onPress={() => router.push('/library/liked')}
            />
          ) : (
            <BookmarkCollectionCard
              bookmark={item.bookmark}
              onPress={() => router.push(`/library/${item.bookmark.id}`)}
            />
          )
        }
      />
      <CreateBookmarkSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        name={name}
        setName={setName}
        creating={creating}
        onCreate={handleCreate}
      />
    </View>
  );
}

function CreateBookmarkSheet({
  open,
  onClose,
  name,
  setName,
  creating,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  name: string;
  setName: (value: string) => void;
  creating: boolean;
  onCreate: () => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} snapPoints={['35%']}>
      <View className="px-4 pb-6">
        <Text className="mb-4 text-lg font-semibold">New bookmark collection</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Collection name"
          className="mb-4 rounded-xl border border-border bg-muted px-4 py-3 text-foreground"
          placeholderTextColor="#888"
          autoFocus
        />
        <Button onPress={onCreate} disabled={creating || !name.trim()}>
          <Text>{creating ? 'Creating...' : 'Create'}</Text>
        </Button>
      </View>
    </Sheet>
  );
}
