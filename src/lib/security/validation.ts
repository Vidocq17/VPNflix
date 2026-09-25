// Validation des entrees des endpoints publics (etape 16). Pur zod : testable sans SvelteKit.
import { z } from 'zod';

const mediaType = z.enum(['movie', 'tv']);
const searchType = z.enum(['movie', 'tv', 'all']).default('all');
const positiveInt = z
	.string()
	.regex(/^[1-9]\d{0,9}$/)
	.transform(Number);
const csv = <O>(item: z.ZodType<O, string>, max: number) =>
	z
		.string()
		.transform((s) => s.split(',').map((v) => v.trim()))
		.pipe(z.array(item).max(max));

export const searchSchema = z.strictObject({
	query: z.string().trim().min(2).max(80),
	type: searchType
});

export const providersConfigSchema = z.strictObject({
	type: searchType,
	country: z.string().optional() // accepte mais sans effet (voir route)
});

export const watchProvidersSchema = z.strictObject({
	mediaType,
	id: positiveInt,
	countries: csv(z.string().regex(/^[A-Za-z]{2}$/), 250).optional(),
	providers: csv(positiveInt, 100).optional()
});

export const noParamsSchema = z.strictObject({});

/** Valide un objet de parametres ; `null` si invalide (l'appelant repond 400 generique). */
export function parse<S extends z.ZodType>(
	schema: S,
	raw: Record<string, string>
): z.output<S> | null {
	const result = schema.safeParse(raw);
	return result.success ? result.data : null;
}

/** Parametres de requete -> objet (les doublons d'une meme cle sont rejetes par `null`). */
export function searchParamsObject(params: URLSearchParams): Record<string, string> | null {
	const keys = [...params.keys()];
	if (new Set(keys).size !== keys.length) return null;
	return Object.fromEntries(params);
}
