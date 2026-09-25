import type { Handle } from '@sveltejs/kit';
import { SECURITY_HEADERS } from '$lib/security/http';

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	for (const [name, value] of Object.entries(SECURITY_HEADERS)) response.headers.set(name, value);
	return response;
};
