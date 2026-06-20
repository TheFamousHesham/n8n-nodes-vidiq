import { describe, it, expect } from 'vitest';
import { resolveBinaryOrUrl } from '../nodes/VidIq/helpers/binary';

function ctxWith(buffer, mime = 'image/png') {
	return {
		helpers: {
			getBinaryDataBuffer: async () => buffer,
			assertBinaryData: () => ({ mimeType: mime }),
		},
	};
}

describe('resolveBinaryOrUrl', () => {
	it('returns the url unchanged for url mode', async () => {
		const out = await resolveBinaryOrUrl(
			ctxWith(Buffer.from('')),
			0,
			'url',
			'https://x/y.png',
			'data',
		);
		expect(out).toBe('https://x/y.png');
	});
	it('base64-encodes binary in binary mode', async () => {
		const out = await resolveBinaryOrUrl(ctxWith(Buffer.from('hi')), 0, 'binary', '', 'data');
		expect(out).toBe(Buffer.from('hi').toString('base64'));
	});
	it('wraps as data URI when requested', async () => {
		const out = await resolveBinaryOrUrl(
			ctxWith(Buffer.from('hi'), 'audio/mpeg'),
			0,
			'binary',
			'',
			'data',
			true,
		);
		expect(out).toBe(`data:audio/mpeg;base64,${Buffer.from('hi').toString('base64')}`);
	});
});
