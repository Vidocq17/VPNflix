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
	overview: 'Un reve dans un reve.',
	vote_average: 8.36,
	genre_ids: [28]
};
const bb = {
	id: 1396,
	name: 'Breaking Bad',
	first_air_date: '2008-01-20',
	poster_path: null,
	overview: 'Un prof de chimie.',
	vote_average: 8.9,
	genre_ids: [18]
};

const dune = {
	id: 693134,
	title: 'Dune Deuxieme Partie',
	release_date: '2024-02-27',
	poster_path: null,
	overview: '',
	vote_average: 8.2,
	genre_ids: [28, 35]
};
const severance = {
	id: 95396,
	name: 'Severance',
	first_air_date: '2022-02-17',
	poster_path: null,
	overview: '',
	vote_average: 0, // pas de vote : aucune note affichee
	genre_ids: [18]
};

const routes = {
	'/movie/popular': { results: [dune, inception] },
	'/tv/popular': { results: [severance, bb] },
	'/search/movie': { results: [inception] },
	'/search/tv': { results: [bb] },
	'/search/multi': {
		results: [
			{ ...inception, media_type: 'movie' },
			{ ...bb, media_type: 'tv' }
		]
	},
	// La fiche (/movie/{id}) renvoie `genres` ([{id,name}]) et non `genre_ids`.
	'/movie/27205': { ...inception, genre_ids: undefined, genres: [{ id: 28, name: 'Action' }] },
	// Videos : Vimeo et clip ignores ; trailer officiel prefere au teaser. /tv/1396/videos -> 404.
	'/movie/27205/videos': {
		results: [
			{ site: 'Vimeo', key: 'vimeovimeo1', type: 'Trailer', official: true },
			{ site: 'YouTube', key: 'teaser_____', type: 'Teaser', official: true },
			{ site: 'YouTube', key: 'clip_______', type: 'Clip', official: true },
			{
				site: 'YouTube',
				key: 'YoHD9XEInc0',
				type: 'Trailer',
				official: true,
				name: 'Official Trailer'
			}
		]
	},
	'/movie/27205/similar': { results: [dune] },
	'/tv/1396/similar': { results: [severance] },
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
	'/watch/providers/movie': { results: [NETFLIX, PRIME, p(119, 'Prime Video')] },
	'/watch/providers/tv': { results: [NETFLIX] }
};

// discover : la reponse depend des filtres recus (les params sont renvoyes dans `debug_params`).
const discover = (type, url) => {
	const q = url.searchParams;
	const [a, b] = type === 'movie' ? [dune, inception] : [severance, bb];
	let all = q.get('with_genres') === '28' ? [a] : q.get('page') === '2' ? [b] : [a, b];
	// Le tri recu de l'app (sort_by) est applique : *.asc inverse l'ordre.
	if ((q.get('sort_by') ?? '').endsWith('.asc')) all = [...all].reverse();
	return { results: all, total_pages: 2, debug_params: Object.fromEntries(q) };
};
const genres = (type) => ({
	genres:
		type === 'movie'
			? [
					{ id: 28, name: 'Action' },
					{ id: 35, name: 'Comedie' }
				]
			: [{ id: 18, name: 'Drame' }]
});

const realFetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
	const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
	if (url.hostname !== 'api.themoviedb.org') return realFetch(input, init);
	const path = url.pathname.replace(/^\/3/, '');
	const d = path.match(/^\/discover\/(movie|tv)$/);
	const g = path.match(/^\/genre\/(movie|tv)\/list$/);
	const body = d ? discover(d[1], url) : g ? genres(g[1]) : routes[path];
	return Promise.resolve(body ? json(body) : new Response('{}', { status: 404 }));
};
