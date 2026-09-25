// Enveloppe commune des endpoints publics : rate limit, erreurs generiques, logs sobres (etape 16).
// Pas de CORS : aucun header Access-Control-* n'est envoye, et seul GET est exporte par les routes.
import { json, type RequestEvent, type RequestHandler } from '@sveltejs/kit';
import { isRateLimited } from '$lib/security/rate-limit';

/** Erreur de validation : repond 400 generique. */
export class BadRequest extends Error {}

export const errorResponse = (status: number, error: string) => json({ error }, { status });

/** Appel TMDB : logge le type d'erreur cote serveur, jamais de detail cote client. */
export async function callTmdb<T>(fn: () => Promise<T>): Promise<T> {
	try {
		return await fn();
	} catch (err) {
		throw new TmdbUnavailable(err instanceof Error ? err.message : 'unknown', { cause: err });
	}
}
class TmdbUnavailable extends Error {}

export function publicHandler(
	bucket: string,
	limitPerMinute: number,
	fn: (event: RequestEvent) => Promise<Response>
): RequestHandler {
	return async (event) => {
		const route = event.route.id;
		if (isRateLimited(`${bucket}:${event.getClientAddress()}`, limitPerMinute)) {
			console.warn(`[api] ${route} 429`);
			return errorResponse(429, 'Trop de requetes. Reessaie dans quelques instants.');
		}
		try {
			return await fn(event);
		} catch (err) {
			if (err instanceof BadRequest) return errorResponse(400, 'Requete invalide.');
			// Message TMDB = "TMDB request failed: <status> <path>" : pas de token ni de corps.
			console.error(`[api] ${route} 502 ${err instanceof Error ? err.name : 'Error'}`);
			return errorResponse(502, 'Service indisponible. Reessaie plus tard.');
		}
	};
}
