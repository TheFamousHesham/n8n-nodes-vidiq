# n8n-nodes-vidiq Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `n8n-nodes-vidiq`, a verified-eligible n8n community node exposing all 43 vidIQ MCP tools as typed operations across 8 resources.

**Architecture:** One programmatic router node (`VidIq`) + one credential (`VidIqApi`). A shared `transport/` layer speaks MCP JSON-RPC `tools/call` over Streamable HTTP (stateless, SSE-framed) to `https://mcp.vidiq.com/mcp`; `helpers/` cover arg-building, errors, async job polling and binary I/O; each of 8 `resources/` is a thin `description` + `execute` pair that maps typed params → MCP arguments.

**Tech Stack:** TypeScript (CommonJS/ES2019), `@n8n/node-cli` (build/lint/release), `n8n-workflow` (peer), `vitest` (dev, offline tests). Zero runtime dependencies.

**Source of truth:** live tool catalog at `docs/reference/vidiq-mcp-tools.json` (43 tools, full input schemas). Design spec: `docs/superpowers/specs/2026-06-19-n8n-nodes-vidiq-design.md`.

**Repo:** already initialized at `/home/cc/n8n-nodes-vidiq` (branch `main`, has `docs/`, `.gitignore`). All paths below are relative to that root.

---

## Conventions (read once — every resource task relies on these)

**Field → INodeProperties mapping (mechanical, from each tool's `inputSchema`):**

| Schema type | n8n field | Notes |
|---|---|---|
| `string` | `type: 'string'`, `default: ''` | dates → add `placeholder: 'YYYY-MM-DD'` or ISO; ids → placeholder example |
| `string` enum | `type: 'options'`, `options:[{name,value}]`, `default:` first/sensible | `name` = Title Case of value; options sorted alphabetically by `name` |
| `integer`/`number` | `type: 'number'`, `default: 0` (or sensible), `typeOptions:{minValue:…}` when bounded | a param literally named `limit` → `displayName:'Limit'`, `default:50`, `typeOptions:{minValue:1}`, `description:'Max number of results to return'` |
| `boolean` | `type: 'boolean'`, `default:` per schema | **description MUST start with "Whether"** (n8n lint rule) |
| `array` of free strings | `type: 'string'`, `placeholder: 'a, b, c'`, `description` ends "(comma-separated)" | execute converts via `toStringArray()` |
| `array` with known enum domain | `type: 'multiOptions'` | only when the domain is small/known (e.g. `youtube_search.type`) |
| `array`/`object` of structured items | `type: 'json'`, `default: '{}'`/`'[]'` | execute `JSON.parse`s via `parseJsonParam()` |
| binary-capable string (base64/image/audio) | pair of fields: `<name>InputType` (`options`: URL/Binary) + `<name>` (string, shown when URL) + `<name>BinaryProperty` (string, shown when Binary) | execute resolves via `resolveBinaryOrUrl()` |

**Universal rules:**
- Every operation field has `displayOptions:{ show:{ resource:[<r>], operation:[<op>] } }`.
- Every **resource** ends with one shared escape-hatch field `extraArguments` (`type:'json'`, `default:'{}'`, shown for `resource:[<r>]` only). Merged as a **base** under typed fields (typed wins).
- Required schema fields → `required: true` and a non-empty validation is enforced by the server (we surface its error).
- Resource `Operation` options and every `options`/`Resource` list are **sorted alphabetically by `name`** (n8n verification requirement).
- Use `NodeConnectionTypes` (plural) from `n8n-workflow` (matches the existing TheFamousHesham packages).
- Node has `usableAsTool: true`.

**Resource execute signature (every resource module exports this):**
```ts
export type ResourceExecute = (
  ctx: IExecuteFunctions,
  operation: string,
  itemIndex: number,
) => Promise<IDataObject | IDataObject[]>;
```

**Commit after every task** with a Conventional Commit message and the trailer:
```
Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
```

---

## Task 1: Scaffold package config

**Files:**
- Create: `package.json`, `tsconfig.json`, `eslint.config.mjs`, `vitest.config.ts`, `LICENSE`, `README.md`, `CHANGELOG.md`
- Modify: `.gitignore`

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "n8n-nodes-vidiq",
  "version": "0.1.0",
  "description": "n8n community node for vidIQ — YouTube & Instagram intelligence (keyword research, outliers, channel/video analytics, competitors) and AI content tools (titles, thumbnails, voiceover, video) via vidIQ's MCP API. Unofficial; not affiliated with vidIQ.",
  "keywords": [
    "n8n-community-node-package",
    "n8n",
    "vidiq",
    "youtube",
    "seo",
    "analytics",
    "keyword-research",
    "instagram",
    "mcp"
  ],
  "homepage": "https://github.com/TheFamousHesham/n8n-nodes-vidiq",
  "repository": {
    "type": "git",
    "url": "https://github.com/TheFamousHesham/n8n-nodes-vidiq.git"
  },
  "bugs": {
    "url": "https://github.com/TheFamousHesham/n8n-nodes-vidiq/issues"
  },
  "license": "MIT",
  "author": {
    "name": "Hesham",
    "email": "hesham@betterbrainlab.org"
  },
  "scripts": {
    "build": "n8n-node build",
    "build:watch": "tsc --watch",
    "dev": "n8n-node dev",
    "lint": "n8n-node lint",
    "lint:fix": "n8n-node lint --fix",
    "test": "vitest run",
    "smoke": "tsx test/smoke.ts",
    "release": "n8n-node release",
    "prepublishOnly": "n8n-node prerelease"
  },
  "files": [
    "dist"
  ],
  "n8n": {
    "n8nNodesApiVersion": 1,
    "strict": true,
    "credentials": [
      "dist/credentials/VidIqApi.credentials.js"
    ],
    "nodes": [
      "dist/nodes/VidIq/VidIq.node.js"
    ]
  },
  "devDependencies": {
    "@n8n/node-cli": "*",
    "eslint": "9.29.0",
    "n8n-workflow": "*",
    "prettier": "3.8.3",
    "tsx": "4.19.2",
    "typescript": "5.9.3",
    "vitest": "2.1.9"
  },
  "peerDependencies": {
    "n8n-workflow": "*"
  }
}
```

- [ ] **Step 2: Write `tsconfig.json`** (verbatim from the known-good TheFamousHesham packages, plus `test` excluded from the n8n build)

```json
{
  "compilerOptions": {
    "strict": true,
    "module": "commonjs",
    "moduleResolution": "node",
    "target": "es2019",
    "lib": ["es2019", "es2020", "es2022.error"],
    "removeComments": true,
    "useUnknownInCatchVariables": false,
    "forceConsistentCasingInFileNames": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "strictNullChecks": true,
    "preserveConstEnums": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "incremental": true,
    "declaration": true,
    "sourceMap": true,
    "skipLibCheck": true,
    "outDir": "./dist/"
  },
  "include": ["credentials/**/*", "nodes/**/*", "nodes/**/*.json", "package.json"],
  "exclude": ["node_modules", "dist", "test"]
}
```

- [ ] **Step 3: Write `eslint.config.mjs`**

```js
import { config } from '@n8n/node-cli/eslint';

