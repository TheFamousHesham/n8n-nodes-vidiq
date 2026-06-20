import { type IDataObject } from "n8n-workflow";

/**
 * vidIQ's MCP server replies with a Server-Sent-Events stream:
 *   event: message\n
 *   data: {json}\n\n
 * Parsing is done per-event (events separated by a blank line; the `data:` lines
 * within one event concatenate). If the server ever precedes the response with a
 * keepalive/progress frame, those are skipped and we return the JSON-RPC response
 * frame (the one carrying `result` or `error`).
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
  const frames: IDataObject[] = [];
  for (const event of trimmed.split(/\r?\n\r?\n/)) {
    const data = event
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice("data:".length).trimStart())
      .join("");
    if (data === "") continue;
    try {
      frames.push(JSON.parse(data) as IDataObject);
    } catch {
      // Ignore non-JSON frames (e.g. SSE comments / keepalives).
    }
  }
  const response = frames.find((f) => "result" in f || "error" in f);
  if (response) return response;
  if (frames.length > 0) return frames[frames.length - 1];
  throw new Error(
    `vidIQ: no SSE data frame in response: ${trimmed.slice(0, 200)}`,
  );
}
