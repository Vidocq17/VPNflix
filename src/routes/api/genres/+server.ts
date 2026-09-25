import { json } from '@sveltejs/kit';
import { getGenres, normalizeGenres } from '$lib/catalog';
import { BadRequest, callTmdb, publicHandler } from '$lib/server/response';
import { genresSchema, parse, searchParamsObject } from '$lib/security/validation';

export const GET = publicHandler('config', 300, async ({ url }) => {
	const raw = searchParamsObject(url.searchParams);
	const params = raw && parse(genresSchema, raw);
	if (!params) throw new BadRequest();
	return json({ genres: normalizeGenres(await callTmdb(() => getGenres(params.type))) });
});
