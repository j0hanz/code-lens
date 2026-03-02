# Code Assistant MCP

[![npm](https://img.shields.io/npm/v/@j0hanz/code-assistant?style=flat-square&logo=npm&logoColor=white&color=CB3837)](https://www.npmjs.com/package/@j0hanz/code-assistant) [![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](https://opensource.org/licenses/MIT) [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![Node.js](https://img.shields.io/badge/Node.js-%3E%3D24-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/) [![Docker](https://img.shields.io/badge/Docker-Available-2496ED?style=flat-square&logo=docker&logoColor=white)](https://github.com/j0hanz/code-assistant/pkgs/container/code-assistant)

Gemini-powered MCP server for code analysis with structured outputs for findings, risk assessment, and focused patch suggestions.

[![Install in VS Code](https://img.shields.io/badge/VS_Code-Install_Server-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=code-assistant&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22%40j0hanz%2Fcode-assistant%40latest%22%5D%7D) [![Install in VS Code Insiders](https://img.shields.io/badge/VS_Code_Insiders-Install_Server-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=code-assistant&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22%40j0hanz%2Fcode-assistant%40latest%22%5D%7D&quality=insiders)

[![Add to LM Studio](https://files.lmstudio.ai/deeplink/mcp-install-light.svg)](https://lmstudio.ai/install-mcp?name=code-assistant&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsIkBqMGhhbnovY29kZS1hc3Npc3RhbnRAbGF0ZXN0Il19) [![Install in Cursor](https://cursor.com/deeplink/mcp-install-dark.svg)](cursor://anysphere.cursor-deeplink/mcp/install?name=code-assistant&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsIkBqMGhhbnovY29kZS1hc3Npc3RhbnRAbGF0ZXN0Il19) [![Install in Goose](https://block.github.io/goose/img/extension-install-dark.svg)](https://block.github.io/goose/extension?cmd=npx&arg=-y%20%40j0hanz%2Fcode-assistant%40latest&id=code-assistant&name=Code%20Assistant&description=Gemini-powered%20MCP%20server%20for%20code%20analysis)

## Overview

Code Assistant is a [Model Context Protocol](https://modelcontextprotocol.io/) server that connects AI assistants to the Google Gemini API for automated code review, refactoring suggestions, complexity analysis, breaking-change detection, and test plan generation. It operates over **stdio** transport and exposes **13 tools**, **7 resources**, and **2 prompts**.

## Key Features

- **Diff-based code review** — generate diffs from git, then analyze PR impact, produce review summaries, detect API breaking changes, and assess time/space complexity
- **File-based analysis** — load individual files for refactoring suggestions, question answering, and logic verification via Gemini's code execution sandbox
- **Repository indexing** — walk a local repository into a Gemini File Search Store for natural-language RAG queries
- **Web search** — Google Search with Grounding for up-to-date information
- **Structured outputs** — all Gemini-backed tools return validated JSON via Zod v4 schemas
- **Task lifecycle** — supports MCP Tasks API for async operation tracking with cancellation
- **Configurable thinking** — per-tool thinking levels (minimal/medium/high) balance speed vs depth
- **Multi-platform Docker** — published to GHCR for `linux/amd64` and `linux/arm64`

## Requirements

- **Node.js** >= 24
- A [**Google Gemini API key**](https://aistudio.google.com/apikey) (`GEMINI_API_KEY` or `GOOGLE_API_KEY`)

## Quick Start

```json
{
  "mcpServers": {
    "code-assistant": {
      "command": "npx",
      "args": ["-y", "@j0hanz/code-assistant@latest"],
      "env": {
        "GEMINI_API_KEY": "<your-api-key>"
      }
    }
  }
}
```

> [!TIP]
> Use the one-click install badges above for automatic setup in VS Code, Cursor, Goose, or LM Studio.

## Client Configuration

<details>
<summary><b>Install in VS Code</b></summary>

[![Install in VS Code](https://img.shields.io/badge/VS_Code-Install_Server-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=code-assistant&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22%40j0hanz%2Fcode-assistant%40latest%22%5D%7D)

Or add manually to `.vscode/mcp.json`:

```json
{
  "servers": {
    "code-assistant": {
      "command": "npx",
      "args": ["-y", "@j0hanz/code-assistant@latest"],
      "env": {
        "GEMINI_API_KEY": "<your-api-key>"
      }
    }
  }
}
```

Or via CLI:

```bash
code --add-mcp '{"name":"code-assistant","command":"npx","args":["-y","@j0hanz/code-assistant@latest"]}'
```

For more info, see [VS Code MCP docs](https://code.visualstudio.com/docs/copilot/chat/mcp-servers).

</details>

<details>
<summary><b>Install in VS Code Insiders</b></summary>

[![Install in VS Code Insiders](https://img.shields.io/badge/VS_Code_Insiders-Install_Server-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=code-assistant&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22%40j0hanz%2Fcode-assistant%40latest%22%5D%7D&quality=insiders)

Or via CLI:

```bash
code-insiders --add-mcp '{"name":"code-assistant","command":"npx","args":["-y","@j0hanz/code-assistant@latest"]}'
```

</details>

<details>
<summary><b>Install in Cursor</b></summary>

[![Install in Cursor](https://cursor.com/deeplink/mcp-install-dark.svg)](cursor://anysphere.cursor-deeplink/mcp/install?name=code-assistant&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsIkBqMGhhbnovY29kZS1hc3Npc3RhbnRAbGF0ZXN0Il19)

Or add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "code-assistant": {
      "command": "npx",
      "args": ["-y", "@j0hanz/code-assistant@latest"],
      "env": {
        "GEMINI_API_KEY": "<your-api-key>"
      }
    }
  }
}
```

For more info, see [Cursor MCP docs](https://docs.cursor.com/context/model-context-protocol).

</details>

<details>
<summary><b>Install in Claude Desktop</b></summary>

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "code-assistant": {
      "command": "npx",
      "args": ["-y", "@j0hanz/code-assistant@latest"],
      "env": {
        "GEMINI_API_KEY": "<your-api-key>"
      }
    }
  }
}
```

For more info, see [Claude Desktop MCP docs](https://modelcontextprotocol.io/quickstart/user).

</details>

<details>
<summary><b>Install in Claude Code</b></summary>

```bash
claude mcp add code-assistant -- npx -y @j0hanz/code-assistant@latest
```

For more info, see [Claude Code MCP docs](https://docs.anthropic.com/en/docs/claude-code/mcp).

</details>

<details>
<summary><b>Install in Windsurf</b></summary>

Add to your Windsurf MCP config:

```json
{
  "mcpServers": {
    "code-assistant": {
      "command": "npx",
      "args": ["-y", "@j0hanz/code-assistant@latest"],
      "env": {
        "GEMINI_API_KEY": "<your-api-key>"
      }
    }
  }
}
```

For more info, see [Windsurf MCP docs](https://docs.windsurf.com/windsurf/mcp).

</details>

<details>
<summary><b>Install in Amp</b></summary>

```bash
amp mcp add code-assistant -- npx -y @j0hanz/code-assistant@latest
```

For more info, see [Amp MCP docs](https://docs.amp.dev).

</details>

<details>
<summary><b>Install in Cline</b></summary>

Add to `cline_mcp_settings.json`:

```json
{
  "mcpServers": {
    "code-assistant": {
      "command": "npx",
      "args": ["-y", "@j0hanz/code-assistant@latest"],
      "env": {
        "GEMINI_API_KEY": "<your-api-key>"
      }
    }
  }
}
```

</details>

<details>
<summary><b>Install via Docker</b></summary>

```json
{
  "mcpServers": {
    "code-assistant": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "GEMINI_API_KEY",
        "ghcr.io/j0hanz/code-assistant:latest"
      ],
      "env": {
        "GEMINI_API_KEY": "<your-api-key>"
      }
    }
  }
}
```

Or run directly:

```bash
docker run -i -e GEMINI_API_KEY="<your-api-key>" ghcr.io/j0hanz/code-assistant:latest
```

</details>

## MCP Surface

### Tools

#### `generate_diff`

Generate a diff of current changes and cache it server-side. Must be called before diff-based analysis tools.

| Name   | Type     | Required | Description                              |
| ------ | -------- | -------- | ---------------------------------------- |
| `mode` | `string` | yes      | `'unstaged'` or `'staged'` diff capture. |

#### `analyze_pr_impact`

Assess severity, categories, breaking changes, and rollback complexity.

| Name         | Type     | Required | Description                         |
| ------------ | -------- | -------- | ----------------------------------- |
| `repository` | `string` | yes      | Repository identifier (owner/repo). |
| `language`   | `string` | no       | Primary language hint.              |

#### `generate_review_summary`

Produce PR summary, risk rating, and merge recommendation.

| Name         | Type     | Required | Description                         |
| ------------ | -------- | -------- | ----------------------------------- |
| `repository` | `string` | yes      | Repository identifier (owner/repo). |
| `language`   | `string` | no       | Primary language hint.              |

#### `generate_test_plan`

Generate prioritized test cases and coverage guidance.

| Name            | Type     | Required | Description                         |
| --------------- | -------- | -------- | ----------------------------------- |
| `repository`    | `string` | yes      | Repository identifier (owner/repo). |
| `language`      | `string` | no       | Primary language hint.              |
| `testFramework` | `string` | no       | Framework hint (jest, pytest, etc). |
| `maxTestCases`  | `number` | no       | Max test cases (1-30).              |

#### `analyze_time_space_complexity`

Analyze Big-O complexity and detect degradations in changed code.

| Name       | Type     | Required | Description            |
| ---------- | -------- | -------- | ---------------------- |
| `language` | `string` | no       | Primary language hint. |

#### `detect_api_breaking_changes`

Detect breaking API/interface changes in a diff.

| Name       | Type     | Required | Description            |
| ---------- | -------- | -------- | ---------------------- |
| `language` | `string` | no       | Primary language hint. |

#### `load_file`

Read a single file from disk and cache it server-side. Must be called before file analysis tools.

| Name       | Type     | Required | Description                        |
| ---------- | -------- | -------- | ---------------------------------- |
| `filePath` | `string` | yes      | Absolute path to the file to load. |

#### `refactor_code`

Analyze cached file for naming, complexity, duplication, and grouping improvements.

| Name       | Type     | Required | Description            |
| ---------- | -------- | -------- | ---------------------- |
| `language` | `string` | no       | Primary language hint. |

#### `ask_about_code`

Answer natural-language questions about a cached file.

| Name       | Type     | Required | Description                     |
| ---------- | -------- | -------- | ------------------------------- |
| `question` | `string` | yes      | Question about the loaded file. |
| `language` | `string` | no       | Primary language hint.          |

#### `verify_logic`

Verify algorithms and logic in cached file using Gemini code execution sandbox.

| Name       | Type     | Required | Description                     |
| ---------- | -------- | -------- | ------------------------------- |
| `question` | `string` | yes      | Question about the loaded file. |
| `language` | `string` | no       | Primary language hint.          |

#### `web_search`

Perform a Google Search with Grounding to get up-to-date information.

| Name    | Type     | Required | Description   |
| ------- | -------- | -------- | ------------- |
| `query` | `string` | yes      | Search query. |

#### `index_repository`

Walk a local repository, upload source files to a Gemini File Search Store for RAG queries.

| Name          | Type     | Required | Description                                    |
| ------------- | -------- | -------- | ---------------------------------------------- |
| `rootPath`    | `string` | yes      | Absolute path to the repository root.          |
| `displayName` | `string` | no       | Display name for the store. Default: dir name. |

#### `query_repository`

Query the indexed repository search store using natural language.

| Name       | Type     | Required | Description                               |
| ---------- | -------- | -------- | ----------------------------------------- |
| `query`    | `string` | yes      | Natural-language question about the repo. |
| `language` | `string` | no       | Primary language hint.                    |

### Resources

| URI Pattern                       | MIME Type     | Description                                |
| --------------------------------- | ------------- | ------------------------------------------ |
| `internal://instructions`         | text/markdown | Complete server usage instructions.        |
| `internal://tool-catalog`         | text/markdown | Tool reference: models, params, data flow. |
| `internal://workflows`            | text/markdown | Recommended workflows and tool sequences.  |
| `internal://server-config`        | text/markdown | Runtime configuration and limits.          |
| `internal://tool-info/{toolName}` | text/markdown | Per-tool reference (supports completions). |
| `internal://diff/current`         | text/x-patch  | Most recently generated diff (cached).     |
| `internal://file/current`         | text/plain    | Most recently loaded file (cached).        |

### Prompts

| Prompt         | Arguments           | Description                         |
| -------------- | ------------------- | ----------------------------------- |
| `get-help`     | none                | Server instructions.                |
| `review-guide` | `tool`, `focusArea` | Workflow guide for tool/focus area. |

## Configuration

### Environment Variables

| Variable                        | Default                  | Required | Description                                                                                  |
| ------------------------------- | ------------------------ | -------- | -------------------------------------------------------------------------------------------- |
| `GEMINI_API_KEY`                | N/A                      | yes      | Google Gemini API key.                                                                       |
| `GOOGLE_API_KEY`                | N/A                      | yes\*    | Alternative API key variable (\*either one required).                                        |
| `GEMINI_MODEL`                  | `gemini-3-flash-preview` | no       | Model override for all tools.                                                                |
| `MAX_DIFF_CHARS`                | `120000`                 | no       | Max diff size in characters.                                                                 |
| `GEMINI_HARM_BLOCK_THRESHOLD`   | `BLOCK_NONE`             | no       | Safety threshold (BLOCK_NONE, BLOCK_ONLY_HIGH, BLOCK_MEDIUM_AND_ABOVE, BLOCK_LOW_AND_ABOVE). |
| `GEMINI_INCLUDE_THOUGHTS`       | `false`                  | no       | Include model thinking in responses.                                                         |
| `GEMINI_BATCH_MODE`             | `off`                    | no       | Batch mode: `off` or `inline`.                                                               |
| `GEMINI_BATCH_POLL_INTERVAL_MS` | N/A                      | no       | Poll cadence for batch status checks.                                                        |
| `GEMINI_BATCH_TIMEOUT_MS`       | N/A                      | no       | Max wait for batch completion.                                                               |
| `MAX_CONCURRENT_CALLS`          | `10`                     | no       | Max concurrent Gemini calls.                                                                 |
| `MAX_CONCURRENT_BATCH_CALLS`    | `2`                      | no       | Max concurrent batch calls.                                                                  |
| `MAX_CONCURRENT_CALLS_WAIT_MS`  | `2000`                   | no       | Wait timeout for concurrency queue (ms).                                                     |
| `GEMINI_DIFF_CACHE_ENABLED`     | `false`                  | no       | Enable Gemini-side diff caching.                                                             |
| `GEMINI_DIFF_CACHE_TTL_S`       | N/A                      | no       | Cache TTL in seconds.                                                                        |

### CLI Arguments

| Flag               | Short | Maps to env var  | Description             |
| ------------------ | ----- | ---------------- | ----------------------- |
| `--model`          | `-m`  | `GEMINI_MODEL`   | Override default model. |
| `--max-diff-chars` |       | `MAX_DIFF_CHARS` | Override diff budget.   |

## Security

| Control                     | Status    | Evidence                                                   |
| --------------------------- | --------- | ---------------------------------------------------------- |
| Non-root Docker user        | confirmed | `Dockerfile` — `adduser -D mcp`, `USER mcp`                |
| Read-only volume mount      | confirmed | `docker-compose.yml` — `:ro` flag                          |
| Diff budget enforcement     | confirmed | `src/lib/diff.ts` — `MAX_DIFF_CHARS`                       |
| Noisy file exclusion        | confirmed | `src/lib/diff.ts` — `NOISY_EXCLUDE_PATHSPECS`              |
| Configurable safety filters | confirmed | `src/lib/gemini/config.ts` — `GEMINI_HARM_BLOCK_THRESHOLD` |
| npm publish provenance      | confirmed | `.github/workflows/release.yml` — `--provenance` flag      |

## Development

| Script       | Command              | Purpose                        |
| ------------ | -------------------- | ------------------------------ |
| `build`      | `npm run build`      | Compile TypeScript to `dist/`. |
| `dev`        | `npm run dev`        | Watch mode (tsc --watch).      |
| `start`      | `npm run start`      | Run built server.              |
| `type-check` | `npm run type-check` | Type-check src and tests.      |
| `lint`       | `npm run lint`       | ESLint.                        |
| `format`     | `npm run format`     | Prettier.                      |
| `test`       | `npm run test`       | Run tests (node:test).         |
| `knip`       | `npm run knip`       | Dead-code detection.           |
| `inspector`  | `npm run inspector`  | MCP Inspector.                 |

### Debugging with MCP Inspector

```bash
npx @modelcontextprotocol/inspector npx -y @j0hanz/code-assistant@latest
```

## Build and Release

- **Release workflow**: manual dispatch via GitHub Actions (`workflow_dispatch`) with version bump type (patch/minor/major) or custom version.
- **npm**: published to `@j0hanz/code-assistant` with OIDC trusted publishing and provenance attestation.
- **Docker**: multi-platform image (`linux/amd64`, `linux/arm64`) pushed to `ghcr.io/j0hanz/code-assistant`.
- **MCP Registry**: published to [registry.modelcontextprotocol.io](https://registry.modelcontextprotocol.io) as `io.github.j0hanz/code-assistant`.

### Docker Build

```bash
docker build -t code-assistant .
```

## Troubleshooting

- **Missing API key**: set `GEMINI_API_KEY` or `GOOGLE_API_KEY` in your environment or client config.
- **Diff too large**: increase `MAX_DIFF_CHARS` or use `--max-diff-chars` flag. Lock files and build artifacts are excluded automatically.
- **Inspector not connecting**: ensure the server builds cleanly with `npm run build` before running the inspector.
- **`E_NO_DIFF` error**: call `generate_diff` before any diff-based analysis tool.
- **`E_NO_FILE` error**: call `load_file` before `refactor_code`, `ask_about_code`, or `verify_logic`.

## Contributing and License

- License: [MIT](https://opensource.org/licenses/MIT)
- Repository: [github.com/j0hanz/code-assistant](https://github.com/j0hanz/code-assistant)
