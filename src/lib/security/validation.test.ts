import { describe, expect, it } from 'vitest';
import { isRateLimited } from './rate-limit';
import { buildDiscoverParams } from '$lib/catalog';
import {
	discoverSchema,
	parse,
	popularSchema,
	searchParamsObject,
	searchSchema,
	watchProvidersSchema
} from './validation';

describe('searchSchema', () => {
	it('accepte une requete valide, type par defaut all, trim', () => {
		expect(parse(searchSchema, { query: '  ab ' })).toEqual({ query: 'ab', type: 'all' });
	});
	it.each([{}, { query: 'a' }, { query: ' a ' }, { query: 'x'.repeat(81) }])(
		'rejette %j',
		(raw) => {
			expect(parse(searchSchema, raw as Record<string, string>)).toBeNull();
		}
	);
	it('rejette type invalide et parametre inconnu', () => {
		expect(parse(searchSchema, { query: 'abc', type: 'bad' })).toBeNull();
		expect(parse(searchSchema, { query: 'abc', foo: '1' })).toBeNull();
	});
	it('rejette les parametres dupliques', () => {
		expect(searchParamsObject(new URLSearchParams('query=ab&query=cd'))).toBeNull();
	});
});

describe('watchProvidersSchema', () => {
	const ok = { mediaType: 'movie', id: '27205' };
	it('accepte et convertit', () => {
		expect(parse(watchProvidersSchema, { ...ok, countries: 'FR, de', providers: '8,9' })).toEqual({
			mediaType: 'movie',
			id: 27205,
			countries: ['FR', 'de'],
			providers: [8, 9]
		});
	});
	it.each([
		{ ...ok, id: 'abc' },
		{ ...ok, id: '0' },
		{ ...ok, id: '-1' },
		{ ...ok, id: '1.5' },
		{ ...ok, mediaType: 'person' },
		{ ...ok, countries: 'FRA' },
		{ ...ok, providers: '8,x' },
		{ ...ok, countries: Array(251).fill('FR').join(',') },
		{ ...ok, providers: Array(101).fill('8').join(',') },
		{ ...ok, extra: '1' }
	])('rejette %j', (raw) => {
		expect(parse(watchProvidersSchema, raw)).toBeNull();
	});
});

describe('isRateLimited', () => {
	it('bloque au-dela de la limite puis relache apres la fenetre', () => {
		const t = 1_000_000;
		expect([1, 2, 3].map(() => isRateLimited('k', 2, t))).toEqual([false, false, true]);
		expect(isRateLimited('k', 2, t + 61_000)).toBe(false);
		expect(isRateLimited('autre', 2, t)).toBe(false);
	});
});

describe('popularSchema', () => {
	it('accepte movie/tv, rejette le reste', () => {
		expect(parse(popularSchema, { type: 'tv' })).toEqual({ type: 'tv' });
		for (const raw of [{}, { type: 'all' }, { type: 'movie', x: '1' }])
			expect(parse(popularSchema, raw as Record<string, string>)).toBeNull();
	});
});

describe('discoverSchema', () => {
	it('accepte des filtres valides et convertit', () => {
		expect(
			parse(discoverSchema, {
				type: 'movie',
				genres: '28,35',
				yearFrom: '2000',
				yearTo: '2010',
				country: 'FR',
				providers: '8,9',
				page: '2'
			})
		).toMatchObject({
			genres: [28, 35],
			yearFrom: 2000,
			country: 'FR',
			providers: [8, 9],
			page: 2
		});
	});
	it.each([
		{},
		{ type: 'all' },
		{ type: 'tv', foo: '1' },
		{ type: 'tv', genres: '28,x' },
		{ type: 'tv', yearFrom: '1800' },
		{ type: 'tv', yearFrom: '2020', yearTo: '2010' },
		{ type: 'tv', country: 'FRA' },
		{ type: 'tv', providers: '8' }, // plateformes sans pays
		{ type: 'tv', exclude: '8' }, // exclusions sans pays
		{ type: 'tv', page: '501' },
		{ type: 'tv', page: '0' }
	])('rejette %j', (raw) => {
		expect(parse(discoverSchema, raw as Record<string, string>)).toBeNull();
	});
});

describe('buildDiscoverParams', () => {
	const base = { genres: [], providers: [], page: 1 };
	it('films : genres ET, annees, pays + plateformes', () => {
		expect(
			buildDiscoverParams('movie', {
				...base,
				genres: [28, 35],
				yearFrom: 2000,
				yearTo: 2010,
				country: 'fr',
				providers: [8, 9]
			})
		).toEqual({
			sort_by: 'popularity.desc',
			page: '1',
			with_genres: '28,35',
			'primary_release_date.gte': '2000-01-01',
			'primary_release_date.lte': '2010-12-31',
			watch_region: 'FR',
			with_watch_providers: '8|9'
		});
	});
	it('exclusions -> without_watch_providers (OU)', () => {
		const p = buildDiscoverParams('tv', { ...base, country: 'US', exclude: [8, 9] });
		expect(p.without_watch_providers).toBe('8|9');
	});
	it('series : first_air_date ; pays seul = disponible dans le pays', () => {
		const p = buildDiscoverParams('tv', { ...base, yearFrom: 2020, country: 'US' });
		expect(p['first_air_date.gte']).toBe('2020-01-01');
		expect(p.with_watch_monetization_types).toBeTruthy();
		expect(p.with_watch_providers).toBeUndefined();
	});
});
