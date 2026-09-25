// Offres de streaming des resultats de recherche (TMDB /search ne les renvoie pas).
// Cout : jusqu'a MAX_LOOKUPS appels TMDB /watch/providers par recherche filtree, CONCURRENCY en
// parallele, mis en cache memoire TTL_MS (par instance, comme le rate limit). Compromis : seuls
// les MAX_LOOKUPS premiers resultats (les plus pertinents) sont evalues quand un filtre est actif.
import {
	getMovieWatchProviders,
	getTvWatchProviders,
	offersByCountry,
	type CatalogSearchResult
} from '$lib/catalog';

export const MAX_LOOKUPS = 12;
const CONCURRENCY = 4;
const TTL_MS = 10 * 60_000;
const MAX_ENTRIES = 500;

type Offers = Record<string, number[]>;
const cache = new Map<string, { offers: Offers; expires: number }>();

export const clearAvailabilityCache = () => cache.clear();

type Lookup = (r: CatalogSearchResult) => Promise<Offers>;
const tmdbLookup: Lookup = async (r) =>
	offersByCountry(
		await (r.mediaType === 'movie' ? getMovieWatchProviders : getTvWatchProviders)(r.id)
	);

/**
 * Offres des MAX_LOOKUPS premiers resultats, cle `${mediaType}:${id}`. Un lookup en echec donne
 * `null` (titre ecarte par le filtre) ; si tous echouent, l'erreur est relancee (-> 502).
 */
export async function loadOffers(
	results: CatalogSearchResult[],
	lookup: Lookup = tmdbLookup,
	now = Date.now()
): Promise<Map<string, Offers | null>> {
	const out = new Map<string, Offers | null>();
	const todo = results.slice(0, MAX_LOOKUPS);
	let firstError: unknown;
	let failures = 0;
	let next = 0;
	const worker = async () => {
		while (next < todo.length) {
			const r = todo[next++];
			const key = `${r.mediaType}:${r.id}`;
			const hit = cache.get(key);
			if (hit && hit.expires > now) {
				out.set(key, hit.offers);
				continue;
			}
			try {
				const offers = await lookup(r);
				cache.delete(key);
				cache.set(key, { offers, expires: now + TTL_MS });
				if (cache.size > MAX_ENTRIES) cache.delete(cache.keys().next().value!);
				out.set(key, offers);
			} catch (err) {
				failures++;
				firstError ??= err;
				out.set(key, null);
			}
		}
	};
	await Promise.all(Array.from({ length: Math.min(CONCURRENCY, todo.length) }, worker));
	if (todo.length > 0 && failures === todo.length) throw firstError;
	return out;
}
