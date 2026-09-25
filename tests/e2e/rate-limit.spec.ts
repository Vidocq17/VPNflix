import { expect, test } from '@playwright/test';

test('429 apres 30 requetes/minute sur /api/search', async ({ request }) => {
	let last;
	for (let i = 0; i < 35; i++) last = await request.get('/api/search?query=inception');
	expect(last!.status()).toBe(429);
	expect(await last!.json()).toEqual({
		error: 'Trop de requetes. Reessaie dans quelques instants.'
	});
});
