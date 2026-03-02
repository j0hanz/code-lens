// Public API re-exports from the gemini module.
// Consumers should import from './gemini/index.js' (or './gemini.js' via the barrel).

// Types
export type {
  CodeExecutionBlock,
  CodeExecutionResponse,
  CodeExecutionResultBlock,
  GeminiLogHandler,
  GeminiOnLog,
  GeminiRequestExecutionOptions,
  GeminiStructuredRequest,
  GeminiStructuredRequestOptions,
  GeminiThinkingLevel,
  JsonObject,
} from './types.js';

// Schema stripping
export { stripJsonSchemaConstraints } from './schema.js';

// Retry utilities
export {
  canRetryAttempt,
  getNumericErrorCode,
  getRetryDelayMs,
  RETRYABLE_NUMERIC_CODES,
  RETRYABLE_TRANSIENT_CODES,
  shouldRetry,
  toUpperStringCode,
} from './retry.js';

// Client / context / events
export {
  geminiEvents,
  getCurrentRequestId,
  setClientForTesting,
} from './client.js';

// Generation functions + queue snapshot
export {
  generateGroundedContent,
  generateStructuredJson,
  generateWithCodeExecution,
  getGeminiQueueSnapshot,
} from './generate.js';
