import {
  NodeOperationError,
  type IDataObject,
  type IExecuteFunctions,
} from "n8n-workflow";
import { buildArgs, parseJsonParam } from "../../helpers/args";
import { vidiqToolCall } from "../../transport/mcpClient";

export async function accountExecute(
  ctx: IExecuteFunctions,
  operation: string,
  i: number,
): Promise<IDataObject | IDataObject[]> {
  if (operation === "getBalance") {
    const params: IDataObject = {};
    const extra = parseJsonParam(ctx, "extraArguments", i);
    return vidiqToolCall(ctx, "vidiq_balance", buildArgs(params, extra));
  }
  if (operation === "submitFeedback") {
    const params: IDataObject = {
      type: ctx.getNodeParameter("type", i, "feature_request") as string,
      description: ctx.getNodeParameter("description", i, "") as string,
    };
    params["tool_name"] = ctx.getNodeParameter("toolName", i, "") as string;
    params["use_case"] = ctx.getNodeParameter("useCase", i, "") as string;
    const extra = parseJsonParam(ctx, "extraArguments", i);
    return vidiqToolCall(
      ctx,
      "vidiq_submit_feedback",
      buildArgs(params, extra),
    );
  }
  throw new NodeOperationError(
    ctx.getNode(),
    `Unknown account operation: ${operation}`,
  );
}
