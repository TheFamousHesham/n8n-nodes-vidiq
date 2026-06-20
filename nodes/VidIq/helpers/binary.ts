import { type IExecuteFunctions } from "n8n-workflow";

export type BinaryInputType = "url" | "binary";

/** Resolve a value that may be a URL/string or an n8n binary property to send to vidIQ. */
export async function resolveBinaryOrUrl(
  ctx: IExecuteFunctions,
  itemIndex: number,
  inputType: BinaryInputType,
  value: string,
  binaryProperty: string,
  asDataUri = false,
): Promise<string> {
  if (inputType === "url") return value;
  const buffer = await ctx.helpers.getBinaryDataBuffer(
    itemIndex,
    binaryProperty,
  );
  const base64 = buffer.toString("base64");
  if (asDataUri) {
    const meta = ctx.helpers.assertBinaryData(itemIndex, binaryProperty);
    return `data:${meta.mimeType};base64,${base64}`;
  }
  return base64;
}
