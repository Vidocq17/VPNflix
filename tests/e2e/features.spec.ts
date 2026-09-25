import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

test.beforeEach(({ page }) => page.route('https://image.tmdb.org/**', (r) => r.abort()));

// Les listes locales sont des menus depliants fermes ; on les ouvre des qu'ils apparaissent.
test.beforeEach(({ page }) =>
	page.addInitScript(() =>
		new MutationObserver(() =>
			document
				.querySelectorAll('details[data-list]')
				.forEach((d) => ((d as HTMLDetailsElement).open = true))
		).observe(document, { childList: true, subtree: true })
	)
);

const hydrated = (page: Page) => expect(page.locator('html[data-ready]')).toBeAttached();
const section = (page: Page, name: string) =>
	page.locator('section', { has: page.getByRole('heading', { name, exact: true }) });
const titles = (page: Page) => page.getByLabel('Resultats').locator('h3').allTextContents();

// ---- 1. Filtres de la recherche ----
// NB : /api/search est limite a 30 req/min/IP et toute la suite main tourne dans la meme minute
// (le test rate-limit sature ensuite le quota) : peu d'appels ici, la logique fine est en unitaire.

test('recherche : le pays filtre les resultats', async ({ page }) => {
	await page.goto('/?query=a-titre&country=DE');
	await expect(page.getByRole('link', { name: /Inception/ })).toBeVisible();
	await expect(page.getByRole('link', { name: /Breaking Bad/ })).toHaveCount(0); // FR seulement
});

test('recherche : les plateformes filtrent (ids equivalents fusionnes)', async ({ page }) => {
	await page.goto('/?query=a-titre&country=FR&providers=9');
	await expect(page.getByRole('link', { name: /Inception/ })).toBeVisible();
	await expect(page.getByRole('link', { name: /Breaking Bad/ })).toHaveCount(0); // Netflix seul
});

test('recherche : plateformes exclues appliquees (formulaire + URL synchronisee)', async ({
	page
}) => {
	await page.goto('/');
	await hydrated(page);
	await page.getByText('Plateformes a exclure').click();
	await page.getByRole('button', { name: 'Netflix', exact: true }).click();
	await page.getByLabel('Rechercher un titre').fill('a-titre');
	await page.getByRole('button', { name: 'Rechercher' }).first().click();
	await expect(page).toHaveURL(/exclude=8/);
	// Breaking Bad n'est que sur Netflix (exclue) ; Inception reste (Prime Video)
	await expect(page.getByRole('link', { name: /Inception/ })).toBeVisible();
	await expect(page.getByRole('link', { name: /Breaking Bad/ })).toHaveCount(0);
	// URL sans exclude (lien externe) : re-synchronisee depuis localStorage
	await page.goto('/?query=a-titre&country=FR');
	await expect(page).toHaveURL(/exclude=8/);
	await expect(page.getByRole('link', { name: /Breaking Bad/ })).toHaveCount(0);
});

test('api search : filtres valides, invalides refuses', async ({ request }) => {
	const ok = await request.get('/api/search?query=abc&country=DE');
	expect((await ok.json()).results.map((r: { id: number }) => r.id)).toEqual([27205]);
	for (const q of ['country=FRA', 'providers=x'])
		expect((await request.get(`/api/search?query=abc&${q}`)).status()).toBe(400);
});

// ---- 2. Tri ----

test('tri : applique, conserve dans la pagination et retenu apres rechargement', async ({
	page
}) => {
	await page.goto('/movies');
	await hydrated(page);
	expect((await titles(page))[0]).toContain('Dune');
	await page.getByLabel('Trier par').selectOption('popularity.asc');
	await page.getByRole('button', { name: 'Appliquer' }).click();
	await expect(page).toHaveURL(/sort=popularity\.asc/);
	await expect.poll(async () => (await titles(page))[0]).toContain('Inception');
	await expect(page.getByLabel('Trier par')).toHaveValue('popularity.asc');

	await page.getByRole('link', { name: 'Suivant' }).click();
	await expect(page).toHaveURL(/page=2/);
	await expect(page).toHaveURL(/sort=popularity\.asc/);

	await page.goto('/movies');
	await expect(page).toHaveURL(/sort=popularity\.asc/); // restaure depuis localStorage
	await expect(page.getByLabel('Trier par')).toHaveValue('popularity.asc');
	await page.goto('/series');
	await expect(page).not.toHaveURL(/sort=/); // une cle par page
});

test('api discover : tri liste blanche', async ({ request }) => {
	expect((await request.get('/api/discover?type=tv&sort=vote_average.desc')).status()).toBe(200);
	for (const sort of ['name.asc', 'popularity.desc,x', 'release'])
		expect((await request.get(`/api/discover?type=tv&sort=${sort}`)).status()).toBe(400);
});

// ---- 3. Notes et genres ----

