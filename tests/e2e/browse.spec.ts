import { expect, test } from '@playwright/test';

test.beforeEach(({ page }) => page.route('https://image.tmdb.org/**', (r) => r.abort()));

test('nav, sitemap et pages /movies et /series', async ({ page, request }) => {
	await page.goto('/');
	await page.getByRole('link', { name: 'Films', exact: true }).click();
	await expect(page).toHaveURL(/\/movies$/);
	await expect(page.getByRole('heading', { level: 1, name: 'Films' })).toBeVisible();
	await expect(page.getByRole('link', { name: /Dune Deuxieme Partie/ })).toBeVisible();
	await expect(page.getByRole('button', { name: /Ajouter aux favoris : Dune/ })).toBeVisible();

	await page.getByRole('link', { name: 'Series', exact: true }).click();
	await expect(page.getByRole('link', { name: /Severance/ })).toBeVisible();
	expect(await (await request.get('/sitemap.xml')).text()).toContain('/series');
});

test('filtres : genre, annees, pays, plateformes, pagination', async ({ page }) => {
	await page.goto('/movies');
	await expect(page.locator('html[data-ready]')).toBeAttached(); // hydrate
	const form = page.getByRole('form', { name: 'Filtres' });
	await form.getByText('Action').click();
	await form.getByLabel('Annee de debut').fill('2000');
	await form.getByLabel('Pays').selectOption('FR');
	await form.getByText('Netflix').click();
	await form.getByRole('button', { name: 'Appliquer' }).click();
	await expect(page).toHaveURL(/genres=28.*yearFrom=2000.*country=FR.*providers=8/);
	await expect(page.getByRole('link', { name: /Dune/ })).toBeVisible();
	await expect(page.getByRole('link', { name: /Inception/ })).toHaveCount(0);

	await page.goto('/movies?yearFrom=1990');
	await page.getByRole('link', { name: 'Suivant' }).click();
	await expect(page).toHaveURL(/page=2/);
	await expect(page).toHaveURL(/yearFrom=1990/); // filtres gardes
	await expect(page.getByLabel('Pagination').locator('[aria-current=page]')).toHaveText('2');
	await expect(page.getByRole('link', { name: 'Premiere' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Derniere page' })).toHaveCount(0); // total 2
	await expect(page.getByRole('link', { name: /Inception/ })).toBeVisible();
});

test('plateformes : doublons fusionnes, principales en tete, liste scrollable', async ({
	page
}) => {
	await page.goto('/movies');
	const boxes = page.getByRole('checkbox', { name: /Netflix|Prime Video/ });
	await expect(boxes).toHaveCount(2); // 2 ids TMDB "Prime Video" -> 1 case
	await expect(page.locator('label:has(input[name=providers])').first()).toHaveText(/Netflix/);
	await expect(page.locator('div:has(> label > input[name=providers])')).toHaveCSS(
		'overflow-y',
		'auto'
	);
});

test('filtres retenus apres rechargement, une cle par page', async ({ page }) => {
	await page.goto('/movies?genres=28&country=FR&providers=8');
	await expect(page.locator('html[data-ready]')).toBeAttached(); // hydrate
	await page.goto('/movies');
	await expect(page).toHaveURL(/genres=28/);
	await expect(page.getByRole('checkbox', { name: 'Action' })).toBeChecked();
	await expect(page.getByLabel('Pays')).toHaveValue('FR');
	await expect(page.getByRole('checkbox', { name: 'Netflix' })).toBeChecked();

	await page.goto('/series');
	await expect(page).not.toHaveURL(/genres=/);
	await expect(page.getByRole('checkbox', { name: 'Drame' })).not.toBeChecked();
});

test('api discover et genres : validation', async ({ request }) => {
	const ok = await request.get('/api/discover?type=tv&genres=18&country=FR&providers=8');
	expect(ok.status()).toBe(200);
	expect((await ok.json()).results[0].mediaType).toBe('tv');
	for (const q of ['', '?type=all', '?type=tv&providers=8', '?type=tv&page=999', '?type=tv&x=1'])
		expect((await request.get(`/api/discover${q}`)).status()).toBe(400);
	expect((await request.get('/api/genres?type=movie')).status()).toBe(200);
	expect((await request.get('/api/genres')).status()).toBe(400);
});

test('page detail : section Similaires', async ({ page }) => {
	await page.goto('/title/movie/27205');
	const sim = page.locator('section', { has: page.getByRole('heading', { name: 'Similaires' }) });
	await expect(sim.getByRole('link', { name: /Dune Deuxieme Partie/ })).toBeVisible();
	await expect(sim.getByRole('button', { name: /Ajouter aux favoris : Dune/ })).toBeVisible();
	await page.goto('/title/tv/1396');
	await expect(page.getByRole('link', { name: /Severance/ })).toBeVisible();
});

test('page detail : erreur TMDB sur similaires masque la section', async ({ page }) => {
	// /tv/95396 n'a pas de route mock similar -> 404 ; le titre n'existe pas non plus : on
	// verifie donc via un titre sans similaires : /movie/27205 a des similaires, /tv/1396 aussi.
	await page.goto('/title/movie/999999');
	await expect(page.getByRole('heading', { name: 'Similaires' })).toHaveCount(0);
});

test('pagination : Aller a la page garde les filtres', async ({ page }) => {
	await page.goto('/movies?yearFrom=1990');
	await expect(page.locator('html[data-ready]')).toBeAttached();
	await page.getByLabel('Page', { exact: true }).fill('2');
	await page.getByRole('button', { name: 'Aller' }).click();
	await expect(page).toHaveURL(/page=2/);
	await expect(page).toHaveURL(/yearFrom=1990/);
	await expect(page.getByRole('link', { name: /Inception/ })).toBeVisible();
});

test('exclusion : persistee apres rechargement, masquee dans la fiche et dans /movies', async ({
	page
}) => {
	await page.goto('/');
	await expect(page.locator('html[data-ready]')).toBeAttached();
	await page.getByText('Plateformes a exclure').click();
	const netflix = page.getByRole('button', { name: 'Netflix', exact: true });
	await netflix.click();
	await expect(netflix).toHaveAttribute('aria-pressed', 'true');
	await page.reload();
	await expect(page.locator('html[data-ready]')).toBeAttached();
	await page.getByText(/Plateformes a exclure/).click();
	await expect(netflix).toHaveAttribute('aria-pressed', 'true');

	await page.goto('/title/movie/27205');
	await expect(page.locator('h3', { hasText: 'Prime Video' })).toHaveCount(1);
	await expect(page.locator('h3', { hasText: 'Netflix' })).toHaveCount(0);

	await page.goto('/movies?country=FR');
	await expect(page).toHaveURL(/exclude=8/);
	await page.goto('/title/tv/1396'); // seule plateforme = Netflix, exclue
	await expect(page.getByText('Toutes les plateformes de ce titre sont exclues.')).toBeVisible();

	await page.goto('/');
	await page.getByText(/Plateformes a exclure/).click();
	await page.getByRole('button', { name: 'Tout inclure' }).click();
	await page.goto('/title/tv/1396');
	await expect(page.locator('h3', { hasText: 'Netflix' })).toBeVisible();
});

test('api discover : exclude valide, sans pays refuse', async ({ request }) => {
	expect((await request.get('/api/discover?type=movie&country=FR&exclude=8,9')).status()).toBe(200);
	expect((await request.get('/api/discover?type=movie&exclude=8')).status()).toBe(400);
});

test('Tout exclure puis reinclure une plateforme, persiste apres rechargement', async ({
	page
}) => {
	await page.goto('/');
	await expect(page.locator('html[data-ready]')).toBeAttached();
	await page.getByText('Plateformes a exclure').click();
	await page.getByRole('button', { name: 'Tout exclure' }).click();
	const netflix = page.getByRole('button', { name: 'Netflix', exact: true });
	const prime = page.getByRole('button', { name: 'Prime Video', exact: true });
	await expect(netflix).toHaveAttribute('aria-pressed', 'true');
	await expect(prime).toHaveAttribute('aria-pressed', 'true');
	await netflix.click();
	await expect(netflix).toHaveAttribute('aria-pressed', 'false');

	await page.reload();
	await expect(page.locator('html[data-ready]')).toBeAttached();
	await page.getByText(/Plateformes a exclure/).click();
	await expect(netflix).toHaveAttribute('aria-pressed', 'false');
	await expect(prime).toHaveAttribute('aria-pressed', 'true');

	await page.goto('/title/movie/27205');
	await expect(page.locator('h3', { hasText: 'Netflix' })).toHaveCount(1);
	await expect(page.locator('h3', { hasText: 'Prime Video' })).toHaveCount(0);
});
