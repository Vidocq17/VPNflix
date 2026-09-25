<!-- Card resultat (design Stitch) : poster 2:3 avec survol, titre, annee. Fallback visuel si
     pas d'image TMDB. -->
<script lang="ts">
	import { resolve } from '$app/paths';
	import Film from 'lucide-svelte/icons/film';
	import FavoriteButton from './FavoriteButton.svelte';
	import type { CatalogSearchResult } from '$lib/catalog/types';

	let { result }: { result: CatalogSearchResult } = $props();

	const TMDB_POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w342';
	let mediaTypeLabel = $derived(result.mediaType === 'movie' ? 'Film' : 'Serie');
</script>

<div class="relative">
	<a
		href={resolve('/title/[mediaType]/[id]', {
			mediaType: result.mediaType,
			id: String(result.id)
		})}
		class="group flex flex-col gap-3"
	>
		<div
			class="relative aspect-[2/3] overflow-hidden rounded-xl border border-white/10 bg-white/5 transition duration-300 group-hover:shadow-[0_0_30px_rgba(46,91,255,0.35)]"
		>
			{#if result.posterPath}
				<img
					src={`${TMDB_POSTER_BASE_URL}${result.posterPath}`}
					alt={result.title}
					loading="lazy"
					class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
				/>
			{:else}
				<div
					class="flex h-full w-full flex-col items-center justify-center gap-3 p-4 text-center text-on-surface-variant/50"
				>
					<Film class="size-8" />
					<span class="line-clamp-3 text-xs">{result.title}</span>
				</div>
			{/if}
			<span
				class="absolute right-3 top-3 rounded-md border border-white/10 bg-surface/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-on-surface backdrop-blur-md"
			>
				{mediaTypeLabel}
			</span>
		</div>
		<div>
			<h3 class="line-clamp-1 font-semibold text-on-surface">{result.title}</h3>
			{#if result.releaseYear}<p class="text-sm text-on-surface-variant/70">
					{result.releaseYear}
				</p>{/if}
		</div>
	</a>
	<FavoriteButton {result} class="absolute left-3 top-3" />
</div>
