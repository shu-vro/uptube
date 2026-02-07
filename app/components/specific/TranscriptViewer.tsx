import React, { useRef, useEffect, useMemo, useState } from 'react';
import { ScrollView, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';

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
};

export function TranscriptViewer({ captions, currentTime, onSeek }: TranscriptViewerProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [itemLayouts, setItemLayouts] = useState<{ [key: number]: number }>({});

  const sortedCaptions = useMemo(() => {
    if (!captions || captions.length === 0) return [];

    const entries: CaptionEntry[] = [];

    captions.forEach((caption) => {
      console.log(caption);
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

    return sorted;
  }, [captions]);

  const activeCaptionIndex = useMemo(() => {
    const LOOKAHEAD_BUFFER = 0.2;
    const adjustedTime = currentTime + LOOKAHEAD_BUFFER;

    return sortedCaptions.findIndex((caption) => {
      return adjustedTime >= caption.start && adjustedTime < caption.start + caption.duration;
    });
  }, [sortedCaptions, currentTime]);

  useEffect(() => {
    if (activeCaptionIndex >= 0 && itemLayouts[activeCaptionIndex] !== undefined) {
      const yOffset = itemLayouts[activeCaptionIndex];
      scrollViewRef.current?.scrollTo({ y: Math.max(0, yOffset - 100), animated: true });
    }
  }, [activeCaptionIndex, itemLayouts]);

  if (!sortedCaptions || sortedCaptions.length === 0) {
    return null;
  }

  return (
    <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={true}>
      {sortedCaptions.map((caption, index) => {
        const isActive = index === activeCaptionIndex;
        return (
          <Pressable
            key={index}
            onLayout={(event) => {
              const { y } = event.nativeEvent.layout;
              setItemLayouts((prev) => ({ ...prev, [index]: y }));
            }}
            onPress={() => onSeek?.(caption.start)}
            className={`mb-3 flex-1 flex-row items-center justify-start gap-2 rounded-lg p-3 ${
              isActive ? 'border border-primary bg-primary/20' : ''
            }`}>
            <Text className="rounded border border-primary px-1 py-0.5 text-xs text-primary">
              {formatTime(caption.start)} - {formatTime(caption.start + caption.duration)}
            </Text>
            <Text
              className={`text-sm ${
                isActive ? 'font-medium text-foreground' : 'text-muted-foreground'
              }`}>
              {decodeHtmlEntities(caption.text)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}
