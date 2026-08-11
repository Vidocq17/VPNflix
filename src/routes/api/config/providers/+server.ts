import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// TODO(etape 9): brancher sur src/lib/catalog (TMDB /watch/providers/movie|tv).
export const GET: RequestHandler = async () => {
	return json({ providers: [] });
};
