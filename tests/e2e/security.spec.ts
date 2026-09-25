import { expect, test } from '@playwright/test';

const bad = [
	'/api/search?query=a',
	'/api/search',
	'/api/search?query=interstellar&type=bad',
	'/api/search?query=interstellar&foo=1',
	'/api/title/movie/not-a-number/watch-providers',
	'/api/title/person/1/watch-providers',
	'/api/title/movie/27205/watch-providers?countries=FRA',
	'/api/title/movie/27205/watch-providers?providers=x',
	'/api/config/providers?type=bad',
	'/api/config/countries?x=1'
];

for (const path of bad) {
	test(`400 generique: ${path}`, async ({ request }) => {
		const res = await request.get(path);
		expect(res.status()).toBe(400);
		expect(await res.json()).toEqual({ error: 'Requete invalide.' });
	});
}

test('methodes non GET refusees', async ({ request }) => {
	// Pas de header CORS applicatif. (Vite preview ajoute lui-meme `*` : artefact de preview, pas de prod.)
	expect((await request.post('/api/search?query=abc', { data: {} })).status()).toBe(405);
	expect((await request.delete('/api/config/countries')).status()).toBe(405);
});

test('headers de securite et CSP sur pages et API', async ({ request }) => {
	for (const path of ['/', '/api/config/countries']) {
		const h = (await request.get(path)).headers();
		expect(h['x-content-type-options']).toBe('nosniff');
		expect(h['x-frame-options']).toBe('DENY');
		expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin');
		expect(h['permissions-policy']).toContain('camera=()');
	}
	const csp = (await request.get('/')).headers()['content-security-policy'];
	expect(csp).toContain("frame-ancestors 'none'");
	expect(csp).toContain('https://image.tmdb.org');
	expect(csp).not.toContain('*');
});

test('la page se charge sans violation CSP', async ({ page }) => {
	const errors: string[] = [];
	page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
	await page.route('https://image.tmdb.org/**', (r) => r.abort());
	await page.goto('/?query=inception');
	await expect(page.getByRole('link', { name: /Inception/ })).toBeVisible();
	expect(errors.filter((e) => e.includes('Content Security Policy'))).toEqual([]);
});

test('TMDB_ACCESS_TOKEN absent du client', async ({ page }) => {
	const bodies: string[] = [];
	page.on('response', async (r) => {
		if (/\.(js|css)$|\/api\//.test(r.url())) bodies.push(await r.text().catch(() => ''));
	});
	await page.goto('/?query=inception');
	await expect(page.getByRole('link', { name: /Inception/ })).toBeVisible();
	const html = await page.content();
	const token = process.env.TMDB_ACCESS_TOKEN;
	for (const body of [html, ...bodies]) {
		expect(body).not.toContain('TMDB_ACCESS_TOKEN');
		if (token) expect(body).not.toContain(token);
	}
});

test('robots.txt exclut /api/', async ({ request }) => {
	expect(await (await request.get('/robots.txt')).text()).toContain('Disallow: /api/');
});
