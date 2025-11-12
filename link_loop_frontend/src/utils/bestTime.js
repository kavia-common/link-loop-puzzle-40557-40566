//
// Local best time tracking utilities for Link Loop
//

const STORAGE_KEY = 'linkloop_best_time_ms';

// PUBLIC_INTERFACE
export function getBestTimeMs() {
  /** Returns the stored best time in milliseconds, or null if none. */
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

// PUBLIC_INTERFACE
export function setBestTimeMs(ms) {
  /** Persists the best time (in milliseconds) to localStorage. */
  try {
    localStorage.setItem(STORAGE_KEY, String(Math.max(0, Math.floor(ms))));
  } catch {
    // ignore write failures (e.g., privacy mode)
  }
}

// PUBLIC_INTERFACE
export function clearBestTime() {
  /** Clears the stored best time. Useful for debugging. */
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
