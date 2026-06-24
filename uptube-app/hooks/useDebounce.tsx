import { useEffect, useRef, useState } from 'react';

export default function useDebounce<T>(value: T, delay = 200) {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = window?.setTimeout(() => {
      setDebouncedValue(value);
      timerRef.current = null;
    }, delay);

    return () => {
      if (timerRef.current != null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [value, delay]);

  return debouncedValue;
}
