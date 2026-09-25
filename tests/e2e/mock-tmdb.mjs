// Preload Node (--import) du serveur de preview : stubbe api.themoviedb.org cote serveur.
// page.route ne voit pas les fetch faits pendant le SSR / dans les load server-only.
const json = (body) =>
	new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } });
const p = (id, name) => ({ provider_id: id, provider_name: name, logo_path: null });
const NETFLIX = p(8, 'Netflix');
const PRIME = p(9, 'Prime Video');

const inception = {
	id: 27205,
	title: 'Inception',
	release_date: '2010-07-16',
	poster_path: null,
	overview: 'Un reve dans un reve.'
};
const bb = {
	id: 1396,
	name: 'Breaking Bad',
	first_air_date: '2008-01-20',
	poster_path: null,
	overview: 'Un prof de chimie.'
};

const routes = {
	'/search/movie': { results: [inception] },
	'/search/tv': { results: [bb] },
	'/search/multi': {
		results: [
			{ ...inception, media_type: 'movie' },
			{ ...bb, media_type: 'tv' }
		]
	},
	'/movie/27205': inception,
	'/tv/1396': bb,
	'/movie/27205/watch/providers': {
		id: 27205,
		results: {
			FR: { flatrate: [NETFLIX, PRIME] },
			US: { flatrate: [NETFLIX] },
			DE: { rent: [PRIME] }
		}
	},
	'/tv/1396/watch/providers': { id: 1396, results: { FR: { flatrate: [NETFLIX] } } },
	'/watch/providers/regions': {
		results: [
			{ iso_3166_1: 'FR', english_name: 'France' },
			{ iso_3166_1: 'US', english_name: 'United States' },
			{ iso_3166_1: 'DE', english_name: 'Germany' }
		]
	},
	'/watch/providers/movie': { results: [NETFLIX, PRIME] },
	'/watch/providers/tv': { results: [NETFLIX] }
};

const realFetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
	const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
	if (url.hostname !== 'api.themoviedb.org') return realFetch(input, init);
	const body = routes[url.pathname.replace(/^\/3/, '')];
	return Promise.resolve(body ? json(body) : new Response('{}', { status: 404 }));
};
