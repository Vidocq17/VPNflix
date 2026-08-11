// Types du catalogue TMDB. Implementation detaillee : etape 7.

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
}

export interface TitleAvailability {
	country: WatchCountry;
	provider: WatchProvider;
}

export interface ProviderAvailabilityGroup {
	provider: WatchProvider;
	countries: WatchCountry[];
}