export default config;
```

- [ ] **Step 4: Write `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
  },
});
```

- [ ] **Step 5: Write `LICENSE`** — MIT, copyright `2026 Hesham`. (Copy the MIT text; year 2026, holder "Hesham".)

- [ ] **Step 6: Write `CHANGELOG.md`**

```markdown
# Changelog

All notable changes to this project are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/); this project adheres to [Semantic Versioning](https://semver.org/).

## [0.1.0] - 2026-06-20

### Added
- Initial release. `VidIQ` node with 8 resources covering all 43 vidIQ MCP tools.
- `VidIqApi` credential (Bearer API key) with a live credential test.
```

- [ ] **Step 7: Append to `.gitignore`** so it matches the other packages

Ensure it contains (append any missing lines):
```
node_modules/
dist/
*.log
*.tgz
*.tsbuildinfo
.DS_Store
.env
.env.local
.vscode/
.idea/
.npmrc
```

- [ ] **Step 8: Write a stub `README.md`** (final content authored in Task 14; stub for now)

```markdown
# n8n-nodes-vidiq

Unofficial n8n community node for [vidIQ](https://vidiq.com). Not affiliated with vidIQ.

Work in progress — see `docs/superpowers/specs/2026-06-19-n8n-nodes-vidiq-design.md`.
```

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: scaffold package config (n8n-node cli, strict, vitest)"
```

---

## Task 2: Install dependencies and verify the toolchain

**Files:** none (generates `package-lock.json`, `node_modules/`)

- [ ] **Step 1: Install**

Run: `cd /home/cc/n8n-nodes-vidiq && npm install`
Expected: completes; `package-lock.json` created.

- [ ] **Step 2: Verify the n8n CLI is available**

Run: `npx n8n-node --help`
Expected: prints the `@n8n/node-cli` help (build/lint/dev/release subcommands).

- [ ] **Step 3: Verify vitest runs (no tests yet = pass)**

Run: `npm test`
Expected: vitest reports "No test files found" or exits 0. (If it exits non-zero on no tests, that's fine until Task 3 adds the first test.)

- [ ] **Step 4: Commit the lockfile**

```bash
git add package-lock.json
git commit -m "chore: lock dependencies"
```

---

## Task 3: SSE parser (`transport/sse.ts`)

**Files:**
- Create: `nodes/VidIq/transport/sse.ts`
- Test: `test/sse.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// test/sse.test.ts
import { describe, it, expect } from 'vitest';
import { parseSse } from '../nodes/VidIq/transport/sse';

describe('parseSse', () => {
  it('parses a standard SSE message frame', () => {
    const raw = 'event: message\ndata: {"jsonrpc":"2.0","id":1,"result":{"ok":true}}\n\n';
    expect(parseSse(raw)).toEqual({ jsonrpc: '2.0', id: 1, result: { ok: true } });
  });

  it('parses plain JSON without SSE framing', () => {
    expect(parseSse('{"error":{"code":-32000,"message":"x"}}')).toEqual({
      error: { code: -32000, message: 'x' },
    });
  });

  it('joins multiple data lines of one event', () => {
    const raw = 'data: {"a":1,\ndata: "b":2}\n\n';
    expect(parseSse(raw)).toEqual({ a: 1, b: 2 });
  });

  it('passes through an already-parsed object', () => {
    const obj = { result: { ok: 1 } } as unknown as string;
    expect(parseSse(obj)).toEqual({ result: { ok: 1 } });
  });

  it('throws when no data frame is present', () => {
    expect(() => parseSse('event: ping\n\n')).toThrow(/no SSE data frame/);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run test/sse.test.ts`
Expected: FAIL — `parseSse` not found.

- [ ] **Step 3: Implement `transport/sse.ts`**

```ts
import { type IDataObject } from 'n8n-workflow';

/**
 * vidIQ's MCP server replies with a Server-Sent-Events frame:
 *   event: message\n
 *   data: {json}\n\n
 * We issue a single request and read back a single JSON-RPC message.
 * Per the SSE spec, multiple `data:` lines in one event concatenate (here joined
 * directly, since the JSON payload contains no internal newlines).
 */
export function parseSse(raw: unknown): IDataObject {
  if (raw !== null && typeof raw === 'object') {
    return raw as IDataObject;
  }
  if (typeof raw !== 'string') {
    throw new Error(`vidIQ: unexpected response type ${typeof raw}`);
  }
  const trimmed = raw.trim();
  if (trimmed.startsWith('{')) {
    return JSON.parse(trimmed) as IDataObject;
  }
  const dataLines = trimmed
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice('data:'.length).trimStart());
  if (dataLines.length === 0) {
    throw new Error(`vidIQ: no SSE data frame in response: ${trimmed.slice(0, 200)}`);
  }
  return JSON.parse(dataLines.join('')) as IDataObject;
}
```

- [ ] **Step 4: Run it to confirm it passes**

Run: `npx vitest run test/sse.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add nodes/VidIq/transport/sse.ts test/sse.test.ts
git commit -m "feat: SSE frame parser for vidIQ MCP responses"
```

---

## Task 4: Argument builder & JSON/array helpers (`helpers/args.ts`)

**Files:**
- Create: `nodes/VidIq/helpers/args.ts`
- Test: `test/args.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// test/args.test.ts
import { describe, it, expect } from 'vitest';
import { buildArgs, isEmpty, toStringArray } from '../nodes/VidIq/helpers/args';

describe('isEmpty', () => {
  it('treats undefined, null, "" and [] as empty; keeps false/0', () => {
    expect(isEmpty(undefined)).toBe(true);
    expect(isEmpty(null)).toBe(true);
    expect(isEmpty('')).toBe(true);
    expect(isEmpty([])).toBe(true);
    expect(isEmpty(false)).toBe(false);
    expect(isEmpty(0)).toBe(false);
  });
});

describe('toStringArray', () => {
  it('splits CSV and trims', () => {
    expect(toStringArray('a, b ,c')).toEqual(['a', 'b', 'c']);
  });
  it('passes arrays through as strings', () => {
    expect(toStringArray(['x', 1])).toEqual(['x', '1']);
  });
  it('returns [] for empties', () => {
    expect(toStringArray('')).toEqual([]);
    expect(toStringArray(undefined)).toEqual([]);
  });
});

describe('buildArgs', () => {
  it('omits empty params', () => {
    expect(buildArgs({ a: 'x', b: '', c: undefined, d: 0, e: false })).toEqual({
      a: 'x', d: 0, e: false,
    });
  });
  it('applies extra as a base that typed fields override', () => {
    expect(buildArgs({ a: 'typed' }, { a: 'extra', z: 'only-extra' })).toEqual({
      a: 'typed', z: 'only-extra',
    });
  });
  it('omits empty extra keys', () => {
    expect(buildArgs({}, { a: '', b: 'keep' })).toEqual({ b: 'keep' });
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run test/args.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `helpers/args.ts`**

```ts
import { type IDataObject, type IExecuteFunctions } from 'n8n-workflow';

export function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

/** "a, b ,c" -> ["a","b","c"]; arrays pass through (stringified); empties -> []. */
export function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v));
  if (typeof value === 'string') {
    return value.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
  }
  return [];
}

/**
 * Collect provided params into an MCP `arguments` object.
 * `extra` (the Extra Arguments JSON escape hatch) is applied first as a base;
 * typed params are merged on top and win. Empty values are dropped from both.
 */
