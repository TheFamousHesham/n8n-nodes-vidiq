// n8n-nodes-vidiq — typed n8n operations over vidIQ's MCP API.
// Speaks MCP tools/call via n8n http helpers only (no fs, no fetch, no runtime deps).

import {
  NodeConnectionTypes,
  NodeOperationError,
  type IDataObject,
  type IExecuteFunctions,
  type ILoadOptionsFunctions,
  type INodeExecutionData,
  type INodePropertyOptions,
  type INodeType,
  type INodeTypeDescription,
} from "n8n-workflow";

import { vidiqToolCall } from "./transport/mcpClient";

import { accountDescription } from "./resources/account/Account.description";
import { accountExecute } from "./resources/account/execute";
import { channelDescription } from "./resources/channel/Channel.description";
import { channelExecute } from "./resources/channel/execute";
import { instagramDescription } from "./resources/instagram/Instagram.description";
import { instagramExecute } from "./resources/instagram/execute";
import { jobDescription } from "./resources/job/Job.description";
import { jobExecute } from "./resources/job/execute";
import { keywordDescription } from "./resources/keyword/Keyword.description";
import { keywordExecute } from "./resources/keyword/execute";
import { studioDescription } from "./resources/studio/Studio.description";
import { studioExecute } from "./resources/studio/execute";
import { trendDescription } from "./resources/trend/Trend.description";
import { trendExecute } from "./resources/trend/execute";
import { videoDescription } from "./resources/video/Video.description";
import { videoExecute } from "./resources/video/execute";

type ResourceExecute = (
  ctx: IExecuteFunctions,
  operation: string,
  itemIndex: number,
) => Promise<IDataObject | IDataObject[] | INodeExecutionData[]>;

const executors: Record<string, ResourceExecute> = {
  account: accountExecute,
  channel: channelExecute,
  instagram: instagramExecute,
  job: jobExecute,
  keyword: keywordExecute,
  studio: studioExecute,
  trend: trendExecute,
  video: videoExecute,
};

export class VidIq implements INodeType {
  description: INodeTypeDescription = {
    displayName: "VidIQ",
    name: "vidIq",
    icon: "file:vidiq.svg",
    group: ["transform"],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description:
      "YouTube & Instagram intelligence and AI content tools via vidIQ",
    defaults: { name: "VidIQ" },
    inputs: [NodeConnectionTypes.Main],
    outputs: [NodeConnectionTypes.Main],
    usableAsTool: true,
    credentials: [{ name: "vidIqApi", required: true }],
    properties: [
      {
        displayName: "Resource",
        name: "resource",
        type: "options",
        noDataExpression: true,
        // Alphabetical order required by n8n verification
        options: [
          { name: "Account", value: "account" },
          { name: "Channel", value: "channel" },
          { name: "Instagram", value: "instagram" },
          { name: "Job", value: "job" },
          { name: "Keyword", value: "keyword" },
          { name: "Studio & AI", value: "studio" },
          { name: "Trend", value: "trend" },
          { name: "Video", value: "video" },
        ],
        default: "keyword",
      },
      ...accountDescription,
      ...channelDescription,
      ...instagramDescription,
      ...jobDescription,
      ...keywordDescription,
      ...studioDescription,
      ...trendDescription,
      ...videoDescription,
    ],
  };

  methods = {
    loadOptions: {
      // Populates the Channel ID dropdown for owner-only operations (e.g. Analytics)
      // from the vidIQ-authorized channels, labelled with their titles.
      async getMyChannels(
        this: ILoadOptionsFunctions,
      ): Promise<INodePropertyOptions[]> {
        const res = await vidiqToolCall(this, "vidiq_user_channels", {});
        const channels = (res.channels as IDataObject[] | undefined) ?? [];
        const ids = channels
          .map((c) => c.channelId as string)
          .filter((id) => typeof id === "string" && id.length > 0);
        if (ids.length === 0) return [];
        const titles: Record<string, string> = {};
        try {
          const detail = await vidiqToolCall(
            this,
            "vidiq_get_channels_by_ids",
            {
              channelIds: ids,
            },
          );
          for (const c of (detail.channels as IDataObject[] | undefined) ??
            []) {
            const id = (c.channelId ?? c.id) as string;
            const title = (c.title ?? c.channelTitle ?? id) as string;
            if (id) titles[id] = title;
          }
        } catch {
          // Fall back to raw channel IDs as labels.
        }
        return ids.map((id) => ({ name: titles[id] ?? id, value: id }));
      },
    },
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const out: INodeExecutionData[] = [];
    const resource = this.getNodeParameter("resource", 0) as string;
    const exec = executors[resource];

    for (let i = 0; i < items.length; i++) {
      try {
        if (!exec) {
          throw new NodeOperationError(
            this.getNode(),
            `Unsupported resource: ${resource}`,
            {
              itemIndex: i,
            },
          );
        }
        const operation = this.getNodeParameter("operation", i) as string;
        const result = await exec(this, operation, i);
        const rows = Array.isArray(result) ? result : [result];
        for (const row of rows) {
          // A resource may return a ready INodeExecutionData (e.g. with binary);
          // otherwise wrap the plain JSON object.
          if (row && typeof row === "object" && "binary" in row) {
            const item = row as INodeExecutionData;
            if (!item.pairedItem) item.pairedItem = { item: i };
            out.push(item);
          } else {
            out.push({ json: row as IDataObject, pairedItem: { item: i } });
          }
        }
      } catch (error) {
        if (this.continueOnFail()) {
          out.push({
            json: { error: (error as Error).message },
            pairedItem: { item: i },
          });
          continue;
        }
        throw new NodeOperationError(this.getNode(), error as Error, {
          itemIndex: i,
        });
      }
    }
    return [out];
  }
}
