import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { buildLanguageDiffPrompt } from '../lib/format.js';
import {
  buildStructuredToolExecutionOptions,
  getDiffContextSnapshot,
  registerStructuredToolTask,
  requireToolContract,
} from '../lib/tools.js';
import { AnalyzeComplexityInputSchema } from '../schemas/inputs.js';
import { AnalyzeComplexityResultSchema } from '../schemas/outputs.js';

const SYSTEM_INSTRUCTION = `
<role>
Algorithm Complexity Analyst — strict, evidence-based Big-O analysis.
</role>

<task>
Analyze time and space complexity for changed code paths in the diff.
</task>

<thresholds>
- Degradation: set isDegradation=true only when asymptotic class worsens (example: O(n) -> O(n^2)). Same-class or constant-factor changes are not degradations.
- Bottlenecks: report only newly introduced or worsened scaling loops/recursion.
- Do not flag expected single-pass iteration, fixed-size loops, or unchanged code.
</thresholds>

<rules>
- Analyze only changed code paths.
- For each complexity claim, trace loop/recursion bounds and nesting from the diff evidence.
- If there are no algorithmic changes (config/strings/comments/imports/types/formatting only), return: timeComplexity="N/A - no algorithmic changes", spaceComplexity="N/A - no algorithmic changes", isDegradation=false, potentialBottlenecks=[].
- Do not infer complexity of called functions unless their implementation is visible in the diff.
</rules>

<output>
Return strict JSON matching the schema. No markdown, prose outside JSON, or extra keys.
</output>
`;
const TOOL_CONTRACT = requireToolContract('analyze_time_space_complexity');

export function registerAnalyzeComplexityTool(server: McpServer): void {
  registerStructuredToolTask(server, {
    name: 'analyze_time_space_complexity',
    title: 'Analyze Time & Space Complexity',
    description:
      'Analyze Big-O complexity. Prerequisite: generate_diff. Auto-infer language.',
    inputSchema: AnalyzeComplexityInputSchema,
    fullInputSchema: AnalyzeComplexityInputSchema,
    resultSchema: AnalyzeComplexityResultSchema,
    errorCode: 'E_ANALYZE_COMPLEXITY',
    ...buildStructuredToolExecutionOptions(TOOL_CONTRACT),
    requiresDiff: true,
    formatOutcome: (result) =>
      result.isDegradation ? 'degradation detected' : 'no degradation',
    formatOutput: (result) => {
      const lines = [
        `**Time Complexity:** ${result.timeComplexity}`,
        `**Space Complexity:** ${result.spaceComplexity}`,
        '',
        result.explanation,
      ];

      if (result.potentialBottlenecks.length > 0) {
        lines.push('', '### Potential Bottlenecks', '');
        for (const b of result.potentialBottlenecks) {
          lines.push(`- ${b}`);
        }
      }

      if (result.isDegradation) {
        lines.push('', '> **Warning:** Performance degradation detected.');
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
          'Based on the diff above, analyze the Big-O time and space complexity.'
        ),
      };
    },
  });
}