test('poster : note et genres ; pas de note si aucun vote', async ({ page }) => {
	await page.goto('/movies');
	const dune = page.locator('a', { hasText: 'Dune Deuxieme Partie' });
	await expect(dune.getByLabel('Note 8.2 sur 10')).toHaveText('8.2');
	await expect(dune).toContainText('Action · Comedie'); // noms charges depuis /api/genres
	await page.goto('/series');
	const sev = page.locator('a', { hasText: 'Severance' });
	await expect(sev).toContainText('Drame');
	await expect(sev.getByLabel(/^Note/)).toHaveCount(0);
});

test('fiche : note et genres', async ({ page }) => {
	await page.goto('/title/movie/27205');
	await expect(page.getByLabel('Note 8.4 sur 10')).toHaveText('8.4');
	await expect(page.getByRole('list', { name: 'Genres' })).toContainText('Action');
});

// ---- 4. Bande-annonce ----

test('fiche : bande-annonce = lien YouTube du trailer officiel, sans violation CSP', async ({
	page,
	request
}) => {
	const errors: string[] = [];
	page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
	await page.goto('/title/movie/27205');
	const link = page.getByRole('link', { name: /Bande-annonce/ });
	await expect(link).toHaveAttribute('href', 'https://www.youtube.com/watch?v=YoHD9XEInc0');
	await expect(link).toHaveAttribute('rel', /noopener/);
	await expect(link).toHaveAttribute('target', '_blank');
	await expect(page.locator('iframe')).toHaveCount(0);
	expect(errors.filter((e) => e.includes('Content Security Policy'))).toEqual([]);
	// la CSP n'a pas ete elargie (pas de frame-src, pas de youtube)
	const csp = (await request.get('/title/movie/27205')).headers()['content-security-policy'];
	expect(csp).not.toMatch(/youtube|frame-src/);
});

test('fiche : erreur TMDB sur /videos masque la bande-annonce', async ({ page }) => {
	await page.goto('/title/tv/1396'); // pas de route videos -> 404 mock
	await expect(page.getByRole('heading', { level: 1, name: 'Breaking Bad' })).toBeVisible();
	await expect(page.getByRole('link', { name: /Bande-annonce/ })).toHaveCount(0);
});

// ---- 5. A voir / Vus ----

test('A voir et Vus : boutons carte + fiche, sections accueil, persistance, masquer les vus', async ({
	page
}) => {
	await page.goto('/');
	await hydrated(page);
	const popular = section(page, 'Films populaires');
	await popular.getByRole('button', { name: /Ajouter a "A voir" : Dune/ }).click();
	await popular.getByRole('button', { name: /Marquer comme vu : Dune/ }).click();
	await expect(section(page, 'A voir').getByRole('link', { name: /Dune/ })).toBeVisible();
	await expect(section(page, 'Vus').getByRole('link', { name: /Dune/ })).toBeVisible();

	await page.reload();
	await hydrated(page);
	await expect(section(page, 'Vus').getByRole('link', { name: /Dune/ })).toBeVisible();

	// masquer les vus : disparait des populaires, reste dans la section Vus ; persiste
	await page.getByLabel('Masquer les titres deja vus').check();
	await expect(popular.getByRole('link', { name: /Dune/ })).toHaveCount(0);
	await expect(popular.getByRole('link', { name: /Inception/ })).toBeVisible();
	await expect(section(page, 'Vus').getByRole('link', { name: /Dune/ })).toBeVisible();
	await page.goto('/movies');
	await expect(page.getByRole('link', { name: /Dune/ })).toHaveCount(0);
	await expect(page.getByRole('link', { name: /Inception/ })).toBeVisible();

	// fiche : retirer de "Vus" et de "A voir"
	await page.goto('/title/movie/693134');
	await page.goto('/');
	await hydrated(page);
	await section(page, 'Vus')
		.getByRole('button', { name: /Retirer des "Vus" : Dune/ })
		.click();
	await section(page, 'A voir')
		.getByRole('button', { name: /Retirer de "A voir" : Dune/ })
		.click();
	await expect(page.getByRole('heading', { name: 'A voir', exact: true })).toHaveCount(0);
	await expect(page.getByRole('heading', { name: 'Vus', exact: true })).toHaveCount(0);
});

test('fiche : boutons A voir / Vus', async ({ page }) => {
	await page.goto('/title/movie/27205');
	await hydrated(page);
	await page.getByRole('button', { name: 'Ajouter a "A voir"', exact: true }).click();
	await page.getByRole('button', { name: 'Marquer comme vu', exact: true }).click();
	await page.goto('/');
	await hydrated(page);
	await expect(section(page, 'A voir').getByRole('link', { name: /Inception/ })).toBeVisible();
	await expect(section(page, 'Vus').getByRole('link', { name: /Inception/ })).toBeVisible();
});