export function buildArgs(params: IDataObject, extra?: IDataObject): IDataObject {
  const args: IDataObject = {};
  if (extra && typeof extra === 'object') {
    for (const [k, v] of Object.entries(extra)) if (!isEmpty(v)) args[k] = v;
  }
  for (const [k, v] of Object.entries(params)) if (!isEmpty(v)) args[k] = v;
  return args;
}

/** Read a `type:'json'` param that may arrive as a string or object. */
export function parseJsonParam(ctx: IExecuteFunctions, name: string, i: number): IDataObject {
  const raw = ctx.getNodeParameter(name, i, {});
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (t === '') return {};
    try { return JSON.parse(t) as IDataObject; } catch { return {}; }
  }
  return (raw ?? {}) as IDataObject;
}
```

- [ ] **Step 4: Run it to confirm it passes**

Run: `npx vitest run test/args.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add nodes/VidIq/helpers/args.ts test/args.test.ts
git commit -m "feat: argument builder with extra-args base merge and helpers"
```

---

## Task 5: Error mapper (`transport/errors.ts`)

**Files:**
- Create: `nodes/VidIq/transport/errors.ts`
- Test: `test/errors.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// test/errors.test.ts
import { describe, it, expect } from 'vitest';
import { extractErrorText, isCreditError, mcpToolError } from '../nodes/VidIq/transport/errors';
import { NodeOperationError } from 'n8n-workflow';

const node = { id: '1', name: 'VidIQ', type: 'vidIq', typeVersion: 1, position: [0, 0], parameters: {} } as any;

describe('extractErrorText', () => {
  it('pulls text from content array', () => {
    expect(extractErrorText({ content: [{ type: 'text', text: 'boom' }], isError: true })).toBe('boom');
  });
  it('falls back when no text', () => {
    expect(extractErrorText({ isError: true })).toMatch(/no message/);
  });
});

describe('isCreditError', () => {
  it('detects credit/quota wording', () => {
    expect(isCreditError('Insufficient credits remaining')).toBe(true);
    expect(isCreditError('MCP error -32602: Tool x not found')).toBe(false);
  });
});

