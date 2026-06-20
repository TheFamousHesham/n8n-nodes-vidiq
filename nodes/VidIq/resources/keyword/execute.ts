import {
  NodeOperationError,
  type IDataObject,
  type IExecuteFunctions,
} from "n8n-workflow";
import { buildArgs, parseJsonParam } from "../../helpers/args";
import { vidiqToolCall } from "../../transport/mcpClient";

export async function keywordExecute(
  ctx: IExecuteFunctions,
  operation: string,
  i: number,
): Promise<IDataObject | IDataObject[]> {
  if (operation === "research") {
    const params: IDataObject = {
      keyword: ctx.getNodeParameter("keyword", i, "") as string,
      mode: ctx.getNodeParameter("mode", i, "research") as string,
      country: ctx.getNodeParameter("country", i, "") as string,
      includeRelated: ctx.getNodeParameter(
        "includeRelated",
        i,
        true,
      ) as boolean,
      broad: ctx.getNodeParameter("broad", i, false) as boolean,
      limit: ctx.getNodeParameter("limit", i, 50) as number,
    };
    const extra = parseJsonParam(ctx, "extraArguments", i);
    return vidiqToolCall(
      ctx,
      "vidiq_keyword_research",
      buildArgs(params, extra),
    );
  }
  throw new NodeOperationError(
    ctx.getNode(),
    `Unknown keyword operation: ${operation}`,
  );
}
