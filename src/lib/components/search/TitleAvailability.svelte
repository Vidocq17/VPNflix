<!-- Hero (poster/titre/metadata/resume) + disponibilites par provider/pays (etape 11).
     Pas d'action trailer (hors MVP). -->
<script lang="ts">
	import Film from 'lucide-svelte/icons/film';
	import Info from 'lucide-svelte/icons/info';
	import FavoriteButton from '$lib/components/ui/FavoriteButton.svelte';
	import WatchProviderGroup from './WatchProviderGroup.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { excluded } from '$lib/persist.svelte';
	import type { CatalogSearchResult, ProviderAvailabilityGroup } from '$lib/catalog/types';

	let { title, groups }: { title: CatalogSearchResult; groups: ProviderAvailabilityGroup[] } =
		$props();

	// Plateformes exclues masquees ; toutes exclues -> meme message vide.
	let visible = $derived(groups.filter((g) => !excluded.has(g.provider.id)));
	const TMDB_POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w500';
	let mediaTypeLabel = $derived(title.mediaType === 'movie' ? 'Film' : 'Serie');
</script>

<section class="pb-16">
	<div class="relative overflow-hidden pt-28 pb-16">
		{#if title.posterPath}
			<img
				src={`${TMDB_POSTER_BASE_URL}${title.posterPath}`}
				alt=""
				aria-hidden="true"
				class="absolute inset-0 h-full w-full scale-110 object-cover opacity-30 blur-2xl"
			/>
		{/if}
		<div class="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent"></div>
		<div class="absolute inset-0 bg-gradient-to-r from-surface via-surface/40 to-transparent"></div>
		<div
			class="relative mx-auto grid max-w-[1440px] grid-cols-1 gap-10 px-5 md:grid-cols-[300px_1fr] md:px-16"
		>
			<div
				class="hidden aspect-[2/3] w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl md:block"
			>
				{#if title.posterPath}
					<img
						src={`${TMDB_POSTER_BASE_URL}${title.posterPath}`}
						alt={title.title}
						class="h-full w-full object-cover"
					/>
				{:else}
					<div class="flex h-full w-full items-center justify-center text-on-surface-variant/50">
						<Film class="size-10" />
					</div>
				{/if}
			</div>

			<div class="flex flex-col justify-end gap-4">
				<div class="flex items-center gap-3">
					<span
						class="rounded-md bg-primary-container px-2 py-1 text-xs font-bold uppercase tracking-wide"
					>
						{mediaTypeLabel}
					</span>
					<span class="text-sm text-on-surface-variant"
						>{title.releaseYear ?? 'Annee inconnue'}</span
					>
				</div>
				<h1 class="text-4xl font-extrabold tracking-tight md:text-5xl">{title.title}</h1>
				<FavoriteButton result={title} labelled class="self-start" />
				{#if title.overview}
					<p class="max-w-2xl text-lg leading-relaxed text-on-surface-variant">{title.overview}</p>
				{/if}
			</div>
		</div>
	</div>

	<div class="mx-auto mt-6 flex max-w-[1440px] flex-col gap-8 px-5 md:px-16">
		<div>
			<p class="text-xs font-bold uppercase tracking-widest text-primary">Disponibilites</p>
			<h2 class="text-3xl font-bold text-on-surface">Ou regarder ce titre legalement ?</h2>
		</div>

		{#if visible.length === 0}
			<EmptyState
				title={groups.length > 0
					? 'Toutes les plateformes de ce titre sont exclues.'
					: 'Aucun provider trouve pour ce titre pour le moment.'}
				compact
			/>
		{:else}
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{#each visible as group (group.provider.id)}
					<WatchProviderGroup {group} />
				{/each}
			</div>
		{/if}

		<p
			class="flex items-start gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-on-surface-variant/60"
		>
			<Info class="mt-0.5 size-4 shrink-0" />
			Ces informations proviennent de TMDB et peuvent etre incompletes ou obsoletes. Elles ne garantissent
			pas l'acces effectif au contenu : verifie toujours les conditions du service de streaming avant
			de t'abonner.
		</p>
	</div>
</section>
