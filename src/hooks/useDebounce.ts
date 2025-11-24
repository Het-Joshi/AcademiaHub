import { useState, useEffect } from 'react';
export function useDebounce<T>(value: T, delay: number): T {
  // Waits for the value to stop changing before updating
  // Used to prevent too many API calls
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}