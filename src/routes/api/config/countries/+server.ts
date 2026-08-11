import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getWatchProviderRegions, normalizeRegions } from '$lib/catalog';
import { callTmdb } from '../../api-error';

export const GET: RequestHandler = async () => {
	const response = await callTmdb(() => getWatchProviderRegions());
	return json({ countries: normalizeRegions(response) });
};
