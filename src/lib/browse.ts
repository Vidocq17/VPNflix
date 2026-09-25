// Chargement commun des pages /movies et /series (load universel : filtres lus dans l'URL).
import { expandProviderIds } from '$lib/catalog/normalize';
import type { CatalogSearchResult, Genre, WatchCountry, WatchProvider } from '$lib/catalog/types';

type Fetch = typeof fetch;

export async function browseLoad(type: 'movie' | 'tv', url: URL, fetch: Fetch) {
	const sp = url.searchParams;
	const genres = sp.getAll('genres');
	const yearFrom = sp.get('yearFrom') ?? '';
	const yearTo = sp.get('yearTo') ?? '';
	const country = sp.get('country') ?? '';
	// Les plateformes n'ont de sens que dans un pays (watch_region).
	const providers = country ? sp.getAll('providers') : [];
	const exclude = country ? sp.getAll('exclude') : [];
	const page = Math.max(1, Number(sp.get('page')) || 1);

	const q = new URLSearchParams({ type });
	if (genres.length) q.set('genres', genres.join(','));
	if (yearFrom) q.set('yearFrom', yearFrom);
	if (yearTo) q.set('yearTo', yearTo);
	if (country) q.set('country', country);
	if (page > 1) q.set('page', String(page));

	const get = async <T>(path: string, key: string, fallback: T): Promise<T> => {
		const res = await fetch(path);
		return res.ok ? (await res.json())[key] : fallback;
	};
	const [genreList, countries, availableProviders] = await Promise.all([
		get<Genre[]>(`/api/genres?type=${type}`, 'genres', []),
		get<WatchCountry[]>('/api/config/countries', 'countries', []),
		get<WatchProvider[]>(`/api/config/providers?type=${type}`, 'providers', [])
	]);
	// Un filtre = tous les ids TMDB equivalents (doublons de plateforme fusionnes dans la liste).
	if (providers.length)
		q.set('providers', expandProviderIds(providers, availableProviders).join(','));
	if (exclude.length) q.set('exclude', exclude.join(','));
	const discover = await fetch(`/api/discover?${q}`);

	let results: CatalogSearchResult[] = [];
	let totalPages = 1;
	let errorMessage: string | null = null;
	if (discover.ok) {
		({ results, totalPages } = await discover.json());
	} else {
		errorMessage = 'Le chargement a echoue. Reessaie dans un instant.';
	}
	return {
		genres,
		yearFrom,
		yearTo,
		country,
		providers,
		exclude,
		page,
		genreList,
		countries,
		availableProviders,
		results,
		totalPages,
		errorMessage
	};
}
