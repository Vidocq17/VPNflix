import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// TODO(etape 9): brancher sur src/lib/catalog (TMDB /watch/providers/regions).
export const GET: RequestHandler = async () => {
	return json({ countries: [] });
};