describe('mcpToolError', () => {
  it('returns a NodeOperationError naming the tool', () => {
    const err = mcpToolError(node, 'vidiq_channel_stats', {
      content: [{ type: 'text', text: 'MCP error -32602: Input validation error' }],
      isError: true,
    });
    expect(err).toBeInstanceOf(NodeOperationError);
    expect(err.message).toContain('vidiq_channel_stats');
    expect(err.message).toContain('Input validation error');
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run test/errors.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `transport/errors.ts`**

```ts
import { NodeOperationError, type IDataObject, type INode } from 'n8n-workflow';

/** vidIQ tool failures arrive as HTTP 200 with result.isError and text in content[].text. */
export function extractErrorText(result: IDataObject): string {
  const content = result.content as Array<{ type: string; text?: string }> | undefined;
  const text = content?.find((c) => typeof c.text === 'string')?.text;
  return text ?? 'vidIQ returned an error with no message';
}

export function isCreditError(message: string): boolean {
  return /credit|insufficient|quota|not enough|balance/i.test(message);
}

export function mcpToolError(node: INode, toolName: string, result: IDataObject): NodeOperationError {
  const raw = extractErrorText(result);
  const description = isCreditError(raw)
    ? 'vidIQ credits may be exhausted — check Account → Get Credit Balance.'
    : undefined;
  return new NodeOperationError(node, `vidIQ tool "${toolName}" failed: ${raw}`, { description });
}
```

- [ ] **Step 4: Run it to confirm it passes**

Run: `npx vitest run test/errors.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add nodes/VidIq/transport/errors.ts test/errors.test.ts
git commit -m "feat: MCP tool-error mapper with credit-exhaustion hint"
```

---

## Task 6: Job helpers (`helpers/jobs.ts`)

**Files:**
- Create: `nodes/VidIq/helpers/jobs.ts`
- Test: `test/jobs.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// test/jobs.test.ts
import { describe, it, expect } from 'vitest';
import { findJobId, jobStatus, isTerminal, pollJob } from '../nodes/VidIq/helpers/jobs';

describe('job detection', () => {
  it('finds an mcpJobId at top level or nested', () => {
    expect(findJobId({ mcpJobId: 'a' })).toBe('a');
    expect(findJobId({ job: { mcpJobId: 'b' } })).toBe('b');
    expect(findJobId({ foo: 1 })).toBeUndefined();
  });
  it('reads status and terminality', () => {
    expect(jobStatus({ status: 'completed' })).toBe('completed');
    expect(isTerminal('completed')).toBe(true);
    expect(isTerminal('inprogress')).toBe(false);
    expect(isTerminal(undefined)).toBe(false);
  });
});

describe('pollJob', () => {
  const noSleep = async () => {};
  it('returns once status is terminal', async () => {
    const statuses = ['inprogress', 'inprogress', 'completed'];
    let n = 0;
    const res = await pollJob('jid', async () => ({ status: statuses[n++] }), noSleep, 300);
    expect(res).toEqual({ status: 'completed' });
    expect(n).toBe(3);
  });
  it('throws on timeout', async () => {
    await expect(
      pollJob('jid', async () => ({ status: 'inprogress' }), noSleep, 1),
    ).rejects.toThrow(/did not finish within 1s/);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run test/jobs.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `helpers/jobs.ts`**

```ts
import { type IDataObject } from 'n8n-workflow';

const TERMINAL = new Set(['completed', 'failed', 'expired', 'refunded']);

export function findJobId(result: IDataObject): string | undefined {
  const nested = (result.job as IDataObject | undefined)?.mcpJobId;
  const candidates = [result.mcpJobId, result.jobId, nested];
  for (const c of candidates) if (typeof c === 'string' && c.length > 0) return c;
  return undefined;
}

export function jobStatus(result: IDataObject): string | undefined {
  const s = result.status ?? (result.job as IDataObject | undefined)?.status;
  return typeof s === 'string' ? s : undefined;
}

export function isTerminal(status: string | undefined): boolean {
  return status !== undefined && TERMINAL.has(status);
}

/**
 * Poll until the job reaches a terminal status or maxWaitSec elapses.
 * `poll` and `sleep` are injected for testability; backoff grows 2s -> 15s.
 */
export async function pollJob(
  mcpJobId: string,
  poll: (id: string) => Promise<IDataObject>,
  sleep: (ms: number) => Promise<void>,
  maxWaitSec: number,
): Promise<IDataObject> {
  const deadlineMs = maxWaitSec * 1000;
  let waitedMs = 0;
  let delayMs = 2000;
  for (;;) {
    const res = await poll(mcpJobId);
    if (isTerminal(jobStatus(res))) return res;
    if (waitedMs >= deadlineMs) {
      throw new Error(
        `vidIQ job ${mcpJobId} did not finish within ${maxWaitSec}s (last status: ${jobStatus(res) ?? 'unknown'})`,
      );
    }
    await sleep(delayMs);
    waitedMs += delayMs;
    delayMs = Math.min(Math.round(delayMs * 1.5), 15000);
  }
}
```

- [ ] **Step 4: Run it to confirm it passes**

Run: `npx vitest run test/jobs.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add nodes/VidIq/helpers/jobs.ts test/jobs.test.ts
git commit -m "feat: async job detection and bounded polling"
```

---

## Task 7: Binary helper (`helpers/binary.ts`)

**Files:**
- Create: `nodes/VidIq/helpers/binary.ts`
- Test: `test/binary.test.ts`

- [ ] **Step 1: Write the failing test** (uses a stub `ctx` exposing the two helpers we call)

```ts
// test/binary.test.ts
import { describe, it, expect } from 'vitest';
import { resolveBinaryOrUrl } from '../nodes/VidIq/helpers/binary';

function ctxWith(buffer: Buffer, mime = 'image/png') {
  return {
    helpers: {
      getBinaryDataBuffer: async () => buffer,
      assertBinaryData: () => ({ mimeType: mime }),
    },
  } as any;
}

describe('resolveBinaryOrUrl', () => {
  it('returns the url unchanged for url mode', async () => {
    const out = await resolveBinaryOrUrl(ctxWith(Buffer.from('')), 0, 'url', 'https://x/y.png', 'data');
    expect(out).toBe('https://x/y.png');
  });
  it('base64-encodes binary in binary mode', async () => {
    const out = await resolveBinaryOrUrl(ctxWith(Buffer.from('hi')), 0, 'binary', '', 'data');
    expect(out).toBe(Buffer.from('hi').toString('base64'));
  });
  it('wraps as data URI when requested', async () => {
    const out = await resolveBinaryOrUrl(ctxWith(Buffer.from('hi'), 'audio/mpeg'), 0, 'binary', '', 'data', true);
    expect(out).toBe(`data:audio/mpeg;base64,${Buffer.from('hi').toString('base64')}`);
  });
}); 
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run test/binary.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `helpers/binary.ts`**

```ts
import { type IExecuteFunctions } from 'n8n-workflow';

export type BinaryInputType = 'url' | 'binary';

/** Resolve a value that may be a URL/string or an n8n binary property to send to vidIQ. */
export async function resolveBinaryOrUrl(
  ctx: IExecuteFunctions,
  itemIndex: number,
  inputType: BinaryInputType,
  value: string,
  binaryProperty: string,
  asDataUri = false,
): Promise<string> {
  if (inputType === 'url') return value;
  const buffer = await ctx.helpers.getBinaryDataBuffer(itemIndex, binaryProperty);
  const base64 = buffer.toString('base64');
  if (asDataUri) {
    const meta = ctx.helpers.assertBinaryData(itemIndex, binaryProperty);
    return `data:${meta.mimeType};base64,${base64}`;
  }
  return base64;
}
```

- [ ] **Step 4: Run it to confirm it passes**

Run: `npx vitest run test/binary.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add nodes/VidIq/helpers/binary.ts test/binary.test.ts
git commit -m "feat: binary/URL input resolver for image & audio tools"
```

---

## Task 8: Transport client (`transport/mcpClient.ts`)

**Files:**
- Create: `nodes/VidIq/transport/mcpClient.ts`
- Test: `test/mcpClient.test.ts`

- [ ] **Step 1: Write the failing test** (stub `ctx` with a fake authenticated request returning SSE)

```ts
// test/mcpClient.test.ts
import { describe, it, expect, vi } from 'vitest';
import { vidiqToolCall } from '../nodes/VidIq/transport/mcpClient';

function ctx(responder: (opts: any) => any) {
  const node = { id: '1', name: 'VidIQ', type: 'vidIq', typeVersion: 1, position: [0, 0], parameters: {} };
  return {
    getNode: () => node,
    helpers: { httpRequestWithAuthentication: vi.fn(async function (_cred: string, opts: any) { return responder(opts); }) },
  } as any;
}

const sse = (obj: unknown) => `event: message\ndata: ${JSON.stringify(obj)}\n\n`;

describe('vidiqToolCall', () => {
  it('posts tools/call and returns structuredContent', async () => {
    const c = ctx(() => sse({ jsonrpc: '2.0', id: 1, result: { structuredContent: { totalCredits: 5 }, content: [], isError: false } }));
    const out = await vidiqToolCall(c, 'vidiq_balance', {});
    expect(out).toEqual({ totalCredits: 5 });
    const call = c.helpers.httpRequestWithAuthentication.mock.calls[0];
    expect(call[0]).toBe('vidIqApi');
    expect(call[1].url).toBe('https://mcp.vidiq.com/mcp');
    expect(JSON.parse(call[1].body)).toMatchObject({ method: 'tools/call', params: { name: 'vidiq_balance' } });
  });

  it('falls back to parsing content[].text when no structuredContent', async () => {
    const c = ctx(() => sse({ result: { content: [{ type: 'text', text: '{"x":1}' }] } }));
    expect(await vidiqToolCall(c, 'vidiq_x', {})).toEqual({ x: 1 });
  });

  it('throws NodeOperationError when result.isError is true', async () => {
    const c = ctx(() => sse({ result: { isError: true, content: [{ type: 'text', text: 'MCP error -32602: bad' }] } }));
    await expect(vidiqToolCall(c, 'vidiq_x', {})).rejects.toThrow(/vidiq_x.*bad/);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run test/mcpClient.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `transport/mcpClient.ts`**

```ts
import {
  NodeApiError,
  type IDataObject,
  type IExecuteFunctions,
  type ILoadOptionsFunctions,
  type JsonObject,
} from 'n8n-workflow';
import { parseSse } from './sse';
import { mcpToolError } from './errors';

export const VIDIQ_MCP_ENDPOINT = 'https://mcp.vidiq.com/mcp';

type Ctx = IExecuteFunctions | ILoadOptionsFunctions;

/** Single network path: POST a JSON-RPC tools/call and return the tool's structured result. */
export async function vidiqToolCall(ctx: Ctx, toolName: string, args: IDataObject): Promise<IDataObject> {
  const body = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: { name: toolName, arguments: args },
  });

  let raw: unknown;
  try {
    raw = await ctx.helpers.httpRequestWithAuthentication.call(ctx, 'vidIqApi', {
      method: 'POST',
      url: VIDIQ_MCP_ENDPOINT,
      body,
      json: false, // we need the raw SSE text; Accept header comes from the credential
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    throw new NodeApiError(ctx.getNode(), error as JsonObject);
  }

  const message = parseSse(raw);
  if (message.error) {
    throw new NodeApiError(ctx.getNode(), message as JsonObject);
  }
  const result = (message.result ?? {}) as IDataObject;
  if (result.isError === true) {
    throw mcpToolError(ctx.getNode(), toolName, result);
  }

  const structured = result.structuredContent as IDataObject | undefined;
  if (structured !== undefined) return structured;

  const content = result.content as Array<{ type: string; text?: string }> | undefined;
  const text = content?.find((c) => typeof c.text === 'string')?.text;
  if (typeof text === 'string') {
    try { return JSON.parse(text) as IDataObject; } catch { return { text }; }
  }
  return result;
}
```

- [ ] **Step 4: Run it to confirm it passes**

Run: `npx vitest run test/mcpClient.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add nodes/VidIq/transport/mcpClient.ts test/mcpClient.test.ts
git commit -m "feat: MCP transport client (tools/call over Streamable HTTP)"
```

---

## Task 9: Credential (`credentials/VidIqApi.credentials.ts`) + icon

**Files:**
- Create: `credentials/VidIqApi.credentials.ts`, `credentials/vidiq.svg`, `nodes/VidIq/vidiq.svg`

- [ ] **Step 1: Add the icon** — create `credentials/vidiq.svg` (a simple square vidIQ-style mark; reuse for the node). Minimal valid SVG:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48"><rect width="48" height="48" rx="10" fill="#F33A3A"/><path d="M14 14l7 20h6l7-20h-6l-4 12-4-12z" fill="#fff"/></svg>
```

Then copy it to the node folder:
```bash
mkdir -p nodes/VidIq
cp credentials/vidiq.svg nodes/VidIq/vidiq.svg
```

- [ ] **Step 2: Write the credential**

```ts
import {
  type IAuthenticateGeneric,
  type ICredentialTestRequest,
  type ICredentialType,
  type INodeProperties,
  type Icon,
} from 'n8n-workflow';

export class VidIqApi implements ICredentialType {
  name = 'vidIqApi';
  displayName = 'VidIQ API';
  documentationUrl = 'https://github.com/TheFamousHesham/n8n-nodes-vidiq#credentials';
  icon: Icon = 'file:vidiq.svg';

  properties: INodeProperties[] = [
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
      placeholder: 'vidiq_...',
      description:
        'Your vidIQ API key. Requires a vidIQ Max plan. Generate it at vidiq.com (MCP / API access).',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        Authorization: '=Bearer {{$credentials.apiKey}}',
        Accept: 'application/json, text/event-stream',
      },
    },
  };

  // Bad key -> HTTP 401 -> n8n marks the credential invalid.
  test: ICredentialTestRequest = {
    request: {
      baseURL: 'https://mcp.vidiq.com',
      url: '/mcp',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
      body: {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: { name: 'vidiq_balance', arguments: {} },
      },
    },
  };
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no errors (note: will also need Task 10's node to exist for the n8n `build`; `tsc --noEmit` of just this file should pass).

- [ ] **Step 4: Commit**

```bash
git add credentials/ nodes/VidIq/vidiq.svg
git commit -m "feat: VidIqApi credential with Bearer auth and live test"
```

---

## Task 10: Node router skeleton (`nodes/VidIq/VidIq.node.ts`) with the Keyword resource only

This task wires the router end-to-end with exactly one resource so the node loads and builds. Remaining resources are added in Tasks 11.x.

**Files:**
- Create: `nodes/VidIq/VidIq.node.ts`, `nodes/VidIq/VidIq.node.json`
- Create: `nodes/VidIq/resources/keyword/Keyword.description.ts`, `nodes/VidIq/resources/keyword/execute.ts`
- Test: `test/keyword.test.ts`

- [ ] **Step 1: Write the codex metadata `VidIq.node.json`**

```json
{
  "node": "n8n-nodes-vidiq.vidIq",
  "nodeVersion": "1.0",
  "codexVersion": "1.0",
  "categories": ["Marketing", "Analytics"],
  "resources": {
    "credentialDocumentation": [
      { "url": "https://github.com/TheFamousHesham/n8n-nodes-vidiq#credentials" }
    ],
    "primaryDocumentation": [
      { "url": "https://github.com/TheFamousHesham/n8n-nodes-vidiq#readme" }
    ]
  }
}
```

- [ ] **Step 2: Write the Keyword description** `resources/keyword/Keyword.description.ts`

```ts
import { type INodeProperties } from 'n8n-workflow';

const show = (operation: string) => ({ show: { resource: ['keyword'], operation: [operation] } });

export const keywordDescription: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['keyword'] } },
    options: [
      {
        name: 'Research',
        value: 'research',
        action: 'Research keywords',
        description: 'Find search volume, competition and related keyword opportunities',
      },
    ],
    default: 'research',
  },
  {
    displayName: 'Keyword',
    name: 'keyword',
    type: 'string',
    default: '',
    description: 'Seed keyword to research',
    displayOptions: show('research'),
  },
  {
    displayName: 'Mode',
    name: 'mode',
    type: 'options',
    options: [
      { name: 'Country Search', value: 'country_search' },
      { name: 'Country Top', value: 'country_top' },
      { name: 'Research', value: 'research' },
    ],
    default: 'research',
    description: 'Which keyword-research mode to use',
    displayOptions: show('research'),
  },
  {
    displayName: 'Country',
    name: 'country',
    type: 'string',
    default: '',
    placeholder: 'US',
    description: 'ISO 3166-1 alpha-2 country code for in-country volume',
    displayOptions: show('research'),
  },
  {
    displayName: 'Include Related',
    name: 'includeRelated',
    type: 'boolean',
    default: true,
    description: 'Whether to include related keyword suggestions',
    displayOptions: show('research'),
  },
  {
    displayName: 'Broad',
    name: 'broad',
    type: 'boolean',
    default: false,
    description: 'Whether to broaden the keyword search',
    displayOptions: show('research'),
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    typeOptions: { minValue: 1 },
    default: 50,
    description: 'Max number of results to return',
    displayOptions: show('research'),
  },
  {
    displayName: 'Extra Arguments (JSON)',
    name: 'extraArguments',
    type: 'json',
    default: '{}',
    description: 'Advanced: raw vidIQ arguments merged as a base; typed fields above take precedence',
    displayOptions: { show: { resource: ['keyword'] } },
  },
];
```

- [ ] **Step 3: Write the Keyword execute** `resources/keyword/execute.ts`

```ts
import { NodeOperationError, type IDataObject, type IExecuteFunctions } from 'n8n-workflow';
import { buildArgs, parseJsonParam } from '../../helpers/args';
import { vidiqToolCall } from '../../transport/mcpClient';

