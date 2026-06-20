import {
  NodeOperationError,
  type IDataObject,
  type IExecuteFunctions,
} from "n8n-workflow";
import { buildArgs, parseJsonParam, toStringArray } from "../../helpers/args";
import { vidiqToolCall } from "../../transport/mcpClient";

export async function trendExecute(
  ctx: IExecuteFunctions,
  operation: string,
  i: number,
): Promise<IDataObject | IDataObject[]> {
  if (operation === "categories") {
    const extra = parseJsonParam(ctx, "extraArguments", i);
    return vidiqToolCall(ctx, "vidiq_trend_categories", buildArgs({}, extra));
  }

  if (operation === "trendingVideos") {
    const params: IDataObject = {
      videoFormat: ctx.getNodeParameter("videoFormat", i, "long") as string,
      titleQuery: ctx.getNodeParameter("titleQuery", i, "") as string,
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
      vphMin: ctx.getNodeParameter("vphMin", i, 0) as number,
      channelCountry: ctx.getNodeParameter("channelCountry", i, "") as string,
      videoPublishedAfter: ctx.getNodeParameter(
        "videoPublishedAfter",
        i,
        "",
      ) as string,
      videoPublishedBefore: ctx.getNodeParameter(
        "videoPublishedBefore",
        i,
        "",
      ) as string,
      sortBy: ctx.getNodeParameter("sortBy", i, "relevance") as string,
      limit: ctx.getNodeParameter("limit", i, 50) as number,
    };
    const extra = parseJsonParam(ctx, "extraArguments", i);
    return vidiqToolCall(
      ctx,
      "vidiq_trending_videos",
      buildArgs(params, extra),
    );
  }

  if (operation === "videoOutliers") {
    const params: IDataObject = {
      keyword: ctx.getNodeParameter("keyword", i, "") as string,
      channelIds: toStringArray(ctx.getNodeParameter("channelIds", i, [])),
      contentType: ctx.getNodeParameter("contentType", i, "all") as string,
      minOutlierScore: ctx.getNodeParameter("minOutlierScore", i, 0) as number,
      minSubscribers: ctx.getNodeParameter("minSubscribers", i, 0) as number,
      maxSubscribers: ctx.getNodeParameter("maxSubscribers", i, 0) as number,
      minViews: ctx.getNodeParameter("minViews", i, 0) as number,
      maxViews: ctx.getNodeParameter("maxViews", i, 0) as number,
      minVph: ctx.getNodeParameter("minVph", i, 0) as number,
      minEngagementRate: ctx.getNodeParameter(
        "minEngagementRate",
        i,
        0,
      ) as number,
      publishedWithin: ctx.getNodeParameter(
        "publishedWithin",
        i,
        "allTime",
      ) as string,
      channelCountry: ctx.getNodeParameter("channelCountry", i, "") as string,
      trendCategories: toStringArray(
        ctx.getNodeParameter("trendCategories", i, []),
      ),
      sort: ctx.getNodeParameter("sort", i, "breakoutScore") as string,
      limit: ctx.getNodeParameter("limit", i, 50) as number,
    };
    const extra = parseJsonParam(ctx, "extraArguments", i);
    return vidiqToolCall(ctx, "vidiq_outliers", buildArgs(params, extra));
  }

  throw new NodeOperationError(
    ctx.getNode(),
    `Unknown trend operation: ${operation}`,
  );
}
