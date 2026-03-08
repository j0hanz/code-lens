import { getErrorMessage } from './errors.js';
import type { ToolContentBlock } from './tool-response.js';
import type { createErrorToolResponse } from './tool-response.js';

export const STEP_STARTING = 0;
export const STEP_VALIDATING = 1;
export const STEP_BUILDING_PROMPT = 2;
export const STEP_CALLING_MODEL = 3;
export const STEP_VALIDATING_RESPONSE = 4;
export const STEP_FINALIZING = 5;
const TASK_PROGRESS_TOTAL = STEP_FINALIZING + 1;

const INPUT_VALIDATION_FAILED = 'Input validation failed';
export const DEFAULT_PROGRESS_CONTEXT = 'request';

type ProgressToken = string | number;

interface ProgressNotificationParams {
  progressToken: ProgressToken;
  progress: number;
  total?: number;
  message?: string;
}

export interface ProgressPayload {
  current: number;
  total?: number;
  message?: string;
}

export interface ProgressExtra {
  _meta?: { progressToken?: unknown };
  signal?: AbortSignal;
  sendNotification: (notification: {
    method: 'notifications/progress';
    params: ProgressNotificationParams;
  }) => Promise<void>;
}

const progressReporterCache = new WeakMap<
  ProgressExtra,
  (payload: ProgressPayload) => Promise<void>
>();

class ProgressReporter {
  private lastCurrent = -1;
  private didSendTerminal = false;

  constructor(
    private readonly extra: ProgressExtra,
    private readonly progressToken: string | number
  ) {}

  async report(payload: ProgressPayload): Promise<void> {
    if (this.didSendTerminal) {
      return;
    }

    const progressPayload = normalizeProgressPayload(payload, this.lastCurrent);
    const params = createProgressNotificationParams(
      this.progressToken,
      progressPayload
    );

    await this.extra
      .sendNotification({ method: 'notifications/progress', params })
      .catch(() => {
        // Progress notifications are best-effort; never fail tool execution.
      });

    this.lastCurrent = progressPayload.current;
    if (
      progressPayload.total !== undefined &&
      progressPayload.total === progressPayload.current
    ) {
      this.didSendTerminal = true;
    }
  }
}

function normalizeProgressPayload(
  payload: ProgressPayload,
  lastCurrent: number
): ProgressPayload {
  let { current } = payload;
  if (current <= lastCurrent && current < (payload.total ?? Infinity)) {
    current = lastCurrent + 0.01;
  }
  current = Math.max(current, lastCurrent);

  const total =
    payload.total !== undefined ? Math.max(payload.total, current) : undefined;

  return {
    current,
    ...(total !== undefined ? { total } : {}),
    ...(payload.message !== undefined ? { message: payload.message } : {}),
  };
}

function createProgressNotificationParams(
  progressToken: ProgressToken,
  payload: ProgressPayload
): ProgressNotificationParams {
  return {
    progressToken,
    progress: payload.current,
    ...(payload.total !== undefined ? { total: payload.total } : {}),
    ...(payload.message !== undefined ? { message: payload.message } : {}),
  };
}

function createProgressReporter(
  extra: ProgressExtra
): (payload: ProgressPayload) => Promise<void> {
  const rawToken = extra._meta?.progressToken;
  if (typeof rawToken !== 'string' && typeof rawToken !== 'number') {
    return async (): Promise<void> => {
      // Request did not provide a progress token.
    };
  }

  const reporter = new ProgressReporter(extra, rawToken);
  return (payload) => reporter.report(payload);
}

export function getOrCreateProgressReporter(
  extra: ProgressExtra
): (payload: ProgressPayload) => Promise<void> {
  const cached = progressReporterCache.get(extra);
  if (cached) {
    return cached;
  }

  const created = createProgressReporter(extra);
  progressReporterCache.set(extra, created);
  return created;
}

