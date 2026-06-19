# n8n-nodes-vidiq — Design Spec

**Date:** 2026-06-19
**Author:** Hesham (hesham@betterbrainlab.org)
**Status:** Approved (design) — ready for implementation planning
**Repo:** https://github.com/TheFamousHesham/n8n-nodes-vidiq

---

## 1. Purpose & summary

A community n8n node that wraps **vidIQ's API** so n8n workflows can run YouTube/Instagram
intelligence and vidIQ's AI content tools.

vidIQ exposes **no traditional public REST API**. Its only documented, supported,
API-key-authenticated programmatic surface is its **MCP server** at
`https://mcp.vidiq.com/mcp` (MCP Streamable HTTP transport). This node therefore speaks
MCP JSON-RPC (`tools/call`) under the hood but presents the user **clean, typed n8n
operations** — the user never sees MCP.

- **Node type:** single regular **action node** (router pattern), no trigger.
- **Coverage (v1.0):** **all 43 tools** the live server exposes, organized into 8 resources.
- **Auth:** single API key → `Authorization: Bearer <key>`.
- **Plan requirement:** vidIQ "Max" plan; **operations consume vidIQ credits** (must be surfaced).

### Ground truth (verified against the live server 2026-06-19)

- Transport is **stateless**: `tools/call` succeeds with only the Bearer token — **no
  `initialize` handshake or session ID required** (confirmed: a cold `tools/call` returned data).
- The server **requires** `Accept: application/json, text/event-stream`. Sending only
  `application/json` → **HTTP 406** `{"error":{"code":-32000,"message":"Not Acceptable: ..."}}`.
- Responses are **SSE-framed**: `event: message\ndata: {json}\n\n`.
- A successful `tools/call` returns `result.structuredContent` (already-parsed typed object)
  **and** `result.content[0].text` (a JSON string with the same data).
- **Tool-level errors are returned as HTTP 200** with `result.isError === true` and the message
  in `result.content[0].text` (e.g. `"MCP error -32602: Input validation error: ..."`,
  `"MCP error -32602: Tool X not found"`). The node MUST inspect `isError`, not just HTTP status.
- **Bad key → HTTP 401** (used by the credential test).
- Credit balance is read via `vidiq_balance` (returns `totalCredits`, `renewableCredits`,
  `renewableResetsAt`, `addOnCredits`, and a per-call `_credits.used`).

---

## 2. Package & n8n compliance

| Item | Value |
|---|---|
| npm name | `n8n-nodes-vidiq` (mandatory `n8n-nodes-*` convention) |
| keywords | include `n8n-community-node-package`, plus `n8n`, `vidiq`, `youtube`, `seo`, `analytics`, `mcp` |
| license | MIT |
| repo / homepage / bugs | `github.com/TheFamousHesham/n8n-nodes-vidiq` |
| build tooling | `@n8n/node-cli` (`n8n-node build` / `lint` / `release` / `prerelease`) |
| `n8n.n8nNodesApiVersion` | `1` |
| `n8n.strict` | `true` |
| runtime deps | **none** (only `n8n-workflow` peer; SSE parsing is hand-rolled) — required for verified eligibility |
| node id (codex) | `n8n-nodes-vidiq.vidIq` (community prefix — NOT `n8n-nodes-base.*`) |
| credential name | `vidIqApi` |
| node `name` / `displayName` | `vidIq` / `VidIQ` |
| node `group` | `['transform']` |
| codex `categories` | `Marketing`, `Analytics` |
| icon | `vidiq.svg` (node + credential) |

**Compliance guardrails (must hold to pass `n8n-node lint` + verified review):**

- No runtime npm dependencies; only `n8n-workflow` (peer) + Node built-ins.
- No `console.log`, `eval`, `child_process`, `fs`, or direct network outside the transport helper.
- All HTTP via `this.helpers.httpRequestWithAuthentication` (so the credential's `authenticate`
  block is applied and the key is never logged).
- Credential has a `test` request and a `documentationUrl`.
- Every operation field has a `description`; node has a `subtitle`.
- `continueOnFail()` honored; outputs carry `pairedItem`.
- README includes an **"unofficial / not affiliated with vidIQ"** disclaimer (trademark safety),
  the Max-plan requirement, and a **credit-consumption warning** for generative operations.

---

## 3. Architecture — shared engine + modular router

n8n's router pattern (as used by large built-in nodes like HubSpot/Notion) keeps each file small
and independently reviewable. No single mega-file.

