import { json } from '@sveltejs/kit';
import { getGenres, normalizeGenres } from '$lib/catalog';
import { BadRequest, callTmdb, publicHandler } from '$lib/server/response';
import { genresSchema, parse, searchParamsObject } from '$lib/security/validation';

// Bucket propre : le layout appelle cet endpoint 2x par chargement complet (noms de genres des
// posters), il ne doit pas consommer le quota de /api/config/*.
export const GET = publicHandler('genres', 300, async ({ url }) => {
	const raw = searchParamsObject(url.searchParams);
	const params = raw && parse(genresSchema, raw);
	if (!params) throw new BadRequest();
	return json({ genres: normalizeGenres(await callTmdb(() => getGenres(params.type))) });
});
