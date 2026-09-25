import { expect, test } from '@playwright/test';

// Les images TMDB ne sont pas utiles ici.
test.beforeEach(({ page }) => page.route('https://image.tmdb.org/**', (r) => r.abort()));

test('recherche film puis selection -> providers groupes', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('html[data-ready]')).toBeAttached(); // hydrate
	await page.getByLabel('Rechercher un titre').fill('inception');
	await page.getByRole('button', { name: 'Rechercher' }).click();
	await expect(page).toHaveURL(/query=inception/);
	await expect(page.locator('html[data-ready]')).toBeAttached(); // hydrate
	await page.locator('label', { hasText: 'Films' }).click();
	await page.getByRole('button', { name: 'Rechercher' }).click();

	await expect(page).toHaveURL(/type=movie/);
	const card = page.getByRole('link', { name: /Inception/ });
	await expect(card).toBeVisible();
	await expect(page.getByRole('link', { name: /Breaking Bad/ })).toHaveCount(0);

	await card.click();
	await expect(page).toHaveURL(/\/title\/movie\/27205/);
	await expect(page.getByRole('heading', { level: 1, name: 'Inception' })).toBeVisible();
	// Un panneau par provider, avec ses pays.
	const netflix = page.locator('h3', { hasText: 'Netflix' }).locator('xpath=../..');
	await expect(netflix).toContainText('France');
	await expect(netflix).toContainText('United States');
	await expect(netflix).not.toContainText('Germany');
	await expect(page.locator('h3', { hasText: 'Prime Video' })).toHaveCount(1);
});

test('recherche serie', async ({ page }) => {
	await page.goto('/?query=breaking&type=tv');
	const card = page.getByRole('link', { name: /Breaking Bad/ });
	await expect(card).toBeVisible();
	await expect(page.getByRole('link', { name: /Inception/ })).toHaveCount(0);
	await card.click();
	await expect(page).toHaveURL(/\/title\/tv\/1396/);
	await expect(page.locator('h3', { hasText: 'Netflix' })).toBeVisible();
});

test('filtres pays et provider (formulaire) et filtrage API', async ({ page, request }) => {
	await page.goto('/?query=inception');
	await expect(page.locator('html[data-ready]')).toBeAttached(); // hydrate
	await page.getByLabel('Pays').selectOption('FR');
	await page.getByText('Netflix', { exact: true }).click();
	await page.getByRole('button', { name: 'Rechercher' }).click();

	await expect(page).toHaveURL(/country=FR/);
	await expect(page).toHaveURL(/providers=8/);
	await expect(page.getByLabel('Pays')).toHaveValue('FR');
	await expect(page.getByRole('checkbox', { name: 'Netflix' })).toBeChecked();

	const res = await request.get('/api/title/movie/27205/watch-providers?countries=DE&providers=9');
	const { groups } = await res.json();
	expect(groups.map((g: { provider: { name: string } }) => g.provider.name)).toEqual([
		'Prime Video'
	]);
	expect(groups[0].countries.map((c: { code: string }) => c.code)).toEqual(['DE']);
});
