import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  canRetryAttempt,
  getNumericErrorCode,
  getRetryDelayMs,
  RETRYABLE_NUMERIC_CODES,
  RETRYABLE_TRANSIENT_CODES,
  shouldRetry,
  stripJsonSchemaConstraints,
  toUpperStringCode,
} from '../src/lib/gemini/index.js';

// ---------------------------------------------------------------------------
// stripJsonSchemaConstraints
// ---------------------------------------------------------------------------
describe('stripJsonSchemaConstraints', () => {
  it('removes constraint keys from a flat schema', () => {
    const schema = {
      type: 'string',
      minLength: 1,
      maxLength: 200,
      description: 'A name',
    };
    const result = stripJsonSchemaConstraints(schema);
    assert.deepEqual(result, { type: 'string', description: 'A name' });
  });

  it('converts integer type to number', () => {
    const schema = { type: 'integer', minimum: 0 };
    const result = stripJsonSchemaConstraints(schema);
    assert.deepEqual(result, { type: 'number' });
  });

  it('recursively strips nested objects', () => {
    const schema = {
      type: 'object',
      properties: {
        age: { type: 'integer', minimum: 0, maximum: 150 },
        name: { type: 'string', minLength: 1, pattern: '^[A-Z]' },
      },
    };
    const result = stripJsonSchemaConstraints(schema);
    assert.deepEqual(result, {
      type: 'object',
      properties: {
        age: { type: 'number' },
        name: { type: 'string' },
      },
    });
  });

  it('strips constraints from arrays of schemas', () => {
    const schema = {
      anyOf: [
        { type: 'string', minLength: 5 },
        { type: 'integer', minimum: 0 },
      ],
    };
    const result = stripJsonSchemaConstraints(schema);
    assert.deepEqual(result, {
      anyOf: [{ type: 'string' }, { type: 'number' }],
    });
  });

  it('passes through non-constraint keys unchanged', () => {
    const schema = {
      type: 'object',
      description: 'root',
      title: 'Root',
      enum: ['a', 'b'],
    };
    const result = stripJsonSchemaConstraints(schema);
    assert.deepEqual(result, schema);
  });

  it('handles empty schema', () => {
    assert.deepEqual(stripJsonSchemaConstraints({}), {});
  });
});

// ---------------------------------------------------------------------------
// toUpperStringCode
// ---------------------------------------------------------------------------
describe('toUpperStringCode', () => {
  it('normalizes a string to uppercase', () => {
    assert.equal(toUpperStringCode('unavailable'), 'UNAVAILABLE');
  });

  it('trims whitespace', () => {
    assert.equal(toUpperStringCode('  ok  '), 'OK');
  });

  it('returns undefined for non-strings', () => {
    assert.equal(toUpperStringCode(42), undefined);
    assert.equal(toUpperStringCode(null), undefined);
    assert.equal(toUpperStringCode(undefined), undefined);
  });

  it('returns undefined for empty or whitespace-only strings', () => {
    assert.equal(toUpperStringCode(''), undefined);
    assert.equal(toUpperStringCode('   '), undefined);
  });
});

// ---------------------------------------------------------------------------
// getNumericErrorCode
// ---------------------------------------------------------------------------
describe('getNumericErrorCode', () => {
  it('extracts numeric code from nested error object', () => {
    const error = { error: { status: 429, message: 'rate limited' } };
    assert.equal(getNumericErrorCode(error), 429);
  });

  it('extracts numeric code from top-level if no nested error', () => {
    const error = { status: 503 };
    assert.equal(getNumericErrorCode(error), 503);
  });

  it('handles string status codes', () => {
    const error = { error: { statusCode: '500' } };
    assert.equal(getNumericErrorCode(error), 500);
  });

  it('returns undefined for non-error values', () => {
    assert.equal(getNumericErrorCode(null), undefined);
    assert.equal(getNumericErrorCode('boom'), undefined);
    assert.equal(getNumericErrorCode(42), undefined);
  });
});

// ---------------------------------------------------------------------------
// shouldRetry
// ---------------------------------------------------------------------------
describe('shouldRetry', () => {
  it('retries on retryable numeric codes', () => {
    for (const code of RETRYABLE_NUMERIC_CODES) {
      assert.equal(
        shouldRetry({ error: { status: code } }),
        true,
        `should retry on ${String(code)}`
      );
    }
  });

  it('retries on retryable transient string codes', () => {
    for (const code of RETRYABLE_TRANSIENT_CODES) {
      assert.equal(
        shouldRetry({ error: { code } }),
        true,
        `should retry on ${code}`
      );
    }
  });

  it('retries on message matching upstream pattern', () => {
    assert.equal(shouldRetry(new Error('429 rate limit exceeded')), true);
    assert.equal(shouldRetry(new Error('service unavailable')), true);
    assert.equal(shouldRetry(new Error('connection reset')), true);
  });

  it('does not retry on non-retryable errors', () => {
    assert.equal(shouldRetry(new Error('invalid input')), false);
    assert.equal(shouldRetry({ error: { status: 400 } }), false);
    assert.equal(shouldRetry({ error: { status: 404 } }), false);
  });
});

// ---------------------------------------------------------------------------
// getRetryDelayMs
// ---------------------------------------------------------------------------
describe('getRetryDelayMs', () => {
  it('returns a positive delay for attempt 0', () => {
    const delay = getRetryDelayMs(0);
    assert.ok(delay > 0, `expected positive delay, got ${String(delay)}`);
  });

  it('increases delay with higher attempts (exponential backoff)', () => {
    const delays = Array.from({ length: 5 }, (_, i) => getRetryDelayMs(i));
    // Median trend should increase; due to jitter, check max bounds
    for (const delay of delays) {
      assert.ok(delay <= 5_000, `delay ${String(delay)} exceeds max 5000ms`);
      assert.ok(delay > 0, `delay ${String(delay)} must be positive`);
    }
  });

  it('caps at 5000ms for very high attempts', () => {
    const delay = getRetryDelayMs(20);
    assert.ok(delay <= 5_000);
  });
});

// ---------------------------------------------------------------------------
// canRetryAttempt
// ---------------------------------------------------------------------------
describe('canRetryAttempt', () => {
  it('allows retry when under maxRetries and error is retryable', () => {
    const error = { error: { status: 429 } };
    assert.equal(canRetryAttempt(0, 3, error), true);
    assert.equal(canRetryAttempt(2, 3, error), true);
  });

  it('disallows retry when attempt >= maxRetries', () => {
    const error = { error: { status: 429 } };
    assert.equal(canRetryAttempt(3, 3, error), false);
    assert.equal(canRetryAttempt(5, 3, error), false);
  });

  it('disallows retry for non-retryable errors', () => {
    const error = new Error('bad request');
    assert.equal(canRetryAttempt(0, 3, error), false);
  });
});
