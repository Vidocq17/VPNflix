import { expect, test } from '@playwright/test';

test('robots, sitemap, meta et pages legales', async ({ page, request }) => {
	expect(await (await request.get('/robots.txt')).text()).toContain('Disallow: /api/');
	const sitemap = await (await request.get('/sitemap.xml')).text();
	for (const p of ['/movies', '/series', '/legal', '/privacy']) expect(sitemap).toContain(p);
	expect(sitemap).not.toContain('/api');

	await page.goto('/');
	await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
	await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', /\/$/);
	await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
	await expect(page.locator('meta[name=robots]')).toHaveCount(0);

	await page.goto('/?query=inception');
	await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', 'noindex');

	await page.goto('/legal');
	await expect(page.getByText('TMDB').first()).toBeVisible();
	await page.goto('/privacy');
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
