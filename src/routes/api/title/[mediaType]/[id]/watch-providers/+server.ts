import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// TODO(etape 9): brancher sur src/lib/catalog (TMDB /movie|tv/{id}/watch/providers) + validation.
export const GET: RequestHandler = async () => {
	return json({ groups: [] });
};
