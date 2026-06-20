import {
  NodeApiError,
  type IDataObject,
  type IExecuteFunctions,
  type ILoadOptionsFunctions,
  type JsonObject,
} from "n8n-workflow";
import { parseSse } from "./sse";
import { mcpToolError } from "./errors";

export const VIDIQ_MCP_ENDPOINT = "https://mcp.vidiq.com/mcp";

/** Default request timeout (ms) so a stalled call fails fast instead of hanging. */
export const DEFAULT_TIMEOUT_MS = 60000;

type Ctx = IExecuteFunctions | ILoadOptionsFunctions;

/** A binary content block (audio/image) returned by some tools alongside JSON. */
export interface MediaBlock {
  type: string;
  data: string; // base64
  mimeType: string;
}

export interface ToolCallResult {
  json: IDataObject;
  media: MediaBlock[];
}

/** POST a JSON-RPC tools/call and return both the structured JSON and any media blocks. */
export async function vidiqToolCallFull(
  ctx: Ctx,
  toolName: string,
  args: IDataObject,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<ToolCallResult> {
  const body = JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: { name: toolName, arguments: args },
  });

  let raw: unknown;
  try {
    raw = await ctx.helpers.httpRequestWithAuthentication.call(
      ctx,
      "vidIqApi",
      {
        method: "POST",
        url: VIDIQ_MCP_ENDPOINT,
        body,
        json: false, // we need the raw SSE text; Accept header comes from the credential
        headers: { "Content-Type": "application/json" },
        timeout: timeoutMs,
      },
    );
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

  const content = (result.content ?? []) as Array<{
    type: string;
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  const media: MediaBlock[] = content
    .filter(
      (c) =>
        (c.type === "audio" || c.type === "image") &&
        typeof c.data === "string",
    )
    .map((c) => ({
      type: c.type,
      data: c.data as string,
      mimeType: c.mimeType ?? "application/octet-stream",
    }));

  const structured = result.structuredContent as IDataObject | undefined;
  if (structured !== undefined) return { json: structured, media };

  const text = content.find((c) => typeof c.text === "string")?.text;
  if (typeof text === "string") {
    try {
      return { json: JSON.parse(text) as IDataObject, media };
    } catch {
      return { json: { text }, media };
    }
  }
  return { json: result, media };
}

/** Convenience: most operations only need the JSON result. */
export async function vidiqToolCall(
  ctx: Ctx,
  toolName: string,
  args: IDataObject,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<IDataObject> {
  return (await vidiqToolCallFull(ctx, toolName, args, timeoutMs)).json;
}