export async function keywordExecute(
  ctx: IExecuteFunctions,
  operation: string,
  i: number,
): Promise<IDataObject | IDataObject[]> {
  if (operation === 'research') {
    const params: IDataObject = {
      keyword: ctx.getNodeParameter('keyword', i, '') as string,
      mode: ctx.getNodeParameter('mode', i, 'research') as string,
      country: ctx.getNodeParameter('country', i, '') as string,
      includeRelated: ctx.getNodeParameter('includeRelated', i, true) as boolean,
      broad: ctx.getNodeParameter('broad', i, false) as boolean,
      limit: ctx.getNodeParameter('limit', i, 50) as number,
    };
    const extra = parseJsonParam(ctx, 'extraArguments', i);
    return vidiqToolCall(ctx, 'vidiq_keyword_research', buildArgs(params, extra));
  }
  throw new NodeOperationError(ctx.getNode(), `Unknown keyword operation: ${operation}`);
}
```

- [ ] **Step 4: Write the router node** `nodes/VidIq/VidIq.node.ts`

```ts
// n8n-nodes-vidiq — typed n8n operations over vidIQ's MCP API.
// Speaks MCP tools/call via n8n http helpers only (no fs, no fetch, no runtime deps).

import {
  NodeConnectionTypes,
  type IDataObject,
  type IExecuteFunctions,
  type INodeExecutionData,
  type INodeType,
  type INodeTypeDescription,
} from 'n8n-workflow';

import { keywordDescription } from './resources/keyword/Keyword.description';
import { keywordExecute } from './resources/keyword/execute';

type ResourceExecute = (
  ctx: IExecuteFunctions,
  operation: string,
  itemIndex: number,
) => Promise<IDataObject | IDataObject[]>;

