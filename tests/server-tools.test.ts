import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import type { RegisteredTool } from '@modelcontextprotocol/sdk/server/mcp.js';

import { getToolContracts } from '../src/lib/tools.js';
import { createServer } from '../src/server.js';

type ToolRegistry = Record<string, RegisteredTool>;

function getRegisteredTools(): {
  tools: ToolRegistry;
  shutdown: () => Promise<void>;
} {
  const handle = createServer();
  const tools = (handle.server as unknown as { _registeredTools: ToolRegistry })
    ._registeredTools;

  return {
    tools,
    shutdown: handle.shutdown,
  };
}

describe('server tool registration', () => {
  let shutdown: (() => Promise<void>) | undefined;

  afterEach(async () => {
    if (shutdown) {
      await shutdown();
      shutdown = undefined;
    }
  });

  it('matches registered task support to tool contracts', () => {
    const serverState = getRegisteredTools();
    shutdown = serverState.shutdown;

    for (const contract of getToolContracts()) {
      const tool = serverState.tools[contract.name];
      const actualTaskSupport = tool?.execution?.taskSupport ?? 'forbidden';
      assert.equal(
        actualTaskSupport,
        contract.taskSupport,
        `${contract.name} should mirror contract task support`
      );
    }
  });
});
