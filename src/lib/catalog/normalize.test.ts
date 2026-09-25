import { describe, expect, it } from 'vitest';
import {
	groupWatchProvidersByProvider,
	normalizeRegions,
	normalizeSearchResults,
	expandProviderIds,
	normalizeSimilar,
	prioritizeProviders,
	buildDiscoverParams,
	filterByAvailability,
	offersByCountry,
	pickTrailer
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

describe('prioritizeProviders / expandProviderIds', () => {
	const p = (id: number, name: string) => ({ id, name, logoPath: null });
	const input = [
		p(1, 'Zed'),
		p(15, 'Hulu'),
		p(9, 'Amazon Prime Video'),
		p(2, 'Alpha'),
		p(8, 'Netflix'),
		p(119, ' amazon prime video ')
	];
	it("fusionne les doublons de nom, remonte les principales, garde l'ordre du reste", () => {
		const out = prioritizeProviders(input);
		expect(out.map((x) => x.id)).toEqual([8, 119, 15, 1, 2]);
		expect(out[1].ids).toEqual([9, 119]);
		expect(input).toHaveLength(6); // pas de mutation
	});
	it('expand : id principal -> tous les ids equivalents', () => {
		const out = prioritizeProviders(input);
		expect(expandProviderIds(['119', '8', '119'], out)).toEqual([9, 119, 8]);
		expect(expandProviderIds(['999'], out)).toEqual([999]);
	});
});

describe('normalizeSimilar', () => {
	it('force le mediaType, ignore les entrees invalides, max 12', () => {
		const raw = Array.from({ length: 20 }, (_, i) => ({
			id: i + 1,
			name: `S${i}`,
			poster_path: null
		}));
		const res = normalizeSimilar({ results: [{ id: 99, poster_path: null }, ...raw] }, 'tv');
		expect(res).toHaveLength(12);
		expect(res.every((r) => r.mediaType === 'tv')).toBe(true);
		expect(normalizeSimilar(undefined, 'movie')).toEqual([]);
	});
});

describe('note et genres', () => {
	const base = { id: 1, title: 'X', poster_path: null };
	it('ajoute voteAverage (arrondie) et genreIds quand presents', () => {
		const [r] = normalizeSearchResults({
			results: [{ ...base, vote_average: 7.8456, genre_ids: [28, 35] }]
		});
		expect(r.voteAverage).toBe(7.8);
		expect(r.genreIds).toEqual([28, 35]);
	});
	it('fiche : genres [{id,name}] -> genreIds ; note 0 ou absente -> champs absents', () => {
		const [r] = normalizeSearchResults({
			results: [{ ...base, vote_average: 0, genres: [{ id: 18, name: 'Drame' }] }]
		});
		expect(r.genreIds).toEqual([18]);
		expect('voteAverage' in r).toBe(false);
		const [bare] = normalizeSearchResults({ results: [base] });
		expect(Object.keys(bare)).not.toContain('genreIds');
	});
});

describe('buildDiscoverParams : tri', () => {
	const f = { genres: [], providers: [], page: 1 };
	it('defaut popularite ; note avec seuil de votes ; release -> champ date du type', () => {
		expect(buildDiscoverParams('movie', f).sort_by).toBe('popularity.desc');
		const note = buildDiscoverParams('tv', { ...f, sort: 'vote_average.asc' });
		expect(note.sort_by).toBe('vote_average.asc');
		expect(note['vote_count.gte']).toBe('200');
		expect(buildDiscoverParams('movie', { ...f, sort: 'release.asc' }).sort_by).toBe(
			'primary_release_date.asc'
		);
		const recent = buildDiscoverParams('tv', { ...f, sort: 'release.desc' });
		expect(recent.sort_by).toBe('first_air_date.desc');
		expect(recent['first_air_date.lte']).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		const bornee = buildDiscoverParams('tv', { ...f, sort: 'release.desc', yearTo: 2010 });
		expect(bornee['first_air_date.lte']).toBe('2010-12-31');
	});
});

describe('pickTrailer', () => {
	const yt = (o: object) => ({ site: 'YouTube', key: 'abcdefghijk', type: 'Trailer', ...o });
	it('prefere trailer officiel > trailer > teaser, ignore le reste', () => {
		expect(
			pickTrailer({
				results: [
					yt({ type: 'Teaser', official: true, key: 'teaser_____' }),
					{ site: 'Vimeo', key: 'vimeovimeo1', type: 'Trailer', official: true },
					yt({ key: 'trailer_no_', official: false }),
					yt({ key: 'trailer_off', official: true, name: 'Officiel' }),
					yt({ type: 'Clip', key: 'clip_______' })
				]
			})
		).toEqual({ key: 'trailer_off', name: 'Officiel' });
		expect(pickTrailer({ results: [yt({ type: 'Teaser' })] })?.key).toBe('abcdefghijk');
	});
	it('cle invalide (injection), aucune video ou reponse vide -> null', () => {
		expect(pickTrailer({ results: [yt({ key: '"><script>' })] })).toBeNull();
		expect(pickTrailer({ results: [yt({ key: 'short' })] })).toBeNull();
		expect(pickTrailer({ results: [] })).toBeNull();
		expect(pickTrailer(undefined)).toBeNull();
	});
});

describe('filterByAvailability', () => {
	const r = (id: number) => ({
		id,
		mediaType: 'movie' as const,
		title: String(id),
		releaseYear: null,
		posterPath: null,
		overview: ''
	});
	const offers = new Map<string, Record<string, number[]> | null>([
		['movie:1', { FR: [8, 9], US: [8] }],
		['movie:2', { FR: [8] }],
		['movie:3', {}],
		['movie:4', null]
	]);
	const all = [1, 2, 3, 4].map(r);
	const ids = (f: Parameters<typeof filterByAvailability>[2]) =>
		filterByAvailability(all, offers, f).map((x) => x.id);
	it('pays : disponible dans le pays ; sans filtre de pays, titres sans offre gardes', () => {
		expect(ids({ country: 'fr', providers: [], exclude: [] })).toEqual([1, 2]);
		expect(ids({ country: 'US', providers: [], exclude: [] })).toEqual([1]);
		expect(ids({ providers: [], exclude: [] })).toEqual([1, 2, 3]); // 4 = lookup echoue
	});
	it('plateformes (OU) dans le pays', () => {
		expect(ids({ country: 'FR', providers: [9], exclude: [] })).toEqual([1]);
		expect(ids({ country: 'FR', providers: [9, 8], exclude: [] })).toEqual([1, 2]);
		expect(ids({ providers: [9], exclude: [] })).toEqual([1]);
	});
	it('exclusions : ecarte seulement si toutes les offres sont exclues, plateforme exclue non comptee', () => {
		expect(ids({ country: 'FR', providers: [], exclude: [8] })).toEqual([1]);
		expect(ids({ providers: [], exclude: [8] })).toEqual([1, 3]);
		expect(ids({ country: 'FR', providers: [8], exclude: [8] })).toEqual([]);
	});
});

describe('offersByCountry', () => {
	it('code pays -> ids de plateformes, tous types confondus, sans doublon', () => {
		const p = (id: number) => ({ provider_id: id, provider_name: 'x', logo_path: null });
		expect(
			offersByCountry({ id: 1, results: { fr: { flatrate: [p(8)], rent: [p(8), p(9)] } } })
		).toEqual({ FR: [8, 9] });
		expect(offersByCountry(undefined)).toEqual({});
	});
});
