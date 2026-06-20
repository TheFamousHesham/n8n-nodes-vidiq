import { describe, it, expect, vi } from 'vitest';
import { vidiqToolCall } from '../nodes/VidIq/transport/mcpClient';

function ctx(responder) {
	const node = {
		id: '1',
		name: 'VidIQ',
		type: 'vidIq',
		typeVersion: 1,
		position: [0, 0],
		parameters: {},
	};
	return {
		getNode: () => node,
		helpers: {
			httpRequestWithAuthentication: vi.fn(async function (_cred, opts) {
				return responder(opts);
			}),
		},
	};
}

const sse = (obj) => `event: message\ndata: ${JSON.stringify(obj)}\n\n`;

describe('vidiqToolCall', () => {
	it('posts tools/call and returns structuredContent', async () => {
		const c = ctx(() =>
			sse({
				jsonrpc: '2.0',
				id: 1,
				result: { structuredContent: { totalCredits: 5 }, content: [], isError: false },
			}),
		);
		const out = await vidiqToolCall(c, 'vidiq_balance', {});
		expect(out).toEqual({ totalCredits: 5 });
		const call = c.helpers.httpRequestWithAuthentication.mock.calls[0];
		expect(call[0]).toBe('vidIqApi');
		expect(call[1].url).toBe('https://mcp.vidiq.com/mcp');
		expect(JSON.parse(call[1].body)).toMatchObject({
			method: 'tools/call',
			params: { name: 'vidiq_balance' },
		});
	});

	it('falls back to parsing content[].text when no structuredContent', async () => {
		const c = ctx(() => sse({ result: { content: [{ type: 'text', text: '{"x":1}' }] } }));
		expect(await vidiqToolCall(c, 'vidiq_x', {})).toEqual({ x: 1 });
	});

	it('throws NodeOperationError when result.isError is true', async () => {
		const c = ctx(() =>
			sse({ result: { isError: true, content: [{ type: 'text', text: 'MCP error -32602: bad' }] } }),
		);
		await expect(vidiqToolCall(c, 'vidiq_x', {})).rejects.toThrow(/vidiq_x.*bad/);
	});
});
