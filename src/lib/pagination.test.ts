import { describe, expect, it } from 'vitest';
import { pageWindow } from './pagination';

describe('pageWindow', () => {
	it.each([
		[4, 10, [4, 5, 6]],
		[9, 10, [9, 10]],
		[10, 10, [10]],
		[1, 1, [1]],
		[1, 0, [1]],
		[7, 5, [5]]
	])('page %i / %i', (c, t, out) => expect(pageWindow(c, t)).toEqual(out));
});
