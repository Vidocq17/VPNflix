// Client Supabase pour `load` serveur et endpoints `+server.ts`.
import { createServerClient } from '@supabase/ssr';
import type { RequestEvent } from '@sveltejs/kit';
import { publicEnv } from '$lib/env';

export function createSupabaseServerClient(event: RequestEvent) {
	return createServerClient(publicEnv.PUBLIC_SUPABASE_URL, publicEnv.PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookiesToSet) => {
				cookiesToSet.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, { ...options, path: '/' });
				});
			}
		}
	});
}
