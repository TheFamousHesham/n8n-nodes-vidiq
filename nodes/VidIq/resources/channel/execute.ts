import {
  NodeOperationError,
  type IDataObject,
  type IExecuteFunctions,
} from "n8n-workflow";
import { buildArgs, parseJsonParam, toStringArray } from "../../helpers/args";
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
      metrics: toStringArray(ctx.getNodeParameter("metrics", i, [])),
      dimensions: toStringArray(ctx.getNodeParameter("dimensions", i, [])),
      maxResults: ctx.getNodeParameter("maxResults", i, 0) as number,
      filters: ctx.getNodeParameter("filters", i, "") as string,
      sort: ctx.getNodeParameter("sort", i, "") as string,
    };
    const extra = parseJsonParam(ctx, "extraArguments", i);
    return vidiqToolCall(
      ctx,
      "vidiq_channel_analytics",
      buildArgs(params, extra),
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
    const extra = parseJsonParam(ctx, "extraArguments", i);
    return vidiqToolCall(
      ctx,
      "vidiq_breakout_channels",
      buildArgs(params, extra),
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
    const extra = parseJsonParam(ctx, "extraArguments", i);
    return vidiqToolCall(
      ctx,
      "vidiq_similar_channels",
      buildArgs(params, extra),
    );
  }

  if (operation === "getMany") {
    const params: IDataObject = {
      channelIds: toStringArray(ctx.getNodeParameter("channelIds", i, [])),
    };
    const extra = parseJsonParam(ctx, "extraArguments", i);
    return vidiqToolCall(
      ctx,
      "vidiq_get_channels_by_ids",
      buildArgs(params, extra),
    );
  }

  if (operation === "getMyChannels") {
    const params: IDataObject = {};
    const extra = parseJsonParam(ctx, "extraArguments", i);
    return vidiqToolCall(ctx, "vidiq_user_channels", buildArgs(params, extra));
  }

  if (operation === "getPerformanceTrends") {
    const params: IDataObject = {
      channelId: ctx.getNodeParameter("channelId", i, "") as string,
    };
    const extra = parseJsonParam(ctx, "extraArguments", i);
    return vidiqToolCall(
      ctx,
      "vidiq_channel_performance_trends",
      buildArgs(params, extra),
    );
  }

  if (operation === "getStats") {
    const params: IDataObject = {
      channelId: ctx.getNodeParameter("channelId", i, "") as string,
      from: ctx.getNodeParameter("from", i, "") as string,
      to: ctx.getNodeParameter("to", i, "") as string,
    };
    const extra = parseJsonParam(ctx, "extraArguments", i);
    return vidiqToolCall(ctx, "vidiq_channel_stats", buildArgs(params, extra));
  }

  if (operation === "getVideos") {
    const params: IDataObject = {
      channelId: ctx.getNodeParameter("channelId", i, "") as string,
      videoFormat: ctx.getNodeParameter("videoFormat", i, "") as string,
      popular: ctx.getNodeParameter("popular", i, false) as boolean,
    };
    const extra = parseJsonParam(ctx, "extraArguments", i);
    return vidiqToolCall(ctx, "vidiq_channel_videos", buildArgs(params, extra));
  }

  if (operation === "listCompetitors") {
    const params: IDataObject = {
      youtubeChannelId: ctx.getNodeParameter(
        "youtubeChannelId",
        i,
        "",
      ) as string,
    };
    const extra = parseJsonParam(ctx, "extraArguments", i);
    return vidiqToolCall(
      ctx,
      "vidiq_list_competitors",
      buildArgs(params, extra),
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
    Object.assign(params, additional);
    if (additional.mainCategory !== undefined) {
      params.mainCategory = toStringArray(additional.mainCategory);
    }
    const extra = parseJsonParam(ctx, "extraArguments", i);
    return vidiqToolCall(ctx, "vidiq_channel_search", buildArgs(params, extra));
  }

  if (operation === "updateCompetitors") {
    const params: IDataObject = {
      youtubeChannelId: ctx.getNodeParameter(
        "youtubeChannelId",
        i,
        "",
      ) as string,
      follow: toStringArray(ctx.getNodeParameter("follow", i, [])),
      unfollow: toStringArray(ctx.getNodeParameter("unfollow", i, [])),
    };
    const extra = parseJsonParam(ctx, "extraArguments", i);
    return vidiqToolCall(
      ctx,
      "vidiq_update_competitors",
      buildArgs(params, extra),
    );
  }

  throw new NodeOperationError(
    ctx.getNode(),
    `Unknown channel operation: ${operation}`,
  );
}
