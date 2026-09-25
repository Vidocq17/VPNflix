<!-- Un provider + la liste des pays ou il est disponible (etape 11). -->
<script lang="ts">
	import Tv from 'lucide-svelte/icons/tv';
	import GlassPanel from '$lib/components/ui/GlassPanel.svelte';
	import type { ProviderAvailabilityGroup } from '$lib/catalog/types';

	let { group }: { group: ProviderAvailabilityGroup } = $props();

	const TMDB_LOGO_BASE_URL = 'https://image.tmdb.org/t/p/w92';
</script>

<GlassPanel class="flex flex-col gap-4 p-5">
	<div class="flex items-center gap-3">
		<div
			class="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/10"
		>
			{#if group.provider.logoPath}
				<img
					src={`${TMDB_LOGO_BASE_URL}${group.provider.logoPath}`}
					alt={group.provider.name}
					loading="lazy"
					class="h-full w-full object-cover"
				/>
			{:else}
				<Tv class="size-5 text-on-surface-variant/60" />
			{/if}
		</div>
		<h3 class="text-sm font-semibold text-on-surface">{group.provider.name}</h3>
	</div>
	<div class="flex flex-wrap gap-2">
		{#each group.countries as country (country.code)}
			<span
				class="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-on-surface-variant/80"
			>
				{country.name}
			</span>
		{/each}
	</div>
</GlassPanel>
