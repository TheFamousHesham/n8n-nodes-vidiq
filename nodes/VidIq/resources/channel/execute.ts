import {
  NodeOperationError,
  type IDataObject,
  type IExecuteFunctions,
} from "n8n-workflow";
import { buildArgs, toStringArray } from "../../helpers/args";
import { readTimeout } from "../../helpers/common";
import { vidiqToolCall } from "../../transport/mcpClient";

export async function channelExecute(
  ctx: IExecuteFunctions,
  operation: string,
  i: number,
): Promise<IDataObject | IDataObject[]> {
  if (operation === "analytics") {
    const params: IDataObject = {
      channelId: ctx.getNodeParameter("channelId", i, "") as string,
      startDate: ctx.getNodeParameter("startDate", i, "") as string,
      endDate: ctx.getNodeParameter("endDate", i, "") as string,
      metrics: ctx.getNodeParameter("metrics", i, []) as string[],
    };
    return vidiqToolCall(
      ctx,
      "vidiq_channel_analytics",
      buildArgs(params),
      readTimeout(ctx, i),
    );
  }

  if (operation === "findBreakout") {
    const params: IDataObject = {
      query: ctx.getNodeParameter("query", i, "") as string,
      channelType: ctx.getNodeParameter("channelType", i, "") as string,
      country: ctx.getNodeParameter("country", i, "") as string,
      subscriberCountMin: ctx.getNodeParameter(
        "subscriberCountMin",
        i,
        0,
      ) as number,
      subscriberCountMax: ctx.getNodeParameter(
        "subscriberCountMax",
        i,
        0,
      ) as number,
      faceless: ctx.getNodeParameter("faceless", i, false) as boolean,
      limit: ctx.getNodeParameter("limit", i, 50) as number,
    };
    return vidiqToolCall(
      ctx,
      "vidiq_breakout_channels",
      buildArgs(params),
      readTimeout(ctx, i),
    );
  }

  if (operation === "findSimilar") {
    const params: IDataObject = {
      niche: ctx.getNodeParameter("niche", i, "") as string,
      minSubscribers: ctx.getNodeParameter("minSubscribers", i, 0) as number,
      maxSubscribers: ctx.getNodeParameter("maxSubscribers", i, 0) as number,
      country: ctx.getNodeParameter("country", i, "") as string,
      language: ctx.getNodeParameter("language", i, "") as string,
      size: ctx.getNodeParameter("size", i, 0) as number,
      excludeChannelIds: toStringArray(
        ctx.getNodeParameter("excludeChannelIds", i, []),
      ),
    };
    return vidiqToolCall(
      ctx,
      "vidiq_similar_channels",
      buildArgs(params),
      readTimeout(ctx, i),
    );
  }

  if (operation === "getMany") {
    const params: IDataObject = {
      channelIds: toStringArray(ctx.getNodeParameter("channelIds", i, [])),
    };
    return vidiqToolCall(
      ctx,
      "vidiq_get_channels_by_ids",
      buildArgs(params),
      readTimeout(ctx, i),
    );
  }

  if (operation === "getMyChannels") {
    const params: IDataObject = {};
    return vidiqToolCall(
      ctx,
      "vidiq_user_channels",
      buildArgs(params),
      readTimeout(ctx, i),
    );
  }

  if (operation === "getPerformanceTrends") {
    const params: IDataObject = {
      channelId: ctx.getNodeParameter("channelId", i, "") as string,
    };
    return vidiqToolCall(
      ctx,
      "vidiq_channel_performance_trends",
      buildArgs(params),
      readTimeout(ctx, i),
    );
  }

  if (operation === "getStats") {
    const params: IDataObject = {
      channelId: ctx.getNodeParameter("channelId", i, "") as string,
      from: ctx.getNodeParameter("from", i, "") as string,
      to: ctx.getNodeParameter("to", i, "") as string,
    };
    return vidiqToolCall(
      ctx,
      "vidiq_channel_stats",
      buildArgs(params),
      readTimeout(ctx, i),
    );
  }

  if (operation === "getVideos") {
    const params: IDataObject = {
      channelId: ctx.getNodeParameter("channelId", i, "") as string,
      videoFormat: ctx.getNodeParameter("videoFormat", i, "") as string,
      popular:
        (ctx.getNodeParameter("popular", i, "popular") as string) === "popular",
    };
    return vidiqToolCall(
      ctx,
      "vidiq_channel_videos",
      buildArgs(params),
      readTimeout(ctx, i),
    );
  }

  if (operation === "search") {
    const additional = ctx.getNodeParameter(
      "additionalFilters",
      i,
      {},
    ) as IDataObject;
    const params: IDataObject = {
      query: ctx.getNodeParameter("query", i, "") as string,
      channelType: ctx.getNodeParameter("channelType", i, "") as string,
      country: toStringArray(ctx.getNodeParameter("country", i, [])),
      languages: toStringArray(ctx.getNodeParameter("languages", i, [])),
      subscriberCountMin: ctx.getNodeParameter(
        "subscriberCountMin",
        i,
        0,
      ) as number,
      subscriberCountMax: ctx.getNodeParameter(
        "subscriberCountMax",
        i,
        0,
      ) as number,
      viewCountMin: ctx.getNodeParameter("viewCountMin", i, 0) as number,
      viewCountMax: ctx.getNodeParameter("viewCountMax", i, 0) as number,
      videoCountMin: ctx.getNodeParameter("videoCountMin", i, 0) as number,
      videoCountMax: ctx.getNodeParameter("videoCountMax", i, 0) as number,
      faceless: ctx.getNodeParameter("faceless", i, false) as boolean,
      breakoutChannel: ctx.getNodeParameter(
        "breakoutChannel",
        i,
        false,
      ) as boolean,
      sort: ctx.getNodeParameter("sort", i, "") as string,
      limit: ctx.getNodeParameter("limit", i, 50) as number,
    };
    if (additional.mainCategory !== undefined) {
      additional.mainCategory = toStringArray(additional.mainCategory);
    }
    return vidiqToolCall(
      ctx,
      "vidiq_channel_search",
      buildArgs(params, additional),
      readTimeout(ctx, i),
    );
  }

  throw new NodeOperationError(
    ctx.getNode(),
    `Unknown channel operation: ${operation}`,
  );
}