test('recherche : masquer les vus', async ({ page }) => {
	await page.goto('/title/movie/27205');
	await hydrated(page);
	await page.getByRole('button', { name: 'Marquer comme vu', exact: true }).click();
	await page.goto('/?query=a-titre');
	await hydrated(page);
	await expect(page.getByRole('link', { name: /Inception/ })).toBeVisible();
	await page.getByLabel('Masquer les titres deja vus').check();
	await expect(page.getByRole('link', { name: /Inception/ })).toHaveCount(0);
	await expect(page.getByRole('link', { name: /Breaking Bad/ })).toBeVisible();
});

// ---- 6. Export / import ----

const backup = (over: object = {}) => ({
	app: 'vpnflix',
	version: 1,
	favorites: [{ mediaType: 'movie', id: 27205, title: 'Inception', posterPath: null }],
	watchlist: [{ mediaType: 'tv', id: 1396, title: 'Breaking Bad', posterPath: null }],
	seen: [],
	hideSeen: false,
	excluded: ['8'],
	filters: { type: 'movie', country: 'FR', providers: ['8'] },
	browse: { movies: null, series: null },
	...over
});
const upload = (page: Page, content: string | Buffer, name = 'b.json') =>
	page.locator('input[type=file]').setInputFiles({
		name,
		mimeType: 'application/json',
		buffer: Buffer.from(content)
	});

test('export : telecharge un JSON avec les donnees locales, sans requete serveur', async ({
	page
}) => {
	const errors: string[] = [];
	page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
	await page.goto('/');
	await hydrated(page);
	await section(page, 'Films populaires')
		.getByRole('button', { name: /Ajouter aux favoris : Dune/ })
		.click();
	await section(page, 'Films populaires')
		.getByRole('button', { name: /Marquer comme vu : Dune/ })
		.click();
	const posts: string[] = [];
	page.on('request', (r) => r.method() !== 'GET' && posts.push(r.url()));
	const [download] = await Promise.all([
		page.waitForEvent('download'),
		page.getByRole('button', { name: 'Telecharger la sauvegarde' }).click()
	]);
	expect(download.suggestedFilename()).toBe('vpnflix-sauvegarde.json');
	const data = JSON.parse(await readFile((await download.path())!, 'utf8'));
	expect(data).toMatchObject({ app: 'vpnflix', version: 1, hideSeen: false });
	expect(data.favorites[0]).toEqual({
		mediaType: 'movie',
		id: 693134,
		title: 'Dune Deuxieme Partie',
		posterPath: null
	});
	expect(data.seen).toHaveLength(1);
	expect(posts).toEqual([]);
	expect(errors.filter((e) => e.includes('Content Security Policy'))).toEqual([]);
});

test('import : fichier valide remplace favoris, listes, filtres et exclusions', async ({
	page
}) => {
	await page.goto('/');
	await hydrated(page);
	await upload(page, JSON.stringify(backup()));
	await expect(page.getByRole('status')).toContainText('Import reussi : 1 favoris, 1 a voir');
	await expect(section(page, 'Mes favoris').getByRole('link', { name: /Inception/ })).toBeVisible();
	await expect(section(page, 'A voir').getByRole('link', { name: /Breaking Bad/ })).toBeVisible();
	await page.getByText(/Plateformes a exclure/).click();
	await expect(page.getByRole('button', { name: 'Netflix', exact: true })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
	expect(
		await page.evaluate(() => JSON.parse(localStorage.getItem('vpnflix:filters') ?? 'null'))
	).toEqual({ type: 'movie', country: 'FR', providers: ['8'] });
	await page.reload();
	await hydrated(page);
	await expect(section(page, 'Mes favoris').getByRole('link', { name: /Inception/ })).toBeVisible();
});

test('import : fichiers invalides refuses avec un message, donnees inchangees', async ({
	page
}) => {
	await page.goto('/');
	await hydrated(page);
	await section(page, 'Films populaires')
		.getByRole('button', { name: /Ajouter aux favoris : Dune/ })
		.click();
	const bad: [string | Buffer, RegExp][] = [
		['pas du json {', /pas du JSON valide/],
		[JSON.stringify(backup({ extra: 1 })), /invalide \(champ : /],
		[JSON.stringify(backup({ version: 2 })), /champ : version/],
		[JSON.stringify(backup({ excluded: ['abc'] })), /champ : excluded/],
		[
			JSON.stringify(
				backup({ favorites: [{ mediaType: 'movie', id: 1, title: 'x', posterPath: null, z: 1 }] })
			),
			/champ : favorites/
		],
		[Buffer.alloc(600 * 1024, 32), /trop volumineux/]
	];
	for (const [content, message] of bad) {
		await upload(page, content);
		await expect(page.getByRole('alert')).toContainText(message);
	}
	await page.reload();
	await hydrated(page);
	await expect(section(page, 'Mes favoris').getByRole('link', { name: /Dune/ })).toBeVisible();
	await expect(section(page, 'A voir')).toHaveCount(0);
});