const executors: Record<string, ResourceExecute> = {
  keyword: keywordExecute,
};

export class VidIq implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'VidIQ',
    name: 'vidIq',
    icon: 'file:vidiq.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'YouTube & Instagram intelligence and AI content tools via vidIQ',
    defaults: { name: 'VidIQ' },
    inputs: [NodeConnectionTypes.Main],
    outputs: [NodeConnectionTypes.Main],
    usableAsTool: true,
    credentials: [{ name: 'vidIqApi', required: true }],
    properties: [
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        // Alphabetical order required by n8n verification
        options: [
          { name: 'Account', value: 'account' },
          { name: 'Channel', value: 'channel' },
          { name: 'Instagram', value: 'instagram' },
          { name: 'Job', value: 'job' },
          { name: 'Keyword', value: 'keyword' },
          { name: 'Studio', value: 'studio' },
          { name: 'Trend', value: 'trend' },
          { name: 'Video', value: 'video' },
        ],
        default: 'keyword',
      },
      ...keywordDescription,
      // Tasks 11.x append the other resource descriptions here.
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const out: INodeExecutionData[] = [];
    const resource = this.getNodeParameter('resource', 0) as string;
    const exec = executors[resource];

    for (let i = 0; i < items.length; i++) {
      try {
        if (!exec) {
          throw new Error(`Unsupported resource: ${resource}`);
        }
        const operation = this.getNodeParameter('operation', i) as string;
        const result = await exec(this, operation, i);
        const rows = Array.isArray(result) ? result : [result];
        for (const json of rows) out.push({ json, pairedItem: { item: i } });
      } catch (error) {
        if (this.continueOnFail()) {
          out.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
          continue;
        }
        throw error;
      }
    }
    return [out];
  }
}
```

- [ ] **Step 5: Write `test/keyword.test.ts`** (mock the transport module; assert arg mapping)

```ts
// test/keyword.test.ts
import { describe, it, expect, vi } from 'vitest';

vi.mock('../nodes/VidIq/transport/mcpClient', () => ({
  vidiqToolCall: vi.fn(async (_ctx: unknown, tool: string, args: unknown) => ({ tool, args })),
}));

import { keywordExecute } from '../nodes/VidIq/resources/keyword/execute';
import { vidiqToolCall } from '../nodes/VidIq/transport/mcpClient';

function ctx(params: Record<string, unknown>) {
  return {
    getNode: () => ({ name: 'VidIQ' }),
    getNodeParameter: (name: string, _i: number, fallback?: unknown) =>
      name in params ? params[name] : fallback,
  } as any;
}

