import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { buildLanguageDiffPrompt } from '../lib/format.js';
import {
  buildStructuredToolExecutionOptions,
  getDiffContextSnapshot,
  registerStructuredToolTask,
  requireToolContract,
} from '../lib/tools.js';
import { DetectApiBreakingInputSchema } from '../schemas/inputs.js';
import { DetectApiBreakingResultSchema } from '../schemas/outputs.js';

const SYSTEM_INSTRUCTION = `
<role>
API Compatibility Analyst.
</role>

<task>
Detect backward-incompatible changes in public APIs, interfaces, or schemas.
</task>

<rules>
- Breaking change means a backward-incompatible modification to an explicitly exported/public symbol.
- Analyze exported/public surface only. Internal non-exported refactors are never breaking changes.
- For each breaking change, provide element, natureOfChange, consumerImpact, and suggestedMitigation.
- If none exist, return hasBreakingChanges=false and breakingChanges=[].
</rules>

<output>
Return strict JSON matching the schema. No markdown, prose outside JSON, or extra keys.
</output>
`;
const TOOL_CONTRACT = requireToolContract('detect_api_breaking_changes');

export function registerDetectApiBreakingTool(server: McpServer): void {
  registerStructuredToolTask(server, {
    name: 'detect_api_breaking_changes',
    title: 'Detect API Breaking Changes',
    description:
      'Detect breaking API changes. Prerequisite: generate_diff. Auto-infer language.',
    inputSchema: DetectApiBreakingInputSchema,
    fullInputSchema: DetectApiBreakingInputSchema,
    resultSchema: DetectApiBreakingResultSchema,
    errorCode: 'E_DETECT_API_BREAKING',
    ...buildStructuredToolExecutionOptions(TOOL_CONTRACT),
    requiresDiff: true,
    formatOutcome: (result) =>
      `${result.breakingChanges.length} breaking changes`,
    formatOutput: (result) => {
      if (!result.hasBreakingChanges) {
        return 'No breaking changes detected.';
      }

      const lines = [
        `**${String(result.breakingChanges.length)} breaking change(s) detected**`,
        '',
      ];

      for (const bc of result.breakingChanges) {
        lines.push(
          `#### ${bc.element}`,
          '',
          `- **Change:** ${bc.natureOfChange}`,
          `- **Impact:** ${bc.consumerImpact}`,
          `- **Mitigation:** ${bc.suggestedMitigation}`,
          ''
        );
      }

      return lines.join('\n');
    },
    buildPrompt: (input, ctx) => {
      const { diff } = getDiffContextSnapshot(ctx);

      return {
        systemInstruction: SYSTEM_INSTRUCTION,
        prompt: buildLanguageDiffPrompt(
          input.language,
          diff,
          'Based on the diff above, detect any breaking API changes.'
        ),
      };
    },
  });
}
