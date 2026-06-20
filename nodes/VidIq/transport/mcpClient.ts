import {
	NodeApiError,
	type IDataObject,
	type IExecuteFunctions,
	type ILoadOptionsFunctions,
	type JsonObject,
} from 'n8n-workflow';
import { parseSse } from './sse';
import { mcpToolError } from './errors';

export const VIDIQ_MCP_ENDPOINT = 'https://mcp.vidiq.com/mcp';

type Ctx = IExecuteFunctions | ILoadOptionsFunctions;

/** Single network path: POST a JSON-RPC tools/call and return the tool's structured result. */
export async function vidiqToolCall(
	ctx: Ctx,
	toolName: string,
	args: IDataObject,
): Promise<IDataObject> {
	const body = JSON.stringify({
		jsonrpc: '2.0',
		id: 1,
		method: 'tools/call',
		params: { name: toolName, arguments: args },
	});

	let raw: unknown;
	try {
		raw = await ctx.helpers.httpRequestWithAuthentication.call(ctx, 'vidIqApi', {
			method: 'POST',
			url: VIDIQ_MCP_ENDPOINT,
			body,
			json: false, // we need the raw SSE text; Accept header comes from the credential
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		throw new NodeApiError(ctx.getNode(), error as JsonObject);
	}

	const message = parseSse(raw);
	if (message.error) {
		throw new NodeApiError(ctx.getNode(), message as JsonObject);
	}
	const result = (message.result ?? {}) as IDataObject;
	if (result.isError === true) {
		throw mcpToolError(ctx.getNode(), toolName, result);
	}

	const structured = result.structuredContent as IDataObject | undefined;
	if (structured !== undefined) return structured;

	const content = result.content as Array<{ type: string; text?: string }> | undefined;
	const text = content?.find((c) => typeof c.text === 'string')?.text;
	if (typeof text === 'string') {
		try {
			return JSON.parse(text) as IDataObject;
		} catch {
			return { text };
		}
	}
	return result;
}
