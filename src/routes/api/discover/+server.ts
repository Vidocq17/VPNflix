import { json } from '@sveltejs/kit';
import {
	buildDiscoverParams,
	discoverTitles,
	MAX_DISCOVER_PAGE,
	normalizeSearchResults
} from '$lib/catalog';
import { BadRequest, callTmdb, publicHandler } from '$lib/server/response';
import { discoverSchema, parse, searchParamsObject } from '$lib/security/validation';

export const GET = publicHandler('discover', 60, async ({ url }) => {
	const raw = searchParamsObject(url.searchParams);
	const p = raw && parse(discoverSchema, raw);
	if (!p) throw new BadRequest();

	const page = p.page ?? 1;
	const params = buildDiscoverParams(p.type, {
		genres: p.genres ?? [],
		yearFrom: p.yearFrom,
		yearTo: p.yearTo,
		country: p.country,
		providers: p.providers ?? [],
		exclude: p.exclude ?? [],
		page
	});
	const response = await callTmdb(() => discoverTitles(p.type, params));
	return json({
		results: normalizeSearchResults(response).map((r) => ({ ...r, mediaType: p.type })),
		page,
		totalPages: Math.min(response.total_pages ?? 1, MAX_DISCOVER_PAGE)
	});
});
