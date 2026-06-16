import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, TextInput, View } from 'react-native';
import useSWR from 'swr';
import { Check, Plus } from 'lucide-react-native';
import Sheet from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { del, get, post } from '@/lib/utils/fetch';
import { BookmarkCollection, VideoLibraryStatus } from '@/types/library';
import { useColorScheme } from 'nativewind';
import { THEME } from '@/lib/theme';
import { cn } from '@/lib/utils';

type BookmarkPickerSheetProps = {
  open: boolean;
  onClose: () => void;
  videoId: string;
  onStatusChange?: () => void;
};

export function BookmarkPickerSheet({
  open,
  onClose,
  videoId,
  onStatusChange,
}: BookmarkPickerSheetProps) {
  const { colorScheme } = useColorScheme();
  const colors = THEME[colorScheme ?? 'light'];
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { data: status, mutate: mutateStatus } = useSWR<VideoLibraryStatus>(
    open && videoId ? `/protected/library/videos/${videoId}/status` : null,
    (endpoint: string) => get({ endpoint, throwable: true })
  );

  const { data: bookmarks, mutate: mutateBookmarks } = useSWR<BookmarkCollection[]>(
    open ? '/protected/library/bookmarks' : null,
    (endpoint: string) => get({ endpoint, throwable: true })
  );

  const refresh = async () => {
    await Promise.all([mutateStatus(), mutateBookmarks()]);
    onStatusChange?.();
  };

  const toggleBookmark = async (bookmarkId: string, isSelected: boolean) => {
    setTogglingId(bookmarkId);
    try {
      if (isSelected) {
        await del({
          endpoint: `/protected/library/bookmarks/${bookmarkId}/videos/${videoId}`,
          throwable: true,
        });
      } else {
        await post({
          endpoint: `/protected/library/bookmarks/${bookmarkId}/videos/${videoId}`,
          throwable: true,
        });
      }
      await refresh();
      onClose();
    } catch {
      Alert.alert('Error', 'Could not update bookmark.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    setCreating(true);
    try {
      const created: BookmarkCollection = await post({
        endpoint: '/protected/library/bookmarks',
        params: { name: trimmed },
        throwable: true,
      });
      await post({
        endpoint: `/protected/library/bookmarks/${created.id}/videos/${videoId}`,
        throwable: true,
      });
      setNewName('');
      setShowCreate(false);
      await refresh();
      onClose();
    } catch {
      Alert.alert('Error', 'Could not create bookmark collection.');
    } finally {
      setCreating(false);
    }
  };

  const selectedIds = new Set(status?.bookmarkIds ?? []);

  return (
    <Sheet open={open} onClose={onClose} snapPoints={['50%', '85%']}>
      <View className="px-4 pb-8">
        <Text className="mb-4 text-lg font-semibold">Save to bookmark</Text>

        {!bookmarks ? (
          <ActivityIndicator />
        ) : (
          <>
            {bookmarks.map((bookmark) => {
              const isSelected = selectedIds.has(bookmark.id);
              const isLoading = togglingId === bookmark.id;
              return (
                <Pressable
                  key={bookmark.id}
                  onPress={() => toggleBookmark(bookmark.id, isSelected)}
                  disabled={isLoading}
                  className={cn(
                    'mb-2 flex-row items-center justify-between rounded-xl border border-border px-4 py-3 active:opacity-80',
                    isSelected ? 'bg-primary/20' : 'bg-card'
                  )}>
                  <View className="mr-3 flex-1">
                    <Text
                      className={cn('font-medium', isSelected ? 'text-primary' : 'text-foreground')}
                      numberOfLines={1}>
                      {bookmark.name}
                    </Text>
                    <Text variant="muted" className="text-xs">
                      {bookmark.count} videos
                    </Text>
                  </View>
                  {isLoading ? (
                    <ActivityIndicator size="small" />
                  ) : isSelected ? (
                    <Check size={20} color={colors.primary} />
                  ) : null}
                </Pressable>
              );
            })}

            {showCreate ? (
              <View className="mt-2">
                <TextInput
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="Collection name"
                  className="mb-3 rounded-xl border border-border bg-card px-4 py-3 text-foreground"
                  placeholderTextColor={colors.mutedForeground}
                  autoFocus
                />
                <Button onPress={handleCreate} disabled={creating || !newName.trim()}>
                  <Text>{creating ? 'Creating...' : 'Create and save'}</Text>
                </Button>
              </View>
            ) : (
              <Pressable
                onPress={() => setShowCreate(true)}
                className="mt-2 flex-row items-center gap-2 rounded-xl px-2 py-3 active:bg-muted">
                <Plus size={20} color={colors.primary} />
                <Text className="font-medium text-primary">New collection</Text>
              </Pressable>
            )}
          </>
        )}
      </View>
    </Sheet>
  );
}
