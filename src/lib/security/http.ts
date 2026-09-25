import type { Config } from '@sveltejs/kit';

type CspDirectives = NonNullable<NonNullable<Config['kit']>['csp']>['directives'];

// Headers de securite (etape 16), appliques dans hooks.server.ts.
export const SECURITY_HEADERS: Record<string, string> = {
	'X-Content-Type-Options': 'nosniff',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'X-Frame-Options': 'DENY',
	'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

// Fournie a `kit.csp` (SvelteKit ajoute les hashes des scripts inline).
export const CSP_DIRECTIVES: CspDirectives = {
	'default-src': ['self'],
	'script-src': ['self'],
	'style-src': ['self', 'unsafe-inline'],
	'img-src': ['self', 'https://image.tmdb.org', 'data:'],
	'connect-src': ['self', 'https://api.themoviedb.org'],
	'frame-ancestors': ['none'],
	'base-uri': ['self'],
	'form-action': ['self']
};
