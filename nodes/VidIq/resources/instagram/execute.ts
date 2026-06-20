import {
  NodeOperationError,
  type IDataObject,
  type IExecuteFunctions,
} from "n8n-workflow";
import { buildArgs, toStringArray } from "../../helpers/args";
import { readTimeout } from "../../helpers/common";
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
    return vidiqToolCall(
      ctx,
      "vidiq_ig_accounts_from_outliers",
      buildArgs(params),
      readTimeout(ctx, i),
    );
  }

  if (operation === "analyzeReel") {
    const params: IDataObject = {
      reel: ctx.getNodeParameter("reel", i, "") as string,
      prompt: ctx.getNodeParameter("prompt", i, "") as string,
    };
    return vidiqToolCall(
      ctx,
      "vidiq_ig_reel_watch",
      buildArgs(params),
      readTimeout(ctx, i),
    );
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
    for (const key of [
      "descriptionLanguage",
      "hashtags",
      "excludeShortcodes",
      "excludeUserPosted",
    ]) {
      if (additionalFilters[key] !== undefined) {
        additionalFilters[key] = toStringArray(additionalFilters[key]);
      }
    }
    return vidiqToolCall(
      ctx,
      "vidiq_ig_outlier_reels_search",
      buildArgs(params, additionalFilters),
      readTimeout(ctx, i),
    );
  }

  if (operation === "getProfile") {
    const params: IDataObject = {
      handle: ctx.getNodeParameter("handle", i, "") as string,
    };
    return vidiqToolCall(
      ctx,
      "vidiq_ig_profile",
      buildArgs(params),
      readTimeout(ctx, i),
    );
  }

  if (operation === "getProfileReels") {
    const params: IDataObject = {
      handle: ctx.getNodeParameter("handle", i, "") as string,
    };
    return vidiqToolCall(
      ctx,
      "vidiq_ig_profile_reels",
      buildArgs(params),
      readTimeout(ctx, i),
    );
  }

  throw new NodeOperationError(
    ctx.getNode(),
    `Unknown instagram operation: ${operation}`,
  );
}
