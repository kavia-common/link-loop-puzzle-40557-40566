import { useCallback, useEffect, useRef, useState } from 'react';

// PUBLIC_INTERFACE
export function useTimer(startRunning = true) {
  /** A simple seconds timer with pause/resume/reset */
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(startRunning);
  const rafRef = useRef(0);
  const lastTick = useRef(performance.now());

  const loop = useCallback((now) => {
    if (!running) return;
    const delta = (now - lastTick.current) / 1000;
    if (delta >= 0.25) {
      setSeconds((s) => s + delta);
      lastTick.current = now;
    }
    rafRef.current = requestAnimationFrame(loop);
  }, [running]);

  useEffect(() => {
    if (running) {
      lastTick.current = performance.now();
      rafRef.current = requestAnimationFrame(loop);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [running, loop]);

  const pause = useCallback(() => setRunning(false), []);
  const resume = useCallback(() => setRunning(true), []);
  const reset = useCallback(() => {
    setSeconds(0);
    lastTick.current = performance.now();
  }, []);

  return { seconds, running, pause, resume, reset };
}