export function normalizeProgressContext(context: string | undefined): string {
  const compact = context?.replace(/\s+/g, ' ').trim();
  if (!compact) {
    return DEFAULT_PROGRESS_CONTEXT;
  }

  if (compact.length <= 80) {
    return compact;
  }

  console.error(
    `[warn] Progress context truncated from ${String(compact.length)} to 80 chars`
  );
  return `${compact.slice(0, 77)}...`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatProgressMessage(
  toolName: string,
  context: string,
  metadata: string
): string {
  const label = capitalize(metadata);
  if (context === DEFAULT_PROGRESS_CONTEXT) {
    return `${toolName} [${label}]`;
  }
  return `${toolName}: ${context} [${label}]`;
}

export function createFailureStatusMessage(
  outcome: 'failed' | 'cancelled',
  errorMessage: string
): string {
  if (outcome === 'cancelled') {
    return `cancelled: ${errorMessage}`;
  }

  return errorMessage;
}

function tryParseErrorMessage(text: string): string | undefined {
  try {
    const parsed = JSON.parse(text) as { error?: { message?: string } };
    return parsed.error?.message;
  } catch {
    return undefined;
  }
}

export function extractValidationMessage(
  validationError: ReturnType<typeof createErrorToolResponse>
): string {
  const first = validationError.content.at(0);
  const text = first && 'text' in first ? first.text : undefined;
  if (!text) return INPUT_VALIDATION_FAILED;

  return tryParseErrorMessage(text) ?? INPUT_VALIDATION_FAILED;
}

export async function sendSingleStepProgress(
  extra: ProgressExtra,
  toolName: string,
  context: string,
  current: 0 | 1,
  state: 'starting' | 'completed' | 'failed' | 'cancelled'
): Promise<void> {
  const reporter = getOrCreateProgressReporter(extra);

  await reporter({
    current,
    total: 1,
    message: formatProgressMessage(toolName, context, state),
  });
}

async function reportProgressUpdate(
  reportProgress: (payload: ProgressPayload) => Promise<void>,
  toolName: string,
  context: string,
  current: number,
  total: number,
  metadata: string
): Promise<void> {
  await reportProgress({
    current,
    total,
    message: formatProgressMessage(toolName, context, metadata),
  });
}

async function reportSchemaRetryProgressBestEffort(
  reportProgress: (payload: ProgressPayload) => Promise<void>,
  toolName: string,
  context: string,
  retryCount: number,
  maxRetries: number
): Promise<void> {
  try {
    await reportProgressUpdate(
      reportProgress,
      toolName,
      context,
      STEP_VALIDATING_RESPONSE + retryCount / (maxRetries + 1),
      TASK_PROGRESS_TOTAL,
      `refining (${retryCount}/${maxRetries})`
    );
  } catch {
    // Progress updates are best-effort and must not interrupt retries.
  }
}

export interface TaskStatusReporter {
  updateStatus: (message: string) => Promise<void>;
  storeResult?: (
    status: 'completed' | 'failed',
    result: { isError?: boolean; content: ToolContentBlock[] }
  ) => Promise<void>;
  storeCancelledResult?: (result: {
    isError?: boolean;
    content: ToolContentBlock[];
  }) => Promise<void>;
  reportCancellation?: (message: string) => Promise<void>;
}

export class RunReporter {
  private lastStatusMessage: string | undefined;

  constructor(
    private readonly toolName: string,
    private readonly reportProgress: (
      payload: ProgressPayload
    ) => Promise<void>,
    private readonly statusReporter: TaskStatusReporter,
    private progressContext: string
  ) {}

  async updateStatus(message: string): Promise<void> {
    const prefixed = `${this.toolName}: ${message}`;
    if (this.lastStatusMessage === prefixed) {
      return;
    }

    try {
      await this.statusReporter.updateStatus(prefixed);
      this.lastStatusMessage = prefixed;
    } catch {
      // Best-effort
    }
  }

  async storeResultSafely(
    status: 'completed' | 'failed',
    result: { isError?: boolean; content: ToolContentBlock[] },
    onLog: (level: string, data: unknown) => Promise<void>
  ): Promise<void> {
    if (!this.statusReporter.storeResult) {
      return;
    }
    try {
      await this.statusReporter.storeResult(status, result);
    } catch (storeErr: unknown) {
      await onLog('error', {
        event: 'store_result_failed',
        error: getErrorMessage(storeErr),
      });
    }
  }

  async storeCancelledResultSafely(
    result: { isError?: boolean; content: ToolContentBlock[] },
    onLog: (level: string, data: unknown) => Promise<void>
  ): Promise<void> {
    if (!this.statusReporter.storeCancelledResult) {
      return;
    }
    try {
      await this.statusReporter.storeCancelledResult(result);
    } catch (storeErr: unknown) {
      await onLog('error', {
        event: 'store_cancelled_result_failed',
        error: getErrorMessage(storeErr),
      });
    }
  }

  async reportCancellation(message: string): Promise<void> {
    if (!this.statusReporter.reportCancellation) {
      return;
    }
    try {
      await this.statusReporter.reportCancellation(message);
    } catch {
      // Best-effort: cancellation status update must not throw
    }
  }

  async reportStep(step: number, message: string): Promise<void> {
    await reportProgressUpdate(
      this.reportProgress,
      this.toolName,
      this.progressContext,
      step,
      TASK_PROGRESS_TOTAL,
      message
    );
    await this.updateStatus(message);
  }

  async reportCompletion(outcome: string): Promise<void> {
    await reportProgressUpdate(
      this.reportProgress,
      this.toolName,
      this.progressContext,
      TASK_PROGRESS_TOTAL,
      TASK_PROGRESS_TOTAL,
      outcome
    );
  }

  async reportSchemaRetry(
    retryCount: number,
    maxRetries: number
  ): Promise<void> {
    await reportSchemaRetryProgressBestEffort(
      this.reportProgress,
      this.toolName,
      this.progressContext,
      retryCount,
      maxRetries
    );
  }

  updateContext(newContext: string): void {
    this.progressContext = newContext;
  }
}
