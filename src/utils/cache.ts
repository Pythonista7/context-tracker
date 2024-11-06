// src/utils/cache.ts
import { Cache, getPreferenceValues } from "@raycast/api";

const cache = new Cache();
const preferences = getPreferenceValues();

export const CACHE_KEYS = {
  CONTEXT_CHANGE: "context-change-timestamp",
} as const;

export const cacheService = {
  async updateContextChangeTimestamp() {
    // Clear old cache value
    cache.remove(CACHE_KEYS.CONTEXT_CHANGE);
    
    // Set new timestamp
    const newTimestamp = Date.now().toString();
    cache.set(CACHE_KEYS.CONTEXT_CHANGE, newTimestamp);
    
    // Force Raycast to clear its cache
    cache.remove(CACHE_KEYS.CONTEXT_CHANGE);
  },

  getContextChangeTimestamp() {
    return cache.get(CACHE_KEYS.CONTEXT_CHANGE);
  }
};