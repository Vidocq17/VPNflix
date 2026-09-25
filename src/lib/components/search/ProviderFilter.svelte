<!-- Plateformes en chips (pas de logos hardcodes). -->
<script lang="ts">
	import type { WatchProvider } from '$lib/catalog/types';

	let { providers = [], selected = [] }: { providers?: WatchProvider[]; selected?: string[] } =
		$props();
</script>

<div class="space-y-2">
	<h3 class="text-sm font-semibold text-[#e5e2e1]">Plateformes</h3>
	{#if providers.length === 0}
		<p class="text-sm text-[#c4c5d9]/60">Aucune plateforme disponible.</p>
	{:else}
		<div class="flex flex-wrap gap-2">
			{#each providers as provider (provider.id)}
				<label
					class="cursor-pointer rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-[#c4c5d9] transition has-[:checked]:border-[#2e5bff] has-[:checked]:bg-[#2e5bff]/20 has-[:checked]:text-[#e5e2e1]"
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
