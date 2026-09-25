import { json } from '@sveltejs/kit';
import {
	filterByAvailability,
	normalizeSearchResults,
	searchMovies,
	searchMulti,
	searchTv
} from '$lib/catalog';
import { loadOffers, MAX_LOOKUPS } from '$lib/server/availability';
import { BadRequest, callTmdb, publicHandler } from '$lib/server/response';
import { parse, searchParamsObject, searchSchema } from '$lib/security/validation';

export const GET = publicHandler('search', 30, async ({ url }) => {
	const raw = searchParamsObject(url.searchParams);
	const params = raw && parse(searchSchema, raw);
	if (!params) throw new BadRequest();

	const { query, type, country, providers = [], exclude = [] } = params;
	const search = type === 'movie' ? searchMovies : type === 'tv' ? searchTv : searchMulti;
	const response = await callTmdb(() => search(query));

	let results = normalizeSearchResults(response);
	// Filtres actifs : TMDB /search ne renvoie pas les plateformes -> lookup borne (availability.ts).
	if (country || providers.length || exclude.length) {
		const offers = await loadOffers(results);
		results = filterByAvailability(results.slice(0, MAX_LOOKUPS), offers, {
			country,
			providers,
			exclude
		});
	}
	return json({ results });
});
