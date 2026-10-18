import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isMemoryRateLimited, type RateLimitEntry } from './rate-limit';

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(1000); });
afterEach(() => vi.useRealTimers());

describe('bounded per-process form counters', () => {
  it.each([10 * 60 * 1000, 15 * 60 * 1000])('keeps five attempts and the original fixed %d ms window', windowMs => {
    const store = new Map<string, RateLimitEntry>();
    const options = { limit: 5, windowMs };
    for (let attempt = 0; attempt < 5; attempt++) expect(isMemoryRateLimited(store, 'customer', options)).toBe(false);
    expect(isMemoryRateLimited(store, 'customer', options)).toBe(true);
    vi.setSystemTime(1000 + windowMs - 1);
    expect(isMemoryRateLimited(store, 'customer', options)).toBe(true);
    vi.setSystemTime(1000 + windowMs);
    expect(isMemoryRateLimited(store, 'customer', options)).toBe(false);
    expect(store.get('customer')).toEqual({ count: 1, resetAt: 1000 + 2 * windowMs });
  });

  it('rejects new keys at capacity while retaining active counters and their deadlines', () => {
    const store = new Map<string, RateLimitEntry>();
    const options = { limit: 5, windowMs: 10000, capacity: 2 };
    expect(isMemoryRateLimited(store, 'first', options)).toBe(false);
    expect(isMemoryRateLimited(store, 'second', options)).toBe(false);
    expect(isMemoryRateLimited(store, 'third', options)).toBe(true);
    expect(store.has('third')).toBe(false);
    vi.setSystemTime(1500);
    for (let attempt = 0; attempt < 4; attempt++) expect(isMemoryRateLimited(store, 'first', options)).toBe(false);
    expect(isMemoryRateLimited(store, 'first', options)).toBe(true);
    expect(store.get('first')).toEqual({ count: 5, resetAt: 11000 });
    expect(store.get('second')).toEqual({ count: 1, resetAt: 11000 });
    expect(store.size).toBe(2);
  });

  it('reclaims expired keys before inserting and leaves unexpired windows intact', () => {
    const store = new Map<string, RateLimitEntry>();
    const options = { limit: 5, windowMs: 1000, capacity: 2 };
    isMemoryRateLimited(store, 'older', options);
    vi.setSystemTime(1500);
    isMemoryRateLimited(store, 'newer', options);
    vi.setSystemTime(2000);
    expect(isMemoryRateLimited(store, 'fresh', options)).toBe(false);
    expect(store.has('older')).toBe(false);
    expect(store.get('newer')).toEqual({ count: 1, resetAt: 2500 });
    expect(store.size).toBe(2);
    expect(isMemoryRateLimited(store, 'older', options)).toBe(true);
    vi.setSystemTime(2500);
    expect(isMemoryRateLimited(store, 'older', options)).toBe(false);
    expect(store.has('newer')).toBe(false);
  });

  it('does not grow beyond the default 5000 keys or evict a limited caller during a flood', () => {
    const store = new Map<string, RateLimitEntry>();
    const options = { limit: 5, windowMs: 10000 };
    for (let index = 0; index < 5000; index++) expect(isMemoryRateLimited(store, `key-${index}`, options)).toBe(false);
    for (let attempt = 0; attempt < 4; attempt++) isMemoryRateLimited(store, 'key-0', options);
    for (let index = 5000; index < 5020; index++) expect(isMemoryRateLimited(store, `key-${index}`, options)).toBe(true);
    expect(store.size).toBe(5000);
    expect(isMemoryRateLimited(store, 'key-0', options)).toBe(true);
    expect(store.get('key-0')).toEqual({ count: 5, resetAt: 11000 });
    vi.setSystemTime(11000);
    expect(isMemoryRateLimited(store, 'new-window', options)).toBe(false);
    expect(store.size).toBe(1);
  });

  it('retains reused global/HMR entries without discarding active keys to satisfy a smaller cap', () => {
    const store = new Map<string, RateLimitEntry>([
      ['first', { count: 4, resetAt: 5000 }], ['second', { count: 2, resetAt: 5000 }],
      ['third', { count: 5, resetAt: 5000 }],
    ]);
    const options = { limit: 5, windowMs: 1000, capacity: 2 };
    expect(isMemoryRateLimited(store, 'new', options)).toBe(true);
    expect(isMemoryRateLimited(store, 'first', options)).toBe(false);
    expect(isMemoryRateLimited(store, 'first', options)).toBe(true);
    expect(isMemoryRateLimited(store, 'third', options)).toBe(true);
    expect(store.size).toBe(3);
    expect(store.get('second')).toEqual({ count: 2, resetAt: 5000 });
  });
});
