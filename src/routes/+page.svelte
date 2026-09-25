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
	import BackupPanel from '$lib/components/ui/BackupPanel.svelte';
	import HideSeenToggle from '$lib/components/ui/HideSeenToggle.svelte';
	import {
		excluded,
		favorites,
		loadFilters,
		saveFilters,
		seen,
		watchlist
	} from '$lib/persist.svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const shown = $derived(seen.visible(data.results));
	const asResults = (items: typeof favorites.items) =>
		items.map((f) => ({ ...f, releaseYear: null, overview: '' }));

	// Filtres : sauvegardes a chaque recherche (formulaire soumis = params `type` presents),
	// restaures quand une recherche arrive sans filtres (ex. depuis la barre du hero).
	// Exclusions globales : l'URL porte `exclude` (le load, universel, ne lit pas localStorage) ;
	// le serveur s'en sert pour filtrer les resultats par disponibilite.
	$effect(() => {
		if (!data.query || !excluded.loaded) return;
		const sp = page.url.searchParams;
		const q = new SvelteURLSearchParams(sp);
		let changed = false;
		if (!sp.has('type') && !sp.has('country') && !sp.has('providers')) {
			const saved = loadFilters();
			if (saved && !(saved.type === 'all' && !saved.country && saved.providers.length === 0)) {
				q.set('type', saved.type);
				q.set('country', saved.country);
				for (const id of saved.providers) q.append('providers', id);
				changed = true;
			}
		}
		if ([...sp.getAll('exclude')].sort().join(',') !== [...excluded.ids].sort().join(',')) {
			q.delete('exclude');
			for (const id of excluded.ids) q.append('exclude', id);
			changed = true;
		}
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- resolve() applique a la base, query ajoutee apres
		if (changed) goto(`${resolve('/')}?${q}`, { replaceState: true });
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
		<!-- Exclusions locales portees par la recherche (evite une navigation de resynchronisation). -->
		{#each excluded.ids as id (id)}<input type="hidden" name="exclude" value={id} />{/each}
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
			<div class="mx-auto max-w-[1440px] px-5 pb-6 md:px-16"><HideSeenToggle /></div>
			{@render grid('Films populaires', seen.visible(data.popularMovies))}
			{@render grid('Series populaires', seen.visible(data.popularTv))}

			<!-- Listes locales : menus depliants (fermes par defaut) sous les populaires. -->
			{#snippet list(title: string, items: typeof data.popularMovies)}
				{#if items.length > 0}
					<section class="mx-auto max-w-[1440px] px-5 pb-4 md:px-16">
						<details data-list class="rounded-2xl border border-white/10 bg-white/5 p-4">
							<summary class="cursor-pointer">
								<h2 class="inline text-2xl font-bold">{title}</h2>
								<span class="ml-2 text-on-surface-variant">({items.length})</span>
							</summary>
							<div class="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
								{#each items as result (`${result.mediaType}-${result.id}`)}
									<PosterCard {result} />
								{/each}
							</div>
						</details>
					</section>
				{/if}
			{/snippet}
			{@render list('Mes favoris', asResults(favorites.items))}
			{@render list('A voir', asResults(watchlist.items))}
			{@render list('Vus', asResults(seen.items))}
			<div class="pb-8"></div>

			<BackupPanel />

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
						<div class="mt-4"><HideSeenToggle /></div>
					</aside>

					<div class="md:col-span-9">
						{#if !data.errorMessage && shown.length > 0}
							<p class="mb-6 text-on-surface-variant">
								<strong class="text-on-surface">{shown.length}</strong> resultats
							</p>
						{/if}
						<SearchResultList results={shown} query={data.query} errorMessage={data.errorMessage} />
					</div>
				</div>
			</main>
		{/if}
	</form>
</AppShell>
