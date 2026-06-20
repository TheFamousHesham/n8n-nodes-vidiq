import { describe, it, expect } from 'vitest';
import { buildArgs, isEmpty, toStringArray } from '../nodes/VidIq/helpers/args';

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

describe('buildArgs', () => {
	it('omits empty params', () => {
		expect(buildArgs({ a: 'x', b: '', c: undefined, d: 0, e: false })).toEqual({
			a: 'x',
			d: 0,
			e: false,
		});
	});
	it('applies extra as a base that typed fields override', () => {
		expect(buildArgs({ a: 'typed' }, { a: 'extra', z: 'only-extra' })).toEqual({
			a: 'typed',
			z: 'only-extra',
		});
	});
	it('omits empty extra keys', () => {
		expect(buildArgs({}, { a: '', b: 'keep' })).toEqual({ b: 'keep' });
	});
});
