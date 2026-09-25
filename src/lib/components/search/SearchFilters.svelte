<!-- Regroupe les filtres de recherche. Sidebar sur desktop, bloc empile sur mobile :
     ce composant n'a pas de mise en page propre, c'est la grille du parent (+page.svelte)
     qui passe d'une colonne (mobile, filtres au-dessus des resultats) a une sidebar
     (desktop). -->
<script lang="ts">
	import MediaTypeFilter from './MediaTypeFilter.svelte';
	import CountryFilter from './CountryFilter.svelte';
	import ProviderFilter from './ProviderFilter.svelte';
	import type { WatchCountry, WatchProvider } from '$lib/catalog/types';

	let {
		type = 'all',
		country = '',
		countries = [],
		providers = [],
		selectedProviders = []
	}: {
		type?: 'all' | 'movie' | 'tv';
		country?: string;
		countries?: WatchCountry[];
		providers?: WatchProvider[];
		selectedProviders?: string[];
	} = $props();
</script>

<div class="flex flex-col gap-8">
	<div class="space-y-3">
		<h3 class="text-xl font-bold text-on-surface">Type</h3>
		<MediaTypeFilter value={type} />
	</div>
	<CountryFilter {countries} value={country} />
	<ProviderFilter {providers} selected={selectedProviders} />
</div>
