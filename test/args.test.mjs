import { describe, it, expect } from 'vitest';
import { buildArgs, isEmpty, isUnsetTyped, toStringArray } from '../nodes/VidIq/helpers/args';

describe('isEmpty', () => {
	it('treats undefined, null, "" and [] as empty; keeps false/0', () => {
		expect(isEmpty(undefined)).toBe(true);
		expect(isEmpty(null)).toBe(true);
		expect(isEmpty('')).toBe(true);
		expect(isEmpty([])).toBe(true);
		expect(isEmpty(false)).toBe(false);
		expect(isEmpty(0)).toBe(false);
	});
});

describe('toStringArray', () => {
	it('splits CSV and trims', () => {
		expect(toStringArray('a, b ,c')).toEqual(['a', 'b', 'c']);
	});
	it('passes arrays through as strings', () => {
		expect(toStringArray(['x', 1])).toEqual(['x', '1']);
	});
	it('returns [] for empties', () => {
		expect(toStringArray('')).toEqual([]);
		expect(toStringArray(undefined)).toEqual([]);
	});
});

describe('isUnsetTyped', () => {
	it('treats numeric 0 and NaN as unset; keeps non-zero numbers and false', () => {
		expect(isUnsetTyped(0)).toBe(true);
		expect(isUnsetTyped(Number.NaN)).toBe(true);
		expect(isUnsetTyped('')).toBe(true);
		expect(isUnsetTyped(5)).toBe(false);
		expect(isUnsetTyped(false)).toBe(false);
	});
});

describe('buildArgs', () => {
	it('omits empty and numeric-0 typed params, keeps false', () => {
		expect(buildArgs({ a: 'x', b: '', c: undefined, d: 0, e: false })).toEqual({
			a: 'x',
			e: false,
		});
	});
	it('applies extra as a base that typed fields override', () => {
		expect(buildArgs({ a: 'typed' }, { a: 'extra', z: 'only-extra' })).toEqual({
			a: 'typed',
			z: 'only-extra',
		});
	});
	it('keeps an explicit 0 supplied via the literal extra escape hatch', () => {
		expect(buildArgs({}, { a: 0, b: '', c: 'keep' })).toEqual({ a: 0, c: 'keep' });
	});
});
