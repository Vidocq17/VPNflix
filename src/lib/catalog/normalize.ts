// Normalisation des reponses TMDB en modeles internes. Fonctions pures, testees a l'etape 8.
import type {
	TmdbCountryProvidersRaw,
	TmdbProviderListResponse,
	TmdbProviderRaw,
	TmdbRegionsResponse,
	TmdbSearchResponse,
	TmdbSearchResultRaw,
	TmdbWatchProvidersResponse
} from './tmdb';
import type {
	CatalogSearchResult,
	ProviderAvailabilityGroup,
	WatchCountry,
	WatchProvider
} from './types';

/** Normalise un resultat de /search/multi|movie|tv. Ignore 'person' et les entrees sans titre exploitable. */
export function normalizeSearchResult(raw: TmdbSearchResultRaw): CatalogSearchResult | null {
	const mediaType = raw.media_type ?? (raw.title ? 'movie' : raw.name ? 'tv' : undefined);
	if (mediaType !== 'movie' && mediaType !== 'tv') return null;

	const title = mediaType === 'movie' ? raw.title : raw.name;
	if (!title) return null;

	const dateStr = mediaType === 'movie' ? raw.release_date : raw.first_air_date;
	const releaseYear = dateStr ? Number(dateStr.slice(0, 4)) : null;

	return {
		id: raw.id,
		mediaType,
		title,
		releaseYear: releaseYear && !Number.isNaN(releaseYear) ? releaseYear : null,
		posterPath: raw.poster_path,
		overview: raw.overview ?? ''
	};
}

export function normalizeSearchResults(
	response: TmdbSearchResponse | undefined
): CatalogSearchResult[] {
	if (!response?.results) return [];
	return response.results
		.map(normalizeSearchResult)
		.filter((result): result is CatalogSearchResult => result !== null);
}

function toWatchProvider(raw: TmdbProviderRaw): WatchProvider {
	return { id: raw.provider_id, name: raw.provider_name, logoPath: raw.logo_path };
}

export function sortProvidersByName<T extends { name: string }>(providers: T[]): T[] {
	return [...providers].sort((a, b) => a.name.localeCompare(b.name));
}

export function sortCountriesByName<T extends { name: string }>(countries: T[]): T[] {
	return [...countries].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Groupe les watch providers d'un titre par provider, avec les pays ou il est disponible
 * (flatrate/rent/buy confondus). Le nom de pays vient du code ISO (l'endpoint watch/providers
 * ne renvoie pas de nom lisible) ; a croiser avec normalizeRegions() cote appelant si un nom
 * complet est necessaire.
 */
export function groupWatchProvidersByProvider(
	response: TmdbWatchProvidersResponse | undefined
): ProviderAvailabilityGroup[] {
	if (!response?.results) return [];

	const groups = new Map<number, ProviderAvailabilityGroup>();

	for (const [countryCode, countryOffers] of Object.entries(response.results)) {
		const providersInCountry = collectProviders(countryOffers);
		for (const providerRaw of providersInCountry) {
			const provider = toWatchProvider(providerRaw);
			const country: WatchCountry = { code: countryCode, name: countryCode };
			const existing = groups.get(provider.id);
			if (existing) {
				if (!existing.countries.some((c) => c.code === country.code)) {
					existing.countries.push(country);
				}
			} else {
				groups.set(provider.id, { provider, countries: [country] });
			}
		}
	}

	return sortProvidersByGroupName(
		Array.from(groups.values()).map((group) => ({
			...group,
			countries: sortCountriesByName(group.countries)
		}))
	);
}

function sortProvidersByGroupName(
	groups: ProviderAvailabilityGroup[]
): ProviderAvailabilityGroup[] {
	return [...groups].sort((a, b) => a.provider.name.localeCompare(b.provider.name));
}

function collectProviders(countryOffers: TmdbCountryProvidersRaw): TmdbProviderRaw[] {
	const all = [
		...(countryOffers.flatrate ?? []),
		...(countryOffers.rent ?? []),
		...(countryOffers.buy ?? [])
	];
	const seen = new Map<number, TmdbProviderRaw>();
	for (const provider of all) seen.set(provider.provider_id, provider);
	return Array.from(seen.values());
}

/** Normalise la liste des pays supportes par TMDB, triee par nom. */
export function normalizeRegions(response: TmdbRegionsResponse | undefined): WatchCountry[] {
	if (!response?.results) return [];
	const countries = response.results.map((region) => ({
		code: region.iso_3166_1,
		name: region.english_name
	}));
	return sortCountriesByName(countries);
}

/** Normalise une liste de providers TMDB, triee par nom. */
export function normalizeProviderList(
	response: TmdbProviderListResponse | undefined
): WatchProvider[] {
	if (!response?.results) return [];
	return sortProvidersByName(response.results.map(toWatchProvider));
}
