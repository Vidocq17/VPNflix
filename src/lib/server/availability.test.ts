import { beforeEach, describe, expect, it } from 'vitest';
import { clearAvailabilityCache, loadOffers, MAX_LOOKUPS } from './availability';
import type { CatalogSearchResult } from '$lib/catalog';

const r = (id: number): CatalogSearchResult => ({
	id,
	mediaType: 'movie',
	title: String(id),
	releaseYear: null,
	posterPath: null,
	overview: ''
});
const many = (n: number) => Array.from({ length: n }, (_, i) => r(i + 1));

beforeEach(clearAvailabilityCache);

describe('loadOffers', () => {
	it('borne a MAX_LOOKUPS titres et 4 requetes en parallele', async () => {
		let running = 0;
		let peak = 0;
		let calls = 0;
		const lookup = async () => {
			calls++;
			peak = Math.max(peak, ++running);
			await new Promise((res) => setTimeout(res, 5));
			running--;
			return { FR: [8] };
		};
		const out = await loadOffers(many(30), lookup);
		expect(calls).toBe(MAX_LOOKUPS);
		expect(out.size).toBe(MAX_LOOKUPS);
		expect(peak).toBe(4);
	});

	it('cache : un second appel ne refait pas de lookup, expire apres le TTL', async () => {
		let calls = 0;
		const lookup = async () => (calls++, { FR: [8] });
		const t = 1_000_000;
		await loadOffers(many(3), lookup, t);
		await loadOffers(many(3), lookup, t + 1000);
		expect(calls).toBe(3);
		await loadOffers(many(3), lookup, t + 11 * 60_000);
		expect(calls).toBe(6);
	});

	it('un lookup en echec -> null ; tous en echec -> erreur relancee', async () => {
		const flaky = async (x: CatalogSearchResult) => {
			if (x.id === 2) throw new Error('boom');
			return { FR: [8] };
		};
		const out = await loadOffers(many(3), flaky);
		expect(out.get('movie:2')).toBeNull();
		expect(out.get('movie:1')).toEqual({ FR: [8] });
		clearAvailabilityCache();
		await expect(
			loadOffers(many(2), async () => {
				throw new Error('down');
			})
		).rejects.toThrow('down');
	});
});