```
n8n-nodes-vidiq/
  nodes/VidIq/
    VidIq.node.ts             # INodeType: assembles `properties` from resource descriptions;
                              #   execute() routes (resource, operation) -> resource execute()
    VidIq.node.json           # codex metadata (categories, docs URLs)
    vidiq.svg
    transport/
      mcpClient.ts            # vidiqToolCall(ctx, toolName, args, opts) — the ONE network path
      sse.ts                  # parseSse(raw) -> first JSON-RPC message object
      errors.ts              # mapMcpError(): isError / JSON-RPC error -> NodeOperationError|NodeApiError
    helpers/
      args.ts                # buildArgs(): collect typed params -> arguments object, omitting empties;
                              #   coercions (CSV string -> array, number/boolean casts, enum passthrough)
      binary.ts              # n8n binary <-> base64 (string-or-binaryProperty inputs; optional URL download outputs)
      jobs.ts                # isJobResponse(); pollJob() (backoff until completed/failed/expired or maxWait)
    resources/
      keyword/    { Keyword.description.ts,   execute.ts }
      trend/      { Trend.description.ts,      execute.ts }
      channel/    { Channel.description.ts,    execute.ts }
      video/      { Video.description.ts,      execute.ts }
      studio/     { Studio.description.ts,     execute.ts }
      instagram/  { Instagram.description.ts,  execute.ts }
      account/    { Account.description.ts,    execute.ts }
      job/        { Job.description.ts,        execute.ts }
  credentials/
    VidIqApi.credentials.ts
    vidiq.svg
  test/                      # offline unit tests (mocked transport) + gated live smoke script
  docs/                      # this spec + tool catalog reference
  .github/workflows/publish.yml
  package.json  tsconfig.json  eslint.config.mjs  README.md  CHANGELOG.md  LICENSE  .gitignore
```

**Per-operation shape (the repeated, thin pattern):**
1. `description.ts` declares the operation option + its typed fields (with `displayOptions` scoped
   to `resource`+`operation`).
2. `execute.ts` reads params for the item, calls `buildArgs()` to assemble the MCP `arguments`,
   calls `vidiqToolCall(this, '<tool>', args)`, and returns `structuredContent`.
All complexity lives once in `transport/` + `helpers/`; the 43 operations are thin mappers.

### 3.1 Transport contract (`vidiqToolCall`)

```
vidiqToolCall(ctx, toolName, args, { waitForJob?, maxWaitSec? }) -> Promise<JsonObject | JsonObject[]>
```
- POST `https://mcp.vidiq.com/mcp` via `httpRequestWithAuthentication('vidIqApi', …)` with body
  `{ "jsonrpc":"2.0", "id":1, "method":"tools/call", "params":{ "name":toolName, "arguments":args } }`.
- Request `json: false` (we need the raw SSE text); set `Accept: application/json, text/event-stream`
  in the credential `authenticate` block.
- `parseSse(raw)` extracts the `data:` JSON. If top-level `error` present → throw via `errors.ts`.
- If `result.isError === true` → throw via `errors.ts` (parse the `MCP error -NNN: …` text).
- Else return `result.structuredContent` when present, else `JSON.parse(result.content[0].text)`.
- If `waitForJob` and the result is a job (see `jobs.ts`) → poll and return the final result.

### 3.2 Credential (`VidIqApi.credentials.ts`)

- Field: `apiKey` (string, `typeOptions.password: true`, required), placeholder `vidiq_...`.
- `documentationUrl` → README#credentials. `icon: 'file:vidiq.svg'`.
- `authenticate: IAuthenticateGeneric`:
  ```
  headers: {
    Authorization: '=Bearer {{$credentials.apiKey}}',
    Accept: 'application/json, text/event-stream',
    'Content-Type': 'application/json',
  }
  ```
- `test: ICredentialTestRequest`:
  ```
  request: {
    baseURL: 'https://mcp.vidiq.com',
    url: '/mcp',
    method: 'POST',
    body: { jsonrpc:'2.0', id:1, method:'tools/call', params:{ name:'vidiq_balance', arguments:{} } },
  }
  ```
  Bad key → 401 → n8n marks the credential invalid. (A valid key returns 200; `vidiq_balance`
  never `isError`s for a valid key.)

---

## 4. Resource → operation map (8 resources, all 43 tools)

Display name (n8n) → `vidiq_*` tool. `*` = required arg. Resource/Operation are two dropdowns.

### Keyword (1)
- **Research** → `vidiq_keyword_research` — `mode`(research|country_top|country_search), `keyword`,
  `includeRelated`, `country`, `limit`, `broad`.

