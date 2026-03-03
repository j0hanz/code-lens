# AGENTS.md

Gemini-powered MCP server for automated code review, analysis, and documentation.

## Tooling

- **Manager**: npm
- **Frameworks**: typescript, eslint, @modelcontextprotocol/sdk, @modelcontextprotocol/sdk, @trivago/prettier-plugin-sort-imports, eslint, eslint-config-prettier, eslint-plugin-de-morgan

## Architecture

- **Pattern**: MCP SDK server (`McpServer`) with modular tool-factory registration, Gemini AI backend, and resource/prompt registries
- **Tool layer** (`src/tools/`): 13 tools, each exporting a `register*Tool(server)` function; metadata centralized in `src/lib/tool-contracts.ts`
- **Gemini layer** (`src/lib/gemini/`): Singleton `GoogleGenAI` client, structured JSON generation, transient-error retry, diff-context caching, JSON-schema constraint stripping
- **Infrastructure**: `ConcurrencyLimiter` (FIFO + AbortSignal), 7-step progress tracker via `AsyncLocalStorage`, cached env-int config pattern
- **Resources/Prompts**: 6 `internal://` resources (instructions, tool-catalog, tool-info, workflows, server-config, diff/file URIs) + 5 completable prompts

## Testing Strategy

- **Runner**: `node:test` + `node:assert/strict` (no vitest/jest)
- **Location**: `tests/*.test.ts` (12 suites)
- **Coverage areas**: Zod schema validation, tool-contract integrity (13 tools), Gemini utilities (schema stripping, retry codes), concurrency limiter (FIFO, timeout, abort), diff/file stores, task lifecycle, prompts
- **Commands**: `npm run test` (full suite), `npm run test:fast` (direct `node --test`), `npm run test:coverage`

## Commands

- **Dev**: `npm run dev`
- **Test**: `npm run test`
- **Lint**: `npm run lint`
- **Deploy**: `npm run prepublishOnly`

## Safety Boundaries

- **Always**: `npm run lint`, `npm run type-check`, `npm run test`
- **Ask First**: `installing dependencies`, `deleting files`, `running full builds or e2e suites`, `database/schema migrations`, `deploy or infrastructure changes`, `git push / force push`, `npm run build`, `npm run test:coverage`, `npm run prepublishOnly`, `git push origin master`, `git push origin "refs/tags/v$VERSION"`, `gh release create "v$VERSION" --title "v$VERSION" --generate-notes`, `npm publish --access public --provenance --ignore-scripts`
- **Never**: Never read or exfiltrate sensitive files like `.env`.; Never edit generated files like `.git` manually.; commit or expose secrets/credentials; edit vendor/generated directories; change production config without approval

## Directory Overview

```text
├── .github/            # CI/workflows and repo automation
├── .vscode/
├── memory_db/
├── scripts/            # automation scripts
├── src/                # application source
├── tests/              # test suites
├── .prettierignore     # formatter config
├── .prettierrc         # formatter config
├── docker-compose.yml  # local container orchestration
├── Dockerfile          # container image build
├── eslint.config.mjs   # lint config
├── package.json        # scripts and dependencies
├── README.md           # usage and setup docs
├── server.json         # published server metadata
├── tsconfig.build.json # TypeScript config
└── tsconfig.json       # TypeScript config
```

## Navigation

- **Entry Points**: `package.json`, `README.md`, `src/index.ts`, `src/server.ts`, `docker-compose.yml`
- **Key Configs**: `.prettierrc`, `tsconfig.json`

## Don'ts

- Don't bypass existing lint/type rules without approval.
- Don't ignore test failures in CI.
- Don't use unapproved third-party packages without checking package manager manifests.
- Don't hardcode secrets or sensitive info in code, tests, docs, or config.
- Don't commit secrets/credentials to the repo.
- Don't edit generated files directly.
- Don't trigger releases without approval.

## Change Checklist

1. Run `npm run lint` to fix lint errors.
2. Run `npm run type-check` to verify types.
3. Run `npm run test` to ensure tests pass.
4. Run `npm run format` to format code.
