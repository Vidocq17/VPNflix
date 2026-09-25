<!-- Grille de PosterCard + etats vide/erreur. -->
<script lang="ts">
	import PosterCard from '$lib/components/ui/PosterCard.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import ErrorMessage from '$lib/components/ui/ErrorMessage.svelte';
	import type { CatalogSearchResult } from '$lib/catalog/types';

	let {
		results = [],
		query = '',
		errorMessage = null
	}: {
		results?: CatalogSearchResult[];
		query?: string;
		errorMessage?: string | null;
	} = $props();
</script>

{#if errorMessage}
	<ErrorMessage message={errorMessage} />
{:else if !query}
	<EmptyState
		title="Cherche un titre pour commencer"
		description="Tape le nom d'un film ou d'une serie dans le champ ci-dessus."
	/>
{:else if results.length === 0}
	<EmptyState
		title={`Aucun resultat pour « ${query} »`}
		description="Essaie un autre titre ou verifie l'orthographe."
	/>
{:else}
	<div class="grid grid-cols-2 gap-6 lg:grid-cols-3 xl:grid-cols-4">
		{#each results as result (`${result.mediaType}-${result.id}`)}
			<PosterCard {result} />
		{/each}
	</div>
{/if}
