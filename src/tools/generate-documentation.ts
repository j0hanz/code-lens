import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import {
  buildStructuredToolExecutionOptions,
  getFileContextSnapshot,
  registerStructuredToolTask,
  requireToolContract,
} from '../lib/tools.js';
import { GenerateDocumentationInputSchema } from '../schemas/inputs.js';
import type { GenerateDocumentationInput } from '../schemas/inputs.js';
import {
  GenerateDocumentationGeminiResultSchema,
  GenerateDocumentationResultSchema,
} from '../schemas/outputs.js';
import type {
  GenerateDocumentationGeminiResult,
  GenerateDocumentationResult,
} from '../schemas/outputs.js';

const SYSTEM_INSTRUCTION = `
<role>
Documentation Generator.
</role>

<task>
Analyze one source file and generate documentation stubs (JSDoc/TSDoc/docstrings) for all public exports, classes, functions, methods, interfaces, types, and constants.
</task>

<constraints>
- Generate docs only for the provided file content.
- Every docBlock must reference a concrete exported symbol from this file.
- Include parameter descriptions, return types, and brief usage examples for complex functions.
- Use the appropriate doc format for the detected language (JSDoc for JS/TS, docstrings for Python, etc.).
- Skip private/internal symbols (prefixed with _ or marked @internal) unless they are the only exports.
- If the file is fully documented, return an empty docBlocks array and note this in the summary.
</constraints>

<output>
- Return strict JSON only.
- Do not add markdown, prose outside JSON, or extra keys.
</output>
`;

const TOOL_CONTRACT = requireToolContract('generate_documentation');

export function registerGenerateDocumentationTool(server: McpServer): void {
  registerStructuredToolTask<
    GenerateDocumentationInput,
    GenerateDocumentationGeminiResult,
    GenerateDocumentationResult
  >(server, {
    name: 'generate_documentation',
    title: 'Generate Documentation',
    description:
      'Generate documentation stubs for all public exports in a cached file. Prerequisite: load_file. Auto-infer language.',
    inputSchema: GenerateDocumentationInputSchema,
    fullInputSchema: GenerateDocumentationInputSchema,
    resultSchema: GenerateDocumentationResultSchema,
    geminiSchema: GenerateDocumentationGeminiResultSchema,
    errorCode: 'E_GENERATE_DOCUMENTATION',
    ...buildStructuredToolExecutionOptions(TOOL_CONTRACT),
    requiresFile: true,
    formatOutcome: (result) =>
      `${result.documentedCount} of ${result.totalExports} exports documented`,
    formatOutput: (result) => {
      const lines = [result.summary];

      lines.push(
        '',
        `**Coverage:** ${result.documentedCount}/${result.totalExports} exports`
      );

      if (result.docBlocks.length > 0) {
        lines.push('', '### Documentation Blocks', '');
        for (const block of result.docBlocks) {
          lines.push(`#### \`${block.target}\` (${block.kind})`);
          lines.push(`**Signature:** \`${block.signature}\``);
          lines.push('', block.documentation);
          if (block.example) {
            lines.push('', `**Example:**`, '', block.example);
          }
          lines.push('');
        }
      }

      return lines.join('\n');
    },
    buildPrompt: (input, ctx) => {
      const file = getFileContextSnapshot(ctx);
      const language = input.language ?? file.language;

      return {
        systemInstruction: SYSTEM_INSTRUCTION,
        prompt: `Language: ${language}\nFile: ${file.filePath}\n\nSource code:\n${file.content}\n\nGenerate documentation stubs for all public exports in this file.`,
      };
    },
    transformResult: (_input, result, ctx) => {
      const file = getFileContextSnapshot(ctx);

      return {
        ...result,
        filePath: file.filePath,
        language: file.language,
        documentedCount: result.docBlocks.length,
      };
    },
  });
}
