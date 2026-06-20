import { type IDataObject } from "n8n-workflow";

/**
 * vidIQ's MCP server replies with a Server-Sent-Events frame:
 *   event: message\n
 *   data: {json}\n\n
 * We issue a single request and read back a single JSON-RPC message.
 * Per the SSE spec, multiple `data:` lines in one event concatenate (here joined
 * directly, since the JSON payload contains no internal newlines).
 */
export function parseSse(raw: unknown): IDataObject {
  if (raw !== null && typeof raw === "object") {
    return raw as IDataObject;
  }
  if (typeof raw !== "string") {
    throw new Error(`vidIQ: unexpected response type ${typeof raw}`);
  }
  const trimmed = raw.trim();
  if (trimmed.startsWith("{")) {
    return JSON.parse(trimmed) as IDataObject;
  }
  const dataLines = trimmed
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice("data:".length).trimStart());
  if (dataLines.length === 0) {
    throw new Error(
      `vidIQ: no SSE data frame in response: ${trimmed.slice(0, 200)}`,
    );
  }
  return JSON.parse(dataLines.join("")) as IDataObject;
}
