import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import {
  generateWithFileSearch,
  getCurrentSearchStore,
} from '../lib/gemini/index.js';
import {
  buildStructuredToolExecutionOptions,
  createErrorToolResponse,
  registerStructuredToolTask,
  requireToolContract,
  VALIDATION_ERROR_META,
} from '../lib/tools.js';
import { QueryRepositoryInputSchema } from '../schemas/inputs.js';
import type { QueryRepositoryInput } from '../schemas/inputs.js';
import { QueryRepositoryResultSchema } from '../schemas/outputs.js';
import type {
  QueryRepositoryResult,
  QueryRepositorySource,
} from '../schemas/outputs.js';

// ---------------------------------------------------------------------------
// Types for file search responses
// ---------------------------------------------------------------------------

interface FileSearchResult {
  file_search_store?: string;
  text?: string;
  title?: string;
}

interface FileSearchResultPart {
  type: 'file_search_result';
  result?: FileSearchResult[];
}

interface TextPart {
  text: string;
  thought?: boolean;
}

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

function isObjectWithType(
  part: unknown
): part is Record<string, unknown> & { type: string } {
  return (
    typeof part === 'object' &&
    part !== null &&
    typeof (part as Record<string, unknown>).type === 'string'
  );
}

function isFileSearchResultPart(part: unknown): part is FileSearchResultPart {
  return isObjectWithType(part) && part.type === 'file_search_result';
}

function isTextPart(part: unknown): part is TextPart {
  return (
    typeof part === 'object' &&
    part !== null &&
    'text' in part &&
    typeof (part as Record<string, unknown>).text === 'string'
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractSources(parts: unknown[]): QueryRepositorySource[] {
  const sources: QueryRepositorySource[] = [];

  for (const part of parts) {
    if (isFileSearchResultPart(part) && Array.isArray(part.result)) {
      for (const r of part.result) {
        sources.push({
          fileSearchStore: r.file_search_store,
          title: r.title,
          text: r.text?.slice(0, 2000),
        });
      }
    }
  }

  return sources.slice(0, 20);
}

function extractTextFromParts(parts: unknown[]): string {
  const textSegments: string[] = [];

  for (const part of parts) {
    if (isTextPart(part) && !part.thought) {
      textSegments.push(part.text);
    }
  }

  return textSegments.join('\n\n');
}

const SYSTEM_INSTRUCTION = `You are a code analysis assistant. Answer questions about the repository using the retrieved source file contents. Be precise, cite file names when possible, and stay factual.`;

const TOOL_CONTRACT = requireToolContract('query_repository');

// ---------------------------------------------------------------------------
// Tool registration
// ---------------------------------------------------------------------------

export function registerQueryRepositoryTool(server: McpServer): void {
  registerStructuredToolTask<QueryRepositoryInput, QueryRepositoryResult>(
    server,
    {
      name: 'query_repository',
      title: 'Query Repository',
      description:
        'Ask a natural-language question about the indexed repository. Prerequisite: index_repository. Uses Gemini File Search for RAG.',
      inputSchema: QueryRepositoryInputSchema,
      fullInputSchema: QueryRepositoryInputSchema,
      resultSchema: QueryRepositoryResultSchema,
      errorCode: 'E_QUERY_REPO',
      ...buildStructuredToolExecutionOptions(TOOL_CONTRACT),
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
        destructiveHint: false,
      },
      progressContext: (input) => input.query.slice(0, 60),
      formatOutput: (result) => {
        const lines = [result.answer];

        if (result.sources.length > 0) {
          lines.push('', '### Sources', '');
          for (const s of result.sources) {
            const label = s.title ?? s.fileSearchStore ?? 'source';
            lines.push(`- ${label}`);
          }
        }

        return lines.join('\n');
      },
      validateInput: () => {
        const store = getCurrentSearchStore();
        if (!store) {
          return Promise.resolve(
            createErrorToolResponse(
              'E_QUERY_REPO',
              'No repository indexed. Call index_repository first.',
              undefined,
              VALIDATION_ERROR_META
            )
          );
        }
        return Promise.resolve(undefined);
      },
      buildPrompt: (input) => ({
        systemInstruction: SYSTEM_INSTRUCTION,
        prompt: input.query,
      }),
      customGenerate: async (promptParts, _ctx, opts) => {
        const store = getCurrentSearchStore();
        if (!store) {
          throw new Error('No repository indexed');
        }

        const response = await generateWithFileSearch({
          systemInstruction: promptParts.systemInstruction,
          prompt: promptParts.prompt,
          responseSchema: {},
          fileSearchStoreNames: [store.storeName],
          ...(opts.signal ? { signal: opts.signal } : {}),
          onLog: opts.onLog,
        });

        const textFromParts = extractTextFromParts(response.parts);
        const answer = textFromParts || response.text || 'No answer generated.';
        const sources = extractSources(response.parts);

        return { answer, sources };
      },
    }
  );
}
