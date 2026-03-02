import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { getErrorMessage } from '../lib/errors.js';
import { getClient } from '../lib/gemini/client.js';
import { getDefaultModel } from '../lib/gemini/config.js';
import { getCurrentSearchStore } from '../lib/gemini/index.js';
import {
  createErrorToolResponse,
  createToolResponse,
  wrapToolHandler,
} from '../lib/tools.js';
import { QueryRepositoryInputSchema } from '../schemas/inputs.js';
import { DefaultOutputSchema } from '../schemas/outputs.js';
import type { QueryRepositorySource } from '../schemas/outputs.js';

// ---------------------------------------------------------------------------
// Types for file search responses
// ---------------------------------------------------------------------------

interface FileSearchResult {
  file_search_store?: string;
  text?: string;
  title?: string;
}

interface FileSearchResultContent {
  type: 'file_search_result';
  result?: FileSearchResult[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractSources(parts: unknown[]): QueryRepositorySource[] {
  const sources: QueryRepositorySource[] = [];

  for (const part of parts) {
    if (
      typeof part === 'object' &&
      part !== null &&
      'type' in part &&
      (part as { type: string }).type === 'file_search_result'
    ) {
      const fsr = part as FileSearchResultContent;
      if (Array.isArray(fsr.result)) {
        for (const r of fsr.result) {
          sources.push({
            fileSearchStore: r.file_search_store,
            title: r.title,
            text: r.text?.slice(0, 2000),
          });
        }
      }
    }
  }

  return sources.slice(0, 20);
}

function extractTextFromParts(parts: unknown[]): string {
  const textSegments: string[] = [];

  for (const part of parts) {
    if (
      typeof part === 'object' &&
      part !== null &&
      'text' in part &&
      typeof (part as { text: unknown }).text === 'string' &&
      !(part as { thought?: unknown }).thought
    ) {
      textSegments.push((part as { text: string }).text);
    }
  }

  return textSegments.join('\n\n');
}

const VALIDATION_META = { retryable: false, kind: 'validation' as const };

const SYSTEM_INSTRUCTION = `You are a code analysis assistant. Answer questions about the repository using the retrieved source file contents. Be precise, cite file names when possible, and stay factual.`;

// ---------------------------------------------------------------------------
// Tool registration
// ---------------------------------------------------------------------------

export function registerQueryRepositoryTool(server: McpServer): void {
  server.registerTool(
    'query_repository',
    {
      title: 'Query Repository',
      description:
        'Ask a natural-language question about the indexed repository. Prerequisite: index_repository. Uses Gemini File Search for RAG.',
      inputSchema: QueryRepositoryInputSchema,
      outputSchema: DefaultOutputSchema,
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
        destructiveHint: false,
      },
    },
    wrapToolHandler(
      {
        toolName: 'query_repository',
        progressContext: (input) => input.query.slice(0, 60),
      },
      async (input) => {
        const parsed = QueryRepositoryInputSchema.parse(input);

        const store = getCurrentSearchStore();
        if (!store) {
          return createErrorToolResponse(
            'E_QUERY_REPO',
            'No repository indexed. Call index_repository first.',
            undefined,
            VALIDATION_META
          );
        }

        try {
          const model = getDefaultModel();
          const response = await getClient().models.generateContent({
            model,
            contents: parsed.query,
            config: {
              systemInstruction: SYSTEM_INSTRUCTION,
              tools: [
                {
                  fileSearch: {
                    fileSearchStoreNames: [store.storeName],
                  },
                },
              ],
            },
          });

          const parts = (response.candidates?.[0]?.content?.parts ??
            []) as unknown[];
          const textFromParts = extractTextFromParts(parts);
          const answer =
            textFromParts || (response.text ?? 'No answer generated.');
          const sources = extractSources(parts);

          return createToolResponse(
            {
              ok: true as const,
              result: {
                answer,
                sources,
              },
            },
            answer
          );
        } catch (error) {
          return createErrorToolResponse(
            'E_QUERY_REPO',
            getErrorMessage(error),
            undefined,
            { retryable: true, kind: 'upstream' }
          );
        }
      }
    )
  );
}
