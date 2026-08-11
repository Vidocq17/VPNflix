import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { normalizeSearchResults, searchMovies, searchMulti, searchTv } from '$lib/catalog';
import { badRequest, callTmdb } from '../api-error';

type SearchType = 'movie' | 'tv' | 'all';
const SEARCH_TYPES: SearchType[] = ['movie', 'tv', 'all'];

export const GET: RequestHandler = async ({ url }) => {
	const query = url.searchParams.get('query')?.trim();
	if (!query) badRequest('Le parametre "query" est requis.');

	const typeParam = url.searchParams.get('type') ?? 'all';
	if (!SEARCH_TYPES.includes(typeParam as SearchType)) {
		badRequest('Le parametre "type" doit etre "movie", "tv" ou "all".');
	}
	const type = typeParam as SearchType;

	const search = type === 'movie' ? searchMovies : type === 'tv' ? searchTv : searchMulti;
	const response = await callTmdb(() => search(query));

	return json({ results: normalizeSearchResults(response) });
};
