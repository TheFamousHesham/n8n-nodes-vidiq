// Live smoke test — gated on VIDIQ_API_KEY. Read-only tools only; never runs in CI.
// Drives the REAL built transport (dist) against https://mcp.vidiq.com/mcp through a
// fake n8n ctx whose httpRequestWithAuthentication injects auth exactly like the
// VidIqApi credential, so this verifies SSE parsing + structuredContent end to end.
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { vidiqToolCall } = require("../dist/nodes/VidIq/transport/mcpClient.js");

const KEY = process.env.VIDIQ_API_KEY;
if (!KEY) {
  console.log("VIDIQ_API_KEY not set — skipping live smoke test.");
  process.exit(0);
}

const ctx = {
  getNode: () => ({ name: "smoke", type: "vidIq" }),
  helpers: {
    httpRequestWithAuthentication: async (_cred, opts) => {
      const res = await fetch(opts.url, {
        method: opts.method,
        headers: {
          Authorization: `Bearer ${KEY}`,
          Accept: "application/json, text/event-stream",
          "Content-Type": "application/json",
        },
        body: opts.body,
      });
      const text = await res.text();
      if (!res.ok) {
        const err = new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
        err.statusCode = res.status;
        throw err;
      }
      return text;
    },
  },
};

async function run(tool, args) {
  const out = await vidiqToolCall(ctx, tool, args);
  console.log(`\n=== ${tool} ===`);
  console.log(JSON.stringify(out, null, 2).slice(0, 500));
}

await run("vidiq_balance", {});
await run("vidiq_trend_categories", {});
await run("vidiq_keyword_research", { keyword: "minecraft", limit: 3 });
await run("vidiq_user_channels", {});
console.log("\n✅ Live smoke test passed — real transport + SSE + structuredContent OK.");
