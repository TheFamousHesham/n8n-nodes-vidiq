import { type IDataObject, type IExecuteFunctions } from 'n8n-workflow';

export function isEmpty(value: unknown): boolean {
	if (value === undefined || value === null || value === '') return true;
	if (Array.isArray(value) && value.length === 0) return true;
	return false;
}

/** "a, b ,c" -> ["a","b","c"]; arrays pass through (stringified); empties -> []. */
export function toStringArray(value: unknown): string[] {
	if (Array.isArray(value)) return value.map((v) => String(v));
	if (typeof value === 'string') {
		return value
			.split(',')
			.map((s) => s.trim())
			.filter((s) => s.length > 0);
	}
	return [];
}

/**
 * Collect provided params into an MCP `arguments` object.
 * `extra` (the Extra Arguments JSON escape hatch) is applied first as a base;
 * typed params are merged on top and win. Empty values are dropped from both.
 */
export function buildArgs(params: IDataObject, extra?: IDataObject): IDataObject {
	const args: IDataObject = {};
	if (extra && typeof extra === 'object') {
		for (const [k, v] of Object.entries(extra)) if (!isEmpty(v)) args[k] = v;
	}
	for (const [k, v] of Object.entries(params)) if (!isEmpty(v)) args[k] = v;
	return args;
}

/** Read a `type:'json'` param that may arrive as a string or object. */
export function parseJsonParam(ctx: IExecuteFunctions, name: string, i: number): IDataObject {
	const raw = ctx.getNodeParameter(name, i, {});
	if (typeof raw === 'string') {
		const t = raw.trim();
		if (t === '') return {};
		try {
			return JSON.parse(t) as IDataObject;
		} catch {
			return {};
		}
	}
	return (raw ?? {}) as IDataObject;
}
