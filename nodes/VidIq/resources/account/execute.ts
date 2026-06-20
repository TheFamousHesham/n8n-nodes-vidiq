import {
  NodeOperationError,
  type IDataObject,
  type IExecuteFunctions,
} from "n8n-workflow";
import { buildArgs } from "../../helpers/args";
import { readTimeout } from "../../helpers/common";
import { vidiqToolCall } from "../../transport/mcpClient";

export async function accountExecute(
  ctx: IExecuteFunctions,
  operation: string,
  i: number,
): Promise<IDataObject | IDataObject[]> {
  if (operation === "getBalance") {
    return vidiqToolCall(
      ctx,
      "vidiq_balance",
      buildArgs({}),
      readTimeout(ctx, i),
    );
  }
  throw new NodeOperationError(
    ctx.getNode(),
    `Unknown account operation: ${operation}`,
  );
}
