// Types du catalogue TMDB (modeles internes, independants de la forme brute des reponses TMDB).

export type MediaType = 'movie' | 'tv';

export interface CatalogSearchResult {
	id: number;
	mediaType: MediaType;
	title: string;
	releaseYear: number | null;
	posterPath: string | null;
	overview: string;
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
	page: number;
}
