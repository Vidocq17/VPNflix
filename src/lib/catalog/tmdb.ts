// Client TMDB. Fetch natif, pas de SDK tiers, pas de retry/cache/rate-limit (etape 16 si besoin).
import { serverEnv } from '$lib/env';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

async function tmdbFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
	const url = new URL(`${TMDB_BASE_URL}${path}`);
	for (const [key, value] of Object.entries(params ?? {})) {
		url.searchParams.set(key, value);
	}

	const response = await fetch(url, {
		headers: {
			Authorization: `Bearer ${serverEnv.TMDB_ACCESS_TOKEN}`,
			accept: 'application/json'
		}
	});

	if (!response.ok) {
		throw new Error(`TMDB request failed: ${response.status} ${path}`);
	}

	return response.json() as Promise<T>;
}

// -- Types TMDB bruts minimaux (uniquement les champs utilises) --

export interface TmdbSearchResultRaw {
	id: number;
	media_type?: 'movie' | 'tv' | 'person';
	title?: string;
	name?: string;
	release_date?: string;
	first_air_date?: string;
	poster_path: string | null;
	overview?: string;
}

export interface TmdbSearchResponse {
	results: TmdbSearchResultRaw[];
}

export interface TmdbProviderRaw {
	provider_id: number;
	provider_name: string;
	logo_path: string | null;
}

export interface TmdbCountryProvidersRaw {
	link?: string;
	flatrate?: TmdbProviderRaw[];
	rent?: TmdbProviderRaw[];
	buy?: TmdbProviderRaw[];
}

export interface TmdbWatchProvidersResponse {
	id: number;
	results: Record<string, TmdbCountryProvidersRaw>;
}

export interface TmdbRegionRaw {
	iso_3166_1: string;
	english_name: string;
	native_name?: string;
}

export interface TmdbRegionsResponse {
	results: TmdbRegionRaw[];
}

export interface TmdbProviderListResponse {
	results: TmdbProviderRaw[];
}

// -- Recherche --

export function searchMulti(query: string): Promise<TmdbSearchResponse> {
	return tmdbFetch<TmdbSearchResponse>('/search/multi', { query });
}

export function searchMovies(query: string): Promise<TmdbSearchResponse> {
	return tmdbFetch<TmdbSearchResponse>('/search/movie', { query });
}

export function searchTv(query: string): Promise<TmdbSearchResponse> {
	return tmdbFetch<TmdbSearchResponse>('/search/tv', { query });
}

// -- Watch providers d'un titre --

export function getMovieWatchProviders(movieId: number): Promise<TmdbWatchProvidersResponse> {
	return tmdbFetch<TmdbWatchProvidersResponse>(`/movie/${movieId}/watch/providers`);
}

export function getTvWatchProviders(seriesId: number): Promise<TmdbWatchProvidersResponse> {
	return tmdbFetch<TmdbWatchProvidersResponse>(`/tv/${seriesId}/watch/providers`);
}

// -- Listes de reference --

export function getWatchProviderRegions(): Promise<TmdbRegionsResponse> {
	return tmdbFetch<TmdbRegionsResponse>('/watch/providers/regions');
}

export function getMovieWatchProviderList(): Promise<TmdbProviderListResponse> {
	return tmdbFetch<TmdbProviderListResponse>('/watch/providers/movie');
}

export function getTvWatchProviderList(): Promise<TmdbProviderListResponse> {
	return tmdbFetch<TmdbProviderListResponse>('/watch/providers/tv');
}