### Trend (3)
- **Trending Videos** → `vidiq_trending_videos` — `*videoFormat`(long|short), `titleQuery`,
  `subscriberCountMin/Max`, `viewCountMin`, `vphMin`, `channelCountry`,
  `videoPublishedAfter/Before`, `sortBy`(relevance|vph|viewCount|engagementRate|videoPublishedAt), `limit`.
- **Video Outliers** → `vidiq_outliers` — `keyword`, `channelIds[]`, `contentType`(all|long|short),
  `minOutlierScore`, `minSubscribers`, `maxSubscribers`, `minViews`, `maxViews`, `minVph`,
  `minEngagementRate`, `publishedWithin`(thisWeek|thisMonth|threeMonths|sixMonths|oneYear|allTime),
  `channelCountry`, `trendCategories[]`, `sort`(breakoutScore|publishedAt|viewCount|vph|score), `limit`.
- **Categories** → `vidiq_trend_categories` — (no params).

### Channel (11)
- **Get Stats** → `vidiq_channel_stats` — `*channelId`, `from`, `to`.
- **Search** → `vidiq_channel_search` — `query` + large optional filter set (see §6 strategy:
  core typed fields + "Additional Filters" collection for the growth-range long tail),
  `sort`(relevance|subscriberCount|subsGrowth30d|viewsGrowth30d|lastVideoPublished), `limit`.
- **Get Many by IDs** → `vidiq_get_channels_by_ids` — `*channelIds[]`.
- **Get Videos** → `vidiq_channel_videos` — `*channelId`, `*videoFormat`(long|short|live), `popular`.
- **Performance Trends** → `vidiq_channel_performance_trends` — `*channelId`.
- **Analytics** → `vidiq_channel_analytics` — `*channelId`, `startDate`, `endDate`, `metrics[]`,
  `dimensions[]`, `maxResults`, `filters`, `sort`.
- **Find Similar** → `vidiq_similar_channels` — `*niche`, `minSubscribers`, `maxSubscribers`,
  `country`, `language`, `size`, `excludeChannelIds[]`.
- **Find Breakout** → `vidiq_breakout_channels` — `*query`, `channelType`(long|short|mixed),
  `country`, `subscriberCountMin/Max`, `faceless`, `limit`.
- **Get My Channels** → `vidiq_user_channels` — (no params).
- **List Competitors** → `vidiq_list_competitors` — `*youtubeChannelId`.
- **Update Competitors** → `vidiq_update_competitors` — `*youtubeChannelId`, `follow[]`, `unfollow[]` (**write**).

### Video (6)
- **Get Many by IDs** → `vidiq_get_videos_by_ids` — `*videoIds[]`.
- **Search YouTube** → `vidiq_youtube_search` — `*query`, `type[]`, `order`, `limit`,
  `publishedAfter/Before`, `channelId`, `regionCode`, `topic`(enum), `videoDuration`,
  `videoDefinition`, `eventType`.
- **Stats History** → `vidiq_video_stats` — `*videoId`, `*granularity`(hourly|daily|monthly),
  `from`, `to`, `order`(asc|desc).
- **Transcript** → `vidiq_video_transcript` — `*videoId`, `language`.
- **Comments** → `vidiq_video_comments` — `videoId`, `channelId`, `order`(time|relevance), `maxResult`.
- **Analyze** → `vidiq_video_watch` — `*video`, `prompt`.

### Studio (13) — generative; consume credits; some async (see §5)
- **Score Title** → `vidiq_score_title` — `*title`, `*type`(long|short), `videoId`, `channelId`.
- **Score Thumbnail** → `vidiq_score_thumbnail` — `*videoId`, `*title`, `image` (URL **or binary**).
- **Generate Titles** → `vidiq_generate_titles` — `videoId`, `title`, `description`, `numTitles`,
  `type`(long|short), `language`, `regionCode`, `scoreThreshold`, `previousTitles[]`,
  `competitorTitles`, `analysisSummary`.
- **Generate Thumbnail** → `vidiq_generate_thumbnail` — `videoId`, `title`, `description`,
  `transcript`, `userQuery`, `currentThumbnail`, `subjectImage`, `referenceImages[]`, `feedback`
  (image inputs accept URL **or binary**).
- **Refine Thumbnail** → `vidiq_refine_thumbnail` — `*sourceThumbnail`, `*instructions`,
  `originalConcept`, `videoId`, `subjectImage`, `referenceImages[]`, `mask` (image inputs URL/binary).
- **Generate Video** → `vidiq_generate_video` — `*prompt`, `model`(sora-2|sora-2-pro|veo-3.1|
  veo-3.1-fast|veo-3.1-lite|kling-3|…), `*resolution`(720p|1080p|1024p), `*duration`,
  `aspectRatio`(9:16|16:9), `remixVideoId`, `remixProjectId`, `startFrameB64`, `endFrameB64`
  (frames URL/binary). **Async/job.**
