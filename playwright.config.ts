import { defineConfig } from '@playwright/test';

export default defineConfig({
	// TMDB stubbe cote serveur (tests/e2e/mock-tmdb.mjs) : aucun appel reseau reel.
	webServer: {
		command: 'npm run build && NODE_OPTIONS="--import ./tests/e2e/mock-tmdb.mjs" npm run preview',
		port: 4173
	},
	testDir: 'tests/e2e',
	testMatch: '**/*.{e2e,spec}.{ts,js}',
	// Le test de rate limit sature le quota de l'IP de test : il tourne apres tous les autres.
	projects: [
		{ name: 'main', testIgnore: '**/rate-limit.spec.ts' },
		{ name: 'rate-limit', testMatch: '**/rate-limit.spec.ts', dependencies: ['main'] }
	]
});
