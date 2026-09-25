<!-- Ajoute/retire un titre d'une liste locale (favoris, "A voir", "Vus" ; localStorage).
     type="button" : ne soumet pas le formulaire GET de l'accueil. -->
<script lang="ts">
	import Bookmark from 'lucide-svelte/icons/bookmark';
	import Eye from 'lucide-svelte/icons/eye';
	import Heart from 'lucide-svelte/icons/heart';
	import { favorites, seen, watchlist } from '$lib/persist.svelte';
	import type { CatalogSearchResult } from '$lib/catalog/types';

	const KINDS = {
		favorite: {
			store: favorites,
			Icon: Heart,
			add: 'Ajouter aux favoris',
			remove: 'Retirer des favoris'
		},
		watchlist: {
			store: watchlist,
			Icon: Bookmark,
			add: 'Ajouter a "A voir"',
			remove: 'Retirer de "A voir"'
		},
		seen: { store: seen, Icon: Eye, add: 'Marquer comme vu', remove: 'Retirer des "Vus"' }
	};

	let {
		result,
		kind = 'favorite',
		labelled = false,
		class: className = ''
	}: {
		result: CatalogSearchResult;
		kind?: keyof typeof KINDS;
		labelled?: boolean;
		class?: string;
	} = $props();

	let k = $derived(KINDS[kind]);
	let active = $derived(k.store.has(result.mediaType, result.id));
	let label = $derived(active ? k.remove : k.add);
</script>

<button
	type="button"
	aria-pressed={active}
	aria-label={labelled ? undefined : `${label} : ${result.title}`}
	onclick={() => k.store.toggle(result)}
	class="flex items-center gap-2 rounded-full border border-white/10 bg-surface/80 p-2 text-on-surface backdrop-blur-md transition hover:border-primary-container {labelled
		? 'px-4 py-2 text-sm font-medium'
		: ''} {className}"
>
	<k.Icon class="size-4 {active ? 'fill-primary text-primary' : ''}" />
	{#if labelled}{label}{/if}
</button>
