<!-- Ajoute/retire un titre des favoris (localStorage). type="button" : ne soumet pas le formulaire GET de l'accueil. -->
<script lang="ts">
	import Heart from 'lucide-svelte/icons/heart';
	import { favorites } from '$lib/persist.svelte';
	import type { CatalogSearchResult } from '$lib/catalog/types';

	let {
		result,
		labelled = false,
		class: className = ''
	}: { result: CatalogSearchResult; labelled?: boolean; class?: string } = $props();

	let active = $derived(favorites.has(result.mediaType, result.id));
	let label = $derived(active ? 'Retirer des favoris' : 'Ajouter aux favoris');
</script>

<button
	type="button"
	aria-pressed={active}
	aria-label={labelled ? undefined : `${label} : ${result.title}`}
	onclick={() => favorites.toggle(result)}
	class="flex items-center gap-2 rounded-full border border-white/10 bg-surface/80 p-2 text-on-surface backdrop-blur-md transition hover:border-primary-container {labelled
		? 'px-4 py-2 text-sm font-medium'
		: ''} {className}"
>
	<Heart class="size-4 {active ? 'fill-primary text-primary' : ''}" />
	{#if labelled}{label}{/if}
</button>
