import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import useSWR from 'swr';
import {
  ArrowBigDown,
  Bookmark,
  Download as DownloadIcon,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { get, post } from '@/lib/utils/fetch';
import { miniNumber } from '@/lib/utils/number-format';
import { VideoLibraryStatus } from '@/types/library';
import { Video } from '@/types/prisma';
import { useColorScheme } from 'nativewind';
import { THEME } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { BookmarkPickerSheet } from '@/components/specific/Library/BookmarkPickerSheet';

type VideoActionsProps = {
  video: Video;
  variant?: 'pill' | 'overlay';
  onDownload: () => void;
  showDislike?: boolean;
};

export default function VideoActions({
  video,
  variant = 'pill',
  onDownload,
  showDislike = true,
}: VideoActionsProps) {
  const { colorScheme } = useColorScheme();
  const colors = THEME[colorScheme ?? 'light'];
  const [bookmarkOpen, setBookmarkOpen] = useState(false);
  const [optimisticLiked, setOptimisticLiked] = useState<boolean | null>(null);

  const { data: status, mutate } = useSWR<VideoLibraryStatus>(
    video?.id ? `/protected/library/videos/${video.id}/status` : null,
    (endpoint: string) => get({ endpoint, throwable: true })
  );

  const liked = optimisticLiked ?? status?.liked ?? false;
  const bookmarked = status?.bookmarked ?? false;
  const likeCount = Number(video.like_count || 0) + (liked ? 1 : 0);

  const toggleLike = async () => {
    const nextLiked = !liked;
    setOptimisticLiked(nextLiked);
    try {
      const result: { liked: boolean } = await post({
        endpoint: `/protected/library/likes/${video.id}`,
        throwable: true,
      });
      setOptimisticLiked(result.liked);
      await mutate({ ...status!, liked: result.liked, bookmarked }, false);
    } catch {
      setOptimisticLiked(null);
    }
  };

  const activeColor = variant === 'overlay' ? colors.primary : colors.primary;
  const inactiveColor = variant === 'overlay' ? 'white' : colors.foreground;

  if (variant === 'overlay') {
    return (
      <>
        <Pressable className="items-center" hitSlop={10} onPress={toggleLike}>
          <ThumbsUp
            size={24}
            color={liked ? activeColor : inactiveColor}
            fill={liked ? activeColor : 'transparent'}
          />
          <Text
            className={cn('mt-1 text-xs drop-shadow-md', liked ? 'text-primary' : 'text-white')}>
            {miniNumber(likeCount)}
          </Text>
        </Pressable>

        {showDislike ? (
          <Pressable className="items-center" hitSlop={10}>
            <ThumbsDown size={24} color="white" />
            <Text className="mt-1 text-xs text-white drop-shadow-md">
              {miniNumber(Number(video.dislike_count) || 0)}
            </Text>
          </Pressable>
        ) : null}

        <Pressable className="items-center" hitSlop={10} onPress={() => setBookmarkOpen(true)}>
          <Bookmark
            size={24}
            color={bookmarked ? activeColor : inactiveColor}
            fill={bookmarked ? activeColor : 'transparent'}
          />
        </Pressable>

        <Pressable className="items-center" hitSlop={10} onPress={onDownload}>
          <DownloadIcon size={24} color="white" />
        </Pressable>

        <BookmarkPickerSheet
          open={bookmarkOpen}
          onClose={() => setBookmarkOpen(false)}
          videoId={video.id}
          onStatusChange={() => mutate()}
        />
      </>
    );
  }

  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
        <Pressable
          onPress={toggleLike}
          className={cn(
            'mr-4 flex-row items-center gap-1 rounded-full px-4 py-2',
            liked ? 'bg-primary/20' : 'bg-muted'
          )}>
          <ThumbsUp
            size={18}
            color={liked ? colors.primary : colors.foreground}
            fill={liked ? colors.primary : 'transparent'}
          />
          <Text className="font-medium">{miniNumber(likeCount)}</Text>
        </Pressable>

        {showDislike ? (
          <Pressable className="mr-4 flex-row items-center gap-1 rounded-full bg-muted px-4 py-2">
            <ThumbsDown size={18} color={colors.foreground} />
            <Text className="font-medium">{miniNumber(Number(video.dislike_count) || 0)}</Text>
          </Pressable>
        ) : null}

        <Pressable
          onPress={() => setBookmarkOpen(true)}
          className={cn(
            'mr-4 flex-row items-center gap-1 rounded-full px-4 py-2',
            bookmarked ? 'bg-primary/20' : 'bg-muted'
          )}>
          <Bookmark
            size={18}
            color={bookmarked ? colors.primary : colors.foreground}
            fill={bookmarked ? colors.primary : 'transparent'}
          />
          <Text className="font-medium">Save</Text>
        </Pressable>

        <Pressable
          className="mr-4 flex-row items-center gap-1 rounded-full bg-muted px-4 py-2"
          onPress={onDownload}>
          <ArrowBigDown size={24} color={colors.foreground} />
          <Text className="font-medium">Download</Text>
        </Pressable>
      </ScrollView>

      <BookmarkPickerSheet
        open={bookmarkOpen}
        onClose={() => setBookmarkOpen(false)}
        videoId={video.id}
        onStatusChange={() => mutate()}
      />
    </>
  );
}
