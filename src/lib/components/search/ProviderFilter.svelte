<!-- Plateformes en chips (pas de logos hardcodes). -->
<script lang="ts">
	import type { WatchProvider } from '$lib/catalog/types';

	let { providers = [], selected = [] }: { providers?: WatchProvider[]; selected?: string[] } =
		$props();
</script>

<div class="space-y-2">
	<h3 class="text-xl font-bold text-on-surface">Plateformes</h3>
	{#if providers.length === 0}
		<p class="text-sm text-on-surface-variant/60">Aucune plateforme disponible.</p>
	{:else}
		<div class="flex max-h-64 flex-wrap gap-2 overflow-y-auto overflow-x-hidden pr-1">
			{#each providers as provider (provider.id)}
				<label
					class="cursor-pointer rounded-full border border-outline-variant px-4 py-2 text-sm font-medium text-on-surface-variant transition has-[:checked]:border-primary-container has-[:checked]:bg-primary-container/20 has-[:checked]:text-on-surface"
				>
					<input
						type="checkbox"
						name="providers"
						value={provider.id}
						checked={selected.includes(String(provider.id))}
						class="sr-only"
					/>
					{provider.name}
				</label>
			{/each}
		</div>
	{/if}
</div>
