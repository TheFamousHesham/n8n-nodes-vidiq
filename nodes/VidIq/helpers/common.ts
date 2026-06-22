import {
  type IDataObject,
  type IExecuteFunctions,
  type INodeProperties,
} from "n8n-workflow";
import { DEFAULT_TIMEOUT_MS } from "../transport/mcpClient";

/** The shared "Options" collection (Timeout) shown for every operation of a resource. */
export function optionsField(resource: string): INodeProperties {
  return {
    displayName: "Options",
    name: "options",
    type: "collection",
    placeholder: "Add option",
    default: {},
    displayOptions: { show: { resource: [resource] } },
    options: [
      {
        displayName: "Timeout",
        name: "timeout",
        type: "number",
        typeOptions: { minValue: 1000 },
        default: DEFAULT_TIMEOUT_MS,
        description:
          "Max time in milliseconds to wait for vidIQ before the request fails (prevents a stalled request from hanging)",
      },
    ],
  };
}

/** Read the per-operation timeout (ms) from the Options collection, with a sane default. */
export function readTimeout(ctx: IExecuteFunctions, i: number): number {
  const options = ctx.getNodeParameter("options", i, {}) as IDataObject;
  const t = options.timeout as number | undefined;
  return typeof t === "number" && t >= 1000 ? t : DEFAULT_TIMEOUT_MS;
}
