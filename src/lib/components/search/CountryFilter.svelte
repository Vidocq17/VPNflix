<!-- Select simple de pays (pas de notion de pays favoris, retiree avec Supabase). -->
<script lang="ts">
	import type { WatchCountry } from '$lib/catalog/types';

	let { countries = [], value = '' }: { countries?: WatchCountry[]; value?: string } = $props();
</script>

<div class="space-y-2">
	<label for="country" class="block text-xl font-bold text-on-surface">Pays</label>
	<select
		id="country"
		name="country"
		class="w-full rounded-xl border border-white/10 bg-surface-container px-4 py-3 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container"
	>
		<option value="" selected={value === ''}>Tous les pays</option>
		{#each countries as country (country.code)}
			<option value={country.code} selected={value === country.code}>{country.name}</option>
		{/each}
	</select>
</div>
