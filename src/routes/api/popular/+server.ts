import { json } from '@sveltejs/kit';
import { getPopularMovies, getPopularTv, normalizeSearchResults } from '$lib/catalog';
import { BadRequest, callTmdb, publicHandler } from '$lib/server/response';
import { parse, popularSchema, searchParamsObject } from '$lib/security/validation';

export const GET = publicHandler('popular', 60, async ({ url }) => {
	const raw = searchParamsObject(url.searchParams);
	const params = raw && parse(popularSchema, raw);
	if (!params) throw new BadRequest();

	const response = await callTmdb(params.type === 'movie' ? getPopularMovies : getPopularTv);
	return json({ results: normalizeSearchResults(response).slice(0, 12) });
});
