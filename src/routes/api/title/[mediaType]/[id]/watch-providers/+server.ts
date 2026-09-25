import { json } from '@sveltejs/kit';
import {
	getMovieWatchProviders,
	getTvWatchProviders,
	getWatchProviderRegions,
	groupWatchProvidersByProvider,
	normalizeRegions
} from '$lib/catalog';
import { BadRequest, callTmdb, publicHandler } from '$lib/server/response';
import { parse, searchParamsObject, watchProvidersSchema } from '$lib/security/validation';

export const GET = publicHandler('watch-providers', 60, async ({ params, url }) => {
	const raw = searchParamsObject(url.searchParams);
	const parsed = raw && parse(watchProvidersSchema, { ...raw, ...params });
	if (!parsed) throw new BadRequest();
	const { mediaType, id: titleId, countries, providers } = parsed;

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

	if (countries) {
		const allowed = new Set(countries.map((c) => c.toUpperCase()));
		groups = groups
			.map((group) => ({
				...group,
				countries: group.countries.filter((c) => allowed.has(c.code.toUpperCase()))
			}))
			.filter((group) => group.countries.length > 0);
	}

	if (providers) {
		const allowed = new Set(providers);
		groups = groups.filter((group) => allowed.has(group.provider.id));
	}

	return json({ groups });
});
