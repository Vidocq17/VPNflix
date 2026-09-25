// Types du catalogue TMDB (modeles internes, independants de la forme brute des reponses TMDB).

export type MediaType = 'movie' | 'tv';

export interface CatalogSearchResult {
	id: number;
	mediaType: MediaType;
	title: string;
	releaseYear: number | null;
	posterPath: string | null;
	overview: string;
	/** Note TMDB (0-10, 1 decimale) ; absente si le titre n'a pas de vote. */
	voteAverage?: number;
	/** Ids de genres TMDB ; les noms viennent de /api/genres (voir $lib/genres.svelte). */
	genreIds?: number[];
}

export interface WatchCountry {
	code: string;
	name: string;
}

export interface WatchProvider {
	id: number;
	name: string;
	logoPath: string | null;
	/** Ids TMDB equivalents (meme plateforme, ids distincts), `id` inclus. */
	ids?: number[];
}

export interface TitleAvailability {
	country: WatchCountry;
	provider: WatchProvider;
}

export interface ProviderAvailabilityGroup {
	provider: WatchProvider;
	countries: WatchCountry[];
}

export interface Genre {
	id: number;
	name: string;
}

export const SORT_KEYS = [
	'popularity.desc',
	'popularity.asc',
	'vote_average.desc',
	'vote_average.asc',
	'release.desc',
	'release.asc'
] as const;
/** Tri de /movies et /series ; `release` devient primary_release_date / first_air_date selon le type. */
export type SortKey = (typeof SORT_KEYS)[number];

export interface DiscoverFilters {
	genres: number[];
	yearFrom?: number;
	yearTo?: number;
	/** Pays de disponibilite (watch_region TMDB), code ISO 3166-1. */
	country?: string;
	/** Plateformes (with_watch_providers) : n'ont d'effet qu'avec `country`. */
	providers: number[];
	/** Plateformes exclues (without_watch_providers) : n'ont d'effet qu'avec `country`. */
	exclude?: number[];
	sort?: SortKey;
	page: number;
}

/** Bande-annonce YouTube (cle validee : 11 caracteres [\w-]). */
export interface Trailer {
	key: string;
	name: string;
}
