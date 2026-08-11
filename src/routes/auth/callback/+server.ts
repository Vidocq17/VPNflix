import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// TODO(etape 6): echanger le code magic link contre une session Supabase.
export const GET: RequestHandler = async () => {
	redirect(303, '/');
};
