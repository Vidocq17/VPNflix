/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-vercel';
import { CSP_DIRECTIVES } from './src/lib/security/http';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			adapter: adapter(),
			csp: { mode: 'auto', directives: CSP_DIRECTIVES }
		})
	],
	test: {
		environment: 'node',
		exclude: ['tests/e2e/**', 'node_modules/**'],
		setupFiles: ['./src/test/setup.ts']
	}
});
