<!-- Card resultat : poster 2:3, titre, annee, type, resume court. Fallback visuel si
     pas d'image TMDB (posterPath est deja null/non-null cote CatalogSearchResult, pas
     besoin de gerer les erreurs de chargement en plus). -->
<script lang="ts">
	import { resolve } from '$app/paths';
	import Film from 'lucide-svelte/icons/film';
	import type { CatalogSearchResult } from '$lib/catalog/types';

	let { result }: { result: CatalogSearchResult } = $props();

	const TMDB_POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w342';
	let mediaTypeLabel = $derived(result.mediaType === 'movie' ? 'Film' : 'Serie');
</script>

<a
	href={resolve('/title/[mediaType]/[id]', { mediaType: result.mediaType, id: String(result.id) })}
	class="flex flex-col gap-3 rounded-2xl transition hover:opacity-90"
>
	<div class="relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-white/5">
		{#if result.posterPath}
			<img
				src={`${TMDB_POSTER_BASE_URL}${result.posterPath}`}
				alt={result.title}
				loading="lazy"
				class="h-full w-full object-cover"
			/>
		{:else}
			<div
				class="flex h-full w-full flex-col items-center justify-center gap-3 p-4 text-center text-[#c4c5d9]/50"
			>
				<Film class="size-8" />
				<span class="line-clamp-3 text-xs">{result.title}</span>
			</div>
		{/if}
		<span
			class="absolute right-3 top-3 rounded-lg border border-white/10 bg-black/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#e5e2e1] backdrop-blur"
		>
			{mediaTypeLabel}
		</span>
	</div>
	<div>
		<h3 class="line-clamp-1 text-sm font-semibold text-[#e5e2e1]">{result.title}</h3>
		<p class="text-xs text-[#c4c5d9]/70">{result.releaseYear ?? 'Annee inconnue'}</p>
		{#if result.overview}
			<p class="mt-1 line-clamp-2 text-xs text-[#c4c5d9]/60">{result.overview}</p>
		{/if}
	</div>
</a>