describe('keywordExecute', () => {
  it('maps research params and omits empties', async () => {
    await keywordExecute(
      ctx({ keyword: 'minecraft', mode: 'research', country: '', includeRelated: true, broad: false, limit: 50, extraArguments: '{}' }),
      'research',
      0,
    );
    expect(vidiqToolCall).toHaveBeenCalledWith(expect.anything(), 'vidiq_keyword_research', {
      keyword: 'minecraft', mode: 'research', includeRelated: true, broad: false, limit: 50,
    });
  });
});
```

- [ ] **Step 6: Run tests + build**

Run: `npm test`
Expected: all suites pass.
Run: `npm run build`
Expected: builds to `dist/` with no errors (this is the first full `n8n-node build`; it also runs the bundled lint — fix any reported issues, e.g. option ordering or boolean descriptions).

- [ ] **Step 7: Commit**

```bash
git add nodes/VidIq test/keyword.test.ts
git commit -m "feat: VidIq router node + Keyword resource (Research)"
```

---

## Tasks 11.1–11.7: Resource modules (one task each)

Each resource task: create `resources/<r>/<R>.description.ts` and `resources/<r>/execute.ts`; register them in `VidIq.node.ts` (import + add to `executors` + spread description into `properties`); add `test/<r>.test.ts` asserting arg-mapping for **at least the operations with required fields**; run `npm test && npm run build`; commit.

Use the **Conventions** section for field shapes, the tool's `inputSchema` in `docs/reference/vidiq-mcp-tools.json` for the exact field list, and §4 of the spec for the operation/tool mapping. The Keyword module (Task 10) is the canonical template to copy.

For each operation, `execute` builds `params` from `getNodeParameter(...)` for every field, converts array fields with `toStringArray(...)`, converts `type:'json'` fields with `parseJsonParam(...)`, then `return vidiqToolCall(ctx, '<tool>', buildArgs(params, extra))`.

### Task 11.1: Trend resource
Operations → tools (alphabetical by name): **Categories** → `vidiq_trend_categories` (no params); **Trending Videos** → `vidiq_trending_videos`; **Video Outliers** → `vidiq_outliers`.
- `vidiq_trending_videos` fields: `videoFormat`*(options long|short), `titleQuery`(string), `subscriberCountMin/Max`(number), `viewCountMin`(number), `vphMin`(number), `channelCountry`(string), `videoPublishedAfter/Before`(string, ISO), `sortBy`(options relevance|vph|viewCount|engagementRate|videoPublishedAt), `limit`(number, default 50).
- `vidiq_outliers` fields: `keyword`(string), `channelIds`(string CSV→array), `contentType`(options all|long|short), `minOutlierScore`/`minVph`/`minEngagementRate`(number), `minSubscribers`/`maxSubscribers`/`minViews`/`maxViews`(number), `publishedWithin`(options thisWeek|thisMonth|threeMonths|sixMonths|oneYear|allTime), `channelCountry`(string), `trendCategories`(string CSV→array), `sort`(options breakoutScore|publishedAt|viewCount|vph|score), `limit`(number).

### Task 11.2: Channel resource
Operations → tools: **Analytics** → `vidiq_channel_analytics`; **Find Breakout** → `vidiq_breakout_channels`; **Find Similar** → `vidiq_similar_channels`; **Get Many by IDs** → `vidiq_get_channels_by_ids`; **Get My Channels** → `vidiq_user_channels` (no params); **Get Performance Trends** → `vidiq_channel_performance_trends`; **Get Stats** → `vidiq_channel_stats`; **Get Videos** → `vidiq_channel_videos`; **List Competitors** → `vidiq_list_competitors`; **Search** → `vidiq_channel_search` (see Task 12 for its wide-field strategy); **Update Competitors** → `vidiq_update_competitors`.
- `vidiq_channel_stats`: `channelId`*(string), `from`/`to`(string ISO).
- `vidiq_channel_videos`: `channelId`*(string), `videoFormat`*(options long|short|live), `popular`(boolean, "Whether to return only popular videos").
- `vidiq_channel_performance_trends`: `channelId`*(string).
- `vidiq_channel_analytics`: `channelId`*(string), `startDate`/`endDate`(string), `metrics`/`dimensions`(string CSV→array), `maxResults`(number), `filters`(string), `sort`(string).
- `vidiq_similar_channels`: `niche`*(string), `minSubscribers`/`maxSubscribers`(number), `country`(string), `language`(string), `size`(number), `excludeChannelIds`(string CSV→array).
- `vidiq_breakout_channels`: `query`*(string), `channelType`(options long|short|mixed), `country`(string), `subscriberCountMin/Max`(number), `faceless`(boolean, "Whether to only include faceless channels"), `limit`(number).
- `vidiq_get_channels_by_ids`: `channelIds`*(string CSV→array).
- `vidiq_list_competitors`: `youtubeChannelId`*(string).
- `vidiq_update_competitors`: `youtubeChannelId`*(string), `follow`/`unfollow`(string CSV→array).

### Task 11.3: Video resource
Operations → tools: **Analyze** → `vidiq_video_watch`; **Comments** → `vidiq_video_comments`; **Get Many by IDs** → `vidiq_get_videos_by_ids`; **Search YouTube** → `vidiq_youtube_search`; **Stats History** → `vidiq_video_stats`; **Transcript** → `vidiq_video_transcript`.
- `vidiq_video_watch`: `video`*(string, URL or ID), `prompt`(string).
- `vidiq_video_comments`: `videoId`(string), `channelId`(string), `order`(options time|relevance), `maxResult`(number).
- `vidiq_get_videos_by_ids`: `videoIds`*(string CSV→array).
- `vidiq_youtube_search`: `query`*(string), `type`(multiOptions: video|channel|playlist), `order`(options relevance|date|viewCount|rating|title|videoCount), `limit`(number), `publishedAfter/Before`(string), `channelId`(string), `regionCode`(string), `videoDuration`(options short|medium|long), `videoDefinition`(options high|standard), `eventType`(options live|upcoming|completed), `topic`(string — large enum, keep as string with note). 
- `vidiq_video_stats`: `videoId`*(string), `granularity`*(options hourly|daily|monthly), `from`/`to`(string), `order`(options asc|desc).
- `vidiq_video_transcript`: `videoId`*(string), `language`(string).

### Task 11.4: Studio resource (generative; see Task 13 for async + binary wiring)
Operations → tools: **Clone Voice (Upload)** → `vidiq_voiceover_clone`; **Clone Voice From YouTube** → `vidiq_voiceover_clone_start`; **Compose** → `vidiq_compose`; **Find B-Roll** → `vidiq_generate_broll`; **Generate Clips** → `vidiq_generate_clips`; **Generate Thumbnail** → `vidiq_generate_thumbnail`; **Generate Titles** → `vidiq_generate_titles`; **Generate Video** → `vidiq_generate_video`; **Generate Voiceover** → `vidiq_voiceover_generate`; **List Voices** → `vidiq_voiceover_list_voices` (no params); **Refine Thumbnail** → `vidiq_refine_thumbnail`; **Score Thumbnail** → `vidiq_score_thumbnail`; **Score Title** → `vidiq_score_title`.
- Non-binary, non-async first (this task): `vidiq_score_title`(`title`*, `type`* long|short, `videoId`, `channelId`), `vidiq_generate_titles`(`videoId`,`title`,`description`,`numTitles` number,`type` long|short,`language`,`regionCode`,`scoreThreshold` number,`previousTitles` CSV→array,`competitorTitles` json,`analysisSummary`), `vidiq_generate_broll`(`query`*,`orientation` landscape|portrait|square,`minDurationSeconds`/`maxDurationSeconds` number), `vidiq_voiceover_list_voices`(none), `vidiq_voiceover_generate`(`script`*,`voiceId`*,`output` url_only|url_and_audio).
- Binary/async ones (`vidiq_score_thumbnail`, `vidiq_generate_thumbnail`, `vidiq_refine_thumbnail`, `vidiq_voiceover_clone`, `vidiq_generate_video`, `vidiq_generate_clips`, `vidiq_compose`, `vidiq_voiceover_clone_start`) get their fields here but their binary-input and `Wait for Completion` wiring is completed in Task 13.

### Task 11.5: Instagram resource
Operations → tools: **Accounts From Outliers** → `vidiq_ig_accounts_from_outliers`; **Analyze Reel** → `vidiq_ig_reel_watch`; **Find Outlier Reels** → `vidiq_ig_outlier_reels_search` (wide — same Additional-Filters strategy as Task 12); **Get Profile** → `vidiq_ig_profile`; **Get Profile Reels** → `vidiq_ig_profile_reels`.
- `vidiq_ig_profile`/`vidiq_ig_profile_reels`: `handle`*(string).
- `vidiq_ig_reel_watch`: `reel`*(string), `prompt`(string).
- `vidiq_ig_accounts_from_outliers`: `niche`*(string), `audienceQuery`*(string), `followersMin`/`followersMax`(number).

### Task 11.6: Account resource
Operations → tools: **Get Credit Balance** → `vidiq_balance` (no params); **Submit Feedback** → `vidiq_submit_feedback`.
- `vidiq_submit_feedback`: `type`*(options feature_request|bug_report|improvement|general), `tool_name`(string), `description`*(string), `use_case`(string).

### Task 11.7: Job resource
Operations → tools: **Get Job Status** → `vidiq_job_poll`; **List Jobs** → `vidiq_jobs_list`.
- `vidiq_job_poll`: `mcpJobId`*(string).
- `vidiq_jobs_list`: `toolName`(string), `status`(options inprogress|completed|failed|expired|refunded), `limit`(number).

**Each 11.x ends with:** `npm test && npm run build` green, then commit `feat: <Resource> resource (<N> operations)`.

---

## Task 12: Wide-tool field strategy (`channel_search`, `ig_outlier_reels_search`)

**Files:** modify `resources/channel/Channel.description.ts`, `resources/channel/execute.ts` (and the Instagram equivalents)

- [ ] **Step 1:** Expose core fields as typed top-level fields: for `channel_search` — `query`, `channelType`(options), `country`(CSV→array), `languages`(CSV→array), `subscriberCountMin/Max`, `viewCountMin/Max`, `videoCountMin/Max`, `faceless`(bool), `breakoutChannel`(bool), `sort`(options), `limit`.

- [ ] **Step 2:** Put the long tail of growth/duration/count window ranges (e.g. `subsGrowth7dMin`…`shortViewCount1yMax`, `nicheConfidenceMin`, `handle*`, `description`, `mainCategory`, `publishedAfter/Before`, `lastVideoPublished*`) into an `Additional Filters` `collection` field named `additionalFilters` with one `collection` option per schema key (copy the exact names from the catalog so they pass straight through).

- [ ] **Step 3:** In `execute`, spread `additionalFilters` (a collection returns an object) into `params` before `buildArgs`. Example:
```ts
const additional = ctx.getNodeParameter('additionalFilters', i, {}) as IDataObject;
const params: IDataObject = { query, channelType, /* …core… */, ...additional };
// array-typed keys still need toStringArray() applied
```

- [ ] **Step 4:** Apply the identical pattern to `vidiq_ig_outlier_reels_search` (core: `query`*, `audienceQuery`*, `embeddingType`, `pageSize`, `page`; rest in `additionalFilters`).

- [ ] **Step 5:** `npm test && npm run build`; commit `feat: wide-filter strategy for channel & reel search`.

---

## Task 13: Async jobs + binary I/O wiring (Studio)

**Files:** modify `resources/studio/Studio.description.ts`, `resources/studio/execute.ts`; use `helpers/jobs.ts`, `helpers/binary.ts`

- [ ] **Step 1:** For each binary-capable input (`score_thumbnail.image`, `generate_thumbnail.currentThumbnail/subjectImage/referenceImages`, `refine_thumbnail.sourceThumbnail/subjectImage/mask`, `voiceover_clone.audioBase64`, `generate_video.startFrameB64/endFrameB64`), add the field trio from Conventions (`<name>InputType` URL/Binary, `<name>` for URL, `<name>BinaryProperty` for Binary). In `execute`, resolve each via `resolveBinaryOrUrl(ctx, i, inputType, value, binaryProp, asDataUri)` (audio uses `asDataUri:false` → raw base64 for `audioBase64`; images pass through as the server expects — default `false`, switch to data-URI only if the live probe in Task 15 shows it's required).

- [ ] **Step 2:** Add to the async operations (`generate_video`, `generate_clips`, `compose`, and any tool the live probe shows returns an `mcpJobId`) two fields: `waitForCompletion`(boolean, default `false`, "Whether to wait for the render job to finish before continuing") and `maxWaitSeconds`(number, default `300`, shown when `waitForCompletion` is true).

- [ ] **Step 3:** Add a shared post-call wrapper in `resources/studio/execute.ts`:
```ts
import { findJobId, pollJob } from '../../helpers/jobs';

