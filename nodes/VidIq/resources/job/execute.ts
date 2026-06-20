import {
  NodeOperationError,
  type IDataObject,
  type IExecuteFunctions,
} from "n8n-workflow";
import { buildArgs, parseJsonParam } from "../../helpers/args";
import { vidiqToolCall } from "../../transport/mcpClient";

export async function jobExecute(
  ctx: IExecuteFunctions,
  operation: string,
  i: number,
): Promise<IDataObject | IDataObject[]> {
  if (operation === "getStatus") {
    const params: IDataObject = {
      mcpJobId: ctx.getNodeParameter("mcpJobId", i, "") as string,
    };
    const extra = parseJsonParam(ctx, "extraArguments", i);
    return vidiqToolCall(ctx, "vidiq_job_poll", buildArgs(params, extra));
  }
  if (operation === "listJobs") {
    const params: IDataObject = {
      toolName: ctx.getNodeParameter("toolName", i, "") as string,
      status: ctx.getNodeParameter("status", i, "inprogress") as string,
      limit: ctx.getNodeParameter("limit", i, 50) as number,
    };
    const extra = parseJsonParam(ctx, "extraArguments", i);
    return vidiqToolCall(ctx, "vidiq_jobs_list", buildArgs(params, extra));
  }
  throw new NodeOperationError(
    ctx.getNode(),
    `Unknown job operation: ${operation}`,
  );
}