- **Generate Clips** → `vidiq_generate_clips` — `videoUrl`, `uploadedVideoUrl`, `videoDuration`,
  `videoFilename`, `prompt`, `clipDuration`, `videoLanguage`, `imgUrl`, `captionStyle`(enum),
  `processingStartSeconds`, `processingEndSeconds`. **Async/job.**
- **Compose** → `vidiq_compose` — `*scenes[]`, `*format`(vertical|landscape|square), `voiceover`,
  `music`, `overlays[]`, `captions`. **Async/job.**
- **Find B-roll** → `vidiq_generate_broll` — `*query`, `orientation`(landscape|portrait|square),
  `minDurationSeconds`, `maxDurationSeconds`.
- **List Voices** → `vidiq_voiceover_list_voices` — (no params).
- **Generate Voiceover** → `vidiq_voiceover_generate` — `*script`, `*voiceId`,
  `output`(url_only|url_and_audio). Audio output optionally decoded to binary.
- **Clone Voice (upload)** → `vidiq_voiceover_clone` — `*name`, `*audioBase64` (URL/**binary**),
  `contentType`, `description`. **Write.**
- **Clone Voice from YouTube** → `vidiq_voiceover_clone_start` — `*youtubeUrl`, `*name`. Possibly async.

### Instagram (5)
- **Get Profile** → `vidiq_ig_profile` — `*handle`.
- **Profile Reels** → `vidiq_ig_profile_reels` — `*handle`.
- **Find Outlier Reels** → `vidiq_ig_outlier_reels_search` — `*query`, `*audienceQuery`, plus optional
  range filters (`reelMedianScoreMin/Max`, `datePostedAfter/Before`, `viewsMin/Max`,
  `followersMin/Max`, `reelLengthMin/Max`), `descriptionLanguage[]`, `hashtags[]`,
  `excludeShortcodes[]`, `excludeUserPosted[]`, `collapseByUserPosted`, `pageSize`, `page`,
  `embeddingType`(description|concept|hook|format|overall|audience).
- **Accounts from Outliers** → `vidiq_ig_accounts_from_outliers` — `*niche`, `*audienceQuery`,
  `followersMin`, `followersMax`.
- **Analyze Reel** → `vidiq_ig_reel_watch` — `*reel`, `prompt`.

### Account (2)
- **Get Credit Balance** → `vidiq_balance` — (no params).
- **Submit Feedback** → `vidiq_submit_feedback` — `*type`(feature_request|bug_report|improvement|
  general), `tool_name`, `*description`, `use_case` (**write**).

### Job (2) — supports the async render flow
- **List Jobs** → `vidiq_jobs_list` — `toolName`, `status`(inprogress|completed|failed|expired|
  refunded), `limit`.
- **Get Job Status** → `vidiq_job_poll` — `*mcpJobId`.

**Total: 1 + 3 + 11 + 6 + 13 + 5 + 2 + 2 = 43.**

---

## 5. Async jobs & binary I/O

### 5.1 Async jobs
Heavy Studio renders (`generate_video`, `generate_clips`, `compose`, and any tool whose response
carries an `mcpJobId`) are **asynchronous**. Exact set is confirmed at implementation time by
reading each tool's response/description in `docs/reference/vidiq-mcp-tools.json` and a live probe;
detection is **generic** (response contains a job id) so behavior is data-driven, not hard-coded.

UX:
- Each async-capable operation exposes **`Wait for Completion`** (boolean, default **false**).
  - **false** → return the job descriptor immediately (incl. `mcpJobId`). User pairs with the
    **Job → Get Status** operation and/or n8n's **Wait** node for long renders.
  - **true** → `helpers/jobs.pollJob()` polls `vidiq_job_poll` with capped backoff until
    `completed | failed | expired | refunded` or **`Max Wait (s)`** (default 300) is exceeded
    (then throws a timeout `NodeOperationError` that includes the `mcpJobId` so the user can resume).
- Polling sleeps via `await new Promise(r => setTimeout(r, ms))` (allowed; no external dep).
- README documents that multi-minute renders should use the non-blocking Job path + Wait node.

### 5.2 Binary I/O
Tools that take base64 images/audio (`score_thumbnail.image`, `generate_thumbnail.*Image*`,
`refine_thumbnail.sourceThumbnail/subjectImage/referenceImages/mask`, `voiceover_clone.audioBase64`,
`generate_video.startFrameB64/endFrameB64`):
- Each such input offers **`Input Type: URL | Binary Property`**. For Binary, the node reads the
  item's binary buffer via `this.helpers.getBinaryDataBuffer` and base64-encodes it (with the
  correct data-URI/content-type where the tool expects it).
- URL outputs (rendered video/thumbnail/broll/voiceover URLs) are returned in JSON. An optional
  **`Download to Binary`** toggle fetches the URL into an n8n binary property. `output:url_and_audio`
  base64 audio is decoded into a binary attachment when present.
- v1 keeps binary **pragmatic**: support binary **input** for the clone/thumbnail/frame tools and
  optional **download** for URL outputs; everything else returns JSON.

---

## 6. Field strategy for very wide tools

`vidiq_channel_search` (~70 params) and `vidiq_ig_outlier_reels_search` (~25):
- Expose the **high-value fields as typed top-level fields** (query, type, sort, limit, the common
  min/max subscriber & view counts, country/language).
- Put the **long tail** (the per-window growth/duration/count ranges) inside an **`Additional
  Filters` `collection`** so the UI stays clean but everything is reachable.
- Provide a final **`Extra Arguments (JSON)`** escape hatch on every operation: a JSON object that
  future-proofs against new server params without a release, so no capability is ever unreachable.
  **Merge order (least surprising):** Extra Arguments is applied **first as a base**, then the typed
  fields and the Additional-Filters collection are merged on top — so a visible field the user set
  always wins, and Extra Arguments only supplies keys not set via the UI.

---

## 7. Error handling

- **HTTP error** (non-2xx, e.g. 401/406/5xx) → `NodeApiError` with the response attached.
- **JSON-RPC `error`** (top-level) → `NodeApiError` with code+message.
- **`result.isError === true`** (HTTP 200) → `errors.mapMcpError()` parses the
  `MCP error -NNN: <message>` text into a `NodeOperationError` with a human message; validation
  errors include the offending field path.
- **Insufficient credits** → detected from the error text and surfaced with a clear
  "vidIQ credits exhausted — check Account → Get Credit Balance" message.
- **`continueOnFail()`**: on failure, push `{ json: { error: message }, pairedItem }` instead of throwing.
- All outputs set `pairedItem` to the source item index.

---

## 8. Testing

- **Offline unit tests** (deterministic, mocked transport — no network in CI):
  - `sse.parseSse`: single message, multi-line data, `event:`-only frames, malformed input.
  - `helpers/args.buildArgs`: omits empty/undefined, CSV→array, number/boolean coercion,
    enum passthrough, Extra-Arguments merge precedence.
  - `errors.mapMcpError`: `isError` text → typed errors; validation field extraction; credit message.
  - `helpers/jobs`: `isJobResponse` detection; `pollJob` completion, failure, and timeout paths
    (fake timers).
  - `helpers/binary`: base64 encode/decode round-trip; URL vs binary input selection.
- **Gated live smoke script** (`VIDIQ_API_KEY=… npm run smoke`, **never** in CI): exercises a few
  **read-only** tools (`vidiq_balance`, `vidiq_keyword_research`, `vidiq_channel_stats`) against the
  real server to confirm transport + parsing end-to-end.
- `n8n-node lint` must pass clean (this is the verified-node ruleset).

---

## 9. CI / release

- `.github/workflows/publish.yml`: build + `n8n-node lint` on push/PR; publish to npm with
  **provenance** on tag (matching the existing TheFamousHesham packages).
- `package.json`: `prepublishOnly: n8n-node prerelease`, `files: ["dist"]`, scripts
  `build`/`dev`/`lint`/`lint:fix`/`release` via `@n8n/node-cli`.
- `CHANGELOG.md` (Keep a Changelog); README with install, credentials/auth, the resource/operation
  table, credit + Max-plan + async notes, and the unaffiliated disclaimer.

---

## 10. Out of scope (v1.0)

- No trigger node (the API is request/response only; no webhooks/events from vidIQ).
- No caching/rate-limit layer beyond surfacing server errors.
- No streaming of partial render progress beyond job polling.
- Binary handling limited to the inputs/outputs listed in §5.2.

---

## 11. Implementation approach

Workflow-orchestrated (ultracode): (1) build the engine (`transport/`, `helpers/`, credential,
node router skeleton) and verify it live against read-only tools; (2) fan out the 8 resource modules
in parallel (each = description + execute, isolated files); (3) adversarial verification pass —
per tool, confirm the typed fields match the live `inputSchema` and a representative `tools/call`
round-trips; (4) lint/build/test green; (5) README/CHANGELOG; (6) push to GitHub.

Reference: live tool catalog saved at `docs/reference/vidiq-mcp-tools.json` (43 tools, full schemas).
