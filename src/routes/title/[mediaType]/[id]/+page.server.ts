// Page detail d'un titre (etape 11). Pas d'endpoint /api/title/[mediaType]/[id] dedie aux
// metadonnees (hero) dans etapes.md -> on appelle $lib/catalog directement ici (load server-only,
// serverEnv reste hors du bundle client) plutot que d'ajouter un nouvel endpoint public.
// Les watch providers, eux, passent par l'endpoint existant /api/title/.../watch-providers
// comme demande dans etapes.md.
import { error } from '@sveltejs/kit';
import { getMovieDetails, getTvDetails, normalizeSearchResult } from '$lib/catalog';
import type { ProviderAvailabilityGroup } from '$lib/catalog/types';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch }) => {
	const { mediaType, id } = params;
	if (mediaType !== 'movie' && mediaType !== 'tv') {
		error(400, 'Type de titre invalide.');
	}

	const titleId = Number(id);
	if (!Number.isInteger(titleId) || titleId <= 0) {
		error(400, 'Identifiant de titre invalide.');
	}

	const getDetails = mediaType === 'movie' ? getMovieDetails : getTvDetails;

	let raw;
	try {
		raw = await getDetails(titleId);
	} catch {
		error(404, 'Titre introuvable.');
	}

	const title = normalizeSearchResult(raw);
	if (!title) {
		error(404, 'Titre introuvable.');
	}

	const providersResponse = await fetch(`/api/title/${mediaType}/${titleId}/watch-providers`);
	const groups: ProviderAvailabilityGroup[] = providersResponse.ok
		? (await providersResponse.json()).groups
		: [];

	return { title, groups };
};
