import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import {
  clearDiffCacheLocal,
  type DiffCacheSlot,
  getCurrentDiffCache,
  isDiffCacheEnabled,
  setDiffCacheForTesting,
  shouldCacheDiff,
} from '../src/lib/gemini/cache.js';

describe('gemini/cache', () => {
  afterEach(() => {
    clearDiffCacheLocal();
    delete process.env.GEMINI_DIFF_CACHE_ENABLED;
    delete process.env.GEMINI_DIFF_CACHE_TTL_S;
  });

  describe('isDiffCacheEnabled', () => {
    it('returns false by default', () => {
      assert.equal(isDiffCacheEnabled(), false);
    });

    it('returns true when GEMINI_DIFF_CACHE_ENABLED=1', () => {
      process.env.GEMINI_DIFF_CACHE_ENABLED = '1';
      assert.equal(isDiffCacheEnabled(), true);
    });

    it('returns true when GEMINI_DIFF_CACHE_ENABLED=true', () => {
      process.env.GEMINI_DIFF_CACHE_ENABLED = 'true';
      assert.equal(isDiffCacheEnabled(), true);
    });

    it('returns false for other values', () => {
      process.env.GEMINI_DIFF_CACHE_ENABLED = 'yes';
      assert.equal(isDiffCacheEnabled(), false);
    });
  });

  describe('shouldCacheDiff', () => {
    it('returns false when caching is disabled', () => {
      assert.equal(shouldCacheDiff(100_000), false);
    });

    it('returns false for small diffs even when enabled', () => {
      process.env.GEMINI_DIFF_CACHE_ENABLED = '1';
      assert.equal(shouldCacheDiff(1_000), false);
    });

    it('returns true for large diffs when enabled', () => {
      process.env.GEMINI_DIFF_CACHE_ENABLED = '1';
      assert.equal(shouldCacheDiff(50_000), true);
    });
  });

  describe('getCurrentDiffCache', () => {
    it('returns undefined when no cache exists', () => {
      assert.equal(getCurrentDiffCache(), undefined);
    });

    it('returns the cache slot when model matches', () => {
      const slot: DiffCacheSlot = {
        cacheName: 'cachedContents/test123',
        model: 'gemini-3-flash-preview',
        createdAt: Date.now(),
      };
      setDiffCacheForTesting(slot);
      const result = getCurrentDiffCache('gemini-3-flash-preview');
      assert.deepEqual(result, slot);
    });

    it('returns undefined when model does not match', () => {
      const slot: DiffCacheSlot = {
        cacheName: 'cachedContents/test123',
        model: 'gemini-3-flash-preview',
        createdAt: Date.now(),
      };
      setDiffCacheForTesting(slot);
      assert.equal(getCurrentDiffCache('gemini-2.5-flash'), undefined);
    });
  });

  describe('clearDiffCacheLocal', () => {
    it('clears the cache slot without API call', () => {
      setDiffCacheForTesting({
        cacheName: 'cachedContents/test123',
        model: 'gemini-3-flash-preview',
        createdAt: Date.now(),
      });
      assert.notEqual(getCurrentDiffCache('gemini-3-flash-preview'), undefined);
      clearDiffCacheLocal();
      assert.equal(getCurrentDiffCache('gemini-3-flash-preview'), undefined);
    });
  });
});
