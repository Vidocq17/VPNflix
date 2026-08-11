import { describe, expect, it } from 'vitest';
import {
	groupWatchProvidersByProvider,
	normalizeRegions,
	normalizeSearchResults
} from './normalize';
import type { TmdbSearchResponse, TmdbWatchProvidersResponse } from './tmdb';

describe('normalizeSearchResults', () => {
	it('normalise un resultat film', () => {
		const response: TmdbSearchResponse = {
			results: [
				{
					id: 1,
					media_type: 'movie',
					title: 'Inception',
					release_date: '2010-07-16',
					poster_path: '/inception.jpg',
					overview: 'Un voleur qui derobe des secrets...'
				}
			]
		};

		expect(normalizeSearchResults(response)).toEqual([
			{
				id: 1,
				mediaType: 'movie',
				title: 'Inception',
				releaseYear: 2010,
				posterPath: '/inception.jpg',
				overview: 'Un voleur qui derobe des secrets...'
			}
		]);
	});

	it('normalise un resultat serie', () => {
		const response: TmdbSearchResponse = {
			results: [
				{
					id: 2,
					media_type: 'tv',
					name: 'Breaking Bad',
					first_air_date: '2008-01-20',
					poster_path: '/bb.jpg',
					overview: 'Un prof de chimie...'
				}
			]
		};

		expect(normalizeSearchResults(response)).toEqual([
			{
				id: 2,
				mediaType: 'tv',
				title: 'Breaking Bad',
				releaseYear: 2008,
				posterPath: '/bb.jpg',
				overview: 'Un prof de chimie...'
			}
		]);
	});

	it('ignore les personnes renvoyees par /search/multi', () => {
		const response: TmdbSearchResponse = {
			results: [
				{ id: 3, media_type: 'person', name: 'Bryan Cranston', poster_path: null },
				{
					id: 2,
					media_type: 'tv',
					name: 'Breaking Bad',
					first_air_date: '2008-01-20',
					poster_path: '/bb.jpg'
				}
			]
		};

		const results = normalizeSearchResults(response);
		expect(results).toHaveLength(1);
		expect(results[0].id).toBe(2);
	});

	it('gere une reponse TMDB vide sans crash', () => {
		expect(normalizeSearchResults(undefined)).toEqual([]);
		expect(normalizeSearchResults({ results: [] })).toEqual([]);
	});
});

describe('groupWatchProvidersByProvider', () => {
	const response: TmdbWatchProvidersResponse = {
		id: 1,
		results: {
			FR: {
				flatrate: [{ provider_id: 8, provider_name: 'Netflix', logo_path: '/netflix.jpg' }]
			},
			US: {
				flatrate: [{ provider_id: 8, provider_name: 'Netflix', logo_path: '/netflix.jpg' }],
				rent: [{ provider_id: 2, provider_name: 'Apple TV', logo_path: '/apple.jpg' }]
			}
		}
	};

	it('groupe plusieurs pays sous le meme provider', () => {
		const groups = groupWatchProvidersByProvider(response);
		const netflix = groups.find((g) => g.provider.id === 8);

		expect(netflix).toBeDefined();
		expect(netflix?.countries.map((c) => c.code).sort()).toEqual(['FR', 'US']);
	});

	it('permet de filtrer les groupes par provider', () => {
		const groups = groupWatchProvidersByProvider(response);
		const filtered = groups.filter((g) => g.provider.name === 'Apple TV');

		expect(filtered).toHaveLength(1);
		expect(filtered[0].countries).toEqual([{ code: 'US', name: 'US' }]);
	});

	it('permet de filtrer les pays disponibles par code pays', () => {
		const groups = groupWatchProvidersByProvider(response);
		const netflix = groups.find((g) => g.provider.id === 8);
		const availableInFr = netflix?.countries.filter((c) => c.code === 'FR');

		expect(availableInFr).toEqual([{ code: 'FR', name: 'FR' }]);
	});

	it('gere une reponse TMDB vide sans crash', () => {
		expect(groupWatchProvidersByProvider(undefined)).toEqual([]);
		expect(groupWatchProvidersByProvider({ id: 1, results: {} })).toEqual([]);
	});
});

describe('normalizeRegions', () => {
	it('permet de filtrer les pays normalises par code', () => {
		const regions = normalizeRegions({
			results: [
				{ iso_3166_1: 'FR', english_name: 'France' },
				{ iso_3166_1: 'US', english_name: 'United States of America' }
			]
		});

		expect(regions.filter((c) => c.code === 'FR')).toEqual([{ code: 'FR', name: 'France' }]);
	});
});
