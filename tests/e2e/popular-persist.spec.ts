import { expect, test } from '@playwright/test';

test.beforeEach(({ page }) => page.route('https://image.tmdb.org/**', (r) => r.abort()));

test('accueil : films et series populaires', async ({ page }) => {
	await page.goto('/');
	const films = page.locator('section', {
		has: page.getByRole('heading', { name: 'Films populaires' })
	});
	await expect(films.getByRole('link', { name: /Dune Deuxieme Partie/ })).toBeVisible();
	const series = page.locator('section', {
		has: page.getByRole('heading', { name: 'Series populaires' })
	});
	await expect(series.getByRole('link', { name: /Severance/ })).toBeVisible();
});

test('api popular : validation et resultats', async ({ request }) => {
	const ok = await request.get('/api/popular?type=tv');
	expect((await ok.json()).results.map((r: { title: string }) => r.title)).toEqual([
		'Severance',
		'Breaking Bad'
	]);
	expect((await request.get('/api/popular?type=all')).status()).toBe(400);
	expect((await request.get('/api/popular')).status()).toBe(400);
});

test('favoris : ajout depuis la carte, persistance apres rechargement, retrait sur la page detail', async ({
	page
}) => {
	await page.goto('/');
	await expect(page.locator('html[data-ready]')).toBeAttached(); // hydrate
	await page.getByRole('button', { name: 'Ajouter aux favoris : Dune Deuxieme Partie' }).click();
	const favs = page.locator('section', { has: page.getByRole('heading', { name: 'Mes favoris' }) });
	await expect(favs.getByRole('link', { name: /Dune Deuxieme Partie/ })).toBeVisible();

	await page.reload();
	await expect(page.locator('html[data-ready]')).toBeAttached(); // hydrate
	await expect(favs.getByRole('link', { name: /Dune Deuxieme Partie/ })).toBeVisible();

	await page.goto('/title/movie/27205');
	await expect(page.locator('html[data-ready]')).toBeAttached(); // hydrate
	await page.getByRole('button', { name: 'Ajouter aux favoris', exact: true }).click();
	await page.goto('/');
	await expect(favs.getByRole('link', { name: /Inception/ })).toBeVisible();

	await page.goto('/title/movie/27205');
	await expect(page.locator('html[data-ready]')).toBeAttached(); // hydrate
	await page.getByRole('button', { name: 'Retirer des favoris', exact: true }).click();
	await page.goto('/');
	await expect(favs.getByRole('link', { name: /Inception/ })).toHaveCount(0);
	await expect(favs.getByRole('link', { name: /Dune/ })).toBeVisible();
});

test('filtres restaures apres une recherche sans filtres', async ({ page }) => {
	await page.goto('/?query=inception&type=movie&country=FR&providers=8');
	// attend l'effet de sauvegarde avant de quitter la page
	await page.waitForFunction(() => localStorage.getItem('vpnflix:filters'));
	await page.goto('/');
	await expect(page.locator('html[data-ready]')).toBeAttached(); // hydrate
	await page.getByLabel('Rechercher un titre').fill('inception');
	await page.getByRole('button', { name: 'Rechercher' }).click();
	await expect(page).toHaveURL(/type=movie/);
	await expect(page).toHaveURL(/country=FR/);
	await expect(page).toHaveURL(/providers=8/);
	await expect(page.getByLabel('Pays')).toHaveValue('FR');
	await expect(page.getByRole('checkbox', { name: 'Netflix' })).toBeChecked();
});
