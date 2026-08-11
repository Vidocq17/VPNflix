import type { Handle } from '@sveltejs/kit';

// TODO(etape 6): rafraichir la session Supabase et exposer l'utilisateur dans event.locals.
export const handle: Handle = async ({ event, resolve }) => {
	return resolve(event);
};
