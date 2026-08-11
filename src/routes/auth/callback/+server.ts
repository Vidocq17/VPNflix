import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Route de retour apres magic link : echange le code PKCE contre une session.
export const GET: RequestHandler = async (event) => {
	const code = event.url.searchParams.get('code');
	const next = event.url.searchParams.get('next') ?? '/';

	if (code) {
		const { error } = await event.locals.supabase.auth.exchangeCodeForSession(code);
		if (!error) {
			redirect(303, next);
		}
	}

	redirect(303, '/');
};
