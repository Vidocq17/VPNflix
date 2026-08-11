// Helper minimal partage par les endpoints API (etape 9). Pas de zod/rate-limit ici (etape 16).
import { error } from '@sveltejs/kit';

/** 400 : parametre(s) invalide(s) fourni(s) par le client. */
export function badRequest(message: string): never {
	error(400, message);
}

/** Execute un appel TMDB ($lib/catalog) et convertit tout echec en 502. */
export async function callTmdb<T>(fn: () => Promise<T>): Promise<T> {
	try {
		return await fn();
	} catch (err) {
		error(502, `TMDB indisponible: ${err instanceof Error ? err.message : String(err)}`);
	}
}
