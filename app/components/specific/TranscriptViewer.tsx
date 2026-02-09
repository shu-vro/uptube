import React, { useRef, useEffect, useMemo, useState } from 'react';
import { ScrollView, Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react-native';
import { formatTime } from '@/lib/utils/number-format';

type CaptionEntry = {
  text: string;
  start: number;
  duration: number;
};

type TranscriptViewerProps = {
  captions: Array<{
    base_url_to_json?: {
      transcript?: {
        text?: Array<{
          '#text'?: string;
          $_start?: string;
          $_dur?: string;
        }>;
      };
    };
    language_code?: string;
  }>;
  currentTime: number;
  onSeek?: (time: number) => void;
  isPaused?: () => boolean;
};

export function TranscriptViewer({
  captions,
  currentTime,
  onSeek,
  isPaused,
}: TranscriptViewerProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const flashListRef = useRef<FlashListRef<CaptionEntry>>(null);
  const [itemLayouts, setItemLayouts] = useState<{ [key: number]: number }>({});
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [showSyncButton, setShowSyncButton] = useState(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const paused = isPaused?.();

  const sortedCaptions = useMemo(() => {
    if (!captions || captions.length === 0) return [];

    const entries: CaptionEntry[] = [];

    captions.forEach((caption) => {
      const textEntries = caption.base_url_to_json?.transcript?.text;
      if (textEntries && Array.isArray(textEntries)) {
        textEntries.forEach((entry) => {
          const text = entry['#text'];
          const start = parseFloat(entry['$_start'] || '0');
          const duration = parseFloat(entry['$_dur'] || '0');

          if (text) {
            entries.push({ text, start, duration });
          }
        });
      }
    });

    const sorted = entries.sort((a, b) => a.start - b.start);

    for (let i = 0; i < sorted.length; i++) {
      if (i < sorted.length - 1) {
        sorted[i].duration = sorted[i + 1].start - sorted[i].start;
      }
    }

    // Group every 3 transcripts into one
    const grouped: CaptionEntry[] = [];
    for (let i = 0; i < sorted.length; i += 3) {
      const group = sorted.slice(i, i + 3);
      if (group.length > 0) {
        const combinedText = group.map((entry) => entry.text).join(' ');
        const startTime = group[0].start;
        const endTime = group[group.length - 1].start + group[group.length - 1].duration;
        grouped.push({
          text: combinedText,
          start: startTime,
          duration: endTime - startTime,
        });
      }
    }

    return grouped;
  }, [captions]);

  const activeCaptionIndex = useMemo(() => {
    const LOOKAHEAD_BUFFER = 0.2;
    const adjustedTime = currentTime + LOOKAHEAD_BUFFER;

    return sortedCaptions.findIndex((caption) => {
      return adjustedTime >= caption.start && adjustedTime < caption.start + caption.duration;
    });
  }, [sortedCaptions, currentTime]);

  useEffect(() => {
    // If paused, we don't auto-scroll and we show sync button if user scrolled away or if it was already showing
    if (paused) {
      if (isUserScrolling) {
        setShowSyncButton(true);
      }
      return;
    }

    if (activeCaptionIndex >= 0 && !isUserScrolling) {
      setShowSyncButton(false);
      if (sortedCaptions.length > 50) {
        flashListRef.current?.scrollToIndex({
          index: activeCaptionIndex,
          animated: true,
          viewPosition: 0.3,
        });
      } else if (itemLayouts[activeCaptionIndex] !== undefined) {
        const yOffset = itemLayouts[activeCaptionIndex];
        scrollViewRef.current?.scrollTo({ y: Math.max(0, yOffset - 100), animated: true });
      }
    } else if (isUserScrolling) {
      setShowSyncButton(true);
    }
  }, [activeCaptionIndex, itemLayouts, sortedCaptions.length, isUserScrolling, paused]);

  const handleSync = () => {
    setIsUserScrolling(false);
    setShowSyncButton(false);
    if (activeCaptionIndex >= 0) {
      if (sortedCaptions.length > 50) {
        flashListRef.current?.scrollToIndex({
          index: activeCaptionIndex,
          animated: true,
          viewPosition: 0.3,
        });
      } else if (itemLayouts[activeCaptionIndex] !== undefined) {
        const yOffset = itemLayouts[activeCaptionIndex];
        scrollViewRef.current?.scrollTo({ y: Math.max(0, yOffset - 100), animated: true });
      }
    }
  };

  const handleScrollBegin = () => {
    setIsUserScrolling(true);
    setShowSyncButton(true);
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
  };

  const handleScrollEnd = () => {
    // If paused, we stay in user scrolling mode until manually synced
    if (paused) return;

    // Re-enable auto-scroll after 3 seconds of no scrolling
    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
      setShowSyncButton(false);
    }, 3000);
  };

  if (!sortedCaptions || sortedCaptions.length === 0) {
    return null;
  }

  const renderItem = ({ item, index }: { item: CaptionEntry; index: number }) => {
    const isActive = index === activeCaptionIndex;
    return (
      <Pressable
        onLayout={(event) => {
          const { y } = event.nativeEvent.layout;
          setItemLayouts((prev) => ({ ...prev, [index]: y }));
        }}
        onPress={() => onSeek?.(item.start)}
        className={`mb-3 flex-row items-start justify-start gap-2 rounded-lg p-3 ${
          isActive ? 'border border-primary bg-primary/20' : ''
        }`}>
        <Text className="mt-1 shrink-0 rounded border border-primary px-1 py-0.5 text-xs text-primary">
          {formatTime(item.start)}:{formatTime(item.start + item.duration)}
        </Text>
        <Text
          className={`flex-1 flex-shrink text-sm ${
            isActive ? 'font-medium text-foreground' : 'text-muted-foreground'
          }`}>
          {decodeHtmlEntities(item.text)}
        </Text>
      </Pressable>
    );
  };

  // Use FlashList for better performance with large lists
  const content =
    sortedCaptions.length > 50 ? (
      <FlashList
        ref={flashListRef}
        data={sortedCaptions}
        renderItem={renderItem}
        keyExtractor={(_, index) => index.toString()}
        showsVerticalScrollIndicator={true}
        onScrollBeginDrag={handleScrollBegin}
        onMomentumScrollEnd={handleScrollEnd}
      />
    ) : (
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={true}
        onScrollBeginDrag={handleScrollBegin}
        onMomentumScrollEnd={handleScrollEnd}>
        {sortedCaptions.map((caption, index) => renderItem({ item: caption, index }))}
      </ScrollView>
    );

  return (
    <View className="flex-1">
      {content}
      {showSyncButton && (
        <View className="absolute bottom-4 left-0 right-0 items-center justify-center">
          <Button
            onPress={handleSync}
            variant="secondary"
            className="flex-row items-center gap-2 rounded-full border border-primary bg-background px-4 py-2 opacity-90 shadow-lg">
            <RefreshCcw size={16} strokeWidth={3} className="text-primary" />
            <Text className="font-bold text-primary">Sync with video</Text>
          </Button>
        </View>
      )}
    </View>
  );
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}
