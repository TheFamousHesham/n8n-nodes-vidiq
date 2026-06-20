import { describe, it, expect } from 'vitest';
import { findJobId, jobStatus, isTerminal, pollJob } from '../nodes/VidIq/helpers/jobs';

describe('job detection', () => {
	it('finds an mcpJobId at top level or nested', () => {
		expect(findJobId({ mcpJobId: 'a' })).toBe('a');
		expect(findJobId({ job: { mcpJobId: 'b' } })).toBe('b');
		expect(findJobId({ foo: 1 })).toBeUndefined();
	});
	it('reads status and terminality', () => {
		expect(jobStatus({ status: 'completed' })).toBe('completed');
		expect(isTerminal('completed')).toBe(true);
		expect(isTerminal('inprogress')).toBe(false);
		expect(isTerminal(undefined)).toBe(false);
	});
});

describe('pollJob', () => {
	const noSleep = async () => {};
	it('returns once status is terminal', async () => {
		const statuses = ['inprogress', 'inprogress', 'completed'];
		let n = 0;
		const res = await pollJob('jid', async () => ({ status: statuses[n++] }), noSleep, 300);
		expect(res).toEqual({ status: 'completed' });
		expect(n).toBe(3);
	});
	it('throws on timeout', async () => {
		await expect(
			pollJob('jid', async () => ({ status: 'inprogress' }), noSleep, 1),
		).rejects.toThrow(/did not finish within 1s/);
	});
});
