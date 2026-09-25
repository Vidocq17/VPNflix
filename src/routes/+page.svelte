<!-- Accueil + recherche (etape 10, design Stitch). Sans query : hero. Avec query : filtres + resultats. Formulaire GET natif : la soumission navigue
     vers /?query=...&type=...&country=...&providers=... et SvelteKit re-execute
     +page.ts, sans JS de fetch cote client. -->
<script lang="ts">
	import AppShell from '$lib/components/layout/AppShell.svelte';
	import SearchBox from '$lib/components/search/SearchBox.svelte';
	import SearchFilters from '$lib/components/search/SearchFilters.svelte';
	import SearchResultList from '$lib/components/search/SearchResultList.svelte';
	import ExcludeProviders from '$lib/components/search/ExcludeProviders.svelte';
	import GlassPanel from '$lib/components/ui/GlassPanel.svelte';
	import Globe from 'lucide-svelte/icons/globe';
	import Compass from 'lucide-svelte/icons/compass';
	import Button from '$lib/components/ui/Button.svelte';
	import PosterCard from '$lib/components/ui/PosterCard.svelte';
	import { favorites, loadFilters, saveFilters } from '$lib/persist.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// Filtres : sauvegardes a chaque recherche (formulaire soumis = params `type` presents),
	// restaures quand une recherche arrive sans filtres (ex. depuis la barre du hero).
	$effect(() => {
		const sp = page.url.searchParams;
		if (!data.query || sp.has('type') || sp.has('country') || sp.has('providers')) return;
		const saved = loadFilters();
		if (!saved || (saved.type === 'all' && !saved.country && saved.providers.length === 0)) return;
		const next = Object.entries({ query: data.query, type: saved.type, country: saved.country })
			.concat(saved.providers.map((id) => ['providers', id]))
			.map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
			.join('&');
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- resolve() applique a la base, query ajoutee apres
		goto(`${resolve('/')}?${next}`, { replaceState: true });
	});
	$effect(() => {
		if (data.query && page.url.searchParams.has('type')) {
			saveFilters({ type: data.type, country: data.country, providers: data.providers });
		}
	});
</script>

<svelte:head>
	<title>VPNflix - Trouver ou regarder vos films et series legalement</title>
	{#if data.query}<meta name="robots" content="noindex" />{/if}
</svelte:head>

<AppShell>
	<form method="GET">
		{#if !data.query}
			<section class="relative flex min-h-[640px] items-center overflow-hidden pt-20">
				<div
					class="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_30%,rgba(46,91,255,0.25),transparent_55%),radial-gradient(ellipse_at_80%_70%,rgba(87,27,193,0.25),transparent_55%)]"
				></div>
				<div class="relative mx-auto w-full max-w-[1440px] px-5 md:px-16">
					<div class="max-w-2xl space-y-6">
						<div
							class="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary-container/20 px-3 py-1 text-sm font-semibold text-primary"
						>
							<Globe class="size-4" /> Disponibilites par pays
						</div>
						<h1 class="text-5xl font-extrabold leading-none tracking-tight">
							Trouve ou regarder tes films et series legalement
						</h1>
						<p class="max-w-lg text-lg leading-relaxed text-on-surface-variant">
							Cherche un titre et compare les pays et plateformes de streaming ou il est disponible.
						</p>
						<SearchBox value={data.query} variant="hero" />
						<ExcludeProviders providers={data.availableProviders} />
					</div>
				</div>
			</section>

			{#snippet grid(title: string, items: typeof data.popularMovies)}
				{#if items.length > 0}
					<section class="mx-auto max-w-[1440px] px-5 pb-12 md:px-16">
						<h2 class="mb-6 text-3xl font-bold">{title}</h2>
						<div class="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
							{#each items as result (`${result.mediaType}-${result.id}`)}
								<PosterCard {result} />
							{/each}
						</div>
					</section>
				{/if}
			{/snippet}
			{@render grid(
				'Mes favoris',
				favorites.items.map((f) => ({ ...f, releaseYear: null, overview: '' }))
			)}
			{@render grid('Films populaires', data.popularMovies)}
			{@render grid('Series populaires', data.popularTv)}

			<section class="mx-auto grid max-w-[1440px] gap-6 px-5 pb-20 md:grid-cols-3 md:px-16">
				<GlassPanel class="flex flex-col gap-3 p-8 md:col-span-2">
					<h2 class="text-3xl font-bold">Suis les droits regionaux</h2>
					<p class="max-w-xl text-on-surface-variant">
						Un titre absent de ton catalogue peut etre disponible ailleurs. VPNflix liste les pays
						et les plateformes pour chaque film ou serie, d'apres les donnees TMDB.
					</p>
				</GlassPanel>
				<div class="accent-gradient flex flex-col gap-3 rounded-2xl p-8">
					<Compass class="size-8" />
					<h2 class="mt-auto text-2xl font-bold">Explorateur mondial</h2>
					<p class="text-white/80">
						Filtre par pays et par plateforme pour voir ce qui est disponible, partout.
					</p>
				</div>
			</section>
		{:else}
			<main class="mx-auto max-w-[1440px] px-5 pb-16 pt-28 md:px-16">
				<h1 class="sr-only">Rechercher un film ou une serie</h1>
				<div class="mx-auto max-w-4xl"><SearchBox value={data.query} /></div>

				<div class="mt-12 grid grid-cols-1 gap-10 md:grid-cols-12">
					<aside class="md:col-span-3">
						<SearchFilters
							type={data.type}
							country={data.country}
							countries={data.countries}
							providers={data.availableProviders}
							selectedProviders={data.providers}
						/>
						<Button type="submit" variant="primary" class="mt-6 w-full">Rechercher</Button>
					</aside>

					<div class="md:col-span-9">
						{#if !data.errorMessage && data.results.length > 0}
							<p class="mb-6 text-on-surface-variant">
								<strong class="text-on-surface">{data.results.length}</strong> resultats
							</p>
						{/if}
						<SearchResultList
							results={data.results}
							query={data.query}
							errorMessage={data.errorMessage}
						/>
					</div>
				</div>
			</main>
		{/if}
	</form>
</AppShell>
