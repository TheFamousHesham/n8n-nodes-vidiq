# n8n-nodes-vidiq

An [n8n](https://n8n.io) community node for **[vidIQ](https://vidiq.com)** — bring YouTube &
Instagram intelligence and vidIQ's AI content tools into your workflows: keyword research,
video outliers, channel/video analytics, competitor discovery, trend analysis, plus AI title &
thumbnail scoring/generation, voiceover, and video generation.

> **Unofficial.** This is a community-built node and is **not affiliated with, endorsed by, or
> supported by vidIQ**. "vidIQ" is a trademark of its respective owner.

[![npm version](https://img.shields.io/npm/v/n8n-nodes-vidiq.svg)](https://www.npmjs.com/package/n8n-nodes-vidiq)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## How it works

vidIQ does not expose a traditional REST API. Its supported, API-key-authenticated programmatic
surface is its **MCP server** (`https://mcp.vidiq.com/mcp`). This node speaks that protocol for you
and presents clean, typed n8n operations — you never see MCP.

> ⚠️ **Requires a vidIQ "Max" plan.** The API/MCP surface is only available on vidIQ's Max plan.
>
> ⚠️ **Generative operations consume vidIQ credits.** Anything under the **Studio & AI** resource
> (title/thumbnail generation, video, clips, voiceover, b-roll) spends credits. Check your balance
> with **Account → Get Credit Balance** before running them at scale.

## Installation

### n8n Cloud / Desktop (Community Nodes)
**Settings → Community Nodes → Install**, then enter `n8n-nodes-vidiq`.

### Self-hosted (npm)
```bash
npm install n8n-nodes-vidiq
```

## Credentials

1. On a vidIQ **Max** plan, generate an API key (vidIQ → MCP / API access). It looks like
   `vidiq_xxxxxxxxxxxxxxxxxxxxxxxxx`.
2. In n8n, create a **VidIQ API** credential and paste the key. The credential test calls
   `vidiq_balance`; an invalid key returns `401` and the test fails.

The node sends the key as `Authorization: Bearer <key>`.

## Resources & operations (40 operations)

| Resource | Operations |
|---|---|
| **Keyword** | Research |
| **Trend** | Trending Videos · Video Outliers · Categories |
| **Channel** | Get Stats · Search · Get Many by IDs · Get Videos · Get Performance Trends · Analytics · Find Similar · Find Breakout · Get My Channels |
| **Video** | Get Many by IDs · Search YouTube · Stats History · Transcript · Comments · Analyze |
| **Studio & AI** | Score Title · Score Thumbnail · Generate Titles · Generate Thumbnail · Refine Thumbnail · Generate Video · Generate Clips · Compose · Find B-Roll · List Voices · Generate Voiceover · Clone Voice (Upload) · Clone Voice From YouTube |
| **Instagram** | Get Profile · Profile Reels · Find Outlier Reels · Accounts From Outliers · Analyze Reel |
| **Account** | Get Credit Balance |
| **Job** | Get Job Status · List Jobs |

## Notes & patterns

- **IDs over URLs.** `Video ID`, `Reel`, and channel IDs accept a bare ID/shortcode (a full URL also
  works — vidIQ normalizes it), so you won't get errors from a missing `www.` or a trailing slash.
- **Channel Analytics.** The `Channel` field is a dropdown of your vidIQ-linked channels (analytics
  are only available for channels you own). Dates use `YYYY-MM-DD`; metrics is a multi-select.
- **Async renders (Studio & AI).** `Generate Video`, `Generate Clips`, `Compose`, the thumbnail
  generators and `Clone Voice From YouTube` run asynchronously and return a job object containing an
  `mcpJobId`. Poll it with **Job → Get Job Status**. For long renders, loop with n8n's **Wait** node
  + an **IF** node until the status is `completed` (or `failed`/`expired`). (n8n Cloud does not allow
  nodes to block while waiting, so the node does not poll internally.)
- **Binary I/O.** Image/audio inputs (thumbnail scoring/generation, voice cloning, video frames)
  accept a **URL** or an n8n **Binary Property** via each field's *Input Type* selector. `Generate
  Voiceover` with output **URL and Audio** returns the MP3 as a downloadable **binary** attachment.
- **Timeout.** Every operation has an **Options → Timeout (ms)** setting so a stalled request fails
  fast instead of hanging.
- **Credits.** Read/analytics operations are cheap; generative Studio & AI operations cost more (each
  is labelled "Consumes vidIQ credits"). Watch **Account → Get Credit Balance**.
- **Use as an AI tool.** The node is exposed as an n8n AI tool (`usableAsTool`), so an AI Agent can
  call vidIQ operations directly.

## Compatibility

- Built with `@n8n/node-cli` in **strict** mode (verified-node ruleset), zero runtime dependencies.
- Requires n8n with `n8nNodesApiVersion: 1`.

## Development

```bash
npm install
npm run build      # compile to dist/
npm run lint       # n8n strict verification lint
npm test           # offline unit tests (vitest)
VIDIQ_API_KEY=vidiq_... npm run smoke   # optional live read-only smoke test
```

Design notes: [`docs/superpowers/specs/2026-06-19-n8n-nodes-vidiq-design.md`](docs/superpowers/specs/2026-06-19-n8n-nodes-vidiq-design.md).

## License

[MIT](LICENSE)
