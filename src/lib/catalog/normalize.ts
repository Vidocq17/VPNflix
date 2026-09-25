// Normalisation des reponses TMDB en modeles internes. Fonctions pures, testees a l'etape 8.
import type {
	TmdbCountryProvidersRaw,
	TmdbGenresResponse,
	TmdbProviderListResponse,
	TmdbProviderRaw,
	TmdbRegionsResponse,
	TmdbSearchResponse,
	TmdbSearchResultRaw,
	TmdbWatchProvidersResponse
} from './tmdb';
import type {
	CatalogSearchResult,
	DiscoverFilters,
	Genre,
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

export function normalizeGenres(response: TmdbGenresResponse | undefined): Genre[] {
	return [...(response?.genres ?? [])].sort((a, b) => a.name.localeCompare(b.name));
}

// TMDB plafonne discover a 500 pages.
export const MAX_DISCOVER_PAGE = 500;

/**
 * Filtres -> parametres TMDB discover. Semantique : genres en ET ("," ) ; pays = watch_region
 * (pays de disponibilite, comme la recherche) ; plateformes = with_watch_providers (OU) dans ce
 * pays, ignorees sans pays (TMDB exige watch_region) ; pays seul = titres disponibles dans ce pays.
 */
export function buildDiscoverParams(
	type: 'movie' | 'tv',
	f: DiscoverFilters
): Record<string, string> {
	const dateKey = type === 'movie' ? 'primary_release_date' : 'first_air_date';
	const p: Record<string, string> = { sort_by: 'popularity.desc', page: String(f.page) };
	if (f.genres.length) p.with_genres = f.genres.join(',');
	if (f.yearFrom) p[`${dateKey}.gte`] = `${f.yearFrom}-01-01`;
	if (f.yearTo) p[`${dateKey}.lte`] = `${f.yearTo}-12-31`;
	if (f.country) {
		p.watch_region = f.country.toUpperCase();
		if (f.providers.length) p.with_watch_providers = f.providers.join('|');
		else p.with_watch_monetization_types = 'flatrate|free|ads|rent|buy';
		if (f.exclude?.length) p.without_watch_providers = f.exclude.join('|');
	}
	return p;
}

// Ids TMDB des plateformes principales, dans l'ordre d'affichage : Netflix, Prime Video (x2),
// Disney+, Max (x2), Apple TV+, Canal+, Paramount+, Crunchyroll, YouTube, Hulu.
const MAIN_PROVIDER_IDS = [8, 119, 9, 337, 1899, 384, 350, 381, 531, 283, 192, 15];
const mainRank = (id: number) => {
	const i = MAIN_PROVIDER_IDS.indexOf(id);
	return i === -1 ? MAIN_PROVIDER_IDS.length : i;
};

/**
 * Liste de plateformes pour les filtres : fusionne les doublons de nom (TMDB a plusieurs ids pour
 * une meme plateforme, ex. "Amazon Prime Video"), puis remonte les principales en tete ; le reste
 * garde son ordre. L'entree gardee (id principal) porte tous les ids equivalents dans `ids` :
 * les filtres par id doivent tous les envoyer (voir `expandProviderIds`).
 */
export function prioritizeProviders(providers: WatchProvider[]): WatchProvider[] {
	const byName = new Map<string, WatchProvider>();
	for (const p of providers) {
		const key = p.name.trim().toLowerCase();
		const kept = byName.get(key);
		if (!kept) {
			byName.set(key, { ...p, ids: [p.id] });
			continue;
		}
		const ids = [...kept.ids!, p.id].sort((a, b) => a - b);
		const id = ids.reduce((best, x) => (mainRank(x) < mainRank(best) ? x : best), ids[0]);
		byName.set(key, { ...kept, id, ids });
	}
	// tri stable : hors principales, l'ordre d'origine est conserve
	return [...byName.values()].sort((a, b) => mainRank(a.id) - mainRank(b.id));
}

/** Ids selectionnes (ids principaux du formulaire) -> tous les ids TMDB equivalents. */
export function expandProviderIds(selected: string[], providers: WatchProvider[]): number[] {
	const ids = new Map(providers.map((p) => [String(p.id), p.ids ?? [p.id]]));
	return [...new Set(selected.flatMap((id) => ids.get(id) ?? [Number(id)]))];
}

/** Titres similaires : mediaType force (les reponses /similar n'ont pas de media_type), max 12. */
export function normalizeSimilar(
	response: TmdbSearchResponse | undefined,
	mediaType: 'movie' | 'tv'
): CatalogSearchResult[] {
	return normalizeSearchResults(response)
		.map((r) => ({ ...r, mediaType }))
		.slice(0, 12);
}
