import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import {
  clearSearchStoreLocal,
  getCurrentSearchStore,
  type SearchStoreSlot,
  setSearchStoreForTesting,
} from '../src/lib/gemini/search-store.js';

describe('gemini/search-store', () => {
  afterEach(() => {
    clearSearchStoreLocal();
  });

  describe('getCurrentSearchStore', () => {
    it('returns undefined when no store exists', () => {
      assert.equal(getCurrentSearchStore(), undefined);
    });

    it('returns the current store after set', () => {
      const slot: SearchStoreSlot = {
        storeName: 'fileSearchStores/test-123',
        displayName: 'test-repo',
        documentCount: 10,
        createdAt: Date.now(),
      };
      setSearchStoreForTesting(slot);
      assert.deepEqual(getCurrentSearchStore(), slot);
    });
  });

  describe('clearSearchStoreLocal', () => {
    it('clears the store slot without API call', () => {
      setSearchStoreForTesting({
        storeName: 'fileSearchStores/test-123',
        displayName: 'test-repo',
        documentCount: 5,
        createdAt: Date.now(),
      });
      assert.notEqual(getCurrentSearchStore(), undefined);
      clearSearchStoreLocal();
      assert.equal(getCurrentSearchStore(), undefined);
    });
  });

  describe('setSearchStoreForTesting', () => {
    it('can set to undefined', () => {
      setSearchStoreForTesting({
        storeName: 'fileSearchStores/abc',
        displayName: 'abc',
        documentCount: 1,
        createdAt: Date.now(),
      });
      setSearchStoreForTesting(undefined);
      assert.equal(getCurrentSearchStore(), undefined);
    });
  });
});
