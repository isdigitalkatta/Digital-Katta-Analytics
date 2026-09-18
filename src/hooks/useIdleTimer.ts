import { useEffect, useRef, useState, useCallback } from 'react';

export interface UseIdleTimerOptions {
  /**
   * Timeout in milliseconds before user is declared idle.
   * Defaults to 5 minutes (300,000 ms).
   */
  timeoutMs?: number;

  /**
   * Callback invoked when user has been inactive for the timeout period.
   */
  onIdle: () => void;

  /**
   * Whether the idle timer is actively monitoring.
   * Defaults to true.
   */
  enabled?: boolean;

  /**
   * Events to listen to for user interaction.
   */
  events?: string[];

  /**
   * Throttle time in ms to avoid running handler on every mouse movement.
   * Defaults to 1000 ms.
   */
  throttleMs?: number;
}

const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const DEFAULT_THROTTLE_MS = 1000; // 1 second
const DEFAULT_EVENTS = [
  'mousemove',
  'mousedown',
  'keydown',
  'touchstart',
  'scroll',
  'click',
  'wheel',
];

/**
 * Custom React hook that monitors user interaction and triggers an onIdle callback
 * after a specified period of inactivity (default 5 minutes).
 * Automatically resets session storage when idle is triggered.
 */
export function useIdleTimer({
  timeoutMs = DEFAULT_TIMEOUT_MS,
  onIdle,
  enabled = true,
  events = DEFAULT_EVENTS,
  throttleMs = DEFAULT_THROTTLE_MS,
}: UseIdleTimerOptions) {
  const [isIdle, setIsIdle] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActiveRef = useRef<number>(Date.now());
  const lastThrottleRef = useRef<number>(0);
  const onIdleRef = useRef(onIdle);

  // Keep latest onIdle reference without reattaching listeners
  useEffect(() => {
    onIdleRef.current = onIdle;
  }, [onIdle]);

  const triggerIdle = useCallback(() => {
    setIsIdle(true);

    // Reset session storage to lock the application as requested
    try {
      sessionStorage.removeItem('digitalkatta_session_unlocked');
      sessionStorage.clear();
    } catch (e) {
      console.warn('Unable to clear sessionStorage during idle timeout:', e);
    }

    if (onIdleRef.current) {
      onIdleRef.current();
    }
  }, []);

  const resetTimer = useCallback(() => {
    if (!enabled) return;

    const now = Date.now();
    lastActiveRef.current = now;
    setIsIdle(false);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      triggerIdle();
    }, timeoutMs);
  }, [enabled, timeoutMs, triggerIdle]);

  // Handle activity events with throttling for high-frequency events like mousemove/scroll
  const handleActivity = useCallback(() => {
    if (!enabled) return;

    const now = Date.now();
    // Only reset timer if throttle interval has elapsed
    if (now - lastThrottleRef.current > throttleMs) {
      lastThrottleRef.current = now;
      resetTimer();
    }
  }, [enabled, throttleMs, resetTimer]);

  // Handle document visibility change (e.g. user returns to tab after 5+ mins away)
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const elapsed = Date.now() - lastActiveRef.current;
        if (elapsed >= timeoutMs) {
          triggerIdle();
        } else {
          // Restart remaining timer
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => {
            triggerIdle();
          }, timeoutMs - elapsed);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, timeoutMs, triggerIdle]);

  // Attach DOM interaction listeners
  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Initialize timer
    resetTimer();

    // Attach listeners
    events.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity, { passive: true });
    });

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      events.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity);
      });
    };
  }, [enabled, events, handleActivity, resetTimer]);

  const getRemainingTime = useCallback(() => {
    const elapsed = Date.now() - lastActiveRef.current;
    return Math.max(0, timeoutMs - elapsed);
  }, [timeoutMs]);

  return {
    isIdle,
    reset: resetTimer,
    getRemainingTime,
  };
}