async function maybeWaitForJob(ctx: IExecuteFunctions, i: number, result: IDataObject): Promise<IDataObject> {
  const wait = ctx.getNodeParameter('waitForCompletion', i, false) as boolean;
  const jobId = findJobId(result);
  if (!wait || !jobId) return result;
  const maxWait = ctx.getNodeParameter('maxWaitSeconds', i, 300) as number;
  const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
  const poll = (id: string) => vidiqToolCall(ctx, 'vidiq_job_poll', { mcpJobId: id });
  return pollJob(jobId, poll, sleep, maxWait);
}
```
and route async operations' results through it: `return maybeWaitForJob(ctx, i, await vidiqToolCall(ctx, tool, args));`

- [ ] **Step 4:** Add `test/studio.test.ts`: (a) arg-mapping for `score_title`; (b) `maybeWaitForJob` returns immediately when `waitForCompletion` is false; (c) when true with a job id, it polls `vidiq_job_poll` (mock transport) until terminal. Use the transport mock pattern from `test/keyword.test.ts`.

- [ ] **Step 5:** `npm test && npm run build`; commit `feat: async job polling and binary I/O for Studio`.

---

## Task 14: README + final docs

**Files:** rewrite `README.md`

- [ ] **Step 1:** Author `README.md` with: badges/title; **"Unofficial — not affiliated with vidIQ"** disclaimer; **Requires a vidIQ Max plan**; **credit-consumption warning** (generative Studio ops spend vidIQ credits — link the Account → Get Credit Balance op); Install (n8n Community Nodes: `n8n-nodes-vidiq`); **Credentials** section (how to get the API key, `#credentials` anchor used by the credential `documentationUrl`); the full Resource/Operation table (from spec §4); notes on async `Wait for Completion`, binary inputs, and the `Extra Arguments (JSON)` escape hatch; link to the design spec.

- [ ] **Step 2:** Verify the `#credentials` anchor exists (matches `documentationUrl`).

- [ ] **Step 3:** Commit `docs: README with resources, credits, async & auth notes`.

---

## Task 15: Live verification + lint/build green

**Files:** create `test/smoke.ts`

- [ ] **Step 1:** Write `test/smoke.ts` — a gated script (reads `process.env.VIDIQ_API_KEY`; exits 0 with a message if unset) that POSTs `tools/call` directly (via `node:https` or `fetch`) for **read-only** tools `vidiq_balance`, `vidiq_keyword_research` (`{keyword:"minecraft",limit:3}`), `vidiq_channel_stats` (a known channelId), parses the SSE, and prints the `structuredContent`. It must **never** call generative/credit-spending tools.

- [ ] **Step 2:** Run it against the live server:
Run: `VIDIQ_API_KEY=<the key> npm run smoke`
Expected: prints balance + keyword + channel results with no errors (confirms transport, auth header, SSE parsing, structuredContent end-to-end).

- [ ] **Step 3:** Confirm the per-tool field lists match reality: for any tool whose `tools/call` returns an `isError` validation message during smoke/manual spot-checks, fix the offending field name/type to match `docs/reference/vidiq-mcp-tools.json`.

- [ ] **Step 4:** Full gates:
Run: `npm run lint` → Expected: clean (fix any verification-rule findings: alphabetical options, boolean "Whether" descriptions, `limit` shape, missing `description`s).
Run: `npm test` → Expected: all suites pass.
Run: `npm run build` → Expected: builds `dist/` clean.

- [ ] **Step 5:** Commit `test: live smoke script; lint/build/test green`.

---

## Task 16: CI workflow + push to GitHub

**Files:** create `.github/workflows/publish.yml`

- [ ] **Step 1:** Write `.github/workflows/publish.yml` (verbatim from the known-good TheFamousHesham template):

```yaml
name: Publish to npm

# Fires when a tag like `v0.1.0` is pushed.
# Publishes with npm provenance (required for n8n verification).
on:
  push:
    tags:
      - 'v*'

permissions:
  contents: read
  id-token: write   # Needed for npm provenance via OIDC

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: npm install

      - name: Lint (strict mode — n8n verification rules)
        run: npm run lint

      - name: Build
        run: npm run build

      - name: Verify tag matches package version
        run: |
          TAG="${GITHUB_REF_NAME#v}"
          PKG_VERSION="$(node -p "require('./package.json').version")"
          if [ "$TAG" != "$PKG_VERSION" ]; then
            echo "Tag v$TAG does not match package version $PKG_VERSION"
            exit 1
          fi

      - name: Publish to npm with provenance
        run: npm publish --provenance --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
          RELEASE_MODE: '1'   # Allow @n8n/node-cli prerelease hook to pass
```

- [ ] **Step 2:** Commit `ci: npm publish workflow with provenance`.

- [ ] **Step 3:** Create the GitHub repo and push (requires `gh` auth):
```bash
cd /home/cc/n8n-nodes-vidiq
gh repo create TheFamousHesham/n8n-nodes-vidiq --public --source=. --remote=origin --description "Unofficial n8n community node for vidIQ (YouTube/Instagram intelligence + AI content tools)"
git push -u origin main
```
Expected: repo created, `main` pushed. (Publishing to npm is a separate, user-initiated step: bump version, tag `vX.Y.Z`, push tag → CI publishes. The `NPM_TOKEN` secret must be set on the repo first.)

---

## Self-review notes (author)

- **Spec coverage:** all 43 tools mapped (Tasks 10, 11.1–11.7); transport/SSE/isError/credential-test (Tasks 3, 5, 8, 9); async jobs (Task 6, 13); binary (Task 7, 13); wide tools (Task 12); error handling/continueOnFail (Tasks 5, 8, 10); testing offline + live smoke (Tasks 3–8, 13, 15); CI/README/compliance (Tasks 1, 14, 16).
- **Verification gates:** `npm run lint` is the n8n-verification ruleset; it runs in every resource task and in Task 15, plus in CI.
- **Known lint adjustment points to expect:** alphabetical `options`/`Resource` ordering, boolean descriptions starting with "Whether", the `limit` field canonical shape, every field needing a `description`. Fix iteratively where `npm run lint` reports them.
- **Open items resolved at implementation time via Task 15 live probe:** exact set of async (`mcpJobId`-returning) tools; whether image binary inputs need raw base64 vs data-URI.
