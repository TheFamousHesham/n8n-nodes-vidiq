import { NodeOperationError, type IDataObject, type INode } from "n8n-workflow";

/** vidIQ tool failures arrive as HTTP 200 with result.isError and text in content[].text. */
export function extractErrorText(result: IDataObject): string {
  const content = result.content as
    | Array<{ type: string; text?: string }>
    | undefined;
  const text = content?.find((c) => typeof c.text === "string")?.text;
  return text ?? "vidIQ returned an error with no message";
}

export function isCreditError(message: string): boolean {
  return /credit|insufficient|quota|not enough|balance/i.test(message);
}

export function mcpToolError(
  node: INode,
  toolName: string,
  result: IDataObject,
): NodeOperationError {
  const raw = extractErrorText(result);
  const description = isCreditError(raw)
    ? "vidIQ credits may be exhausted — check Account → Get Credit Balance."
    : undefined;
  return new NodeOperationError(
    node,
    `vidIQ tool "${toolName}" failed: ${raw}`,
    { description },
  );
}
