import { json } from '@sveltejs/kit';
import { normalizeSearchResults, searchMovies, searchMulti, searchTv } from '$lib/catalog';
import { BadRequest, callTmdb, publicHandler } from '$lib/server/response';
import { parse, searchParamsObject, searchSchema } from '$lib/security/validation';

export const GET = publicHandler('search', 30, async ({ url }) => {
	const raw = searchParamsObject(url.searchParams);
	const params = raw && parse(searchSchema, raw);
	if (!params) throw new BadRequest();

	const { query, type } = params;
	const search = type === 'movie' ? searchMovies : type === 'tv' ? searchTv : searchMulti;
	const response = await callTmdb(() => search(query));

	return json({ results: normalizeSearchResults(response) });
});
