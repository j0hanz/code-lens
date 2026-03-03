import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import {
  buildStructuredToolExecutionOptions,
  getFileContextSnapshot,
  registerStructuredToolTask,
  requireToolContract,
} from '../lib/tools.js';
import { AskInputSchema } from '../schemas/inputs.js';
import type { AskInput } from '../schemas/inputs.js';
import { AskGeminiResultSchema, AskResultSchema } from '../schemas/outputs.js';
import type { AskGeminiResult, AskResult } from '../schemas/outputs.js';

const SYSTEM_INSTRUCTION = `
<role>
Code Explanation Assistant.
</role>

<task>
Answer the user's question using only the provided source file.
</task>

<rules>
- Use only evidence from the file content. No external assumptions.
- Consider the whole file, not just the first matching snippet.
- Cite concrete symbols (function/class/variable names) when relevant.
- If the file does not contain enough evidence, say so explicitly.
</rules>

<output>
Return strict JSON matching the schema. No markdown, prose outside JSON, or extra keys.
</output>
`;

const TOOL_CONTRACT = requireToolContract('ask_about_code');

export function registerAskTool(server: McpServer): void {
  registerStructuredToolTask<AskInput, AskGeminiResult, AskResult>(server, {
    name: 'ask_about_code',
    title: 'Ask About Code',
    description:
      'Answer questions about a cached file. Prerequisite: load_file. Auto-infer language.',
    inputSchema: AskInputSchema,
    fullInputSchema: AskInputSchema,
    resultSchema: AskResultSchema,
    geminiSchema: AskGeminiResultSchema,
    errorCode: 'E_ASK_CODE',
    ...buildStructuredToolExecutionOptions(TOOL_CONTRACT),
    requiresFile: true,
    progressContext: (input) => input.question.slice(0, 60),
    formatOutcome: (result) => `confidence: ${result.confidence}`,
    formatOutput: (result) => {
      const lines = [result.answer];

      if (result.codeReferences.length > 0) {
        lines.push('', '### References', '');
        for (const ref of result.codeReferences) {
          lines.push(`- **${ref.target}**: ${ref.explanation}`);
        }
      }

      lines.push('', `*Confidence: ${result.confidence}*`);

      return lines.join('\n');
    },
    buildPrompt: (input, ctx) => {
      const file = getFileContextSnapshot(ctx);
      const language = input.language ?? file.language;

      return {
        systemInstruction: SYSTEM_INSTRUCTION,
        prompt: `Language: ${language}\nFile: ${file.filePath}\n\n<source>\n${file.content}\n</source>\n\nQuestion: ${input.question}`,
      };
    },
    transformResult: (_input, result, ctx) => {
      const file = getFileContextSnapshot(ctx);

      return {
        ...result,
        filePath: file.filePath,
        language: file.language,
      };
    },
  });
}
