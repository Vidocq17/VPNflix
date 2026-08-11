import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	getMovieWatchProviders,
	getTvWatchProviders,
	getWatchProviderRegions,
	groupWatchProvidersByProvider,
	normalizeRegions
} from '$lib/catalog';
import { badRequest, callTmdb } from '../../../../api-error';

export const GET: RequestHandler = async ({ params, url }) => {
	const { mediaType, id } = params;
	if (mediaType !== 'movie' && mediaType !== 'tv') {
		badRequest('Le parametre "mediaType" doit etre "movie" ou "tv".');
	}

	const titleId = Number(id);
	if (!Number.isInteger(titleId) || titleId <= 0) {
		badRequest('Le parametre "id" doit etre un entier positif.');
	}

	const getProviders = mediaType === 'movie' ? getMovieWatchProviders : getTvWatchProviders;
	const [providersResponse, regionsResponse] = await Promise.all([
		callTmdb(() => getProviders(titleId)),
		callTmdb(() => getWatchProviderRegions())
	]);

	const countryNames = new Map(normalizeRegions(regionsResponse).map((c) => [c.code, c.name]));
	let groups = groupWatchProvidersByProvider(providersResponse).map((group) => ({
		...group,
		countries: group.countries.map((country) => ({
			...country,
			name: countryNames.get(country.code) ?? country.name
		}))
	}));

	const countriesFilter = url.searchParams.get('countries');
	if (countriesFilter) {
		const allowed = new Set(countriesFilter.split(',').map((c) => c.trim().toUpperCase()));
		groups = groups
			.map((group) => ({
				...group,
				countries: group.countries.filter((c) => allowed.has(c.code.toUpperCase()))
			}))
			.filter((group) => group.countries.length > 0);
	}

	const providersFilter = url.searchParams.get('providers');
	if (providersFilter) {
		const allowed = new Set(providersFilter.split(',').map((p) => Number(p.trim())));
		groups = groups.filter((group) => allowed.has(group.provider.id));
	}

	return json({ groups });
};
