import { publicEnv } from '$lib/env';

// Pages publiques stables uniquement (pas d'API, pas de resultats de recherche).
const PATHS = ['/', '/movies', '/series', '/legal', '/privacy'];

export const GET = () => {
	const base = publicEnv.PUBLIC_APP_URL.replace(/\/$/, '');
	const urls = PATHS.map((p) => `<url><loc>${base}${p === '/' ? '/' : p}</loc></url>`).join('');
	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
		{ headers: { 'Content-Type': 'application/xml' } }
	);
};
