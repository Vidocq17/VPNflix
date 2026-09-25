import type { PageLoad } from './$types';
import type { CatalogSearchResult, WatchCountry, WatchProvider } from '$lib/catalog/types';

export type MediaTypeOption = 'all' | 'movie' | 'tv';

const MEDIA_TYPES: MediaTypeOption[] = ['all', 'movie', 'tv'];

export const load: PageLoad = async ({ url, fetch }) => {
	const query = url.searchParams.get('query')?.trim() ?? '';
	const typeParam = url.searchParams.get('type') ?? 'all';
	const type = MEDIA_TYPES.includes(typeParam as MediaTypeOption)
		? (typeParam as MediaTypeOption)
		: 'all';
	const country = url.searchParams.get('country') ?? '';
	const providers = url.searchParams.getAll('providers');

	const [countriesResponse, providersResponse] = await Promise.all([
		fetch('/api/config/countries'),
		fetch('/api/config/providers')
	]);
	const countries: WatchCountry[] = countriesResponse.ok
		? (await countriesResponse.json()).countries
		: [];
	const availableProviders: WatchProvider[] = providersResponse.ok
		? (await providersResponse.json()).providers
		: [];

	let results: CatalogSearchResult[] = [];
	let errorMessage: string | null = null;

	if (query) {
		const searchParams = new URLSearchParams({ query, type });
		const response = await fetch(`/api/search?${searchParams}`);
		if (response.ok) {
			results = (await response.json()).results;
		} else {
			errorMessage = 'La recherche a echoue. Reessaie dans un instant.';
		}
	}

	return { query, type, country, providers, results, errorMessage, countries, availableProviders };
};
