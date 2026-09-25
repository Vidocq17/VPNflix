import { json } from '@sveltejs/kit';
import {
	getMovieWatchProviderList,
	getTvWatchProviderList,
	normalizeProviderList,
	sortProvidersByName
} from '$lib/catalog';
import { BadRequest, callTmdb, publicHandler } from '$lib/server/response';
import { parse, providersConfigSchema, searchParamsObject } from '$lib/security/validation';

// Le parametre "country" est accepte mais sans effet pour l'instant : TMDB expose un
// "watch_region" sur /watch/providers/movie|tv qui filtre la disponibilite, pas la liste
// elle-meme. Comportement exact a clarifier plus tard si besoin (etape 16+).
export const GET = publicHandler('config', 120, async ({ url }) => {
	const raw = searchParamsObject(url.searchParams);
	const params = raw && parse(providersConfigSchema, raw);
	if (!params) throw new BadRequest();
	const { type } = params;

	const lists = await Promise.all([
		type !== 'tv' ? callTmdb(() => getMovieWatchProviderList()) : null,
		type !== 'movie' ? callTmdb(() => getTvWatchProviderList()) : null
	]);

	const byId = new Map(
		lists
			.filter((r) => r !== null)
			.flatMap((response) => normalizeProviderList(response))
			.map((provider) => [provider.id, provider])
	);

	return json({ providers: sortProvidersByName(Array.from(byId.values())) });
});
