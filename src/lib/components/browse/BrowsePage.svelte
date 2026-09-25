<!-- Pages /movies et /series : filtres a gauche (formulaire GET natif, comme la recherche),
     grille de PosterCard, pagination precedent/suivant. Filtres retenus en localStorage
     (une cle par page) et restaures quand la page est ouverte sans filtres dans l'URL. -->
<script lang="ts">
	import AppShell from '$lib/components/layout/AppShell.svelte';
	import CountryFilter from '$lib/components/search/CountryFilter.svelte';
	import ProviderFilter from '$lib/components/search/ProviderFilter.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import ErrorMessage from '$lib/components/ui/ErrorMessage.svelte';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import PosterCard from '$lib/components/ui/PosterCard.svelte';
	import {
		excluded,
		loadBrowseFilters,
		saveBrowseFilters,
		type BrowsePage
	} from '$lib/persist.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import type { browseLoad } from '$lib/browse';

	let { data, kind }: { data: Awaited<ReturnType<typeof browseLoad>>; kind: BrowsePage } = $props();

	const title = $derived(kind === 'movies' ? 'Films' : 'Series');
	const path = $derived(kind === 'movies' ? resolve('/movies') : resolve('/series'));
	const KEYS = ['genres', 'yearFrom', 'yearTo', 'country', 'providers'];

	// Sauvegarde a chaque soumission (au moins un param de filtre dans l'URL) ; restauration
	// quand la page arrive sans aucun param de filtre.
	$effect(() => {
		if (!excluded.loaded) return;
		const sp = page.url.searchParams;
		const q = new SvelteURLSearchParams(sp);
		let changed = false;
		if (KEYS.some((k) => sp.has(k))) {
			saveBrowseFilters(kind, {
				genres: data.genres,
				yearFrom: data.yearFrom,
				yearTo: data.yearTo,
				country: data.country,
				providers: data.providers
			});
		} else {
			const saved = loadBrowseFilters(kind);
			for (const [k, v] of Object.entries(saved ?? {}))
				for (const x of Array.isArray(v) ? v : [v])
					if (x) {
						q.append(k, x);
						changed = true;
					}
		}
		// Exclusions globales : l'URL porte `exclude` (le load, universel, ne lit pas localStorage).
		const want = [...excluded.ids].sort().join(',');
		if ([...sp.getAll('exclude')].sort().join(',') !== want) {
			q.delete('exclude');
			for (const id of excluded.ids) q.append('exclude', id);
			changed = true;
		}
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- resolve() applique a la base, query ajoutee apres
		if (changed) goto(`${path}?${q}`, { replaceState: true });
	});

	function pageHref(n: number) {
		const q = new SvelteURLSearchParams(page.url.searchParams);
		q.set('page', String(n));
		return `${path}?${q}`;
	}
	const inputClass =
		'w-full rounded-xl border border-white/10 bg-surface-container px-4 py-3 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container';
</script>

<svelte:head>
	<title>{title} - VPNflix</title>
	<meta
		name="description"
		content={`Explore les ${title.toLowerCase()} par genre, annee, pays et plateforme de streaming.`}
	/>
	{#if data.page > 1 || page.url.search}<meta name="robots" content="noindex" />{/if}
</svelte:head>

<AppShell>
	<main class="mx-auto max-w-[1440px] px-5 pb-16 pt-28 md:px-16">
		<h1 class="mb-10 text-4xl font-extrabold tracking-tight">{title}</h1>
		<div class="grid grid-cols-1 gap-10 md:grid-cols-12">
			<aside class="md:col-span-3">
				<form method="GET" action={path} class="flex flex-col gap-8" aria-label="Filtres">
					{#each data.exclude as id (id)}<input type="hidden" name="exclude" value={id} />{/each}
					<div class="space-y-2">
						<h3 class="text-xl font-bold text-on-surface">Genres</h3>
						<div class="flex flex-wrap gap-2">
							{#each data.genreList as genre (genre.id)}
								<label
									class="cursor-pointer rounded-full border border-outline-variant px-4 py-2 text-sm font-medium text-on-surface-variant transition has-[:checked]:border-primary-container has-[:checked]:bg-primary-container/20 has-[:checked]:text-on-surface"
								>
									<input
										type="checkbox"
										name="genres"
										value={genre.id}
										checked={data.genres.includes(String(genre.id))}
										class="sr-only"
									/>
									{genre.name}
								</label>
							{/each}
						</div>
					</div>
					<div class="space-y-2">
						<h3 class="text-xl font-bold text-on-surface">Annees</h3>
						<div class="flex gap-3">
							<input
								type="number"
								name="yearFrom"
								min="1900"
								max="2099"
								placeholder="De"
								aria-label="Annee de debut"
								value={data.yearFrom}
								class={inputClass}
							/>
							<input
								type="number"
								name="yearTo"
								min="1900"
								max="2099"
								placeholder="A"
								aria-label="Annee de fin"
								value={data.yearTo}
								class={inputClass}
							/>
						</div>
					</div>
					<CountryFilter countries={data.countries} value={data.country} />
					<ProviderFilter providers={data.availableProviders} selected={data.providers} />
					<p class="text-xs text-on-surface-variant/60">
						Le pays filtre les titres disponibles en streaming dans ce pays ; les plateformes
						s'appliquent dans ce pays (choisis un pays pour les utiliser).
					</p>
					<Button type="submit" variant="primary" class="w-full">Appliquer</Button>
				</form>
			</aside>

			<section class="md:col-span-9" aria-label="Resultats">
				{#if data.errorMessage}
					<ErrorMessage message={data.errorMessage} />
				{:else if data.results.length === 0}
					<EmptyState title="Aucun resultat" description="Essaie d'autres filtres." />
				{:else}
					<div class="grid grid-cols-2 gap-6 sm:grid-cols-3 xl:grid-cols-4">
						{#each data.results as result (result.id)}
							<PosterCard {result} />
						{/each}
					</div>
					<Pagination
						page={data.page}
						total={data.totalPages}
						href={pageHref}
						action={path}
						params={[...page.url.searchParams].filter(([k]) => k !== 'page')}
					/>
				{/if}
			</section>
		</div>
	</main>
</AppShell>
