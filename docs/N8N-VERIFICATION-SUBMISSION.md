# n8n Verified Community Node — Submission: `n8n-nodes-vidiq`

Prepared for the n8n community-node **verification** review (the list of eligible nodes shown in
n8n Cloud / Desktop without manual install). Submit via n8n's current process — see
<https://docs.n8n.io/integrations/creating-nodes/deploy/submit-community-nodes/>. The fields below
map 1:1 to what a reviewer needs.

---

## 1. Package at a glance

| Field | Value |
|---|---|
| npm package | **`n8n-nodes-vidiq`** |
| Version | `0.1.0` (published with **npm provenance**) |
| npm | https://www.npmjs.com/package/n8n-nodes-vidiq |
| Repository | https://github.com/TheFamousHesham/n8n-nodes-vidiq |
| Author | Hesham · hesham@betterbrainlab.org |
| License | MIT |
| Node type | Single regular (action) node `VidIQ` + one credential `VidIQ API` |
| Categories | Marketing, Analytics |
| Runtime dependencies | **None** (only `n8n-workflow` peer) |
| Built with | `@n8n/node-cli` in **strict** mode (`n8nNodesApiVersion: 1`, `strict: true`) |

## 2. What it does

vidIQ (YouTube/Instagram growth platform, ~20M creators) exposes **no public REST API** — its only
supported, API-key-authenticated programmatic surface is its **MCP server**
(`https://mcp.vidiq.com/mcp`). This node speaks that protocol internally and presents **clean, typed
n8n operations** — users never see MCP.

**8 resources, 43 operations:**

- **Keyword** — Research
- **Trend** — Trending Videos, Video Outliers, Categories
- **Channel** — Stats, Search, Get by IDs, Videos, Performance Trends, Analytics, Find Similar, Find
  Breakout, My Channels, List/Update Competitors
- **Video** — Get by IDs, Search YouTube, Stats History, Transcript, Comments, Analyze
- **Studio** (AI, credit-consuming) — Score/Generate Title & Thumbnail, Refine Thumbnail, Generate
  Video/Clips, Compose, Find B-Roll, Voiceover (list/generate/clone)
- **Instagram** — Profile, Profile Reels, Outlier Reels, Accounts From Outliers, Analyze Reel
- **Account** — Credit Balance, Submit Feedback
- **Job** — Get Job Status, List Jobs (poll async renders)

**Uniqueness:** there is no existing (verified or community) n8n node for vidIQ; this adds a new,
widely-requested integration rather than duplicating one. It is also exposed as an AI tool
(`usableAsTool: true`).

## 3. Verification compliance checklist

| Requirement | Status | Evidence |
|---|---|---|
| Name starts with `n8n-nodes-` | ✅ | `package.json` name `n8n-nodes-vidiq` |
| Keyword `n8n-community-node-package` | ✅ | `package.json` keywords |
| **Zero runtime dependencies** | ✅ | `package.json` has no `dependencies`; only `n8n-workflow` peer. SSE parsing/auth/JSON hand-rolled |
| Passes n8n strict lint | ✅ | `npm run lint` → exit 0 (the `@n8n/community-nodes` + `n8n-nodes-base` rule sets) |
| TypeScript builds | ✅ | `npm run build` → `dist/` |
| Credential with a working test | ✅ | `VidIqApi` `test` calls `vidiq_balance`; invalid key → HTTP 401 → credential marked invalid (verified live) |
| Cloud-safe runtime | ✅ | All HTTP via `this.helpers.httpRequestWithAuthentication`; no `fs`/`child_process`/`eval`/global timers; no in-node blocking waits (async renders return a job to poll) |
| Single fixed external endpoint | ✅ | Only POSTs to `https://mcp.vidiq.com/mcp`; no user-supplied URL is ever fetched (no SSRF) |
| `continueOnFail` + `pairedItem` | ✅ | `VidIq.node.ts` execute loop |
| Permissive license | ✅ | MIT |
| Published to npm (provenance) | ✅ | `0.1.0`, provenance attestation present |
| Semantic versioning | ✅ | `0.1.0`; tag-driven CI release |
| Documentation | ✅ | README (install, credentials, full operation table, credit/async/binary notes, disclaimer) |
| Icon | ✅ | `vidiq.svg` on node + credential |
| No telemetry/tracking added | ✅ | node makes only the vidIQ tool call |
| Trademark care | ✅ | README states "unofficial, not affiliated with vidIQ" |

## 4. Quality & security evidence

- **Unit tests:** 25 (vitest) covering SSE parsing, argument building, error mapping, binary I/O,
  transport.
- **Live E2E:** all 25 non-generative tools exercised against the real vidIQ MCP server — every
  argument mapping accepted, correct `structuredContent` returned (generative tools skipped to
  avoid spending credits).
- **Security & quality audit:** multi-reviewer audit (security, compliance, correctness) with
  adversarial verification — **PASS, no security issues** (no prototype pollution, JSON-RPC
  injection, SSRF, ReDoS, or credential leakage). Full report: `docs/AUDIT-2026-06-20.md`.
- **CI:** GitHub Actions runs lint + build + test on every push/PR; tag pushes publish with
  provenance.

## 5. Notes for the reviewer (testing the node)

- Testing requires a **vidIQ "Max" plan** API key (the API surface is Max-only). The key is sent as
  `Authorization: Bearer <key>`.
- **Read/analytics** operations are cheap; **Studio** generative operations **consume vidIQ
  credits** (surfaced in each operation's description and in the README). `Account → Get Credit
  Balance` reports remaining credits.
- Async render tools (`Generate Video/Clips`, `Compose`, etc.) return a job with `mcpJobId`; poll
  with `Job → Get Job Status` (n8n Cloud disallows in-node blocking waits, so the node does not poll
  internally).

## 6. Reviewer quick-start

```bash
git clone https://github.com/TheFamousHesham/n8n-nodes-vidiq && cd n8n-nodes-vidiq
npm install
npm run lint    # exit 0 (strict n8n ruleset)
npm run build   # dist/
npm test        # 25 passing
VIDIQ_API_KEY=vidiq_... npm run smoke   # optional live read-only check
```

## 7. Maintenance

Actively maintained by the author. Issues/PRs via the GitHub repo. The vidIQ tool surface is loaded
from a versioned catalog snapshot (`docs/reference/vidiq-mcp-tools.json`); new vidIQ tools are also
reachable immediately via each operation's **Extra Arguments (JSON)** escape hatch pending a typed
release.
