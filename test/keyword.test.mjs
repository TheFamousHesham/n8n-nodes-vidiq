import { describe, it, expect, vi } from 'vitest';

vi.mock('../nodes/VidIq/transport/mcpClient', () => ({
	vidiqToolCall: vi.fn(async (_ctx, tool, args) => ({ tool, args })),
}));

import { keywordExecute } from '../nodes/VidIq/resources/keyword/execute';
import { vidiqToolCall } from '../nodes/VidIq/transport/mcpClient';

function ctx(params) {
	return {
		getNode: () => ({ name: 'VidIQ' }),
		getNodeParameter: (name, _i, fallback) => (name in params ? params[name] : fallback),
	};
}

describe('keywordExecute', () => {
	it('maps research params and omits empties', async () => {
		await keywordExecute(
			ctx({
				keyword: 'minecraft',
				mode: 'research',
				country: '',
				includeRelated: true,
				broad: false,
				limit: 50,
				extraArguments: '{}',
			}),
			'research',
			0,
		);
		expect(vidiqToolCall).toHaveBeenCalledWith(expect.anything(), 'vidiq_keyword_research', {
			keyword: 'minecraft',
			mode: 'research',
			includeRelated: true,
			broad: false,
			limit: 50,
		});
	});
});
