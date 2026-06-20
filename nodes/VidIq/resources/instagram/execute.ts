import {
  NodeOperationError,
  type IDataObject,
  type IExecuteFunctions,
} from "n8n-workflow";
import { buildArgs, parseJsonParam, toStringArray } from "../../helpers/args";
import { vidiqToolCall } from "../../transport/mcpClient";

export async function instagramExecute(
  ctx: IExecuteFunctions,
  operation: string,
  i: number,
): Promise<IDataObject | IDataObject[]> {
  if (operation === "accountsFromOutliers") {
    const params: IDataObject = {
      niche: ctx.getNodeParameter("niche", i, "") as string,
      audienceQuery: ctx.getNodeParameter("audienceQuery", i, "") as string,
      followersMin: ctx.getNodeParameter("followersMin", i, 0) as number,
      followersMax: ctx.getNodeParameter("followersMax", i, 0) as number,
    };
    const extra = parseJsonParam(ctx, "extraArguments", i);
    return vidiqToolCall(
      ctx,
      "vidiq_ig_accounts_from_outliers",
      buildArgs(params, extra),
    );
  }

  if (operation === "analyzeReel") {
    const params: IDataObject = {
      reel: ctx.getNodeParameter("reel", i, "") as string,
      prompt: ctx.getNodeParameter("prompt", i, "") as string,
    };
    const extra = parseJsonParam(ctx, "extraArguments", i);
    return vidiqToolCall(ctx, "vidiq_ig_reel_watch", buildArgs(params, extra));
  }

  if (operation === "findOutlierReels") {
    const params: IDataObject = {
      query: ctx.getNodeParameter("query", i, "") as string,
      audienceQuery: ctx.getNodeParameter("audienceQuery", i, "") as string,
      embeddingType: ctx.getNodeParameter(
        "embeddingType",
        i,
        "concept",
      ) as string,
      pageSize: ctx.getNodeParameter("pageSize", i, 0) as number,
      page: ctx.getNodeParameter("page", i, 0) as number,
    };
    const additionalFilters = ctx.getNodeParameter(
      "additionalFilters",
      i,
      {},
    ) as IDataObject;
    Object.assign(params, additionalFilters);
    if (additionalFilters.descriptionLanguage !== undefined) {
      params.descriptionLanguage = toStringArray(
        additionalFilters.descriptionLanguage,
      );
    }
    if (additionalFilters.hashtags !== undefined) {
      params.hashtags = toStringArray(additionalFilters.hashtags);
    }
    if (additionalFilters.excludeShortcodes !== undefined) {
      params.excludeShortcodes = toStringArray(
        additionalFilters.excludeShortcodes,
      );
    }
    if (additionalFilters.excludeUserPosted !== undefined) {
      params.excludeUserPosted = toStringArray(
        additionalFilters.excludeUserPosted,
      );
    }
    const extra = parseJsonParam(ctx, "extraArguments", i);
    return vidiqToolCall(
      ctx,
      "vidiq_ig_outlier_reels_search",
      buildArgs(params, extra),
    );
  }

  if (operation === "getProfile") {
    const params: IDataObject = {
      handle: ctx.getNodeParameter("handle", i, "") as string,
    };
    const extra = parseJsonParam(ctx, "extraArguments", i);
    return vidiqToolCall(ctx, "vidiq_ig_profile", buildArgs(params, extra));
  }

  if (operation === "getProfileReels") {
    const params: IDataObject = {
      handle: ctx.getNodeParameter("handle", i, "") as string,
    };
    const extra = parseJsonParam(ctx, "extraArguments", i);
    return vidiqToolCall(
      ctx,
      "vidiq_ig_profile_reels",
      buildArgs(params, extra),
    );
  }

  throw new NodeOperationError(
    ctx.getNode(),
    `Unknown instagram operation: ${operation}`,
  );
}
