import { type IDataObject } from 'n8n-workflow';

const TERMINAL = new Set(['completed', 'failed', 'expired', 'refunded']);

export function findJobId(result: IDataObject): string | undefined {
	const nested = (result.job as IDataObject | undefined)?.mcpJobId;
	const candidates = [result.mcpJobId, result.jobId, nested];
	for (const c of candidates) if (typeof c === 'string' && c.length > 0) return c;
	return undefined;
}

export function jobStatus(result: IDataObject): string | undefined {
	const s = result.status ?? (result.job as IDataObject | undefined)?.status;
	return typeof s === 'string' ? s : undefined;
}

export function isTerminal(status: string | undefined): boolean {
	return status !== undefined && TERMINAL.has(status);
}

/**
 * Poll until the job reaches a terminal status or maxWaitSec elapses.
 * `poll` and `sleep` are injected for testability; backoff grows 2s -> 15s.
 */
export async function pollJob(
	mcpJobId: string,
	poll: (id: string) => Promise<IDataObject>,
	sleep: (ms: number) => Promise<void>,
	maxWaitSec: number,
): Promise<IDataObject> {
	const deadlineMs = maxWaitSec * 1000;
	let waitedMs = 0;
	let delayMs = 2000;
	for (;;) {
		const res = await poll(mcpJobId);
		if (isTerminal(jobStatus(res))) return res;
		if (waitedMs >= deadlineMs) {
			throw new Error(
				`vidIQ job ${mcpJobId} did not finish within ${maxWaitSec}s (last status: ${jobStatus(res) ?? 'unknown'})`,
			);
		}
		await sleep(delayMs);
		waitedMs += delayMs;
		delayMs = Math.min(Math.round(delayMs * 1.5), 15000);
	}
}
