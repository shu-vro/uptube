import { useEffect, useRef } from 'react';
import { post } from '@/lib/utils/fetch';

export function useRecordHistory(videoId?: string, debounceMs = 0) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRecordedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!videoId) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      if (lastRecordedRef.current === videoId) return;
      lastRecordedRef.current = videoId;

      post({
        endpoint: '/protected/library/history',
        params: { videoId },
      }).catch(() => {
        lastRecordedRef.current = null;
      });
    }, debounceMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [videoId, debounceMs]);
}
