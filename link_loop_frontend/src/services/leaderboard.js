const BASE = process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_BASE || '';

function isEnabled() {
  return !!BASE;
}

// PUBLIC_INTERFACE
export async function fetchLeaderboard() {
  /** Fetch leaderboard entries if backend is configured, else return empty list. */
  if (!isEnabled()) return [];
  const res = await fetch(`${BASE}/leaderboard`, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error('Failed to fetch leaderboard');
  return res.json();
}

// PUBLIC_INTERFACE
export async function submitScore({ name, seconds }) {
  /** Submit a score to the backend if enabled, otherwise no-op. */
  if (!isEnabled()) return { ok: false, reason: 'Leaderboard not enabled' };
  const res = await fetch(`${BASE}/leaderboard`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, seconds })
  });
  if (!res.ok) throw new Error('Failed to submit score');
  return res.json();
}

// PUBLIC_INTERFACE
export function leaderboardEnabled() {
  /** Whether leaderboard integration is enabled based on env configuration. */
  return isEnabled();
}
