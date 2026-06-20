import { describe, it, expect } from 'vitest';
import { parseSse } from '../nodes/VidIq/transport/sse';

describe('parseSse', () => {
	it('parses a standard SSE message frame', () => {
		const raw = 'event: message\ndata: {"jsonrpc":"2.0","id":1,"result":{"ok":true}}\n\n';
		expect(parseSse(raw)).toEqual({ jsonrpc: '2.0', id: 1, result: { ok: true } });
	});

	it('parses plain JSON without SSE framing', () => {
		expect(parseSse('{"error":{"code":-32000,"message":"x"}}')).toEqual({
			error: { code: -32000, message: 'x' },
		});
	});

	it('joins multiple data lines of one event', () => {
		const raw = 'data: {"a":1,\ndata: "b":2}\n\n';
		expect(parseSse(raw)).toEqual({ a: 1, b: 2 });
	});

	it('passes through an already-parsed object', () => {
		const obj = { result: { ok: 1 } };
		expect(parseSse(obj)).toEqual({ result: { ok: 1 } });
	});

	it('throws when no data frame is present', () => {
		expect(() => parseSse('event: ping\n\n')).toThrow(/no SSE data frame/);
	});
});
