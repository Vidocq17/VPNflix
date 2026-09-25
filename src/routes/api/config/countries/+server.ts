import { json } from '@sveltejs/kit';
import { getWatchProviderRegions, normalizeRegions } from '$lib/catalog';
import { BadRequest, callTmdb, publicHandler } from '$lib/server/response';
import { noParamsSchema, parse, searchParamsObject } from '$lib/security/validation';

export const GET = publicHandler('config', 300, async ({ url }) => {
	const raw = searchParamsObject(url.searchParams);
	if (!raw || !parse(noParamsSchema, raw)) throw new BadRequest();
	const response = await callTmdb(() => getWatchProviderRegions());
	return json({ countries: normalizeRegions(response) });
});
