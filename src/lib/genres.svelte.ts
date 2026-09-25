// Noms de genres (movie/tv) pour les posters et fiches : 2 appels a /api/genres au montage du
// layout. Les resultats ne portent que des ids (genre_ids) ; sans noms, aucun genre n'est affiche.
import type { CatalogSearchResult, Genre } from '$lib/catalog/types';

class GenreNames {
	names = $state<Record<string, string>>({});

	async load(fetcher: typeof fetch = fetch) {
		for (const type of ['movie', 'tv']) {
			try {
				const res = await fetcher(`/api/genres?type=${type}`);
				if (!res.ok) continue;
				const { genres }: { genres: Genre[] } = await res.json();
				for (const g of genres) this.names[`${type}:${g.id}`] = g.name;
			} catch {
				// genres non affiches
			}
		}
	}

	/** Jusqu'a `max` noms de genres du titre. */
	labels(r: Pick<CatalogSearchResult, 'mediaType' | 'genreIds'>, max = 2): string[] {
		return (r.genreIds ?? [])
			.map((id) => this.names[`${r.mediaType}:${id}`])
			.filter(Boolean)
			.slice(0, max);
	}
}

export const genreNames = new GenreNames();
