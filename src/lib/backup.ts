// Export / import JSON des donnees locales (favoris, listes, filtres, plateformes exclues).
// 100 % navigateur : rien n'est envoye au serveur. Le fichier importe est valide en bloc (zod
// strict, taille max) avant toute ecriture ; une erreur ne modifie rien.
import { z } from 'zod';
import {
	browseFiltersSchema,
	excluded,
	excludedSchema,
	favoriteSchema,
	favorites,
	filtersSchema,
	loadBrowseFilters,
	loadFilters,
	MAX_LIST,
	saveBrowseFilters,
	saveFilters,
	seen,
	watchlist
} from '$lib/persist.svelte';

export const MAX_BACKUP_BYTES = 512 * 1024;

const titleList = z.array(favoriteSchema.strict()).max(MAX_LIST);

export const backupSchema = z.strictObject({
	app: z.literal('vpnflix'),
	version: z.literal(1),
	favorites: titleList,
	watchlist: titleList,
	seen: titleList,
	hideSeen: z.boolean(),
	excluded: excludedSchema,
	// null = jamais renseigne : l'import laisse la valeur locale inchangee
	filters: filtersSchema.strict().nullable(),
	browse: z.strictObject({
		movies: browseFiltersSchema.strict().nullable(),
		series: browseFiltersSchema.strict().nullable()
	})
});
export type Backup = z.infer<typeof backupSchema>;

export function buildBackup(): Backup {
	return {
		app: 'vpnflix',
		version: 1,
		favorites: favorites.items,
		watchlist: watchlist.items,
		seen: seen.items,
		hideSeen: seen.hide,
		excluded: excluded.ids,
		filters: loadFilters(),
		browse: { movies: loadBrowseFilters('movies'), series: loadBrowseFilters('series') }
	};
}

export type ParsedBackup = { ok: true; data: Backup } | { ok: false; error: string };

/** Valide le contenu texte d'un fichier de sauvegarde. Message d'erreur destine a l'utilisateur. */
export function parseBackup(text: string): ParsedBackup {
	if (text.length > MAX_BACKUP_BYTES) return { ok: false, error: 'Fichier trop volumineux.' };
	let json: unknown;
	try {
		json = JSON.parse(text);
	} catch {
		return { ok: false, error: "Ce fichier n'est pas du JSON valide." };
	}
	const result = backupSchema.safeParse(json);
	if (!result.success) {
		const path = result.error.issues[0]?.path.join('.') || 'racine';
		return { ok: false, error: `Fichier de sauvegarde VPNflix invalide (champ : ${path}).` };
	}
	return { ok: true, data: result.data };
}

export function applyBackup(b: Backup) {
	favorites.replace(b.favorites);
	watchlist.replace(b.watchlist);
	seen.replace(b.seen);
	seen.setHide(b.hideSeen);
	excluded.replace(b.excluded);
	if (b.filters) saveFilters(b.filters);
	if (b.browse.movies) saveBrowseFilters('movies', b.browse.movies);
	if (b.browse.series) saveBrowseFilters('series', b.browse.series);
}
