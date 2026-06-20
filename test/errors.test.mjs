import { describe, it, expect } from 'vitest';
import { extractErrorText, isCreditError, mcpToolError } from '../nodes/VidIq/transport/errors';
import { NodeOperationError } from 'n8n-workflow';

const node = {
	id: '1',
	name: 'VidIQ',
	type: 'vidIq',
	typeVersion: 1,
	position: [0, 0],
	parameters: {},
};

describe('extractErrorText', () => {
	it('pulls text from content array', () => {
		expect(extractErrorText({ content: [{ type: 'text', text: 'boom' }], isError: true })).toBe(
			'boom',
		);
	});
	it('falls back when no text', () => {
		expect(extractErrorText({ isError: true })).toMatch(/no message/);
	});
});

describe('isCreditError', () => {
	it('detects credit/quota wording', () => {
		expect(isCreditError('Insufficient credits remaining')).toBe(true);
		expect(isCreditError('MCP error -32602: Tool x not found')).toBe(false);
	});
});

describe('mcpToolError', () => {
	it('returns a NodeOperationError naming the tool', () => {
		const err = mcpToolError(node, 'vidiq_channel_stats', {
			content: [{ type: 'text', text: 'MCP error -32602: Input validation error' }],
			isError: true,
		});
		expect(err).toBeInstanceOf(NodeOperationError);
		expect(err.message).toContain('vidiq_channel_stats');
		expect(err.message).toContain('Input validation error');
	});
});
