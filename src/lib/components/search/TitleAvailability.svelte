<!-- Hero (poster/titre/metadata/resume) + disponibilites par provider/pays (etape 11).
     Pas d'action trailer (hors MVP). -->
<script lang="ts">
	import Film from 'lucide-svelte/icons/film';
	import Info from 'lucide-svelte/icons/info';
	import WatchProviderGroup from './WatchProviderGroup.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import type { CatalogSearchResult, ProviderAvailabilityGroup } from '$lib/catalog/types';

	let { title, groups }: { title: CatalogSearchResult; groups: ProviderAvailabilityGroup[] } =
		$props();

	const TMDB_POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w500';
	let mediaTypeLabel = $derived(title.mediaType === 'movie' ? 'Film' : 'Serie');
</script>

<section class="mx-auto max-w-[1440px] px-5 pb-16 pt-28 md:px-16">
	<div class="grid grid-cols-1 gap-10 md:grid-cols-[300px_1fr]">
		<div
			class="hidden aspect-[2/3] w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 md:block"
		>
			{#if title.posterPath}
				<img
					src={`${TMDB_POSTER_BASE_URL}${title.posterPath}`}
					alt={title.title}
					class="h-full w-full object-cover"
				/>
			{:else}
				<div class="flex h-full w-full items-center justify-center text-[#c4c5d9]/50">
					<Film class="size-10" />
				</div>
			{/if}
		</div>

		<div class="flex flex-col gap-4">
			<span
				class="w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#c4c5d9]"
			>
				{mediaTypeLabel}
			</span>
			<h1 class="text-3xl font-bold tracking-tight text-[#e5e2e1] md:text-4xl">{title.title}</h1>
			<p class="text-sm text-[#c4c5d9]/70">{title.releaseYear ?? 'Annee inconnue'}</p>
			{#if title.overview}
				<p class="max-w-2xl text-sm leading-relaxed text-[#c4c5d9]/80">{title.overview}</p>
			{/if}
		</div>
	</div>

	<div class="mt-16 flex flex-col gap-8">
		<h2 class="text-2xl font-bold text-[#e5e2e1]">Ou regarder ce titre legalement ?</h2>

		{#if groups.length === 0}
			<EmptyState title="Aucun provider trouve pour ce titre pour le moment." compact />
		{:else}
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{#each groups as group (group.provider.id)}
					<WatchProviderGroup {group} />
				{/each}
			</div>
		{/if}

		<p
			class="flex items-start gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-[#c4c5d9]/60"
		>
			<Info class="mt-0.5 size-4 shrink-0" />
			Ces informations proviennent de TMDB et peuvent etre incompletes ou obsoletes. Elles ne garantissent
			pas l'acces effectif au contenu : verifie toujours les conditions du service de streaming avant
			de t'abonner.
		</p>
	</div>
</section>
