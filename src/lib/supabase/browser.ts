// Client Supabase pour composants client (navigateur).
import { createBrowserClient } from '@supabase/ssr';
import { publicEnv } from '$lib/env';

export const supabase = createBrowserClient(
	publicEnv.PUBLIC_SUPABASE_URL,
	publicEnv.PUBLIC_SUPABASE_ANON_KEY
);
