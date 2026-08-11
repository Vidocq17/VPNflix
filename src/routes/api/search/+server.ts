import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// TODO(etape 9): brancher sur src/lib/catalog (TMDB /search/multi|movie|tv) + validation.
export const GET: RequestHandler = async () => {
	return json({ results: [] });
};
