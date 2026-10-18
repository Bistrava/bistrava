export type RateLimitEntry = { count: number; resetAt: number };

type RateLimitOptions = { limit: number; windowMs: number; capacity?: number };

// These counters remain per process. Bound their size for durable Node servers
// without evicting active counters, which would let callers bypass a window.
export function isMemoryRateLimited(
  store: Map<string, RateLimitEntry>,
  key: string,
  { limit, windowMs, capacity = 5000 }: RateLimitOptions,
) {
  const now = Date.now();
  const current = store.get(key);
  if (current && current.resetAt > now) {
    if (current.count >= limit) return true;
    current.count += 1;
    return false;
  }

  // Clean up only when a key needs a new window; no timer or background loop.
  for (const [storedKey, entry] of store) {
    if (entry.resetAt <= now) store.delete(storedKey);
  }
  // Reject new keys while full. Existing active keys keep their counters and
  // deadlines, even if an older HMR process supplied an already oversized map.
  if (store.size >= capacity) return true;
  store.set(key, { count: 1, resetAt: now + windowMs });
  return false;
}
