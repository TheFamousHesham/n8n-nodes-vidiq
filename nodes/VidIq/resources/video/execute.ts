import {
  NodeOperationError,
  type IDataObject,
  type IExecuteFunctions,
} from "n8n-workflow";
import { buildArgs, toStringArray } from "../../helpers/args";
import { readTimeout } from "../../helpers/common";
import { vidiqToolCall } from "../../transport/mcpClient";

export async function videoExecute(
  ctx: IExecuteFunctions,
  operation: string,
  i: number,
): Promise<IDataObject | IDataObject[]> {
  if (operation === "analyze") {
    const params: IDataObject = {
      video: ctx.getNodeParameter("video", i, "") as string,
      prompt: ctx.getNodeParameter("prompt", i, "") as string,
    };
    return vidiqToolCall(
      ctx,
      "vidiq_video_watch",
      buildArgs(params),
      readTimeout(ctx, i),
    );
  }

  if (operation === "comments") {
    const params: IDataObject = {
      videoId: ctx.getNodeParameter("videoId", i, "") as string,
      channelId: ctx.getNodeParameter("channelId", i, "") as string,
      order: ctx.getNodeParameter("order", i, "relevance") as string,
      maxResult: ctx.getNodeParameter("maxResult", i, 0) as number,
    };
    return vidiqToolCall(
      ctx,
      "vidiq_video_comments",
      buildArgs(params),
      readTimeout(ctx, i),
    );
  }

  if (operation === "getMany") {
    const params: IDataObject = {
      videoIds: toStringArray(ctx.getNodeParameter("videoIds", i, [])),
    };
    return vidiqToolCall(
      ctx,
      "vidiq_get_videos_by_ids",
      buildArgs(params),
      readTimeout(ctx, i),
    );
  }

  if (operation === "searchYoutube") {
    const params: IDataObject = {
      query: ctx.getNodeParameter("query", i, "") as string,
      type: toStringArray(ctx.getNodeParameter("type", i, [])),
      order: ctx.getNodeParameter("order", i, "relevance") as string,
      limit: ctx.getNodeParameter("limit", i, 50) as number,
      publishedAfter: ctx.getNodeParameter("publishedAfter", i, "") as string,
      publishedBefore: ctx.getNodeParameter("publishedBefore", i, "") as string,
      channelId: ctx.getNodeParameter("channelId", i, "") as string,
      regionCode: ctx.getNodeParameter("regionCode", i, "") as string,
      videoDuration: ctx.getNodeParameter("videoDuration", i, "") as string,
      videoDefinition: ctx.getNodeParameter("videoDefinition", i, "") as string,
      eventType: ctx.getNodeParameter("eventType", i, "") as string,
      topic: ctx.getNodeParameter("topic", i, "") as string,
    };
    return vidiqToolCall(
      ctx,
      "vidiq_youtube_search",
      buildArgs(params),
      readTimeout(ctx, i),
    );
  }

  if (operation === "statsHistory") {
    const params: IDataObject = {
      videoId: ctx.getNodeParameter("videoId", i, "") as string,
      granularity: ctx.getNodeParameter("granularity", i, "daily") as string,
      from: ctx.getNodeParameter("from", i, "") as string,
      to: ctx.getNodeParameter("to", i, "") as string,
      order: ctx.getNodeParameter("order", i, "asc") as string,
    };
    return vidiqToolCall(
      ctx,
      "vidiq_video_stats",
      buildArgs(params),
      readTimeout(ctx, i),
    );
  }

  if (operation === "transcript") {
    const params: IDataObject = {
      videoId: ctx.getNodeParameter("videoId", i, "") as string,
      language: ctx.getNodeParameter("language", i, "") as string,
    };
    return vidiqToolCall(
      ctx,
      "vidiq_video_transcript",
      buildArgs(params),
      readTimeout(ctx, i),
    );
  }

  throw new NodeOperationError(
    ctx.getNode(),
    `Unknown video operation: ${operation}`,
  );
}
