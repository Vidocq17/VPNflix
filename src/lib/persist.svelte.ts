// Persistance localStorage cote client uniquement (aucun acces au module hors navigateur, tout est
// en try/catch). Les stores sont vides au SSR ; `load()` est appele au montage (+layout.svelte).
import { z } from 'zod';
import type { CatalogSearchResult } from '$lib/catalog/types';

const FILTERS_KEY = 'vpnflix:filters';
const BROWSE_KEY = (page: BrowsePage) => `vpnflix:filters:${page}`;
export const MAX_EXCLUDED = 200; // = limite zod de `exclude` (validation.ts)
const EXCLUDED_KEY = 'vpnflix:excluded-providers';
const FAVORITES_KEY = 'vpnflix:favorites';
const MAX_FAVORITES = 200;

export const filtersSchema = z.object({
	type: z.enum(['all', 'movie', 'tv']),
	country: z.string().regex(/^([A-Za-z]{2})?$/),
	providers: z.array(z.string().regex(/^[1-9]\d{0,9}$/)).max(100)
});
export type SavedFilters = z.infer<typeof filtersSchema>;

// Filtres des pages /movies et /series : une cle par page.
export type BrowsePage = 'movies' | 'series';
export const browseFiltersSchema = z.object({
	genres: z.array(z.string().regex(/^[1-9]\d{0,9}$/)).max(20),
	yearFrom: z.string().regex(/^((19|20)\d{2})?$/),
	yearTo: z.string().regex(/^((19|20)\d{2})?$/),
	country: z.string().regex(/^([A-Za-z]{2})?$/),
	providers: z.array(z.string().regex(/^[1-9]\d{0,9}$/)).max(100)
});
export type BrowseFilters = z.infer<typeof browseFiltersSchema>;

export const favoriteSchema = z.object({
	mediaType: z.enum(['movie', 'tv']),
	id: z.number().int().positive(),
	title: z.string().min(1).max(300),
	posterPath: z.string().max(200).nullable()
});
export type Favorite = z.infer<typeof favoriteSchema>;

function read<T>(key: string, schema: z.ZodType<T>): T | null {
	try {
		const raw = localStorage.getItem(key);
		const parsed = schema.safeParse(raw && JSON.parse(raw));
		return parsed.success ? parsed.data : null;
	} catch {
		return null;
	}
}

function write(key: string, value: unknown) {
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch {
		// stockage indisponible ou plein : la persistance est un confort, on ignore.
	}
}

export const loadFilters = () => read(FILTERS_KEY, filtersSchema);
export const saveFilters = (filters: SavedFilters) => write(FILTERS_KEY, filters);

export const loadBrowseFilters = (page: BrowsePage) => read(BROWSE_KEY(page), browseFiltersSchema);
export const saveBrowseFilters = (page: BrowsePage, f: BrowseFilters) => write(BROWSE_KEY(page), f);

class Favorites {
	items = $state<Favorite[]>([]);

	load() {
		// Une entree invalide invalide toute la liste (donnees corrompues -> on repart de zero).
		this.items = read(FAVORITES_KEY, z.array(favoriteSchema).max(MAX_FAVORITES)) ?? [];
	}

	has(mediaType: string, id: number) {
		return this.items.some((f) => f.mediaType === mediaType && f.id === id);
	}

	toggle(r: Pick<CatalogSearchResult, 'mediaType' | 'id' | 'title' | 'posterPath'>) {
		this.items = this.has(r.mediaType, r.id)
			? this.items.filter((f) => !(f.mediaType === r.mediaType && f.id === r.id))
			: [
					{ mediaType: r.mediaType, id: r.id, title: r.title, posterPath: r.posterPath },
					...this.items
				].slice(0, MAX_FAVORITES);
		write(FAVORITES_KEY, this.items);
	}
}

export const favorites = new Favorites();

export const excludedSchema = z.array(z.string().regex(/^[1-9]\d{0,9}$/)).max(MAX_EXCLUDED);

// Plateformes exclues (globalement) : ids TMDB, tous les ids equivalents d'une plateforme fusionnee.
class Excluded {
	ids = $state<string[]>([]);
	loaded = $state(false);

	load() {
		this.ids = read(EXCLUDED_KEY, excludedSchema) ?? [];
		this.loaded = true;
	}

	has(id: number) {
		return this.ids.includes(String(id));
	}

	toggle(p: { id: number; ids?: number[] }) {
		const all = (p.ids ?? [p.id]).map(String);
		this.ids = this.has(p.id)
			? this.ids.filter((x) => !all.includes(x))
			: [...new Set([...this.ids, ...all])].slice(0, MAX_EXCLUDED);
		write(EXCLUDED_KEY, this.ids);
	}

	/** Exclut toutes les plateformes (ids fusionnes inclus), plafonne a MAX_EXCLUDED ids (limite zod/URL) ; renvoie true si tronque. */
	excludeAll(providers: { id: number; ids?: number[] }[]) {
		const all = [...new Set(providers.flatMap((p) => (p.ids ?? [p.id]).map(String)))];
		this.ids = all.slice(0, MAX_EXCLUDED);
		write(EXCLUDED_KEY, this.ids);
		return all.length > MAX_EXCLUDED;
	}

	clear() {
		this.ids = [];
		write(EXCLUDED_KEY, this.ids);
	}
}

export const excluded = new Excluded();
