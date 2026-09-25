<!-- Champ de recherche par titre (design Stitch). Champ non controle (name="query") : la
     soumission du <form> parent (GET) recharge +page.ts. "hero" = grand champ avec bouton
     integre (accueil) ; "bar" = pilule pleine largeur (page de resultats, Entree pour valider). -->
<script lang="ts">
	import Search from 'lucide-svelte/icons/search';
	import Button from '$lib/components/ui/Button.svelte';

	let { value = '', variant = 'bar' }: { value?: string; variant?: 'hero' | 'bar' } = $props();
</script>

<div
	class="relative flex w-full items-center border border-white/10 bg-white/5 backdrop-blur-2xl focus-within:ring-2 focus-within:ring-primary/50 {variant ===
	'hero'
		? 'max-w-xl rounded-xl p-2 shadow-2xl'
		: 'rounded-full'}"
>
	<Search class="pointer-events-none ml-4 size-5 shrink-0 text-on-surface-variant" />
	<input
		type="search"
		name="query"
		{value}
		placeholder="Chercher un film ou une serie..."
		aria-label="Rechercher un titre"
		class="w-full bg-transparent px-4 text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none {variant ===
		'hero'
			? 'py-3'
			: 'py-5 text-xl'}"
	/>
	{#if variant === 'hero'}
		<Button type="submit" class="accent-gradient px-6 hover:brightness-110">Rechercher</Button>
	{/if}
</div>
