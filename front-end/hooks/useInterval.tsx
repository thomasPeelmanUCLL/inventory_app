import { useEffect, useRef } from 'react';

const useInterval = (callback: () => void, delay: number | null) => {
  const savedCallback = useRef<() => void>();

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    if (delay === null) return; // Don't do anything if delay is null.
    const tick = () => savedCallback.current && savedCallback.current();
    const id = setInterval(tick, delay);
    return () => clearInterval(id); // Cleanup on unmount or delay change.
  }, [delay]);
};

export default useInterval;
