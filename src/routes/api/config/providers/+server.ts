import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	getMovieWatchProviderList,
	getTvWatchProviderList,
	normalizeProviderList,
	sortProvidersByName
} from '$lib/catalog';
import { badRequest, callTmdb } from '../../api-error';

type ProviderType = 'movie' | 'tv' | 'all';
const PROVIDER_TYPES: ProviderType[] = ['movie', 'tv', 'all'];

// Le parametre "country" est accepte mais sans effet pour l'instant : TMDB expose un
// "watch_region" sur /watch/providers/movie|tv qui filtre la disponibilite, pas la liste
// elle-meme. Comportement exact a clarifier plus tard si besoin (etape 16+).
export const GET: RequestHandler = async ({ url }) => {
	const typeParam = url.searchParams.get('type') ?? 'all';
	if (!PROVIDER_TYPES.includes(typeParam as ProviderType)) {
		badRequest('Le parametre "type" doit etre "movie", "tv" ou "all".');
	}
	const type = typeParam as ProviderType;

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
};
