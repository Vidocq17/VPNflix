// Validation centralisee des variables d'environnement (etape 5).
//
// Deux exports distincts pour garantir l'etancheite client/serveur :
// - `publicEnv` : lisible cote client ET serveur ($env/static/public).
// - `serverEnv` : lisible UNIQUEMENT cote serveur ($env/static/private).
//   Un composant .svelte qui importe `serverEnv` fera planter le build
//   SvelteKit (bug: $env/static/private ne peut pas etre bundle cote client),
//   ce qui rend la fuite impossible plutot que simplement deconseillee.
import { z } from 'zod';
import { PUBLIC_APP_URL, PUBLIC_TMDB_IMAGE_BASE_URL } from '$env/static/public';
import { TMDB_ACCESS_TOKEN } from '$env/static/private';

const publicSchema = z.object({
	PUBLIC_APP_URL: z.string().url(),
	PUBLIC_TMDB_IMAGE_BASE_URL: z.string().url()
});

export const publicEnv = publicSchema.parse({
	PUBLIC_APP_URL,
	PUBLIC_TMDB_IMAGE_BASE_URL
});

const serverSchema = z.object({
	TMDB_ACCESS_TOKEN: z.string().min(1)
});

// TMDB_API_KEY n'est pas utilise pour l'instant (voir etapes.md) -> pas
// valide ni expose ici.
// ponytail: pas de schema pour des variables non consommees, ajouter
// quand un module en aura reellement besoin.
export const serverEnv = serverSchema.parse({ TMDB_ACCESS_TOKEN });
